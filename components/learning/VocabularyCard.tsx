"use client";
import type { LessonWord } from "@/lib/authenticated-lesson";
import LanguageAudio from "./LanguageAudio";
import SpeakingPractice from "./SpeakingPractice";
import { phraseMatches } from "@/lib/voice-learning";
import styles from "./LessonExperience.module.css";

export default function VocabularyCard({ word, languageCode, onSpeakingVerified }: { word: LessonWord; languageCode: string; onSpeakingVerified?: (verified: boolean) => void }) {
  const distinctExample = word.example_sentence && !phraseMatches(word.word, word.example_sentence);
  return <div className={styles.vocabulary}>
    <div className={styles.expression}><h2 lang={languageCode} className="break-words text-4xl font-extrabold sm:text-5xl">{word.word}</h2>
      {word.pronunciation && <p className={styles.pronunciation}>{word.pronunciation}</p>}
      <p className={styles.translation}>{word.translation}</p><LanguageAudio languageCode={languageCode} text={word.word} />
    </div>
    {distinctExample && word.example_sentence && <div className={styles.example}><h3>Use it in a sentence</h3><div className="mt-3 flex items-center justify-between gap-3"><p lang={languageCode} className="text-lg font-bold">{word.example_sentence}</p><LanguageAudio languageCode={languageCode} text={word.example_sentence} compact /></div>{word.example_translation && <p className="mt-2 text-sm text-[#62759C]">{word.example_translation}</p>}</div>}
    <div className={styles.speaking}><SpeakingPractice languageCode={languageCode} text={word.word} pronunciation={word.pronunciation} onVerified={onSpeakingVerified} /></div>
  </div>;
}
