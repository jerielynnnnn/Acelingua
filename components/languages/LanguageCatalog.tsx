"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { ArrowRight, Loader2, Search } from "lucide-react";
import LearnerShell from "@/components/dashboard/LearnerShell";
import { createClient } from "@/lib/supabase/client";
import { enrollStartingCourse, POST_AUTH_ROUTE } from "@/lib/auth-onboarding";
import { loadLanguageCatalog, type CatalogCourse, type CatalogLanguage } from "@/lib/language-catalog";

const languageFlags: Record<string, string> = {
  ja: "/flags/japan.jpg",
  ko: "/flags/korea.jpg",
  zh: "/flags/china.jpg",
  es: "/flags/spanish.jpg",
  de: "/flags/german.jpg",
  th: "/flags/thailand.jpg",
  fr: "/flags/france.jpg",
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
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError && !isAuthSessionMissingError(authError)) throw authError;
        const catalog = await loadLanguageCatalog(supabase, auth.user?.id);
        if (!cancelled) { setUser(auth.user); setData(catalog); }
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load the language catalog."); }
    }
    void load();
    return () => { cancelled = true; };
  }, [attempt]);

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
  if (error) return <main className="mx-auto max-w-xl p-8 text-[#071A4A]"><h1 className="text-2xl font-bold">Languages unavailable</h1><p role="alert" className="mt-4">{error}</p><button className="mt-6 rounded-full bg-[#071A4A] px-6 py-3 font-bold text-white" onClick={() => { setError(""); setAttempt(n => n + 1); }}>Retry</button><Link href="/" className="ml-5 text-[#3558AE]">Home</Link></main>;
  if (!data) return <main role="status" className="flex min-h-screen items-center justify-center gap-3 bg-[#F8FBFF] text-[#071A4A]"><Loader2 className="animate-spin" /> Loading languages...</main>;
  const query = search.trim().toLocaleLowerCase();
  const filtered = data.languages.filter(language => [language.name, language.native_name ?? "", language.code].some(value => value.toLocaleLowerCase().includes(query)));
  const content = <main className="min-h-screen bg-[#F8FBFF] px-5 py-10 text-[#071A4A] sm:px-8">
    <div className="mx-auto max-w-[var(--page-max-width)]">
      <nav aria-label="Languages page" className="mb-8 flex items-center justify-between gap-4">
        <Link href={user ? "/dashboard" : "/"} aria-label="ACELingua home">
          <Logo alt="ACELingua" sizes="(max-width: 640px) 176px, 208px" priority className="h-auto w-44 object-contain sm:w-52" />
        </Link>
        {!user && <Link href="/login" className="font-bold">Log in</Link>}
      </nav>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Languages</h1><p className="mt-3 text-sm leading-6 text-[#071A4A]/65">{user ? "Continue your journey or add another language. Your other courses stay saved." : "Choose a language and try a real preview before creating an account."}</p>
      <label htmlFor="language-search" className="mt-7 block text-sm font-bold">Search languages</label><div className="relative mt-2 max-w-xl"><Search size={19} aria-hidden="true" className="absolute left-4 top-4 text-[#3558AE]" /><input id="language-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Language or native name" className="h-12 w-full rounded-xl border border-[#071A4A]/15 bg-white pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#3558AE]" /></div>
      {actionError && <p role="alert" className="mt-6 rounded-xl bg-[#F9C3D7]/30 p-4 text-[#B64074]">{actionError}</p>}
      {!filtered.length && <p className="mt-10 rounded-2xl bg-white p-6">{data.languages.length ? "No languages match your search." : "No active languages are available yet."}</p>}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(language => {
        const courses = data.courses.filter(course => course.language_id === language.id);
        const flag = languageFlags[language.code.toLowerCase().split(/[-_]/)[0]];
        return <section key={language.id} className="rounded-3xl border border-[#071A4A]/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          {flag ? (
            <div className="relative h-16 w-24 overflow-hidden rounded-xl border border-[#071A4A]/10 bg-[#EAF5FF] shadow-sm">
              <Image src={flag} alt={`${language.name} flag`} fill sizes="96px" className="object-cover" />
            </div>
          ) : (
            <span role="img" aria-label={`${language.name} flag`} className="inline-flex h-16 w-24 items-center justify-center rounded-xl bg-[#EAF5FF] text-4xl">{language.flag_emoji || "🌐"}</span>
          )}<h2 className="mt-5 text-xl font-extrabold">{language.name}</h2><p className="mt-1 text-sm text-[#071A4A]/55">{language.native_name}</p>
          {!courses.length && <p className="mt-5 rounded-xl bg-[#C7A9D4]/20 p-3 text-sm font-semibold">Course in Preparation</p>}
          {courses.map(course => {
            const available = user ? course.playable : course.previewAvailable;
            return <div key={course.id} className="mt-5 border-t border-[#071A4A]/10 pt-4"><h3 className="font-bold">{course.title}</h3><p className="mt-1 text-xs capitalize text-[#071A4A]/60">{course.level}</p>{course.description && <p className="mt-2 text-sm leading-6 text-[#071A4A]/60">{course.description}</p>}
              {user && course.status && course.completedLessons !== null && <p className="mt-3 text-sm">{course.completedLessons} / {course.publishedLessons} published lessons completed</p>}
              {!available ? <p className="mt-4 rounded-xl bg-[#C7A9D4]/20 p-3 text-sm font-semibold">{user ? "Course in Preparation" : "Preview in Preparation"}</p> : <button type="button" disabled={Boolean(starting)} onClick={() => void start(language, course)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#071A4A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3558AE] disabled:opacity-50">{starting === course.id ? <><Loader2 size={16} className="animate-spin" /> Preparing...</> : <>{!user ? "Try Guest Preview" : course.status === "active" ? "Continue Learning" : course.status ? "Resume Learning" : "Start Learning"}<ArrowRight size={16} /></>}</button>}
            </div>;
          })}
        </section>;
      })}</div>
    </div>
  </main>;
  return user ? <LearnerShell>{content}</LearnerShell> : content;
}
