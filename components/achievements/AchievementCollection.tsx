"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Award as AwardIcon, BookOpen, Check, Coins, Flame, GraduationCap, Lock, Mic, Sparkles, Trophy, X } from "lucide-react";
import { awardState, type Award, type AwardSnapshot } from "@/lib/achievements";
import styles from "./Achievements.module.css";
const categories = ["all", "unlocked", "in progress"] as const;
const themes: Record<string, { icon: typeof Trophy; color: string; label: string }> = {
  lessons_completed: { icon: BookOpen, color: "#85d8fa", label: "Lessons" },
  activities_completed: { icon: GraduationCap, color: "#b9e5a0", label: "Practice" },
  xp_earned: { icon: Sparkles, color: "#ffd46e", label: "Experience" },
  streak: { icon: Flame, color: "#ff9297", label: "Streak" },
  speaking_completed: { icon: Mic, color: "#c7a9ed", label: "Speaking" },
  quiz_completed: { icon: Trophy, color: "#ffc09b", label: "Quizzes" },
};
export default function AchievementCollection() {
  const [data, setData] = useState<AwardSnapshot | null>(null);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<typeof categories[number]>("all");
  const [selected, setSelected] = useState<Award | null>(null); const [pending, setPending] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null); const inFlight = useRef(false);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/achievements", { cache: "no-store", signal: AbortSignal.timeout(20000) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setData(result); setError("");
    } catch { setError("We couldn't refresh your achievements. Please try again."); }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);
  async function collect(award: Award) {
    if (inFlight.current) return; inFlight.current = true; setPending(true); setError("");
    try {
      const response = await fetch("/api/achievements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ achievementId: award.id }), signal: AbortSignal.timeout(20000) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setNotice(result.already_claimed ? "This award is already in your collection." : `${award.name} unlocked! +${result.xp} XP and +${result.coins} coins.`);
      dialog.current?.close(); await refresh(); window.dispatchEvent(new Event("acelingua:balance-updated"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Please retry collecting your award."); }
    finally { inFlight.current = false; setPending(false); }
  }
  const unlocked = data?.awards.filter(a => a.unlocked_at).length ?? 0;
  const shown = data?.awards.filter(a => filter === "all" || (filter === "unlocked" ? a.unlocked_at : !a.unlocked_at)) ?? [];
  return <main className={styles.page}>
    <Link href="/dashboard" className={styles.back}>← Dashboard</Link>
    <header className={styles.hero}><div><span className={styles.eyebrow}>YOUR ACELINGUA COLLECTION</span><h1>Every adventure<br />earns a little glory.</h1><p>Learn, practice, and watch your collection grow.</p><span className={styles.total}><Trophy size={17} /> {unlocked} / {data?.awards.length ?? "—"} awards unlocked</span></div><div className={styles.heroBadge} aria-hidden="true"><AwardIcon size={86} /><Sparkles size={28} /></div></header>
    <nav className={styles.filters} aria-label="Filter achievements">{categories.map(item => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>{item === "all" ? "All awards" : item === "unlocked" ? "Unlocked" : "In progress"}</button>)}</nav>
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {error && !selected && <p role="alert" className={styles.notice}>{error} <button type="button" onClick={() => void refresh()}>Retry</button></p>}
    {!data && !error && <p role="status">Opening your award collection…</p>}
    {data && !shown.length && <p className={styles.empty}>{data.awards.length ? "No awards here yet. Your next lesson is a great place to start." : "Your award catalog is being prepared. Existing learning progress is saved."}<Link href="/learn">Continue learning →</Link></p>}
    <div className={styles.grid}>{shown.map(award => {
      const theme = themes[award.requirement_type] ?? { icon: Trophy, color: "#c7a9ed", label: "Adventure" }; const Icon = theme.icon; const state = awardState(award);
      return <button type="button" className={styles.award} key={award.id} data-state={state} onClick={() => { setSelected(award); setError(""); dialog.current?.showModal(); }}>
        <span className={styles.medal} style={{ "--medal-color": theme.color } as React.CSSProperties}><span className={styles.medalIcon}><Icon size={48} strokeWidth={1.7} /></span><span className={styles.threshold}>{award.requirement_value.toLocaleString()}</span><span className={styles.medalStatus}>{state === "unlocked" ? <Check size={15} /> : state === "ready" ? <Sparkles size={15} /> : <Lock size={13} />}</span></span>
        <span className={styles.category}>{theme.label}</span><h2>{award.name}</h2><span className={styles.progressText}>{state === "unlocked" ? "Unlocked" : state === "ready" ? "Goal reached" : award.progress === null ? "Progress unavailable" : `${Math.min(award.progress, award.requirement_value)} / ${award.requirement_value}`}</span>
        <progress aria-label={`${award.name} progress`} value={state === "unlocked" ? award.requirement_value : Math.min(award.progress ?? 0, award.requirement_value)} max={award.requirement_value} />
      </button>;
    })}</div>
    <dialog className={styles.dialog} ref={dialog} aria-labelledby="award-title" onClose={() => setSelected(null)} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      {selected && <div className={styles.details}><button className={styles.close} type="button" aria-label="Close award details" onClick={() => dialog.current?.close()}><X size={20} /></button><Trophy size={52} className={styles.detailIcon} /><h2 id="award-title">{selected.name}</h2><p>{selected.description}</p><p className={styles.detailProgress}>{selected.unlocked_at ? `Unlocked ${new Date(selected.unlocked_at).toLocaleDateString()}` : selected.progress === null ? "Progress for this award is not available yet." : `${Math.min(selected.progress, selected.requirement_value)} of ${selected.requirement_value} completed`}</p>
        <div className={styles.rewards}><span><Sparkles size={17} /> {selected.xp_reward} XP</span><span><Coins size={17} /> {selected.coin_reward} coins</span></div>
        {error && <p role="alert">{error}</p>}
        {selected.unlocked_at ? <p className={styles.earned}><Check size={18} /> In your collection</p> : awardState(selected) === "ready" && data?.claiming_available ? <button className={styles.collect} disabled={pending} type="button" onClick={() => void collect(selected)}>{pending ? "Collecting…" : "Collect award"}</button> : <><Link className={styles.collect} href={selected.requirement_type === "streak" ? "/streak" : "/learn"}>Continue your adventure</Link>{awardState(selected) === "ready" && !data?.claiming_available && <p className={styles.hint}>Goal reached. Award collection will be available when the achievement service is activated.</p>}</>}
      </div>}
    </dialog>
  </main>;
}
