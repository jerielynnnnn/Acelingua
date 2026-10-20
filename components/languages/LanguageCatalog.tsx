"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import { Fredoka } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cloud,
  Compass,
  Globe2,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import LearnerShell from "@/components/dashboard/LearnerShell";
import { createClient } from "@/lib/supabase/client";
import { enrollStartingCourse, POST_AUTH_ROUTE } from "@/lib/auth-onboarding";
import {
  loadLanguageCatalog,
  type CatalogCourse,
  type CatalogLanguage,
} from "@/lib/language-catalog";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const languageFlags: Record<string, string> = {
  ja: "/flags/japan.jpg",
  ko: "/flags/korea.jpg",
  zh: "/flags/china.jpg",
  es: "/flags/spanish.jpg",
  de: "/flags/german.jpg",
  th: "/flags/thailand.jpg",
  fr: "/flags/france.jpg",
};

// Presentation only. Course availability and language selection still come from Supabase.
const languageAppearance: Record<
  string,
  { soft: string; accent: string; greeting: string }
> = {
  ja: { soft: "#FFE5EB", accent: "#F18098", greeting: "Konnichiwa!" },
  ko: { soft: "#E7EDFF", accent: "#768BDB", greeting: "Annyeonghaseyo!" },
  zh: { soft: "#FFF0D9", accent: "#E8A94E", greeting: "Nǐ hǎo!" },
  es: { soft: "#FFF1D4", accent: "#E9B44D", greeting: "¡Hola!" },
  de: { soft: "#EEE6FF", accent: "#A18BDE", greeting: "Hallo!" },
  th: { soft: "#E1F7F0", accent: "#55BDA2", greeting: "Sawasdee!" },
  fr: { soft: "#E4F3FF", accent: "#67B4E6", greeting: "Bonjour!" },
};

const defaultAppearance = {
  soft: "#EBF1FF",
  accent: "#85B2E7",
  greeting: "Hello!",
};

