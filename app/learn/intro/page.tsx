"use client";

import Image from "next/image";
import Logo from "@/components/Logo";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { readPreview } from "@/lib/guest-preview";
import PreviewWordCard from "@/components/learning/PreviewWordCard";
import GuestPreviewActivities from "@/components/learning/GuestPreviewActivities";

type Language = { id: string; code: string; name: string; native_name: string | null; flag_emoji: string | null };
type Course = { id: string; title: string; description: string | null; level: string | null };
type Unit = { id: string; title: string; description: string | null; unit_order: number; location_name: string | null };
type Lesson = { id: string; title: string; description: string | null; lesson_order: number; xp_reward: number; coin_reward: number };
type Word = { id: string; word: string; pronunciation: string | null; translation: string; example_sentence: string | null; example_translation: string | null };
type Intro = { language: Language; course: Course; unit: Unit; lesson: Lesson; words: Word[] };
type Stage = "welcome" | "learn" | "practice" | "complete";

const buttonStyle = "inline-flex items-center justify-center gap-2 rounded-full bg-[#071A4A] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3558AE] disabled:cursor-not-allowed disabled:opacity-50";

function Loading() {
  return <div role="status" className="mx-auto flex max-w-sm flex-col items-center py-20 text-center"><Loader2 className="animate-spin text-[#3558AE]" size={30} /><p className="mt-4 text-sm">Loading your first lesson...</p></div>;
}

export default function IntroPage() {
  return <main className="min-h-screen bg-[#EAF5FF] px-5 py-6 text-[#071A4A]">
    <header className="mx-auto flex max-w-2xl items-center justify-between">
      <Link href="/onboarding/languages" aria-label="Back to languages" className="rounded-full p-3 transition hover:bg-white"><ArrowLeft size={22} /></Link>
      <Link href="/" aria-label="ACELINGUA home" className="flex shrink-0 items-center justify-center"><Logo alt="ACELINGUA Logo" priority className="h-11 w-auto shrink-0 object-contain" /></Link>
    </header>
    <Suspense fallback={<Loading />}><IntroSelection /></Suspense>
  </main>;
}

function IntroSelection() {
  const code = useSearchParams().get("language") ?? "";
  const [storedCode, setStoredCode] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      try { setStoredCode(localStorage.getItem("acelingua_selected_language") ?? ""); }
      catch { setStoredCode(""); }
    });
    return () => { cancelled = true; };
  }, []);
  if (!code && storedCode === null) return <Loading />;
  const selected = code || storedCode || "";
  return <IntroExperience key={selected} code={selected} />;
}

