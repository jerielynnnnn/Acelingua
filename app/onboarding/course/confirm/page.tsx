"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { enrollStartingCourse } from "@/lib/auth-onboarding";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  language_id: string;
  title: string;
  description: string | null;
  level: string;
};

export default function CourseConfirmPage() {
  return <Suspense fallback={<main role="status">Loading course...</main>}><CourseConfirmContent /></Suspense>;
}

function CourseConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const courseId = searchParams.get("course");

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadCourse = async () => {
      const supabase = createClient();

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Make sure a course was selected
      if (!courseId) {
        router.push("/onboarding/language");
        return;
      }

      // Get course information
      const { data, error } = await supabase
        .from("courses")
        .select("id, language_id, title, description, level")
        .eq("id", courseId)
        .eq("is_published", true)
        .single();

      if (error) {
        setMessage("Course could not be found.");
      } else {
        setCourse(data);
      }

      setLoading(false);
    };

    loadCourse();
  }, [courseId, router]);

  const handleStartLearning = async () => {
    if (!courseId) return;

    setStarting(true);
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    try {
      if (!course) throw new Error("Choose an available course first.");
      const language = await supabase.from("languages").select("code").eq("id", course.language_id).eq("is_active", true).single();
      if (language.error) throw language.error;
      const enrolledId = await enrollStartingCourse(supabase, user, { languageId: course.language_id, languageCode: language.data.code }, true, course.id);
      router.push("/learn/" + encodeURIComponent(enrolledId));
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "We couldn't enroll in this course.");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <main>
        <p>Loading course...</p>
      </main>
    );
  }

  if (!course) {
    return (
      <main>
        <h1>Course Not Found</h1>
        <p>{message}</p>

        <button
          type="button"
          onClick={() => router.push("/onboarding/language")}
        >
          Choose Another Course
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>{course.title}</h1>

      <p>
        Level: <strong>{course.level}</strong>
      </p>

      {course.description && <p>{course.description}</p>}

      <h2>Ready to start learning?</h2>

      <p>
        You&apos;ll learn useful vocabulary, grammar, listening, speaking,
        conversation, and more.
      </p>

      {message && <p>{message}</p>}

      <button
        type="button"
        onClick={handleStartLearning}
        disabled={starting}
      >
        {starting ? "Starting..." : "Start Learning"}
      </button>

      <br />

      <button
        type="button"
        onClick={() => router.back()}
        disabled={starting}
      >
        Go Back
      </button>
    </main>
  );
}
