"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { saveGuestLesson } from "@/lib/guest-onboarding";
import { getCourseUnits, getOrderedLessons, getPublishedCourse, type CourseUnit, type PublishedCourse } from "@/lib/learning";

type CourseData = {
  course: PublishedCourse;
  language: { name: string; native_name: string | null; code: string };
  units: CourseUnit[];
  completed: string[];
  signedIn: boolean;
};

const flags: Record<string, string> = {
  ja: "/flags/japan.jpg", ko: "/flags/korea.jpg", zh: "/flags/china.jpg",
  es: "/flags/spanish.jpg", de: "/flags/german.jpg", th: "/flags/thailand.jpg", fr: "/flags/france.jpg",
};

export default function CourseOverview({ requireAccount = false }: { requireAccount?: boolean }) {
  const key = useSearchParams().toString();
  return <CourseContent key={key} requireAccount={requireAccount} />;
}

function CourseContent({ requireAccount }: { requireAccount: boolean }) {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course");
  const languageId = searchParams.get("language");
  const router = useRouter();
  const [data, setData] = useState<CourseData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError && !isAuthSessionMissingError(authError)) throw authError;
        if (!user && requireAccount) { router.replace("/login"); return; }
        if (user) await saveGuestLesson(supabase, user);
        let selected = courseId;
        if (!selected && !languageId && user) {
          const enrollment = await supabase.from("user_courses").select("course_id")
            .eq("user_id", user.id).eq("status", "active")
            .order("enrolled_at", { ascending: false }).limit(1).maybeSingle();
          if (enrollment.error) throw enrollment.error;
          selected = enrollment.data?.course_id;
        }
        if (!selected && !languageId) { router.replace("/onboarding/language"); return; }
        const course = await getPublishedCourse(supabase, { courseId: selected, languageId });
        const languageResult = await supabase.from("languages").select("name, native_name, code")
          .eq("id", course.language_id).eq("is_active", true).single();
        if (languageResult.error) throw languageResult.error;
        const units = await getCourseUnits(supabase, course.id);
        let completed: string[] = [];
        if (user) {
          const lessons = getOrderedLessons(units);
          if (lessons.length) {
            const progress = await supabase.from("lesson_progress").select("lesson_id")
              .eq("user_id", user.id).eq("status", "completed").in("lesson_id", lessons.map((lesson) => lesson.id));
            if (progress.error) throw progress.error;
            completed = (progress.data ?? []).map((item) => item.lesson_id);
          }
        }
        if (!cancelled) setData({ course, language: languageResult.data, units, completed, signedIn: Boolean(user) });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load this course. Please try again.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [courseId, languageId, requireAccount, router]);

  const lessons = data ? getOrderedLessons(data.units) : [];
  const next = lessons.find((lesson) => !data?.completed.includes(lesson.id));
  const completedCount = lessons.filter((lesson) => data?.completed.includes(lesson.id)).length;
  const lessonHref = (id: string) => data?.signedIn
    ? `/learn/lesson?course=${data.course.id}&lesson=${id}`
    : `/onboarding/lesson?language=${data?.course.language_id}`;
  const backHref = data?.signedIn ? "/languages" : "/onboarding/language";

  return <main className="min-h-screen bg-[#F8FBFF] text-[#071A4A]">
    <header className="bg-white"><div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
      <Link href={backHref} aria-label="Back to languages" className="flex h-10 w-10 items-center justify-center rounded-full text-[#071A4A]/60 hover:bg-[#EAF5FF]"><ArrowLeft size={20} /></Link>
      <Image src="/logo.png" alt="ACELingua" width={180} height={48} priority className="h-10 w-auto object-contain" />
      <div className="w-10" />
    </div></header>
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 className="text-xl font-bold">Course unavailable</h1><p className="mt-2 text-sm">{error}</p><Link href="/onboarding/language" className="mt-4 inline-block font-bold text-[#3558AE]">Choose another language</Link></div>
        : !data ? <div role="status" className="flex min-h-80 flex-col items-center justify-center gap-3"><Loader2 className="animate-spin text-[#3558AE]" /><p className="text-sm text-[#071A4A]/50">Loading your course...</p></div>
        : <>
          <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#071A4A]/45"><Link href={backHref}>Languages</Link><ChevronRight size={14} /><span>{data.language.name}</span></div>
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <section className="rounded-3xl border border-[#071A4A]/5 bg-white p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  {flags[data.language.code] && <Image src={flags[data.language.code]} alt={`${data.language.name} flag`} width={88} height={60} className="h-14 w-20 rounded-xl object-cover" />}
                  <div><p className="text-xs font-bold uppercase tracking-widest text-[#3558AE]">Your language journey</p><h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{data.language.name}</h1>{data.language.native_name && <p className="mt-1 text-sm text-[#071A4A]/45">{data.language.native_name}</p>}</div>
                </div>
                <h2 className="mt-7 text-xl font-bold">{data.course.title}</h2>
                {data.course.description && <p className="mt-3 max-w-xl text-sm leading-6 text-[#071A4A]/60">{data.course.description}</p>}
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-[#EAF5FF] px-3 py-1.5 capitalize text-[#3558AE]">{data.course.level}</span><span className="rounded-full bg-[#F8FBFF] px-3 py-1.5">{data.signedIn ? `${lessons.length} published lessons` : "Free first lesson"}</span></div>
                {data.signedIn && lessons.length > 0 && <div className="mt-6"><div className="mb-2 flex justify-between text-xs font-semibold"><span>Course progress</span><span>{completedCount} / {lessons.length} lessons</span></div><progress aria-label="Course progress" max={lessons.length} value={completedCount} className="h-2 w-full accent-[#3558AE]" /></div>}
              </section>
              <div className="mb-5 mt-9 flex items-center gap-2"><BookOpen size={20} className="text-[#3558AE]" /><h2 className="text-xl font-bold">Your lessons</h2></div>
              {!lessons.length && <div className="rounded-2xl bg-white p-6 text-sm text-[#071A4A]/55">Lessons for this course are coming soon. <Link href={backHref} className="font-bold text-[#3558AE]">Explore another language</Link>.</div>}
              {data.units.filter((unit) => unit.lessons.length).map((unit, unitIndex) => <section key={unit.id} className="mb-6"><div className="mb-3 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF5FF] text-xs font-bold text-[#3558AE]">{unitIndex + 1}</span><h3 className="font-bold">{unit.title}</h3></div><div className="space-y-3">
                {unit.lessons.map((lesson, index) => { const done = data.completed.includes(lesson.id); const isNext = lesson.id === next?.id; return <Link key={lesson.id} href={lessonHref(lesson.id)} className={`group flex items-center gap-4 rounded-2xl border bg-white p-5 transition hover:border-[#3558AE]/30 hover:shadow-sm ${isNext ? "border-[#3558AE]/25" : "border-[#071A4A]/5"}`}>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${done ? "bg-green-50 text-green-600" : "bg-[#EAF5FF] text-[#3558AE]"}`}>{done ? <Check size={20} /> : <BookOpen size={19} />}</span>
                  <div className="min-w-0 flex-1"><p className="mb-1 text-xs text-[#071A4A]/40">Lesson {index + 1}</p><p className="font-bold">{lesson.title}</p></div>
                  <span className="hidden text-xs font-bold text-[#3558AE] sm:block">{done ? "Review" : isNext ? "Start lesson" : "Learn"}</span><ChevronRight size={18} className="shrink-0 text-[#3558AE]" />
                </Link>; })}
              </div></section>)}
            </div>
            <aside className="rounded-3xl bg-[#071A4A] p-7 text-white lg:sticky lg:top-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Sparkles size={23} className="text-[#F9C3D7]" /></div>
              <h2 className="text-xl font-extrabold">{next ? data.signedIn && completedCount ? "Keep your momentum" : "Ready for your first lesson?" : lessons.length ? "Course complete!" : "More lessons on the way"}</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">{data.signedIn ? "Learn at your own pace. Completed lessons are saved to your account." : "Try the first lesson in this course, then create an account to save your progress and continue."}</p>
              <div className="mt-6 space-y-3 text-xs text-white/80"><p className="flex items-center gap-2"><CheckCircle2 size={15} /> Learn useful words</p><p className="flex items-center gap-2"><CheckCircle2 size={15} /> Practice what you learned</p><p className="flex items-center gap-2"><CheckCircle2 size={15} /> {data.signedIn ? "Track your progress" : "No account needed to start"}</p></div>
              {next ? <Link href={lessonHref(next.id)} className="mt-7 flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-[#071A4A] transition hover:bg-[#EAF5FF]">{completedCount ? "Continue learning" : "Start learning"}<ArrowRight size={16} /></Link> : lessons.length > 0 && <Link href={backHref} className="mt-7 block rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-[#071A4A]">Explore more languages</Link>}
            </aside>
          </div>
        </>}
    </div>
  </main>;
}
