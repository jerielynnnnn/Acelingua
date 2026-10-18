"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loadRoadmap } from "@/lib/roadmap";
import { useLearnerId } from "@/components/dashboard/LearnerShell";
import JourneyRoadmap from "@/components/roadmap/JourneyRoadmap";

type Snapshot = Awaited<ReturnType<typeof loadRoadmap>>;
export default function CountryJourney({ courseId }: { courseId: string }) {
  const userId = useLearnerId();
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    loadRoadmap(createClient(), userId, courseId).then(result => { if (!cancelled) setData(result); }).catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Your journey could not be loaded."); });
    return () => { cancelled = true; };
  }, [userId, courseId, attempt]);
  if (error) return <section role="alert" className="mx-auto max-w-5xl rounded-3xl bg-white p-6"><p>{error}</p><button type="button" className="mt-4 rounded-xl border px-5 py-3 text-sm font-bold" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Retry Roadmap</button></section>;
  if (!data) return <p role="status" className="p-8 text-center">Preparing your country roadmap…</p>;
  const next = data.units.flatMap(unit => unit.lessons).find(lesson => data.states.get(lesson.id) === "current");
  return <section className="mx-auto max-w-6xl px-5 py-8 text-[#102452]" aria-label="Country learning roadmap"><header className="rounded-3xl border border-[#102452]/10 bg-[#FFFCF7] p-7"><p className="text-xs font-bold uppercase tracking-widest">Your destination itinerary</p><h2 className="mt-3 text-2xl font-extrabold">{data.course.title}</h2><p className="mt-3 text-sm">{data.completed} / {data.total} published lessons completed</p><progress value={data.completed} max={data.total || 1} aria-label="Country course progress" className="mt-4 h-2 w-full accent-[#68D978]" />{next && data.travelAccess.arrived && <Link className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#102452] px-5 py-3 text-sm font-bold text-white" href={`/learn/lesson?course=${encodeURIComponent(courseId)}&lesson=${encodeURIComponent(next.id)}`}>Continue Learning</Link>}</header><JourneyRoadmap units={data.units} states={data.states} progress={data.progress} courseId={courseId} languageCode={data.language.code} travelAccess={data.travelAccess} /></section>;
}
