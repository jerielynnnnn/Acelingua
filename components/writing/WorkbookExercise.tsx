"use client";

import { useId, useRef, useState } from "react";
import type { WritingExercise } from "@/lib/writing/course-curriculum";
import { checkWritingAnswer } from "@/lib/writing/sentence-check";
import type { WritingCharacter } from "@/lib/writing/types";
import LanguageAudio from "@/components/learning/LanguageAudio";
import StrokeDemonstration from "./StrokeDemonstration";
import WritingCanvas from "./WritingCanvas";
import styles from "./WritingStudio.module.css";

type Props = { exercise: WritingExercise; character?: WritingCharacter; onAttempt: (response: string, correct: boolean, mode: string) => Promise<void> };
type Mode = "tiles" | "typing" | "independent";
export default function WorkbookExercise({ exercise, character, onAttempt }: Props) {
  const [mode, setMode] = useState<Mode>(exercise.responseMode ?? "tiles");
  return <section className={styles.card}>
    <h2>{exercise.prompt}</h2>
    {(exercise.kind === "word" || exercise.kind === "sentence") && <div className={styles.actions} role="group" aria-label="Writing activity mode">
      {([['tiles', 'Arrange tiles'], ['typing', 'Type with hints'], ['independent', 'Write independently']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>)}
    </div>}
    {exercise.kind === "character" ? <CharacterActivity exercise={exercise} character={character} onAttempt={onAttempt} />
      : <AnswerActivity key={mode} exercise={exercise} mode={mode} onAttempt={onAttempt} />}
  </section>;
}

function AnswerActivity({ exercise, mode, onAttempt }: Props & { mode: Mode }) {
  const languageCode = exercise.languageCode ?? "ja";
  const languageName = languageCode === "ko" ? "Korean" : "Japanese";
  const inputId = useId();
  const [answer, setAnswer] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<{ correct: boolean; feedback: string } | null>(null);
  const [showModel, setShowModel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [drawn, setDrawn] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const composing = useRef(false);
  const busy = useRef(false);
  const [tiles] = useState(() => {
    const values = [...(exercise.tiles ?? [])];
    for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; }
    return values;
  });
  const value = exercise.kind === "choice" || mode !== "tiles" ? answer : selected.map(index => tiles[index]).join("");
  const isChoice = exercise.kind === "choice";
  async function check() {
    if (!value.trim() || busy.current || composing.current) return;
    const checked = checkWritingAnswer(exercise, value);
    busy.current = true; setSaving(true); setResult(checked); setSaveError("");
    try { await onAttempt(value, checked.correct, isChoice ? "choice" : mode); }
    catch (cause) { setSaveError(cause instanceof Error ? cause.message : "This attempt could not be saved. Check again to retry."); }
    finally { busy.current = false; setSaving(false); }
  }
  async function recordHandwriting() {
    if (!drawn || !reviewed || busy.current) return;
    busy.current = true; setSaving(true); setSaveError("");
    try { await onAttempt(`Self-reviewed handwriting: ${exercise.answer}`, true, "handwriting"); setResult({ correct: true, feedback: "Self-reviewed handwriting practice recorded. No automated handwriting judgment was made." }); }
    catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Couldn't save handwriting practice. Please retry."); }
    finally { busy.current = false; setSaving(false); }
  }
  function reset() { setAnswer(""); setSelected([]); setResult(null); setShowModel(false); setSaveError(""); }
  return <form onSubmit={event => { event.preventDefault(); void check(); }}>
    {isChoice ? <fieldset disabled={saving} className={styles.options}><legend className="sr-only">Choose an answer</legend>{exercise.choices?.map(choice => <label key={choice} className={answer === choice ? styles.selected : ""}><input type="radio" name="workbook-answer" required checked={answer === choice} onChange={() => { setAnswer(choice); setResult(null); }} />{choice}</label>)}</fieldset>
      : mode === "tiles" ? <>
        <div className={styles.sentenceTray} aria-label="Your arranged answer" aria-live="polite">{selected.length ? selected.map((tile, index) => <button type="button" key={index} onClick={() => { setSelected(selected.filter((_, position) => position !== index)); setResult(null); }} aria-label={`Remove ${tiles[tile]}`} lang={languageCode}>{tiles[tile]}</button>) : <span>Choose tiles below. Tap a chosen tile to return it.</span>}</div>
        <div className={styles.actions} aria-label="Available word tiles">{tiles.map((tile, index) => <button key={index} type="button" disabled={selected.includes(index) || saving} onClick={() => { setSelected([...selected, index]); setResult(null); }} lang={languageCode}>{tile}</button>)}</div>
      </> : <>
        <label className={styles.answerLabel} htmlFor={inputId}>{mode === "typing" ? `Type your ${languageName} answer` : "Write the requested sentence without looking at a model"}</label>
        <textarea id={inputId} lang={languageCode} inputMode="text" autoComplete="off" spellCheck={false} maxLength={1000} rows={3} value={answer}
          onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
          onChange={event => { setAnswer(event.target.value); setResult(null); }}
          placeholder={languageCode === "ko" ? "한국어로 써 보세요" : "日本語で書いてみましょう"} className={styles.sentenceInput} aria-describedby={`${inputId}-help`} />
        <p id={`${inputId}-help`}>Use your device&apos;s {languageName} keyboard / IME. Finish composing before checking. You can use Arrange tiles instead.</p>
        {mode === "typing" && <p><strong>Hint:</strong> {exercise.hint ?? exercise.reading}</p>}
        {mode === "independent" && <details><summary>Need a hint?</summary><p>{exercise.hint ?? exercise.reading}</p></details>}
      </>}
    <div className={styles.actions}><button type="submit" disabled={!value || saving}>{saving ? "Saving..." : saveError ? "Retry check and save" : "Check answer"}</button><button type="button" onClick={reset} disabled={saving}>Try again</button></div>
    {result && <div role="status" className={styles.feedback}><strong>{result.correct ? "Well done!" : "Let's review"}</strong><p>{result.feedback}</p></div>}
    {saveError && <p role="alert">{saveError}</p>}
    {result && !isChoice && <><button type="button" onClick={() => setShowModel(!showModel)}>{showModel ? "Hide model answer" : "Compare with model answer"}</button>{showModel && <div className={styles.model}><p lang={languageCode}>{exercise.answer}</p><p>{exercise.reading}</p><LanguageAudio languageCode={languageCode} text={exercise.answer} /></div>}</>}
    {mode === "independent" && !isChoice && <>
      <WritingCanvas character={exercise.answer} independent onDrawn={setDrawn} />
      <button type="button" onClick={() => setShowModel(!showModel)}>{showModel ? "Hide handwriting model" : "Compare handwriting with model"}</button>
      {showModel && !result && <p lang={languageCode} className={styles.exampleJapanese}>{exercise.answer}</p>}
      <label><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)} /> I compared my handwritten answer with the model.</label>
      <button type="button" disabled={!drawn || !reviewed || saving} onClick={() => void recordHandwriting()}>Record self-reviewed handwriting</button>
      <p>The canvas is not automatically read or graded. Typed answers above are checked only against this exercise&apos;s supported patterns.</p>
    </>}
  </form>;
}

