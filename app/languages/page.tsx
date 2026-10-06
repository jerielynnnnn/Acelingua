"use client";

import Image from "next/image";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TYPES
========================================================= */

type Language = {
  id: string;
  code: string;
  name: string;
  native_name: string | null;
};

type Course = {
  id: string;
  language_id: string;
  title: string;
  description: string | null;
  level: string;
  language: Language;
};

type UserCourse = {
  id: string;
  course_id: string;
  status: "active" | "completed" | "paused";
  enrolled_at: string;
  course: Course;
  progress_percentage: number;
};

/* =========================================================
   FLAGS
========================================================= */

const languageFlags: Record<string, string> = {
  ja: "/flags/japan.jpg",
  ko: "/flags/korea.jpg",
  zh: "/flags/china.jpg",
  es: "/flags/spanish.jpg",
  de: "/flags/german.jpg",
  th: "/flags/thailand.jpg",
  fr: "/flags/france.jpg",
};

/* =========================================================
   PAGE
========================================================= */

export default function LanguagePage() {
  const router = useRouter();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      try {
        /* GET USER */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (isAuthSessionMissingError(userError) || (!userError && !user)) {
          router.replace("/login");
          return;
        }

        if (userError) {
          setMessage(userError.message);
          return;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        /* GET LANGUAGES */

        const { data: languageData, error: languageError } =
          await supabase
            .from("languages")
            .select("id, code, name, native_name")
            .eq("is_active", true)
            .order("name");

        if (languageError) {
          setMessage(languageError.message);
          return;
        }

        setLanguages(languageData ?? []);

        /* GET USER COURSES */

        const { data: enrollmentData, error: enrollmentError } =
          await supabase
            .from("user_courses")
            .select(`
              id,
              course_id,
              status,
              enrolled_at
            `)
            .eq("user_id", user.id)
            .order("enrolled_at", { ascending: false });

        if (enrollmentError) {
          setMessage(enrollmentError.message);
          return;
        }

        if (!enrollmentData || enrollmentData.length === 0) {
          setUserCourses([]);
          return;
        }

        /* GET COURSE DETAILS */

        const courseIds = enrollmentData.map(
          (enrollment) => enrollment.course_id
        );

        const { data: courseData, error: courseError } =
          await supabase
            .from("courses")
            .select(`
              id,
              language_id,
              title,
              description,
              level,
              languages (
                id,
                code,
                name,
                native_name
              )
            `)
            .in("id", courseIds);

        if (courseError) {
          setMessage(courseError.message);
          return;
        }

        /* GET PROGRESS */

        const { data: progressData, error: progressError } = await supabase
          .from("course_progress")
          .select(`
            course_id,
            progress_percentage
          `)
          .eq("user_id", user.id)
          .in("course_id", courseIds);

        if (progressError) {
          setMessage(progressError.message);
          return;
        }

        /* COMBINE DATA */

        const formattedCourses: UserCourse[] = enrollmentData
          .map((enrollment) => {
            const course = courseData?.find(
              (item) => item.id === enrollment.course_id
            );

            if (!course) return null;

            const languageRelation = course.languages;

            const language = Array.isArray(languageRelation)
              ? languageRelation[0]
              : languageRelation;

            if (!language) return null;

            const progress = progressData?.find(
              (item) =>
                item.course_id === enrollment.course_id
            );

            return {
              id: enrollment.id,
              course_id: enrollment.course_id,
              status: enrollment.status as
                | "active"
                | "completed"
                | "paused",

              enrolled_at: enrollment.enrolled_at,

              course: {
                id: course.id,
                language_id: course.language_id,
                title: course.title,
                description: course.description,
                level: course.level,

                language: {
                  id: language.id,
                  code: language.code,
                  name: language.name,
                  native_name: language.native_name,
                },
              },

              progress_percentage: Number(
                progress?.progress_percentage ?? 0
              ),
            };
          })
          .filter(
            (course): course is UserCourse =>
              course !== null
          );

        setUserCourses(formattedCourses);
      } catch (error) {
        console.error(error);

        setMessage(
          "Something went wrong while loading your languages."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  /* =======================================================
     AVAILABLE LANGUAGES
  ======================================================= */

  const learningLanguageIds = new Set(
    userCourses.map(
      (item) => item.course.language.id
    )
  );

  const availableLanguages = languages.filter(
    (language) => !learningLanguageIds.has(language.id)
  );

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const continueCourse = (courseId: string) => {
    router.push(`/learn/${courseId}`);
  };

  const addLanguage = (languageId: string) => {
    router.push(`/onboarding/course?language=${languageId}`);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FBFF]">
        <div className="text-center">
          <Loader2
            size={28}
            className="mx-auto animate-spin text-[#3558AE]"
          />

          <p className="mt-3 text-sm text-[#071A4A]/45">
            Loading languages...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#071A4A]">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#071A4A]/60 transition hover:bg-[#EAF5FF] hover:text-[#3558AE]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>

          <Image
            src="/logo.png"
            alt="ACELINGUA"
            width={46}
            height={46}
            priority
            className="h-10 w-auto object-contain"
          />

          <div className="h-10 w-10" />

        </div>
      </header>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8">

        {/* =================================================
            TITLE
        ================================================= */}

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Languages
          </h1>

          <p className="mt-2 text-sm text-[#071A4A]/50">
            Continue learning or start a new language.
          </p>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {message && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {message}
          </div>
        )}

        {/* =================================================
            YOUR LANGUAGES
        ================================================= */}

        {!message && <section className="mt-10">

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              Your languages
            </h2>

            {userCourses.length > 0 && (
              <span className="text-xs font-semibold text-[#071A4A]/35">
                {userCourses.length}{" "}
                {userCourses.length === 1
                  ? "course"
                  : "courses"}
              </span>
            )}
          </div>

          {/* NO COURSE */}

          {userCourses.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-[#071A4A]/5 bg-white px-6 py-8 text-center">
              <p className="font-bold">
                No language courses yet.
              </p>

              <p className="mt-1 text-sm text-[#071A4A]/45">
                Choose a language below to get started.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {userCourses.map((userCourse) => (
                <CurrentLanguageCard
                  key={userCourse.id}
                  userCourse={userCourse}
                  onContinue={() =>
                    continueCourse(userCourse.course_id)
                  }
                />
              ))}
            </div>
          )}

        </section>}

        {/* =================================================
            ADD LANGUAGE
        ================================================= */}

        {!message && <section className="mt-12">

          <div>
            <h2 className="text-lg font-bold">
              Add a language
            </h2>

            <p className="mt-1 text-sm text-[#071A4A]/45">
              Choose another language you want to learn.
            </p>
          </div>

          {/* ALL LANGUAGES ADDED */}

          {availableLanguages.length === 0 ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white px-5 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF5FF] text-[#3558AE]">
                <Check size={17} />
              </div>

              <div>
                <p className="text-sm font-bold">
                  {languages.length === 0
                    ? "No languages available yet"
                    : "All available languages added"}
                </p>

                <p className="mt-0.5 text-xs text-[#071A4A]/40">
                  More languages will be available later.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {availableLanguages.map((language) => (
                <LanguageCard
                  key={language.id}
                  language={language}
                  onAdd={() =>
                    addLanguage(language.id)
                  }
                />
              ))}
            </div>
          )}

        </section>}

      </div>
    </main>
  );
}

