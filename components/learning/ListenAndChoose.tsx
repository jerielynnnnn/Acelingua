"use client";
import { useState } from "react";
import type { LessonWord } from "@/lib/authenticated-lesson";
import { uniqueMatchWords } from "@/lib/voice-learning";
import LanguageAudio from "./LanguageAudio";
import LessonCaptions from "./LessonCaptions";

export default function ListenAndChoose({ words, languageCode }: { words: LessonWord[]; languageCode: string }) {
  const available = uniqueMatchWords(words);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const target = available[index];
  if (available.length < 2 || !target) return <p className="mt-4 text-sm">Listening choices need at least two distinct lesson phrases.</p>;
  return <section className="mt-6 rounded-3xl bg-[#EAF5FF] p-5"><h2 className="text-xl font-bold">Listen and choose</h2><p className="mt-3 text-sm">Play the phrase, then choose its meaning. If audio is unavailable, continue with vocabulary review instead.</p><LanguageAudio key={target.id} languageCode={languageCode} text={target.word} hideText /><form onSubmit={event => { event.preventDefault(); setChecked(true); }}><fieldset disabled={checked} className="mt-4 grid gap-2"><legend className="mb-3 text-sm font-bold">What did you hear?</legend>{[...available].reverse().map(word => <label key={word.id} className="flex items-center gap-3 rounded-xl bg-white p-3 text-sm"><input type="radio" name="heard-phrase" checked={answer === word.id} onChange={() => setAnswer(word.id)} required />{word.translation}</label>)}</fieldset><button type="submit" disabled={!answer || checked} className="mt-4 rounded-full bg-[#071A4A] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">Check meaning</button></form>{checked && <><p role="status" className="mt-4 text-sm font-bold">{answer === target.id ? "Correct!" : `The meaning is “${target.translation}”. Listen again.`}</p><LessonCaptions text={target.word} pronunciation={target.pronunciation} translation={target.translation} languageCode={languageCode} /><button type="button" onClick={() => { setIndex((index + 1) % available.length); setAnswer(""); setChecked(false); }} className="mt-4 text-sm font-bold text-[#3558AE]">Next phrase / retry</button></>}</section>;
}
