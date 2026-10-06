"use client";

import Link from "next/link";
import { useState } from "react";
import { Cat, Check, Flag, Lock, MapPin, Mountain, RefreshCw, Sparkles, Trophy } from "lucide-react";
import useCourseMap from "./useCourseMap";
import { buildMapPath, flattenCourseLessons, getActiveLesson, getMapCoordinates } from "./courseMapUtils";
import mockData from "./mockData.json";
import styles from "./CourseMap.module.css";

/**
 * @param {{ courseId?: string | null, userId?: string | null, demo?: boolean,
 * onLessonSelect?: ((lesson: { id: string, title: string, status: string, isUnlocked: boolean }) => void) | null,
 * data?: ReturnType<typeof useCourseMap> | null, landscape?: boolean }} props
 */
export default function CourseMap({ courseId = null, userId = null, demo = false, onLessonSelect = null, data = null, landscape = false }) {
  const fetched = useCourseMap(demo || data ? null : courseId, demo || data ? null : userId);
  const live = data ?? fetched;
  const [demoProgress, setDemoProgress] = useState(mockData.progress);
  const lessons = demo ? flattenCourseLessons(mockData.units, demoProgress) : live.lessons;
  const active = getActiveLesson(lessons);
  const points = getMapCoordinates(lessons);
  const activePoint = points.find((point) => point.id === active?.id);
  const completed = lessons.filter((lesson) => lesson.status === "completed").length;
  const finished = lessons.length > 0 && completed === lessons.length;
  // Keep the mascot at the final stop once the entire course is complete.
  const mascotPoint = activePoint ?? (finished ? points.at(-1) : null);
  const height = points.length ? points.at(-1).y + 140 : 0;
  const firstIncomplete = points.findIndex((point) => point.status !== "completed");
  const completedPath = buildMapPath(points.slice(0, firstIncomplete === -1 ? points.length : firstIncomplete + 1));

  function completeDemoLesson() {
    if (!active) return;
    setDemoProgress((progress) => [...progress.filter((row) => row.lesson_id !== active.id),
      { user_id: "demo-user", lesson_id: active.id, status: "completed" }]);
  }

  return (
    <section className={`${styles.shell} ${landscape ? styles.landscape : ""}`} aria-label="AceLingua course map" aria-busy={live.loading}>
      <div className={styles.heading}>
        <div><p className={styles.eyebrow}><MapPin size={14} aria-hidden="true" /> YOUR LEARNING ADVENTURE</p>
          <h3>{demo ? mockData.course.title : live.course?.title ?? "Your next adventure"}</h3>
          <p>One little lesson. One step closer.</p></div>
        <span className={styles.counter}><Flag size={14} aria-hidden="true" /> {completed}/{lessons.length}</span>
      </div>
      <div className={styles.legend}><span><i className={styles.doneDot} />Completed</span><span><i className={styles.activeDot} />Ready to learn</span><span><Lock size={11} aria-hidden="true" />Locked</span></div>
      {demo && <div className={styles.demoControls}><span>Preview · mock progress only</span>
        <button type="button" onClick={completeDemoLesson} disabled={!active}>Complete next lesson</button>
        <button type="button" onClick={() => setDemoProgress(mockData.progress)}>Reset</button></div>}
      {!demo && live.loading && <p className={styles.message} role="status">Preparing your adventure…</p>}
      {!demo && live.error && <div className={styles.message} role="alert"><p>{live.error}</p><button type="button" onClick={live.refresh}><RefreshCw size={14} /> Try again</button></div>}
      {!demo && !live.loading && !live.error && !lessons.length && <p className={styles.message}>{courseId && userId ? "Your course has no lessons yet. Check back soon." : "Choose a course to start your adventure."}</p>}
      {points.length > 0 && <>
        <p className={styles.srOnly} role="status">{finished ? "Course completed!" : active ? `Next lesson: ${active.title}` : "Complete the previous lesson to continue."}</p>
        <div className={styles.map} style={{ height }}>
          <svg className={styles.path} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={buildMapPath(points)} className={styles.pathBase} vectorEffect="non-scaling-stroke" />
            <path d={buildMapPath(points)} className={styles.pathDashes} vectorEffect="non-scaling-stroke" />
            <path d={completedPath} className={styles.pathCompleted} vectorEffect="non-scaling-stroke" />
          </svg>
          <div className={styles.start}>THE JOURNEY BEGINS <Sparkles size={13} /></div>
          <ol className={styles.nodes}>
            {points.map((lesson, index) => {
              const isCurrent = lesson.id === active?.id;
              const isDone = lesson.status === "completed";
              const locked = !lesson.isUnlocked;
              const content = <>
                <span className={styles.tape} aria-hidden="true" />
                <span className={`${styles.art} ${styles[`scene${index % 3}`]}`} aria-hidden="true"><span className={styles.sun} /><Mountain size={64} strokeWidth={1.3} /><span className={styles.artLabel}>ACE / {String(lesson.sequence).padStart(3, "0")}</span></span>
                <span className={styles.cardTitle}>{String(lesson.sequence).padStart(3, "0")}. {lesson.title}</span>
                <span className={styles.unitLabel}>Unit {lesson.unitOrder} · {lesson.unitTitle}</span>
                <span className={styles.cardStatus}>{locked ? "Finish the previous lesson" : isDone ? "Completed · Play again" : lesson.status === "in_progress" ? "Continue lesson →" : "Start lesson →"}</span>
                {locked && <span className={styles.lockBadge}><Lock size={21} aria-hidden="true" /></span>}
                {isDone && <span className={styles.checkBadge}><Check size={15} aria-hidden="true" /></span>}
              </>;
              const className = `${styles.card} ${locked ? styles.locked : isDone ? styles.completed : styles.unlocked} ${isCurrent ? styles.current : ""}`;
              return <li key={lesson.id} className={styles.node} style={{ left: `${lesson.x}%`, top: lesson.y, "--tilt": index % 2 === 0 ? "-4deg" : "4deg" }} aria-current={isCurrent ? "step" : undefined}>
                {locked ? <div className={className} aria-label={`${lesson.title}, locked`}>{content}</div>
                  : demo || onLessonSelect ? <button type="button" className={className} onClick={() => demo ? (isCurrent && completeDemoLesson()) : onLessonSelect(lesson)} aria-label={`${lesson.title}, ${isDone ? "completed" : "unlocked"}`}>{content}</button>
                    : <Link className={className} href={`/learn/lesson/${lesson.id}`}>{content}</Link>}
              </li>;
            })}
          </ol>
          {mascotPoint && <div className={styles.mascotPosition} style={{ left: `${mascotPoint.x}%`, top: mascotPoint.y - 116 }} aria-hidden="true">
            <div key={mascotPoint.id} className={styles.mascotHop}><span className={styles.mascotBubble}>{finished ? "You did it!" : "Let’s go!"}</span><span className={styles.mascot}><Cat size={35} strokeWidth={2.3} /></span></div>
          </div>}
        </div>
        {finished && <p className={styles.finish} role="status"><Trophy size={20} /> Adventure complete. Look how far you’ve come!</p>}
        {!demo && <button type="button" className={styles.refresh} onClick={live.refresh}><RefreshCw size={13} /> Refresh progress</button>}
      </>}
    </section>
  );
}
