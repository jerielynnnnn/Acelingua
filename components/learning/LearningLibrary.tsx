"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Bookmark, Library, Loader2, Map, Search } from "lucide-react";
import { useLearnerId } from "@/components/dashboard/LearnerShell";
import { createClient } from "@/lib/supabase/client";
import { loadLearningLibrary } from "@/lib/learning-library";
import { withTimeout } from "@/lib/request-timeout";

export default function LearningLibrary() {
  const userId = useLearnerId();
  const [courses, setCourses] = useState<Awaited<ReturnType<typeof loadLearningLibrary>> | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "learning" | "review">("all");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try { const result = await withTimeout(loadLearningLibrary(createClient(), userId), 20000, "Your library took too long to load. Please retry."); if (!cancelled) setCourses(result); }
      catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load your library."); }
    }
    void load(); return () => { cancelled = true; };
  }, [userId, attempt]);
  if (error) return <main className="mx-auto max-w-xl p-8 text-[#071A4A]"><h1 className="text-2xl font-bold">Your library is still here</h1><p role="alert" className="mt-4">{error}</p><button className="mt-6 rounded-full bg-[#071A4A] px-6 py-3 font-bold text-white" onClick={() => { setError(""); setAttempt(n => n + 1); }}>Retry</button></main>;
  if (!courses) return <main role="status" className="flex min-h-[70vh] items-center justify-center gap-3 text-[#071A4A]"><Loader2 className="animate-spin" /> Opening your learning library...</main>;
  const ready = courses.filter(course => !course.error && course.total !== null && course.total > 0);
  const recent = ready.find(course => course.completed !== course.total);
  const languageCount = new Set(ready.map(course => course.language?.id)).size;
  const filtered = courses.filter(course => [course.title, course.language?.name ?? "", course.language?.native_name ?? ""].some(value => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    && (filter === "all" || (filter === "review" ? Boolean(course.total) && course.completed === course.total : course.completed !== course.total)));
  const covers = ["from-[#071A4A] to-[#3558AE]", "from-[#43376C] to-[#8B75A6]", "from-[#803B64] to-[#B66A91]", "from-[#245B72] to-[#548FA4]"];
  return <main className="min-h-screen bg-[#F4F9FD] px-5 py-8 text-[#071A4A] sm:px-8"><div className="mx-auto max-w-6xl">
    <header className="flex flex-wrap items-start justify-between gap-5"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#3558AE]"><Library size={16} /> Your learning space</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">My language library</h1><p className="mt-3 text-sm leading-6 text-[#62759C]">Your saved courses, organized in one place. Pick a book and continue your journey.</p></div><Link href="/world" className="inline-flex items-center gap-2 rounded-full border border-[#3558AE]/20 bg-white px-5 py-3 text-sm font-bold text-[#3558AE]"><Map size={17} /> Explore a new language</Link></header>
    <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold text-[#62759C]"><span className="rounded-full bg-white px-4 py-2">{languageCount} languages learning</span><span className="rounded-full bg-white px-4 py-2">{courses.length} saved courses</span></div>
    {recent && <section className="relative mt-8 overflow-hidden rounded-[28px] border border-[#DDE7F5] bg-white p-6 shadow-sm sm:p-8"><div aria-hidden="true" className="absolute -right-12 -top-24 h-64 w-64 rounded-full bg-[#C7A9D4]/15" /><div className="relative flex flex-wrap items-center justify-between gap-6"><div className="flex items-center gap-5"><Image src="/icon head.png" alt="Ace, your learning guide" width={80} height={80} className="hidden h-20 w-20 object-contain sm:block" /><div><p className="text-xs font-bold uppercase tracking-widest text-[#B64074]">Continue your chapter</p><h2 className="mt-2 text-xl font-extrabold">{recent.language?.name} · {recent.title}</h2><p className="mt-2 text-sm text-[#62759C]">{recent.currentUnit ?? "Open your course roadmap"}</p></div></div><Link href={`/learn?course=${encodeURIComponent(recent.id)}`} className="inline-flex items-center gap-2 rounded-full bg-[#071A4A] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3558AE]">Continue journey <ArrowRight size={17} /></Link></div></section>}
    <section className="mt-9"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-extrabold">Your bookshelf</h2><div className="relative w-full sm:w-72"><label htmlFor="library-search" className="sr-only">Search saved languages and courses</label><Search size={17} className="absolute left-4 top-3.5 text-[#62759C]" aria-hidden="true" /><input id="library-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a language or course" className="h-11 w-full rounded-xl border border-[#071A4A]/10 bg-white pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#3558AE]" /></div></div><div role="group" aria-label="Filter saved courses" className="mt-5 flex flex-wrap gap-2">{(["all", "learning", "review"] as const).map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-full px-5 py-2 text-xs font-bold ${filter === value ? "bg-[#071A4A] text-white" : "bg-white text-[#62759C]"}`}>{value === "all" ? "All books" : value === "learning" ? "In progress" : "Ready to review"}</button>)}</div>
      {!filtered.length ? <div className="mt-7 rounded-3xl border border-dashed border-[#C7A9D4] bg-white p-10 text-center"><BookOpen size={42} className="mx-auto text-[#3558AE]" /><h3 className="mt-5 text-xl font-bold">{courses.length ? "No books match this view" : "Your first chapter awaits"}</h3><p className="mt-3 text-sm text-[#62759C]">{courses.length ? "Try another search or filter." : "Choose a destination in World to add a course to your library."}</p>{!courses.length && <Link href="/world" className="mt-5 inline-block rounded-full bg-[#071A4A] px-6 py-3 text-sm font-bold text-white">Explore World</Link>}</div>
      : <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((course, index) => {
        const review = Boolean(course.total) && course.completed === course.total;
        return <article key={course.id} className="group overflow-hidden rounded-[24px] border border-[#071A4A]/5 bg-white shadow-sm transition motion-reduce:transition-none hover:-translate-y-1 hover:shadow-lg"><div className={`relative flex h-56 flex-col justify-between overflow-hidden bg-gradient-to-br p-7 pl-9 text-white ${covers[index % covers.length]}`}><div aria-hidden="true" className="absolute bottom-0 left-3 top-0 w-px bg-white/20" /><div aria-hidden="true" className="absolute -bottom-14 -right-12 h-52 w-52 rounded-full border-[24px] border-white/10" /><div className="relative flex items-center justify-between"><span className="text-3xl" aria-hidden="true">{course.flag}</span><Bookmark size={20} className="text-white/60" aria-label="Saved course" /></div><div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">{course.level ?? "Language course"}</p><h3 className="mt-3 text-3xl font-extrabold">{course.language?.name ?? "Saved course"}</h3><p lang={course.language?.code} className="mt-2 text-sm text-white/70">{course.language?.native_name}</p></div></div><div className="p-6"><h4 className="font-extrabold leading-6">{course.title}</h4>{course.error ? <p role="status" className="mt-4 text-sm leading-6 text-[#B64074]">{course.error}</p> : <><p className="mt-2 min-h-10 text-xs leading-5 text-[#62759C]">{course.currentUnit ? `Current chapter: ${course.currentUnit}` : review ? "Published lessons reviewed. More chapters may be added." : "Your roadmap is ready to explore."}</p><div className="mt-4 flex items-center justify-between text-xs font-semibold"><span>{course.completed} / {course.total} published lessons</span><span className="text-[#3558AE]">{course.percentage}%</span></div><progress aria-label={`${course.title} published lesson progress`} value={course.completed ?? 0} max={course.total || 1} className="mt-3 h-2 w-full accent-[#3558AE]" /><Link href={`/learn?course=${encodeURIComponent(course.id)}`} className="mt-5 inline-flex w-full items-center justify-between rounded-xl bg-[#EAF5FF] px-4 py-3 text-sm font-bold text-[#3558AE] transition hover:bg-[#071A4A] hover:text-white">{review ? "Review roadmap" : "Open roadmap"}<ArrowRight size={16} /></Link></>}</div></article>;
      })}</div>}
    </section>
  </div></main>;
}
