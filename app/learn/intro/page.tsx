"use client";

import Image from "next/image";
import Logo from "@/components/Logo";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Gamepad2,
  Loader2,
  MapPin,
  Sparkles,
  Star,
  Trophy,
  Languages,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { readPreview } from "@/lib/guest-preview";
import PreviewWordCard from "@/components/learning/PreviewWordCard";
import GuestPreviewActivities from "@/components/learning/GuestPreviewActivities";
import LanguageAudio from "@/components/learning/LanguageAudio";

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

type LanguageTheme = {
  greeting: string;
  romanized: string;
  accent: string;
  tint: string;
  emoji: string;
  flag?: string;
};

// Mirrors the language visuals on the animated language-selection page.
// The existing /public/flags images are displayed with object-contain: no cropping.
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
const defaultTheme: LanguageTheme = {
  greeting: "Hello!", romanized: "Let's begin", accent: "#76A7DE", tint: "#E8F2FF", emoji: "🌐",
};

const stages: { key: Stage; label: string; icon: typeof Compass }[] = [
  { key: "welcome", label: "Discover", icon: Compass },
  { key: "learn", label: "Learn", icon: BookOpen },
  { key: "practice", label: "Play", icon: Gamepad2 },
  { key: "complete", label: "Finish", icon: Trophy },
];

const primaryButton =
  "ac-intro-cta group inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[#102452] px-7 py-3 text-sm font-black text-white shadow-[0_12px_26px_rgba(16,36,82,0.20)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#3558AE] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3558AE]";

function themeFor(code: string): LanguageTheme {
  return languageThemes[code.toLowerCase()] ?? defaultTheme;
}

function PortalFlag({ language, theme }: { language: Language; theme: LanguageTheme }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [language.code]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[20px] bg-white shadow-inner">
      {theme.flag && !failed ? (
        <Image
          src={theme.flag}
          alt={`${language.name} flag`}
          fill
          sizes="(max-width: 1023px) 80px, 270px"
          className="object-contain p-3 sm:p-5"
          onError={() => setFailed(true)}
        />
      ) : (
        <span role="img" aria-label={`${language.name} flag`} className="text-[clamp(47px,7vw,88px)] leading-none">
          {language.flag_emoji || theme.emoji}
        </span>
      )}
    </div>
  );
}

function Loading({ message = "Preparing your first adventure..." }: { message?: string }) {
  return (
    <div role="status" className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-5 text-center">
      <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#E5F2FF]">
        <div className="ac-intro-orbit absolute inset-1 rounded-full border-2 border-dashed border-[#94B2E0]" />
        <Languages size={40} className="text-[#3558AE]" />
        <span className="ac-intro-spark absolute -right-3 -top-2 text-2xl text-[#FF9297]">✦</span>
      </div>
      <p className="flex items-center gap-2 text-sm font-bold text-[#70809A]">
        <Loader2 size={16} className="animate-spin" /> {message}
      </p>
    </div>
  );
}

