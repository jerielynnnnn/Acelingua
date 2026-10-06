import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublishedCourse } from "@/lib/learning";

export type RoadmapLesson = { id: string; unit_id: string; title: string; description: string | null; lesson_order: number; xp_reward: number; coin_reward: number };
export type RoadmapUnit = { id: string; course_id: string; title: string; description: string | null; unit_order: number; location_name: string | null; map_x: number | null; map_y: number | null; lessons: RoadmapLesson[] };
export type LessonProgress = { lesson_id: string; status: string };
export type LessonState = "completed" | "current" | "locked";

// Require every earlier lesson, including earlier units, rather than just the
// immediate predecessor. Historical completions remain available for review.
export function roadmapStates(units: RoadmapUnit[], progress: LessonProgress[]) {
  const completed = new Set(progress.filter((row) => row.status === "completed").map((row) => row.lesson_id));
  const states = new Map<string, LessonState>();
  let prerequisitesComplete = true;
  for (const unit of [...units].sort((a, b) => a.unit_order - b.unit_order || a.id.localeCompare(b.id))) {
    for (const lesson of [...unit.lessons].sort((a, b) => a.lesson_order - b.lesson_order || a.id.localeCompare(b.id))) {
      states.set(lesson.id, completed.has(lesson.id) ? "completed" : prerequisitesComplete ? "current" : "locked");
      if (!completed.has(lesson.id)) prerequisitesComplete = false;
    }
  }
  return states;
}

export async function loadRoadmap(supabase: SupabaseClient, userId: string, courseId: string) {
  const enrollment = await supabase.from("user_courses").select("course_id").eq("user_id", userId).eq("status", "active").eq("course_id", courseId).maybeSingle();
  if (enrollment.error) throw enrollment.error;
  if (!enrollment.data) throw new Error("This course is not an active enrollment. Choose one of your active courses.");
  const course = await getPublishedCourse(supabase, { courseId });
  const [language, unitResult, aggregate] = await Promise.all([
    supabase.from("languages").select("id, name, native_name, code").eq("id", course.language_id).single(),
    supabase.from("units").select("id, course_id, title, description, unit_order, location_name, map_x, map_y").eq("course_id", courseId).eq("is_published", true).order("unit_order").order("id"),
    supabase.from("course_progress").select("completed_lessons, total_lessons, progress_percentage").eq("user_id", userId).eq("course_id", courseId).maybeSingle(),
  ]);
  if (language.error) throw language.error;
  if (unitResult.error) throw unitResult.error;
  if (aggregate.error) throw aggregate.error;
  const units: RoadmapUnit[] = (unitResult.data ?? []).map((unit) => ({ ...unit, lessons: [] }));
  const lessons: RoadmapLesson[] = [];
  for (let start = 0; start < units.length; start += 100) {
    const result = await supabase.from("lessons").select("id, unit_id, title, description, lesson_order, xp_reward, coin_reward").in("unit_id", units.slice(start, start + 100).map((unit) => unit.id)).eq("is_published", true).order("lesson_order").order("id");
    if (result.error) throw result.error;
    lessons.push(...(result.data ?? []));
  }
  for (const unit of units) unit.lessons = lessons.filter((lesson) => lesson.unit_id === unit.id).sort((a, b) => a.lesson_order - b.lesson_order || a.id.localeCompare(b.id));
  const progress: LessonProgress[] = [];
  for (let start = 0; start < lessons.length; start += 100) {
    const result = await supabase.from("lesson_progress").select("lesson_id, status").eq("user_id", userId).in("lesson_id", lessons.slice(start, start + 100).map((lesson) => lesson.id));
    if (result.error) throw result.error;
    progress.push(...(result.data ?? []));
  }
  const states = roadmapStates(units, progress);
  const completed = lessons.filter((lesson) => states.get(lesson.id) === "completed").length;
  return { course, language: language.data, units, progress, states, aggregate: aggregate.data,
    completed, total: lessons.length, percentage: lessons.length ? Math.round(completed / lessons.length * 100) : 0 };
}
