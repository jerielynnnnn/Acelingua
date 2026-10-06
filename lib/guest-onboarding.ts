import type { SupabaseClient, User } from "@supabase/supabase-js";

const STORAGE_KEY = "acelingua:first-lesson";
export type GuestLesson = { courseId: string; lessonId: string };

export function readGuestLesson(): GuestLesson | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return value && typeof value.courseId === "string" && typeof value.lessonId === "string"
      ? { courseId: value.courseId, lessonId: value.lessonId }
      : null;
  } catch {
    return null;
  }
}

export function rememberGuestLesson(lesson: GuestLesson) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lesson));
}

// Guest completion carries no XP or currency rewards. Verify published content
// again before saving it to the authenticated learner's records.
const saves = new Map<string, Promise<void>>();

export async function saveGuestLesson(supabase: SupabaseClient, user: User) {
  const existing = saves.get(user.id);
  if (existing) return existing;
  const saving = persistGuestLesson(supabase, user);
  saves.set(user.id, saving);
  try { await saving; } finally { saves.delete(user.id); }
}

async function persistGuestLesson(supabase: SupabaseClient, user: User) {
  const pending = readGuestLesson() ?? user.user_metadata.guest_lesson;
  if (!pending || typeof pending.courseId !== "string" || typeof pending.lessonId !== "string") return;

  await recordLessonCompletion(supabase, user, pending);
  if (user.user_metadata.guest_lesson) {
    const { error } = await supabase.auth.updateUser({ data: { guest_lesson: null } });
    if (error) throw error;
  }
  localStorage.removeItem(STORAGE_KEY);
}

export async function recordLessonCompletion(supabase: SupabaseClient, user: User, pending: GuestLesson) {

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, units!inner(course_id, is_published, courses!inner(is_published, languages!inner(is_active)))")
    .eq("id", pending.lessonId)
    .eq("is_published", true)
    .eq("units.course_id", pending.courseId)
    .eq("units.is_published", true)
    .eq("units.courses.is_published", true)
    .eq("units.courses.languages.is_active", true)
    .maybeSingle();
  if (lessonError) throw lessonError;
  if (!lesson) throw new Error("Your introductory lesson is no longer available. Please choose another language.");

  const { data: enrollment, error: enrollmentError } = await supabase.from("user_courses")
    .select("id").eq("user_id", user.id).eq("course_id", pending.courseId).limit(1).maybeSingle();
  if (enrollmentError) throw enrollmentError;
  if (!enrollment) {
    const { error } = await supabase.from("user_courses").insert({ user_id: user.id, course_id: pending.courseId, status: "active" });
    if (error) throw error;
  }

  const { data: progress, error: progressError } = await supabase.from("lesson_progress")
    .select("id, status").eq("user_id", user.id).eq("lesson_id", pending.lessonId).limit(1).maybeSingle();
  if (progressError) throw progressError;
  if (progress?.status !== "completed") {
    const values = { status: "completed", completed_at: new Date().toISOString(), last_accessed_at: new Date().toISOString() };
    const result = progress
      ? await supabase.from("lesson_progress").update(values).eq("id", progress.id).eq("user_id", user.id)
      : await supabase.from("lesson_progress").insert({ ...values, user_id: user.id, lesson_id: pending.lessonId, attempts: 1 });
    if (result.error) throw result.error;
  }
  const { data: lessons, error: lessonsError } = await supabase.from("lessons")
    .select("id, units!inner(course_id, is_published)").eq("units.course_id", pending.courseId)
    .eq("units.is_published", true).eq("is_published", true);
  if (lessonsError) throw lessonsError;
  const lessonIds = (lessons ?? []).map((item) => item.id);
  const { data: completed, error: completedError } = await supabase.from("lesson_progress")
    .select("lesson_id").eq("user_id", user.id).eq("status", "completed").in("lesson_id", lessonIds);
  if (completedError) throw completedError;
  const completedCount = new Set((completed ?? []).map((item) => item.lesson_id)).size;
  const { data: courseProgress, error: courseProgressError } = await supabase.from("course_progress")
    .select("id").eq("user_id", user.id).eq("course_id", pending.courseId).limit(1).maybeSingle();
  if (courseProgressError) throw courseProgressError;
  const courseValues = { completed_lessons: completedCount, total_lessons: lessonIds.length,
    progress_percentage: lessonIds.length ? completedCount / lessonIds.length * 100 : 0,
    last_accessed_at: new Date().toISOString() };
  const courseSave = courseProgress
    ? await supabase.from("course_progress").update(courseValues).eq("id", courseProgress.id).eq("user_id", user.id)
    : await supabase.from("course_progress").insert({ ...courseValues, user_id: user.id, course_id: pending.courseId });
  if (courseSave.error) throw courseSave.error;

}
