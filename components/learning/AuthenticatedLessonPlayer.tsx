"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { loadAuthenticatedLesson, startAuthenticatedLesson, completeAuthenticatedLesson, type CompletionResult } from "@/lib/authenticated-lesson";

import { activitySteps, questionIsSupported, type LessonAnswer } from "@/lib/lesson-session";
import VocabularyCard from "./VocabularyCard";
import MatchingCards from "./MatchingCards";
import ActivityScreen from "./ActivityScreen";
import LevelProgress from "./LevelProgress";
import RewardIcons from "./RewardIcons";
import HeartStatus from "./HeartStatus";
import { useHearts } from "./useHearts";

import { levelProgress } from "@/lib/level-progress";
import styles from "./LessonExperience.module.css";
import { ArrivalRequired } from "@/lib/travel/access";
import travelStyles from "@/components/travel/Travel.module.css";

type LessonData = Awaited<ReturnType<typeof loadAuthenticatedLesson>> & { userId: string };
const button = "inline-flex items-center justify-center gap-2 rounded-full bg-[#071A4A] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#3558AE] disabled:cursor-not-allowed disabled:opacity-50";

export default function AuthenticatedLessonPlayer() {
  const params = useSearchParams();
  const lessonId = params.get("lesson") ?? "";
  const courseId = params.get("course");
  return <LessonSession key={`${courseId}:${lessonId}`} lessonId={lessonId} courseId={courseId} />;
}

