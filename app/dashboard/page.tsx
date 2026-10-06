"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Coins,
  Flame,
  Map,
  Sparkles,
  Star,
  Target,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

/* =========================================================
   TYPES
========================================================= */

type DashboardProfile = {
  username: string | null;
  display_name: string | null;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  hearts: number;
  gems: number;
};

type DashboardGoal = {
  target_activities: number;
  completed_activities: number;
  is_completed: boolean;
};

type DashboardLanguage = {
  name: string;
  native_name: string | null;
  flag_emoji: string | null;
  code: string;
};

type DashboardCourse = {
  id: string;
  title: string;
  description: string | null;
  level: string;
};

type DashboardProgress = {
  completed_lessons: number;
  total_lessons: number;
  progress_percentage: number;
};

type DashboardData = {
  profile: DashboardProfile | null;
  goal: DashboardGoal | null;
  language: DashboardLanguage | null;
  course: DashboardCourse | null;
  progress: DashboardProgress | null;
  achievements: number;
};

/* =========================================================
   PAGE
========================================================= */

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const supabase = createClient();

        /* CURRENT USER */

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        const today = new Date().toLocaleDateString("en-CA");

        /* PROFILE + COURSE + GOAL + ACHIEVEMENTS */

        const [
          profileResult,
          enrollmentResult,
          goalResult,
          achievementsResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "username, display_name, level, xp, coins, streak, hearts, gems"
            )
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("user_courses")
            .select("course_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("enrolled_at", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("daily_goals")
            .select(
              "target_activities, completed_activities, is_completed"
            )
            .eq("user_id", user.id)
            .eq("goal_date", today)
            .maybeSingle(),

          supabase
            .from("user_achievements")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("user_id", user.id),
        ]);

        const errors: string[] = [];

        if (profileResult.error) {
          errors.push(profileResult.error.message);
        }

        if (enrollmentResult.error) {
          errors.push(enrollmentResult.error.message);
        }

        if (goalResult.error) {
          errors.push(goalResult.error.message);
        }

        if (achievementsResult.error) {
          errors.push(achievementsResult.error.message);
        }

        let course: DashboardCourse | null = null;
        let language: DashboardLanguage | null = null;
        let progress: DashboardProgress | null = null;

        const courseId =
          enrollmentResult.data?.course_id ?? null;

        /* COURSE DATA */

        if (courseId) {
          const courseResult = await supabase
            .from("courses")
            .select(
              "id, language_id, title, description, level"
            )
            .eq("id", courseId)
            .maybeSingle();

          if (courseResult.error) {
            errors.push(courseResult.error.message);
          }

          if (courseResult.data) {
            course = {
              id: courseResult.data.id,
              title: courseResult.data.title,
              description: courseResult.data.description,
              level: courseResult.data.level,
            };

            /* LANGUAGE */

            if (courseResult.data.language_id) {
              const languageResult = await supabase
                .from("languages")
                .select(
                  "name, native_name, flag_emoji, code"
                )
                .eq(
                  "id",
                  courseResult.data.language_id
                )
                .maybeSingle();

              if (languageResult.error) {
                errors.push(languageResult.error.message);
              }

              if (languageResult.data) {
                language = languageResult.data;
              }
            }
          }

          /* COURSE PROGRESS */

          const progressResult = await supabase
            .from("course_progress")
            .select(
              "completed_lessons, total_lessons, progress_percentage"
            )
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .maybeSingle();

          if (progressResult.error) {
            errors.push(progressResult.error.message);
          }

          if (progressResult.data) {
            progress = {
              completed_lessons:
                progressResult.data.completed_lessons,

              total_lessons:
                progressResult.data.total_lessons,

              progress_percentage: Number(
                progressResult.data.progress_percentage
              ),
            };
          }
        }

        if (!cancelled) {
          setData({
            profile: profileResult.data,
            goal: goalResult.data,
            language,
            course,
            progress,
            achievements: achievementsResult.count ?? 0,
          });

          setError(errors.join(" · "));
        }
      } catch (failure) {
        if (!cancelled) {
          setError(
            failure instanceof Error
              ? failure.message
              : "We couldn’t load your dashboard. Please try again."
          );
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F9FD] px-6 text-[#071A4A]">
        <div className="text-center">
          <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
            <div className="absolute h-20 w-20 rounded-full bg-[#3558AE]/10 blur-xl" />

            <div className="ace-dashboard-loader relative">
              <Image
                src="/icon head.png"
                alt="Ace is loading"
                width={72}
                height={72}
                priority
                className="h-18 w-18 object-contain drop-shadow-[0_10px_15px_rgba(7,26,74,0.12)]"
              />
            </div>
          </div>

          {!error ? (
            <>
              <p className="text-sm font-bold">
                Getting things ready
              </p>

              <p className="mt-1 text-xs text-[#071A4A]/40">
                Ace is preparing your learning space...
              </p>

              <div className="mt-4 flex justify-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#3558AE] [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#3558AE] [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#3558AE]" />
              </div>
            </>
          ) : (
            <>
              <p
                role="alert"
                className="text-sm font-bold"
              >
                We couldn&apos;t load your dashboard.
              </p>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#071A4A]/45">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-xl bg-[#071A4A] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#3558AE]"
              >
                Try again
              </button>
            </>
          )}
        </div>

        <style jsx>{`
          @keyframes aceDashboardLoader {
            0%,
            100% {
              transform: translateY(0) rotate(-4deg);
            }

            25% {
              transform: translateY(-5px) rotate(0deg);
            }

            50% {
              transform: translateY(-10px) rotate(5deg);
            }

            75% {
              transform: translateY(-5px) rotate(-1deg);
            }
          }

          .ace-dashboard-loader {
            animation: aceDashboardLoader 1.5s
              ease-in-out infinite;
            transform-origin: center;
          }

          @media (prefers-reduced-motion: reduce) {
            .ace-dashboard-loader {
              animation: none;
            }
          }
        `}</style>
      </main>
    );
  }

  /* =========================================================
     VALUES
  ========================================================= */

  const learnerName =
    data.profile?.display_name ||
    data.profile?.username ||
    "Learner";

  const level = data.profile?.level ?? 1;
  const xp = data.profile?.xp ?? 0;
  const coins = data.profile?.coins ?? 0;
  const streak = data.profile?.streak ?? 0;

  const hearts = data.profile?.hearts ?? 5;
  const gems = data.profile?.gems ?? 0;

  const achievements = data.achievements ?? 0;

  const completedActivities =
    data.goal?.completed_activities ?? 0;

  const targetActivities =
    data.goal?.target_activities ?? 3;

  const dailyGoalPercentage =
    targetActivities > 0
      ? Math.min(
          100,
          Math.round(
            (completedActivities /
              targetActivities) *
              100
          )
        )
      : 0;

  const completedLessons =
    data.progress?.completed_lessons ?? 0;

  const totalLessons =
    data.progress?.total_lessons ?? 0;

  const coursePercentage = Math.min(
    100,
    Math.max(
      0,
      Number(
        data.progress?.progress_percentage ?? 0
      )
    )
  );

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#F4F9FD] text-[#071A4A]">

      <DashboardSidebar />

      <div className="min-h-screen md:pl-19">

        {/* GLOBAL LEARNER HEADER */}

        <DashboardHeader
          streak={streak}
          hearts={hearts}
          gems={gems}
          coins={coins}
          achievements={achievements}
        />

        <main>
          <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8 lg:px-10">

            {/* WELCOME */}

            <header className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3558AE]">
                Dashboard
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                Welcome back, {learnerName}!
              </h1>

              <p className="mt-1.5 text-sm text-[#071A4A]/45">
                Ready for another step in your language journey?
              </p>
            </header>

            {/* ERROR */}

            {error && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs leading-5 text-amber-800">
                Some dashboard information could not be loaded.{" "}
                {error}
              </div>
            )}

            {/* =================================================
                COURSE HERO
            ================================================= */}

            <section className="relative overflow-hidden rounded-[28px] bg-[#2A255C] px-7 py-8 text-white shadow-[0_18px_50px_rgba(42,37,92,0.14)] md:px-9 md:py-9">

              <div className="pointer-events-none absolute -right-28 -top-36 h-80 w-80 rounded-full border-[50px] border-white/5" />

              <div className="pointer-events-none absolute -bottom-40 right-[25%] h-72 w-72 rounded-full bg-[#3558AE]/30 blur-3xl" />

              <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_240px] lg:items-center">

                <div>
                  <div className="mb-5 flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-2xl">
                      {data.language?.flag_emoji || "🌐"}
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                        Current Language
                      </p>

                      <p className="mt-0.5 text-sm font-semibold">
                        {data.language?.name ||
                          "No language selected"}

                        {data.language?.native_name && (
                          <span className="ml-2 font-normal text-white/45">
                            {data.language.native_name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-white/45">
                    Hello, {learnerName}
                  </p>

                  <h2 className="mt-1 max-w-2xl text-2xl font-bold tracking-tight md:text-3xl">
                    {data.course?.title ||
                      "Start your language adventure"}
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                    {data.course?.description ||
                      "Choose a language and begin your first ACELINGUA course."}
                  </p>

                  {data.course && (
                    <div className="mt-7 max-w-xl">

                      <div className="mb-2 flex justify-between text-xs">
                        <span className="font-semibold text-white/50">
                          Course progress
                        </span>

                        <span className="font-bold">
                          {Math.round(coursePercentage)}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#F9C3D7] transition-all duration-500"
                          style={{
                            width: `${coursePercentage}%`,
                          }}
                        />
                      </div>

                      <div className="mt-2 flex gap-4 text-[11px] text-white/40">
                        <span>
                          {completedLessons} /{" "}
                          {totalLessons} lessons
                        </span>

                        <span>
                          {data.course.level}
                        </span>
                      </div>
                    </div>
                  )}

                  <Link
                    href={
                      data.course
                        ? "/learn"
                        : "/languages"
                    }
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-[#2A255C] transition hover:-translate-y-0.5 hover:bg-[#F9C3D7]"
                  >
                    {data.course
                      ? "Continue Learning"
                      : "Choose a Language"}

                    <ArrowRight size={15} />
                  </Link>
                </div>

                {/* ACE */}

                <div className="hidden justify-center lg:flex">
                  <div className="relative flex h-52 w-52 items-center justify-center">

                    <div className="absolute h-44 w-44 rounded-full border border-white/10" />

                    <div className="absolute h-36 w-36 rounded-full bg-white/5" />

                    <Image
                      src="/icon head.png"
                      alt="Ace"
                      width={160}
                      height={160}
                      className="relative z-10 h-36 w-36 object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.18)]"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                LOWER DASHBOARD
            ================================================= */}

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">

              {/* LEFT */}

              <div className="space-y-6">

                {/* PROGRESS */}

                <section>
                  <div className="mb-4 flex items-end justify-between">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#3558AE]">
                        Your Progress
                      </p>

                      <h2 className="mt-1 text-xl font-bold">
                        Keep moving forward
                      </h2>
                    </div>

                    {data.course && (
                      <Link
                        href="/learn"
                        className="hidden items-center gap-1 text-xs font-bold text-[#3558AE] hover:underline sm:flex"
                      >
                        View lessons
                        <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    {/* LESSONS */}

                    <DashboardCard>
                      <CardIcon>
                        <BookOpen size={20} />
                      </CardIcon>

                      <p className="mt-5 text-xs font-semibold text-[#071A4A]/40">
                        Lessons Completed
                      </p>

                      <div className="mt-1 flex items-end gap-1">
                        <span className="text-3xl font-bold">
                          {completedLessons}
                        </span>

                        <span className="mb-1 text-sm font-semibold text-[#071A4A]/30">
                          / {totalLessons}
                        </span>
                      </div>

                      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#EAF5FF]">
                        <div
                          className="h-full rounded-full bg-[#3558AE]"
                          style={{
                            width: `${coursePercentage}%`,
                          }}
                        />
                      </div>
                    </DashboardCard>

                    {/* XP */}

                    <DashboardCard>
                      <CardIcon>
                        <Sparkles size={20} />
                      </CardIcon>

                      <p className="mt-5 text-xs font-semibold text-[#071A4A]/40">
                        Total Experience
                      </p>

                      <p className="mt-1 text-3xl font-bold">
                        {xp.toLocaleString()}
                      </p>

                      <p className="mt-1 text-xs text-[#071A4A]/35">
                        XP earned
                      </p>

                      <div className="mt-5 flex items-center gap-1.5 text-[11px] font-semibold text-[#3558AE]">
                        <Star size={13} />
                        Level {level}
                      </div>
                    </DashboardCard>

                    {/* STREAK */}

                    <DashboardCard>
                      <CardIcon>
                        <Flame size={20} />
                      </CardIcon>

                      <p className="mt-5 text-xs font-semibold text-[#071A4A]/40">
                        Learning Streak
                      </p>

                      <p className="mt-1 text-3xl font-bold">
                        {streak}
                      </p>

                      <p className="mt-1 text-xs text-[#071A4A]/35">
                        {streak === 1
                          ? "day"
                          : "days"}{" "}
                        in a row
                      </p>

                      <p className="mt-5 text-[11px] font-semibold text-[#B64074]">
                        Keep your streak alive!
                      </p>
                    </DashboardCard>
                  </div>
                </section>

                {/* =================================================
                    ADVENTURE
                ================================================= */}

                <section className="overflow-hidden rounded-[24px] border border-[#071A4A]/5 bg-white shadow-[0_8px_30px_rgba(7,26,74,0.04)]">

                  <div className="flex items-center justify-between border-b border-[#071A4A]/5 px-6 py-5">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#3558AE]">
                        Your Adventure
                      </p>

                      <h2 className="mt-1 text-lg font-bold">
                        Continue your journey
                      </h2>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5FF] text-[#3558AE]">
                      <Map size={19} />
                    </div>
                  </div>

                  <div className="flex min-h-44 flex-col items-center justify-center px-6 py-10 text-center">

                    {data.course ? (
                      <>
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF5FF] text-xl">
                          {data.language?.flag_emoji ||
                            "🌐"}
                        </div>

                        <p className="font-bold">
                          {data.course.title}
                        </p>

                        <p className="mt-1 max-w-md text-xs leading-5 text-[#071A4A]/40">
                          Continue your lessons to unlock
                          more of your learning journey.
                        </p>

                        <Link
                          href="/learn"
                          className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#3558AE]"
                        >
                          Open lesson map
                          <ArrowRight size={13} />
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF5FF] text-[#3558AE]">
                          <Map size={21} />
                        </div>

                        <p className="font-bold">
                          Your adventure starts here
                        </p>

                        <p className="mt-1 text-xs text-[#071A4A]/40">
                          Choose a language to begin.
                        </p>

                        <Link
                          href="/languages"
                          className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#3558AE]"
                        >
                          Choose your language
                          <ArrowRight size={13} />
                        </Link>
                      </>
                    )}
                  </div>
                </section>
              </div>

              {/* =================================================
                  RIGHT SIDE
              ================================================= */}

              <aside className="space-y-5">

                {/* DAILY GOAL */}

                <section className="rounded-[22px] border border-[#071A4A]/5 bg-white p-6 shadow-[0_8px_30px_rgba(7,26,74,0.04)]">

                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#3558AE]">
                        Daily Goal
                      </p>

                      <h2 className="mt-1 text-lg font-bold">
                        A little every day
                      </h2>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5FF] text-[#3558AE]">
                      <Target size={19} />
                    </div>
                  </div>

                  <div className="mt-6 flex items-end justify-between">

                    <div>
                      <span className="text-3xl font-bold">
                        {completedActivities}
                      </span>

                      <span className="ml-1 text-sm font-semibold text-[#071A4A]/35">
                        / {targetActivities}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-[#3558AE]">
                      {dailyGoalPercentage}%
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-[#071A4A]/40">
                    learning activities today
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EAF5FF]">
                    <div
                      className="h-full rounded-full bg-[#3558AE] transition-all duration-500"
                      style={{
                        width: `${dailyGoalPercentage}%`,
                      }}
                    />
                  </div>

                  {data.goal?.is_completed ? (
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-xs font-semibold text-green-700">
                      <CheckCircle2 size={15} />
                      Daily goal complete!
                    </div>
                  ) : (
                    <p className="mt-4 text-[11px] leading-5 text-[#071A4A]/40">
                      {Math.max(
                        targetActivities -
                          completedActivities,
                        0
                      )}{" "}
                      more{" "}
                      {Math.max(
                        targetActivities -
                          completedActivities,
                        0
                      ) === 1
                        ? "activity"
                        : "activities"}{" "}
                      to reach today&apos;s goal.
                    </p>
                  )}
                </section>

                {/* COINS */}

                <section className="rounded-[22px] border border-[#071A4A]/5 bg-white p-6 shadow-[0_8px_30px_rgba(7,26,74,0.04)]">

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF7DD] text-[#D49B13]">
                      <Coins size={21} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#071A4A]/40">
                        Your Coins
                      </p>

                      <p className="text-xl font-bold">
                        {coins.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/store"
                    className="mt-5 flex items-center justify-between rounded-xl bg-[#F7FAFC] px-4 py-3 text-xs font-bold text-[#071A4A]/65 transition hover:bg-[#EAF5FF] hover:text-[#3558AE]"
                  >
                    Visit Store
                    <ArrowRight size={14} />
                  </Link>
                </section>

                {/* ACE TIP */}

                <section className="rounded-[22px] border border-[#C7A9D4]/30 bg-[#F8F4FA] p-5">

                  <div className="flex gap-3">

                    <Image
                      src="/icon head.png"
                      alt="Ace"
                      width={42}
                      height={42}
                      className="h-10 w-10 shrink-0 object-contain"
                    />

                    <div>
                      <p className="text-xs font-bold">
                        Ace&apos;s learning tip
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-[#071A4A]/45">
                        Consistency beats perfection. A
                        little practice every day can make
                        a big difference.
                      </p>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function DashboardCard({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <article className="rounded-[22px] border border-[#071A4A]/5 bg-white p-6 shadow-[0_8px_30px_rgba(7,26,74,0.04)]">
      {children}
    </article>
  );
}

function CardIcon({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF5FF] text-[#3558AE]">
      {children}
    </div>
  );
}