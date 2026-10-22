import { ArrowRight } from "lucide-react";
import type { LessonWord } from "@/lib/authenticated-lesson";
import { normalizeLessonAnswer, questionChoices, type ActivityStep } from "@/lib/lesson-session";
import ListenAndChoose from "./ListenAndChoose";
import SpeakingPractice from "./SpeakingPractice";
import LanguageAudio from "./LanguageAudio";

type Props = { step: ActivityStep; words: LessonWord[]; languageCode: string; answer: string; checked: boolean; saving: boolean; last: boolean; setAnswer: (value: string) => void; check: () => void; next: () => void; gradedCorrect?: boolean | null; outOfHearts?: boolean; heartCountdown?: string; review?: () => void };
const button = "mt-7 inline-flex items-center gap-2 rounded-full bg-[#071A4A] px-7 py-3.5 text-sm font-bold text-white disabled:opacity-50";
export default function ActivityScreen({ step, words, languageCode, answer, checked, saving, last, setAnswer, check, next, gradedCorrect, outOfHearts, heartCountdown, review }: Props) {
  const { activity, question } = step;
  const normalizePrompt = (text: string) => text.normalize("NFKC").toLocaleLowerCase().replace(/[\p{P}\p{Z}\s]/gu, "");
  const spokenWord = question ? words.filter(word => normalizePrompt(word.word) && normalizePrompt(question.question_text).includes(normalizePrompt(word.word)))
    .sort((a, b) => normalizePrompt(b.word).length - normalizePrompt(a.word).length)[0] : undefined;
  const correct = gradedCorrect ?? (question && normalizeLessonAnswer(answer) === normalizeLessonAnswer(question.correct_answer));
  return <section className="mt-12 rounded-[32px] bg-white p-8 shadow-sm sm:p-12">
    <p className="text-xs font-bold uppercase tracking-widest text-[#3558AE]">Activity {activity.activity_order} · {activity.activity_type}</p>
    <h1 className="mt-3 text-2xl font-extrabold">{activity.title}</h1>
    {!question ? <>
      {activity.instructions && <p className={languageCode === "ko" ? "mt-5 whitespace-pre-line leading-7" : "mt-5 leading-7"}>{activity.instructions}</p>}
      {activity.activity_type === "listening" && <><ListenAndChoose words={words} languageCode={languageCode} /><p className="mt-3 text-xs">Supplementary vocabulary practice; no extra lesson rewards.</p></>}
      {activity.activity_type === "speaking" && <>{words.map(word => <SpeakingPractice key={word.id} text={word.word} languageCode={languageCode} />)}</>}
      <button type="button" className={button} disabled={saving} onClick={next}>{saving ? "Saving..." : "Continue"}<ArrowRight size={18} /></button>
    </> : <form className="mt-7" onSubmit={(event) => { event.preventDefault(); if (checked) next(); else check(); }}>
      <p className="mb-4 text-xs text-[#62759C]">Quiz: a wrong submitted answer costs 1 heart. Expression practice is free.</p>
      {review && <button type="button" disabled={saving} onClick={review} className="mb-4 text-xs font-bold text-[#3558AE]">Review expressions for free</button>}
      {outOfHearts && !checked && <p role="status" className="mb-4 rounded-xl bg-[#FFF0D2] p-3 text-sm">Your next heart returns in {heartCountdown || "a moment"}. Keep reviewing expressions while you wait.</p>}
      <h2 className="text-xl font-bold leading-8" id="question-prompt">{question.question_text}</h2>
      {spokenWord && <div className="mt-3"><LanguageAudio key={question.id} languageCode={languageCode} text={spokenWord.word} compact /></div>}
      {question.question_type === "translation" ? <><label htmlFor="lesson-answer" className="mt-5 block text-sm font-semibold">Your English translation</label><input id="lesson-answer" autoComplete="off" required disabled={checked} value={answer} onChange={(event) => setAnswer(event.target.value)} className="mt-2 w-full rounded-xl border border-[#3558AE]/30 px-4 py-3" /></> : <fieldset aria-labelledby="question-prompt" disabled={checked} className="mt-5 space-y-3">{questionChoices(question).map((choice) => <label key={choice} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${answer === choice ? "border-[#3558AE] bg-[#EAF5FF]" : "border-[#071A4A]/15"}`}><input type="radio" name="lesson-answer" value={choice} checked={answer === choice} onChange={() => setAnswer(choice)} className="accent-[#3558AE]" /><span>{question.question_type === "true_false" ? choice === "true" ? "True" : "False" : choice}</span></label>)}</fieldset>}
      {checked && <div role="status" className={`mt-5 rounded-2xl p-4 text-sm leading-6 ${correct ? "bg-[#C7A9D4]/25" : "bg-[#F9C3D7]/35"}`}><p className="font-bold">{correct ? "Correct!" : "Not quite."}</p>{!correct && <p>Answer: {question.correct_answer}</p>}{question.explanation && <p className="mt-2">{question.explanation}</p>}</div>}
      <button type="submit" disabled={!answer.trim() || saving || (!checked && outOfHearts)} className={button}>{saving ? "Submitting..." : checked ? last ? "Finish lesson" : "Continue" : "Submit answer"}</button>
    </form>}
  </section>;
}