/* =========================================================
   CURRENT LANGUAGE
========================================================= */

function CurrentLanguageCard({
  userCourse,
  onContinue,
}: {
  userCourse: UserCourse;
  onContinue: () => void;
}) {
  const language = userCourse.course.language;

  const flagImage = languageFlags[language.code];

  const progress = Math.min(
    100,
    Math.max(
      0,
      userCourse.progress_percentage
    )
  );

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#071A4A]/5 bg-white p-4 sm:flex-row sm:items-center">

      {/* FLAG */}

      <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-xl bg-[#EAF5FF] sm:w-28">
        {flagImage ? (
          <Image
            src={flagImage}
            alt={`${language.name} flag`}
            fill
            sizes="120px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">
            🌐
          </div>
        )}
      </div>

      {/* INFO */}

      <div className="min-w-0 flex-1">

        <div className="flex items-center gap-2">

          <h3 className="font-extrabold">
            {language.name}
          </h3>

          {language.native_name && (
            <span className="text-sm text-[#071A4A]/35">
              {language.native_name}
            </span>
          )}

        </div>

        <p className="mt-1 text-xs font-medium capitalize text-[#071A4A]/45">
          {userCourse.course.level}
        </p>

        {/* PROGRESS */}

        <div className="mt-3 flex items-center gap-3">

          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EAF5FF]">
            <div
              className="h-full rounded-full bg-[#3558AE]"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <span className="w-9 text-right text-xs font-bold text-[#3558AE]">
            {Math.round(progress)}%
          </span>

        </div>

      </div>

      {/* BUTTON */}

      <button
        type="button"
        onClick={onContinue}
        className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#071A4A] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#3558AE]"
      >
        {userCourse.status === "completed"
          ? "Review"
          : "Continue"}

        <ArrowRight size={15} />
      </button>

    </div>
  );
}

/* =========================================================
   AVAILABLE LANGUAGE
========================================================= */

function LanguageCard({
  language,
  onAdd,
}: {
  language: Language;
  onAdd: () => void;
}) {
  const flagImage = languageFlags[language.code];

  return (
    <button
      type="button"
      onClick={onAdd}
      className="group overflow-hidden rounded-2xl border border-[#071A4A]/5 bg-white text-left transition hover:-translate-y-0.5 hover:border-[#3558AE]/20 hover:shadow-md"
    >

      {/* FLAG */}

      <div className="relative h-28 w-full overflow-hidden bg-[#EAF5FF]">
        {flagImage ? (
          <Image
            src={flagImage}
            alt={`${language.name} flag`}
            fill
            sizes="250px"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">
            🌐
          </div>
        )}
      </div>

      {/* INFO */}

      <div className="flex items-center justify-between gap-3 p-4">

        <div className="min-w-0">

          <h3 className="truncate text-sm font-extrabold">
            {language.name}
          </h3>

          {language.native_name && (
            <p className="mt-0.5 truncate text-xs text-[#071A4A]/40">
              {language.native_name}
            </p>
          )}

        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF5FF] text-[#3558AE] transition group-hover:bg-[#3558AE] group-hover:text-white">
          <Plus size={15} />
        </div>

      </div>

    </button>
  );
}
