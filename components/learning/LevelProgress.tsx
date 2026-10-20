import Image from "next/image";
import { levelProgress } from "@/lib/level-progress";
import styles from "./LessonExperience.module.css";
export default function LevelProgress({ xp, level = 1 }: { xp: number; level?: number }) {
  const progress = levelProgress(xp, level);
  return <div className={styles.level}>
    <Image src="/icons/level-up.png" alt="" width={30} height={30} />
    <div><div className={styles.levelHeading}><strong>Level {progress.level}</strong><span>{progress.totalXp.toLocaleString()} XP</span></div>
      <progress aria-label={`XP progress toward level ${progress.level + 1}`} value={progress.current} max={progress.required} />
      <small>{progress.remaining.toLocaleString()} XP to level {progress.level + 1}</small>
    </div>
  </div>;
}
