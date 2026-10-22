import Image from "next/image";
import Link from "next/link";
import gameIcon from "@/public/icons/minigames.png";
import coins from "@/public/icons/coins.png";
import gems from "@/public/icons/gems.png";
import UserAvatar, { type AvatarLayer } from "@/components/avatar/UserAvatar";
import styles from "./World.module.css";

export default function MinigameIsland({ avatarLayers, selected = false, onSelect }: { avatarLayers?: AvatarLayer[]; selected?: boolean; onSelect?: () => void }) {
  const content = <>
    <span className={styles.islandArt}><span className={styles.islandCloud} /><span className={styles.islandTop}><Image src={gameIcon} alt="" width={66} height={66} /></span><span className={styles.islandRock} />{selected && avatarLayers && <span className={styles.islandAvatar} aria-label="Your avatar on Play Island"><UserAvatar layers={avatarLayers} /></span>}</span>
    <span className={styles.islandLabel}><strong>Play Island</strong><span>Take a playful learning break</span><span className={styles.islandRewards}><Image src={coins} alt="Coins" width={19} height={19} /><Image src={gems} alt="Gems" width={19} height={19} />Daily bonus challenge </span></span>
  </>;
  return onSelect ? <button type="button" className={styles.gameIsland} aria-label="Explore Play Island" aria-pressed={selected} onClick={onSelect}>{content}</button> : <Link href="/world/minigames" className={styles.gameIsland} aria-label="Visit Play Island for minigames and bonus rewards">{content}</Link>;
}
