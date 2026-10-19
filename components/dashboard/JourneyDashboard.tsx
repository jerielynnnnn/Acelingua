"use client";
import Image from "next/image";
import DashboardHeader from "./DashboardHeader";
import DashboardWorldBanner from "./DashboardWorldBanner";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { Loader2, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadDashboardOverview } from "@/lib/dashboard-overview";
import { loadRoadmap } from "@/lib/roadmap";
import { avatarLayers, initialAvatarSelection } from "@/lib/avatar";

import { withTimeout } from "@/lib/request-timeout";
import { languageLocations } from "@/lib/world/languageLocations";
import japanBackground from "@/public/dashboard/japan.jpg";
import franceBackground from "@/public/dashboard/france.jpg";
import germanyBackground from "@/public/dashboard/germany.jpg";
import spainBackground from "@/public/dashboard/spain.jpg";
import chinaBackground from "@/public/dashboard/china.jpg";
import thaiBackground from "@/public/dashboard/thai.jpg";
import koreaBackground from "@/public/dashboard/korea.jpg";
import dailyGoalIcon from "@/public/icons/daily goals.png";
import CountryScenery from "@/components/world/CountryScenery";
import JourneyRoadmap from "@/components/roadmap/JourneyRoadmap";
import UserAvatar from "@/components/avatar/UserAvatar";
import YourWorld from "./YourWorld";
import DashboardSidebar from "./DashboardSidebar";
import styles from "./JourneyDashboard.module.css";