export default function LanguageCatalog() {
  const router = useRouter();
  const [data, setData] = useState<Awaited<ReturnType<typeof loadLanguageCatalog>> | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [starting, setStarting] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);

  // Original catalog/session loading logic retained.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError && !isAuthSessionMissingError(authError)) throw authError;
        const catalog = await loadLanguageCatalog(supabase, auth.user?.id);
        if (!cancelled) {
          setUser(auth.user);
          setData(catalog);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "We couldn't load the language catalog.");
        }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [attempt]);

  // Original guest preview, enrollment, and onboarding navigation retained.
  async function start(language: CatalogLanguage, course: CatalogCourse) {
    if (busy.current) return;
    busy.current = true; setStarting(course.id); setActionError("");
    try {
      if (!user) {
        if (!course.previewAvailable) throw new Error("This language's guest preview is in preparation.");
        localStorage.setItem("acelingua_selected_language", language.code);
        localStorage.setItem("acelingua_selected_language_id", language.id);
        localStorage.setItem("acelingua_onboarding_started", "true");
        localStorage.setItem("acelingua_onboarding_source", "guest_preview");
        localStorage.removeItem("acelingua_intro_completed");
        localStorage.removeItem("acelingua_onboarding_user_id");
        router.push(`/learn/intro?language=${encodeURIComponent(language.code)}`);
        return;
      }
      const supabase = createClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user || auth.user.id !== user.id) throw new Error("Your session changed. Please sign in again.");
      const courseId = await enrollStartingCourse(supabase, auth.user, { languageId: language.id, languageCode: language.code }, true, course.id);
      const onboarding = auth.user.user_metadata.acelingua_onboarding;
      if (onboarding && onboarding.completed !== true) {
        const { error: updateError } = await supabase.auth.updateUser({ data: { acelingua_onboarding: {
          source: "direct_registration", languageId: language.id, languageCode: language.code, courseId, introCompleted: true,
        } } });
        if (updateError) throw updateError;
        localStorage.setItem("acelingua_onboarding_user_id", auth.user.id);
        localStorage.setItem("acelingua_onboarding_course_id", courseId);
        router.push(POST_AUTH_ROUTE);
      } else router.push(`/learn/${encodeURIComponent(courseId)}`);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "We couldn't start this course. Please retry.");
      busy.current = false; setStarting(null);
    }
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(124deg,#f9f2ff_0%,#e6f7ff_29%,#eeeafd_61%,#fff0e9_100%)] px-5 py-16 text-[#102452]">
        <div className="w-full max-w-lg rounded-[32px] border border-white/80 bg-white/75 p-8 text-center shadow-[0_20px_60px_rgba(16,36,82,.1)] backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFE7ED] text-[#B64074]"><Globe2 size={27} /></div>
          <h1 className={`${fredoka.className} text-3xl font-bold`}>Languages unavailable</h1>
          <p role="alert" className="mt-3 text-sm leading-7 text-[#536384]">{error}</p>
          <button type="button" className="mt-7 rounded-full bg-[#102452] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#3558AE]" onClick={() => { setError(""); setAttempt(n => n + 1); }}>Retry</button>
          <Link href="/" className="ml-5 text-sm font-bold text-[#3558AE] hover:underline">Home</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main role="status" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[linear-gradient(124deg,#f9f2ff_0%,#e6f7ff_29%,#eeeafd_61%,#fff0e9_100%)] text-[#102452]">
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/75 shadow-lg"><Loader2 size={29} className="animate-spin text-[#3558AE]" /></div>
        <p className={`${fredoka.className} text-lg font-semibold`}>Preparing your language adventure...</p>
      </main>
    );
  }

  const query = search.trim().toLocaleLowerCase();
  const filtered = data.languages.filter(language =>
    [language.name, language.native_name ?? "", language.code].some(value =>
      value.toLocaleLowerCase().includes(query)
    )
  );

  const content = (
    <main className="acel-languages-bg relative isolate min-h-screen overflow-x-clip text-[#102452]">
      {/* Soft pastel atmosphere, same visual family as /about */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="acel-language-dots absolute inset-0 opacity-55" />
        <div className="acel-language-aurora-one absolute -left-40 top-4 h-[540px] w-[540px] rounded-full bg-[#CDB8FF]/30 blur-[90px]" />
        <div className="acel-language-aurora-two absolute -right-40 top-24 h-[560px] w-[560px] rounded-full bg-[#78D6FF]/35 blur-[90px]" />
        <div className="acel-language-aurora-three absolute left-[30%] top-[600px] h-[490px] w-[580px] rounded-full bg-[#FFC3CD]/25 blur-[95px]" />
        <Cloud className="acel-language-cloud absolute left-[53%] top-[12%] h-16 w-24 text-white/55" strokeWidth={1.3} />
        <Cloud className="acel-language-cloud-delayed absolute right-[8%] top-[19%] h-14 w-20 text-[#85D8FA]/45" strokeWidth={1.3} />
      </div>

      <div className="relative z-10">
        {/* About-inspired header / Log In button */}
        <header className="border-b border-white/40 bg-white/10 backdrop-blur-[12px]">
          <div className="mx-auto flex min-h-[88px] w-full max-w-[1380px] items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-14">
            <Link href={user ? "/dashboard" : "/"} aria-label="ACELingua home" className="flex shrink-0 items-center">
              <Logo alt="ACELingua" sizes="(max-width: 640px) 165px, 200px" priority className="h-auto w-[165px] object-contain sm:w-[200px]" />
            </Link>
            <nav aria-label="Languages page navigation" className="flex items-center gap-3 sm:gap-6">
              <Link href="/about" className="hidden text-sm font-bold text-[#536384] transition hover:text-[#3558AE] sm:block">About Us</Link>
              <Link
                href={user ? "/dashboard" : "/login"}
                className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#102452] px-5 text-[13px] font-black text-white shadow-[0_8px_20px_rgba(16,36,82,.17)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3558AE] hover:shadow-[0_12px_26px_rgba(53,88,174,.25)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85D8FA]/60"
              >
                {user ? "Dashboard" : "Log In"}
                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </nav>
          </div>
        </header>

        {/* Search and results */}
        <section aria-labelledby="languages-title" className="relative mx-auto w-full max-w-[1380px] px-5 pb-20 pt-5 sm:px-8 lg:px-14 lg:pb-28">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em] text-[#3558AE]"><Globe2 size={15} /> HELLO, WORLD</p>
              <h2 id="languages-title" className={`${fredoka.className} mt-3 text-[clamp(1.9rem,3.2vw,3rem)] font-bold tracking-[-.035em]`}>Find your perfect starting point</h2>
            </div>
          </div>

          <div className="relative mt-8 max-w-[680px]">
            <label htmlFor="language-search" className="mb-3 block text-[12px] font-extrabold text-[#102452]">Search languages</label>
            <div className="group relative rounded-[19px] border border-white/85 bg-white/75 shadow-[0_12px_36px_rgba(16,36,82,.07)] backdrop-blur-xl transition-all duration-300 focus-within:border-[#85D8FA] focus-within:bg-white focus-within:shadow-[0_15px_40px_rgba(53,88,174,.12)]">
              <Search size={21} aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#3558AE]" />
              <input
                id="language-search"
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search Japanese, Korean, Spanish..."
                autoComplete="off"
                className="h-[60px] w-full appearance-none rounded-[19px] bg-transparent pl-14 pr-24 text-sm font-medium text-[#102452] outline-none placeholder:text-[#8290AE] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#85D8FA]/50 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Clear language search" className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-[#EDF3FF] px-3 py-2 text-xs font-bold text-[#3558AE] transition hover:bg-[#DFE9FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3558AE]">
                  <X size={13} /> Clear
                </button>
              )}
            </div>
            <p className="mt-2 pl-1 text-[11px] font-medium text-[#536384]/80">Search by language name, native writing, or code.</p>
          </div>

          {actionError && (
            <p role="alert" className="mt-7 rounded-2xl border border-[#FF9297]/30 bg-[#FFE6EB]/70 p-4 text-sm font-semibold text-[#B64074]">{actionError}</p>
          )}

          {!filtered.length && (
            <div className="mt-10 rounded-[28px] border border-white/85 bg-white/70 p-10 text-center shadow-sm backdrop-blur-lg">
              <Search className="mx-auto mb-4 text-[#8AA1CF]" size={32} />
              <h3 className={`${fredoka.className} text-2xl font-bold`}>{data.languages.length ? "No matching languages" : "Languages are coming soon"}</h3>
              <p className="mt-2 text-sm leading-7 text-[#536384]">{data.languages.length ? "Try a different language name or clear your search." : "No active languages are available yet."}</p>
              {search && <button type="button" onClick={() => setSearch("")} className="mt-5 rounded-full bg-[#102452] px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#3558AE]">Clear search</button>}
            </div>
          )}

          <div className="mt-9 grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(language => {
              const courses = data.courses.filter(course => course.language_id === language.id);
              const code = language.code.toLowerCase().split(/[-_]/)[0];
              const flag = languageFlags[code];
              const look = languageAppearance[code] ?? defaultAppearance;
              const hasAvailableCourse = courses.some(course => user ? course.playable : course.previewAvailable);

              return (
                <article key={language.id} className="acel-language-card group relative isolate flex min-h-[370px] flex-col overflow-hidden rounded-[30px] border border-white/85 bg-white/65 p-5 shadow-[0_12px_38px_rgba(16,36,82,.055)] backdrop-blur-xl transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-1.5 hover:bg-white/85 hover:shadow-[0_24px_52px_rgba(16,36,82,.13)] sm:p-6">
                  <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full opacity-60 blur-[50px] transition-transform duration-500 group-hover:scale-125" style={{ backgroundColor: look.soft }} />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex h-[100px] w-[130px] items-center justify-center rounded-[23px] border border-white/85 shadow-[0_10px_24px_rgba(16,36,82,.06)]" style={{ backgroundColor: look.soft }}>
                      {flag ? (
                        <div className="relative h-[65px] w-[94px] overflow-hidden rounded-[8px] shadow-[0_5px_13px_rgba(16,36,82,.14)] transition-transform duration-500 group-hover:scale-105">
                          <Image src={flag} alt={`${language.name} flag`} fill sizes="94px" className="bg-white object-contain" />
                        </div>
                      ) : (
                        <span role="img" aria-label={`${language.name} flag`} className="text-5xl">{language.flag_emoji || "🌐"}</span>
                      )}
                    </div>
                  </div>

                  <div className="relative mt-6 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h3 className={`${fredoka.className} text-[27px] font-bold leading-tight tracking-[-.025em]`}>{language.name}</h3>
                      <p className="mt-1 text-sm font-medium text-[#536384]">{language.native_name}</p>
                    </div>
                    <span className="rounded-full px-3 py-1.5 text-[11px] font-extrabold" style={{ color: look.accent, backgroundColor: look.soft }}>{look.greeting}</span>
                  </div>

                  <div className="relative mt-6 flex-1 border-t border-[#102452]/[0.08] pt-5">
                    {!courses.length && (
                      <div className="rounded-[17px] border border-white/85 bg-white/70 px-4 py-4">
                        <p className="flex items-center gap-2 text-sm font-bold text-[#536384]"><BookOpen size={17} className="text-[#A18BDE]" /> Course in Preparation</p>
                        <p className="mt-2 text-xs leading-6 text-[#7B88A5]">Lessons for this language are on the way.</p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {courses.map(course => {
                        const available = user ? course.playable : course.previewAvailable;
                        return (
                          <div key={course.id} className="rounded-[19px] border border-white/85 bg-white/70 p-4 shadow-[0_5px_16px_rgba(16,36,82,.035)]">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-[14px] font-extrabold leading-6 text-[#102452]">{course.title}</h4>
                              <span className="shrink-0 rounded-full bg-[#EBF2FF] px-2.5 py-1 text-[10px] font-bold capitalize text-[#3558AE]">{course.level}</span>
                            </div>
                            {course.description && <p className="mt-2 text-[12px] leading-6 text-[#536384]">{course.description}</p>}
                            {user && course.status && course.completedLessons !== null && (
                              <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#536384]"><CheckCircle2 size={14} className="text-[#55B98A]" />{course.completedLessons} / {course.publishedLessons} published lessons completed</p>
                            )}
                            {!available ? (
                              <p className="mt-4 rounded-xl bg-[#F2ECFA] px-3 py-2.5 text-xs font-bold text-[#8972A9]">{user ? "Course in Preparation" : "Preview in Preparation"}</p>
                            ) : (
                              <button
                                type="button"
                                disabled={Boolean(starting)}
                                onClick={() => void start(language, course)}
                                className="group/button mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#102452] px-4 py-3 text-xs font-extrabold text-white shadow-[0_8px_16px_rgba(16,36,82,.13)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3558AE] hover:shadow-[0_12px_22px_rgba(53,88,174,.22)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {starting === course.id ? <><Loader2 size={16} className="animate-spin" /> Preparing...</> : <>{!user ? "Try Guest Preview" : course.status === "active" ? "Continue Learning" : course.status ? "Resume Learning" : "Start Learning"}<ArrowRight size={15} className="transition-transform group-hover/button:translate-x-1" /></>}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="border-t border-white/60 bg-white/20 px-5 py-7 backdrop-blur-md sm:px-8 lg:px-14">
          <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="text-[11px] font-semibold text-[#536384]">© 2026 ACELingua · Every journey begins with hello.</p>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        .acel-languages-bg {
          background: linear-gradient(124deg, #f9f2ff 0%, #e6f7ff 29%, #eeeafd 61%, #fff0e9 100%);
          background-size: 220% 220%;
          animation: acel-language-background 24s ease-in-out infinite alternate;
        }
        .acel-language-dots {
          background-image: radial-gradient(rgba(87,105,168,.13) 1px, transparent 1px);
          background-size: 26px 26px;
          mask-image: linear-gradient(to bottom, transparent, black 12%, black 82%, transparent);
        }
        .acel-language-aurora-one { animation: acel-language-drift 16s ease-in-out infinite alternate; }
        .acel-language-aurora-two { animation: acel-language-drift 21s -7s ease-in-out infinite alternate-reverse; }
        .acel-language-aurora-three { animation: acel-language-drift 18s -5s ease-in-out infinite alternate; }
        .acel-language-cloud { animation: acel-language-bob 10s ease-in-out infinite; }
        .acel-language-cloud-delayed { animation: acel-language-bob 13s -4s ease-in-out infinite alternate-reverse; }
        .acel-language-mascot { animation: acel-language-bob 7s ease-in-out infinite; }
        .acel-language-sparkle { animation: acel-language-twinkle 3.6s ease-in-out infinite; }
        .acel-language-reveal { animation: acel-language-rise .8s both cubic-bezier(.2,.8,.2,1); }
        .acel-language-card { animation: acel-language-rise .7s cubic-bezier(.2,.8,.2,1); }
        @keyframes acel-language-background { from { background-position: 0% 30%; } to { background-position: 100% 70%; } }
        @keyframes acel-language-drift { from { transform: translate3d(-16px,10px,0) scale(1); } to { transform: translate3d(24px,-18px,0) scale(1.08); } }
        @keyframes acel-language-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes acel-language-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes acel-language-twinkle { 0%,100% { opacity:.5; scale:.88; } 50% { opacity:1; scale:1.1; } }
        @media (prefers-reduced-motion: reduce) {
          .acel-languages-bg, .acel-language-aurora-one, .acel-language-aurora-two, .acel-language-aurora-three,
          .acel-language-cloud, .acel-language-cloud-delayed, .acel-language-mascot, .acel-language-sparkle,
          .acel-language-reveal, .acel-language-card { animation: none !important; }
        }
      `}</style>
    </main>
  );

  return user ? <LearnerShell>{content}</LearnerShell> : content;
}
