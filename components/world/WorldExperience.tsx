"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass, Globe2, Loader2 } from "lucide-react";
import { useLearnerId } from "@/components/dashboard/LearnerShell";
import UserAvatar from "@/components/avatar/UserAvatar";
import { createClient } from "@/lib/supabase/client";
import { loadWorldData, type WorldCourse, type WorldLanguage } from "@/lib/world/data";
import { languageLocations } from "@/lib/world/languageLocations";
import WorldMap from "./WorldMap";
import styles from "./World.module.css";

type WorldData = Awaited<ReturnType<typeof loadWorldData>>;
export default function WorldExperience({ languageCode }: { languageCode?: string }) {
  const userId = useLearnerId();
  const router = useRouter();
  const [data, setData] = useState<WorldData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [traveling, setTraveling] = useState(false);
  const travelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await loadWorldData(createClient(), userId);
        if (!cancelled) setData(result);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load your destinations. Please retry.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [userId, attempt]);
  useEffect(() => () => { if (travelTimer.current) clearTimeout(travelTimer.current); }, []);

  function retry() { setError(""); setData(null); setAttempt(n => n + 1); }
  function visit(language: WorldLanguage) {
    if (traveling) return;
    setTraveling(true);
    travelTimer.current = setTimeout(() => router.push(`/world/${encodeURIComponent(language.code)}`),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450);
  }
  if (error) return <main className={styles.page}><section className={styles.state}><h1>Your journey is still here</h1><p role="alert" className={styles.subtitle}>{error}</p><button onClick={retry} className={styles.action}>Try again</button></section></main>;
  if (!data) return <main className={styles.page} aria-busy="true"><p role="status" className="mb-6 flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Loading your world...</p><div className={styles.skeleton} /></main>;
  if (!data.languages.length) return <main className={styles.page}><section className={styles.state}><h1>No destinations are available yet.</h1><p className={styles.subtitle}>Check back as the language catalog grows.</p><button className={styles.action} onClick={retry}>Check again</button></section></main>;

  if (languageCode) {
    const language = data.languages.find(item => item.code === languageCode);
    if (!language) return <main className={styles.page}><section className={styles.state}><h1>Destination unavailable</h1><p className={styles.subtitle}>This language is not currently active.</p><Link href="/world" className={styles.action}>Back to World</Link></section></main>;
    const location = languageLocations[language.code];
    const courses = data.courses.filter(course => course.language_id === language.id);
    return <main className={styles.page}>
      <Link href="/world" className={styles.secondary}><ArrowLeft size={16} /> Back to World</Link>
      <section className={styles.hero}>
        <div><p className={styles.eyebrow}>Your language journey · {language.flag_emoji}</p>
          <h1>Welcome to {location?.country ?? `${language.name} World`}</h1>
          <p className={styles.subtitle}>Explore {location?.country ?? "new destinations"} while learning {language.name}. Your travel companion stays with you wherever you go.</p>
          <p className={styles.native}>{language.name} · {language.native_name}</p>
          <CourseCards courses={courses} />
          {!courses.length && <div className={styles.course}><h2 className="font-bold">Start a new journey</h2><p>You aren&apos;t enrolled in an active published course for this language. Visiting here hasn&apos;t changed your courses.</p><Link href="/onboarding/languages" className={styles.secondary}>Choose a language <ArrowRight size={16} /></Link></div>}
        </div>
        <div><div className={styles.stage}>
          <div className={styles.guide}><p>Ace, your guide</p><Image src="/icon head.png" alt="Ace the ACELINGUA guide" width={100} height={100} /><p>Ready for a new adventure?</p></div>
          <div className={styles.heroAvatar}><UserAvatar layers={data.avatar} /></div>
        </div><p className="mt-4 text-center text-xs text-[#62759c]">{data.hasAvatar ? "Your saved learner avatar" : "Create your learner avatar to travel in style."}</p><Link href="/avatar" className={`${styles.secondary} w-full justify-center`}>{data.hasAvatar ? "Customize avatar" : "Create avatar"} <ArrowRight size={16} /></Link></div>
      </section>
    </main>;
  }

  const mapped = data.languages.filter(language => languageLocations[language.code]);
  const selected = data.languages.find(language => language.id === selectedId) ?? mapped[0] ?? null;
  const location = selected ? languageLocations[selected.code] : null;
  const courses = selected ? data.courses.filter(course => course.language_id === selected.id) : [];
  const languagesLearning = new Set(data.courses.filter(course => data.languages.some(language => language.id === course.language_id)).map(course => course.language_id)).size;
  return <main className={styles.page}>
    <header className={styles.header}><div><p className={styles.eyebrow}>Your world passport</p><h1>Explore the World</h1><p className={styles.subtitle}>Learn languages and discover new destinations.</p></div>
      <div className={styles.stats}><div><strong>{mapped.length}</strong><span>Destinations available</span></div><div><strong>{languagesLearning}</strong><span>Languages learning</span></div></div>
    </header>
    <div className={styles.grid}>
      <section className={styles.mapCard}><div className={styles.mapHeading}><h2 className="flex items-center gap-2"><Globe2 size={19} className="text-[#3558ae]" /> Pick your next destination</h2><span>One avatar. Endless discoveries.</span></div>
        <WorldMap languages={mapped} selectedId={selected?.id ?? null} onSelect={language => { if (!traveling) setSelectedId(language.id); }} />
        <p className={styles.mapFooter}>Select a flag to explore. Visiting a destination keeps your current courses and progress intact. Map positions are approximate.</p>
      </section>
      <aside className={styles.panel} aria-label="Selected destination" aria-live="polite">
        {selected && location ? <><div className={styles.flag}>{selected.flag_emoji || <Compass size={42} />}</div><p className={styles.eyebrow}>Your next stop</p><h2 className="mt-2">{location.country}</h2><p className={styles.native}>{selected.name} · {selected.native_name}</p><p className={styles.subtitle}>Explore {location.country} while learning {selected.name}.</p>
          <CourseCards courses={courses} compact />
          {!courses.length && <p className={styles.subtitle}>Visit and discover this destination. You can choose a course when you&apos;re ready.</p>}
          <button type="button" disabled={traveling} onClick={() => visit(selected)} className={styles.action}>{traveling ? "Traveling..." : "Visit Country"}<ArrowRight size={16} /></button>
        </> : <><h2>More journeys ahead</h2><p className={styles.subtitle}>Active languages are available below. Their map locations are being prepared.</p></>}
        <div className={styles.traveler}><strong>Your travel companion</strong><div className={`${styles.travelerAvatar} ${traveling ? styles.traveling : ""}`}><UserAvatar layers={data.avatar} /></div><Link href="/avatar" className={styles.secondary}>{data.hasAvatar ? "Customize avatar" : "Create avatar"}<ArrowRight size={14} /></Link></div>
      </aside>
    </div>
    <div className={styles.destinationList} role="group" aria-label="Available destinations">{mapped.map(language => <button key={language.id} type="button" disabled={traveling} aria-pressed={selected?.id === language.id} onClick={() => setSelectedId(language.id)}>{language.flag_emoji} {languageLocations[language.code].country} · {language.name}</button>)}</div>
    {data.languages.some(language => !languageLocations[language.code]) && <p className={styles.subtitle}>Map locations pending for: {data.languages.filter(language => !languageLocations[language.code]).map(language => language.name).join(", ")}.</p>}
  </main>;
}

function CourseCards({ courses, compact = false }: { courses: WorldCourse[]; compact?: boolean }) {
  return courses.map(course => <section key={course.id} className={styles.course}><h3>{course.title}</h3>
    {course.progress ? <p>{course.progress.completed_lessons} / {course.progress.total_lessons} published lessons completed · {Math.round(course.progress.progress_percentage)}%</p> : <p>Progress summary is not available yet.</p>}
    {!compact && <Link href={`/learn?course=${encodeURIComponent(course.id)}`} className={styles.secondary}>Continue Learning <ArrowRight size={16} /></Link>}
  </section>);
}
