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

export default function ChooseCoursePage() {
  return <Suspense fallback={<main role="status">Loading courses...</main>}><ChooseCourseContent /></Suspense>;
}

function ChooseCourseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const languageId = searchParams.get("language");

  const [courses, setCourses] = useState<Course[]>([]);
  const [languageName, setLanguageName] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      const supabase = createClient();

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Make sure a language was selected
      if (!languageId) {
        router.push("/onboarding/language");
        return;
      }

      // Get language information
      const { data: language, error: languageError } = await supabase
        .from("languages")
        .select("name")
        .eq("id", languageId)
        .single();

      if (languageError) {
        setMessage(languageError.message);
        setLoading(false);
        return;
      }

      setLanguageName(language.name);

      // Get published courses for the selected language
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, level")
        .eq("language_id", languageId)
        .eq("is_published", true)
        .order("level");

      if (error) {
        setMessage(error.message);
      } else {
        setCourses(data ?? []);
      }

      setLoading(false);
    };

    loadCourses();
  }, [languageId, router]);

  const handleCourseSelect = (courseId: string) => {
    router.push(`/onboarding/course/confirm?course=${courseId}`);
  };

  if (loading) {
    return (
      <main>
        <p>Loading courses...</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Choose Your Course</h1>

      {languageName && (
        <p>
          You selected: <strong>{languageName}</strong>
        </p>
      )}

      <p>Choose a course to begin learning.</p>

      {message && <p>{message}</p>}

      {courses.length === 0 ? (
        <div>
          <p>No courses are available for this language yet.</p>

          <button
            type="button"
            onClick={() => router.push("/onboarding/language")}
          >
            Choose Another Language
          </button>
        </div>
      ) : (
        <div>
          {courses.map((course) => (
            <div key={course.id}>
              <h2>{course.title}</h2>

              {course.description && <p>{course.description}</p>}

              <p>
                Level: <strong>{course.level}</strong>
              </p>

              <button
                type="button"
                onClick={() => handleCourseSelect(course.id)}
              >
                Start Course
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
