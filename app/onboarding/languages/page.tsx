"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Language = {
  id: string;
  code: string;
  name: string;
  native_name: string | null;
};

/* Flag images stored inside public/flags */
const languageFlags: Record<string, string> = {
  ja: "/flags/japan.jpg",
  ko: "/flags/korea.jpg",
  zh: "/flags/china.jpg",
  es: "/flags/spanish.jpg",
  de: "/flags/german.jpg",
  th: "/flags/thailand.jpg",
  fr: "/flags/france.jpg",
};

export default function ChooseLanguagePage() {
  const router = useRouter();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [continuing, setContinuing] = useState(false);

  /* =========================================================
     LOAD ACTIVE LANGUAGES FROM SUPABASE
  ========================================================= */

  useEffect(() => {
    const loadLanguages = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("languages")
        .select("id, code, name, native_name")
        .eq("is_active", true)
        .order("name");

      if (error) {
        setMessage(error.message);
      } else {
        setLanguages(data ?? []);
      }

      setLoading(false);
    };

    loadLanguages();
  }, []);

  /* =========================================================
     CAROUSEL CONTROLS
  ========================================================= */

  const previousLanguage = () => {
    if (languages.length === 0) return;

    setCurrentIndex((prev) =>
      prev === 0 ? languages.length - 1 : prev - 1
    );
  };

  const nextLanguage = () => {
    if (languages.length === 0) return;

    setCurrentIndex((prev) =>
      prev === languages.length - 1 ? 0 : prev + 1
    );
  };

  const getLanguage = (offset: number) => {
    if (languages.length === 0) return null;

    const index =
      (currentIndex + offset + languages.length) %
      languages.length;

    return languages[index];
  };

  /* =========================================================
     CONTINUE WITH SELECTED LANGUAGE
  ========================================================= */

  const handleContinue = async () => {
    const language = languages[currentIndex];

    if (!language || continuing) return;

    setContinuing(true);

    try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError && authError.name !== "AuthSessionMissingError") throw authError;

    /*
     * The learner is still a guest here.
     *
     * Do NOT create user_courses, course_progress,
     * or lesson_progress yet.
     *
     * Save the selected language temporarily so we can
     * restore it after registration/login.
     */

    localStorage.setItem(
      "acelingua_selected_language",
      language.code
    );

    localStorage.setItem(
      "acelingua_selected_language_id",
      language.id
    );

    localStorage.setItem(
      "acelingua_onboarding_started",
      "true"
    );

    /*
     * IMPORTANT:
     *
     * We no longer send first-time learners to:
     *
     * /onboarding/course?language=<UUID>
     *
     * The learner first tries the introductory learning
     * experience instead.
     *
     * Example:
     * Japanese -> /learn/intro?language=ja
     */

    if (user) {
      localStorage.setItem("acelingua_onboarding_user_id", user.id);
      localStorage.removeItem("acelingua_onboarding_completed_user_id");
      router.push("/onboarding/continue");
      return;
    }

    router.push(
      `/learn/intro?language=${encodeURIComponent(language.code)}`
    );
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Couldn't save your language. Please try again.");
      setContinuing(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#EAF5FF]">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-[#3558AE]"
          />

          <p className="mt-3 text-sm text-[#071A4A]/50">
            Loading languages...
          </p>
        </div>
      </main>
    );
  }

  const previous = getLanguage(-1);
  const current = getLanguage(0);
  const next = getLanguage(1);

  return (
    <main className="min-h-screen overflow-hidden bg-[#EAF5FF] text-[#071A4A]">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-10 lg:px-14">
        <Image
          src="/logo.png"
          alt="ACELINGUA"
          width={48}
          height={48}
          priority
          className="h-10 w-auto object-contain"
        />
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-[#071A4A]/15 bg-white/75 px-4 py-2.5 text-sm font-semibold text-[#071A4A] transition hover:bg-white hover:text-[#3558AE]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to home
        </Link>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="mx-auto flex max-w-6xl flex-col items-center px-5 pb-16 pt-5 md:pt-10">
        {/* HEADING */}

        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3558AE]">
            Choose your language
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            What do you want to learn?
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#071A4A]/50">
            Choose a language and try your first lesson. No account
            needed.
          </p>
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {message && (
          <div className="mt-8 w-full max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {message}
          </div>
        )}

        {/* ===================================================
            NO LANGUAGES
        =================================================== */}

        {languages.length === 0 ? (
          <div className="mt-12 rounded-2xl bg-white px-8 py-10 text-center shadow-sm">
            <p className="font-semibold">
              No languages are available yet.
            </p>
          </div>
        ) : (
          <>
            {/* =================================================
                CAROUSEL
            ================================================= */}

            <div className="relative mt-12 flex w-full items-center justify-center">
              {/* LEFT ARROW */}

              <button
                type="button"
                onClick={previousLanguage}
                className="absolute left-0 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#071A4A] shadow-md transition hover:scale-110 hover:bg-[#071A4A] hover:text-white sm:left-5 lg:left-16"
                aria-label="Previous language"
              >
                <ArrowLeft size={19} />
              </button>

              {/* CARDS */}

              <div className="flex w-full items-center justify-center gap-4 sm:gap-6">
                {/* PREVIOUS LANGUAGE */}

                {previous && (
                  <button
                    type="button"
                    onClick={previousLanguage}
                    className="hidden w-[220px] shrink-0 scale-90 opacity-45 transition duration-300 hover:scale-95 hover:opacity-70 md:block"
                  >
                    <LanguageCard
                      language={previous}
                      active={false}
                    />
                  </button>
                )}

                {/* CURRENT LANGUAGE */}

                {current && (
                  <div className="relative z-10 w-full max-w-[340px] shrink-0 transition-all duration-300">
                    <LanguageCard
                      language={current}
                      active
                    />
                  </div>
                )}

                {/* NEXT LANGUAGE */}

                {next && (
                  <button
                    type="button"
                    onClick={nextLanguage}
                    className="hidden w-[220px] shrink-0 scale-90 opacity-45 transition duration-300 hover:scale-95 hover:opacity-70 md:block"
                  >
                    <LanguageCard
                      language={next}
                      active={false}
                    />
                  </button>
                )}
              </div>

              {/* RIGHT ARROW */}

              <button
                type="button"
                onClick={nextLanguage}
                className="absolute right-0 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#071A4A] shadow-md transition hover:scale-110 hover:bg-[#071A4A] hover:text-white sm:right-5 lg:right-16"
                aria-label="Next language"
              >
                <ArrowRight size={19} />
              </button>
            </div>

            {/* =================================================
                DOTS
            ================================================= */}

            <div className="mt-7 flex items-center justify-center gap-2">
              {languages.map((language, index) => (
                <button
                  key={language.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Select ${language.name}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-7 bg-[#3558AE]"
                      : "w-2 bg-[#071A4A]/15 hover:bg-[#071A4A]/30"
                  }`}
                />
              ))}
            </div>

            {/* =================================================
                CONTINUE
            ================================================= */}

            <button
              type="button"
              onClick={handleContinue}
              disabled={continuing}
              className="mt-8 flex min-w-[190px] items-center justify-center gap-2 rounded-full bg-[#071A4A] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#071A4A]/10 transition hover:-translate-y-0.5 hover:bg-[#3558AE] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {continuing ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Continuing...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-[#071A4A]/35">
              You can learn more languages later.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

/* =========================================================
   LANGUAGE CARD
========================================================= */

function LanguageCard({
  language,
  active,
}: {
  language: Language;
  active: boolean;
}) {
  const flagImage = languageFlags[language.code];

  return (
    <div
      className={`overflow-hidden rounded-[26px] border bg-white transition-all duration-300 ${
        active
          ? "border-[#3558AE]/20 shadow-[0_20px_60px_rgba(7,26,74,0.12)]"
          : "border-white shadow-sm"
      }`}
    >
      {/* FLAG */}

      <div
        className={`relative w-full overflow-hidden bg-[#F7F9FC] ${
          active ? "h-[210px]" : "h-[150px]"
        }`}
      >
        {flagImage ? (
          <Image
            src={flagImage}
            alt={`${language.name} flag`}
            fill
            sizes={active ? "340px" : "220px"}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            🌐
          </div>
        )}
      </div>

      {/* DETAILS */}

      <div
        className={`text-center ${
          active ? "px-6 py-6" : "px-4 py-5"
        }`}
      >
        <h2
          className={`font-extrabold ${
            active ? "text-2xl" : "text-lg"
          }`}
        >
          {language.name}
        </h2>

        {language.native_name && (
          <p
            className={`mt-1 ${
              active
                ? "text-sm text-[#071A4A]/50"
                : "text-xs text-[#071A4A]/40"
            }`}
          >
            {language.native_name}
          </p>
        )}

        {active && (
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-[#3558AE]">
            <Check size={14} />
            Selected
          </div>
        )}
      </div>
    </div>
  );
}
