"use client";
import { useState } from "react";
import type { LessonWord } from "@/lib/authenticated-lesson";
import LanguageAudio from "./LanguageAudio";
import LessonCaptions from "./LessonCaptions";
import SpeakingPractice from "./SpeakingPractice";

export default function VocabularyCard({ word, languageCode }: { word: LessonWord; languageCode: string }) {
  const [guide, setGuide] = useState(true);
  return <div className="mt-6 text-center"><h2 lang={languageCode} className="break-words text-4xl font-extrabold sm:text-5xl">{word.word}</h2>{word.pronunciation && <><label className="mt-4 inline-flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={guide} onChange={event => setGuide(event.target.checked)} /> Show pronunciation guide</label>{guide && <p className="mt-3 text-lg text-[#3558AE]">{word.pronunciation}</p>}</>}<p className="mt-5 text-2xl">{word.translation}</p><LanguageAudio languageCode={languageCode} text={word.word} /><SpeakingPractice languageCode={languageCode} text={word.word} />{word.example_sentence && <><LanguageAudio languageCode={languageCode} text={word.example_sentence} /><LessonCaptions text={word.example_sentence} translation={word.example_translation} languageCode={languageCode} initiallyVisible /></>}</div>;
}
