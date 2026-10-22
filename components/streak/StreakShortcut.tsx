"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Flame, Flag, ArrowRight, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { localDate, shiftDay, STREAK_MILESTONES } from "@/lib/streak";
import StreakChallenge from "./StreakChallenge";
import styles from "./StreakShortcut.module.css";

export default function StreakShortcut({ streak, label }: { streak: number | null; label?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [week, setWeek] = useState<{ date: string; active: boolean }[] | null>(null);
  const [error, setError] = useState(false);
  const loading = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const next = streak === null ? null : STREAK_MILESTONES.find(item => item.days > streak)?.days ?? Math.ceil((streak + 1) / 100) * 100;
  async function show() {
    setOpen(true);
    if (loading.current) return;
    loading.current = true;
    setError(false);
    try {
      const client = createClient();
      const { data: { user }, error: authError } = await client.auth.getUser();
      if (!user || authError) throw new Error("Account unavailable");
      const preferences = await client.from("user_daily_goal_preferences").select("timezone").eq("user_id", user.id).maybeSingle();
      if (preferences.error) throw preferences.error;
      const today = localDate(new Date(), preferences.data?.timezone ?? "Asia/Manila");
      const first = shiftDay(today, -new Date(today + "T12:00:00Z").getUTCDay());
      const result = await client.from("streak_history").select("activity_date,is_active").eq("user_id", user.id).gte("activity_date", first).lte("activity_date", today);
      if (result.error) throw result.error;
      const active = new Set(result.data.filter(item => item.is_active).map(item => item.activity_date));
      setWeek(Array.from({ length: 7 }, (_, i) => ({ date: shiftDay(first, i), active: active.has(shiftDay(first, i)) })));
    } catch { setError(true); } finally { loading.current = false; }
  }
  return <div className={styles.wrapper} onMouseEnter={() => void show()} onMouseLeave={() => setOpen(false)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } }}>
    <button ref={trigger} type="button" className={styles.trigger} aria-label={`Streak: ${streak ?? "unavailable"} days`} aria-expanded={open} aria-controls={id} onFocus={() => void show()} onClick={() => { if (!open) void show(); }}>
      <Image src="/icons/fire.png" alt="" width={28} height={28}/><span className={label ? styles.counter : undefined}>{streak?.toLocaleString() ?? "—"}{label && <small>{label}</small>}</span>
    </button>
    {open && <div id={id} className={styles.popover} role="region" aria-label="Your streak preview">
      <div className={styles.heading}><span className={styles.eyebrow}>KEEP YOUR SPARK</span><button type="button" aria-label="Close streak preview" onClick={() => setOpen(false)}><X size={18}/></button></div>
      <div className={styles.stats}><div><Flame/><strong>{streak ?? "—"} days</strong><span>Current streak</span></div><div><Flag/><strong>{next ?? "—"} days</strong><span>Next milestone</span></div></div>
      <div className={styles.heading}><strong>Streak calendar</strong><Link href="/streak">View <ArrowRight size={14}/></Link></div>
      {week ? <div className={styles.week}>{week.map((day, i) => <div key={day.date}><span>{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][i]}</span><span className={styles.day} data-active={day.active || undefined} title={`${day.date}: ${day.active ? "Practiced" : "No recorded practice"}`}>{Number(day.date.slice(-2))}</span></div>)}</div> : <p role="status" className={styles.message}>{error ? "Calendar unavailable. Open your streak to try again." : "Loading your practice calendar…"}</p>}
      {streak !== null && <StreakChallenge streak={streak}/>}
      <Link href="/streak" className={styles.link}>Explore your streak <ArrowRight size={16}/></Link>
    </div>}
  </div>;
}
