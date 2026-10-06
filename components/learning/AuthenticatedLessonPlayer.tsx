"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Coins, Loader2, Sparkles } from "lucide-react";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { loadAuthenticatedLesson, startAuthenticatedLesson, completeAuthenticatedLesson, type CompletionResult } from "@/lib/authenticated-lesson";

import { activitySteps, questionIsSupported, type LessonAnswer } from "@/lib/lesson-session";
import ActivityScreen from "./ActivityScreen";

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
  const [activityIndex, setActivityIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<LessonAnswer[]>([]);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
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
        if (!cancelled) setData({ ...content, userId: user.id });
      } catch (cause) {
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
      setStage("learn");
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Unable to start the lesson."); }
    finally { busy.current = false; setSaving(false); }
  }

  async function next() {
    if (!data || busy.current) return;
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
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Unable to save this lesson. Please retry."); }
    finally { busy.current = false; setSaving(false); }
  }

  async function advanceActivity() {
    if (busy.current || !activeStep) return;
    const nextAcknowledged = question ? acknowledged : [...new Set([...acknowledged, activeStep.activity.id])];
    if (!question) setAcknowledged(nextAcknowledged);
    if (activityIndex < steps.length - 1) {
      setActivityIndex(activityIndex + 1); setAnswer(""); setChecked(false); setSaveError("");
    } else await finish(nextAcknowledged);
  }
  function checkAnswer() {
    if (!question || !answer.trim() || checked) return;
    setAnswers((previous) => [...previous.filter((item) => item.question_id !== question.id), { question_id: question.id, answer }]);
    setChecked(true);
  }
  const word = data?.words[index];
  const available = Boolean(data?.words.length) && (data?.activities.length === 0 || Boolean(data?.questions.length)) && (data?.questions.every(questionIsSupported) ?? false);
  const wordCount = data?.words.length ?? 0;
  const total = wordCount + steps.length;
  const step = stage === "result" ? total : stage === "activities" ? wordCount + activityIndex : stage === "learn" ? index : 0;
  return <main className="min-h-screen bg-[#EAF5FF] px-5 py-7 text-[#071A4A]">
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center gap-5"><Link href="/learn" aria-label="Exit lesson and return to roadmap" className="inline-flex shrink-0 items-center gap-2 rounded-full p-2 text-sm font-bold text-[#3558AE]"><ArrowLeft size={20} />Exit</Link><progress aria-label="Current lesson session progress" value={step} max={total || 1} className="h-3 flex-1 accent-[#3558AE]" /><span className="text-xs font-bold">{step} / {total}</span></header>
      {loadError ? <section role="alert" className="mt-12 rounded-3xl bg-white p-8"><h1 className="text-2xl font-bold">Lesson unavailable</h1><p className="mt-4 leading-7">{loadError}</p><button className={`${button} mt-6`} onClick={() => { setLoadError(""); setAttempt(attempt + 1); }}>Retry</button><Link href="/learn" className="ml-4 font-bold text-[#3558AE]">Return to journey</Link></section>
        : !data ? <div role="status" className="py-20 text-center"><Loader2 className="mx-auto animate-spin" /><p className="mt-4">Preparing your lesson...</p></div>
        : stage === "result" && result ? <section className="mt-12 rounded-[32px] bg-white p-8 text-center shadow-sm sm:p-12"><CheckCircle2 size={58} className="mx-auto text-[#3558AE]" /><p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#B64074]">{result.replay ? "Replay complete" : "Lesson complete"}</p><h1 className="mt-3 text-3xl font-extrabold">{data.lesson.title}</h1><p className="mt-4 text-sm text-[#071A4A]/60">You reviewed {wordCount} vocabulary {wordCount === 1 ? "item" : "items"}.</p>{Boolean(result.total_questions) && <p className="mt-4 text-xl font-bold">{result.correct_answers} / {result.total_questions} correct</p>}{result.replay ? <p className="mt-6 rounded-2xl bg-[#EAF5FF] p-4 text-sm">No additional standard reward for this replay.</p> : <div className="mt-6 flex justify-center gap-4"><span className="inline-flex items-center gap-2 rounded-2xl bg-[#C7A9D4]/30 p-4 font-bold"><Sparkles size={20} />+{result.xp_awarded} XP</span><span className="inline-flex items-center gap-2 rounded-2xl bg-[#F9C3D7]/35 p-4 font-bold"><Coins size={20} />+{result.coins_awarded} coins</span></div>}<p className="mt-5 text-xs text-[#071A4A]/60">{result.completed_lessons} / {result.total_lessons} course lessons completed</p><Link href="/learn" className={`${button} mt-8`}>Continue Journey<ArrowRight size={18} /></Link></section>
        : stage === "intro" ? <section className="mt-12 rounded-[32px] bg-white p-8 shadow-sm sm:p-12"><p className="text-xs font-bold uppercase tracking-widest text-[#3558AE]">Unit {data.unit.unit_order} · {data.unit.title}</p><p className="mt-6 text-sm font-bold text-[#B64074]">Lesson {data.lesson.lesson_order}</p><h1 className="mt-2 text-3xl font-extrabold">{data.lesson.title}</h1>{data.lesson.description && <p className="mt-4 leading-7 text-[#071A4A]/65">{data.lesson.description}</p>}<p className="mt-6 flex flex-wrap gap-4 text-sm font-bold"><span className="inline-flex items-center gap-2"><Sparkles size={18} />{data.lesson.xp_reward} XP</span><span className="inline-flex items-center gap-2"><Coins size={18} />{data.lesson.coin_reward} coins</span></p>{available ? <><p className="mt-6 text-sm leading-6 text-[#071A4A]/60">Learn {wordCount} vocabulary {wordCount === 1 ? "item" : "items"}{data.questions.length ? " and attempt " + data.questions.length + " practice questions" : ""}. Standard rewards are earned on your first completion.</p><button className={`${button} mt-8`} disabled={saving} onClick={begin}>{saving ? <><Loader2 size={18} className="animate-spin" />Starting...</> : <>Start lesson<ArrowRight size={18} /></>}</button></> : <div role="status" className="mt-7 rounded-2xl bg-[#EAF5FF] p-5 text-sm leading-7">{data.activities.length ? `This lesson has ${data.activities.length} activities and ${data.questions.length} questions. Questions are missing or use a format this player cannot assess yet.` : "Learning content for this lesson is not available yet."}<Link href="/learn" className="mt-3 block font-bold text-[#3558AE]">Return to journey</Link></div>}</section>
        : stage === "activities" && activeStep ? <ActivityScreen step={activeStep} words={data.words} languageCode={data.language.code} answer={answer} checked={checked} saving={saving} last={activityIndex === steps.length - 1} setAnswer={setAnswer} check={checkAnswer} next={() => void advanceActivity()} />
        : word && <section key={word.id} className="mt-12 rounded-[32px] bg-white p-8 text-center shadow-sm sm:p-12"><BookOpen className="mx-auto text-[#3558AE]" size={30} /><p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#B64074]">Learn this expression · {index + 1} / {wordCount}</p><h1 lang={data.language.code} className="mt-8 break-words text-4xl font-extrabold sm:text-5xl">{word.word}</h1><p className="mt-3 text-sm text-[#3558AE]">{word.pronunciation}</p><p className="mt-5 text-2xl text-[#071A4A]/75">{word.translation}</p>{word.example_sentence && <div className="mt-6 rounded-2xl bg-[#EAF5FF] p-4"><p lang={data.language.code}>{word.example_sentence}</p><p className="mt-2 text-sm">{word.example_translation}</p></div>}<button className={`${button} mt-12`} disabled={saving} onClick={next}>{saving ? <><Loader2 size={18} className="animate-spin" />Saving...</> : <>{index === wordCount - 1 ? steps.length ? "Start activities" : "Finish lesson" : "Continue"}<ArrowRight size={18} /></>}</button></section>}
      {saveError && <p role="alert" className="mt-6 rounded-2xl border border-[#B64074]/20 bg-white p-5 text-sm leading-6 text-[#B64074]">{saveError}</p>}
    </div>
  </main>;
}