function CharacterActivity({ exercise, character, onAttempt }: Props) {
  const [guided, setGuided] = useState(false);
  const [independent, setIndependent] = useState(false);
  const [paper, setPaper] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  if (!character) return <p role="status">This character needs published curriculum data. Other writing lessons are still available.</p>;
  async function save() {
    if (busy.current || saved || !((guided && independent) || paper)) return;
    busy.current = true; setSaving(true); setMessage("");
    try { await onAttempt(exercise.answer, true, "handwriting"); setSaved(true); setMessage("Writing practice recorded. Your handwriting has not been automatically graded."); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Couldn't save practice. Please retry."); }
    finally { busy.current = false; setSaving(false); }
  }
  return <>
    <StrokeDemonstration character={character} />
    <div className={styles.practiceGrid}><WritingCanvas character={character.character} onDrawn={setGuided} /><WritingCanvas character={character.character} onDrawn={setIndependent} independent /></div>
    <p>Study the demonstration, trace once with a guide, then draw from memory on the independent canvas. Compare your work with the demonstration yourself.</p>
    <label><input type="checkbox" checked={paper} onChange={event => setPaper(event.target.checked)} /> I completed both guided and independent practice on paper.</label>
    <button type="button" disabled={saving || saved || !((guided && independent) || paper)} onClick={() => void save()}>{saving ? "Saving..." : saved ? "Practice saved" : "Record writing practice"}</button>
    <p role="status">{message}</p>
  </>;
}
