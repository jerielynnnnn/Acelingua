"use client";
import Image from "next/image";
import Logo from "@/components/Logo";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  Compass,
  Gamepad2,
  Languages,
  Loader2,
  MapPin,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { readPreview } from "@/lib/guest-preview";
import LanguageAudio from "@/components/learning/LanguageAudio";
import AutoPhraseSpeech from "@/components/learning/AutoPhraseSpeech";
import GuestPreviewActivities from "@/components/learning/GuestPreviewActivities";
// A successful logout asks the guest intro to begin again at Discover.
// Do not clear the selected language, so the learner can rediscover it.
const INTRO_RESET_AFTER_LOGOUT_KEY = "acelingua_intro_reset_after_logout";
function consumeIntroResetAfterLogout(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const mustReset =
      window.localStorage.getItem(INTRO_RESET_AFTER_LOGOUT_KEY) === "1";
    if (mustReset) {
      window.localStorage.removeItem(INTRO_RESET_AFTER_LOGOUT_KEY);
    }
    return mustReset;
  } catch {
    return false;
  }
}
type Language = {
  id: string;
  code: string;
  name: string;
  native_name: string | null;
  flag_emoji: string | null;
};
type Course = { id: string; title: string; description: string | null; level: string | null };
type Unit = { id: string; title: string; description: string | null; unit_order: number; location_name: string | null };
type Lesson = { id: string; title: string; description: string | null; lesson_order: number; xp_reward: number; coin_reward: number };
type Word = {
  id: string;
  word: string;
  pronunciation: string | null;
  translation: string;
  example_sentence: string | null;
  example_translation: string | null;
};
type Intro = { language: Language; course: Course; unit: Unit; lesson: Lesson; words: Word[] };
type Stage = "welcome" | "learn" | "practice" | "complete";
type LanguageTheme = { greeting: string; romanized: string; accent: string; tint: string; emoji: string; flag?: string };
// Uses existing images in public/flags. A flag emoji is shown if any image is missing.
const languageThemes: Record<string, LanguageTheme> = {
  ja: { greeting: "こんにちは", romanized: "Konnichiwa", accent: "#E47D98", tint: "#FFE9EF", emoji: "🇯🇵", flag: "/flags/japan.jpg" },
  ko: { greeting: "안녕하세요", romanized: "Annyeonghaseyo", accent: "#8568C8", tint: "#EEE6FF", emoji: "🇰🇷", flag: "/flags/korea.jpg" },
  zh: { greeting: "你好", romanized: "Nǐ hǎo", accent: "#EA9276", tint: "#FFEDE3", emoji: "🇨🇳", flag: "/flags/china.jpg" },
  es: { greeting: "¡Hola!", romanized: "Hola", accent: "#E4A64E", tint: "#FFF3D8", emoji: "🇪🇸", flag: "/flags/spanish.jpg" },
  de: { greeting: "Hallo!", romanized: "Hallo", accent: "#7A9AC8", tint: "#E7EFFB", emoji: "🇩🇪", flag: "/flags/german.jpg" },
  th: { greeting: "สวัสดี", romanized: "Sawatdee", accent: "#6CB6AC", tint: "#E0F7EF", emoji: "🇹🇭", flag: "/flags/thailand.jpg" },
  fr: { greeting: "Bonjour!", romanized: "Bonjour", accent: "#7CA0DD", tint: "#E6F0FF", emoji: "🇫🇷", flag: "/flags/france.jpg" },
  en: { greeting: "Hello!", romanized: "Hello", accent: "#649ED7", tint: "#E5F2FF", emoji: "🇬🇧" },
  fil: { greeting: "Kumusta!", romanized: "Kumusta", accent: "#E5A458", tint: "#FFF1DE", emoji: "🇵🇭" },
  tl: { greeting: "Kumusta!", romanized: "Kumusta", accent: "#E5A458", tint: "#FFF1DE", emoji: "🇵🇭" },
};
const aliases: Record<string, string> = { jp: "ja", kr: "ko", cn: "zh", ph: "fil", gb: "en" };
const defaultTheme: LanguageTheme = { greeting: "Hello!", romanized: "Let's begin", accent: "#649ED7", tint: "#E5F2FF", emoji: "🌐" };
const steps = [
  { key: "welcome", label: "Discover", icon: Compass },
  { key: "learn", label: "Learn", icon: BookOpen },
  { key: "practice", label: "Play", icon: Gamepad2 },
  { key: "complete", label: "Finish", icon: Trophy },
] as const;
const LEARN_COUNTDOWN_STEP_MS = 1000; // Each number 3 → 2 → 1 stays for one second.
const actionButton = "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-[#102452] px-5 py-2.5 text-[13px] font-extrabold text-white shadow-[0_10px_23px_rgba(16,36,82,.15)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3558AE] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3558AE]";
function normalizeCode(code: string) {
  const lower = code.trim().toLowerCase();
  return aliases[lower] ?? lower;
}
function themeFor(code: string) { return languageThemes[normalizeCode(code)] ?? defaultTheme; }
function emojiFlag(language: Language, theme: LanguageTheme) {
  if (languageThemes[normalizeCode(language.code)]) return theme.emoji;
  const stored = language.flag_emoji?.trim() || "";
  // Convert any 2-letter region code to an actual flag emoji, never show "JP" or "KR".
  if (/^[a-z]{2}$/i.test(stored)) return [...stored.toUpperCase()].map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0))).join("");
  return stored || theme.emoji;
}
function FlagImage({ language, theme, className = "" }: { language: Language; theme: LanguageTheme; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-white ${className}`}>
      {theme.flag && !failed ? (
        <Image src={theme.flag} alt={`${language.name} flag`} fill sizes="(max-width: 640px) 48px, 240px" className="object-contain p-[9%]" onError={() => setFailed(true)} />
      ) : (
        <span role="img" aria-label={`${language.name} flag`} className="text-[clamp(24px,5dvh,66px)] leading-none">{emojiFlag(language, theme)}</span>
      )}
    </span>
  );
}
function Loading({ message = "Preparing your first adventure..." }: { message?: string }) {
  return (
    <div role="status" className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[#E5F2FF]">
        <div className="ac-orbit absolute inset-1 rounded-full border-2 border-dashed border-[#94B2E0]" />
        <Languages className="text-[#3558AE]" size={33} />
      </div>
      <p className="inline-flex items-center gap-2 text-sm font-bold text-[#70809A]"><Loader2 size={16} className="animate-spin" />{message}</p>
    </div>
  );
}
export default function IntroPage() {
  // No page scrolling, even if the surrounding application's body normally scrolls.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtml = html.style.overflow;
    const previousBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => { html.style.overflow = previousHtml; body.style.overflow = previousBody; };
  }, []);
  return (
    <main className="ac-intro relative isolate flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-[#FFFCF7] text-[#102452]">
      <style jsx global>{`
        .ac-intro { font-synthesis: none; }
        .ac-intro-dots { background-image: radial-gradient(#9eb1d0 .8px, transparent .8px); background-size: 20px 20px; mask-image: linear-gradient(to bottom, transparent, black 25%, black 80%, transparent); }
        .ac-orbit { animation: ac-orbit 28s linear infinite; }
        .ac-orbit-reverse { animation: ac-orbit 42s linear infinite reverse; }
        .ac-float { animation: ac-float 5s ease-in-out infinite; }
        .ac-slide-next { animation: ac-slide-next .33s cubic-bezier(.2,.8,.2,1) both; }
        .ac-slide-back { animation: ac-slide-back .33s cubic-bezier(.2,.8,.2,1) both; }
        .ac-countdown-pop { animation: ac-countdown-pop .28s ease-out both; }
          @keyframes ac-countdown-pop { from { opacity: .35; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }
        @keyframes ac-orbit { to { transform: rotate(360deg); } }
        @keyframes ac-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes ac-slide-next { from { opacity: 0; transform: translateX(24px) scale(.99); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes ac-slide-back { from { opacity: 0; transform: translateX(-24px) scale(.99); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @media (max-height: 720px) { .ac-optional { display: none !important; } .ac-intro-stage-top { margin-bottom: 4px !important; } }
        @media (max-height: 590px) { .ac-very-short { display: none !important; } }
        @media (prefers-reduced-motion: reduce) { .ac-orbit, .ac-orbit-reverse, .ac-float, .ac-slide-next, .ac-slide-back { animation: none !important; } }
      `}</style>
      <div aria-hidden="true" className="ac-intro-dots pointer-events-none absolute inset-0 opacity-25" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-36 top-1/4 h-80 w-80 rounded-full bg-[#DFF2FF]/80 blur-[90px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#F6DDF6]/65 blur-[90px]" />
      <header className="relative z-10 mx-auto flex h-[clamp(56px,9dvh,76px)] w-full max-w-[1440px] shrink-0 items-center justify-between gap-3 px-4 sm:px-7 lg:px-12">
        <Link href="/" aria-label="ACELingua home" className="inline-flex shrink-0 items-center">
          <Logo alt="ACELingua" priority quality={100} className="h-auto w-[clamp(119px,13vw,168px)] object-contain" />
        </Link>
        <nav className="flex items-center gap-2" aria-label="Lesson navigation">
          <Link href="/onboarding/languages" className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#E5EAF3] bg-white/90 px-3 text-[11px] font-bold text-[#627695] transition hover:bg-[#F1F7FF] sm:px-4">
            <ArrowLeft size={14} /> <span className="hidden sm:inline">Change language</span><span className="sm:hidden">Back</span>
          </Link>
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#E5EAF3] bg-white/90 px-3 text-[11px] font-extrabold text-[#627695] sm:px-4">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#102452] text-[10px] text-white">2</span>
            <span className="hidden sm:inline">Step 2 of 3</span><span className="sm:hidden">2 / 3</span>
          </span>
        </nav>
      </header>
      <Suspense fallback={<Loading />}><IntroSelection /></Suspense>
    </main>
  );
}
function IntroSelection() {
  const urlCode = useSearchParams().get("language") ?? "";
  const [savedCode, setSavedCode] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      try { setSavedCode(localStorage.getItem("acelingua_selected_language") ?? ""); }
      catch { setSavedCode(""); }
    });
    return () => { cancelled = true; };
  }, []);
  if (!urlCode && savedCode === null) return <Loading />;
  const selected = urlCode || savedCode || "";
  return <IntroExperience key={selected} code={selected} />;
}
function makeLearningChoices(current: Word, all: Word[]) {
  const other = [...new Set(all.map((word) => word.translation))].filter((value) => value !== current.translation);
  const options = [current.translation, ...other.slice(0, 3)];
  // Stable pseudo-shuffle: moving back and forth doesn't unexpectedly change the answers.
  let seed = [...current.id].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);
  for (let i = options.length - 1; i > 0; i--) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}
function LearningSlide({ word, words, languageCode, checked, countdown, onChecked }: {
  word: Word;
  words: Word[];
  languageCode: string;
  checked: boolean;
  countdown: number | null;
  onChecked: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const choices = useMemo(() => makeLearningChoices(word, words), [word, words]);
  return (
    <div className="flex h-full min-h-0 w-full flex-col justify-center gap-[clamp(7px,1.25dvh,14px)]">
      <div className="rounded-[22px] border border-[#E3ECFA] bg-[#F4F9FF] px-4 py-[clamp(10px,2dvh,22px)] text-center sm:px-6">
        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[.13em] text-[#7289B0]">
          <Sparkles size={13} /> Listen and learn
        </div>
        <h2 lang={languageCode} className="mt-[clamp(4px,1dvh,10px)] break-words text-[clamp(24px,4.4dvh,43px)] font-black leading-tight tracking-tight text-[#102452]">{word.word}</h2>
        {word.pronunciation && <p className="mt-1 truncate text-[clamp(11px,1.6dvh,14px)] font-semibold text-[#6B82A7]">{word.pronunciation}</p>}
        {/* Automatically speak each newly displayed word. Keep the manual replay button. */}
        <AutoPhraseSpeech languageCode={languageCode} text={word.word} />
        <div className="mt-2 flex justify-center"><LanguageAudio key={word.id} languageCode={languageCode} text={word.word} hideText compact /></div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[clamp(12px,1.7dvh,15px)] font-black text-[#102452]">What does it mean?</p>
        <span className="text-[10px] font-bold text-[#8C9BB2]">Choose one answer</span>
      </div>
      <div className="grid grid-cols-2 gap-[clamp(6px,1dvh,10px)]">
        {choices.map((choice) => {
          const selected = answer === choice;
          const correct = checked && choice === word.translation;
          return (
            <button
              key={choice}
              type="button"
              disabled={checked}
              onClick={() => { setAnswer(choice); onChecked(); }}
              aria-pressed={selected}
              className={`flex min-h-[clamp(40px,6.6dvh,60px)] min-w-0 items-center gap-2 rounded-[15px] border px-3 py-2 text-left text-[clamp(11px,1.7dvh,14px)] font-semibold leading-snug transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3558AE] ${
                correct ? "border-[#61C797] bg-[#EDFAF3] text-[#236849]" :
                selected ? "border-[#7692D4] bg-[#EAF2FF] text-[#102452]" :
                "border-[#E3E9F4] bg-white text-[#455B7E] hover:border-[#A7B9DA] hover:bg-[#F7FAFF]"
              }`}
            >
              <span className="min-w-0 flex-1 break-words">{choice}</span>
              {correct && <Check size={15} className="shrink-0" />}
            </button>
          );
        })}
      </div>
      {checked && (
        <div role="status" className={`flex min-h-10 items-center justify-between gap-3 rounded-xl px-3 py-2 text-[11px] font-bold ${answer === word.translation ? "bg-[#EAF6EF] text-[#347250]" : "bg-[#FFF3E9] text-[#986544]"}`}>
          <span className="inline-flex items-center gap-2">
            <Check size={14} className="shrink-0" />
            {answer === word.translation ? "Exactly right!" : `Nice try! “${word.translation}” is the meaning.`}
          </span>
          {countdown !== null && (
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[#102452]" aria-live="polite">
              <span className="text-[10px]">Next in</span>
              <span key={countdown} className="ac-countdown-pop text-lg font-black tabular-nums">{countdown}</span>
            </span>
          )}
        </div>
      )}
      {!checked && word.example_sentence && <p className="ac-optional line-clamp-2 text-center text-[11px] text-[#8695AC]">Example: {word.example_sentence}</p>}
    </div>
  );
}
function IntroExperience({ code }: { code: string }) {
  const [data, setData] = useState<Intro | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<Stage>("welcome");
  const [wordIndex, setWordIndex] = useState(0);
  const [wordChecked, setWordChecked] = useState(false);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [learnCountdown, setLearnCountdown] = useState<number | null>(null);
  const learnCountdownTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cancel countdowns when navigating back, changing language, or unmounting.
  useEffect(() => () => {
    learnCountdownTimers.current.forEach(clearTimeout);
    learnCountdownTimers.current = [];
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!code.trim()) throw new Error("Choose a language first so Ace can prepare your preview.");
        const supabase = createClient();
        const requested = code.trim();
        const canonical = normalizeCode(requested);
        let languageResult = await supabase.from("languages")
          .select("id, code, name, native_name, flag_emoji")
          .eq("code", requested).eq("is_active", true).maybeSingle();
        if (languageResult.error) throw languageResult.error;
        if (!languageResult.data && canonical !== requested) {
          languageResult = await supabase.from("languages")
            .select("id, code, name, native_name, flag_emoji")
            .eq("code", canonical).eq("is_active", true).maybeSingle();
          if (languageResult.error) throw languageResult.error;
        }
        if (!languageResult.data) throw new Error("This language isn't available right now. Please choose another language.");
        const language: Language = languageResult.data;
        const courseResult = await supabase.from("courses")
          .select("id, title, description, level")
          .eq("language_id", language.id).eq("is_published", true)
          .order("created_at").order("id");
        if (courseResult.error) throw courseResult.error;
        const courses: Course[] = courseResult.data ?? [];
        const course = courses.find((item) => item.level?.trim().toLowerCase() === "beginner")
          ?? (courses.length === 1 ? courses[0] : undefined);
        if (!course) throw new Error(`A beginner course for ${language.name} isn't available yet.`);
        const unitResult = await supabase.from("units")
          .select("id, title, description, unit_order, location_name")
          .eq("course_id", course.id).eq("is_published", true)
          .order("unit_order").order("id").limit(1).maybeSingle();
        if (unitResult.error) throw unitResult.error;
        if (!unitResult.data) throw new Error("This course doesn't have a published unit yet.");
        const unit: Unit = unitResult.data;
        const lessonResult = await supabase.from("lessons")
          .select("id, title, description, lesson_order, xp_reward, coin_reward")
          .eq("unit_id", unit.id).eq("is_published", true)
          .order("lesson_order").order("id").limit(1).maybeSingle();
        if (lessonResult.error) throw lessonResult.error;
        if (!lessonResult.data) throw new Error("This unit doesn't have a published lesson yet.");
        const lesson: Lesson = lessonResult.data;
        const wordResult = await supabase.from("vocabulary")
          .select("id, word, pronunciation, translation, example_sentence, example_translation")
          .eq("lesson_id", lesson.id).order("id");
        if (wordResult.error) throw wordResult.error;
        if (!wordResult.data?.length) throw new Error("This preview doesn't have vocabulary yet.");
        if (cancelled) return;
        setData({ language, course, unit, lesson, words: wordResult.data });
        // Logout resets the guest experience to Discover, even if there
        // was a saved Play/Finish result from the previous session.
        const resetAfterLogout = consumeIntroResetAfterLogout();
        if (resetAfterLogout) {
          setStage("welcome");
          setWordIndex(0);
          setWordChecked(false);
          setDirection("next");
        } else {
          const saved = readPreview();
          if (
            saved?.lessonId === lesson.id &&
            saved.languageId === language.id &&
            saved.answers.length
          ) {
            setStage(saved.completed ? "complete" : "practice");
          }
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load your preview. Please try again.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [code]);
  if (error) return (
    <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4">
      <section role="alert" className="w-full max-w-[460px] rounded-[28px] border border-[#E6ECF5] bg-white p-7 text-center shadow-xl">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF0F0] text-3xl">🧭</div>
        <h1 className="text-xl font-black">This adventure isn't ready yet</h1>
        <p className="mt-3 text-sm leading-6 text-[#7886A0]">{error}</p>
        <Link href="/onboarding/languages" className={`${actionButton} mt-5`}><ArrowLeft size={16} /> Choose another language</Link>
      </section>
    </div>
  );
  if (!data) return <Loading message="Ace is preparing your first lesson..." />;
  const theme = themeFor(data.language.code);
  const themeStyle = { "--ac-accent": theme.accent, "--ac-tint": theme.tint } as CSSProperties;
  const stageIndex = steps.findIndex((item) => item.key === stage);
  const word = data.words[wordIndex];
  function cancelLearnCountdown() {
    learnCountdownTimers.current.forEach(clearTimeout);
    learnCountdownTimers.current = [];
    setLearnCountdown(null);
  }

  function answerLearningWord() {
    // The selected answer is locked immediately. One click is enough.
    if (wordChecked || learnCountdown !== null) return;
    setWordChecked(true);
    setLearnCountdown(3);
    // Visible 3… 2… 1… countdown; then automatically advance.
    learnCountdownTimers.current = [
      setTimeout(() => setLearnCountdown(2), LEARN_COUNTDOWN_STEP_MS),
      setTimeout(() => setLearnCountdown(1), LEARN_COUNTDOWN_STEP_MS * 2),
      setTimeout(() => {
        learnCountdownTimers.current = [];
        setLearnCountdown(null);
        setDirection("next");
        setWordChecked(false);
        if (wordIndex < data!.words.length - 1) {
          setWordIndex((current) => current + 1);
        } else {
          setStage("practice");
        }
      }, LEARN_COUNTDOWN_STEP_MS * 3),
    ];
  }

  function previousWord() {
    cancelLearnCountdown();
    setDirection("back");
    setWordChecked(false);
    if (wordIndex > 0) setWordIndex((value) => value - 1);
    else setStage("welcome");
  }
  return (
    <section style={themeStyle} className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col px-4 pb-[clamp(10px,2dvh,23px)] sm:px-7 lg:px-12">
      {/* Small intro: the actual lesson gets the available screen space. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-[#E8EDF5]/70 py-[clamp(7px,1.4dvh,14px)]">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="ac-very-short hidden items-center gap-1.5 rounded-full bg-[#EAF3FF] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#4268A7] sm:inline-flex"><Sparkles size={13} /> First adventure</span>
          <h1 className="truncate text-[clamp(18px,2.35vw,27px)] font-black leading-tight tracking-[-.035em]">Let's learn <span style={{ color: theme.accent }}>{data.language.name}!</span></h1>
        </div>
        <span className="ac-optional hidden max-w-[30%] truncate text-[11px] font-semibold text-[#8A99AE] lg:inline">{data.lesson.title}</span>
      </div>
      {/* Fixed-height step tracker instead of large headings/paragraphs. */}
      <ol aria-label="Preview progress" className="grid w-full shrink-0 grid-cols-4 gap-1.5 sm:gap-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = stageIndex === index;
          const passed = stageIndex > index;
          return (
            <li key={step.key} aria-current={active ? "step" : undefined} className="min-w-0">
              <div className={`flex h-[clamp(32px,5dvh,42px)] items-center justify-center gap-1.5 rounded-[13px] border text-[10px] font-extrabold transition-colors sm:gap-2 sm:text-xs ${active ? "border-[#B6C9ED] bg-white text-[#102452] shadow-[0_4px_15px_rgba(16,36,82,.07)]" : passed ? "border-[#D8EDDF] bg-[#EFFBF2] text-[#489269]" : "border-[#E9EDF5] bg-white/55 text-[#9BA9BF]"}`}>
                {passed ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                <span className="truncate">{step.label}</span>
              </div>
              <div className={`mt-1 h-[3px] rounded-full transition-colors ${index <= stageIndex ? "bg-[#3558AE]" : "bg-[#E1E8F2]"}`} />
            </li>
          );
        })}
      </ol>
      <div className="mt-[clamp(8px,1.6dvh,18px)] grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:gap-[clamp(12px,1.8vw,24px)]">
        {/* Passport only on larger screens; never forces scrolling on phones. */}
        <aside className="relative hidden min-h-0 flex-col overflow-hidden rounded-[28px] border border-white bg-white/75 p-[clamp(15px,2dvh,25px)] shadow-[0_15px_55px_rgba(16,36,82,.05)] lg:flex">
          <div className="flex shrink-0 items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-[#8292A9]"><Compass size={15} style={{ color: theme.accent }} /> Language passport</span>
            <span className="rounded-full border border-[#E6EBF4] bg-white px-3 py-1 text-[10px] font-bold text-[#8A97AD]">FIRST STOP</span>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center py-3">
            <div aria-hidden="true" className="pointer-events-none absolute aspect-square h-[min(44dvh,350px)] max-h-[95%] max-w-[95%] rounded-full">
              <div className="ac-orbit absolute inset-[2%] rounded-full border-2 border-dashed border-[#B2C8E5]" />
              <div className="ac-orbit-reverse absolute inset-[13%] rounded-full border border-[#C9D9EF]" />
              <span className="absolute -left-2 top-[18%] text-xl text-[#FFCB64]">✦</span>
              <span className="absolute -right-2 bottom-[23%] text-2xl text-[#FF9297]">✧</span>
            </div>
            <div className="ac-float relative z-10 flex w-[min(69%,272px)] min-w-0 flex-col items-center rounded-[24px] border-[5px] border-white bg-white p-3 shadow-[0_17px_42px_rgba(16,36,82,.13)]">
              <div className="flex w-full items-center justify-center rounded-[18px] p-[clamp(11px,2dvh,23px)]" style={{ backgroundColor: theme.tint }}>
                <FlagImage language={data.language} theme={theme} className="aspect-[4/3] h-[clamp(85px,18dvh,170px)] w-full rounded-[13px] shadow-sm" />
              </div>
              <p className="mt-[clamp(8px,1dvh,15px)] text-[10px] font-extrabold uppercase tracking-[.13em]" style={{ color: theme.accent }}>NOW EXPLORING</p>
              <h2 className="mt-1 truncate text-[clamp(20px,3.3dvh,31px)] font-black tracking-tight">{data.language.name}</h2>
              <p className="mt-1 max-w-full truncate text-[11px] text-[#8290A8]">{data.language.native_name || theme.romanized}</p>
              <p className="mt-2 max-w-full truncate rounded-full px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: theme.tint, color: theme.accent }}>{theme.greeting}</p>
            </div>
            <div className="ac-float pointer-events-none absolute bottom-1 right-0 z-20 h-[clamp(66px,12dvh,110px)] w-[clamp(66px,12dvh,110px)] drop-shadow-[0_10px_12px_rgba(16,36,82,.13)]">
              <Image src="/icon head.png" alt="" fill sizes="110px" className="object-contain" />
            </div>
          </div>
          <div className="ac-optional mx-auto flex max-w-[360px] shrink-0 items-center gap-2 rounded-xl border border-[#EAF0F8] bg-white/95 px-3 py-2 text-[11px] font-semibold text-[#6D7C97]">
            <Star size={14} className="shrink-0 text-[#E2AC54]" /> {stage === "welcome" ? "Ready to discover your first words?" : stage === "learn" ? "One new phrase at a time!" : stage === "practice" ? "Show Ace what you've learned." : "Your adventure has just begun!"}
          </div>
        </aside>
        <article className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[25px] border border-[#E6ECF6] bg-white/95 shadow-[0_19px_55px_rgba(16,36,82,.11)]">
          <header className="flex h-[clamp(54px,8dvh,71px)] shrink-0 items-center justify-between gap-2 border-b border-[#ECF0F6] px-[clamp(13px,2vw,24px)]">
            <div className="flex min-w-0 items-center gap-2.5">
              <FlagImage language={data.language} theme={theme} className="h-10 w-12 rounded-xl border border-[#EFF1F4]" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-[#8E9CB0]">Your first lesson</p>
                <p className="truncate text-[12px] font-extrabold text-[#102452] sm:text-sm">{data.lesson.title}</p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F2F7FE] px-2.5 py-1.5 text-[10px] font-bold text-[#6C83A5]"><Star size={13} className="text-[#E3AD49]" /> Preview</span>
          </header>
          <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden px-[clamp(14px,2.7vw,34px)] py-[clamp(9px,1.4dvh,18px)]">
            <div key={`${stage}-${stage === "learn" ? wordIndex : ""}`} className={`flex h-full min-h-0 w-full flex-col justify-center ${direction === "back" ? "ac-slide-back" : "ac-slide-next"}`}>
              {stage === "welcome" && (
                <div className="mx-auto flex h-full min-h-0 w-full max-w-[510px] flex-col justify-center gap-[clamp(9px,1.8dvh,18px)]">
                  <div className="flex items-center gap-3 lg:hidden">
                    <div className="relative h-12 w-12 shrink-0"><Image src="/icon head.png" alt="Ace mascot" fill sizes="48px" className="object-contain" /></div>
                    <span className="rounded-xl bg-[#E9F6FF] px-3 py-2 text-[11px] font-semibold text-[#59708E]">Ace is ready to learn with you!</span>
                  </div>
                  <span className="w-fit rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em]" style={{ color: theme.accent, backgroundColor: theme.tint }}>Welcome aboard ✧</span>
                  <h2 className="text-[clamp(23px,4.2dvh,38px)] font-black leading-[1.12] tracking-[-.045em]">Say hello in <span style={{ color: theme.accent }}>{data.language.name}.</span></h2>
                  <p className="text-[clamp(12px,1.8dvh,15px)] leading-relaxed text-[#8190A8]">Learn a few phrases, then try a quick mini-game.</p>
                  <div className="rounded-[19px] border border-[#E7ECF5] bg-[#F8FAFE] p-[clamp(12px,2.2dvh,22px)]">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.1em] text-[#7083A0]"><BookOpen size={14} /> Adventure ticket</p>
                    <h3 className="mt-2 line-clamp-2 text-[clamp(15px,2.2dvh,21px)] font-black">{data.course.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-[#8292AA]">
                      <span className="inline-flex items-center gap-1"><MapPin size={13} /> {data.unit.location_name || data.unit.title}</span>
                      <span>{data.words.length} {data.words.length === 1 ? "phrase" : "phrases"}</span>
                    </div>
                    <p className="ac-optional mt-3 border-t border-[#E2EAF4] pt-2 text-[12px] font-bold text-[#596D8E]">{data.lesson.title}</p>
                  </div>
                </div>
              )}
              {stage === "learn" && word && (
                <div className="mx-auto flex h-full min-h-0 w-full max-w-[520px] flex-col justify-center">
                  <div className="ac-intro-stage-top mb-2 flex shrink-0 items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em]" style={{ backgroundColor: theme.tint, color: theme.accent }}><BookOpen size={13} /> Phrase discovery</span>
                    <span className="text-[11px] font-extrabold text-[#8292AA]">{wordIndex + 1} / {data.words.length}</span>
                  </div>
                  <LearningSlide key={word.id} word={word} words={data.words} languageCode={normalizeCode(data.language.code)} checked={wordChecked} countdown={learnCountdown} onChecked={answerLearningWord} />
                </div>
              )}
              {(stage === "practice" || stage === "complete") && (
                <GuestPreviewActivities
                  languageId={data.language.id}
                  languageCode={data.language.code}
                  courseId={data.course.id}
                  lessonId={data.lesson.id}
                  words={data.words}
                  onComplete={() => { setDirection("next"); setStage("complete"); }}
                />
              )}
            </div>
          </div>
          {(stage === "welcome" || stage === "learn") && (
            <footer className="flex h-[clamp(61px,9dvh,75px)] shrink-0 items-center justify-between gap-2 border-t border-[#EBEFF5] px-[clamp(12px,2.5vw,27px)]">
              {stage === "learn" ? (
                <button type="button" onClick={previousWord} className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-[12px] font-bold text-[#7487A5] transition hover:bg-[#F1F6FD] hover:text-[#102452]"><ChevronLeft size={17} /> Back</button>
              ) : <span className="ac-optional text-[11px] font-semibold text-[#93A1B5]">Your journey begins here.</span>}
              <div className="flex items-center gap-2">
                {stage === "learn" ? (
                  <span className="text-[10px] font-bold text-[#8A9AB2] sm:text-[11px]">
                    {learnCountdown !== null ? `Next phrase in ${learnCountdown}…` : "Choose an answer — the next phrase starts automatically"}
                  </span>
                ) : (
                  <button type="button" onClick={() => { setDirection("next"); setStage("learn"); }} className={actionButton}>
                    Start learning <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </footer>
          )}
        </article>
      </div>
    </section>
  );
}
