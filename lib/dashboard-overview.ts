import type { SupabaseClient } from "@supabase/supabase-js";
import { loadLearnerAvatar } from "@/lib/avatar";

export type LearnerProfile = { username: string | null; display_name: string | null; level: number; xp: number;
  coins: number; gems: number; hearts: number; streak: number };
export type LearnerGoal = { target_activities: number; completed_activities: number; is_completed: boolean };
export type DashboardCourse = { id: string; title: string; level: string; language_id: string };
export type DashboardLanguage = { id: string; name: string; native_name: string | null; code: string; flag_emoji: string | null };
export type AchievementPreview = { id: string; name: string; description: string | null; unlocked: boolean; unlockedAt: string | null };
function textField(row: Record<string, unknown>, fields: string[]) {
  for (const field of fields) if (typeof row[field] === "string" && row[field]) return row[field] as string;
  return null;
}
export function achievementPreviews(catalog: Record<string, unknown>[], ownership: Record<string, unknown>[]): AchievementPreview[] {
  return catalog.flatMap(row => {
    if (typeof row.id !== "string") return [];
    const owned = ownership.find(item => item.achievement_id === row.id);
    return [{ id: row.id, name: textField(row, ["name", "title"]) ?? "Achievement", description: textField(row, ["description"]),
      unlocked: Boolean(owned), unlockedAt: owned ? textField(owned, ["earned_at", "unlocked_at", "created_at"]) : null }];
  }).sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || (Date.parse(b.unlockedAt ?? "") || 0) - (Date.parse(a.unlockedAt ?? "") || 0));
}
export async function loadDashboardOverview(supabase: SupabaseClient, userId: string) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const [profile, enrollments, goals, avatar, catalog, unlocked] = await Promise.all([
    supabase.from("profiles").select("username, display_name, level, xp, coins, gems, hearts, streak").eq("id", userId).maybeSingle(),
    supabase.from("user_courses").select("course_id").eq("user_id", userId).eq("status", "active").order("enrolled_at", { ascending: false }),
    supabase.from("daily_goals").select("target_activities, completed_activities, is_completed").eq("user_id", userId).eq("goal_date", today).maybeSingle(),
    loadLearnerAvatar(supabase, userId),
    supabase.from("achievements").select("*"),
    supabase.from("user_achievements").select("*").eq("user_id", userId),
  ]);
  if (profile.error) throw new Error(profile.error.message);
  if (!profile.data) throw new Error("Your learner profile could not be loaded. Please sign in again.");
  if (enrollments.error) throw new Error(enrollments.error.message);
  const ids = [...new Set<string>((enrollments.data ?? []).map(row => row.course_id))];
  const courseResult = ids.length ? await supabase.from("courses").select("id, title, level, language_id").in("id", ids).eq("is_published", true) : { data: [], error: null };
  if (courseResult.error) throw new Error(courseResult.error.message);
  const courses: DashboardCourse[] = courseResult.data ?? [];
  const languageIds = [...new Set(courses.map(course => course.language_id))];
  const [languageResult, recent] = await Promise.all([
    languageIds.length ? supabase.from("languages").select("id, name, native_name, code, flag_emoji").in("id", languageIds).eq("is_active", true) : Promise.resolve({ data: [], error: null }),
    ids.length ? supabase.from("course_progress").select("course_id").eq("user_id", userId).in("course_id", ids)
      .order("last_accessed_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (languageResult.error) throw new Error(languageResult.error.message);
  const languages: DashboardLanguage[] = languageResult.data ?? [];
  const activeCourses = courses.filter(course => languages.some(language => language.id === course.language_id));
  return { profile: profile.data as LearnerProfile, courses: activeCourses, languages, avatar,
    goal: goals.error ? null : goals.data as LearnerGoal | null,
    goalUnavailable: Boolean(goals.error),
    achievements: catalog.error || unlocked.error ? null : achievementPreviews(catalog.data ?? [], unlocked.data ?? []),
    achievementCount: unlocked.error ? null : (unlocked.data ?? []).length,
    currentCourseId: activeCourses.find(course => course.id === recent.data?.course_id)?.id ?? activeCourses[0]?.id ?? null,
    warnings: [goals.error?.message, catalog.error?.message, unlocked.error?.message, recent.error?.message].filter(Boolean) as string[],
  };
}