function IntroExperience({ code }: { code: string }) {
  const [data, setData] = useState<Intro | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<Stage>("welcome");
  const [wordIndex, setWordIndex] = useState(0);
  const [wordChecked, setWordChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!code.trim()) throw new Error("Choose a language first so Ace can prepare your preview.");
        const supabase = createClient();
        const languageResult = await supabase.from("languages").select("id, code, name, native_name, flag_emoji").eq("code", code).eq("is_active", true).maybeSingle();
        if (languageResult.error) throw languageResult.error;
        if (!languageResult.data) throw new Error("This language isn't available right now. Please choose another language.");
        const language: Language = languageResult.data;
        const courseResult = await supabase.from("courses").select("id, title, description, level").eq("language_id", language.id).eq("is_published", true).order("created_at").order("id");
        if (courseResult.error) throw courseResult.error;
        const courses: Course[] = courseResult.data ?? [];
        if (!courses.length) throw new Error(`A published course for ${language.name} isn't available yet.`);
        const course = courses.find((item) => item.level?.trim().toLowerCase() === "beginner") ?? (courses.length === 1 ? courses[0] : undefined);
        if (!course) throw new Error(`We couldn't identify a starting course for ${language.name}. Please check back soon.`);
        const unitResult = await supabase.from("units").select("id, title, description, unit_order, location_name").eq("course_id", course.id).eq("is_published", true).order("unit_order").order("id").limit(1).maybeSingle();
        if (unitResult.error) throw unitResult.error;
        if (!unitResult.data) throw new Error("This course doesn't have a published unit yet. Please check back soon.");
        const unit: Unit = unitResult.data;
        const lessonResult = await supabase.from("lessons").select("id, title, description, lesson_order, xp_reward, coin_reward").eq("unit_id", unit.id).eq("is_published", true).order("lesson_order").order("id").limit(1).maybeSingle();
        if (lessonResult.error) throw lessonResult.error;
        if (!lessonResult.data) throw new Error("The first unit doesn't have a published lesson yet. Please check back soon.");
        const lesson: Lesson = lessonResult.data;
        const wordResult = await supabase.from("vocabulary").select("id, word, pronunciation, translation, example_sentence, example_translation").eq("lesson_id", lesson.id).order("id");
        if (wordResult.error) throw wordResult.error;
        if (!wordResult.data?.length) throw new Error("This preview has no vocabulary yet. Please choose another language.");
        if (!cancelled) {
          setData({ language, course, unit, lesson, words: wordResult.data });
          const saved = readPreview();
          if (saved?.lessonId === lesson.id && saved.answers.length) setStage(saved.completed ? "complete" : "practice");
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load your preview. Please try again shortly.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [code]);

  if (error) return <section role="alert" className="mx-auto mt-12 max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-extrabold">Your preview is unavailable</h1><p className="mt-4 leading-7">{error}</p><Link className={`${buttonStyle} mt-6`} href="/onboarding/languages">Back to languages</Link></section>;
  if (!data) return <Loading />;

  const word = data.words[wordIndex];
  const steps: Stage[] = ["welcome", "learn", "practice", "complete"];
  const stepIndex = steps.indexOf(stage);

  function afterLearning() { setStage("practice"); }

  return <section className="mx-auto mt-6 max-w-2xl pb-10">
    <ol aria-label="Preview progress" className="mb-8 grid grid-cols-4 gap-2">{steps.map((step, index) => <li key={step} aria-current={stage === step ? "step" : undefined} className="text-center text-xs font-semibold capitalize"><div className={`mb-2 h-2 rounded-full ${index <= stepIndex ? "bg-[#3558AE]" : "bg-[#C7A9D4]/35"}`} />{step}</li>)}</ol>
    <div className="rounded-3xl border border-white bg-white p-6 shadow-[0_12px_40px_rgba(7,26,74,0.08)] sm:p-10">
      <div className="mb-7 flex items-center gap-4"><Image src="/icon head.png" alt="Ace, your learner guide" width={80} height={80} className="h-16 w-16 shrink-0 object-contain" /><p className="rounded-2xl bg-[#EAF5FF] px-4 py-3 text-sm leading-6">{stage === "welcome" ? `Ready for your first ${data.language.name} lesson?` : stage === "complete" ? "Great start! Keep exploring with me." : "Take your time. Every phrase is a step forward!"}</p></div>
      <p className="text-xs font-bold uppercase tracking-wider text-[#3558AE]">{data.language.flag_emoji} {data.language.name} {data.language.native_name && `· ${data.language.native_name}`}</p>
      {stage === "welcome" && <>
        <h1 className="mt-3 text-3xl font-extrabold">Your first {data.language.name} lesson</h1>
        <p className="mt-4 font-semibold">{data.course.title}</p><p className="mt-1 text-sm text-[#071A4A]/60">{data.unit.location_name ? `${data.unit.location_name} · ` : ""}{data.unit.title}</p>
        <h2 className="mt-6 text-xl font-bold">{data.lesson.title}</h2>
        {(data.lesson.description || data.course.description) && <p className="mt-3 leading-7 text-[#071A4A]/65">{data.lesson.description || data.course.description}</p>}
        <p className="mt-4 text-sm text-[#071A4A]/60">Try a short preview before creating your account.</p>
        <button type="button" className={`${buttonStyle} mt-7`} onClick={() => setStage("learn")}>Start <ArrowRight size={17} /></button>
      </>}
      {stage === "learn" && <>
        <h1 className="mt-3 text-2xl font-extrabold">{word ? "Learn this phrase" : data.lesson.title}</h1>
        {word ? <div className="mt-6 text-center">
          <p className="text-xs text-[#071A4A]/55">Phrase {wordIndex + 1} of {data.words.length}</p>
          <PreviewWordCard key={word.id} word={word} words={data.words} languageCode={data.language.code} onChecked={() => setWordChecked(true)} />
        </div> : null}
        <button type="button" disabled={Boolean(word) && !wordChecked} className={`${buttonStyle} mt-7`} onClick={() => { setWordChecked(false); if (word && wordIndex < data.words.length - 1) setWordIndex(wordIndex + 1); else afterLearning(); }}>{word && wordIndex < data.words.length - 1 ? "Next phrase" : "Continue to practice"}<ArrowRight size={17} /></button>
      </>}
      {(stage === "practice" || stage === "complete") && <GuestPreviewActivities languageId={data.language.id} languageCode={data.language.code} courseId={data.course.id} lessonId={data.lesson.id} words={data.words} onComplete={() => setStage("complete")} />}
    </div>
  </section>;
}
