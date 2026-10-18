"use client";

import { useState } from "react";
import type { WritingCharacter } from "@/lib/writing/types";
import LanguageAudio from "@/components/learning/LanguageAudio";
import styles from "./WritingStudio.module.css";

type Mode = "reading" | "recognition" | "listening";
type Props = { character: WritingCharacter; characters: WritingCharacter[]; languageCode: string; onResult: (correct: boolean) => void };
export default function CharacterQuiz(props: Props) {
  const [mode, setMode] = useState<Mode>("reading");
  return <section className={styles.card}>
    <h2>Quick review</h2>
    <div className={styles.actions} role="group" aria-label="Review activity">
      {([['reading', 'Match the reading'], ['recognition', 'Choose the character'], ['listening', 'Listen and select']] as const).map(([value, label]) =>
        <button type="button" key={value} aria-pressed={mode === value} onClick={() => { setMode(value); props.onResult(false); }}>{label}</button>)}
    </div>
    <Question key={mode} {...props} mode={mode} />
  </section>;
}
function Question({ character, characters, languageCode, onResult, mode }: Props & { mode: Mode }) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [options] = useState(() => {
    const getLabel = (item: WritingCharacter) => mode === "reading" ? item.romanization : item.character;
    const correct = getLabel(character);
    // Exclude alternative glyphs with the same reading from recognition/listening choices.
    const labels = [...new Set(characters.filter(c => c.id !== character.id && c.romanization !== character.romanization
      && !(mode === "listening" && character.example_word?.includes(c.character))).map(getLabel))];
    const values = [correct, ...labels.filter(label => label !== correct).sort(() => 0.5 - Math.random()).slice(0, 3)];
    for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; }
    return values;
  });
  const correct = mode === "reading" ? character.romanization : character.character;
  if (options.length < 2) return <p>More published characters are needed for this review. Tracing is still available.</p>;
  return <form onSubmit={event => { event.preventDefault(); setChecked(true); onResult(answer === correct); }}>
    <p className={styles.question}>{mode === "reading" ? `Which reading matches ${character.character}?` : mode === "recognition" ? `Choose the character for “${character.romanization}”.` : "Listen, then choose the character."}</p>
    {mode === "listening" && <LanguageAudio languageCode={languageCode} text={character.example_word || character.character} hideText />}
    {mode === "listening" && character.example_word && <p>Listen for this character in the example word.</p>}
    <fieldset disabled={checked} className={styles.options}>
      <legend className="sr-only">Choose your answer</legend>
      {options.map(option => <label key={option} className={answer === option ? styles.selected : ""}>
        <input type="radio" name="character-answer" checked={answer === option} onChange={() => setAnswer(option)} required /><span>{option}</span>
      </label>)}
    </fieldset>
    <button type="submit" disabled={!answer || checked}>Check answer</button>
    {checked && <div role="status"><p>{answer === correct ? "Correct! Nice work." : `Good try. The answer is ${correct}.`}</p><button type="button" onClick={() => { setAnswer(""); setChecked(false); onResult(false); }}>Try again</button></div>}
  </form>;
}
