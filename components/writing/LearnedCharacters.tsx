"use client";
import Link from "next/link";
import type { StudioData } from "@/lib/writing/client";
import styles from "./WritingStudio.module.css";

export default function LearnedCharacters({ data, query }: { data: StudioData; query: string }) {
  const learnedIds = new Set(data.progress.filter(row => row.status === "learned" || row.status === "mastered").map(row => row.character_id));
  const total = data.characters.filter(character => learnedIds.has(character.id)).length;
  return <section className={styles.learnedCollection} aria-labelledby="learned-characters-title">
    <div className={styles.sectionHeading}><h2 id="learned-characters-title">Your learned characters</h2><span className={styles.badge}>{total} learned</span></div>
    <p>{data.local ? "Saved in this browser. Choose a character to review it." : "Saved to your account. Choose a character to review it."}</p>
    {total ? <div className={styles.learnedScroll}>{data.systems.map(system => {
      const characters = data.characters.filter(character => character.writing_system_id === system.id && learnedIds.has(character.id));
      return characters.length ? <section key={system.id}><h3>{system.name}</h3><div className={styles.learnedTiles}>{characters.map(character => {
        const progress = data.progress.find(row => row.character_id === character.id);
        return <Link key={character.id} href={`/writing/${encodeURIComponent(data.language.code)}/${encodeURIComponent(system.slug)}/${encodeURIComponent(character.slug)}?${query}`} aria-label={`Review ${character.character}, ${character.romanization}, ${progress?.status}`}><span lang={data.language.code}>{character.character}</span><small>{character.romanization}</small><small>{progress?.status === "mastered" ? "Mastered" : "Learned"}</small></Link>;
      })}</div></section> : null;
    })}</div> : <p>No learned characters yet. Finish writing practice and a correct review to add your first one automatically.</p>}
  </section>;
}
