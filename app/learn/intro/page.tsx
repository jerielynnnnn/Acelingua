"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Language = { id: string; code: string; name: string; native_name: string | null; flag_emoji: string | null };
type Course = { id: string; title: string; description: string | null; level: string | null };
type Unit = { id: string; title: string; description: string | null; unit_order: number; location_name: string | null };
type Lesson = { id: string; title: string; description: string | null; lesson_order: number; xp_reward: number; coin_reward: number };
type Word = { id: string; word: string; pronunciation: string | null; translation: string; example_sentence: string | null; example_translation: string | null };
type Activity = { id: string; title: string; instructions: string | null; activity_type: string; activity_order: number };
type Question = { id: string; activity_id: string; question_text: string; question_type: string; correct_answer: string; options: unknown; explanation: string | null; question_order: number };
type Intro = { language: Language; course: Course; unit: Unit; lesson: Lesson; words: Word[]; activities: Activity[]; questions: Question[] };
type Stage = "welcome" | "learn" | "practice" | "complete";
const buttonStyle = "inline-flex items-center justify-center gap-2 rounded-full bg-[#071A4A] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3558AE] disabled:cursor-not-allowed disabled:opacity-50";

// Only use database options that can be displayed and checked unambiguously.
function choicesFor(question: Question): string[] {
  let options = question.options;
  if (typeof options === "string") {
    try { options = JSON.parse(options); } catch { return []; }
  }
  if (!Array.isArray(options) || !options.every((option) => typeof option === "string")) return [];
  const choices = [...new Set(options as string[])].filter((option) => option.trim());
  return choices.length >= 2 && choices.includes(question.correct_answer) ? choices : [];
}

