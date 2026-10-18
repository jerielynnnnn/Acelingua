"use client";
import { useAvatarWallpaper } from "./AvatarWallpapers";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import wallpaper from "@/public/dashboard/wallpaper 1.jpg";
import wallpaperTwo from "@/public/dashboard/wallpaper 2.jpg";
import UserAvatar, { type AvatarLayer, type AvatarCategory } from "./UserAvatar";
import styles from "@/components/dashboard/DashboardWorldBanner.module.css";
export default function AvatarBanner({ userId, layers, name, expanded = false, onLayerError }: { userId: string; layers: AvatarLayer[]; name: string; expanded?: boolean; onLayerError?: (category: AvatarCategory, path: string) => void }) {
  const { background } = useAvatarWallpaper(userId);
  return <section className={`${styles.avatarCard} ${background === "lavender" ? styles.lavender : background === "sky" ? styles.sky : ""} ${expanded ? styles.expanded : ""}`} aria-label="Your avatar banner">
    {(background === "room" || background === "room2") && <Image src={background === "room2" ? wallpaperTwo : wallpaper} alt="" fill sizes="(max-width: 767px) 100vw, 300px" className={styles.wallpaper} />}
    <div className={styles.avatarHeading}><span>Your space</span><Link href="/avatar">Customize avatar <ArrowRight size={12} /></Link></div>
    <div className={styles.avatarStage}><div className={styles.avatarPortrait}><UserAvatar layers={layers} transparent onLayerError={onLayerError} /></div></div>
    <div className={styles.avatarFooter}><div className={styles.avatarName}><strong>{name}</strong></div></div>
  </section>;
}
