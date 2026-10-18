"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import levelIcon from "@/public/icons/level-up.png";
import lessonIcon from "@/public/icons/learnicon.png";
import trophyIcon from "@/public/icons/trophy-star.png";
import streakIcon from "@/public/icons/fire.png";

import { type AvatarLayer } from "@/components/avatar/UserAvatar";
import AvatarBanner from "@/components/avatar/AvatarBanner";
import styles from "./DashboardWorldBanner.module.css";

type Props = {
  userId: string; layers: AvatarLayer[];
  name: string; level: number; xp: number; streak: number;
  country: string | null; location?: string | null;
  lessonHref: string; hasCurrentLesson: boolean;
  completed?: number; total?: number; achievements: number | null;
};

export default function DashboardWorldBanner(props: Props) {
  return <div className={styles.bannerRow}><section className={styles.banner} aria-label="Your current learning world">
    <div className={styles.greeting}>
      <p>Welcome back,</p>
      <h1>{props.name}!</h1>
      <p>Your language journey continues.</p>
      <Link href={props.lessonHref}>{props.hasCurrentLesson ? "Continue Lesson" : props.country ? "View Roadmap" : "Choose a World"}<ArrowRight size={15} /></Link>
    </div>
    <Link href="/world" className={styles.world}>
      <span>Current World</span>
      <strong><MapPin size={16} />{props.country ? [props.country, props.location].filter(Boolean).join(" · ") : "Choose your destination"}<ArrowRight size={14} /></strong>
    </Link>
    <div className={styles.progress}>
      <div className={styles.level}><div><span><Image src={levelIcon} alt="" width={17} height={17} />Level</span><strong>{String(props.level).padStart(2, "0")}</strong></div><p>{props.xp.toLocaleString()} <span>total XP</span></p></div>
      <div className={styles.courseProgress}><span>Current course</span><span>{props.completed === undefined ? "Loading…" : `${props.completed} / ${props.total ?? 0} lessons`}</span></div>
      <progress aria-label="Current course lessons completed" value={props.completed ?? 0} max={props.total || 1} />
      <div className={styles.stats}>
        <div><Image src={lessonIcon} alt="" width={19} height={19} /><span>Lessons completed</span><strong>{props.completed ?? "—"}</strong></div>
        <div><Image src={trophyIcon} alt="" width={19} height={19} /><span>Achievements</span><strong>{props.achievements ?? "—"}</strong></div>
        <div><Image src={streakIcon} alt="" width={19} height={19} /><span>Day streak</span><strong>{props.streak}</strong></div>
      </div>
    </div>
  </section><AvatarBanner key={props.userId} userId={props.userId} layers={props.layers} name={props.name} /></div>;
}