function Loading() {
  return <div role="status" className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-[#3558AE]" size={30} /><p className="mt-4">Loading your first lesson...</p></div>;
}

export default function IntroPage() {
  return <main className="min-h-screen bg-[#EAF5FF] px-5 py-6 text-[#071A4A]">
    <header className="mx-auto flex max-w-2xl items-center justify-between">
      <Link href="/onboarding/languages" aria-label="Back to languages" className="rounded-full p-3 transition hover:bg-white"><ArrowLeft size={22} /></Link>
      <Link href="/" aria-label="ACELINGUA home"><Image src="/logo.png" alt="ACELINGUA" width={48} height={48} className="h-11 w-auto" /></Link>
    </header>
    <Suspense fallback={<Loading />}><IntroSelection /></Suspense>
  </main>;
}

function IntroSelection() {
  const code = useSearchParams().get("language") ?? "";
  return <IntroExperience key={code} code={code} />;
}

function IntroExperience({ code }: { code: string }) {
  const router = useRouter();
  const [data, setData] = useState<Intro | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<Stage>("welcome");
  const [wordIndex, setWordIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!code.trim()) throw new Error("Choose a language first so Ace can prepare your preview.");
        const supabase = createClient();
        const languageResult = await supabase.from("languages")
          .select("id, code, name, native_name, flag_emoji").eq("code", code).eq("is_active", true).maybeSingle();
        if (languageResult.error) throw languageResult.error;
        if (!languageResult.data) throw new Error("This language isn't available right now. Please choose another language.");
        const language: Language = languageResult.data;
        const courseResult = await supabase.from("courses").select("id, title, description, level")
          .eq("language_id", language.id).eq("is_published", true)
          .order("created_at").order("id");
        if (courseResult.error) throw courseResult.error;
        const courses: Course[] = courseResult.data ?? [];
        if (!courses.length) throw new Error(`A published course for ${language.name} isn't available yet.`);
        const course = courses.find((item) => item.level?.trim().toLowerCase() === "beginner")
          ?? (courses.length === 1 ? courses[0] : undefined);
        if (!course) throw new Error(`We couldn't identify a starting course for ${language.name}. Please check back soon.`);
        const unitResult = await supabase.from("units").select("id, title, description, unit_order, location_name")
          .eq("course_id", course.id).eq("is_published", true).order("unit_order").order("id").limit(1).maybeSingle();
        if (unitResult.error) throw unitResult.error;
        if (!unitResult.data) throw new Error("This course doesn't have a published unit yet. Please check back soon.");
        const unit: Unit = unitResult.data;
        const lessonResult = await supabase.from("lessons").select("id, title, description, lesson_order, xp_reward, coin_reward")
          .eq("unit_id", unit.id).eq("is_published", true).order("lesson_order").order("id").limit(1).maybeSingle();
        if (lessonResult.error) throw lessonResult.error;
        if (!lessonResult.data) throw new Error("The first unit doesn't have a published lesson yet. Please check back soon.");
        const lesson: Lesson = lessonResult.data;
        const [wordResult, activityResult] = await Promise.all([
          supabase.from("vocabulary").select("id, word, pronunciation, translation, example_sentence, example_translation")
            .eq("lesson_id", lesson.id).order("id"),
          supabase.from("activities").select("id, title, instructions, activity_type, activity_order")
            .eq("lesson_id", lesson.id).order("activity_order").order("id"),
        ]);
        if (wordResult.error) throw wordResult.error;
        if (activityResult.error) throw activityResult.error;
        const activities: Activity[] = activityResult.data ?? [];
        let questions: Question[] = [];
        if (activities.length) {
          const questionResult = await supabase.from("questions")
            .select("id, activity_id, question_text, question_type, correct_answer, options, explanation, question_order")
            .in("activity_id", activities.map((activity) => activity.id)).order("question_order").order("id");
          if (questionResult.error) throw questionResult.error;
          questions = questionResult.data ?? [];
        }
        if (!cancelled) setData({ language, course, unit, lesson, words: wordResult.data ?? [], activities, questions });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load your preview. Please try again shortly.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [code]);

  if (error) return <section role="alert" className="mx-auto mt-12 max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-extrabold">Your preview is unavailable</h1><p className="mt-4 leading-7">{error}</p><Link className={`${buttonStyle} mt-6`} href="/onboarding/languages">Back to languages</Link></section>;
  if (!data) return <Loading />;

  const practice = data.activities.flatMap((activity) => data.questions.filter((question) => question.activity_id === activity.id))
    .find((question) => question.question_type === "multiple_choice" && choicesFor(question).length);
  const practiceActivity = data.activities.find((activity) => activity.id === practice?.activity_id);
  const word = data.words[wordIndex];
  const steps: Stage[] = ["welcome", "learn", "practice", "complete"];
  const stepIndex = steps.indexOf(stage);

  function finish() {
    try {
      // Preview completion is browser state only, never permanent learner progress.
      localStorage.setItem("acelingua_intro_lesson_id", data!.lesson.id);
      localStorage.setItem("acelingua_intro_completed", "true");
      setStorageError("");
      setStage("complete");
    } catch {
      setStorageError("We couldn't save your preview state. Please allow browser storage and try again.");
    }
  }

  function afterLearning() {
    if (practice) setStage("practice");
    else finish();
  }

  return <section className="mx-auto mt-6 max-w-2xl pb-10">
    <ol aria-label="Preview progress" className="mb-8 grid grid-cols-4 gap-2">
      {steps.map((step, index) => <li key={step} aria-current={stage === step ? "step" : undefined} className="text-center text-xs font-semibold capitalize"><div className={`mb-2 h-2 rounded-full ${index <= stepIndex ? "bg-[#3558AE]" : "bg-[#C7A9D4]/35"}`} />{step}</li>)}
    </ol>
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
        {word ? <div className="mt-6 text-center"><p className="text-xs text-[#071A4A]/55">Phrase {wordIndex + 1} of {data.words.length}</p><h2 className="mt-6 break-words text-4xl font-bold sm:text-5xl">{word.word}</h2>{word.pronunciation && <p className="mt-4 text-lg text-[#3558AE]">{word.pronunciation}</p>}<p className="mt-4 text-2xl">{word.translation}</p>{word.example_sentence && <div className="mt-6 rounded-2xl bg-[#EAF5FF] p-4 text-base"><p>{word.example_sentence}</p>{word.example_translation && <p className="mt-2 text-sm text-[#071A4A]/65">{word.example_translation}</p>}</div>}</div>
          : <div className="mt-5 space-y-4"><p className="text-sm leading-6 text-[#071A4A]/65">{data.activities.length || data.questions.length ? "Vocabulary cards aren't available yet. Explore the lesson's available activities below." : "Learning content for this preview is coming soon. You can still explore the lesson information and create your account."}</p>{data.lesson.description && <p>{data.lesson.description}</p>}{data.activities.map((activity) => <div key={activity.id} className="rounded-2xl bg-[#EAF5FF] p-4"><h2 className="font-bold">{activity.title}</h2>{activity.instructions && <p className="mt-2 text-sm leading-6">{activity.instructions}</p>}</div>)}</div>}
        <button type="button" className={`${buttonStyle} mt-7`} onClick={() => word && wordIndex < data.words.length - 1 ? setWordIndex(wordIndex + 1) : afterLearning()}>{word && wordIndex < data.words.length - 1 ? "Next phrase" : practice ? "Continue to practice" : "Finish preview"}<ArrowRight size={17} /></button>
        {!practice && <p className="mt-3 text-xs text-[#071A4A]/55">A multiple-choice practice question is not available for this preview yet.</p>}
      </>}
      {stage === "practice" && practice && <>
        <h1 className="mt-3 text-2xl font-extrabold">A little practice</h1>
        {practiceActivity?.instructions && <p className="mt-3 text-sm leading-6 text-[#071A4A]/65">{practiceActivity.instructions}</p>}
        <h2 className="mt-6 break-words text-xl font-bold">{practice.question_text}</h2>
        <div role="group" aria-label="Answer choices" className="mt-5 grid gap-3">{choicesFor(practice).map((choice) => <button key={choice} type="button" aria-pressed={answer === choice} disabled={answer === practice.correct_answer} onClick={() => setAnswer(choice)} className={`rounded-2xl border p-4 text-left font-semibold transition disabled:cursor-default ${answer === choice ? answer === practice.correct_answer ? "border-[#3558AE] bg-[#EAF5FF]" : "border-[#B64074] bg-[#F9C3D7]/30" : "border-[#071A4A]/15 hover:border-[#3558AE]"}`}>{choice}</button>)}</div>
        <div role="status" aria-live="polite" className="mt-4 text-sm leading-6">{answer !== null && (answer === practice.correct_answer ? <><p className="font-bold text-[#3558AE]">Correct!</p>{practice.explanation && <p>{practice.explanation}</p>}</> : <p className="text-[#B64074]">Try again. Choose another answer.</p>)}</div>
        <button type="button" disabled={answer !== practice.correct_answer} className={`${buttonStyle} mt-6`} onClick={finish}>Finish preview <ArrowRight size={17} /></button>
      </>}
      {stage === "complete" && <div className="mt-6 text-center"><CheckCircle2 size={54} className="mx-auto text-[#3558AE]" /><h1 className="mt-4 text-3xl font-extrabold">Great start!</h1><p className="mt-4 leading-7">You completed your first ACELINGUA preview.</p><p className="mt-3 font-bold">{data.language.name} · {data.lesson.title}</p><p className="mt-4 text-sm leading-6 text-[#071A4A]/65">Create an account to continue your journey. This guest preview awards no XP or coins.</p><button type="button" className={`${buttonStyle} mt-7`} onClick={() => router.push("/register")}>Create your account to continue <ArrowRight size={17} /></button></div>}
      {storageError && <p role="alert" className="mt-5 rounded-xl bg-[#F9C3D7]/30 p-4 text-sm text-[#B64074]">{storageError}</p>}
    </div>
  </section>;
}
