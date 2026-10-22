"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, X } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageAudio from "@/components/learning/LanguageAudio";
import { loadWritingStudio, saveWritingPractice, type StudioData } from "@/lib/writing/client";
import { safeWritingReturn, type CharacterProgress, type WritingCharacter } from "@/lib/writing/types";
import WritingCanvas from "./WritingCanvas";
import StrokeDemonstration from "./StrokeDemonstration";
import CharacterQuiz from "./CharacterQuiz";
import CharacterContext from "./CharacterContext";
import WorkbookOverview from "./WorkbookOverview";
import LearnedCharacters from "./LearnedCharacters";
import styles from "./WritingStudio.module.css";

type Props = { languageCode: string; systemSlug?: string; characterSlug?: string };
export default function WritingStudio(props: Props) { return <Studio key={props.languageCode} {...props} />; }
function Studio({ languageCode, systemSlug, characterSlug }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const course = params.get("course");
  const returnTo = safeWritingReturn(params.get("returnTo"), course);
  const query = new URLSearchParams({ returnTo, ...(course ? { course } : {}) }).toString();
  const [data, setData] = useState<StudioData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState(systemSlug ?? params.get("system") ?? "");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let cancelled = false;
    loadWritingStudio(languageCode).then(result => { if (!cancelled) setData(result); }).catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load writing content."); });
    return () => { cancelled = true; };
  }, [languageCode, attempt]);
  const home = `/writing/${encodeURIComponent(languageCode)}?${query}`;
  const system = data?.systems.find(item => item.slug === (systemSlug ?? selected));
  const characters = data?.characters.filter(c => c.writing_system_id === system?.id) ?? [];
  const character = characters.find(c => c.slug === characterSlug);
  const lettersHome = system ? `${home}&system=${encodeURIComponent(system.slug)}` : home;
  useEffect(() => { if (data && system && !characterSlug) dialog.current?.showModal(); else dialog.current?.close(); }, [data, system, characterSlug]);
  return <main className={`${styles.page} ${styles.studioViewport}`}>
    <header className={styles.header}><Link href={returnTo} className={styles.back}><ArrowLeft size={18} /> Back</Link><Link href="/dashboard" aria-label="ACELingua dashboard"><Logo alt="ACELingua" className="h-auto w-32" /></Link><Link href={home} className={styles.back}>Change alphabet</Link></header>
    {error ? <section className={styles.card} role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); setAttempt(attempt + 1); }}>Retry</button></section> : !data ? <p role="status" className={styles.loading}><Loader2 className="animate-spin" /> Preparing your writing desk...</p> : <>
      <div className={styles.studioTitle}><div><h1>Alphabet &amp; Writing</h1><p>{data.language.name}{character ? ` · ${system?.name}` : " · Find your writing rhythm."}</p></div>{character && <Link href={lettersHome} className={styles.back}>All characters</Link>}</div>
      {characterSlug ? character ? <CharacterPractice key={character.id} data={data} character={character} characters={characters} onSaved={row => {
        setData(current => current ? { ...current, progress: [...current.progress.filter(p => p.character_id !== row.character_id), row] } : current);
        const nextCharacter = characters[characters.findIndex(item => item.id === character.id) + 1];
        router.replace(nextCharacter && system ? "/writing/" + encodeURIComponent(languageCode) + "/" + encodeURIComponent(system.slug) + "/" + encodeURIComponent(nextCharacter.slug) + "?" + query : lettersHome);
      }} /> : <section className={styles.card}><h2>Character not found</h2><Link href={home}>Choose an alphabet</Link></section> : <div className={styles.alphabetDesk}>
        <h2>What would you like to explore?</h2>
        <div className={styles.systems}>{data.systems.map(item => { const entries = data.characters.filter(c => c.writing_system_id === item.id); return <button type="button" key={item.id} onClick={() => setSelected(item.slug)}><span className={styles.systemGlyph}>{entries[0]?.character ?? "Aa"}</span><strong>{item.name}</strong><span>{item.description}</span><span>{entries.length ? `${entries.length} characters` : "In preparation"}</span></button>; })}</div>
        {!data.systems.length && <p>Writing content is being prepared.</p>}
        {(languageCode === "ja" || languageCode === "ko") && <details className={styles.optionalWorkbook} open={languageCode === "ko"}><summary>{data.language.name} writing workbook</summary><WorkbookOverview data={data} query={query} /></details>}
        {languageCode === "ja" && <LearnedCharacters data={data} query={query} />}
      </div>}
      <p className={styles.storageNote}>{data.local ? "Progress saves in this browser." : "Progress saves to your account."}</p>
      <dialog ref={dialog} className={styles.letterDialog} onClose={() => setSelected("")} aria-labelledby="alphabet-title">
        <div className={styles.dialogHeading}><div><h2 id="alphabet-title">{system?.name}</h2><p>Listen to a sound, or choose a character to practice.</p></div><button type="button" aria-label="Change alphabet" onClick={() => dialog.current?.close()}>Change alphabet <X size={16} /></button></div>
        <div className={styles.dialogLetters}>{characters.length ? [...new Set(characters.map(c => c.group))].map(group => <section key={group} className={styles.characterGroup}><h3>{group}</h3><div className={styles.letterTiles}>{characters.filter(c => c.group === group).map(item => <div key={item.id} className={styles.letterTile}><Link href={`/writing/${encodeURIComponent(languageCode)}/${system!.slug}/${item.slug}?${query}`} aria-label={`${item.character}, ${item.romanization}, practice`}><span lang={languageCode}>{item.character}</span><small>{item.romanization}</small></Link><LanguageAudio compact languageCode={languageCode} text={system?.slug === "kanji" && item.example_word ? item.example_word : item.character} /></div>)}</div></section>) : <p>Characters for this alphabet are being prepared.</p>}</div>
      </dialog>
    </>}
  </main>;
}

