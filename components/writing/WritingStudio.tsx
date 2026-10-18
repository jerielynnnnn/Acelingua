"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Check, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageAudio from "@/components/learning/LanguageAudio";
import { loadWritingStudio, saveWritingPractice, type StudioData } from "@/lib/writing/client";
import { safeWritingReturn, writingSummary, type CharacterProgress, type WritingCharacter } from "@/lib/writing/types";
import WritingCanvas from "./WritingCanvas";
import StrokeDemonstration from "./StrokeDemonstration";
import CharacterQuiz from "./CharacterQuiz";
import WorkbookOverview from "./WorkbookOverview";
import styles from "./WritingStudio.module.css";

type Props = { languageCode: string; systemSlug?: string; characterSlug?: string };
export default function WritingStudio(props: Props) {
  return <Studio key={props.languageCode} {...props} />;
}
function Studio({ languageCode, systemSlug, characterSlug }: Props) {
  const params = useSearchParams();
  const course = params.get("course");
  const returnTo = safeWritingReturn(params.get("returnTo"), course);
  const query = new URLSearchParams({ returnTo, ...(course ? { course } : {}) }).toString();
  const [data, setData] = useState<StudioData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState(systemSlug ?? "");
  useEffect(() => {
    let cancelled = false;
    loadWritingStudio(languageCode).then(result => { if (!cancelled) setData(result); }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't open the Writing Studio. Please retry.");
    });
    return () => { cancelled = true; };
  }, [languageCode, attempt]);
  const home = `/writing/${encodeURIComponent(languageCode)}?${query}`;
  const system = data?.systems.find(item => item.slug === (systemSlug ?? selected)) ?? (!systemSlug ? data?.systems[0] : undefined);
  const characters = data?.characters.filter(c => c.writing_system_id === system?.id) ?? [];
  const character = characters.find(c => c.slug === characterSlug);
  const href = (item: WritingCharacter) => `/writing/${encodeURIComponent(languageCode)}/${system!.slug}/${item.slug}?${query}`;
  const summary = data ? writingSummary(characters, data.progress) : null;
  const next = characters.find(item => !data?.progress.some(row => row.character_id === item.id && row.status === "mastered")) ?? characters[0];
  const recent = data?.progress.filter(row => characters.some(c => c.id === row.character_id)).sort((a,b) => (b.last_practiced_at ?? "").localeCompare(a.last_practiced_at ?? ""))[0];
  const continueCharacter = recent && recent.status !== "mastered" ? characters.find(c => c.id === recent.character_id) ?? next : next;
  return <main className={styles.page}>
    <header className={styles.header}><Link href={characterSlug ? home : returnTo} className={styles.back}><ArrowLeft size={18} />{characterSlug ? "Studio home" : "Back to roadmap"}</Link><Link href="/dashboard" aria-label="ACELingua dashboard"><Logo alt="ACELingua" className="h-auto w-40" /></Link></header>
    {error ? <section className={styles.card} role="alert"><h1>Studio unavailable</h1><p>{error}</p><button type="button" onClick={() => { setError(""); setData(null); setAttempt(attempt + 1); }}>Retry</button></section>
      : !data ? <p role="status" className={styles.loading}><Loader2 className="animate-spin" /> Preparing your writing desk...</p>
      : <>
        <div className={styles.hero}><span className={styles.badge}><BookOpen size={17} /> {data.language.name}</span><h1>Alphabet &amp; Writing Studio</h1><p>A little reading, a little listening, a little writing. Explore at your own pace.</p></div>
        <p role="status" className={styles.notice}>{data.local ? "Practice is saved in this browser only. It is separate from your course progress." : "Writing progress is saved to your account, separately from course lessons and rewards."}</p>
        {!data.systems.length ? <section className={styles.card}><h2>More writing systems are on the way</h2><p>Reviewed writing content for this language has not been published yet.</p></section>
          : characterSlug ? character && system ? <>
            <CharacterPractice key={character.id} data={data} character={character} characters={characters} onSaved={row => setData(current => current ? { ...current, progress: [...current.progress.filter(p => p.character_id !== row.character_id), row] } : current)} />
            <nav className={styles.characterNav} aria-label="Character navigation">
              {characters.indexOf(character) > 0 ? <Link href={href(characters[characters.indexOf(character) - 1])}><ArrowLeft size={18} /> Previous character</Link> : <span />}
              {characters.indexOf(character) < characters.length - 1 ? <Link href={href(characters[characters.indexOf(character) + 1])}>Next character <ArrowRight size={18} /></Link> : <Link href={home}>Back to character grid</Link>}
            </nav>
          </> : <section className={styles.card}><h2>Character not found</h2><Link href={home}>Return to the character grid</Link></section>
          : <>
            {languageCode === "ja" && <WorkbookOverview data={data} query={query} />}
            <div className={styles.systems} role="group" aria-label="Writing systems">{data.systems.map(item => {
              const entries = data.characters.filter(c => c.writing_system_id === item.id);
              const stats = writingSummary(entries, data.progress);
              return <button type="button" key={item.id} aria-pressed={system?.id === item.id} onClick={() => setSelected(item.slug)} className={system?.id === item.id ? styles.activeSystem : ""}>
                <span className={styles.systemGlyph} aria-hidden="true">{entries[0]?.character ?? <BookOpen size={28} />}</span><strong>{item.name}</strong><span>{item.description}</span>
                {entries.length ? <><span>{stats.learned} / {entries.length} learned · {stats.mastery}% recall mastery</span><progress aria-label={`${item.name} recall mastery`} value={stats.mastery} max={100} /></> : <span>Content in preparation</span>}
              </button>;
            })}</div>
            <section className={styles.card}><div className={styles.sectionHeading}><div><h2>{system?.name}</h2><p>{summary?.learned ?? 0} characters learned · {summary?.mastery ?? 0}% recall mastery</p></div>{continueCharacter && <Link className={styles.primary} href={href(continueCharacter)}>Continue Learning <ArrowRight size={17} /></Link>}</div>
              <p>Complete a recall check and tracing practice to learn a character. Four saved practices build 100% recall mastery; this does not measure handwriting accuracy.</p>
              {characters.length ? [...new Set(characters.map(c => c.group))].map(group => <section key={group} className={styles.characterGroup}><h3>{group}</h3><div className={styles.characterGrid}>
                {characters.filter(c => c.group === group).map(item => {
                  const progress = data.progress.find(row => row.character_id === item.id);
                  return <Link key={item.id} href={href(item)} className={progress?.status === "mastered" ? styles.mastered : ""} aria-label={`${item.character}, ${item.romanization}, ${progress?.status ?? "not started"}`}>
                    <span lang={languageCode}>{item.character}</span><small>{item.romanization}</small><span className={styles.tileStatus}>{progress?.status && progress.status !== "learning" ? <><Check size={12} /> {progress.status}</> : progress ? "Practicing" : "New"}</span>
                  </Link>;
                })}
              </div></section>) : <p>Reviewed characters for this category are being prepared.</p>}
            </section>
          </>}
      </>}
  </main>;
}

