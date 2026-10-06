import type { SupabaseClient } from "@supabase/supabase-js";

export type PublishedCourse = {
  id: string;
  language_id: string;
  title: string;
  description: string | null;
  level: string;
};

export type CourseLesson = { id: string; title: string; lesson_order: number; is_published: boolean };
export type CourseUnit = { id: string; title: string; unit_order: number; lessons: CourseLesson[] };

// Keep the default course identical for guests, signed-in learners, and the
// guest_first_lesson_ids database policy: oldest published course, then id.
export async function getPublishedCourse(
  supabase: SupabaseClient,
  selection: { languageId?: string | null; courseId?: string | null },
): Promise<PublishedCourse> {
  if (!selection.languageId && !selection.courseId) throw new Error("Choose a language to begin learning.");
  let query = supabase.from("courses").select("id, language_id, title, description, level").eq("is_published", true);
  if (selection.languageId) query = query.eq("language_id", selection.languageId);
  if (selection.courseId) query = query.eq("id", selection.courseId);
  const { data, error } = await query.order("created_at").order("id").limit(1).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("This language does not have a published course yet. Please choose another language.");
  return data;
}

export async function getCourseUnits(supabase: SupabaseClient, courseId: string): Promise<CourseUnit[]> {
  const { data, error } = await supabase.from("units")
    .select("id, title, unit_order, lessons(id, title, lesson_order, is_published)")
    .eq("course_id", courseId).eq("is_published", true).order("unit_order").order("id");
  if (error) throw error;
  return (data ?? []).map((unit) => ({ ...unit, lessons: unit.lessons
    .filter((lesson) => lesson.is_published)
    .sort((a, b) => a.lesson_order - b.lesson_order || a.id.localeCompare(b.id)) }));
}

export function getOrderedLessons(units: CourseUnit[]): CourseLesson[] {
  return [...units].sort((a, b) => a.unit_order - b.unit_order || a.id.localeCompare(b.id))
    .flatMap((unit) => [...unit.lessons].filter((lesson) => lesson.is_published)
      .sort((a, b) => a.lesson_order - b.lesson_order || a.id.localeCompare(b.id)));
}
