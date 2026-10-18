import Image from "next/image";
import Link from "next/link";
import gameIcon from "@/public/icons/minigames.png";
import coins from "@/public/icons/coins.png";
import gems from "@/public/icons/gems.png";
import styles from "./World.module.css";

export default function MinigameIsland() {
  return <Link href="/world/minigames" className={styles.gameIsland} aria-label="Visit Play Island for minigames and bonus rewards">
    <span className={styles.islandArt}><span className={styles.islandCloud} /><span className={styles.islandTop}><Image src={gameIcon} alt="" width={66} height={66} /></span><span className={styles.islandRock} /></span>
    <span className={styles.islandLabel}><strong>Play Island</strong><span>Take a playful learning break</span><span className={styles.islandRewards}><Image src={coins} alt="Coins" width={19} height={19} /><Image src={gems} alt="Gems" width={19} height={19} />Daily bonus challenge </span></span>
  </Link>;
}
