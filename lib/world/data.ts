import type { SupabaseClient } from "@supabase/supabase-js";
import { avatarLayers, avatarCategories, loadLearnerAvatar, type AvatarSelection } from "@/lib/avatar";

export type WorldLanguage = { id: string; code: string; name: string; native_name: string | null; flag_emoji: string | null };
export type WorldCourse = { id: string; language_id: string; title: string; level: string; status: string;
  progress: { completed_lessons: number; total_lessons: number; progress_percentage: number } | null };

/** Read-only travel data: visiting a country never enrolls or changes a course. */
export async function loadWorldData(supabase: SupabaseClient, userId: string) {
  const [languages, enrollments, avatar] = await Promise.all([
    supabase.from("languages").select("id, code, name, native_name, flag_emoji").eq("is_active", true).order("name").order("id"),
    supabase.from("user_courses").select("course_id, status").eq("user_id", userId).eq("status", "active"),
    loadLearnerAvatar(supabase, userId),
  ]);
  if (languages.error) throw languages.error;
  if (enrollments.error) throw enrollments.error;
  const ids = [...new Set<string>((enrollments.data ?? []).map(row => row.course_id))];
  const courses: WorldCourse[] = [];
  // Batched requests avoid truncating a large IN filter.
  for (let start = 0; start < ids.length; start += 100) {
    const batch = ids.slice(start, start + 100);
    const [catalog, progress] = await Promise.all([
      supabase.from("courses").select("id, language_id, title, level").eq("is_published", true).in("id", batch).order("title").order("id"),
      supabase.from("course_progress").select("course_id, completed_lessons, total_lessons, progress_percentage").eq("user_id", userId).in("course_id", batch),
    ]);
    if (catalog.error) throw catalog.error;
    if (progress.error) throw progress.error;
    for (const course of catalog.data ?? []) {
      const row = progress.data?.find(p => p.course_id === course.id);
      courses.push({ ...course, status: enrollments.data?.find(e => e.course_id === course.id)?.status ?? "active",
        progress: row ? { completed_lessons: row.completed_lessons, total_lessons: row.total_lessons, progress_percentage: Number(row.progress_percentage) } : null });
    }
  }
  const selection: AvatarSelection = { base: null, face: null, hair: null, clothes: null };
  if (avatar.equipped) for (const category of avatarCategories) selection[category] = avatar.equipped[`${category}_id`];
  return { languages: (languages.data ?? []) as WorldLanguage[], courses,
    avatar: avatarLayers(avatar.items, selection), hasAvatar: Boolean(avatar.equipped) };
}
