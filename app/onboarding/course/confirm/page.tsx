"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
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
        .select("id, title, description, level")
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

    // Check if the learner is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from("user_courses")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (checkError) {
      setMessage(checkError.message);
      setStarting(false);
      return;
    }

    // Create enrollment if it doesn't exist
    if (!existingEnrollment) {
      const { error: enrollError } = await supabase
        .from("user_courses")
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: "active",
        });

      if (enrollError) {
        setMessage(enrollError.message);
        setStarting(false);
        return;
      }
    }

    router.push(`/learn?course=${courseId}`);
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
