"use client";

import { useState } from "react";
import type { WritingCharacter } from "@/lib/writing/types";
import styles from "./WritingStudio.module.css";

export default function StrokeDemonstration({ character }: { character: WritingCharacter }) {
  const [run, setRun] = useState(0);
  const [step, setStep] = useState<number | null>(null);
  const data = character.stroke_data;
  return <section className={styles.card}>
    <h2>Stroke order</h2>
    {data ? <>
      <svg key={run} viewBox={data.viewBox} className={styles.demonstration} role="img" aria-label={`Stroke order for ${character.character}`}>
        {data.paths.map((path, i) => <g key={i} transform={`translate(${path.x} 0)`}>
          <path d={path.d} fill="none" stroke="#EDE7FA" strokeWidth={3} strokeLinecap="round" />
          <path d={path.d} pathLength={1} fill="none" stroke={step === i ? "#FF9297" : "#102452"} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={step === null ? styles.animatedStroke : undefined} style={{ animationDelay: `${i * .8}s`, visibility: step !== null && i > step ? "hidden" : undefined }} />
        </g>)}
      </svg>
      <div className={styles.actions}>
        <button type="button" onClick={() => { setStep(null); setRun(run + 1); }}>Replay stroke order</button>
        <button type="button" disabled={step === 0} onClick={() => setStep(Math.max(0, (step ?? 1) - 1))}>Previous stroke</button>
        <button type="button" disabled={step === data.paths.length - 1} onClick={() => setStep(Math.min(data.paths.length - 1, (step ?? -1) + 1))}>Next stroke</button>
      </div>
      {step !== null && <p role="status">Stroke {step + 1} of {data.paths.length} is highlighted in coral.</p>}
      <p>{character.stroke_count} strokes{character.character.length > 1 ? " across the pattern, from left to right" : ""}.</p>
      <p className={styles.attribution}>Stroke paths: <a href="https://github.com/KanjiVG/kanjivg" target="_blank" rel="noreferrer">KanjiVG · Ulrich Apel and contributors</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>. Multi-character layouts are adapted; individual stroke paths are unchanged.</p>
    </> : <p>Verified stroke-order data is not available for this character yet. You can still read it and practice tracing.</p>}
  </section>;
}
