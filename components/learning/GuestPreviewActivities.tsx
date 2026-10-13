"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readPreview, writePreview, previewResults, type GuestPreview, type PreviewAnswer } from "@/lib/guest-preview";
import MatchingCards from "./MatchingCards";
import ListenAndChoose from "./ListenAndChoose";
import { uniqueMatchWords } from "@/lib/voice-learning";

type Word = { id: string; word: string; translation: string; example_sentence: string | null; example_translation: string | null };
type Props = { languageId: string; languageCode: string; courseId: string; lessonId: string; words: Word[]; onComplete: () => void };
const button = "mt-5 rounded-full bg-[#071A4A] px-6 py-3 text-sm font-bold text-white disabled:opacity-40";

export default function GuestPreviewActivities(props: Props) {
  const [state, setState] = useState<GuestPreview | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
    if (cancelled) return;
    const saved = readPreview();
    setState(saved?.lessonId === props.lessonId && saved.languageId === props.languageId ? saved : {
      version: 1, source: "guest_preview", languageId: props.languageId, languageCode: props.languageCode,
      courseId: props.courseId, lessonId: props.lessonId, answers: [], completed: false, updatedAt: new Date().toISOString(),
    });
    });
    return () => { cancelled = true; };
  }, [props.lessonId, props.courseId, props.languageId, props.languageCode]);
  if (!state) return <p role="status">Preparing your activities...</p>;
  if (!props.words.length) return <p role="alert">This preview needs vocabulary before activities are available. Please choose another language.</p>;
  const words = props.words.slice(0, 4);
  const matchingWords = uniqueMatchWords(words);
  const first = words[0];
  const tasks: { id: string; kind: PreviewAnswer["kind"]; prompt: string; correct: string; choices: string[] }[] = [
    { id: "translation", kind: "practice", prompt: `What does “${first.word}” mean?`, correct: first.translation, choices: [...new Set([first.translation, ...words.slice(1).map(w => w.translation), "None of these"])] },
    ...words.slice(0, 2).map(w => ({ id: `match-${w.id}`, kind: "practice" as const, prompt: `Match “${w.translation}” to its phrase.`, correct: w.word, choices: [...new Set([...words.map(v => v.word), "None of these"])] })),
    { id: "sentence", kind: "practice", prompt: `Complete the sentence: “${first.word}” means ___.`, correct: first.translation, choices: [...new Set([first.translation, ...words.slice(1).map(w => w.translation), "None of these"])] },
    ...words.slice(0, 3).map(w => ({ id: `quiz-${w.id}`, kind: "quiz" as const, prompt: `Quiz: which phrase means “${w.translation}”?`, correct: w.word, choices: [...new Set([...words.map(v => v.word).reverse(), "None of these"])] })),
    ...(matchingWords.length >= 2 ? matchingWords : words).map(w => ({ id: `game-${w.id}`, kind: "game" as const, prompt: `Phrase hunt! Find the phrase for “${w.translation}”.`, correct: w.word, choices: [...new Set([...words.map(v => v.word).reverse(), "None of these"])] })),
  ];
  const task = tasks.find(t => !state.answers.some(a => a.id === t.id));
  function finishMatching() {
    if (!state) return;
    const answers = [...state.answers.filter(a => a.kind !== "game"), ...tasks.filter(t => t.kind === "game").map(t => ({ id: t.id, kind: t.kind, answer: t.correct, correct: true }))];
    const updated: GuestPreview = { ...state, answers, completed: true, updatedAt: new Date().toISOString() };
    try {
      writePreview(updated);
      localStorage.setItem("acelingua_selected_language_id", props.languageId);
      localStorage.setItem("acelingua_selected_language", props.languageCode);
      localStorage.setItem("acelingua_onboarding_started", "true");
      localStorage.setItem("acelingua_intro_completed", "true");
      localStorage.setItem("acelingua_intro_lesson_id", props.lessonId);
      setState(updated); setError(""); props.onComplete();
    } catch { setError("We couldn't save your matching result. Allow browser storage, then replay the game to retry."); }
  }
  function next() {
    if (!task || answer === null || !state) return;
    const answers = [...state.answers, { id: task.id, kind: task.kind, answer, correct: answer === task.correct }];
    const updated: GuestPreview = { ...state, answers, completed: answers.length === tasks.length, updatedAt: new Date().toISOString() };
    try {
      writePreview(updated);
      if (updated.completed) {
        localStorage.setItem("acelingua_selected_language_id", props.languageId);
        localStorage.setItem("acelingua_selected_language", props.languageCode);
        localStorage.setItem("acelingua_onboarding_started", "true");
        localStorage.setItem("acelingua_intro_completed", "true");
        localStorage.setItem("acelingua_intro_lesson_id", props.lessonId);
      }
      setState(updated); setAnswer(null); setError("");
      if (updated.completed) props.onComplete();
    } catch { setError("Please allow browser storage and retry so your preview can be saved."); }
  }
  const results = previewResults(state);
  return <div className="mt-6">
    {state.completed ? <div className="text-center"><h1 className="text-3xl font-extrabold">Great job!</h1><p className="mt-4 text-xl text-[#3558AE]">{"★".repeat(results.stars)}</p><p className="mt-3">Quiz score: {results.score}% · {results.correct} correct answers</p><p className="mt-3">Preview XP: {results.xp} · Preview coins: {results.coins}</p><p className="mt-4 leading-7">You&apos;re ready to begin your language adventure. Create your free ACELINGUA account to save your progress and continue learning!</p><p className="mt-3 text-xs text-[#071A4A]/60">Preview rewards are for practice. Account XP and coins are earned in full lessons.</p><Link className={`${button} inline-block`} href="/register">Create Free Account</Link><Link className="mt-5 block text-sm font-bold text-[#3558AE]" href="/login">Already Have an Account? Log In</Link></div>
      : task?.kind === "game" && matchingWords.length >= 2 ? <><ListenAndChoose words={words} languageCode={props.languageCode} /><MatchingCards words={matchingWords} onComplete={finishMatching} /></>
      : task && <><p className="text-xs font-bold uppercase text-[#3558AE]">{task.kind} · {state.answers.length + 1} / {tasks.length}</p><h2 className="mt-4 text-xl font-bold">{task.prompt}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{task.choices.map(choice => <button key={choice} type="button" disabled={answer !== null} onClick={() => setAnswer(choice)} className={`rounded-2xl border p-4 text-left transition ${answer === choice ? "border-[#3558AE] bg-[#EAF5FF]" : "border-[#C7A9D4]/40 hover:bg-[#F9C3D7]/20"}`}>{choice}</button>)}</div>{answer !== null && <p role="status" className="mt-4 rounded-2xl bg-[#EAF5FF] p-4">{answer === task.correct ? "That's right! Ace is cheering for you." : `Keep learning! The correct answer is “${task.correct}”.`}</p>}<button type="button" className={button} disabled={answer === null} onClick={next}>Continue</button></>}
    {error && <p role="alert" className="mt-4 text-[#B64074]">{error}</p>}
  </div>;
}
