"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { useEffect, useRef } from "react";
import PublicHeader from "@/components/PublicHeader";

/* =========================================================
   AVAILABLE LANGUAGES
========================================================= */

const languages = [
  {
    name: "Japanese",
    nativeName: "日本語",
    flag: "/flags/japan.jpg",
  },
  {
    name: "Korean",
    nativeName: "한국어",
    flag: "/flags/korea.jpg",
  },
  {
    name: "Mandarin",
    nativeName: "中文",
    flag: "/flags/china.jpg",
  },
  {
    name: "Spanish",
    nativeName: "Español",
    flag: "/flags/spanish.jpg",
  },
  {
    name: "German",
    nativeName: "Deutsch",
    flag: "/flags/german.jpg",
  },
  {
    name: "Thai",
    nativeName: "ไทย",
    flag: "/flags/thailand.jpg",
  },
  {
    name: "French",
    nativeName: "Français",
    flag: "/flags/france.jpg",
  },
];

/* =========================================================
   HOME PAGE
========================================================= */

export default function Home() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  /* =======================================================
     AUTOMATIC LANGUAGE CAROUSEL
  ======================================================= */

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel) return;

    const interval = window.setInterval(() => {
      if (pausedRef.current) return;

      carousel.scrollLeft += 1;

      /*
       * The language list is duplicated.
       * Once we reach the second copy, return to the beginning.
       */
      const halfway = carousel.scrollWidth / 2;

      if (carousel.scrollLeft >= halfway) {
        carousel.scrollLeft = 0;
      }
    }, 20);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const carouselLanguages = [...languages, ...languages];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#EAF5FF] text-[#071A4A]">
      {/* ===================================================
          REUSABLE PUBLIC HEADER
      =================================================== */}

      <PublicHeader />

      {/* ===================================================
          HERO SECTION
      =================================================== */}

      <section className="flex min-h-[570px] items-center justify-center px-6 pb-10 pt-4">
        <div className="w-full text-center">
          {/* =================================================
              ACE FLOATING AREA
          ================================================= */}

          <div className="relative mx-auto h-[330px] w-[650px] max-w-full">
            {/* ===============================================
                SOFT GLOW
            =============================================== */}

            <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-3xl" />

            {/* ===============================================
                3D ORBIT SYSTEM
            =============================================== */}

            <div className="ace-orbit absolute left-1/2 top-1/2 z-10">
              {/* Orbit 1 */}
              <div className="ace-orbit-ring ace-orbit-ring-1">
                <span className="ace-orbit-dot ace-orbit-dot-1" />
              </div>

              {/* Orbit 2 */}
              <div className="ace-orbit-ring ace-orbit-ring-2">
                <span className="ace-orbit-dot ace-orbit-dot-2" />
              </div>

              {/* Orbit 3 */}
              <div className="ace-orbit-ring ace-orbit-ring-3">
                <span className="ace-orbit-dot ace-orbit-dot-3" />
              </div>

              {/* Orbit 4 */}
              <div className="ace-orbit-ring ace-orbit-ring-4">
                <span className="ace-orbit-dot ace-orbit-dot-4" />
              </div>
            </div>

            {/* ===============================================
                ACE HEAD
            =============================================== */}

            <div className="ace-float absolute left-1/2 top-1/2 z-20">
              <Image
                src="/icon head.png"
                alt="Ace ACELINGUA mascot"
                width={220}
                height={220}
                priority
                quality={100}
                className="h-[170px] w-[170px] object-contain drop-shadow-[0_18px_16px_rgba(7,26,74,0.18)]"
              />
            </div>

            {/* ===============================================
                SPANISH BUBBLE
                Upper Left
            =============================================== */}

            <div className="absolute left-[20px] top-[45px] z-30 sm:left-[45px]">
              <div className="relative rounded-2xl border border-[#3558AE]/15 bg-white px-4 py-2.5 shadow-[0_5px_18px_rgba(7,26,74,0.08)]">
                <p className="text-xs font-semibold text-[#071A4A]">
                  <span className="mr-1.5 text-[10px] font-extrabold text-[#3558AE]">
                    ES
                  </span>

                  ¡Hola!
                </p>

                <div className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-[#3558AE]/15 bg-white" />
              </div>
            </div>

            {/* ===============================================
                GERMAN BUBBLE
                Upper Right
            =============================================== */}

            <div className="absolute right-[20px] top-[65px] z-30 sm:right-[45px]">
              <div className="relative rounded-2xl border border-[#3558AE]/15 bg-white px-4 py-2.5 shadow-[0_5px_18px_rgba(7,26,74,0.08)]">
                <p className="text-xs font-semibold text-[#071A4A]">
                  <span className="mr-1.5 text-[10px] font-extrabold text-[#3558AE]">
                    DE
                  </span>

                  Hallo!
                </p>

                <div className="absolute -bottom-1.5 left-5 h-3 w-3 rotate-45 border-b border-r border-[#3558AE]/15 bg-white" />
              </div>
            </div>

            {/* ===============================================
                JAPANESE BUBBLE
                Lower Right
            =============================================== */}

            <div className="absolute bottom-[35px] right-[30px] z-30 sm:right-[75px]">
              <div className="relative rounded-2xl border border-[#3558AE]/15 bg-white px-4 py-2.5 shadow-[0_5px_18px_rgba(7,26,74,0.08)]">
                <p className="text-xs font-semibold text-[#071A4A]">
                  <span className="mr-1.5 text-[10px] font-extrabold text-[#3558AE]">
                    JP
                  </span>

                  こんにちは
                </p>

                <div className="absolute -top-1.5 left-5 h-3 w-3 rotate-45 border-l border-t border-[#3558AE]/15 bg-white" />
              </div>
            </div>

            {/* ===============================================
                KOREAN BUBBLE
                Lower Left
            =============================================== */}

            <div className="absolute bottom-[50px] left-[25px] z-30 sm:left-[65px]">
              <div className="relative rounded-2xl border border-[#3558AE]/15 bg-white px-4 py-2.5 shadow-[0_5px_18px_rgba(7,26,74,0.08)]">
                <p className="text-xs font-semibold text-[#071A4A]">
                  <span className="mr-1.5 text-[10px] font-extrabold text-[#3558AE]">
                    KR
                  </span>

                  안녕하세요
                </p>

                <div className="absolute -top-1.5 right-5 h-3 w-3 rotate-45 border-l border-t border-[#3558AE]/15 bg-white" />
              </div>
            </div>
          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div className="-mt-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#071A4A] sm:text-3xl">
              Learn. Speak. Explore.
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#071A4A]/55 sm:text-base">
              Learn languages through interactive lessons, practice, and
              rewarding progress.
            </p>
          </div>

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {/* Get Started */}

            <Link
              href="/onboarding/languages"
              className="group inline-flex min-w-[145px] items-center justify-center gap-2 rounded-full bg-[#071A4A] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#3558AE]"
            >
              Get Started

              <span className="transition group-hover:translate-x-1">
                ›
              </span>
            </Link>

            {/* How It Works */}

            <Link
              href="/how-it-works"
              className="inline-flex min-w-[145px] items-center justify-center gap-2 rounded-full border border-[#071A4A]/30 bg-transparent px-6 py-3 text-sm font-semibold transition hover:bg-white/60"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#071A4A] text-white">
                <Play size={10} fill="currentColor" />
              </span>

              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================
          LANGUAGE SECTION
      =================================================== */}

      <section className="pb-12">
        {/* =================================================
            SECTION HEADING
        ================================================= */}

        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3558AE]">
            Languages
          </p>

          <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
            Explore languages
          </h2>
        </div>

        {/* =================================================
            AUTOMATIC FLAG CAROUSEL
        ================================================= */}

        <div className="mx-auto w-full max-w-[850px] overflow-hidden px-4 sm:px-0">
          <div
            ref={carouselRef}
            onMouseEnter={() => {
              pausedRef.current = true;
            }}
            onMouseLeave={() => {
              pausedRef.current = false;
            }}
            className="flex gap-4 overflow-x-hidden"
          >
            {carouselLanguages.map((language, index) => (
              <Link
                key={`${language.name}-${index}`}
                href="/onboarding/language"
                className="group w-[170px] shrink-0 sm:w-[190px]"
              >
                <div className="rounded-2xl border border-white bg-white/75 p-3 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg">
                  {/* FLAG */}

                  <div className="relative h-[95px] w-full overflow-hidden rounded-xl border border-[#071A4A]/5 bg-white sm:h-[105px]">
                    <Image
                      src={language.flag}
                      alt={`${language.name} flag`}
                      fill
                      sizes="190px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* LANGUAGE DETAILS */}

                  <div className="px-1 pb-1 pt-3 text-center">
                    <p className="text-sm font-bold text-[#071A4A]">
                      {language.name}
                    </p>

                    <p className="mt-0.5 text-xs text-[#071A4A]/40">
                      {language.nativeName}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* =================================================
            VIEW ALL LANGUAGES
        ================================================= */}

        <div className="mt-6 text-center">
          <Link
            href="/onboarding/language"
            className="group inline-flex items-center text-sm font-semibold text-[#3558AE] transition hover:text-[#071A4A]"
          >
            View all languages

            <span className="ml-1 transition group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
