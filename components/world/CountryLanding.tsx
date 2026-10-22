"use client";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Lightbulb, MapPin, MessageCircle } from "lucide-react";
import type { AvatarLayer } from "@/components/avatar/UserAvatar";
import type { WorldCourse, WorldLanguage } from "@/lib/world/data";
import { countryDiscoveries } from "@/lib/world/country-discoveries";
import { languageLocations } from "@/lib/world/languageLocations";
import { travelDestinations } from "@/lib/travel/countries";
import LanguageAudio from "@/components/learning/LanguageAudio";
import CountryTravel from "@/components/travel/CountryTravel";
import CountryJourney from "./CountryJourney";
import styles from "./CountryLanding.module.css";
export default function CountryLanding({ language, courses, avatar, starting, error, onStart }: {
  language: WorldLanguage; courses: WorldCourse[]; avatar: AvatarLayer[]; starting: boolean; error: string; onStart: () => void;
}) {
  const country = languageLocations[language.code]?.country ?? language.name;
  const discovery = countryDiscoveries[language.code]; const destination = travelDestinations[language.code];
  return <main className={styles.page}>
    <Link className={styles.back} href="/dashboard">← World map</Link>
    <header className={styles.hero}>{discovery && <Image src={discovery.image} alt={`${country} destination illustration`} fill sizes="(max-width: 767px) 100vw, 1100px" priority className={styles.image} />}<div className={styles.heroCopy}><span><MapPin size={15} /> YOUR NEXT DISCOVERY</span><h1>{language.flag_emoji} Discover {country}</h1><p>Get to know the country, hear your first greeting, and explore its language.</p><a href="#country-learning" className={styles.primary}>Explore your learning journey <BookOpen size={16} /></a></div></header>
    <nav className={styles.navigation} aria-label="Country page"><a href="#country-discoveries">Country discoveries</a><a href="#country-greeting">Hear the language</a><a href="#country-learning">Your learning journey</a></nav>
    <section id="country-discoveries" className={styles.discoveries} aria-labelledby="country-discovery-title"><div className={styles.sectionTitle}><span>BEYOND THE POSTCARD</span><h2 id="country-discovery-title">A little about {country}</h2><p>Small discoveries to take into your next conversation.</p></div><div className={styles.cards}>
      <article className={styles.fact}><span className={styles.factIcon}><BookOpen size={23} /></span><span className={styles.eyebrow}>A glimpse of history</span><h3>A story to remember</h3><p>{discovery?.history ?? "Explore this destination through its language and published lessons."}</p>{language.code === "de" && <a href="https://www.bundesregierung.de/breg-de/themen/deutsche-einheit?id=822934" target="_blank" rel="noreferrer">Explore German reunification ↗</a>}</article>
      <article className={`${styles.fact} ${styles.trivia}`}><span className={styles.factIcon}><Lightbulb size={24} /></span><span className={styles.eyebrow}>Did you know?</span><h3>A language discovery</h3><p>{discovery?.trivia ?? `Listen for the sounds and rhythms of ${language.name} as you learn.`}</p>{language.code === "de" && <><div className={styles.wordExample}><strong>das Buch</strong><span>the book · notice the capital B</span></div><a href="https://www.goethe.de/prj/dlp/dlapi/v1/index.cfm?endpoint=%2Ftlm%2Fdownload&file_ID=4510&tlm_ID=1957" target="_blank" rel="noreferrer">Language notes from Goethe-Institut ↗</a></>}</article>
      <article id="country-greeting" className={styles.fact}><span className={styles.factIcon}><MessageCircle size={23} /></span><span className={styles.eyebrow}>Hear the language</span><h3>Start with hello</h3>{destination ? <><p className={styles.greeting} lang={language.code}>{destination.greeting}</p><p>{destination.meaning}</p><LanguageAudio languageCode={language.code} text={destination.greeting} compact /></> : <p>{language.name} · {language.native_name}</p>}</article>
    </div></section>
    <section id="country-learning" className={styles.learning} aria-labelledby="country-learning-title"><div className={styles.sectionTitle}><span>YOUR NEXT ADVENTURE</span><h2 id="country-learning-title">Learn {language.name} in {country}</h2><p>Your first visit includes a short arrival welcome. After that, come straight back to your lessons.</p></div>
      <CountryTravel languageCode={language.code} avatar={avatar}>
        <div className={styles.coursePanel}><div><h3>{courses.length ? "Your course is waiting" : "Ready to begin?"}</h3><p>{courses.length ? "Continue your lessons or open your destination roadmap below." : "Start with a published beginner course and build from there."}</p></div><button type="button" className={styles.primary} disabled={starting} onClick={onStart}>{starting ? "Opening lessons…" : courses.length ? "Continue learning" : "Find my first lesson"}</button></div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {courses.map(course => <details key={course.id} className={styles.roadmap}><summary><span>{course.title}</span><span>View roadmap</span></summary><CountryJourney courseId={course.id} /></details>)}
      </CountryTravel>
    </section>
    <p className={styles.footnote}>A representative destination for {language.name}. Languages and communities extend beyond country borders.</p>
  </main>;
}
