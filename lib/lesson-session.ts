import type { LessonActivity, LessonQuestion } from "@/lib/authenticated-lesson";

export type ActivityStep = { activity: LessonActivity; question: LessonQuestion | null };
export type LessonAnswer = { question_id: string; answer: string };
export function normalizeLessonAnswer(answer: string) { return answer.trim().replace(/\s+/g, " ").toLowerCase(); }
export function questionChoices(question: LessonQuestion): string[] {
  return Array.isArray(question.options) && question.options.every((value) => typeof value === "string") ? question.options : [];
}
export function questionIsSupported(question: LessonQuestion) {
  if (question.question_type === "translation") return Boolean(question.correct_answer.trim());
  if (!["multiple_choice", "true_false"].includes(question.question_type)) return false;
  const choices = questionChoices(question);
  return choices.length >= 2 && choices.includes(question.correct_answer);
}
export function activitySteps(activities: LessonActivity[], questions: LessonQuestion[]): ActivityStep[] {
  return [...activities].sort((a, b) => a.activity_order - b.activity_order || a.id.localeCompare(b.id)).flatMap((activity) => {
    const ordered = questions.filter((q) => q.activity_id === activity.id).sort((a, b) => a.question_order - b.question_order || a.id.localeCompare(b.id));
    return [{ activity, question: null }, ...ordered.map((question) => ({ activity, question }))];
  });
}
