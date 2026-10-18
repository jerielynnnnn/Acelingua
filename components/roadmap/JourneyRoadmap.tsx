"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Lock, Play, MapPin, Flag } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { LessonProgress, LessonState, RoadmapUnit } from "@/lib/roadmap";
import styles from "./JourneyRoadmap.module.css";
import CountryScenery from "@/components/world/CountryScenery";
import WritingStudioButton from "@/components/writing/WritingStudioButton";
import UnitOverview from "./UnitOverview";
import ArrivalRequiredNotice from "@/components/travel/ArrivalRequired";
import type { CourseTravelAccess } from "@/lib/travel/access";

type Props = { units: RoadmapUnit[]; states: Map<string, LessonState>; progress: LessonProgress[]; courseId: string; currentMarker?: ReactNode; languageCode?: string; travelAccess: CourseTravelAccess };
const positions = [50, 28, 50, 72];
const mobilePositions = [50, 40, 50, 60];
const rowHeight = 232;

/** Destination data stays intact for a future illustrated map and cultural content. */
export default function JourneyRoadmap({ units, states, progress, courseId, currentMarker, languageCode, travelAccess }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  if (!travelAccess.arrived) return <>{languageCode && <WritingStudioButton languageCode={languageCode} courseId={courseId} />}<ArrivalRequiredNotice access={travelAccess} /></>;
  return <div className={styles.journey}>
    {languageCode && <WritingStudioButton languageCode={languageCode} courseId={courseId} />}
    <div className={styles.introduction}><Flag size={18} aria-hidden="true" /><span>Your journey roadmap</span></div>
    {!units.length && <p className="py-12 text-center">Published destinations for this course are coming soon.</p>}
    {units.map((unit, unitIndex) => {
      const future = unit.lessons.length > 0 && unit.lessons.every((lesson) => states.get(lesson.id) === "locked");
      const complete = unit.lessons.length > 0 && unit.lessons.every((lesson) => states.get(lesson.id) === "completed");
      return <section key={unit.id} aria-labelledby={`destination-${unit.id}`} data-map-x={unit.map_x ?? undefined} data-map-y={unit.map_y ?? undefined} className={`${styles.destination} ${complete ? styles.completeDestination : future ? styles.lockedDestination : styles.availableDestination}`}>
        {languageCode && <div className={styles.countryBackdrop} aria-hidden="true"><CountryScenery languageCode={languageCode} className="h-full w-full" /></div>}
        {unitIndex > 0 && <div className={styles.transfer} aria-hidden="true" />}
        <header className={styles.destinationHeader}>
          <span className={`${styles.pin} ${future ? styles.futurePin : ""}`}>{complete ? <Check size={22} aria-hidden="true" /> : <MapPin size={22} aria-hidden="true" />}</span>
          <p className={styles.eyebrow}>Unit {unit.unit_order} · {complete ? "Destination complete" : future ? "Future destination" : "Your destination"}</p>
          <h2 id={`destination-${unit.id}`} className={styles.destinationName}>{unit.location_name || unit.title}</h2>
          {unit.location_name && <p className={styles.unitTitle}>{unit.title}</p>}
          {unit.description && <p className={styles.description}>{unit.description}</p>}
          {unit.lessons.length > 0 && <p className="mt-3 text-xs font-semibold text-[#3558AE]">{unit.lessons.filter(lesson => states.get(lesson.id) === "completed").length} / {unit.lessons.length} published lessons completed</p>}
          <button type="button" aria-expanded={selected === unit.id} aria-controls={`overview-${unit.id}`} onClick={() => setSelected(selected === unit.id ? null : unit.id)} className="mt-4 min-h-11 rounded-xl border border-[#102452]/15 bg-white px-5 py-3 text-xs font-bold text-[#102452] hover:bg-[#EDE7FA] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3558AE]">{selected === unit.id ? "Close Overview" : future ? "Preview Destination" : "View Lessons"}</button>
        </header>
        {selected === unit.id && <div id={`overview-${unit.id}`}><UnitOverview unit={unit} states={states} courseId={courseId} languageCode={languageCode} /></div>}
        {!unit.lessons.length && <p className="pb-10 text-center text-sm text-[#071A4A]/60">Lessons for this destination are coming soon.</p>}
        <div className={styles.trail}>
          {[false, true].map((mobile) => <svg key={String(mobile)} aria-hidden="true" className={`${styles.path} ${mobile ? styles.mobilePath : styles.desktopPath}`} viewBox={`0 0 100 ${Math.max(1, unit.lessons.length * rowHeight)}`} preserveAspectRatio="none">
            {unit.lessons.slice(1).map((lesson, index) => {
              const points = mobile ? mobilePositions : positions;
              const fromX = points[index % 4], toX = points[(index + 1) % 4];
              const radius = mobile ? 36 : 40;
              const fromY = index * rowHeight + radius, toY = (index + 1) * rowHeight + radius;
              const midpoint = (fromY + toY) / 2;
              const traversed = states.get(unit.lessons[index].id) === "completed" && states.get(lesson.id) !== "locked";
              return <path key={lesson.id} d={`M ${fromX} ${fromY} C ${fromX} ${midpoint}, ${toX} ${midpoint}, ${toX} ${toY}`} fill="none" stroke={traversed ? "#3558AE" : "#B8CDE3"} strokeWidth={5} vectorEffect="non-scaling-stroke" strokeDasharray={traversed ? undefined : "5 10"} strokeLinecap="round" />;
            })}
          </svg>)}
          <ol className={styles.lessons}>{unit.lessons.map((lesson, index) => {
            const state = states.get(lesson.id) ?? "locked";
            const inProgress = state === "current" && progress.some((row) => row.lesson_id === lesson.id && row.status === "in_progress");
            const status = inProgress ? "In progress" : state === "current" ? "Current" : state === "completed" ? "Completed" : "Locked";
            const label = `Lesson ${lesson.lesson_order}: ${lesson.title}. ${status}. ${lesson.xp_reward} XP, ${lesson.coin_reward} coins.`;
            const icon = state === "completed" ? <Check size={30} aria-hidden="true" /> : state === "locked" ? <Lock size={25} aria-hidden="true" /> : <Play size={27} fill="currentColor" aria-hidden="true" />;
            return <li key={lesson.id} className={styles.lesson} style={{ "--node-x": `${positions[index % 4]}%`, "--mobile-node-x": `${mobilePositions[index % 4]}%` } as CSSProperties}>
              <div className={styles.stop}>
                {state === "current" && currentMarker && <div className={styles.currentMarker}>{currentMarker}</div>}
                <span className={`${styles.status} ${state === "current" ? styles.currentStatus : ""}`}>{status}</span>
                {state === "locked" ? <button type="button" disabled aria-label={label} className={`${styles.node} ${styles.locked}`}>{icon}</button> : <Link href={`/learn/lesson?course=${encodeURIComponent(courseId)}&lesson=${encodeURIComponent(lesson.id)}`} aria-label={label} className={`${styles.node} ${state === "current" ? styles.current : styles.completed}`}>{icon}</Link>}
                <div className={styles.lessonDetails}><p className={styles.lessonNumber}>Lesson {lesson.lesson_order}</p><h3 className={styles.lessonTitle}>{lesson.title}</h3><p className={styles.rewards}>{lesson.xp_reward} XP <span aria-hidden="true">·</span> {lesson.coin_reward} coins</p></div>
              </div>
            </li>;
          })}</ol>
        </div>
      </section>;
    })}
    {!!units.length && <p className={styles.finish}><Flag size={18} aria-hidden="true" /> Keep exploring, one lesson at a time.</p>}
  </div>;
}
