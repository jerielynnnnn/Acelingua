"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { StudioData } from "@/lib/writing/client";
import { loadWorkbook, type Workbook } from "@/lib/writing/workbook-client";
import styles from "./WritingStudio.module.css";

export default function WorkbookOverview({ data, query }: { data: StudioData; query: string }) {
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    loadWorkbook(data).then(result => { if (!cancelled) setWorkbook(result); }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "Workbook lessons could not be loaded.");
    });
    return () => { cancelled = true; };
  }, [data, attempt]);
  const learned = workbook?.lessons.filter(lesson => workbook.progress.some(row => row.lesson_slug === lesson.slug && row.completed)).length ?? 0;
  const next = workbook?.lessons.find(lesson => !workbook.progress.some(row => row.lesson_slug === lesson.slug && row.completed)) ?? workbook?.lessons[0];
  return <section className={styles.card}>
    <div className={styles.sectionHeading}><div><h2>Your Japanese writing workbook</h2><p>Start with the introduction, then build characters, words, and sentences.</p></div>
      {next && <Link className={styles.primary} href={`/writing/ja/course/${next.slug}?${query}`}>{learned ? "Continue workbook" : "Start introduction"}</Link>}
    </div>
    {error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); setAttempt(attempt + 1); }}>Retry workbook</button></div>
      : !workbook ? <p role="status">Preparing workbook lessons...</p>
      : !workbook.lessons.length ? <p>The workbook has not been published yet.</p>
      : <><p>{learned} / {workbook.lessons.length} lessons completed. {workbook.local ? "Workbook progress is saved in this browser only." : "Workbook progress saves to your account."}</p>
        <progress aria-label="Writing workbook completion" value={learned} max={workbook.lessons.length} className={styles.workbookProgress} />
        <ol className={styles.workbookList}>{workbook.lessons.map((lesson, index) => <li key={lesson.slug}><Link href={`/writing/ja/course/${lesson.slug}?${query}`}>
          <span className={styles.lessonBadge}>{workbook.progress.some(row => row.lesson_slug === lesson.slug && row.completed) ? "✓" : index + 1}</span><span><small>{lesson.stage}</small><strong>{lesson.title}</strong></span>
        </Link></li>)}</ol>
      </>}
  </section>;
}
