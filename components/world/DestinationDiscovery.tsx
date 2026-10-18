"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { publishedCourseAvailability } from "@/lib/language-catalog";
import { withTimeout } from "@/lib/request-timeout";
import type { WorldLanguage } from "@/lib/world/data";
import { countryDiscoveries } from "@/lib/world/country-discoveries";
import { languageLocations } from "@/lib/world/languageLocations";
import CountryScenery from "./CountryScenery";
import styles from "./World.module.css";

type Discovery = { id: string; title: string; lessons: number; playable: boolean };
export default function DestinationDiscovery({ language }: { language: WorldLanguage }) {
  const discovery = countryDiscoveries[language.code];
  const country = languageLocations[language.code]?.country ?? language.name;
  const [courses, setCourses] = useState<Discovery[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const request = async () => {
          const catalog = await supabase.from("courses").select("id, title").eq("language_id", language.id).eq("is_published", true).order("created_at").order("id");
          if (catalog.error) throw new Error(catalog.error.message);
          return Promise.all((catalog.data ?? []).map(async course => {
            const available = await publishedCourseAvailability(supabase, course.id, true);
            return { id: course.id, title: course.title, lessons: available.lessonIds.length, playable: available.playable };
          }));
        };
        const result = await withTimeout(request(), 20000, "Discovery details took too long to load. Please retry.");
        if (!cancelled) setCourses(result);
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Discovery details are unavailable."); }
    }
    void load(); return () => { cancelled = true; };
  }, [language.id, attempt]);
  return <section className="mt-5" aria-label={`${language.name} discoveries`}><div className={`${styles.discoveryArt} ${styles.countryPhoto}`}>{discovery ? <Image src={discovery.image} alt={`Illustration representing ${country}`} fill sizes="(min-width: 768px) 340px, 100vw" className="object-cover" /> : <CountryScenery languageCode={language.code} className="h-36 w-full" />}<span>{country}</span></div>{discovery && <div className={styles.countryNotes}><section><h3>A little history</h3><p>{discovery.history}</p></section><section className={styles.triviaNote}><h3>Did you know?</h3><p>{discovery.trivia}</p></section></div>}<p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3558AE]"><BookOpen size={15} /> Discover the language</p>{error ? <><p role="alert" className={styles.subtitle}>{error}</p><button type="button" className={styles.secondary} onClick={() => { setError(""); setAttempt(n => n + 1); }}>Retry discovery</button></> : courses === null ? <p role="status" className="mt-3 flex items-center gap-2 text-xs text-[#62759c]"><Loader2 size={14} className="animate-spin" /> Finding published courses...</p> : !courses.length ? <p className={styles.subtitle}>Course in Preparation. You can discover this destination while its curriculum is being prepared.</p> : courses.map(course => <div key={course.id} className={styles.course}><h3>{course.title}</h3><p>{course.lessons} published lessons · {course.playable ? "Ready to explore" : "Course in Preparation"}</p></div>)}<p className="mt-3 text-[11px] leading-5 text-[#62759c]">A representative destination for {language.name}. Discovering it keeps your courses and rewards unchanged.</p></section>;
}
