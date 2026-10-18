import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { Check, MapPin } from "lucide-react";
import type { DashboardCourse, DashboardLanguage } from "@/lib/dashboard-overview";
import { languageLocations } from "@/lib/world/languageLocations";
import styles from "./JourneyDashboard.module.css";

type Props = {
  courses: DashboardCourse[]; languages: DashboardLanguage[]; selected: string | null;
  onSelect: (id: string) => void; backgrounds: Record<string, StaticImageData>;
  progress?: { completed: number; total: number } | null;
};
export default function YourWorld({ courses, languages, selected, onSelect, backgrounds, progress }: Props) {
  return <section className={`${styles.card} ${styles.selector}`} aria-label="Your saved learning worlds">
    <div className={styles.worldHeading}><h2>Your World</h2><Link href="/learn">View all</Link></div>
    <p className={styles.worldHint}>Countries in your course library</p>
    {courses.length ? <ul className={styles.worldList}>{courses.map(course => {
      const language = languages.find(item => item.id === course.language_id);
      if (!language) return null;
      const active = selected === course.id;
      const country = languageLocations[language.code]?.country ?? language.name;
      return <li key={course.id}><button type="button" aria-pressed={active} onClick={() => onSelect(course.id)} className={`${styles.worldShortcut} ${active ? styles.worldSelected : ""}`}>
        {backgrounds[language.code] && <Image src={backgrounds[language.code]} alt="" fill sizes="300px" className={styles.worldArtwork} />}
        <span className={styles.worldMarker}>{active ? <MapPin size={15} /> : <Check size={14} />}</span>
        <span className={styles.worldCopy}><strong>{country}</strong><span>{course.title}</span><small>{active && progress ? `${progress.completed} / ${progress.total} lessons` : active ? "Loading progress…" : `${language.name} · ${course.level}`}</small></span>
      </button></li>;
    })}</ul> : <p className="my-5 text-sm text-[#62759C]">Add a course to your library to begin your world collection.</p>}
    <Link href="/world" className={styles.worldMapButton}>World Map</Link>
  </section>;
}
