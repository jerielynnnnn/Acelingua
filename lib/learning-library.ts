import type { SupabaseClient } from "@supabase/supabase-js";
import { loadRoadmap } from "@/lib/roadmap";

export async function loadLearningLibrary(supabase: SupabaseClient, userId: string) {
  const enrollments = await supabase.from("user_courses").select("course_id").eq("user_id", userId).eq("status", "active");
  if (enrollments.error) throw enrollments.error;
  const ids = [...new Set<string>((enrollments.data ?? []).map(row => row.course_id))];
  if (!ids.length) return [];
  const [languages, access] = await Promise.all([
    supabase.from("languages").select("id, flag_emoji, code").eq("is_active", true),
    supabase.from("course_progress").select("course_id, last_accessed_at").eq("user_id", userId).in("course_id", ids),
  ]);
  if (languages.error) throw languages.error;
  if (access.error) throw access.error;
  const courses = await Promise.all(ids.map(async id => {
    try {
      const roadmap = await loadRoadmap(supabase, userId, id);
      const currentUnit = roadmap.units.find(unit => unit.lessons.some(lesson => roadmap.states.get(lesson.id) === "current"));
      return { id, title: roadmap.course.title, level: roadmap.course.level, language: roadmap.language,
        flag: languages.data?.find(language => language.id === roadmap.language.id)?.flag_emoji ?? "🌐",
        completed: roadmap.completed, total: roadmap.total, percentage: roadmap.percentage,
        currentUnit: currentUnit?.title ?? null,
        lastAccessed: access.data?.find(row => row.course_id === id)?.last_accessed_at ?? null,
        error: null as string | null };
    } catch (cause) {
      return { id, title: "Saved course", level: null, language: null, flag: "🌐", completed: null, total: null,
        percentage: null, currentUnit: null, lastAccessed: null, error: cause instanceof Error ? cause.message : "This course is currently unavailable." };
    }
  }));
  return courses.sort((a, b) => (Date.parse(b.lastAccessed ?? "") || 0) - (Date.parse(a.lastAccessed ?? "") || 0) || a.title.localeCompare(b.title));
}
