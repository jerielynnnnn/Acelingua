"use client";

import { useState } from "react";
import type { LessonWord } from "@/lib/authenticated-lesson";
import LanguageAudio from "./LanguageAudio";

function visualFor(meaning: string) {
  const text = meaning.toLowerCase().trim();
  const visuals: [RegExp, string][] = [
    [/good morning/, "🌅"], [/good night|good evening/, "🌙"],
    [/hello|hi\b|good afternoon/, "👋"], [/goodbye|bye|see you/, "👋"],
    [/thank/, "💐"], [/sorry|excuse/, "🙏"], [/yes/, "✅"], [/^no[!.]?$/, "🙅"],
    [/water/, "💧"], [/apple/, "🍎"], [/cat/, "🐱"], [/dog/, "🐶"],
    [/coffee/, "☕"], [/book/, "📖"], [/school/, "🏫"], [/friend/, "🧑‍🤝‍🧑"],
  ];
  return visuals.find(([pattern]) => pattern.test(text))?.[1];
}

export default function PreviewWordCard({ word, words, languageCode, onChecked }: {
  word: LessonWord; words: LessonWord[]; languageCode: string; onChecked: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [choices] = useState(() => {
    const meanings = [...new Set([word.translation, ...words.map(item => item.translation)])]
      .filter(meaning => meaning !== word.translation).slice(0, 3);
    const options = [word.translation, ...meanings];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  });
  return <div className="mt-5 text-left">
    <div className="rounded-3xl border border-[#3558AE]/15 bg-[#EAF5FF] p-6 text-center sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-[#3558AE]">Listen · Read · Choose</p>
      <h2 lang={languageCode} className="mt-5 break-words text-4xl font-extrabold sm:text-5xl">{word.word}</h2>
      {word.pronunciation && <p className="mt-3 text-lg text-[#3558AE]">{word.pronunciation}</p>}
      <LanguageAudio languageCode={languageCode} text={word.word} hideText />
    </div>
    <form className="mt-6" onSubmit={event => { event.preventDefault(); if (!answer) return; setChecked(true); onChecked(); }}>
      <fieldset disabled={checked}>
        <legend className="mb-4 text-lg font-bold">What does this mean?</legend>
        <div className="grid gap-3 sm:grid-cols-2">{choices.map(choice => {
          const visual = visualFor(choice);
          return <label key={choice} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition focus-within:ring-2 focus-within:ring-[#3558AE] ${answer === choice ? "border-[#3558AE] bg-[#EAF5FF]" : "border-[#071A4A]/10 bg-white"}`}>
            <input type="radio" name="word-meaning" value={choice} checked={answer === choice} onChange={() => setAnswer(choice)} required className="accent-[#3558AE]" />
            {visual && <span aria-hidden="true" className="text-3xl">{visual}</span>}
            <span className="text-sm font-semibold">{choice}</span>
          </label>;
        })}</div>
      </fieldset>
      <button type="submit" disabled={!answer || checked} className="mt-5 rounded-full bg-[#071A4A] px-6 py-3 text-sm font-bold text-white disabled:opacity-40">Check meaning</button>
    </form>
    {checked && <div role="status" className="mt-5 rounded-2xl bg-[#EAF5FF] p-5">
      <p className="font-bold">{answer === word.translation ? "That's right!" : "Good try! Let's learn this one."}</p>
      <p className="mt-2">{word.word} means <strong>{word.translation}</strong>.</p>
      {word.example_sentence && <div className="mt-4 border-t border-[#3558AE]/15 pt-4"><p lang={languageCode}>{word.example_sentence}</p>{word.example_translation && <p className="mt-2 text-sm text-[#62759C]">{word.example_translation}</p>}</div>}
    </div>}
  </div>;
}