function LessonSession({ lessonId, courseId }: { lessonId: string; courseId: string | null }) {
  const router = useRouter();
  const [data, setData] = useState<LessonData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [stage, setStage] = useState<"intro" | "learn" | "activities" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [account, setAccount] = useState<{ xp: number; level: number } | null>(null);
  const [startingLevel, setStartingLevel] = useState<number | null>(null);
  const [verifiedWordId, setVerifiedWordId] = useState<string | null>(null);

  const [activityIndex, setActivityIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<LessonAnswer[]>([]);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [gradedCorrect, setGradedCorrect] = useState<boolean | null>(null);
  const { data: heartData, countdown: heartCountdown } = useHearts();
  const busy = useRef(false);
  const steps = data ? activitySteps(data.activities, data.questions) : [];
  const activeStep = steps[activityIndex];
  const question = activeStep?.question;
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error && !isAuthSessionMissingError(error)) throw error;
        if (!user) { router.replace("/login"); return; }
        const content = await loadAuthenticatedLesson(supabase, user.id, lessonId, courseId);
        const profile = await supabase.from("profiles").select("xp,level").eq("id", user.id).maybeSingle();
        if (!cancelled && !profile.error && profile.data) {
          setAccount(profile.data); setStartingLevel(levelProgress(profile.data.xp, profile.data.level).level);
        }
        const access = await supabase.from("course_progress").update({ last_accessed_at: new Date().toISOString() })
          .eq("user_id", user.id).eq("course_id", content.course.id);
        if (access.error) throw new Error(`We couldn't save your active course: ${access.error.message}`);
        if (!cancelled) setData({ ...content, userId: user.id });
      } catch (cause) {
        if (cause instanceof ArrivalRequired) { if (!cancelled) router.replace(cause.href); return; }
        if (!cancelled) setLoadError(cause instanceof Error ? cause.message : "Unable to load this lesson.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [lessonId, courseId, router, attempt]);

  async function begin() {
    if (!data || busy.current) return;
    busy.current = true; setSaving(true); setSaveError("");
    try {
      await startAuthenticatedLesson(createClient(), data.userId, lessonId);
      setVerifiedWordId(null);

      setStage("learn");
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Unable to start the lesson."); }
    finally { busy.current = false; setSaving(false); }
  }

  async function next() {
    if (!data || busy.current) return;
    if (verifiedWordId !== data.words[index]?.id) return;

    if (index < data.words.length - 1) { setIndex(index + 1); return; }
    if (steps.length) { setStage("activities"); return; }
    await finish();
  }

  async function finish(finalAcknowledged = acknowledged) {
    if (!data || busy.current) return;
    busy.current = true; setSaving(true); setSaveError("");
    try {
      const saved = await completeAuthenticatedLesson(createClient(), data.userId, lessonId, data.questions.length ? { answers, acknowledged: finalAcknowledged } : undefined);
      setResult(saved); setStage("result");
      window.dispatchEvent(new Event("acelingua:balance-updated"));
      // A failed profile refresh must never turn a committed lesson into a save error.
      try {
        const fresh = await createClient().from("profiles").select("xp,level").eq("id", data.userId).maybeSingle();
        setAccount(fresh.error ? null : fresh.data);
      } catch { setAccount(null); }
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Unable to save this lesson. Please retry."); }
    finally { busy.current = false; setSaving(false); }
  }

  async function advanceActivity() {
    if (busy.current || !activeStep) return;
    const nextAcknowledged = question ? acknowledged : [...new Set([...acknowledged, activeStep.activity.id])];
    if (!question) setAcknowledged(nextAcknowledged);
    if (activityIndex < steps.length - 1) {
      setActivityIndex(activityIndex + 1); setAnswer(""); setChecked(false); setGradedCorrect(null); setSaveError("");
    } else await finish(nextAcknowledged);
  }
  async function checkAnswer() {
    if (!question || !answer.trim() || checked || busy.current) return;
    busy.current = true; setSaving(true); setSaveError("");
    try {
      const response = await fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId, questionId: question.id, answer }), signal: AbortSignal.timeout(15000) });
      const submitted = await response.json(); if (!response.ok) throw new Error(submitted.error);
      window.dispatchEvent(new Event("acelingua:balance-updated"));
      if (submitted.blocked) { setSaveError("No hearts left. Wait for the next heart before submitting this quiz answer. Expression practice remains free."); return; }
      setAnswer(submitted.answer);
      setAnswers(previous => [...previous.filter(item => item.question_id !== question.id), { question_id: question.id, answer: submitted.answer }]);
      setGradedCorrect(submitted.correct); setChecked(true);
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Your quiz answer could not be submitted. Please retry."); }
    finally { busy.current = false; setSaving(false); }
  }
  const savedCourseId = data?.course.id ?? courseId;
  const roadmapHref = savedCourseId ? "/learn?course=" + encodeURIComponent(savedCourseId) : "/learn";
  const word = data?.words[index];
  const available = Boolean(data?.words.length) && (data?.activities.length === 0 || Boolean(data?.questions.length)) && (data?.questions.every(questionIsSupported) ?? false);
  const wordCount = data?.words.length ?? 0;
  const total = wordCount + steps.length;
  const step = stage === "result" ? total : stage === "activities" ? wordCount + activityIndex : stage === "learn" ? index : 0;
  const leveledUp = account && startingLevel !== null && levelProgress(account.xp, account.level).level > startingLevel;
  return <main className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href={roadmapHref} className={styles.exit} aria-label="Exit lesson and return to roadmap"><ArrowLeft size={18} /><span>Roadmap</span></Link>
        <Link href="/dashboard" aria-label="ACELingua dashboard"><Image src="/logoace.png" alt="ACELingua" width={156} height={48} className={styles.logo} /></Link>
        <span className={styles.language}>{data?.language.name ?? "Your adventure"}</span>
      </header>
      <div className={styles.statusRow}>
        <HeartStatus />
        <div className={styles.sessionProgress}><div><span>{stage === "intro" ? "Ready for a new discovery?" : stage === "result" ? "Adventure complete" : stage === "activities" ? "Put it into practice" : "Discover new expressions"}</span><strong>{Math.min(step,total)} / {total}</strong></div><progress aria-label="Current lesson session progress" value={step} max={total || 1} /></div>
        {account && <LevelProgress xp={account.xp} level={account.level} />}
      </div>
      {loadError ? <section role="alert" className={styles.card}><h1>Lesson unavailable</h1><p>{loadError}</p><button className={button} onClick={() => { setLoadError(""); setAttempt(attempt + 1); }}>Retry</button><Link href={roadmapHref}>Return to journey</Link></section>
      : !data ? <div role="status" className={styles.loading}><Loader2 className="animate-spin" /><p>Preparing your lesson…</p></div>
      : stage === "result" && result ? <section className={styles.result}>
        <span className={styles.successIcon}><CheckCircle2 size={44} /></span><p className={styles.eyebrow}>{result.replay ? "A little more practice" : "Another discovery, beautifully done"}</p><h1>{result.replay ? "Welcome back, explorer!" : "Lesson complete!"}</h1><p>{data.lesson.title}</p>
        {Boolean(result.total_questions) && <div className={styles.accuracy}><strong>{result.correct_answers} / {result.total_questions}</strong><span>answers correct</span></div>}
        {result.replay ? <p className={styles.note}>Your review is complete. Standard lesson rewards are granted once.</p> : <RewardIcons xp={result.xp_awarded} coins={result.coins_awarded} earned />}
        {leveledUp && <p role="status" className={styles.levelUp}>Level up! You reached level {levelProgress(account.xp, account.level).level}.</p>}
        {account ? <div className={styles.resultLevel}><LevelProgress xp={account.xp} level={account.level} /></div> : <p className={styles.note}>Your lesson is saved. Your updated XP will appear when your account refreshes.</p>}
        <p className={styles.note}>{result.completed_lessons} / {result.total_lessons} course lessons completed</p>
        {Boolean(result.new_stamps) && <p role="status" className={travelStyles.arrived}>{result.new_stamps} new passport {result.new_stamps === 1 ? "stamp" : "stamps"} collected! <Link href="/passport">Open passport</Link></p>}
        {result.stamp_sync_pending && <p role="status" className={styles.note}>Your lesson and rewards are saved. Destination stamps will sync when you reopen your journey.</p>}
        <Link href={roadmapHref} className={button}>Continue journey <ArrowRight size={17} /></Link>
        <details className={styles.optional}><summary>Extra practice: match these expressions</summary><MatchingCards words={data.words} /></details>
      </section>
      : stage === "intro" ? <section className={styles.intro}>
        <div className={styles.introCopy}><span className={styles.destination}><MapPin size={15} />{data.unit.location_name || data.unit.title}</span><p className={styles.eyebrow}>Lesson {data.lesson.lesson_order} · {data.language.name}</p><h1>{data.lesson.title}</h1>{data.lesson.description && <p>{data.lesson.description}</p>}
          <div className={styles.lessonOutline}><span><BookOpen size={18} /><strong>{wordCount}</strong> expressions to discover</span>{data.questions.length > 0 && <span><CheckCircle2 size={18} /><strong>{data.questions.length}</strong> practice questions</span>}</div>
          {available ? <button className={button} disabled={saving} onClick={begin}>{saving ? <><Loader2 size={18} className="animate-spin" />Starting…</> : <>Let&apos;s begin <ArrowRight size={18} /></>}</button> : <p role="status" className={styles.note}>This lesson&apos;s learning activities are still being prepared. <Link href={roadmapHref}>Return to your journey</Link></p>}
        </div>
        <aside className={styles.introAside}><Image src="/icons/ace-chatbot.png" alt="Ace, your learning guide" width={170} height={170} /><h2>A little learning.<br />A new world.</h2><RewardIcons xp={data.lesson.xp_reward} coins={data.lesson.coin_reward} /><p>Rewards for your first completion.<br />Your progress saves when you finish.</p></aside>
      </section>
      : stage === "activities" && activeStep ? <div className={styles.activity}><ActivityScreen step={activeStep} words={data.words} languageCode={data.language.code} answer={answer} checked={checked} saving={saving} last={activityIndex === steps.length - 1} setAnswer={setAnswer} check={() => void checkAnswer()} gradedCorrect={gradedCorrect} outOfHearts={heartData?.hearts === 0} heartCountdown={heartCountdown} review={() => { setIndex(0); setVerifiedWordId(null); setStage("learn"); }} next={() => void advanceActivity()} /></div>
      : word && <section key={word.id} className={styles.wordCard}><p className={styles.eyebrow}>Expression {index + 1} of {wordCount} · Free practice</p><VocabularyCard key={word.id} word={word} languageCode={data.language.code} onSpeakingVerified={verified => setVerifiedWordId(verified ? word.id : null)} /><div className={styles.wordFooter}><span role="status">{verifiedWordId === word.id ? "Phrase matched. You can continue!" : "Say this phrase correctly to continue."}</span><button className={button} disabled={saving || verifiedWordId !== word.id} onClick={next}>{saving ? <><Loader2 size={18} className="animate-spin" />Saving…</> : <>{index === wordCount - 1 ? steps.length ? "Try it out" : "Finish lesson" : "Next expression"}<ArrowRight size={17} /></>}</button></div></section>}
      {saveError && <div role="alert" className={styles.saveError}><p>{saveError}</p><button type="button" onClick={() => { setStage("intro"); setIndex(0); setActivityIndex(0); setAnswers([]); setAcknowledged([]); setAnswer(""); setChecked(false); setSaveError(""); }}>Restart lesson</button></div>}
    </div>
  </main>;
}
