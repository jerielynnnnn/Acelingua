import { ArrowRight } from "lucide-react";
import type { LessonWord } from "@/lib/authenticated-lesson";
import { normalizeLessonAnswer, questionChoices, type ActivityStep } from "@/lib/lesson-session";

type Props = { step: ActivityStep; words: LessonWord[]; languageCode: string; answer: string; checked: boolean; saving: boolean; last: boolean; setAnswer: (value: string) => void; check: () => void; next: () => void };
const button = "mt-7 inline-flex items-center gap-2 rounded-full bg-[#071A4A] px-7 py-3.5 text-sm font-bold text-white disabled:opacity-50";
export default function ActivityScreen({ step, words, languageCode, answer, checked, saving, last, setAnswer, check, next }: Props) {
  const { activity, question } = step;
  const correct = question && normalizeLessonAnswer(answer) === normalizeLessonAnswer(question.correct_answer);
  return <section className="mt-12 rounded-[32px] bg-white p-8 shadow-sm sm:p-12">
    <p className="text-xs font-bold uppercase tracking-widest text-[#3558AE]">Activity {activity.activity_order} · {activity.activity_type}</p>
    <h1 className="mt-3 text-2xl font-extrabold">{activity.title}</h1>
    {!question ? <>
      {activity.instructions && <p className="mt-5 leading-7">{activity.instructions}</p>}
      {activity.activity_type === "listening" && <p role="status" className="mt-5 rounded-2xl bg-[#EAF5FF] p-4 text-sm leading-6">Listening activity exists but requires audio content. Audio is unavailable, so this step is skipped and is not scored.</p>}
      {activity.activity_type === "speaking" && <><p className="mt-4 text-sm leading-6">Practice saying these expressions aloud. No audio reference or pronunciation scoring is available yet.</p><ul className="mt-5 space-y-2">{words.map((word) => <li key={word.id}><span lang={languageCode}>{word.word}</span> — {word.translation}</li>)}</ul></>}
      <button type="button" className={button} disabled={saving} onClick={next}>{saving ? "Saving..." : activity.activity_type === "listening" ? "Skip unavailable audio" : "Continue"}<ArrowRight size={18} /></button>
    </> : <form className="mt-7" onSubmit={(event) => { event.preventDefault(); if (checked) next(); else check(); }}>
      <h2 className="text-xl font-bold leading-8" id="question-prompt">{question.question_text}</h2>
      {question.question_type === "translation" ? <><label htmlFor="lesson-answer" className="mt-5 block text-sm font-semibold">Your English translation</label><input id="lesson-answer" autoComplete="off" required disabled={checked} value={answer} onChange={(event) => setAnswer(event.target.value)} className="mt-2 w-full rounded-xl border border-[#3558AE]/30 px-4 py-3" /></> : <fieldset aria-labelledby="question-prompt" disabled={checked} className="mt-5 space-y-3">{questionChoices(question).map((choice) => <label key={choice} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${answer === choice ? "border-[#3558AE] bg-[#EAF5FF]" : "border-[#071A4A]/15"}`}><input type="radio" name="lesson-answer" value={choice} checked={answer === choice} onChange={() => setAnswer(choice)} className="accent-[#3558AE]" /><span>{question.question_type === "true_false" ? choice === "true" ? "True" : "False" : choice}</span></label>)}</fieldset>}
      {checked && <div role="status" className={`mt-5 rounded-2xl p-4 text-sm leading-6 ${correct ? "bg-[#C7A9D4]/25" : "bg-[#F9C3D7]/35"}`}><p className="font-bold">{correct ? "Correct!" : "Not quite."}</p>{!correct && <p>Answer: {question.correct_answer}</p>}{question.explanation && <p className="mt-2">{question.explanation}</p>}</div>}
      <button type="submit" disabled={!answer.trim() || saving} className={button}>{saving ? "Saving..." : checked ? last ? "Finish lesson" : "Continue" : "Check"}</button>
    </form>}
  </section>;
}
