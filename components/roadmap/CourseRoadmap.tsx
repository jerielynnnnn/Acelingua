"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Compass } from "lucide-react";
import JourneyRoadmap from "./JourneyRoadmap";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { loadRoadmap } from "@/lib/roadmap";

type Snapshot = Awaited<ReturnType<typeof loadRoadmap>>;
export default function CourseRoadmap() {
  const requested = useSearchParams().get("course");
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
        if (!cancelled) setData(result);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load your roadmap. Please try again.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [requested, router, attempt]);

  return <main className="min-h-screen bg-[#EAF5FF] px-5 py-8 text-[#071A4A]">
    <div className="mx-auto max-w-6xl">
      <Link href="/dashboard" className="text-sm font-bold text-[#3558AE]">← Dashboard</Link>
      {error ? <section role="alert" className="mt-8 rounded-3xl bg-white p-7"><h1 className="text-xl font-bold">Roadmap unavailable</h1><p className="mt-3">{error}</p><button onClick={() => { setError(""); setData(null); setAttempt(attempt + 1); }} className="mt-5 rounded-full bg-[#071A4A] px-6 py-3 text-white">Retry</button><Link href="/learn" className="ml-4 text-[#3558AE]">Choose course</Link></section>
        : choices.length ? <section className="mt-8 rounded-3xl bg-white p-7"><h1 className="text-2xl font-bold">Choose your course</h1><p className="mt-3">You have more than one active course.</p><div className="mt-5 space-y-3">{choices.map((course) => <Link key={course.id} href={`/learn?course=${encodeURIComponent(course.id)}`} className="block rounded-xl bg-[#EAF5FF] p-4 font-bold">{course.title}</Link>)}</div></section>
        : !data ? <div role="status" className="py-20 text-center"><Loader2 className="mx-auto animate-spin" /><p className="mt-4">Loading your roadmap...</p></div>
        : <>
          <header className="relative my-8 overflow-hidden rounded-[32px] border border-white bg-white/85 p-7 shadow-[0_12px_40px_rgba(7,26,74,0.04)] sm:p-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border-[40px] border-[#C7A9D4]/15" />
            <div className="relative grid gap-8 md:grid-cols-[1fr_280px] md:items-center">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3558AE]">{data.language.name} <span className="ml-2 normal-case tracking-normal">{data.language.native_name}</span></p><h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{data.course.title}</h1><p className="mt-3 flex items-center gap-2 font-semibold text-[#B64074]"><Compass size={18} aria-hidden="true" />Your {data.language.name} learning journey</p>{data.course.description && <p className="mt-4 max-w-xl text-sm leading-7 text-[#071A4A]/60">{data.course.description}</p>}</div>
              <div className="rounded-2xl bg-[#EAF5FF] p-6"><p className="text-xs font-bold uppercase tracking-widest text-[#3558AE]">Journey progress</p><p className="mt-3 text-3xl font-extrabold">{data.percentage}<span className="text-lg">%</span></p><p className="mt-1 text-xs text-[#071A4A]/60">{data.completed} / {data.total} lessons completed</p><progress aria-label="Course progress" value={data.completed} max={data.total || 1} className="mt-4 h-2 w-full accent-[#3558AE]" /></div>
            </div>
          </header>
          <JourneyRoadmap units={data.units} states={data.states} progress={data.progress} courseId={data.course.id} />
        </>}
    </div>
  </main>;
}
