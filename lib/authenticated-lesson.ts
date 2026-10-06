import type { SupabaseClient } from "@supabase/supabase-js";
import { loadRoadmap } from "@/lib/roadmap";

export type LessonWord = { id: string; word: string; translation: string; pronunciation?: string | null; example_sentence?: string | null; example_translation?: string | null };
export type LessonActivity = { id: string; title: string; instructions: string | null; activity_type: string; activity_order: number };
export type LessonQuestion = { id: string; activity_id: string; question_text: string; question_type: string; correct_answer: string; options: unknown; explanation: string | null; question_order: number };
export type CompletionResult = { replay: boolean; xp_awarded: number; coins_awarded: number; completed_lessons: number; total_lessons: number; correct_answers?: number; total_questions?: number };

export async function loadAuthenticatedLesson(supabase: SupabaseClient, userId: string, lessonId: string, requestedCourse: string | null) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId)) throw new Error("Choose a lesson from your journey roadmap.");
  const lessonResult = await supabase.from("lessons").select("id, unit_id").eq("id", lessonId).eq("is_published", true).maybeSingle();
  if (lessonResult.error) throw lessonResult.error;
  if (!lessonResult.data) throw new Error("This lesson is unavailable.");
  const parent = await supabase.from("units").select("id, course_id, title, description, unit_order, location_name, map_x, map_y").eq("id", lessonResult.data.unit_id).eq("is_published", true).single();
  if (parent.error) throw parent.error;
  const courseId: string = parent.data.course_id;
  if (requestedCourse && requestedCourse !== courseId) throw new Error("This lesson does not belong to the requested course.");
  const roadmap = await loadRoadmap(supabase, userId, courseId);
  const state = roadmap.states.get(lessonId);
  if (!state || state === "locked") throw new Error("This lesson is still locked. Complete the earlier lessons first.");
  const unit = { ...roadmap.units.find((item) => item.id === parent.data.id)!, ...parent.data };
  const lesson = unit.lessons.find((item) => item.id === lessonId)!;
  const [words, activities] = await Promise.all([
    supabase.from("vocabulary").select("id, word, translation, pronunciation, example_sentence, example_translation").eq("lesson_id", lessonId).order("id"),
    supabase.from("activities").select("id, title, instructions, activity_type, activity_order").eq("lesson_id", lessonId).order("activity_order").order("id"),
  ]);
  if (words.error) throw new Error(`vocabulary SELECT: ${words.error.message}`);
  if (activities.error) throw new Error(`activities SELECT: ${activities.error.message}`);
  const activityRows: LessonActivity[] = activities.data ?? [];
  let questions: LessonQuestion[] = [];
  if (activityRows.length) {
    const result = await supabase.from("questions").select("id, activity_id, question_text, question_type, correct_answer, options, explanation, question_order").in("activity_id", activityRows.map((item) => item.id)).order("question_order").order("id");
    if (result.error) throw new Error(`questions SELECT: ${result.error.message}`);
    questions = result.data ?? [];
  }
  return { course: roadmap.course, language: roadmap.language, unit, lesson, words: (words.data ?? []) as LessonWord[], activities: activityRows, questions };
}

async function verifyUser(supabase: SupabaseClient, expectedUserId: string) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user || user.id !== expectedUserId) throw new Error("Your session changed. Sign in again before continuing.");
}

export async function startAuthenticatedLesson(supabase: SupabaseClient, userId: string, lessonId: string) {
  await verifyUser(supabase, userId);
  const result = await supabase.rpc("acelingua_start_lesson", { p_lesson_id: lessonId });
  if (result.error) throw new Error(`lesson_progress start RPC: ${result.error.message}`);
}

export async function completeAuthenticatedLesson(supabase: SupabaseClient, userId: string, lessonId: string, assessment?: { answers: { question_id: string; answer: string }[]; acknowledged: string[] }): Promise<CompletionResult> {
  await verifyUser(supabase, userId);
  const result = assessment
    ? await supabase.rpc("acelingua_complete_assessed_lesson", { p_lesson_id: lessonId, p_answers: assessment.answers, p_acknowledged: assessment.acknowledged })
    : await supabase.rpc("acelingua_complete_lesson", { p_lesson_id: lessonId });
  if (result.error) throw new Error(`lesson completion/reward RPC: ${result.error.message}`);
  const value = result.data as CompletionResult | null;
  if (!value || typeof value.replay !== "boolean" || !Number.isFinite(value.xp_awarded) || !Number.isFinite(value.coins_awarded)) throw new Error("The completion response was unavailable. Return to your roadmap to check saved progress.");
  return value;
}