export default function IntroPage() {
  // Match the selection page: the document stays fixed to a single viewport.
  // Interactive activity content scrolls INSIDE its card when it needs more room.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtml = html.style.overflow;
    const previousBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = previousHtml;
      body.style.overflow = previousBody;
    };
  }, []);

  return (
    <main className="ac-intro fixed inset-0 isolate flex h-[100dvh] w-full flex-col overflow-hidden bg-[#FFFCF7] text-[#102452]">
      <style jsx global>{`
        .ac-intro { font-synthesis: none; }
        .ac-intro .ac-intro-dots {
          background-image: radial-gradient(#9eb1d0 .8px, transparent .8px);
          background-size: 19px 19px;
          mask-image: linear-gradient(to bottom, transparent, black 27%, black 75%, transparent);
        }
        .ac-intro .ac-intro-orbit { animation: acIntroOrbit 33s linear infinite; }
        .ac-intro .ac-intro-reverse { animation: acIntroOrbit 45s linear infinite reverse; }
        .ac-intro .ac-intro-float { animation: acIntroFloat 5s ease-in-out infinite; }
        .ac-intro .ac-intro-mascot { animation: acIntroMascot 5.8s ease-in-out infinite; }
        .ac-intro .ac-intro-spark { animation: acIntroSpark 3.2s ease-in-out infinite; }
        .ac-intro .ac-intro-enter { animation: acIntroEnter .47s cubic-bezier(.2,.8,.2,1) both; }
        .ac-intro .ac-intro-step { animation: acIntroEnter .36s ease-out both; }
        .ac-intro .ac-intro-glow { animation: acIntroGlow 4s ease-in-out infinite; }
        .ac-intro .ac-intro-scroll { scrollbar-color: #C5D2E9 transparent; scrollbar-width: thin; }
        .ac-intro .ac-intro-scroll::-webkit-scrollbar { width: 5px; }
        .ac-intro .ac-intro-scroll::-webkit-scrollbar-thumb { background: #C5D2E9; border-radius: 999px; }
        @keyframes acIntroOrbit { to { transform: rotate(360deg); } }
        @keyframes acIntroFloat { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
        @keyframes acIntroMascot { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes acIntroSpark { 0%,100% { opacity:.35; transform:scale(.8); } 50% { opacity:1; transform:scale(1.22); } }
        @keyframes acIntroGlow { 0%,100% { opacity:.35; transform:scale(1); } 50% { opacity:.65; transform:scale(1.08); } }
        @keyframes acIntroEnter { from { opacity:0; transform:translateY(15px) scale(.985); } to { opacity:1; transform:translateY(0) scale(1); } }
        @media (prefers-reduced-motion: reduce) {
          .ac-intro .ac-intro-orbit, .ac-intro .ac-intro-reverse, .ac-intro .ac-intro-float,
          .ac-intro .ac-intro-mascot, .ac-intro .ac-intro-spark, .ac-intro .ac-intro-enter,
          .ac-intro .ac-intro-step, .ac-intro .ac-intro-glow { animation: none !important; }
          .ac-intro *, .ac-intro *::before, .ac-intro *::after { scroll-behavior: auto !important; }
        }
        @media (max-height: 640px) {
          .ac-intro .ac-intro-short { display:none !important; }
        }
      `}</style>

      {/* Identical warm-white portal backdrop, dotted texture and colored glows. */}
      <div aria-hidden="true" className="ac-intro-dots pointer-events-none absolute inset-0 opacity-20" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-1/4 h-[430px] w-[430px] rounded-full bg-[#E2F4FF]/75 blur-[105px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-36 bottom-0 h-[390px] w-[390px] rounded-full bg-[#F5DFF5]/65 blur-[100px]" />
      <span aria-hidden="true" className="ac-intro-spark pointer-events-none absolute left-[8%] top-[30%] hidden text-3xl text-[#FF9297] lg:block">✧</span>
      <span aria-hidden="true" className="ac-intro-spark pointer-events-none absolute right-[7%] top-[19%] hidden text-3xl text-[#85D8FA] lg:block">✦</span>

      <header className="relative z-10 mx-auto flex h-[clamp(55px,9dvh,76px)] w-full max-w-[1350px] shrink-0 items-center justify-between gap-3 px-4 sm:px-8 lg:px-12">
        <Link href="/" aria-label="ACELingua home" className="inline-flex shrink-0 items-center">
          <Logo alt="ACELingua" priority quality={100} className="h-auto w-[clamp(125px,16vw,184px)] object-contain" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/onboarding/languages"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E6EAF3] bg-white/85 px-3 py-2 text-[11px] font-bold text-[#657697] transition hover:border-[#B8C8E5] hover:text-[#102452] sm:px-4"
          >
            <ArrowLeft size={15} /> <span className="hidden sm:inline">Change language</span><span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-[#E6EAF3] bg-white/90 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.10em] text-[#6D7B98] sm:px-4 sm:text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#102452] text-[10px] text-white">2</span>
            <span className="hidden sm:inline">Step 2 of 3</span><span className="sm:hidden">2 / 3</span>
            <span className="ml-1 hidden text-[#91A0B8] md:inline">• Try a lesson</span>
          </div>
        </div>
      </header>

      <Suspense fallback={<Loading />}>
        <IntroSelection />
      </Suspense>
    </main>
  );
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!code.trim()) throw new Error("Choose a language first so Ace can prepare your preview.");
        const supabase = createClient();
        const languageResult = await supabase.from("languages")
          .select("id, code, name, native_name, flag_emoji")
          .eq("code", code).eq("is_active", true).maybeSingle();
        if (languageResult.error) throw languageResult.error;
        if (!languageResult.data) throw new Error("This language isn't available right now. Please choose another language.");
        const language: Language = languageResult.data;

        const courseResult = await supabase.from("courses")
          .select("id, title, description, level")
          .eq("language_id", language.id).eq("is_published", true)
          .order("created_at").order("id");
        if (courseResult.error) throw courseResult.error;
        const courses: Course[] = courseResult.data ?? [];
        if (!courses.length) throw new Error(`A published course for ${language.name} isn't available yet.`);
        const course = courses.find((item) => item.level?.trim().toLowerCase() === "beginner")
          ?? (courses.length === 1 ? courses[0] : undefined);
        if (!course) throw new Error(`We couldn't identify a starting course for ${language.name}. Please check back soon.`);

        const unitResult = await supabase.from("units")
          .select("id, title, description, unit_order, location_name")
          .eq("course_id", course.id).eq("is_published", true)
          .order("unit_order").order("id").limit(1).maybeSingle();
        if (unitResult.error) throw unitResult.error;
        if (!unitResult.data) throw new Error("This course doesn't have a published unit yet. Please check back soon.");
        const unit: Unit = unitResult.data;

        const lessonResult = await supabase.from("lessons")
          .select("id, title, description, lesson_order, xp_reward, coin_reward")
          .eq("unit_id", unit.id).eq("is_published", true)
          .order("lesson_order").order("id").limit(1).maybeSingle();
        if (lessonResult.error) throw lessonResult.error;
        if (!lessonResult.data) throw new Error("The first unit doesn't have a published lesson yet. Please check back soon.");
        const lesson: Lesson = lessonResult.data;

        const wordResult = await supabase.from("vocabulary")
          .select("id, word, pronunciation, translation, example_sentence, example_translation")
          .eq("lesson_id", lesson.id).order("id");
        if (wordResult.error) throw wordResult.error;
        if (!wordResult.data?.length) throw new Error("This preview has no vocabulary yet. Please choose another language.");

        if (!cancelled) {
          setData({ language, course, unit, lesson, words: wordResult.data });
          const saved = readPreview();
          if (saved?.lessonId === lesson.id && saved.answers.length) {
            setStage(saved.completed ? "complete" : "practice");
          }
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load your preview. Please try again shortly.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [code]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [stage, wordIndex]);

  if (error) {
    return (
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4">
        <section role="alert" className="w-full max-w-[490px] rounded-[30px] border border-[#E6ECF5] bg-white p-7 text-center shadow-[0_20px_60px_rgba(16,36,82,.10)] sm:p-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#FFF0F0] text-3xl">🧭</div>
          <h1 className="text-2xl font-black">This adventure isn't ready yet</h1>
          <p className="mt-3 text-sm leading-7 text-[#7988A2]">{error}</p>
          <Link href="/onboarding/languages" className={`${primaryButton} mt-7`}><ArrowLeft size={17} /> Choose another language</Link>
        </section>
      </div>
    );
  }
  if (!data) return <Loading message="Ace is preparing your first lesson..." />;

  const theme = themeFor(data.language.code);
  const themeStyle = { "--ac-intro-accent": theme.accent, "--ac-intro-tint": theme.tint } as CSSProperties;
  const stepIndex = stages.findIndex(({ key }) => key === stage);
  const word = data.words[wordIndex];
  const progress = stage === "learn" ? (wordIndex + 1) / data.words.length : stage === "welcome" ? 0 : 1;
  const guideMessage = stage === "welcome"
    ? `Ready for your first ${data.language.name} lesson?`
    : stage === "learn" ? "You can do it! One new phrase at a time."
      : stage === "practice" ? "Time to play! Show me what you've learned."
        : "Fantastic work! You're on your way!";

  function advanceWord() {
    if (word && !wordChecked) return;
    setWordChecked(false);
    if (word && wordIndex < data!.words.length - 1) setWordIndex((index) => index + 1);
    else setStage("practice");
  }

  return (
    <section style={themeStyle} className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1300px] flex-1 flex-col px-3 pb-[clamp(10px,1.7dvh,20px)] sm:px-7 lg:px-10">
      {/* Same step label + centered headline as the animated selector. */}
      <div className="shrink-0 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E3EAF7] bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.2em] text-[#3558AE] sm:text-[10px]">
          <Sparkles size={12} className="text-[#FF9297]" /> Your adventure continues
        </div>
        <h1 className="mt-[clamp(5px,1.2dvh,12px)] text-[clamp(24px,4.5dvh,43px)] font-black leading-[1.08] tracking-[-.045em]">
          First words. <span className="text-[#3558AE]">Big adventures.</span>
        </h1>
        <p className="ac-intro-short mx-auto mt-[clamp(4px,1dvh,10px)] max-w-lg text-[clamp(11px,1.8dvh,14px)] font-medium text-[#8490A6]">
          You're visiting {data.language.name}. Let's learn, play, and discover something new!
        </p>
      </div>

      {/* Four-way progress trail; stages are fixed by the preview's real state. */}
      <ol aria-label="Lesson preview progress" className="mx-auto mt-[clamp(11px,2.2dvh,20px)] grid w-full max-w-[690px] shrink-0 grid-cols-4 gap-2 sm:gap-3">
        {stages.map((item, index) => {
          const Icon = item.icon;
          const active = index === stepIndex;
          const done = index < stepIndex;
          return (
            <li key={item.key} aria-current={active ? "step" : undefined} className="min-w-0">
              <div className={`flex items-center justify-center gap-1.5 rounded-xl border px-1 py-[clamp(5px,1.1dvh,9px)] text-[10px] font-extrabold transition-all duration-300 sm:gap-2 sm:text-xs ${
                active ? "border-[#BACBED] bg-white text-[#102452] shadow-[0_5px_14px_rgba(16,36,82,.08)]" :
                  done ? "border-[#DAE9E3] bg-[#F1FAF4] text-[#45956F]" : "border-[#E8EDF5] bg-white/55 text-[#A1AEC0]"
              }`}>
                {done ? <Check size={13} strokeWidth={3} /> : <Icon size={13} />}
                <span className="truncate">{item.label}</span>
              </div>
              <div className={`mt-1.5 h-1 rounded-full ${index <= stepIndex ? "bg-[#3558AE]" : "bg-[#DCE5F2]"}`} />
            </li>
          );
        })}
      </ol>

      <div className="mt-[clamp(10px,2dvh,21px)] grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(270px,.86fr)_minmax(0,1.14fr)] lg:gap-6">
        {/* Floating passport + animated Ace: large-screen companion to the lesson. */}
        <aside className="relative hidden min-h-0 flex-col overflow-hidden rounded-[34px] border border-white bg-white/70 p-5 shadow-[0_16px_50px_rgba(16,36,82,.06)] lg:flex">
          <div className="flex shrink-0 items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#8391A8]"><Compass size={15} style={{ color: theme.accent }} /> Language passport</span>
            <span className="rounded-full border border-[#E5EBF5] bg-white px-3 py-1 text-[10px] font-extrabold text-[#8492A7]">YOUR FIRST STOP</span>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <div aria-hidden="true" className="pointer-events-none absolute h-[min(38dvh,330px)] w-[min(38dvh,330px)] max-w-[95%]">
              <div className="ac-intro-orbit absolute inset-[4%] rounded-full border-2 border-dashed border-[#B0C8E9]/75" />
              <div className="ac-intro-reverse absolute inset-[16%] rounded-full border border-[#C1D4EC]" />
              <span className="ac-intro-spark absolute left-[4%] top-[14%] text-3xl text-[#FFCF67]">✦</span>
              <span className="ac-intro-spark absolute bottom-[12%] right-[3%] text-3xl text-[#FF9297]" style={{ animationDelay: "-1.5s" }}>✧</span>
            </div>
            <div className="ac-intro-float relative z-10 flex w-[min(80%,310px)] min-w-0 flex-col overflow-hidden rounded-[30px] border-[6px] border-white bg-white shadow-[0_18px_48px_rgba(16,36,82,.15)]">
              <div className="relative mx-3 mt-3 flex min-h-[105px] flex-1 items-center justify-center rounded-[20px] p-5" style={{ backgroundColor: theme.tint }}>
                <div className="ac-intro-glow pointer-events-none absolute h-[83%] w-[83%] rounded-full border-2 border-white/80" />
                <div className="relative h-[clamp(90px,17dvh,150px)] w-[85%] overflow-hidden rounded-[20px] border-[5px] border-white bg-white shadow-[0_10px_24px_rgba(16,36,82,.13)]">
                  <PortalFlag language={data.language} theme={theme} />
                </div>
              </div>
              <div className="shrink-0 px-4 py-4 text-center">
                <span className="text-[10px] font-black uppercase tracking-[.15em]" style={{ color: theme.accent }}>NOW EXPLORING</span>
                <h2 className="mt-1 truncate text-[clamp(22px,3.7dvh,33px)] font-black leading-tight tracking-[-.04em]">{data.language.name}</h2>
                <p className="mt-1 truncate text-xs text-[#8290A9]">{data.language.native_name || theme.romanized}</p>
                <div className="mt-3 truncate rounded-full px-3 py-1.5 text-xs font-extrabold" style={{ color: theme.accent, backgroundColor: theme.tint }}>
                  {theme.greeting} · {theme.romanized}
                </div>
              </div>
            </div>
            <div className="ac-intro-mascot pointer-events-none absolute bottom-[2%] right-[0%] z-20 h-[clamp(74px,13dvh,120px)] w-[clamp(74px,13dvh,120px)] drop-shadow-[0_12px_12px_rgba(16,36,82,.14)]">
              <Image src="/icon head.png" alt="" fill sizes="120px" className="object-contain" />
            </div>
          </div>

          <div className="ac-intro-short z-10 mx-auto mb-1 flex max-w-[350px] items-center gap-2 rounded-2xl border border-[#EAF0F8] bg-white/95 px-4 py-2.5 text-xs font-semibold leading-relaxed text-[#6D7C97]">
            <Sparkles size={18} className="shrink-0 text-[#E4A64E]" />
            <p>{guideMessage}</p>
          </div>
        </aside>

        {/* The outer document does not scroll. Large learning/quiz components scroll inside this card. */}
        <article className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[27px] border border-[#E6EAF4] bg-white/95 shadow-[0_22px_65px_rgba(16,36,82,.11)] sm:rounded-[34px]">
          <div className="relative flex shrink-0 items-center justify-between gap-2 border-b border-[#EBEFF6] bg-white/80 px-4 py-[clamp(10px,1.6dvh,15px)] sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl" style={{ backgroundColor: theme.tint }}>
                {data.language.flag_emoji || theme.emoji}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-[.15em] text-[#8996AA]">Your first lesson</p>
                <p className="truncate text-[13px] font-black text-[#102452] sm:text-sm">{data.lesson.title}</p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F4F8FE] px-2.5 py-1.5 text-[10px] font-black text-[#6F83A2] sm:px-3">
              <Star size={13} className="text-[#E3AB44]" /> <span className="hidden min-[400px]:inline">Preview</span> <span>#{data.lesson.lesson_order}</span>
            </span>
          </div>

          {/* Scroll area intentionally keeps practice buttons accessible even with many quiz questions. */}
          <div ref={scrollRef} className="ac-intro-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-[clamp(14px,2.8dvh,27px)] sm:px-7">
            <div key={`${stage === "complete" ? "practice" : stage}-${stage === "learn" ? wordIndex : ""}`} className="ac-intro-enter">
              {stage === "welcome" && (
                <>
                  <div className="mb-4 flex items-center gap-3 lg:hidden">
                    <div className="ac-intro-mascot relative h-14 w-14 shrink-0"><Image src="/icon head.png" alt="Ace, your learning guide" fill sizes="56px" className="object-contain" /></div>
                    <p className="rounded-2xl bg-[#EAF5FF] px-4 py-3 text-xs font-semibold leading-5 text-[#617391]">{guideMessage}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.13em]" style={{ backgroundColor: theme.tint, color: theme.accent }}>
                    <Sparkles size={13} /> Welcome aboard!
                  </span>
                  <h2 className="mt-3 text-[clamp(24px,4dvh,38px)] font-black leading-tight tracking-[-.045em]">
                    Say hello to <span style={{ color: theme.accent }}>{data.language.name}.</span>
                  </h2>
                  <p className="mt-2 text-[clamp(13px,2dvh,15px)] leading-relaxed text-[#7A89A2]">
                    Your first language adventure starts with a few useful words. Ready to explore with Ace?
                  </p>
                  <div className="mt-[clamp(14px,3dvh,24px)] rounded-[23px] border border-[#E8EDF6] bg-[#F9FBFF] p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.1em] text-[#7184A1]"><BookOpen size={15} className="text-[#3558AE]" /> Your adventure ticket</div>
                    <p className="mt-3 text-lg font-black text-[#102452]">{data.course.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#8190A9]">
                      <span className="inline-flex items-center gap-1"><MapPin size={13} /> {data.unit.location_name || data.unit.title}</span>
                      <span className="inline-flex items-center gap-1"><Sparkles size={13} /> {data.words.length} {data.words.length === 1 ? "phrase" : "phrases"}</span>
                    </div>
                    <div className="mt-3 h-px bg-[#E4EAF5]" />
                    <p className="mt-3 text-sm font-bold text-[#536A91]">{data.lesson.title}</p>
                    {(data.lesson.description || data.course.description) && (
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[#7E8DA5]">{data.lesson.description || data.course.description}</p>
                    )}
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[#94A0B2]">Free lesson preview • No account needed</p>
                </>
              )}

              {stage === "learn" && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.13em]" style={{ backgroundColor: theme.tint, color: theme.accent }}>
                      <BookOpen size={13} /> Phrase discovery
                    </span>
                    <span className="text-xs font-bold text-[#8594A9]">{wordIndex + 1} / {data.words.length}</span>
                  </div>
                  <h2 className="mt-3 text-[clamp(22px,3.6dvh,32px)] font-black leading-tight tracking-[-.04em]">Learn something new!</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#8291A9]">Listen, read, and explore the phrase before moving on.</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8EDF6]">
                    <div className="h-full rounded-full bg-[#3558AE] transition-[width] duration-500" style={{ width: `${Math.min(100, progress * 100)}%` }} />
                  </div>
                  {word ? (
                    <div className="mt-3 min-w-0">
                      <PreviewWordCard
                        key={word.id}
                        word={word}
                        words={data.words}
                        languageCode={data.language.code}
                        onChecked={() => setWordChecked(true)}
                      />
                    </div>
                  ) : null}
                </>
              )}

              {(stage === "practice" || stage === "complete") && (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.13em]" style={{ backgroundColor: theme.tint, color: theme.accent }}>
                      {stage === "complete" ? <Trophy size={13} /> : <Gamepad2 size={13} />}
                      {stage === "complete" ? "Adventure complete" : "Game time"}
                    </span>
                    {stage === "complete" && <span className="ac-intro-spark text-xl text-[#E4A64E]">✦</span>}
                  </div>
                  <h2 className="text-[clamp(22px,3.6dvh,32px)] font-black leading-tight tracking-[-.04em]">
                    {stage === "complete" ? "You did it! 🎉" : "Let's put it to the test!"}
                  </h2>
                  <p className="mb-4 mt-1 text-xs leading-relaxed text-[#8291A9]">
                    {stage === "complete"
                      ? "You've taken your first step into a new language. Keep exploring!"
                      : "Play through your practice activities with Ace."}
                  </p>
                  <GuestPreviewActivities
                    languageId={data.language.id}
                    languageCode={data.language.code}
                    courseId={data.course.id}
                    lessonId={data.lesson.id}
                    words={data.words}
                    onComplete={() => setStage("complete")}
                  />
                </>
              )}
            </div>
          </div>

          {(stage === "welcome" || stage === "learn") && (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#E9EEF6] bg-white px-4 py-[clamp(10px,1.7dvh,16px)] sm:px-7">
              <span className="ac-intro-short max-w-[190px] text-[11px] font-semibold leading-relaxed text-[#97A4B7]">
                {stage === "welcome" ? "Your language journey begins here." : wordChecked ? "Nice! You're ready for the next one." : "Complete this phrase to continue."}
              </span>
              <button
                type="button"
                className={`${primaryButton} ml-auto shrink-0 px-5 sm:px-7`}
                disabled={stage === "learn" && Boolean(word) && !wordChecked}
                onClick={stage === "welcome" ? () => setStage("learn") : advanceWord}
              >
                {stage === "welcome" ? "Start adventure" : wordIndex < data.words.length - 1 ? "Next phrase" : "Let's play"}
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
