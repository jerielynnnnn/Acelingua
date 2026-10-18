import type { WritingLesson } from "./course-curriculum";

export type WorkbookProgress = { lesson_slug: string; completed_activities: string[]; completed: boolean; updated_at: string };

export function advanceWorkbookProgress(lesson: WritingLesson, previous: WorkbookProgress | undefined, activitySlug: string, correct: boolean, updatedAt: string): WorkbookProgress {
  const available = new Set(lesson.exercises.map(exercise => exercise.slug));
  if (!available.has(activitySlug)) throw new Error("Unknown workbook activity.");
  const prior = previous?.lesson_slug === lesson.slug ? previous.completed_activities.filter(slug => available.has(slug)) : [];
  const completed = [...new Set([...prior, ...(correct ? [activitySlug] : [])])];
  return { lesson_slug: lesson.slug, completed_activities: completed,
    completed: lesson.exercises.length > 0 && lesson.exercises.every(exercise => completed.includes(exercise.slug)), updated_at: updatedAt };
}