function CharacterPractice({ data, character, characters, onSaved }: { data: StudioData; character: WritingCharacter; characters: WritingCharacter[]; onSaved: (row: CharacterProgress) => void }) {
  const isKanji = data.language.code === "ja" && data.systems.some(system => system.id === character.writing_system_id && system.slug === "kanji");
  const [drawn, setDrawn] = useState(false);
  const [independentDrawn, setIndependentDrawn] = useState(false);
  const [onPaper, setOnPaper] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  async function save() {
    if (inFlight.current || saved || !correct || !((drawn && independentDrawn) || onPaper)) return;
    inFlight.current = true;
    setSaving(true); setError("");
    try { const row = await saveWritingPractice(data, character.id, correct, drawn || onPaper); onSaved(row); setSaved(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "We couldn't save this practice. Please retry."); }
    finally { inFlight.current = false; setSaving(false); }
  }
  return <>
    <section className={styles.characterHero}><div className={styles.largeCharacter} lang={data.language.code}>{character.character}</div><div><span className={styles.badge}>{data.systems.find(system => system.id === character.writing_system_id)?.name}</span><p className={styles.reading}>{character.romanization}</p><h2>{character.meaning}</h2><p>{isKanji ? "This Kanji carries meaning. Learn its reading in the example word and context." : "This Kana represents a sound rather than normally having its own English word meaning. Combine it with other characters to make words."}</p>{character.note && <p>{character.note}</p>}
      {character.example_word ? <p><strong lang={data.language.code}>{character.example_word}</strong> — {character.example_translation}</p> : <p>Example vocabulary is being prepared.</p>}
      <LanguageAudio languageCode={data.language.code} text={isKanji && character.example_word ? character.example_word : character.character} />
      {character.example_word && !isKanji && <><p>Hear the example word:</p><LanguageAudio languageCode={data.language.code} text={character.example_word} /></>}
      <p>{isKanji ? "Audio plays the example word; Kanji readings depend on context." : "Listen to the character, then try the example."}</p>
    </div></section>
    <div className={styles.practiceGrid}><StrokeDemonstration character={character} /><WritingCanvas character={character.character} onDrawn={setDrawn} /></div>
    <WritingCanvas character={character.character} onDrawn={setIndependentDrawn} independent />
    <CharacterQuiz character={character} characters={characters} languageCode={data.language.code} onResult={setCorrect} />
    <section className={styles.card}><h2>Save this practice</h2><label><input type="checkbox" checked={onPaper} onChange={event => setOnPaper(event.target.checked)} /> I completed guided and independent writing on paper instead.</label>
      <p>{correct ? "Recall check complete." : "Answer a review question correctly."} {(drawn && independentDrawn) || onPaper ? "Guided and independent practice complete." : "Trace above, then write without a guide, or practice on paper."}</p>
      <button type="button" className={styles.primary} disabled={saving || saved || !correct || !((drawn && independentDrawn) || onPaper)} onClick={() => void save()}>{saving ? "Saving..." : saved ? "Practice saved" : "Save practice"}</button>
      {saved && <p role="status">Nice work! {data.local ? "Saved in this browser." : "Saved to your account."} Return later for another review.</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  </>;
}
