import type { SupabaseClient, User } from "@supabase/supabase-js";

export type OnboardingSelection = { languageId: string; languageCode: string };
export const POST_AUTH_ROUTE = "/onboarding/continue";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readOnboardingSelection(userId?: string): OnboardingSelection | null {
  if (localStorage.getItem("acelingua_onboarding_started") !== "true"
    || (localStorage.getItem("acelingua_intro_completed") !== "true"
      && (!userId || localStorage.getItem("acelingua_onboarding_user_id") !== userId))) return null;
  const languageId = localStorage.getItem("acelingua_selected_language_id");
  const languageCode = localStorage.getItem("acelingua_selected_language");
  if (!languageId || !languageCode) throw new Error("Your language selection is missing. Please return to language selection.");
  if (!UUID.test(languageId)) throw new Error("Your saved language selection is invalid. Please choose your language again.");
  return { languageId, languageCode };
}

export function registrationOnboardingMetadata() {
  const selection = readOnboardingSelection();
  return selection ? { ...selection, introCompleted: true } : null;
}

function metadataSelection(user: User): OnboardingSelection | null {
  const value = user.user_metadata.acelingua_onboarding;
  if (!value || value.completed === true || value.introCompleted !== true) return null;
  if (typeof value.languageId !== "string" || !UUID.test(value.languageId)
    || typeof value.languageCode !== "string" || !value.languageCode) {
    throw new Error("Your saved onboarding selection is invalid. Please choose your language again.");
  }
  return { languageId: value.languageId, languageCode: value.languageCode };
}

export function selectStartingCourse<T extends { level: string | null }>(courses: T[]): T {
  if (!courses.length) throw new Error("This language has no published course yet. Please choose another language.");
  const selected = courses.find((course) => course.level?.trim().toLowerCase() === "beginner")
    ?? (courses.length === 1 ? courses[0] : undefined);
  if (!selected) throw new Error("We couldn't identify a starting course for this language. Please choose another language or try again later.");
  return selected;
}

function databaseError(operation: string, error: { message: string; code?: string }) {
  if (error.code === "42P10") {
    return new Error(`${operation}: the existing table needs a unique constraint on user_id and course_id for safe enrollment. No schema changes were made.`);
  }
  return new Error(`${operation}: ${error.message}`);
}

// All writes use the authenticated user's ID and the existing RLS-protected client.
export async function continueAuthenticatedOnboarding(supabase: SupabaseClient, user: User): Promise<string> {
  const storedMetadata = metadataSelection(user);
  const owner = localStorage.getItem("acelingua_onboarding_user_id");
  const completedFor = localStorage.getItem("acelingua_onboarding_completed_user_id");
  const localSelection = (owner && owner !== user.id) || completedFor === user.id ? null : readOnboardingSelection(user.id);
  const selection = storedMetadata ?? localSelection;

  const avatarResult = await supabase.from("user_avatar_equipped").select("user_id")
    .eq("user_id", user.id).limit(1).maybeSingle();
  if (avatarResult.error) throw databaseError("Checking your avatar", avatarResult.error);
  const enrollmentResult = await supabase.from("user_courses").select("course_id")
    .eq("user_id", user.id).limit(1).maybeSingle();
  if (enrollmentResult.error) throw databaseError("Checking your enrollment", enrollmentResult.error);

  // A new Google account confirms its language after sign-in, even if this
  // browser contains an earlier guest preview selection.
  if (!enrollmentResult.data && user.app_metadata?.provider === "google" && owner !== user.id) {
    return "/onboarding/languages";
  }

  if (!selection) {
    if (!enrollmentResult.data) return "/onboarding/languages";
    return avatarResult.data ? "/dashboard" : "/avatar/setup";
  }

  // Unbound browser leftovers cannot enroll an established account into another course.
  if (!storedMetadata && (avatarResult.data || (owner !== user.id && enrollmentResult.data))) {
    return avatarResult.data ? "/dashboard" : "/avatar/setup";
  }

  const languageResult = await supabase.from("languages").select("id, code")
    .eq("id", selection.languageId).eq("is_active", true).maybeSingle();
  if (languageResult.error) throw databaseError("Checking your language", languageResult.error);
  if (!languageResult.data || languageResult.data.code !== selection.languageCode) {
    throw new Error("Your selected language is no longer available. Please choose your language again.");
  }
  const courseResult = await supabase.from("courses").select("id, title, level")
    .eq("language_id", languageResult.data.id).eq("is_published", true).order("created_at").order("id");
  if (courseResult.error) throw databaseError("Loading your course", courseResult.error);
  const course = selectStartingCourse<{ id: string; title: string; level: string | null }>(courseResult.data ?? []);
  const lessonResult = await supabase.from("lessons")
    .select("id, units!inner(course_id, is_published)", { count: "exact", head: true })
    .eq("is_published", true).eq("units.course_id", course.id).eq("units.is_published", true);
  if (lessonResult.error) throw databaseError("Counting your lessons", lessonResult.error);
  if (lessonResult.count === null) throw new Error("We couldn't determine your course's lesson count. Please retry.");

  // Bind retries to this account before writing; keep the original selection intact.
  localStorage.setItem("acelingua_onboarding_user_id", user.id);
  const existingEnrollment = await supabase.from("user_courses").select("id")
    .eq("user_id", user.id).eq("course_id", course.id).maybeSingle();
  if (existingEnrollment.error) throw databaseError("Checking course enrollment", existingEnrollment.error);
  if (!existingEnrollment.data) {
    const result = await supabase.from("user_courses").upsert(
      { user_id: user.id, course_id: course.id, status: "active" },
      { onConflict: "user_id,course_id", ignoreDuplicates: true },
    );
    if (result.error) throw databaseError("Enrolling in your course", result.error);
  }
  const existingProgress = await supabase.from("course_progress").select("id")
    .eq("user_id", user.id).eq("course_id", course.id).maybeSingle();
  if (existingProgress.error) throw databaseError("Checking course progress", existingProgress.error);
  if (!existingProgress.data) {
    const result = await supabase.from("course_progress").upsert(
      { user_id: user.id, course_id: course.id, completed_lessons: 0, total_lessons: lessonResult.count, progress_percentage: 0 },
      { onConflict: "user_id,course_id", ignoreDuplicates: true },
    );
    if (result.error) throw databaseError("Preparing course progress", result.error);
  }
  localStorage.setItem("acelingua_onboarding_course_id", course.id);
  return avatarResult.data ? "/dashboard" : "/avatar/setup";
}
