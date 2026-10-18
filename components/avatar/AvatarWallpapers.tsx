"use client";
import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import wallpaperOne from "@/public/dashboard/wallpaper 1.jpg";
import wallpaperTwo from "@/public/dashboard/wallpaper 2.jpg";
import styles from "./AvatarCustomizer.module.css";

export const wallpapers = [
  { id: "room", name: "Wallpaper 1 · Cozy room", image: wallpaperOne, color: "#f5eaf8" },
  { id: "room2", name: "Wallpaper 2", image: wallpaperTwo, color: "#eaf5ff" },
  { id: "lavender", name: "Ace lavender", image: null, color: "linear-gradient(145deg, #f5eaf8, #c7a9d4)" },
  { id: "sky", name: "Ace sky", image: null, color: "linear-gradient(145deg, #eaf5ff, #a8cde9)" },
] as const;
export type WallpaperId = typeof wallpapers[number]["id"];
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("acelingua-wallpaper", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("acelingua-wallpaper", callback); };
}
export function useAvatarWallpaper(userId: string) {
  const [temporary, setTemporary] = useState<WallpaperId | null>(null);
  const [notice, setNotice] = useState("");
  const saved = useSyncExternalStore(subscribe, () => {
    try { return localStorage.getItem(`acelingua:avatar-wallpaper:${userId}`); } catch { return null; }
  }, () => null);
  const background = temporary ?? wallpapers.find(item => item.id === saved)?.id ?? "room";
  function choose(value: WallpaperId) {
    try {
      localStorage.setItem(`acelingua:avatar-wallpaper:${userId}`, value);
      setTemporary(null); setNotice("");
      window.dispatchEvent(new Event("acelingua-wallpaper"));
    } catch { setTemporary(value); setNotice("Wallpaper changed for this visit. Browser storage is unavailable."); }
  }
  return { background, choose, notice };
}
export default function AvatarWallpapers({ userId }: { userId: string }) {
  const { background, choose, notice } = useAvatarWallpaper(userId);
  return <><div className={styles.wallpaperChoices} role="group" aria-label="Home wallpapers">{wallpapers.map(item => <button type="button" key={item.id} aria-pressed={background === item.id} onClick={() => choose(item.id)}><span className={styles.wallpaperThumbnail} style={{ background: item.color }}>{item.image && <Image src={item.image} alt="" fill sizes="250px" className="object-cover" />}</span><strong>{item.name}</strong><span>{background === item.id ? "Selected" : "Use wallpaper"}</span></button>)}</div><p className="px-5 pt-4 text-xs text-[#62759C]">Wallpaper saves automatically in this browser and appears on your dashboard.</p>{notice && <p role="status" className="p-5 text-xs">{notice}</p>}</>;
}