function CharacterPractice({ data, character, characters, onSaved }: { data: StudioData; character: WritingCharacter; characters: WritingCharacter[]; onSaved: (row: CharacterProgress) => void }) {
  const [stage, setStage] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const [independentDrawn, setIndependentDrawn] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const isKanji = data.systems.some(s => s.id === character.writing_system_id && s.slug === "kanji");
  const save = useCallback(async (reviewCorrect = correct) => {
    if (inFlight.current || saved || !reviewCorrect || !drawn || !independentDrawn) return;
    inFlight.current = true; setSaving(true); setError("");
    try { const row = await saveWritingPractice(data, character.id, reviewCorrect, drawn); setSaved(true); onSaved(row); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save. Please retry."); }
    finally { inFlight.current = false; setSaving(false); }
  }, [saved, correct, drawn, independentDrawn, data, character.id, onSaved]);
  return <div className={styles.practiceShell}>
    <div className={styles.practiceBody}>
      <div hidden={stage !== 0}><section className={styles.characterHero}><div className={styles.largeCharacter} lang={data.language.code}>{character.character}</div><div><p className={styles.reading}>{character.romanization}</p><h2>{character.meaning}</h2>{character.note && <p>{character.note}</p>}<LanguageAudio compact languageCode={data.language.code} text={isKanji && character.example_word ? character.example_word : character.character} />{character.example_word && <p><strong lang={data.language.code}>{character.example_word}</strong> — {character.example_translation}</p>}{character.example_word && !isKanji && <LanguageAudio compact languageCode={data.language.code} text={character.example_word} />}{isKanji && <p>Kanji readings depend on the word. Audio plays the example word.</p>}</div></section><CharacterContext character={character} languageCode={data.language.code} systemSlug={data.systems.find(s => s.id === character.writing_system_id)?.slug} /></div>
      <div hidden={stage !== 1}><div className={styles.practiceGrid}><StrokeDemonstration compact character={character} /><WritingCanvas character={character.character} onDrawn={setDrawn} /></div></div>
      <div hidden={stage !== 2}><WritingCanvas character={character.character} onDrawn={setIndependentDrawn} independent /></div>
      <div hidden={stage !== 3}><CharacterQuiz character={character} characters={characters} languageCode={data.language.code} onResult={result => { setCorrect(result); if (result) void save(true); }} /><div className={styles.saveStatus} role="status">{saving ? "Saving your practice…" : saved ? "Practice saved. Well done!" : "Your practice saves automatically after a correct review."}{error && <><p role="alert">{error}</p><button type="button" onClick={() => void save()}>Retry saving</button></>}</div></div>
    </div>
    <div className={styles.stageActions}>{stage > 0 && <button type="button" disabled={saving} onClick={() => setStage(stage - 1)}><ArrowLeft size={16} /> Back</button>}{stage < 3 && <button type="button" className={styles.primary} disabled={stage === 1 ? !drawn : stage === 2 ? !independentDrawn : false} onClick={() => setStage(stage + 1)}>{stage === 0 ? "Try writing" : stage === 1 ? "Write on your own" : "Review"}<ArrowRight size={16} /></button>}</div>
  </div>;
}
