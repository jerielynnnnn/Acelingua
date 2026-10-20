"use client";
import Link from "next/link";
import { MapPin } from "lucide-react";
import LevelProgress from "@/components/learning/LevelProgress";
import styles from "./DashboardWorldBanner.module.css";

type Props = { level: number; xp: number; country: string | null; location?: string | null };

export default function DashboardWorldBanner({ level, xp, country, location }: Props) {
  return <section className={styles.levelBar} aria-label="Level, XP and current world">
    <LevelProgress xp={xp} level={level} />
    <Link href="/world"><MapPin size={16} /><span><small>Current world</small>{country ? [country, location].filter(Boolean).join(" · ") : "Choose your destination"}</span></Link>
  </section>;
}
