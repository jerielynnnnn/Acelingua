"use client";


import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Globe2, Loader2 } from "lucide-react";
import { useLearnerId } from "@/components/dashboard/LearnerShell";

import { createClient } from "@/lib/supabase/client";
import { enrollStartingCourse } from "@/lib/auth-onboarding";
import { loadWorldData, type WorldCourse, type WorldLanguage } from "@/lib/world/data";
import { languageLocations } from "@/lib/world/languageLocations";

import CountryLanding from "./CountryLanding";
import WorldMap from "./WorldMap";
import DestinationDiscovery from "./DestinationDiscovery";
import styles from "./World.module.css";

type WorldData = Awaited<ReturnType<typeof loadWorldData>>;
export default function WorldExperience({ languageCode, dashboard = false }: { languageCode?: string; dashboard?: boolean }) {
  const userId = useLearnerId();
  const router = useRouter();
  const [data, setData] = useState<WorldData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [islandSelected, setIslandSelected] = useState(false);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(new Set());
  const [traveling, setTraveling] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const startInFlight = useRef(false);
  const travelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await loadWorldData(createClient(), userId);
        if (!cancelled) {
          setData(result);
          try {
            const saved: unknown = JSON.parse(localStorage.getItem(`acelingua:world-discoveries:${userId}`) ?? "[]");
            const validIds = new Set(result.languages.map(language => language.id));
            setDiscoveredIds(new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string" && validIds.has(id)) : []));
          } catch { setDiscoveredIds(new Set()); }
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load your destinations. Please retry.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [userId, attempt]);
  useEffect(() => () => { if (travelTimer.current) clearTimeout(travelTimer.current); }, []);

  function retry() { setError(""); setData(null); setAttempt(n => n + 1); }
  function discover(language: WorldLanguage) {
    if (traveling) return;
    setIslandSelected(false);
    setSelectedId(language.id);
    setDiscoveredIds(previous => {
      const next = new Set([...previous, language.id]);
      try { localStorage.setItem(`acelingua:world-discoveries:${userId}`, JSON.stringify([...next])); } catch { /* In-session discovery remains available. */ }
      return next;
    });
  }
  function visit(language: WorldLanguage) {
    if (traveling) return;
    discover(language);
    setTraveling(true);
    travelTimer.current = setTimeout(() => router.push(`/world/${encodeURIComponent(language.code)}`),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450);
  }
  async function startLearning(language: WorldLanguage) {
    if (startInFlight.current || !data) return;
    startInFlight.current = true;
    setStarting(true); setStartError("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || user.id !== userId) throw new Error("Please sign in again to start learning.");
      const enrolled = data.courses.filter(course => course.language_id === language.id);
      const courseId = enrolled.length ? (enrolled.find(c => c.level?.trim().toLowerCase() === "beginner") ?? enrolled[0]).id
        : await enrollStartingCourse(supabase, user, { languageId: language.id, languageCode: language.code }, true);
      router.push(`/learn/${encodeURIComponent(courseId)}`);
    } catch (cause) {
      setStartError(cause instanceof Error ? cause.message : "We couldn't open this language's lessons. Please retry.");
      setStarting(false);
      startInFlight.current = false;
    }
  }
  if (error) return <section className={dashboard ? styles.dashboardWorld : styles.page}><section className={styles.state}><h1>Your journey is still here</h1><p role="alert" className={styles.subtitle}>{error}</p><button onClick={retry} className={styles.action}>Try again</button></section></section>;
  if (!data) return <section className={dashboard ? styles.dashboardWorld : styles.page} aria-busy="true"><p role="status" className="mb-6 flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Loading your world...</p><div className={styles.skeleton} /></section>;
  if (!data.languages.length) return <section className={dashboard ? styles.dashboardWorld : styles.page}><section className={styles.state}><h1>No destinations are available yet.</h1><p className={styles.subtitle}>Check back as the language catalog grows.</p><button className={styles.action} onClick={retry}>Check again</button></section></section>;

  if (languageCode) {
    const language = data.languages.find(item => item.code === languageCode);
    if (!language) return <section className={dashboard ? styles.dashboardWorld : styles.page}><section className={styles.state}><h1>Destination unavailable</h1><p className={styles.subtitle}>This language is not currently active.</p><Link href="/world" className={styles.action}>Back to World</Link></section></section>;
    const courses = data.courses.filter(course => course.language_id === language.id);
    return <CountryLanding key={language.id} language={language} courses={courses} avatar={data.avatar} starting={starting} error={startError} onStart={() => void startLearning(language)} />;
  }
  const mapped = data.languages.filter(language => languageLocations[language.code]);
  const selected = data.languages.find(language => language.id === selectedId) ?? mapped[0] ?? null;
  const location = selected ? languageLocations[selected.code] : null;
  const courses = selected ? data.courses.filter(course => course.language_id === selected.id) : [];
  const learningCourses = courses.length ? courses : data.courses;
  const resumeCourse = learningCourses.find(course => course.progress && course.progress.progress_percentage > 0 && course.progress.progress_percentage < 100)
    ?? learningCourses.find(course => (course.progress?.progress_percentage ?? 0) < 100)
    ?? learningCourses[0];
  const languagesLearning = new Set(data.courses.filter(course => data.languages.some(language => language.id === course.language_id)).map(course => course.language_id)).size;
  if (dashboard) return <section className={styles.dashboardWorld} aria-label="Explore your world map">
    <section className={styles.continueCourse} aria-label="Continue your course">
      <div><span>YOUR COURSE ROADMAP</span><h2>{resumeCourse?.title ?? "Your next learning adventure"}</h2><p>{resumeCourse?.progress ? `${resumeCourse.progress.completed_lessons} of ${resumeCourse.progress.total_lessons} lessons complete` : resumeCourse ? "Pick up your course and follow your next lesson." : "Choose a course to begin your learning journey."}</p></div>
      <Link href={resumeCourse ? `/learn/${encodeURIComponent(resumeCourse.id)}` : "/learn"}>{resumeCourse ? "Continue Learning" : "Choose a course"}<span aria-hidden="true">→</span></Link>
    </section>
    <div className={styles.mapCard}>
      <WorldMap languages={mapped} selectedId={islandSelected ? "play-island" : selected?.id ?? null} onSelect={discover} avatarLayers={data.avatar} onSelectIsland={() => { if (!traveling) setIslandSelected(true); }} />
    </div>
    {islandSelected ? <div className={styles.dashboardDestination} aria-live="polite"><div><span className="text-2xl" aria-hidden="true">🏝️</span><div><h2>Play Island</h2><p>Explore minigames and daily bonus challenges</p></div></div><button type="button" onClick={() => router.push("/world/minigames")}>Explore Play Island</button></div> : selected && location && <div className={styles.dashboardDestination} aria-live="polite"><div><span className="text-2xl" aria-hidden="true">{selected.flag_emoji}</span><div><h2>{location.country}</h2><p>{selected.name}{courses.length ? " · In your library" : " · Discover a new language"}</p></div></div><button type="button" disabled={traveling} onClick={() => visit(selected)}>{traveling ? "Opening destination…" : `Explore ${location.country}`}</button></div>}
    <p className={styles.dashboardMapHint}>Drag to explore, zoom in, or select a flag to discover a country and its lessons.</p>
  </section>;
  return <main className={`${styles.page} ${styles.worldPage}`}>
    <header className={styles.header}><div><p className={styles.eyebrow}>Your world passport</p><h1>Explore the World</h1><p className={styles.subtitle}>Learn languages and discover new destinations.</p></div>
      <div className={styles.stats}><div><strong>{mapped.length}</strong><span>Destinations available</span></div><div><strong>{discoveredIds.size}</strong><span>Discovered on this device</span></div><div><strong>{languagesLearning}</strong><span>Languages learning</span></div></div>
    </header>
    <nav className={styles.destinationRail} aria-label="Quick destinations">{mapped.map(language => <button key={language.id} type="button" aria-pressed={selected?.id === language.id} onClick={() => discover(language)}><span>{language.flag_emoji}</span><strong>{languageLocations[language.code].country}</strong><small>{data.courses.some(course => course.language_id === language.id) ? "In your library" : "Explore"}</small></button>)}</nav>
    <div className={styles.grid}>
      <section className={styles.mapCard}><div className={styles.mapHeading}><h2 className="flex items-center gap-2"><Globe2 size={19} className="text-[#3558ae]" /> Pick your next destination</h2><span>One avatar. Endless discoveries.</span></div>
        <WorldMap languages={mapped} selectedId={selected?.id ?? null} onSelect={discover} avatarLayers={data.avatar} />
        <p className={styles.mapFooter}>Select a flag to explore a destination. Drag to travel across the map and use the controls to zoom.</p>
      </section>
      <aside className={styles.panel} aria-label="Selected destination" aria-live="polite">
        {selected && location ? <><div className={styles.flag}>{selected.flag_emoji || <Compass size={42} />}</div><p className={styles.eyebrow}>Your next stop</p><h2 className="mt-2">{location.country}</h2><p className={styles.native}>{selected.name} · {selected.native_name}</p><p className={styles.subtitle}>Explore {location.country} while learning {selected.name}.</p>
          {discoveredIds.has(selected.id) && <span className={styles.discoveryBadge}>✓ Discovery stamp collected</span>}
          <DestinationDiscovery key={selected.id} language={selected} />
          <CourseCards courses={courses} compact />
          <div className={styles.destinationActions}>
            <button type="button" disabled={traveling || starting} onClick={() => visit(selected)} className={styles.visitAction}>{traveling ? "Traveling..." : "Visit Country"}</button>
            <p className={styles.subtitle}>Visit the country to prepare your passport, board your flight, and begin learning.</p>
          </div>
          {startError && <p role="alert" className={styles.subtitle}>{startError}</p>}
        </> : <><h2>More journeys ahead</h2><p className={styles.subtitle}>Active languages are available below. Their map locations are being prepared.</p></>}
      </aside>
    </div>
    {data.languages.some(language => !languageLocations[language.code]) && <p className={styles.subtitle}>Map locations pending for: {data.languages.filter(language => !languageLocations[language.code]).map(language => language.name).join(", ")}.</p>}
  </main>;
}

function CourseCards({ courses, compact = false }: { courses: WorldCourse[]; compact?: boolean }) {
  return courses.map(course => <section key={course.id} className={styles.course}><h3>{course.title}</h3>
    {course.progress ? <p>{course.progress.completed_lessons} / {course.progress.total_lessons} published lessons completed · {Math.round(course.progress.progress_percentage)}%</p> : <p>Progress summary is not available yet.</p>}
    {!compact && <Link href={`/learn?course=${encodeURIComponent(course.id)}`} className={styles.secondary}>Continue Learning </Link>}
  </section>);
}