const roadmapBackgrounds = { ja: japanBackground, fr: franceBackground, de: germanyBackground, es: spainBackground, zh: chinaBackground, th: thaiBackground, ko: koreaBackground };
type Overview = Awaited<ReturnType<typeof loadDashboardOverview>>;
type Roadmap = Awaited<ReturnType<typeof loadRoadmap>>;
const button = "inline-flex items-center justify-center gap-2 rounded-full bg-[#071A4A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3558AE]";
export default function JourneyDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [userId, setUserId] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [error, setError] = useState("");
  const [roadmapError, setRoadmapError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [roadmapAttempt, setRoadmapAttempt] = useState(0);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await withTimeout(supabase.auth.getUser(), 10000, "Your session took too long to load. Please retry.");
        if (authError && !isAuthSessionMissingError(authError)) throw authError;
        if (!user) { router.replace("/login"); return; }
        if (user.user_metadata.acelingua_onboarding && user.user_metadata.acelingua_onboarding.completed !== true) { router.replace("/onboarding/continue"); return; }
        const overview = await withTimeout(loadDashboardOverview(supabase, user.id), 20000, "The dashboard took too long to load. Please retry.");
        if (cancelled) return;
        let courseId = overview.currentCourseId;
        try { const remembered = sessionStorage.getItem(`acelingua:dashboard-course:${user.id}`); if (remembered && overview.courses.some(course => course.id === remembered)) courseId = remembered; } catch { /* Server access time remains the fallback. */ }
        setUserId(user.id); setData(overview); setSelected(courseId);
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load your dashboard."); }
    }
    void load(); return () => { cancelled = true; };
  }, [router, attempt]);
  useEffect(() => {
    if (!userId || !selected) return;
    let cancelled = false;
    async function load() {
      try {
        const result = await withTimeout(loadRoadmap(createClient(), userId, selected!), 20000, "Your roadmap took too long to load. Please retry.");
        if (!cancelled) setRoadmap(result);
      } catch (cause) { if (!cancelled) setRoadmapError(cause instanceof Error ? cause.message : "We couldn't load this course's roadmap."); }
    }
    void load(); return () => { cancelled = true; };
  }, [userId, selected, roadmapAttempt]);
  function switchCourse(courseId: string) {
    if (courseId === selected || !data?.courses.some(course => course.id === courseId)) return;
    setRoadmap(null); setRoadmapError(""); setNotice(""); setSelected(courseId);
    try { sessionStorage.setItem(`acelingua:dashboard-course:${userId}`, courseId); } catch { /* In-page selection still works. */ }
    void createClient().from("course_progress").update({ last_accessed_at: new Date().toISOString() }).eq("user_id", userId).eq("course_id", courseId)
      .then(result => { if (result.error) setNotice("Your course changed here, but we couldn't save its last-access time."); });
  }
  async function logout() { const result = await createClient().auth.signOut(); if (result.error) setNotice(result.error.message); else { router.replace("/login"); router.refresh(); } }
  if (!data) return <main className="flex min-h-screen items-center justify-center bg-[#F4F9FD] p-6 text-[#071A4A]"><section className="max-w-lg rounded-3xl bg-white p-8 text-center">{error ? <><h1 className="text-xl font-bold">Your journey is still saved</h1><p role="alert" className="mt-4">{error}</p><button className={`${button} mt-5`} onClick={() => { setError(""); setAttempt(n => n + 1); }}>Retry dashboard</button></> : <div role="status"><Loader2 className="mx-auto animate-spin" /><p className="mt-4">Preparing your learning journey...</p></div>}</section></main>;
  const profile = data.profile;
  const name = profile.display_name || profile.username || "Learner";
  const course = data.courses.find(item => item.id === selected);
  const language = data.languages.find(item => item.id === course?.language_id);
  const roadmapBackground = language ? roadmapBackgrounds[language.code as keyof typeof roadmapBackgrounds] : undefined;
  const country = language ? languageLocations[language.code]?.country ?? language.name : null;
  const selection = initialAvatarSelection(data.avatar.items, data.avatar.ownedIds, data.avatar.equipped);
  const layers = avatarLayers(data.avatar.items, selection);
  const currentUnit = roadmap?.units.find(unit => unit.lessons.some(lesson => roadmap.states.get(lesson.id) === "current"));
  const currentLesson = currentUnit?.lessons.find(lesson => roadmap?.states.get(lesson.id) === "current");
  const lessonHref = roadmap && !roadmap.travelAccess.arrived ? roadmap.travelAccess.href : currentLesson && selected ? `/learn/lesson?course=${encodeURIComponent(selected)}&lesson=${encodeURIComponent(currentLesson.id)}` : selected ? `/learn?course=${encodeURIComponent(selected)}` : "/world";
  const goal = data.goal;
  const achievements = data.achievements?.filter(item => showAllAchievements || item.unlocked).slice(0, showAllAchievements ? undefined : 3);
  return <div className={`${styles.viewport} min-h-screen bg-[#F5F8FC] text-[#071A4A]`}><DashboardSidebar /><div className={`${styles.shell} md:pl-[76px]`}>
    <DashboardHeader streak={profile.streak} hearts={profile.hearts} gems={profile.gems} coins={profile.coins} achievements={data.achievementCount} profileMenu={<details className="relative"><summary aria-label="Open learner profile menu" className="cursor-pointer list-none"><UserAvatar layers={layers} className="h-10 w-10 overflow-hidden rounded-full border border-[#C7A9D4]" /></summary><div className="absolute right-0 mt-3 w-56 rounded-2xl border border-[#071A4A]/10 bg-white p-5 shadow-xl"><p className="font-bold">{name}</p><p className="mt-1 text-xs font-normal text-[#62759C]">Level {profile.level} · {profile.xp} XP</p><Link href="/avatar" className="mt-4 block text-[#3558AE]">My profile</Link><Link href="/avatar" className="mt-3 block text-[#3558AE]">Customize avatar</Link><button type="button" onClick={() => void logout()} className="mt-4 text-[#B64074]">Log out</button></div></details>} />
    <main className={`${styles.main} mx-auto max-w-[var(--page-max-width)] px-4 py-4 sm:px-7`}><DashboardWorldBanner userId={userId} layers={layers} name={name} level={profile.level} xp={profile.xp} streak={profile.streak} country={country} location={currentUnit?.location_name} lessonHref={lessonHref} hasCurrentLesson={!!currentLesson} completed={roadmap?.completed} total={roadmap?.total} achievements={data.achievementCount} />{(notice || data.warnings.length > 0) && <p role="status" className="mb-5 rounded-xl bg-[#F9C3D7]/25 p-4 text-sm">{notice || "Some side-panel data is unavailable. Your course progress remains saved."}</p>}
      <div className={styles.layout}>
        <div className={styles.leftColumn}>
        <YourWorld courses={data.courses} languages={data.languages} selected={selected} onSelect={switchCourse} backgrounds={roadmapBackgrounds} progress={roadmap} />
        </div>
        <section className={`${styles.card} ${styles.roadmap} !p-0 overflow-hidden`} aria-label="Main learning roadmap" tabIndex={0}>{language && <div className="relative h-36 overflow-hidden sm:h-44">{roadmapBackground ? <Image src={roadmapBackground} alt={`${country ?? language.name} learning world`} fill sizes="(min-width: 1200px) 55vw, 100vw" className="object-cover object-center" /> : <CountryScenery languageCode={language.code} className="h-full w-full" />}<span className="absolute bottom-4 left-5 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-[#3558AE]">{country} · {language.name}</span></div>}<div className="p-5 sm:p-7"><p className="text-[10px] font-bold uppercase tracking-widest text-[#B64074]">Your main adventure</p><h2 className="mt-2 !text-2xl">{course?.title ?? "Choose your first course"}</h2>{roadmap && <><div className="mt-4 flex justify-between text-xs font-semibold text-[#62759C]"><span>{roadmap.completed} / {roadmap.total} published lessons</span><span>{roadmap.percentage}%</span></div><progress aria-label="Published course progress" value={roadmap.completed} max={roadmap.total || 1} className="mt-3 h-2 w-full accent-[#3558AE]" /></>}{roadmapError ? <div role="alert" className="mt-6 rounded-xl bg-[#F9C3D7]/20 p-4 text-sm"><p>{roadmapError}</p><button type="button" className="mt-3 font-bold text-[#3558AE]" onClick={() => { setRoadmapError(""); setRoadmapAttempt(n => n + 1); }}>Retry roadmap</button></div> : selected && !roadmap ? <p role="status" className="flex items-center justify-center gap-2 py-12 text-sm"><Loader2 className="animate-spin" /> Loading your roadmap...</p> : roadmap ? <JourneyRoadmap travelAccess={roadmap.travelAccess} units={roadmap.units} states={roadmap.states} progress={roadmap.progress} courseId={roadmap.course.id} languageCode={roadmap.language.code} currentMarker={<UserAvatar layers={layers} className="h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-md" />} /> : <div className="py-12 text-center"><Image src="/icon head.png" alt="Ace, your guide" width={90} height={90} className="mx-auto" /><p className="mt-5 text-sm text-[#62759C]">Discover a language in World to begin your roadmap.</p><Link className={`${button} mt-5`} href="/world">Explore World</Link></div>}</div></section>
        <div className={styles.rightColumn}>
        <section className={`${styles.card} ${styles.goal}`}><h2 className="flex items-center gap-2"><Image src={dailyGoalIcon} alt="" width={24} height={24} />Daily Goals</h2>{goal ? <><p className="mt-4 text-sm font-bold">{goal.completed_activities} / {goal.target_activities} activities</p><progress aria-label="Daily goal progress" value={Math.min(goal.completed_activities, goal.target_activities)} max={goal.target_activities || 1} className="mt-3 h-2 w-full accent-[#3558AE]" /><p className="mt-3 text-xs text-[#62759C]">{goal.is_completed ? "Today's goal is complete!" : "Continue your lesson to work toward today's goal."}</p></> : <p className="mt-4 text-sm text-[#62759C]">{data.goalUnavailable ? "Today's goal is unavailable." : "No daily goal has been set for today."}</p>}</section>
        <section id="dashboard-achievements" className={`${styles.card} ${styles.achievements} scroll-mt-36`}><h2 className="flex items-center gap-2"><Trophy size={17} /> Achievements{data.achievementCount !== null && <span className="ml-auto rounded-full bg-[#C7A9D4]/25 px-2 py-1 text-xs">{data.achievementCount}</span>}</h2>{achievements?.length ? <ul className="mt-4 space-y-3">{achievements.map(item => <li key={item.id} className={`rounded-xl p-3 ${item.unlocked ? "bg-[#C7A9D4]/20" : "bg-[#F4F9FD]"}`}><p className="text-xs font-bold">{item.name} · {item.unlocked ? "Unlocked" : "Locked"}</p>{item.description && <p className="mt-1 text-[11px] text-[#62759C]">{item.description}</p>}</li>)}</ul> : <p className="mt-4 text-sm text-[#62759C]">{data.achievements === null ? "Achievements are currently unavailable." : "Your unlocked achievements will appear here."}</p>}<button type="button" disabled={data.achievements === null} onClick={() => setShowAllAchievements(!showAllAchievements)} className="mt-5 text-sm font-bold text-[#3558AE] disabled:opacity-40">{showAllAchievements ? "Show unlocked preview" : "View all achievements"}</button></section>
        </div>
      </div>
    </main>
  </div></div>;
}
