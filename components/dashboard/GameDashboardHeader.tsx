"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Gift, CalendarDays, Trophy, Plus, Star } from "lucide-react";
import Logo from "@/components/Logo";
import UserAvatar, { type AvatarLayer } from "@/components/avatar/UserAvatar";
import HeartStatus from "@/components/learning/HeartStatus";
import StreakShortcut from "@/components/streak/StreakShortcut";
import { createClient } from "@/lib/supabase/client";
import { loadLearnerAvatar, avatarLayers, initialAvatarSelection } from "@/lib/avatar";
import { levelProgress } from "@/lib/level-progress";
import { useQuests } from "@/components/missions/useQuests";
import { questSummary } from "@/lib/quests";
import DashboardSummaryShortcut from "./DashboardSummaryShortcut";
import styles from "./GameDashboardHeader.module.css";

type Props = { userId: string; streak: number; hearts: number; coins: number; gems: number; achievements: number };

export default function GameDashboardHeader({ userId, streak, hearts, coins, gems, achievements }: Props) {
  const { data: quests, error: questError } = useQuests();
  const summary = quests ? questSummary(quests) : null;
  const [profile, setProfile] = useState<{ name: string; xp: number; level: number; layers: AvatarLayer[] } | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const client = createClient();
      const [learner, avatar] = await Promise.allSettled([
        client.from("profiles").select("display_name,username,xp,level").eq("id", userId).single(),
        loadLearnerAvatar(client, userId),
      ]);
      if (cancelled || learner.status !== "fulfilled" || learner.value.error) return;
      const data = learner.value.data;
      const layers = avatar.status === "fulfilled" ? avatarLayers(avatar.value.items, initialAvatarSelection(avatar.value.items, avatar.value.ownedIds, avatar.value.equipped)) : [];
      setProfile({ name: data.display_name || data.username || "My profile", xp: data.xp, level: data.level, layers });
    }
    void load();
    const refresh = () => void load();
    window.addEventListener("acelingua:balance-updated", refresh);
    return () => { cancelled = true; window.removeEventListener("acelingua:balance-updated", refresh); };
  }, [userId]);
  const progress = profile ? levelProgress(profile.xp, profile.level) : null;
  return <header className={styles.header}>
    <div className={styles.top}>
      <div className={styles.brand}>
      <Link href="/dashboard" className={styles.logo} aria-label="Acelingua dashboard"><Logo alt="Acelingua" /></Link>
      <Link href="/avatar" className={styles.profile} aria-label="View and customize your avatar">
        <span className={styles.portraitCard}><span className={styles.portrait}><UserAvatar layers={profile?.layers ?? []} /></span><strong className={styles.nameplate}>{profile?.name ?? "My profile"}</strong></span>
        <span className={styles.profileInfo}><span className={styles.profileTitle}>My learning journey</span><span className={styles.experience}><span className={styles.level} aria-label={`Level ${progress?.level ?? "loading"}`}><Star aria-hidden="true"/><b>{progress?.level ?? "—"}</b></span><progress aria-label="Experience toward your next level" value={progress?.current ?? 0} max={progress?.required ?? 100}/></span><small>{progress ? `${progress.remaining} XP to next level` : "Loading progress…"}</small></span>
      </Link>
      </div>
      <div className={styles.balances} aria-label="Your learning supplies">
        <div className={styles.hearts}><HeartStatus initial={hearts}/></div>
        {[{ name: "Coins", icon: "coins", value: coins }, { name: "Gems", icon: "gems", value: gems }].map(item => <Link key={item.name} href="/store" className={styles.currency} aria-label={`${item.name}: ${item.value}. Open store`}><Image src={`/icons/${item.icon}.png`} alt="" width={38} height={38}/><span>{item.value.toLocaleString()}</span><Plus size={19} aria-hidden="true"/></Link>)}
      </div>
      <nav className={styles.shortcuts} aria-label="Rewards and daily progress">
        <div className={styles.streak}><StreakShortcut streak={streak}/><small>Streak</small></div>
        <DashboardSummaryShortcut label="Quests" href="/missions" icon={<CalendarDays/>}>
          {summary && quests ? <><p><b>{summary.completed} of {summary.total}</b> daily quests complete</p><progress aria-label="Daily quest completion" value={summary.completed} max={Math.max(1, summary.total)}/><ul>{quests.quests.filter(q => q.cadence === "daily").slice(0, 3).map(q => <li key={q.id}><span>{q.title}</span><b>{Math.min(q.progress, q.target)}/{q.target}</b></li>)}</ul></> : <p role="status">{questError ? "Quest summary unavailable. Open quests to retry." : "Loading your quests…"}</p>}
        </DashboardSummaryShortcut>
        <DashboardSummaryShortcut label="Awards" href="/achievements" icon={<Trophy/>}>
          <p><b>{achievements}</b> {achievements === 1 ? "achievement" : "achievements"} earned</p><p>Explore your collection, see your progress, and claim eligible achievement rewards.</p>
        </DashboardSummaryShortcut>
        <DashboardSummaryShortcut label="Rewards" href="/missions" icon={<Gift/>}>
          {quests && summary ? <><p><b>{quests.quests.filter(q => !q.claimed && q.progress >= q.target).length}</b> quest rewards ready to claim</p><p>{quests.chest.claimed ? "Daily treasure chest claimed." : summary.chestReady ? "Your daily treasure chest is ready!" : `${quests.chest.claimed_count}/${quests.chest.required} daily rewards claimed toward your treasure chest.`}</p><div className={styles.rewardPreview}><span>{quests.chest.xp} XP</span><span>{quests.chest.coins} coins</span><span>{quests.chest.gems} gems</span></div><small>Daily treasure chest rewards</small></> : <p role="status">{questError ? "Reward summary unavailable. Open rewards to retry." : "Loading your rewards…"}</p>}
        </DashboardSummaryShortcut>
      </nav>
    </div>
  </header>;
}
