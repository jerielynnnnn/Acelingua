import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { StudioData } from "./client";
import { writingCourse, type WritingLesson } from "./course-curriculum";
import { koreanWritingCourse } from "./korean-curriculum";
import { advanceWorkbookProgress, type WorkbookProgress } from "./workbook-progress";
export type { WorkbookProgress } from "./workbook-progress";

export type Workbook = { languageCode?: string; lessons: WritingLesson[]; progress: WorkbookProgress[]; local: boolean; userId: string | null; lessonIds: Record<string, string>; activityIds: Record<string, string> };
const storageKey = (userId: string | null, language = "ja") => `acelingua:writing-workbook:v1:${userId ?? "guest"}:${language}`;
function readProgress(userId: string | null, language = "ja"): WorkbookProgress[] {
  try {
    const rows: unknown = JSON.parse(localStorage.getItem(storageKey(userId, language)) ?? "[]");
    if (!Array.isArray(rows)) return [];
    return rows.filter((row): row is WorkbookProgress => row && typeof row.lesson_slug === "string"
      && typeof row.completed === "boolean" && typeof row.updated_at === "string" && Array.isArray(row.completed_activities)
      && row.completed_activities.every((id: unknown) => typeof id === "string"));
  } catch { return []; }
}
export async function loadWorkbook(data: StudioData): Promise<Workbook> {
  const client = createClient();
  const result = await client.from("writing_studio_lessons").select("id,slug,title,stage,description,blocks")
    .eq("language_id", data.language.id).eq("is_published", true).order("display_order");
  if (result.error) {
    if (["42P01", "PGRST205"].includes(result.error.code)) return { languageCode: data.language.code, lessons: data.language.code === "ja" ? writingCourse : data.language.code === "ko" ? koreanWritingCourse : [], progress: readProgress(data.userId, data.language.code), userId: data.userId, local: true, lessonIds: {}, activityIds: {} };
    throw result.error;
  }
  const rows = result.data ?? [];
  const activities = rows.length ? await client.from("writing_studio_activities").select("id,lesson_id,slug,definition")
    .in("lesson_id", rows.map(row => row.id)).eq("is_published", true).order("display_order") : { data: [], error: null };
  if (activities.error) throw activities.error;
  const activityRows = activities.data ?? [];
  const lessons = rows.map(row => ({ slug: row.slug, title: row.title, stage: row.stage, description: row.description,
    blocks: row.blocks, exercises: activityRows.filter(activity => activity.lesson_id === row.id).map(activity => ({ ...activity.definition, slug: activity.slug })) })) as WritingLesson[];
  const lessonIds = Object.fromEntries(rows.map(row => [row.slug, row.id]));
  const activityIds = Object.fromEntries(activityRows.map(activity => [`${rows.find(row => row.id === activity.lesson_id)?.slug}/${activity.slug}`, activity.id]));
  let progress = readProgress(data.userId, data.language.code);
  if (data.userId && rows.length) {
    const saved = await client.from("user_writing_lesson_progress").select("lesson_id,completed_activity_ids,completed_at,updated_at")
      .eq("user_id", data.userId).in("lesson_id", rows.map(row => row.id));
    if (saved.error) throw saved.error;
    progress = (saved.data ?? []).map(row => ({ lesson_slug: rows.find(lesson => lesson.id === row.lesson_id)!.slug,
      completed_activities: activityRows.filter(activity => row.completed_activity_ids.includes(activity.id)).map(activity => activity.slug), completed: Boolean(row.completed_at), updated_at: row.updated_at }));
  }
  return { languageCode: data.language.code, lessons, progress, local: !data.userId, userId: data.userId, lessonIds, activityIds };
}

export async function recordWorkbookActivity(workbook: Workbook, lessonSlug: string, activitySlug: string, response: string, correct: boolean, mode: string) {
  const lesson = workbook.lessons.find(row => row.slug === lessonSlug);
  if (!lesson?.exercises.some(activity => activity.slug === activitySlug)) throw new Error("This activity is unavailable.");
  const client = createClient();
  const auth = await client.auth.getUser();
  if (auth.error && !isAuthSessionMissingError(auth.error)) throw auth.error;
  if ((auth.data.user?.id ?? null) !== workbook.userId) throw new Error("Your account changed. Reload this workbook before saving.");
  if (!workbook.local) {
    const result = await client.rpc("record_writing_workbook_attempt", {
      p_activity_id: workbook.activityIds[`${lessonSlug}/${activitySlug}`], p_response: response.slice(0, 1000), p_correct: correct, p_mode: mode,
    });
    if (result.error) throw result.error;
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!row) throw new Error("We couldn't confirm this activity's saved progress. Retry the activity.");
    return { lesson_slug: lessonSlug, completed_activities: lesson.exercises.filter(exercise => row.completed_activity_ids.includes(workbook.activityIds[`${lessonSlug}/${exercise.slug}`])).map(exercise => exercise.slug), completed: Boolean(row.completed_at), updated_at: row.updated_at } as WorkbookProgress;
  }
  const progress = readProgress(workbook.userId, workbook.languageCode);
  const previous = progress.find(row => row.lesson_slug === lessonSlug);
  const row = advanceWorkbookProgress(lesson, previous, activitySlug, correct, new Date().toISOString());
  localStorage.setItem(storageKey(workbook.userId, workbook.languageCode), JSON.stringify([...progress.filter(item => item.lesson_slug !== lessonSlug), row]));
  const attemptKey = `${storageKey(workbook.userId, workbook.languageCode)}:attempts`;
  let attempts: unknown[] = [];
  try { const stored = JSON.parse(localStorage.getItem(attemptKey) ?? "[]"); if (Array.isArray(stored)) attempts = stored; } catch { /* A corrupt attempt log does not discard lesson progress. */ }
  localStorage.setItem(attemptKey, JSON.stringify([...attempts.slice(-99), { lesson: lessonSlug, activity: activitySlug, response: response.slice(0, 1000), correct, mode, at: row.updated_at }]));
  return row;
}
