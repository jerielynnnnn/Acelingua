"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, MapPin } from "lucide-react";
import LanguageAudio from "@/components/learning/LanguageAudio";
import UserAvatar, { type AvatarLayer } from "@/components/avatar/UserAvatar";
import { countryDiscoveries } from "@/lib/world/country-discoveries";
import { languageLocations } from "@/lib/world/languageLocations";
import type { WorldCourse, WorldLanguage } from "@/lib/world/data";
import DestinationDiscovery from "./DestinationDiscovery";
import styles from "./CountryLearningStage.module.css";

const greetings: Record<string, string> = { fr: "Bonjour", ja: "こんにちは", ko: "안녕하세요", zh: "你好", es: "Hola", de: "Hallo", th: "สวัสดี" };
const frenchPhrases = [
  { text: "Bonjour", meaning: "Hello / Good day", scene: "Step into a café", tip: "Start your café visit with a greeting." },
  { text: "Un café, s’il vous plaît.", meaning: "A coffee, please.", scene: "Order something", tip: "Listen, then say the whole phrase aloud." },
  { text: "Merci", meaning: "Thank you", scene: "Thank your host", tip: "Try to recall the word before looking at its meaning." },
];
type Props = { language: WorldLanguage; courses: WorldCourse[]; avatar: AvatarLayer[]; starting: boolean; error: string; onStart: () => void };
export default function CountryLearningStage({ language, courses, avatar, starting, error, onStart }: Props) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string[]>([]);
  const country = languageLocations[language.code]?.country ?? language.name;
  const discovery = countryDiscoveries[language.code];
  const phrases = language.code === "fr" ? frenchPhrases : [{ text: greetings[language.code] ?? language.native_name ?? language.name, meaning: "Hello", scene: "Your first conversation", tip: "Listen once, repeat aloud, then try saying it without reading." }];
  return <main className={styles.page}>
    <Link href="/world" className={styles.back}>Back to World</Link>
    <section className={styles.arrival}>
      {discovery && <Image src={discovery.image} alt={`Illustration of ${country}`} fill priority sizes="100vw" className={styles.scenery} />}
      <div className={styles.arrivalCopy}><p><MapPin size={15} />Destination unlocked · {language.flag_emoji}</p><h1>{language.code === "fr" ? "Bienvenue en France!" : `Welcome to ${country}!`}</h1><span>{language.name} · {language.native_name}</span><p className={styles.description}>You’ve arrived. Discover a story, try your first words, and take your next learning step.</p><button type="button" disabled={starting} onClick={onStart}>{starting ? "Preparing lessons…" : courses.length ? "Continue your course" : "Begin your journey"}</button></div>
      <div className={styles.traveler}><UserAvatar layers={avatar} transparent /><span>Your travel companion</span></div>
    </section>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <nav className={styles.steps} aria-label="Your arrival itinerary"><a href="#arrival-phrases"><b>01</b>Hear & say</a><a href="#arrival-culture"><b>02</b>Discover the culture</a><a href="#arrival-challenge"><b>03</b>Try it yourself</a></nav>
    <div className={styles.layout}><div>
      <section id="arrival-phrases" className={styles.section}><div className={styles.sectionHeading}><div><p>Your first five minutes</p><h2>{language.code === "fr" ? "A little café conversation" : "Say hello to your destination"}</h2></div><span>Listen · Repeat · Recall</span></div><div className={styles.phrases}>{phrases.map((phrase, index) => <article key={phrase.text} className={styles.phrase}><p className={styles.eyebrow}>{index + 1}. {phrase.scene}</p><h3>{phrase.text}</h3><LanguageAudio languageCode={language.code} text={phrase.text} hideText /><button type="button" className={styles.reveal} aria-expanded={revealed.includes(phrase.text)} onClick={() => setRevealed(previous => previous.includes(phrase.text) ? previous.filter(text => text !== phrase.text) : [...previous, phrase.text])}>{revealed.includes(phrase.text) ? phrase.meaning : "Reveal meaning"}</button><p className={styles.tip}>{phrase.tip}</p></article>)}</div></section>
      <section id="arrival-culture" className={styles.section}><div className={styles.sectionHeading}><div><p>Look beyond the postcard</p><h2>Stories from {country}</h2></div></div><div className={styles.culture}>
        {language.code === "fr" ? <><article><span>Landmark story</span><h3>A tower built for a world fair</h3><p>The Eiffel Tower was built for the 1889 World’s Fair in Paris. It became one of the exhibition’s biggest attractions.</p><a href="https://www.toureiffel.paris/en/the-monument/universal-exhibition" target="_blank" rel="noreferrer">Source: Official Eiffel Tower website</a></article><article><span>Living traditions</span><h3>A meal is more than food</h3><p>The gastronomic meal of the French is recognized by UNESCO as intangible cultural heritage. It celebrates gathering, sharing, and important moments in life.</p><a href="https://ich.unesco.org/en/RL/gastronomic-meal-of-the-frenchs-00437" target="_blank" rel="noreferrer">Source: UNESCO</a></article></> : discovery && <><article><span>History stop</span><h3>A glimpse into the past</h3><p>{discovery.history}</p></article><article><span>Language discovery</span><h3>Did you know?</h3><p>{discovery.trivia}</p></article></>}
      </div></section>
      <section id="arrival-challenge" className={`${styles.section} ${styles.challenge}`}><p className={styles.eyebrow}>Your first conversation challenge</p><h2>You’re greeting someone. What do you say?</h2><p>Choose the word that means “Hello.”</p><div className={styles.answers}>{[greetings[language.code] ?? "Hello", "Goodbye", "Thank you"].map(option => <button key={option} type="button" aria-pressed={answer === option} onClick={() => setAnswer(option)}>{option}</button>)}</div>{answer && <p role="status" className={styles.feedback}>{answer === (greetings[language.code] ?? "Hello") ? <><Check size={17} />Exactly! Try saying it aloud before continuing.</> : "That means something else. Listen to the greeting above and try again."}</p>}<small>A warm-up for your course. No XP or currency is awarded here.</small></section>
    </div><aside className={styles.sidebar}><section className={styles.plan}><p className={styles.eyebrow}>Make it stick</p><h2>A small daily routine</h2><ol><li><strong>Listen for one minute</strong><p>Notice the rhythm and sounds.</p></li><li><strong>Say three useful phrases</strong><p>Repeat them, then look away and recall them.</p></li><li><strong>Finish one lesson</strong><p>Put those words into guided practice.</p></li><li><strong>Come back tomorrow</strong><p>Recall yesterday’s phrases before learning new ones.</p></li></ol><button type="button" disabled={starting} onClick={onStart}>{starting ? "Loading…" : "Open my lessons"}</button></section>
    <section className={styles.saved}><h2>Your journey here</h2>{courses.length ? courses.map(course => <Link key={course.id} href={`/learn?course=${encodeURIComponent(course.id)}`}><strong>{course.title}</strong><span>{course.progress ? `${course.progress.completed_lessons} / ${course.progress.total_lessons} lessons completed` : "Open your roadmap"}</span></Link>) : <p>Your first course is ready to discover. Choose “Begin your journey” above.</p>}</section><details className={styles.more}><summary>Explore published courses</summary><DestinationDiscovery language={language} /></details></aside></div>
  </main>;
}
