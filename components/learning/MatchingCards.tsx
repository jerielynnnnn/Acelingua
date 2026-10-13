"use client";
import { useEffect, useState } from "react";
import { uniqueMatchWords, shuffled, type MatchWord } from "@/lib/voice-learning";

export default function MatchingCards({ words, onComplete }: { words: MatchWord[]; onComplete?: (result: { pairs: number; mistakes: number }) => void }) {
  const pairs = uniqueMatchWords(words);
  const [right, setRight] = useState<MatchWord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("");
  useEffect(() => { let cancelled = false; Promise.resolve().then(() => { if (!cancelled) setRight(shuffled(uniqueMatchWords(words))); }); return () => { cancelled = true; }; }, [words]);
  function match(id: string) {
    if (!selected) { setFeedback("Choose a phrase on the left first."); return; }
    if (id !== selected) { setMistakes(value => value + 1); setSelected(null); setFeedback("Not that pair. Try again!"); return; }
    const next = [...matched, id]; setMatched(next); setSelected(null); setFeedback("That's a match!");
    if (next.length === pairs.length) onComplete?.({ pairs: pairs.length, mistakes });
  }
  function replay() { setRight(shuffled(pairs)); setMatched([]); setSelected(null); setMistakes(0); setFeedback(""); }
  if (pairs.length < 2) return <p role="status" className="mt-5 rounded-2xl bg-[#EAF5FF] p-4 text-sm">Matching practice needs at least two distinct phrases and meanings. This lesson&apos;s matching game is in preparation.</p>;
  const button = "min-h-16 rounded-2xl border p-4 text-left font-semibold transition motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-[#3558AE] disabled:opacity-40";
  return <section className="mt-6 rounded-3xl bg-[#C7A9D4]/15 p-5"><h2 className="text-xl font-extrabold">Match the phrases</h2><p className="mt-2 text-sm leading-6">Choose a phrase, then its English meaning. Match every pair.</p><p className="mt-3 text-sm font-bold">{matched.length} / {pairs.length} pairs · {mistakes} mismatches</p><div className="mt-5 grid grid-cols-2 gap-4"><div className="grid gap-3">{pairs.map(word => <button key={word.id} type="button" disabled={matched.includes(word.id)} aria-pressed={selected === word.id} onClick={() => { setSelected(word.id); setFeedback("Choose the matching meaning."); }} className={`${button} ${selected === word.id ? "border-[#3558AE] bg-[#EAF5FF]" : "border-white bg-white"}`}>{word.word}{matched.includes(word.id) && " ✓"}</button>)}</div><div className="grid gap-3">{right.map(word => <button key={word.id} type="button" disabled={matched.includes(word.id)} onClick={() => match(word.id)} className={`${button} border-white bg-white`}>{word.translation}{matched.includes(word.id) && " ✓"}</button>)}</div></div><p role="status" aria-live="polite" className="mt-4 text-sm font-bold text-[#3558AE]">{matched.length === pairs.length ? "All pairs matched! This practice grants no extra XP or coins." : feedback}</p><button type="button" onClick={replay} className="mt-4 rounded-full bg-[#071A4A] px-5 py-2.5 text-sm font-bold text-white">Shuffle & replay</button></section>;
}
