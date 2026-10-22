"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageAudio from "@/components/learning/LanguageAudio";
import { loadWritingStudio, type StudioData } from "@/lib/writing/client";
import { safeWritingReturn } from "@/lib/writing/types";
import { loadWorkbook, recordWorkbookActivity, type Workbook } from "@/lib/writing/workbook-client";
import type { WritingBlock } from "@/lib/writing/course-curriculum";
import WorkbookExercise from "./WorkbookExercise";
import styles from "./WritingStudio.module.css";

export default function WritingWorkbook({ languageCode, lessonSlug }: { languageCode: string; lessonSlug: string }) {
  const params = useSearchParams();
  const returnTo = safeWritingReturn(params.get("returnTo"), params.get("course"));
  const query = new URLSearchParams({ returnTo, ...(params.get("course") ? { course: params.get("course")! } : {}) }).toString();
  const [data, setData] = useState<StudioData | null>(null);
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const studio = await loadWritingStudio(languageCode);
      const course = await loadWorkbook(studio);
      if (!cancelled) { setData(studio); setWorkbook(course); }
    }
    void load().catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Couldn't load this workbook. Please retry."); });
    return () => { cancelled = true; };
  }, [languageCode, attempt]);
  const home = `/writing/${encodeURIComponent(languageCode)}?${query}`;
  const lesson = workbook?.lessons.find(row => row.slug === lessonSlug);
  const index = lesson && workbook ? workbook.lessons.indexOf(lesson) : -1;
  const progress = workbook?.progress.find(row => row.lesson_slug === lessonSlug);
  const complete = lesson?.exercises.filter(exercise => progress?.completed_activities.includes(exercise.slug)).length ?? 0;
  async function onAttempt(activitySlug: string, response: string, correct: boolean, mode: string) {
    if (!workbook || !lesson) throw new Error("Wait for the workbook to load.");
    const row = await recordWorkbookActivity(workbook, lesson.slug, activitySlug, response, correct, mode);
    setWorkbook(current => {
      if (!current) return current;
      const previous = current.progress.find(p => p.lesson_slug === row.lesson_slug);
      if (previous && previous.updated_at > row.updated_at) return current;
      return { ...current, progress: [...current.progress.filter(p => p.lesson_slug !== row.lesson_slug), row] };
    });
  }
  return <main className={styles.page}>
    <header className={styles.header}><Link href={home} className={styles.back}><ArrowLeft size={18} /> Writing Studio</Link><Link href={returnTo} className={styles.back}>Return to roadmap</Link><Logo alt="ACELingua" className="h-auto w-40" /></header>
    {error ? <section className={styles.card} role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); setAttempt(attempt + 1); }}>Retry</button></section>
      : !workbook || !data ? <p role="status">Preparing your writing workbook...</p>
      : !lesson ? <section className={styles.card}><h1>Lesson not found</h1><p>This writing lesson has not been published.</p><Link href={home}>Return to the studio</Link></section>
      : <>
        <div className={styles.hero}><span className={styles.badge}>{lesson.stage} · Lesson {index + 1} / {workbook.lessons.length}</span><h1>{lesson.title}</h1><p>{lesson.description}</p></div>
        <p className={styles.notice}>{workbook.local ? "Workbook practice saves in this browser only." : "Workbook practice saves to your account."} Ordinary lessons and rewards are separate.</p>
        <div className={styles.workbookGuide}><Image src="/icon head.png" alt="Ace, your writing guide" width={70} height={70} /><p>Read, listen, and try it yourself. Small steps count!</p></div>
        {lesson.blocks.map((block, i) => <ReadingBlock key={`${lesson.slug}/${i}`} block={block} languageCode={languageCode} />)}
        <section className={styles.card}><h2>Your lesson practice</h2><p>{complete} / {lesson.exercises.length} activities completed</p><progress className={styles.workbookProgress} aria-label="Lesson practice completion" max={lesson.exercises.length || 1} value={complete} /></section>
        {lesson.exercises.map(exercise => <div key={`${lesson.slug}/${exercise.slug}`}>
          {progress?.completed_activities.includes(exercise.slug) && <p className={styles.completeActivity}>✓ Activity completed — you can review it again.</p>}
          <WorkbookExercise exercise={{...exercise, languageCode: languageCode === "ko" ? "ko" : "ja"}} character={data.characters.find(c => c.slug === exercise.characterSlug && data.systems.some(s => s.id === c.writing_system_id && s.slug === (exercise.characterSystem ?? (languageCode === "ja" ? "hiragana" : "consonants"))))} onAttempt={(response, correct, mode) => onAttempt(exercise.slug, response, correct, mode)} />
        </div>)}
        {progress?.completed && <p role="status" className={styles.notice}>Lesson complete. Nice work! Continue when you feel ready.</p>}
        <nav className={styles.characterNav} aria-label="Workbook lesson navigation">
          {index > 0 ? <Link href={`/writing/${languageCode}/course/${workbook.lessons[index - 1].slug}?${query}`}><ArrowLeft size={18} /> Previous lesson</Link> : <Link href={home}>Studio home</Link>}
          {index < workbook.lessons.length - 1 ? <Link href={`/writing/${languageCode}/course/${workbook.lessons[index + 1].slug}?${query}`}>Continue <ArrowRight size={18} /></Link> : <Link href={languageCode === "ja" ? `/writing/ja/hiragana/3042?${query}` : home}>Practice more characters <ArrowRight size={18} /></Link>}
        </nav>
      </>}
  </main>;
}

function ReadingBlock({ block, languageCode }: { block: WritingBlock; languageCode: string }) {
  const [selected, setSelected] = useState<"hiragana" | "katakana" | "kanji" | null>(null);
  const [vertical, setVertical] = useState(false);
  const directions = block.title === "Two writing directions";
  return <section className={styles.card}>
    <h2>{block.title}</h2><p>{block.text}</p>
    {block.segments ? <>
      <div className={styles.scriptSentence} lang="ja">{block.segments.map((segment, i) => <button type="button" key={i} className={styles[segment.system]} aria-label={`${segment.text}, ${segment.system}`} onClick={() => setSelected(segment.system)}>{segment.text}</button>)}<span>。</span></div>
      {selected && <p role="status"><strong>{selected === "kanji" ? "Kanji" : selected === "katakana" ? "Katakana" : "Hiragana"}:</strong> {selected === "kanji" ? "Carries the core meaning here. Learn its reading in this word." : selected === "katakana" ? "Writes the borrowed word coffee here." : "Writes particles and the verb ending here."}</p>}
    </> : directions ? <>
      <div className={styles.actions}><button type="button" aria-pressed={!vertical} onClick={() => setVertical(false)}>Horizontal</button><button type="button" aria-pressed={vertical} onClick={() => setVertical(true)}>Vertical</button></div>
      <div className={styles.directionExample} lang="ja" style={{ writingMode: vertical ? "vertical-rl" : "horizontal-tb" }}><div>あいうえお</div><div>かきくけこ</div></div>
    </> : (block.korean || block.japanese) && <p className={styles.exampleJapanese} lang={languageCode}>{block.korean || block.japanese}</p>}
    {block.reading && <p>{block.reading}</p>}{block.translation && <p>{block.translation}</p>}
    {(block.korean || block.japanese) && !directions && <LanguageAudio languageCode={languageCode} text={(block.korean || block.japanese)!} hideText />}
  </section>;
}
