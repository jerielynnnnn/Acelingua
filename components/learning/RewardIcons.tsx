import Image from "next/image";
import styles from "./LessonExperience.module.css";
export default function RewardIcons({ xp, coins, earned = false }: { xp: number; coins: number; earned?: boolean }) {
  return <div className={styles.rewards} aria-label={earned ? "Rewards earned" : "First completion rewards"}>
    <span><Image src="/icons/level-up.png" alt="" width={27} height={27} />{earned ? "+" : ""}{xp} XP</span>
    <span><Image src="/icons/coins.png" alt="" width={27} height={27} />{earned ? "+" : ""}{coins} coins</span>
  </div>;
}
