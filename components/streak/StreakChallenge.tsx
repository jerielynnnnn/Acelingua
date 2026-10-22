import { Flag, CalendarDays } from "lucide-react";
import { STREAK_MILESTONES } from "@/lib/streak";
import styles from "./StreakShortcut.module.css";

export default function StreakChallenge({ streak }: { streak: number }) {
  const target = STREAK_MILESTONES.find(item => item.days > streak)?.days ?? Math.ceil((streak + 1) / 100) * 100;
  return <section className={styles.challenge} aria-label="Streak challenge">
    <div className={styles.heading}><strong>{target}-day challenge</strong><span>Day {streak} of {target}</span></div>
    <div className={styles.track}><progress aria-label={`${target}-day streak challenge`} value={streak} max={target}/><CalendarDays size={24}/></div>
    <p><Flag size={14}/> {target - streak} more {target - streak === 1 ? "day" : "days"} to your next milestone</p>
  </section>;
}
