"use client";

import Link from "next/link";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { rememberGuestLesson, recordLessonCompletion, type GuestLesson } from "@/lib/guest-onboarding";
import { getCourseUnits, getOrderedLessons, getPublishedCourse } from "@/lib/learning";
import { loadRoadmap } from "@/lib/roadmap";

type Word = { id: string; word: string; translation: string; pronunciation: string | null; example_sentence: string | null; example_translation: string | null };
type Lesson = GuestLesson & { title: string; language: string; words: Word[] };
const buttonStyle = "rounded-full bg-[#071A4A] px-6 py-3 font-bold text-white disabled:opacity-40";

export default function LessonPlayer({ authenticated = false }: { authenticated?: boolean }) {
  const lessonKey = useSearchParams().toString();
  return <LessonContent key={lessonKey} authenticated={authenticated} />;
}

function LessonContent({ authenticated }: { authenticated: boolean }) {
  const searchParams = useSearchParams();
  const languageId = searchParams.get("language");
  const selectedCourse = searchParams.get("course");
  const selectedLesson = searchParams.get("lesson");
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [practicing, setPracticing] = useState(false);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [correct, setCorrect] = useState(false);
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError && !isAuthSessionMissingError(authError)) throw authError;
        if (authenticated && !user) { router.replace("/login"); return; }
        const course = await getPublishedCourse(supabase, { languageId, courseId: selectedCourse });
        const languageResult = await supabase.from("languages").select("name").eq("id", course.language_id).eq("is_active", true).single();
        if (languageResult.error) throw languageResult.error;
        const lessons = getOrderedLessons(await getCourseUnits(supabase, course.id));
        const selected = user && selectedLesson ? lessons.find((item) => item.id === selectedLesson) : lessons[0];
        if (!selected) throw new Error("This lesson is not available yet. Please choose another language.");
        if (authenticated && user) {
          const roadmap = await loadRoadmap(supabase, user.id, course.id);
          const state = roadmap.states.get(selected.id);
          if (!state || state === "locked") throw new Error("This lesson is locked. Complete the earlier lessons first.");
        }
        const wordResult = await supabase.from("vocabulary").select("id, word, translation, pronunciation, example_sentence, example_translation").eq("lesson_id", selected.id).order("created_at").order("id");
        if (wordResult.error) throw wordResult.error;
        if (!wordResult.data?.length) throw new Error("This introductory lesson has no vocabulary yet. Please choose another language.");
        if (!cancelled) {
          setIndex(0); setPracticing(false); setAnswer(""); setFeedback(""); setCorrect(false); setComplete(false); setError("");
          setSignedIn(Boolean(user));
          setLesson({ courseId: course.id, lessonId: selected.id, title: selected.title, language: languageResult.data.name, words: wordResult.data });
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load your first lesson. Please try again.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [languageId, selectedCourse, selectedLesson, authenticated, router]);

  async function next() {
    if (!lesson || saving) return;
    if (index < lesson.words.length - 1) setIndex(index + 1);
    else if (!practicing) { setPracticing(true); setIndex(0); }
    else {
      try {
        setSaving(true);
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError && !isAuthSessionMissingError(authError)) throw authError;
        const completion = { courseId: lesson.courseId, lessonId: lesson.lessonId };
        if (user) await recordLessonCompletion(supabase, user, completion);
        else if (authenticated || signedIn) throw new Error("Please sign in to save your lesson.");
        else rememberGuestLesson(completion);
        setSignedIn(Boolean(user));
        setComplete(true);
      } catch (cause) {
        setFeedback(cause instanceof Error ? cause.message : "We couldn't save your lesson. Please try again.");
        return;
      } finally { setSaving(false); }
    }
    setAnswer(""); setFeedback(""); setCorrect(false);
  }

  const word = lesson?.words[index];
  return (
    <main className="min-h-screen bg-[#F8FBFF] px-5 py-10 text-[#071A4A]">
      <div className="mx-auto max-w-xl">
        <Link href={signedIn && lesson ? `/learn?course=${lesson.courseId}` : `/onboarding/course?language=${languageId ?? ""}`} className="text-sm text-[#3558AE]">← Back to course</Link>
        {error ? <div role="alert" className="mt-8 rounded-2xl bg-white p-8"><h1 className="text-2xl font-bold">Lesson unavailable</h1><p className="mt-4">{error}</p></div>
          : !lesson || !word ? <p role="status" className="mt-10">Loading your first lesson...</p>
          : complete ? <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-bold text-[#3558AE]">Lesson complete!</p>
            <h1 className="mt-3 text-3xl font-extrabold">{signedIn ? "Keep up the good work!" : `Your ${lesson.language} journey has begun.`}</h1>
            <p className="my-6">{signedIn ? "Your progress has been saved. Continue with your next lesson." : "Create an account to save your first lesson and continue learning."}</p>
            <Link href={signedIn ? `/learn?course=${lesson.courseId}` : "/register"} className={`${buttonStyle} inline-block`}>{signedIn ? "Continue learning" : "Create an account to continue"}</Link>
            {!signedIn && <p className="mt-5 text-sm">Already have an account? <Link href="/login" className="font-bold text-[#3558AE]">Sign in</Link></p>}
          </div> : <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm font-bold text-[#3558AE]">{lesson.language} · Your lesson</p>
            <h1 className="mt-2 text-2xl font-extrabold">{lesson.title}</h1>
            <p className="mt-3 text-sm">{practicing ? "Practice" : "Learn"} · {index + 1} of {lesson.words.length}</p>
            <progress className="mt-3 w-full accent-[#3558AE]" max={lesson.words.length * 2} value={(practicing ? lesson.words.length : 0) + index} aria-label="Lesson progress" />
            <h2 className="mt-8 text-4xl font-bold">{word.word}</h2>
            {!practicing ? <>
              {word.pronunciation && <p className="mt-2 text-[#071A4A]/60">{word.pronunciation}</p>}
              <p className="mt-5 text-xl">{word.translation}</p>
              {word.example_sentence && <div className="mt-6 rounded-xl bg-[#EAF5FF] p-4"><p>{word.example_sentence}</p><p className="mt-2 text-sm">{word.example_translation}</p></div>}
              <button className={`${buttonStyle} mt-8`} onClick={next}>{index === lesson.words.length - 1 ? "Let's practice" : "Next word"}</button>
            </> : <form className="mt-6" onSubmit={(event) => {
              event.preventDefault();
              if (correct) { void next(); return; }
              const normalize = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase().replace(/[.!?。！？]+$/u, "");
              const matches = normalize(answer) === normalize(word.translation);
              setCorrect(matches);
              setFeedback(matches ? "Correct!" : `The translation is “${word.translation}”. Type it below to practice.`);
            }}>
              <label htmlFor="translation" className="block text-sm font-semibold">What does this mean in English?</label>
              <input id="translation" autoComplete="off" required value={answer} disabled={correct} onChange={(event) => setAnswer(event.target.value)} className="mt-3 w-full rounded-xl border border-[#071A4A]/20 px-4 py-3" />
              <p role="status" className="mt-3 text-sm">{feedback}</p>
              <button className={`${buttonStyle} mt-5`} type="submit" disabled={saving}>{saving ? "Saving..." : correct ? index === lesson.words.length - 1 ? "Finish lesson" : "Continue" : "Check answer"}</button>
            </form>}
          </div>}
      </div>
    </main>
  );
}
