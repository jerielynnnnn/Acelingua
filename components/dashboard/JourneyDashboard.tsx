"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { ArrowRight, Coins, Flame, Gem, Heart, Loader2, Map, ShoppingBag, Sparkles, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadDashboardOverview } from "@/lib/dashboard-overview";
import { loadRoadmap } from "@/lib/roadmap";
import { avatarLayers, initialAvatarSelection, type AvatarItem } from "@/lib/avatar";
import { validStorePrice } from "@/lib/store";
import { withTimeout } from "@/lib/request-timeout";
import { languageLocations } from "@/lib/world/languageLocations";
import CountryScenery from "@/components/world/CountryScenery";
import JourneyRoadmap from "@/components/roadmap/JourneyRoadmap";
import UserAvatar from "@/components/avatar/UserAvatar";
import DashboardSidebar from "./DashboardSidebar";
import styles from "./JourneyDashboard.module.css";

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
  const country = language ? languageLocations[language.code]?.country ?? language.name : null;
  const selection = initialAvatarSelection(data.avatar.items, data.avatar.ownedIds, data.avatar.equipped);
  const layers = avatarLayers(data.avatar.items, selection);
  const currentUnit = roadmap?.units.find(unit => unit.lessons.some(lesson => roadmap.states.get(lesson.id) === "current"));
  const currentLesson = currentUnit?.lessons.find(lesson => roadmap?.states.get(lesson.id) === "current");
  const lessonHref = currentLesson && selected ? `/learn/lesson?course=${encodeURIComponent(selected)}&lesson=${encodeURIComponent(currentLesson.id)}` : selected ? `/learn?course=${encodeURIComponent(selected)}` : "/world";
  const goal = data.goal;
  const highlights = data.avatar.items.filter(item => validStorePrice(item)).slice(0, 3);
  const achievements = data.achievements?.filter(item => showAllAchievements || item.unlocked).slice(0, showAllAchievements ? undefined : 3);
  return <div className="min-h-screen bg-[#F5F8FC] text-[#071A4A]"><DashboardSidebar /><div className="md:pl-[76px]">
    <header className="sticky top-0 z-40 border-b border-[#071A4A]/5 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-7"><Link href="/dashboard" aria-label="ACELINGUA dashboard"><Image src="/logo.png" width={160} height={48} alt="ACELINGUA" className="h-9 w-auto" priority /></Link><div className="flex flex-wrap items-center gap-3 text-xs font-bold"><span title="Hearts" aria-label={`${profile.hearts} hearts`} className="flex items-center gap-1"><Heart size={16} className="text-[#B64074]" />{profile.hearts}</span><span className="flex items-center gap-1"><Flame size={16} className="text-[#B64074]" />{profile.streak}</span><Link href="/store" className="flex items-center gap-1"><Coins size={16} />{profile.coins}</Link><Link href="/store" className="flex items-center gap-1"><Gem size={16} />{profile.gems}</Link><details className="relative"><summary aria-label="Open learner profile menu" className="cursor-pointer list-none"><UserAvatar layers={layers} className="h-10 w-10 overflow-hidden rounded-full border border-[#C7A9D4]" /></summary><div className="absolute right-0 mt-3 w-56 rounded-2xl border border-[#071A4A]/10 bg-white p-5 shadow-xl"><p className="font-bold">{name}</p><p className="mt-1 text-xs font-normal text-[#62759C]">Level {profile.level} · {profile.xp} XP</p><Link href="#dashboard-profile" className="mt-4 block text-[#3558AE]">My profile</Link><Link href="/avatar" className="mt-3 block text-[#3558AE]">Customize avatar</Link><button type="button" onClick={() => void logout()} className="mt-4 text-[#B64074]">Log out</button></div></details></div></div></header>
    <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-7"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-[#3558AE]">Your learning journey</p><h1 className="mt-2 text-2xl font-extrabold">Welcome back, {name}</h1><p className="mt-2 text-sm text-[#62759C]">Choose your next step. Every lesson takes you further.</p></div>{(notice || data.warnings.length > 0) && <p role="status" className="mb-5 rounded-xl bg-[#F9C3D7]/25 p-4 text-sm">{notice || "Some side-panel data is unavailable. Your course progress remains saved."}</p>}
      <div className={styles.layout}>
        <div className={styles.leftColumn}>
        <section className={`${styles.card} ${styles.selector}`}><h2>Your Learning World</h2>{data.courses.length ? <><label htmlFor="dashboard-course" className="mt-4 block text-xs font-semibold text-[#62759C]">Language and course</label><select id="dashboard-course" value={selected ?? ""} onChange={event => switchCourse(event.target.value)} className="mt-2 w-full rounded-xl border border-[#3558AE]/20 bg-[#F4F9FD] p-3 text-sm">{data.courses.map(item => <option key={item.id} value={item.id}>{data.languages.find(l => l.id === item.language_id)?.name} — {item.title}</option>)}</select>{language && <><p className="mt-4 font-extrabold">{language.flag_emoji} {language.name}</p><p className="mt-1 text-xs text-[#62759C]">{country}{currentUnit?.location_name ? ` · ${currentUnit.location_name}` : ""}</p><p className="mt-2 text-xs capitalize text-[#62759C]">{course?.level}</p></>}</> : <p className="mt-4 text-sm text-[#62759C]">Your first language adventure awaits.</p>}<Link href="/world" className={`${button} mt-5 w-full`}><Map size={16} /> Open World Map</Link><Link href="/learn" className="mt-4 block text-center text-xs font-bold text-[#3558AE]">My saved courses</Link></section>
        <section id="dashboard-profile" className={`${styles.card} ${styles.avatar} scroll-mt-36`}><h2>My Avatar</h2><div className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-b from-[#EAF5FF] to-[#F5EAF8]"><UserAvatar layers={layers} className="mx-auto max-w-[260px]" /></div><p className="mt-5 text-center text-lg font-extrabold">{name}</p>{profile.username && <p className="text-center text-xs text-[#62759C]">@{profile.username}</p>}<p className="mt-2 text-center text-sm text-[#3558AE]">Level {profile.level}</p><Link href={data.avatar.equipped ? "/avatar" : "/onboarding/continue"} className={`${button} mt-5 w-full`}>{data.avatar.equipped ? "Customize Avatar" : "Create Avatar"}</Link></section>
        </div>
        <section className={`${styles.card} ${styles.roadmap} !p-0 overflow-hidden`} aria-label="Main learning roadmap">{language && <div className="relative"><CountryScenery languageCode={language.code} className="h-36 w-full sm:h-44" /><span className="absolute bottom-4 left-5 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-[#3558AE]">{country} · {language.name}</span></div>}<div className="p-5 sm:p-7"><p className="text-[10px] font-bold uppercase tracking-widest text-[#B64074]">Your main adventure</p><h2 className="mt-2 !text-2xl">{course?.title ?? "Choose your first course"}</h2>{roadmap && <><div className="mt-4 flex justify-between text-xs font-semibold text-[#62759C]"><span>{roadmap.completed} / {roadmap.total} published lessons</span><span>{roadmap.percentage}%</span></div><progress aria-label="Published course progress" value={roadmap.completed} max={roadmap.total || 1} className="mt-3 h-2 w-full accent-[#3558AE]" /><div className="mt-5 rounded-2xl bg-[#EAF5FF] p-4"><p className="text-xs font-bold text-[#3558AE]">{currentLesson ? "Continue Your Journey" : "Published lessons reviewed"}</p>{currentUnit && <p className="mt-2 text-xs text-[#62759C]">Unit {currentUnit.unit_order} · {currentUnit.title}</p>}<p className="mt-1 font-bold">{currentLesson?.title ?? "Review your roadmap while more chapters are prepared."}</p><Link className={`${button} mt-4`} href={lessonHref}>{currentLesson ? "Continue Learning" : "Review roadmap"}<ArrowRight size={16} /></Link></div></>}{roadmapError ? <div role="alert" className="mt-6 rounded-xl bg-[#F9C3D7]/20 p-4 text-sm"><p>{roadmapError}</p><button type="button" className="mt-3 font-bold text-[#3558AE]" onClick={() => { setRoadmapError(""); setRoadmapAttempt(n => n + 1); }}>Retry roadmap</button></div> : selected && !roadmap ? <p role="status" className="flex items-center justify-center gap-2 py-12 text-sm"><Loader2 className="animate-spin" /> Loading your roadmap...</p> : roadmap ? <JourneyRoadmap units={roadmap.units} states={roadmap.states} progress={roadmap.progress} courseId={roadmap.course.id} languageCode={roadmap.language.code} currentMarker={<UserAvatar layers={layers} className="h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-md" />} /> : <div className="py-12 text-center"><Image src="/icon head.png" alt="Ace, your guide" width={90} height={90} className="mx-auto" /><p className="mt-5 text-sm text-[#62759C]">Discover a language in World to begin your roadmap.</p><Link className={`${button} mt-5`} href="/world">Explore World</Link></div>}</div></section>
        <div className={styles.rightColumn}>
        <section className={`${styles.card} ${styles.stats}`}><h2 className="flex items-center gap-2"><Sparkles size={17} className="text-[#3558AE]" /> Level & Experience</h2><div className="mt-4 flex items-end justify-between"><p className="text-3xl font-extrabold">{profile.level}<span className="ml-2 text-xs font-semibold text-[#62759C]">Level</span></p><p className="font-bold text-[#3558AE]">{profile.xp.toLocaleString()} XP</p></div><p className="mt-3 text-[11px] text-[#62759C]">Next-level targets are not configured yet.</p><div className="mt-5 grid grid-cols-2 gap-3"><Stat icon={<Coins size={17} />} label="Coins" value={profile.coins} href="/store" /><Stat icon={<Gem size={17} />} label="Gems" value={profile.gems} href="/store" /><Stat icon={<Heart size={17} />} label="Hearts" value={profile.hearts} /><Stat icon={<Flame size={17} />} label="Day streak" value={profile.streak} /></div></section>
        <section className={`${styles.card} ${styles.goal}`}><h2>Daily Goal</h2>{goal ? <><p className="mt-4 text-sm font-bold">{goal.completed_activities} / {goal.target_activities} activities</p><progress aria-label="Daily goal progress" value={Math.min(goal.completed_activities, goal.target_activities)} max={goal.target_activities || 1} className="mt-3 h-2 w-full accent-[#3558AE]" /><p className="mt-3 text-xs text-[#62759C]">{goal.is_completed ? "Today's goal is complete!" : "Continue your lesson to work toward today's goal."}</p></> : <p className="mt-4 text-sm text-[#62759C]">{data.goalUnavailable ? "Today's goal is unavailable." : "No daily goal has been set for today."}</p>}</section>
        <section className={`${styles.card} ${styles.shop}`}><h2 className="flex items-center gap-2"><ShoppingBag size={17} /> ACE Shop</h2>{highlights.length ? <div className="mt-4 space-y-3">{highlights.map(item => <ShopHighlight key={item.id} item={item} />)}</div> : <p className="mt-4 text-sm text-[#62759C]">New avatar styles will appear when the catalog is ready.</p>}<Link href="/store" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#3558AE]">View Shop <ArrowRight size={15} /></Link></section>
        <section id="dashboard-achievements" className={`${styles.card} ${styles.achievements} scroll-mt-36`}><h2 className="flex items-center gap-2"><Trophy size={17} /> Achievements{data.achievementCount !== null && <span className="ml-auto rounded-full bg-[#C7A9D4]/25 px-2 py-1 text-xs">{data.achievementCount}</span>}</h2>{achievements?.length ? <ul className="mt-4 space-y-3">{achievements.map(item => <li key={item.id} className={`rounded-xl p-3 ${item.unlocked ? "bg-[#C7A9D4]/20" : "bg-[#F4F9FD]"}`}><p className="text-xs font-bold">{item.name} · {item.unlocked ? "Unlocked" : "Locked"}</p>{item.description && <p className="mt-1 text-[11px] text-[#62759C]">{item.description}</p>}</li>)}</ul> : <p className="mt-4 text-sm text-[#62759C]">{data.achievements === null ? "Achievements are currently unavailable." : "Your unlocked achievements will appear here."}</p>}<button type="button" disabled={data.achievements === null} onClick={() => setShowAllAchievements(!showAllAchievements)} className="mt-5 text-sm font-bold text-[#3558AE] disabled:opacity-40">{showAllAchievements ? "Show unlocked preview" : "View all achievements"}</button></section>
        </div>
      </div>
    </main>
  </div></div>;
}
function Stat({ icon, label, value, href }: { icon: ReactNode; label: string; value: number; href?: string }) {
  const content = <><span className="flex items-center gap-2 font-extrabold text-[#3558AE]">{icon}{value.toLocaleString()}</span><span className="mt-1 block text-[10px] font-semibold text-[#62759C]">{label}</span></>;
  return href ? <Link href={href} className="rounded-xl bg-[#F4F9FD] p-3">{content}</Link> : <div className="rounded-xl bg-[#F4F9FD] p-3">{content}</div>;
}
function ShopHighlight({ item }: { item: AvatarItem }) {
  const [failed, setFailed] = useState(false);
  const safe = typeof item.image_path === "string" && ((item.image_path.startsWith("/") && !item.image_path.startsWith("//")) || /^https?:\/\//i.test(item.image_path));
  return <Link href="/store" className="flex items-center gap-3 rounded-xl bg-[#F4F9FD] p-3"><span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">{safe && !failed ? <Image src={item.image_path} alt={item.name} fill sizes="48px" unoptimized className="object-contain" onError={() => setFailed(true)} /> : <ShoppingBag size={20} className="m-3 text-[#3558AE]" />}</span><span><span className="block text-xs font-bold">{item.name}</span><span className="mt-1 block text-[10px] text-[#62759C]">{item.price_coins === 0 && item.price_gems === 0 ? "Free starter" : [item.price_coins > 0 ? `${item.price_coins} coins` : "", item.price_gems > 0 ? `${item.price_gems} gems` : ""].filter(Boolean).join(" + ")}</span></span></Link>;
}
