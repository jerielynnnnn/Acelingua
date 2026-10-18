"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LessonState, RoadmapUnit } from "@/lib/roadmap";
import styles from "./UnitOverview.module.css";

type Preview = { culture: string; objectives: string[]; words: { word: string; translation: string; pronunciation: string | null }[]; stamp: { name: string; description: string } | null; challenge: string | null; writing: string | null; minutes: number | null };
export default function UnitOverview({ unit, states, courseId, languageCode }: { unit: RoadmapUnit; states: Map<string, LessonState>; courseId: string; languageCode?: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const db = createClient();
        const [words, meta, stamps] = await Promise.all([
          unit.lessons.length ? db.from("vocabulary").select("word,translation,pronunciation").in("lesson_id", unit.lessons.map(lesson => lesson.id)).order("id").limit(30) : Promise.resolve({ data: [], error: null }),
          db.from("travel_unit_curriculum").select("cultural_introduction,learning_objectives,challenge_lesson_id,writing_recommendation,estimated_minutes").eq("unit_id", unit.id).maybeSingle(),
          db.from("passport_stamp_definitions").select("name,description").eq("unit_id", unit.id).eq("requirement_type", "unit_completion").limit(1).maybeSingle(),
        ]);
        if (words.error) throw words.error;
        if (stamps.error) throw stamps.error;
        if (meta.error && !["PGRST205", "42P01"].includes(meta.error.code)) throw meta.error;
        const metadata = meta.data;
        const seen = new Set<string>();
        const vocabulary = (words.data ?? []).filter(word => { if (seen.has(word.word)) return false; seen.add(word.word); return true; }).slice(0, 6);
        if (!cancelled) setPreview({ culture: metadata?.cultural_introduction ?? unit.description ?? "Explore useful language in this destination.", objectives: Array.isArray(metadata?.learning_objectives) ? metadata.learning_objectives.filter((item: unknown): item is string => typeof item === "string") : unit.lessons.map(lesson => lesson.description).filter((item): item is string => Boolean(item)).slice(0, 3), words: vocabulary, stamp: stamps.data, challenge: metadata?.challenge_lesson_id ?? null, writing: metadata?.writing_recommendation ?? null, minutes: metadata?.estimated_minutes ?? null });
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Destination preview could not be loaded."); }
    }
    void load();
    return () => { cancelled = true; };
  }, [unit, attempt]);
  const next = unit.lessons.find(lesson => states.get(lesson.id) === "current");
  const completed = unit.lessons.filter(lesson => states.get(lesson.id) === "completed").length;
  return <div className={styles.overview}>
    <p className={styles.kicker}>Destination field notes{preview?.minutes ? ` · About ${preview.minutes} minutes across the unit` : ""}</p>
    {error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Retry preview</button></div> : !preview ? <p role="status">Opening destination notes…</p> : <>
      <p className={styles.culture}>{preview.culture}</p>
      {!!preview.objectives.length && <section><h3>What you will learn</h3><ul>{preview.objectives.map(objective => <li key={objective}>{objective}</li>)}</ul></section>}
      <section><h3>Words to take with you</h3>{preview.words.length ? <div className={styles.words}>{preview.words.map(word => <div key={word.word}><strong>{word.word}</strong>{word.pronunciation && <small>{word.pronunciation}</small>}<span>{word.translation}</span></div>)}</div> : <p>Vocabulary is being prepared for this destination.</p>}</section>
      {preview.stamp && <div className={styles.reward}><strong>Passport reward · {preview.stamp.name}</strong><p>{preview.stamp.description}</p><small>Complete every published lesson and the destination challenge. One stamp, no extra currency.</small></div>}
    </>}
    <section><h3>Lesson itinerary</h3><p>{completed} / {unit.lessons.length} lessons completed</p><ol className={styles.itinerary}>{unit.lessons.map(lesson => {
      const state = states.get(lesson.id) ?? "locked";
      const label = lesson.id === preview?.challenge ? "Start Challenge" : state === "completed" ? "Review Lesson" : "Continue Learning";
      return <li key={lesson.id}><div><strong>{lesson.lesson_order}. {lesson.title}</strong><p>{lesson.description}</p><small>{lesson.xp_reward} XP · {lesson.coin_reward} coins · {state === "current" ? "Available" : state}</small></div>{state === "locked" ? <span className={styles.locked}>Locked</span> : <Link href={`/learn/lesson?course=${encodeURIComponent(courseId)}&lesson=${encodeURIComponent(lesson.id)}`}>{label}</Link>}</li>;
    })}</ol></section>
    {next && <Link className={styles.primary} href={`/learn/lesson?course=${encodeURIComponent(courseId)}&lesson=${encodeURIComponent(next.id)}`}>Continue Learning</Link>}
    {!next && completed < unit.lessons.length && <p className={styles.note}>Complete the earlier destinations to unlock these lessons. You can explore these notes anytime.</p>}
    {languageCode && <div className={styles.writing}><p>{preview?.writing ?? "Optional: explore this language’s letters and spelling alongside your conversations."}</p><Link href={`/writing/${encodeURIComponent(languageCode)}?course=${encodeURIComponent(courseId)}`}>Alphabet &amp; Writing</Link></div>}
  </div>;
}
