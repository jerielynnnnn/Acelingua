"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Compass } from "lucide-react";
import JourneyRoadmap from "./JourneyRoadmap";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { loadRoadmap } from "@/lib/roadmap";
import LearnerShell from "@/components/dashboard/LearnerShell";
import LearningLibrary from "@/components/learning/LearningLibrary";
import CountryScenery from "@/components/world/CountryScenery";
import { languageLocations } from "@/lib/world/languageLocations";
import { describeCourseLevel } from "@/lib/curriculum/levels";

type Snapshot = Awaited<ReturnType<typeof loadRoadmap>>;
const countryBanners: Record<string, string> = {
  ja: "/dashboard/japan.jpg", zh: "/dashboard/china.jpg", ko: "/dashboard/korea.jpg",
  fr: "/dashboard/france.jpg", de: "/dashboard/germany.jpg", es: "/dashboard/spain.jpg", th: "/dashboard/thai.jpg",
};
export default function CourseRoadmap() {
  const requested = useSearchParams().get("course");
  if (!requested) return <LearnerShell><LearningLibrary /></LearnerShell>;
  return <RoadmapContent key={requested ?? "active"} requested={requested} />;
}

function RoadmapContent({ requested }: { requested: string | null }) {
  const router = useRouter();
  const [data, setData] = useState<Snapshot | null>(null);
  const [choices, setChoices] = useState<{ id: string; title: string }[]>([]);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError && !isAuthSessionMissingError(authError)) throw authError;
        if (!user) { router.replace("/login"); return; }
        const enrollments = await supabase.from("user_courses").select("course_id").eq("user_id", user.id).eq("status", "active");
        if (enrollments.error) throw enrollments.error;
        const ids = [...new Set<string>((enrollments.data ?? []).map((row) => row.course_id))];
        if (!ids.length) { router.replace("/onboarding/languages"); return; }
        if (requested && !ids.includes(requested)) throw new Error("Choose a course you are actively enrolled in.");
        if (!requested && ids.length > 1) {
          const courses = await supabase.from("courses").select("id, title").in("id", ids).order("title");
          if (courses.error) throw courses.error;
          if (!courses.data?.length) throw new Error("Your enrolled courses could not be loaded.");
          if (!cancelled) setChoices(courses.data);
          return;
        }
        const result = await loadRoadmap(supabase, user.id, requested ?? ids[0]);
        const access = await supabase.from("course_progress").update({ last_accessed_at: new Date().toISOString() })
          .eq("user_id", user.id).eq("course_id", result.course.id);
        if (access.error) throw new Error(`We couldn't save your active course: ${access.error.message}`);
        if (!cancelled) setData(result);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load your roadmap. Please try again.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [requested, router, attempt]);

  const lessons = data?.units.flatMap(unit => unit.lessons) ?? [];
  const nextLesson = lessons.find(lesson => data?.states.get(lesson.id) === "current");
  const reviewLesson = lessons.find(lesson => data?.states.get(lesson.id) === "completed");
  const continueLesson = nextLesson ?? reviewLesson;

  return <main className="min-h-screen bg-[#EAF5FF] px-5 py-8 text-[#071A4A]">
    <div className="mx-auto max-w-[var(--page-max-width)]">
      <Link href="/learn" className="text-sm font-bold text-[#3558AE]">My Library</Link>
      {error ? <section role="alert" className="mt-8 rounded-3xl bg-white p-7"><h1 className="text-xl font-bold">Roadmap unavailable</h1><p className="mt-3">{error}</p><button onClick={() => { setError(""); setData(null); setAttempt(attempt + 1); }} className="mt-5 rounded-full bg-[#071A4A] px-6 py-3 text-white">Retry</button><Link href="/learn" className="ml-4 text-[#3558AE]">Choose course</Link></section>
        : choices.length ? <section className="mt-8 rounded-3xl bg-white p-7"><h1 className="text-2xl font-bold">Choose your course</h1><p className="mt-3">You have more than one active course.</p><div className="mt-5 space-y-3">{choices.map((course) => <Link key={course.id} href={`/learn?course=${encodeURIComponent(course.id)}`} className="block rounded-xl bg-[#EAF5FF] p-4 font-bold">{course.title}</Link>)}</div></section>
        : !data ? <div role="status" className="py-20 text-center"><Loader2 className="mx-auto animate-spin" /><p className="mt-4">Loading your roadmap...</p></div>
        : <>
          <div className="relative mt-7 overflow-hidden rounded-[32px] border border-white bg-white shadow-sm">
            {countryBanners[data.language.code] ? <div className="relative h-52 w-full sm:h-72"><Image src={countryBanners[data.language.code]} alt={`${languageLocations[data.language.code]?.country ?? data.language.name} roadmap banner`} fill sizes="(max-width: 767px) 100vw, 1200px" className="object-cover object-center" priority /></div> : <CountryScenery languageCode={data.language.code} className="h-52 w-full sm:h-72" />}
            <div className="absolute bottom-5 left-5 rounded-2xl bg-white/95 px-5 py-3 shadow-sm sm:left-8"><p className="text-[10px] font-bold uppercase tracking-widest text-[#3558AE]">Your language destination</p><p className="mt-1 text-xl font-extrabold">{languageLocations[data.language.code]?.country ?? data.language.name}<span className="ml-3 text-sm font-medium text-[#62759C]">{data.language.name}</span></p></div>
          </div>
          <header className="relative my-8 overflow-hidden rounded-[32px] border border-white bg-white/85 p-7 shadow-[0_12px_40px_rgba(7,26,74,0.04)] sm:p-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border-[40px] border-[#C7A9D4]/15" />
            <div className="relative grid gap-8 md:grid-cols-[1fr_280px] md:items-center">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3558AE]">{data.language.name} <span className="ml-2 normal-case tracking-normal">{data.language.native_name}</span></p><h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{data.course.title}</h1><p className="mt-3 flex items-center gap-2 font-semibold text-[#B64074]"><Compass size={18} aria-hidden="true" />Your {data.language.name} learning journey</p>{data.course.description && <p className="mt-4 max-w-xl text-sm leading-7 text-[#071A4A]/60">{data.course.description}</p>}</div>
              <div className="rounded-2xl bg-[#EAF5FF] p-6"><p className="text-xs font-bold uppercase tracking-widest text-[#3558AE]">Journey progress</p><p className="mt-3 text-3xl font-extrabold">{data.percentage}<span className="text-lg">%</span></p><p className="mt-1 text-xs text-[#071A4A]/60">{data.completed} / {data.total} lessons completed</p><progress aria-label="Course progress" value={data.completed} max={data.total || 1} className="mt-4 h-2 w-full accent-[#3558AE]" /></div>
            </div>
          </header>
          {data.travelAccess.arrived && continueLesson && <section aria-label="Continue learning" className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#FFD46E]/60 bg-[#FFFCF7] p-5">
            <div><p className="text-xs font-bold uppercase tracking-widest text-[#62759C]">{nextLesson ? "Your next lesson" : "Keep practicing"}</p><h2 className="mt-2 text-lg font-extrabold">{continueLesson.title}</h2></div>
            <Link href={`/learn/lesson?course=${encodeURIComponent(data.course.id)}&lesson=${encodeURIComponent(continueLesson.id)}`} className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-[#3558AE] px-6 py-3 text-sm font-bold text-white hover:bg-[#071A4A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3558AE]">{nextLesson ? "Continue Learning" : "Review lessons"}<span aria-hidden="true">→</span></Link>
          </section>}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#102452]/10 bg-[#FFFCF7] p-5"><div><p className="text-sm font-bold text-[#102452]">{describeCourseLevel(data.course.level, data.language.code)}</p><p className="mt-1 text-xs text-[#53627F]">A learning progression, not a proficiency certification. Further levels appear when their lessons are ready.</p></div><Link href="/passport" className="inline-flex min-h-11 items-center rounded-xl border border-[#102452]/15 px-4 py-3 text-sm font-bold">Open Passport</Link></div>
          <JourneyRoadmap travelAccess={data.travelAccess} units={data.units} states={data.states} progress={data.progress} courseId={data.course.id} languageCode={data.language.code} />
        </>}
    </div>
  </main>;
}
