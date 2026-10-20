"use client";

import Image from "next/image";

import Link from "next/link";

import { ArrowRight, Cloud, Globe2, Maximize2, Minimize2, Pause, Play, Send, Sparkles, Star, Volume2, VolumeX, X as CloseIcon } from "lucide-react";

import {

  useEffect,

  useRef,

  useState,

  type FormEvent,

  type ReactNode,

} from "react";

import PublicHeader from "@/components/PublicHeader";

import AnimatedWorld from "@/components/AnimatedWorld";

const languages = [

  {

    name: "Japanese",

    code: "ja",

    nativeName: "日本語",

    flag: "/flags/japan.jpg",

  },

  {

    name: "Korean",

    code: "ko",

    nativeName: "한국어",

    flag: "/flags/korea.jpg",

  },

  {

    name: "Mandarin",

    code: "zh",

    nativeName: "中文",

    flag: "/flags/china.jpg",

  },

  {

    name: "Spanish",

    code: "es",

    nativeName: "Español",

    flag: "/flags/spanish.jpg",

  },

  {

    name: "German",

    code: "de",

    nativeName: "Deutsch",

    flag: "/flags/german.jpg",

  },

  {

    name: "Thai",

    code: "th",

    nativeName: "ไทย",

    flag: "/flags/thailand.jpg",

  },

  {

    name: "French",

    code: "fr",

    nativeName: "Français",

    flag: "/flags/france.jpg",

  },

];

type ChatMessage = {

  id: number;

  sender: "user" | "bot";

  text: string;

};

const chatbotQuestions = [

  {

    question: "What is ACELingua?",

    answer:

      "ACELingua is an interactive language-learning platform where you can learn new languages through lessons, practice activities, cultural exploration, and rewards.",

  },

  {

    question: "What languages are available?",

    answer:

      "ACELingua currently features Japanese, Korean, Mandarin, Spanish, German, Thai, and French.",

  },

  {

    question: "How do I start learning?",

    answer:

      "Click Get Started, choose a language, and try your first lesson. You can create your account afterward to continue your learning journey.",

  },

  {

    question: "How do lessons work?",

    answer:

      "Lessons are organized from beginner to more advanced topics. You can learn vocabulary, useful phrases, grammar, and practical conversations.",

  },

  {

    question: "Do I earn rewards?",

    answer:

      "Yes! As you complete lessons and activities, you can earn XP, coins, achievements, and other rewards.",

  },

  {

    question: "Can I customize my avatar?",

    answer:

      "Yes. ACELingua includes avatar customization with outfits, hairstyles, accessories, and unlockable items.",

  },

];

export default function Home() {
  const pausedRef = useRef(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);



  const carouselLanguages = [...languages, ...languages];

  return (
    <main className="acelingua-home relative isolate min-h-svh overflow-x-clip text-[#102452]">
      <HomeAtmosphere />

      <div className="relative z-10">
        <FloatingChatbot />
        <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
        <PublicHeader />

        <div className="mx-auto w-full max-w-[1380px] px-5 pb-10 sm:px-8 lg:px-14">
          {/* Immersive welcome section */}
          <section className="relative grid min-h-[570px] items-center gap-5 py-7 md:py-10 lg:min-h-[620px] lg:grid-cols-[0.88fr_1.12fr] lg:gap-0 xl:min-h-[640px]">
            <div className="acel-reveal relative z-30 order-2 mx-auto w-full max-w-[560px] text-center lg:order-1 lg:mx-0 lg:pr-4 lg:text-left">

              <h1 className="text-[clamp(2.65rem,5.15vw,5.2rem)] font-black leading-[1.04] tracking-[-0.055em]">
                Learn. Speak.
                <span className="relative mt-1 block w-fit max-w-full mx-auto lg:mx-0">
                  <span className="acel-gradient-text">Explore.</span>
                  <span aria-hidden="true" className="absolute -bottom-2 left-2 right-1 h-2 rounded-full bg-[#FFD46E]/70 blur-[1px] -rotate-[1deg]" />
                </span>
              </h1>

              <p className="mx-auto mt-7 max-w-[475px] text-[15px] leading-7 text-[#33436D]/75 sm:text-[17px] lg:mx-0">
                Learn languages through interactive lessons, practice, and rewarding progress.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link
                  href="/onboarding/languages"
                  className="acel-cta group inline-flex min-h-[54px] items-center justify-center gap-3 rounded-full bg-[#102452] px-7 text-sm font-extrabold text-white shadow-[0_15px_30px_rgba(16,36,82,0.22)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#3558AE] hover:shadow-[0_20px_35px_rgba(53,88,174,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85D8FA]/70"
                >
                  Start your adventure
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight size={17} />
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsVideoOpen(true)}
                  aria-haspopup="dialog"
                  aria-controls="acelingua-how-it-works"
                  className="group relative inline-flex min-h-[54px] items-center justify-center gap-3 overflow-hidden rounded-full border border-white/55 bg-white/30 px-6 text-sm font-extrabold text-[#102452] shadow-[0_10px_25px_rgba(40,65,122,0.07)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/85 hover:bg-white/50 hover:shadow-[0_16px_36px_rgba(40,65,122,0.15)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85D8FA]/70"
                >
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#EDE7FA] to-[#D9EAFB] text-[#3558AE] shadow-[0_3px_10px_rgba(53,88,174,.12)] transition-transform group-hover:scale-110">
                    <Play size={13} fill="currentColor" />
                  </span>
                  How it works
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12px] font-semibold text-[#516087] lg:justify-start">
              </div>
            </div>

            {/* Animated globe and floating travel props */}
            <div className="relative order-1 mx-auto flex h-[315px] w-full max-w-[740px] items-center justify-center sm:h-[400px] lg:order-2 lg:h-[525px]">
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[51%] h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(143,215,252,0.42)_0%,rgba(196,179,249,0.12)_50%,transparent_75%)] blur-2xl" />
              <div aria-hidden="true" className="acel-orbit absolute left-1/2 top-1/2 h-[285px] w-[285px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-dashed border-[#6086D4]/25 sm:h-[390px] sm:w-[390px] lg:h-[470px] lg:w-[470px]" />
              <div aria-hidden="true" className="acel-orbit-reverse absolute left-1/2 top-1/2 h-[240px] w-[440px] -translate-x-1/2 -translate-y-1/2 rotate-[-22deg] rounded-[50%] border border-[#F7A2B4]/45 sm:h-[290px] sm:w-[600px]" />

              <div className="relative z-10 mx-auto flex h-[300px] w-full max-w-[650px] items-center justify-center sm:h-[370px] lg:h-[430px]">
                <AnimatedWorld />
              </div>

              {/* The original four greeting bubbles return, with gentle floating motion.
                  Each bubble keeps its speech tail, language code and pronunciation. */}
              <div aria-hidden="true" className="acel-float pointer-events-none absolute left-[1%] top-[7%] z-20 sm:left-[3%] sm:top-[12%] lg:left-[5%]">
                <div className="relative rounded-2xl border border-[#3558AE]/10 bg-white/75 px-3 py-2 shadow-[0_8px_25px_rgba(16,36,82,0.09)] backdrop-blur-md sm:px-4 sm:py-2.5">
                  <p className="whitespace-nowrap text-[11px] font-semibold text-[#102452] sm:text-xs">
                    <span className="mr-1.5 text-[10px] font-extrabold text-[#3558AE]">ES</span>
                    ¡Hola!
                  </p>
                  <span className="absolute -bottom-[5px] right-5 h-2.5 w-2.5 rotate-45 border-b border-r border-[#3558AE]/10 bg-white/75" />
                </div>
              </div>

              <div aria-hidden="true" className="acel-float-delayed pointer-events-none absolute right-[1%] top-[9%] z-20 sm:right-[3%] sm:top-[16%] lg:right-[6%]">
                <div className="relative rounded-2xl border border-[#3558AE]/10 bg-white/75 px-3 py-2 shadow-[0_8px_25px_rgba(16,36,82,0.09)] backdrop-blur-md sm:px-4 sm:py-2.5">
                  <p className="whitespace-nowrap text-[11px] font-semibold text-[#102452] sm:text-xs">
                    <span className="mr-1.5 text-[10px] font-extrabold text-[#3558AE]">DE</span>
                    Hallo!
                  </p>
                  <span className="absolute -bottom-[5px] left-5 h-2.5 w-2.5 rotate-45 border-b border-r border-[#3558AE]/10 bg-white/75" />
                </div>
              </div>

              <div aria-hidden="true" className="acel-float-slow pointer-events-none absolute bottom-[8%] right-[0%] z-20 sm:bottom-[11%] sm:right-[2%] lg:bottom-[15%] lg:right-[6%]">
                <div className="relative rounded-2xl border border-[#3558AE]/10 bg-white/80 px-3 py-2 shadow-[0_8px_25px_rgba(16,36,82,0.09)] backdrop-blur-md sm:px-4 sm:py-2.5">
                  <p className="whitespace-nowrap text-[11px] font-semibold text-[#102452] sm:text-xs">
                    <span className="mr-1.5 text-[10px] font-extrabold text-[#3558AE]">JP</span>
                    こんにちは
                  </p>
                  <p className="mt-0.5 text-[9px] font-medium text-[#102452]/50 sm:text-[10px]">Kon · ni · chi · wa</p>
                  <span className="absolute -top-[5px] left-5 h-2.5 w-2.5 rotate-45 border-l border-t border-[#3558AE]/10 bg-white/80" />
                </div>
              </div>

              <div aria-hidden="true" className="acel-float-delayed pointer-events-none absolute bottom-[9%] left-[0%] z-20 sm:bottom-[13%] sm:left-[3%] lg:bottom-[17%] lg:left-[5%]">
                <div className="relative rounded-2xl border border-[#3558AE]/10 bg-white/80 px-3 py-2 shadow-[0_8px_25px_rgba(16,36,82,0.09)] backdrop-blur-md sm:px-4 sm:py-2.5">
                  <p className="whitespace-nowrap text-[11px] font-semibold text-[#102452] sm:text-xs">
                    <span className="mr-1.5 text-[10px] font-extrabold text-[#3558AE]">KR</span>
                    안녕하세요
                  </p>
                  <p className="mt-0.5 text-[9px] font-medium text-[#102452]/50 sm:text-[10px]">An · nyeong · ha · se · yo</p>
                  <span className="absolute -top-[5px] right-5 h-2.5 w-2.5 rotate-45 border-l border-t border-[#3558AE]/10 bg-white/80" />
                </div>
              </div>

              {/* Small travel accents stay behind the restored speech bubbles. */}
              <div aria-hidden="true" className="acel-float-slow pointer-events-none absolute left-[15%] top-[38%] z-0 hidden -rotate-12 text-2xl opacity-70 sm:block">✈️</div>
              <div aria-hidden="true" className="acel-twinkle-late pointer-events-none absolute bottom-[24%] right-[21%] z-0 hidden text-lg text-[#8C76C7] sm:block">✧</div>

              <Cloud aria-hidden="true" className="acel-twinkle-late pointer-events-none absolute bottom-[11%] left-[18%] z-20 h-6 w-6 fill-[#FFFFF] text-[#808080] sm:bottom-[7%]" />
              <div aria-hidden="true" className="acel-float pointer-events-none absolute left-[10%] top-[23%] z-20 h-3 w-3 rounded-full bg-[#FF9297] shadow-[0_0_0_7px_rgba(255,146,151,.16)] sm:left-[22%]" />
              <div aria-hidden="true" className="acel-float-slow pointer-events-none absolute right-[12%] top-[36%] z-20 h-3 w-3 rounded-full bg-[#68D978] shadow-[0_0_0_7px_rgba(104,217,120,.14)]" />
              <div aria-hidden="true" className="acel-twinkle pointer-events-none absolute bottom-[14%] left-[12%] text-2xl text-[#728BD6] sm:hidden">✧</div>
              <div aria-hidden="true" className="acel-twinkle-late pointer-events-none absolute right-[16%] top-[19%] text-xl text-[#F3A0A9] sm:hidden">✦</div>
            </div>
          </section>

          {/* Airy, transparent language carousel: no white outer container or heavy card borders. */}
          <section aria-labelledby="explore-languages-title" className="relative mx-auto max-w-[1160px] pb-5 pt-1 sm:pb-10">
            <div aria-hidden="true" className="pointer-events-none absolute -left-8 top-8 h-48 w-52 rounded-full bg-[#D7C8FF]/25 blur-[65px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-6 bottom-1 h-48 w-52 rounded-full bg-[#85D8FA]/30 blur-[65px]" />

            <div className="relative mb-4 flex flex-wrap items-end justify-between gap-3 px-2 sm:mb-5 sm:px-4">
              <div>
                
              </div>
              <Link
                href="/languages"
                className="group inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2.5 text-xs font-extrabold text-[#3558AE] backdrop-blur-sm transition hover:bg-white/45 hover:text-[#3558AE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3558AE]"
              >
                View all languages <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="relative">
              {/* Soft edge fade, using transparency so the page gradient shines through. */}
              <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 top-0 z-20 w-4 bg-gradient-to-r from-[#edf1ff]/60 to-transparent sm:w-8" />
              <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 w-4 bg-gradient-to-l from-[#edf1ff]/60 to-transparent sm:w-8" />
              <div
                aria-label="Available languages"
                onMouseEnter={() => { pausedRef.current = true; }}
                onMouseLeave={() => { pausedRef.current = false; }}
                onFocusCapture={() => { pausedRef.current = true; }}
                onBlurCapture={() => { pausedRef.current = false; }}
                onTouchStart={() => { pausedRef.current = true; }}
                onTouchEnd={() => { pausedRef.current = false; }}
                className="acel-gallery flex gap-3 overflow-x-auto px-2 py-3 sm:gap-5 sm:px-4"
              >
                {carouselLanguages.map((language, index) => (
                  <Link
                    key={`${language.code}-${index}`}
                    href={`/onboarding/languages?language=${encodeURIComponent(language.code)}`}
                    onClick={() => {
                      try { window.sessionStorage.setItem("acelingua_pending_language", language.code); }
                      catch { /* URL query parameter still carries the selected language. */ }
                    }}
                    aria-label={`Start learning ${language.name}`}
                    className="group relative flex w-[145px] shrink-0 flex-col items-center rounded-[24px] bg-white/[0.09] px-3 pb-3 pt-4 text-center backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/30 hover:shadow-[0_14px_32px_rgba(49,78,143,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3558AE] sm:w-[169px] sm:py-4"
                  >
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 top-4 h-20 rounded-full bg-[#85D8FA]/0 blur-2xl transition-colors duration-300 group-hover:bg-[#85D8FA]/30" />
                    <div className="relative mb-2 h-[77px] w-[120px] sm:h-[84px] sm:w-[132px]">
                      <Image
                        src={language.flag}
                        alt={`${language.name} flag`}
                        fill
                        sizes="(min-width: 640px) 132px, 120px"
                        className="object-contain drop-shadow-[0_5px_8px_rgba(16,36,82,0.13)] transition-transform duration-500 group-hover:scale-[1.09]"
                      />
                    </div>
                    <p className="relative text-[13px] font-extrabold tracking-tight text-[#102452] sm:text-sm">{language.name}</p>
                    <p className="relative mt-0.5 text-[11px] font-medium text-[#536384]/75">{language.nativeName}</p>
                    </Link>
                ))}
              </div>
            </div>
            <p className="relative mt-3 text-center text-[1px] font-semibold text-[#657394]/70">@ 2026 ACElingua — All rights reserved </p>
          </section>
        </div>
      </div>

      <style jsx global>{`
        .acelingua-home {
          background: linear-gradient(124deg, #f9f2ff 0%, #e6f7ff 29%, #eeeafd 61%, #fff0e9 100%);
          fasize: 220% 220%;
          animation: acel-background-shift 24s ease-in-out infinite alternate;
        }
        .acel-dot-pattern {
          background-image: radial-gradient(rgba(87,105,168,.15) 1px, transparent 1px);
          background-size: 26px 26px;
          mask-image: linear-gradient(to bottom, transparent, black 18%, black 82%, transparent);
        }
        .acel-gradient-text {
          background-image: linear-gradient(100deg, #ffd36e 0%, #ffd36e 10%, #ff7d82 60%, #69ceff 85%);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }
        .acel-gallery { scrollbar-width: none; -ms-overflow-style: none; }
        .acel-gallery::-webkit-scrollbar { display: none; }
        .acel-reveal { animation: acel-rise .85s both cubic-bezier(.2,.8,.2,1); }
        .acel-float { animation: acel-float 6s ease-in-out infinite; }
        .acel-float-delayed { animation: acel-float 6.7s -2.2s ease-in-out infinite reverse; }
        .acel-float-slow { animation: acel-float 8s -1.3s ease-in-out infinite; }
        .acel-orbit { animation: acel-spin 48s linear infinite; }
        .acel-orbit-reverse { animation: acel-orbit-tilt 29s ease-in-out infinite alternate; }
        .acel-twinkle { animation: acel-twinkle 3.6s ease-in-out infinite; }
        .acel-twinkle-late { animation: acel-twinkle 4.2s -1.7s ease-in-out infinite; }
        .acel-aurora-one { animation: acel-drift 16s ease-in-out infinite alternate; }
        .acel-aurora-two { animation: acel-drift 21s -7s ease-in-out infinite alternate-reverse; }
        .acel-aurora-three { animation: acel-drift 18s -5s ease-in-out infinite alternate; }
        @keyframes acel-background-shift { from { background-position: 0% 30%; } to { background-position: 100% 70%; } }
        @keyframes acel-float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes acel-spin { to { rotate: 360deg; } }
        @keyframes acel-orbit-tilt { from { rotate: -8deg; } to { rotate: 8deg; } }
        @keyframes acel-twinkle { 0%, 100% { opacity: .45; scale: .85; } 50% { opacity: 1; scale: 1.14; } }
        @keyframes acel-drift { from { transform: translate3d(-18px, 12px, 0) scale(1); } to { transform: translate3d(25px, -20px, 0) scale(1.1); } }
        @keyframes acel-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .acel-screen-float { animation: acel-screen-hover 7s ease-in-out infinite; }
        @keyframes acel-screen-hover { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        .acel-video-screen:fullscreen video { height: 100dvh; width: 100%; max-height: 100dvh; object-fit: contain; }
        .acel-video-range::-webkit-slider-thumb { appearance: none; height: 12px; width: 12px; background: #ffffff; border: 2px solid #85D8FA; border-radius: 50%; box-shadow: 0 0 0 4px rgba(133,216,250,.12); }
        .acel-video-range::-moz-range-thumb { height: 10px; width: 10px; background: #ffffff; border: 2px solid #85D8FA; border-radius: 50%; box-shadow: 0 0 0 4px rgba(133,216,250,.12); }
        @media (prefers-reduced-motion: reduce) {
          .acelingua-home, .acel-reveal, .acel-float, .acel-float-delayed,
          .acel-float-slow, .acel-orbit, .acel-orbit-reverse, .acel-twinkle,
          .acel-twinkle-late, .acel-aurora-one, .acel-aurora-two, .acel-aurora-three, .acel-screen-float {
            animation: none !important;
          }
          .acelingua-home *, .acelingua-home *::before, .acelingua-home *::after { scroll-behavior: auto !important; }
        }
      `}</style>
    </main>
  );
}

function HomeAtmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="acel-dot-pattern absolute inset-0 opacity-50" />
      <div className="acel-aurora-one absolute -left-44 top-8 h-[410px] w-[410px] rounded-full bg-[#CDB8FF]/35 blur-[85px] sm:h-[600px] sm:w-[600px]" />
      <div className="acel-aurora-two absolute -right-36 top-24 h-[390px] w-[440px] rounded-full bg-[#78D6FF]/40 blur-[85px] sm:h-[580px] sm:w-[580px]" />
      <div className="acel-aurora-three absolute left-[28%] top-[430px] h-[420px] w-[520px] rounded-full bg-[#FFC3CD]/35 blur-[95px]" />
      <div className="absolute right-[11%] top-[15%] hidden text-[#8EA6DC]/30 lg:block"><Cloud size={63} strokeWidth={1.3}/></div>
      <div className="absolute left-[9%] top-[58%] hidden rotate-12 text-[#B6A4D8]/25 lg:block"><Cloud size={74} strokeWidth={1.2}/></div>
      <div className="absolute right-[6%] top-[62%] hidden -rotate-12 text-[#E8A3BC]/35 lg:block"><Cloud size={35} strokeWidth={1.3}/></div>
      <div className="absolute left-[21%] top-[19%] hidden rotate-12 text-[#99ACD8]/35 lg:block"><Cloud size={20} strokeWidth={1.6}/></div>
    </div>
  );
}

/** A floating, glass-edged flatscreen with a low-lights backdrop. */
function VideoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  // Both filenames are supported because some ACELingua projects use
  // "ACELingua.mp4" while others use "acelingua.mp4" (case-sensitive on hosting).
  const videoSources = ["/Videos/acelingua.mp4", "/Videos/ACELingua.mp4"];
  const videoSource = videoSources[sourceIndex];

  function closeVideo() {
    const video = videoRef.current;
    if (video) {
      video.pause();
      if (video.readyState > 0) video.currentTime = 0;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    setPlaying(false);
    setCurrentTime(0);
    onClose();
  }

  // Keep the player mounted just long enough for its exit animation.
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const raf = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(raf);
    }
    setVisible(false);
    videoRef.current?.pause();
    const timeout = window.setTimeout(() => setMounted(false), 360);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  // Prevent page scrolling, keep keyboard focus inside the dialog, and restore
  // focus to the How it works button when the dialog closes.
  useEffect(() => {
    if (!mounted) return;
    const originalOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => {});
        } else {
          closeVideo();
        }
      }
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onFullscreenChange() {
      setFullscreen(document.fullscreenElement === screenRef.current);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      videoRef.current?.pause();
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      previouslyFocused?.focus();
    };
    // closeVideo is intentionally sourced from the current open render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function seekTo(percent: number) {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = (percent / 100) * video.duration;
    setCurrentTime(video.currentTime);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (screenRef.current?.requestFullscreen) {
        await screenRef.current.requestFullscreen();
      } else {
        // iOS Safari may only expose its native fullscreen player API.
        const safariVideo = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
        safariVideo?.webkitEnterFullscreen?.();
      }
    } catch {
      // Some mobile browsers do not support element fullscreen.
    }
  }

  function formatTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const totalSeconds = Math.floor(seconds);
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
  }

  if (!mounted) return null;

  const playedPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto px-3 py-5 transition-opacity duration-[360ms] sm:px-8 sm:py-8 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeVideo();
      }}
    >
      {/* Low lights: the original homepage stays visible through the dark blur. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#020817]/[0.88] backdrop-blur-[18px]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[48%] h-[58vw] max-h-[640px] w-[88vw] max-w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#526EEB]/20 blur-[95px]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-[14%] top-[18%] h-48 w-48 rounded-full bg-[#85D8FA]/10 blur-[80px] sm:h-80 sm:w-80" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[8%] right-[12%] h-52 w-52 rounded-full bg-[#F99BC9]/10 blur-[85px] sm:h-80 sm:w-80" />

      {/* Decorative light sources around the floating display. */}
      <div aria-hidden="true" className="pointer-events-none absolute left-[13%] top-[20%] h-1.5 w-1.5 rounded-full bg-[#85D8FA]/80 shadow-[0_0_20px_5px_rgba(133,216,250,.30)]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[18%] right-[15%] h-1.5 w-1.5 rounded-full bg-[#FFB7D5]/80 shadow-[0_0_20px_5px_rgba(255,183,213,.28)]" />

      <div
        className="acel-screen-float relative z-10 mx-auto flex w-full flex-col"
        style={{ maxWidth: "min(1100px, calc((100dvh - 175px) * 1.77778))" }}
      >
        <section
          ref={dialogRef}
          id="acelingua-how-it-works"
          role="dialog"
          aria-modal="true"
          aria-labelledby="acel-video-title"
          aria-describedby="acel-video-description"
          className={`relative w-full transform-gpu transition-[opacity,transform,filter] duration-[450ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
            visible
              ? "translate-y-0 scale-100 opacity-100 blur-0"
              : "translate-y-8 scale-[0.94] opacity-0 blur-[4px]"
          }`}
        >
          {/* A minimal floating title bar — no solid cinema container. */}
          <div className="mb-3 flex items-center justify-between gap-3 px-1 sm:mb-4 sm:px-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/[0.08] backdrop-blur-xl sm:h-11 sm:w-11">
                <Image src="/icon head.png" alt="Ace mascot" width={40} height={40} className="h-full w-full object-contain p-1" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.21em] text-[#B8C6FF] sm:text-[10px]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#85D8FA] motion-reduce:animate-none" />
                  ACELingua Preview
                </div>
                <h2 id="acel-video-title" className="truncate text-sm font-semibold tracking-tight text-white sm:text-lg">
                  How It Works.
                </h2>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeVideo}
              aria-label="Close video"
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white/85 backdrop-blur-xl transition-all duration-300 hover:rotate-90 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85D8FA] sm:h-11 sm:w-11"
            >
              <CloseIcon size={19} />
            </button>
          </div>

          {/* Frameless floating TV. Its "body" is only a thin translucent glass edge. */}
          <div className="relative rounded-[18px] border border-white/[0.18] bg-white/[0.06] p-[4px] shadow-[0_32px_85px_rgba(0,0,0,.58),0_0_85px_rgba(112,130,255,.12)] backdrop-blur-lg sm:rounded-[24px] sm:p-[6px]">
            <div aria-hidden="true" className="pointer-events-none absolute -inset-px rounded-[inherit] bg-gradient-to-br from-[#85D8FA]/20 via-transparent to-[#F9C3D7]/15" />
            <div
              ref={screenRef}
              className="acel-video-screen group relative isolate overflow-hidden rounded-[14px] bg-[#030812] shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)] sm:rounded-[19px] [&:fullscreen]:flex [&:fullscreen]:h-screen [&:fullscreen]:w-screen [&:fullscreen]:items-center [&:fullscreen]:justify-center [&:fullscreen]:rounded-none [&:fullscreen]:bg-black"
            >
              <video
                ref={videoRef}
                src={videoSource}
                autoPlay
                playsInline
                preload="metadata"
                onClick={togglePlayback}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
                onLoadedData={(event) => {
                  setVideoError(false);
                  if (isOpen) void event.currentTarget.play().catch(() => setPlaying(false));
                }}
                onError={() => {
                  if (sourceIndex === 0) setSourceIndex(1);
                  else setVideoError(true);
                }}
                className="block aspect-video w-full max-h-[68dvh] bg-[#030812] object-contain"
              >
                Your browser does not support video playback.
              </video>

              {/* A soft gradient keeps the controls readable without hiding the film. */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#01040E]/90 via-[#01040E]/35 to-transparent sm:h-36" />

              {!playing && !videoError && (
                <button
                  type="button"
                  onClick={togglePlayback}
                  aria-label="Play video"
                  className="absolute left-1/2 top-[43%] z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white shadow-[0_12px_38px_rgba(0,0,0,.3)] backdrop-blur-xl transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85D8FA] sm:h-[72px] sm:w-[72px]"
                >
                  <Play size={25} fill="currentColor" className="ml-1" />
                </button>
              )}

              {videoError && (
                <div role="alert" className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#020817]/85 px-5 text-center text-white">
                  <p className="text-base font-bold">The video couldn't be loaded.</p>
                  <p className="mt-2 max-w-sm text-xs leading-5 text-white/65">Check that your MP4 is inside public/Videos and its filename matches acelingua.mp4 or ACELingua.mp4.</p>
                </div>
              )}

              {/* Lightweight transparent controls, integrated into the flatscreen. */}
              <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-2 pt-6 text-white transition-opacity duration-300 sm:translate-y-1 sm:px-5 sm:pb-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-within:translate-y-0 sm:focus-within:opacity-100">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.1}
                  value={playedPercent}
                  disabled={duration <= 0}
                  onChange={(event) => seekTo(Number(event.target.value))}
                  aria-label="Seek video"
                  className="acel-video-range block h-1.5 w-full cursor-pointer appearance-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85D8FA] disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(to right, #85D8FA ${playedPercent}%, rgba(255,255,255,.3) ${playedPercent}%)` }}
                />
                <div className="mt-2 flex h-9 items-center gap-2 sm:mt-3 sm:gap-3">
                  <button type="button" onClick={togglePlayback} aria-label={playing ? "Pause video" : "Play video"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85D8FA]">
                    {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <span className="shrink-0 text-[10px] font-semibold tabular-nums text-white/85 sm:text-xs">
                    {formatTime(currentTime)} <span className="text-white/35">/</span> {formatTime(duration)}
                  </span>
                  <span className="ml-auto hidden text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 sm:block">Learn · Speak · Explore</span>
                  <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute video" : "Mute video"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85D8FA]">
                    {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <button type="button" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? "Exit full screen" : "Full screen"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85D8FA]">
                    {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 px-2 sm:mt-4">
            <p className="hidden text-[10px] font-medium text-white/35 sm:block">Press Esc or click outside to close</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function FloatingChatbot() {

  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([

    {

      id: 1,

      sender: "bot",

      text: "Hi! I'm Ace 👋 How can I help you with ACELingua today?",

    },

  ]);

  const [input, setInput] = useState("");

  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {

    if (!open) return;

    messagesEndRef.current?.scrollIntoView({

      behavior: "smooth",

    });

  }, [messages, isTyping, open]);

  function getAutoAnswer(question: string) {

    const normalized = question.toLowerCase();

    if (

      normalized.includes("what is acelingua") ||

      normalized.includes("about acelingua") ||

      normalized.includes("acelingua")

    ) {

      return chatbotQuestions[0].answer;

    }

    if (

      normalized.includes("language") ||

      normalized.includes("japanese") ||

      normalized.includes("korean") ||

      normalized.includes("mandarin") ||

      normalized.includes("spanish") ||

      normalized.includes("german") ||

      normalized.includes("thai") ||

      normalized.includes("french")

    ) {

      return chatbotQuestions[1].answer;

    }

    if (

      normalized.includes("start") ||

      normalized.includes("register") ||

      normalized.includes("account") ||

      normalized.includes("sign up")

    ) {

      return chatbotQuestions[2].answer;

    }

    if (

      normalized.includes("lesson") ||

      normalized.includes("course") ||

      normalized.includes("study") ||

      normalized.includes("learn")

    ) {

      return chatbotQuestions[3].answer;

    }

    if (

      normalized.includes("xp") ||

      normalized.includes("coin") ||

      normalized.includes("reward") ||

      normalized.includes("achievement")

    ) {

      return chatbotQuestions[4].answer;

    }

    if (

      normalized.includes("avatar") ||

      normalized.includes("outfit") ||

      normalized.includes("hair") ||

      normalized.includes("accessory") ||

      normalized.includes("custom")

    ) {

      return chatbotQuestions[5].answer;

    }

    if (

      normalized.includes("hello") ||

      normalized.includes("hi") ||

      normalized.includes("hey")

    ) {

      return "Hi! 👋 I'm Ace. Ask me anything about ACELingua, available languages, lessons, rewards, or getting started.";

    }

    if (

      normalized.includes("thank") ||

      normalized.includes("thanks")

    ) {

      return "You're welcome! I'm happy to help. 😊";

    }

    return "I can help you with ACELingua, available languages, lessons, registration, XP, coins, rewards, and avatar customization. Try one of the quick questions below.";

  }

  function sendMessage(question: string) {

    const cleanedQuestion = question.trim();

    if (!cleanedQuestion || isTyping) return;

    const userMessage: ChatMessage = {

      id: Date.now(),

      sender: "user",

      text: cleanedQuestion,

    };

    setMessages((current) => [...current, userMessage]);

    setInput("");

    setIsTyping(true);

    const exactAnswer = chatbotQuestions.find(

      (item) =>

        item.question.toLowerCase() === cleanedQuestion.toLowerCase(),

    )?.answer;

    window.setTimeout(() => {

      const botMessage: ChatMessage = {

        id: Date.now() + 1,

        sender: "bot",

        text: exactAnswer ?? getAutoAnswer(cleanedQuestion),

      };

      setMessages((current) => [...current, botMessage]);

      setIsTyping(false);

    }, 650);

  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();

    sendMessage(input);

  }

  return (

    <>

      <div

        className={`

          fixed

          bottom-[6.5625rem]

          right-4

          z-[80]

          w-[calc(100%-32px)]

          max-w-[22.8125rem]

          origin-bottom-right

          overflow-hidden

          rounded-[26px]

          border

          border-[#3558AE]/10

          bg-white

          shadow-[0_25px_80px_rgba(7,26,74,0.20)]

          transition-all

          duration-300

          ease-out

          sm:right-7

          ${

            open

              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"

              : "pointer-events-none translate-y-5 scale-95 opacity-0"

          }

        `}

      >

        <div className="flex items-center justify-between bg-[#071A4A] px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF5FF]">

              <Image

                src="/icon head.png"

                alt="Ace"

                width={44}

                height={44}

                className="h-full w-full object-contain p-1"

              />

            </div>

            <div>

              <div className="flex items-center gap-2">

                <p className="text-sm font-bold text-white">

                  Ace

                </p>

                <span className="h-2 w-2 rounded-full bg-[#62DD92]" />

              </div>

              <p className="text-[0.625rem] text-white/60">

                ACELingua Assistant

              </p>

            </div>

          </div>

          <button

            type="button"

            onClick={() => setOpen(false)}

            aria-label="Close chatbot"

            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-all duration-200 hover:rotate-90 hover:bg-white/10 hover:text-white"

          >

            <CloseIcon className="h-4 w-4" />

          </button>

        </div>

        <div className="max-h-[18.75rem] min-h-[260px] space-y-4 overflow-y-auto bg-[#F8FBFF] px-4 py-5">

          {messages.map((message) => (

            <div

              key={message.id}

              className={`flex ${

                message.sender === "user"

                  ? "justify-end"

                  : "justify-start"

              }`}

            >

              {message.sender === "bot" && (

                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#3558AE]/10 bg-white">

                  <Image

                    src="/icon head.png"

                    alt="Ace"

                    width={27}

                    height={27}

                    className="h-full w-full object-contain p-0.5"

                  />

                </div>

              )}

              <div

                className={`

                  max-w-[78%]

                  px-4

                  py-3

                  text-left

                  text-[0.75rem]

                  leading-5

                  ${

                    message.sender === "user"

                      ? "rounded-[18px] rounded-br-[5px] bg-[#3558AE] text-white"

                      : "rounded-[18px] rounded-bl-[5px] border border-[#071A4A]/5 bg-white text-[#071A4A]/70 shadow-[0_4px_14px_rgba(7,26,74,0.04)]"

                  }

                `}

              >

                {message.text}

              </div>

            </div>

          ))}

          {isTyping && (

            <div className="flex items-center gap-2">

              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-[#3558AE]/10 bg-white">

                <Image

                  src="/icon head.png"

                  alt="Ace"

                  width={27}

                  height={27}

                  className="h-full w-full object-contain p-0.5"

                />

              </div>

              <div className="flex items-center gap-1 rounded-[16px] rounded-bl-[5px] border border-[#071A4A]/5 bg-white px-4 py-3">

                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#071A4A]/35 [animation-delay:-0.3s]" />

                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#071A4A]/35 [animation-delay:-0.15s]" />

                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#071A4A]/35" />

              </div>

            </div>

          )}

          <div ref={messagesEndRef} />

        </div>

        <div className="border-t border-[#071A4A]/5 bg-white px-4 py-3">

          <p className="mb-2 text-left text-[0.5625rem] font-bold uppercase tracking-[0.15em] text-[#071A4A]/35">

            Quick questions

          </p>

          <div className="flex gap-2 overflow-x-auto pb-1">

            {chatbotQuestions.slice(0, 4).map((item) => (

              <button

                key={item.question}

                type="button"

                disabled={isTyping}

                onClick={() => sendMessage(item.question)}

                className="

                  shrink-0

                  rounded-full

                  border

                  border-[#3558AE]/15

                  bg-[#EAF5FF]

                  px-3

                  py-2

                  text-[0.625rem]

                  font-semibold

                  text-[#3558AE]

                  transition-all

                  duration-200

                  hover:-translate-y-0.5

                  hover:border-[#3558AE]

                  hover:bg-[#3558AE]

                  hover:text-white

                  disabled:cursor-not-allowed

                  disabled:opacity-50

                "

              >

                {item.question}

              </button>

            ))}

          </div>

        </div>

        <form

          onSubmit={handleSubmit}

          className="flex items-center gap-2 border-t border-[#071A4A]/5 bg-white p-3"

        >

          <input

            type="text"

            value={input}

            disabled={isTyping}

            onChange={(event) => setInput(event.target.value)}

            placeholder="Ask Ace something..."

            className="

              min-w-0

              flex-1

              rounded-full

              border

              border-[#071A4A]/10

              bg-[#F7FAFD]

              px-4

              py-2.5

              text-[0.75rem]

              text-[#071A4A]

              outline-none

              transition-all

              duration-200

              placeholder:text-[#071A4A]/35

              focus:border-[#3558AE]/40

              focus:bg-white

              focus:ring-2

              focus:ring-[#3558AE]/10

            "

          />

          <button

            type="submit"

            disabled={!input.trim() || isTyping}

            aria-label="Send message"

            className="

              flex

              h-10

              w-10

              shrink-0

              items-center

              justify-center

              rounded-full

              bg-[#071A4A]

              text-white

              transition-all

              duration-200

              hover:scale-105

              hover:bg-[#3558AE]

              disabled:cursor-not-allowed

              disabled:opacity-40

            "

          >

            <Send className="h-4 w-4" />

          </button>

        </form>

      </div>

      <button

        type="button"

        onClick={() => setOpen((current) => !current)}

        aria-label={open ? "Close Ace chatbot" : "Open Ace chatbot"}

        className="

          group

          fixed

          bottom-5

          right-4

          z-[81]

          flex

          h-[4.25rem]

          w-[4.25rem]

          items-center

          justify-center

          rounded-full

          border

          border-[#3558AE]/15

          bg-white

          shadow-[0_12px_40px_rgba(7,26,74,0.18)]

          transition-all

          duration-300

          ease-out

          hover:-translate-y-1

          hover:scale-105

          hover:shadow-[0_18px_48px_rgba(7,26,74,0.24)]

          sm:right-7

        "

      >

        {!open && (

          <span className="absolute inset-0 animate-ping rounded-full border border-[#3558AE]/20" />

        )}

        <div

          className={`

            relative

            z-10

            flex

            h-[3.5625rem]

            w-[3.5625rem]

            items-center

            justify-center

            overflow-hidden

            rounded-full

            bg-[#EAF5FF]

            transition-all

            duration-300

            group-hover:-rotate-6

            group-hover:scale-105

            ${

              open

                ? "scale-75 opacity-0"

                : "scale-100 opacity-100"

            }

          `}

        >

          <Image

            src="/icon head.png"

            alt="Chat with Ace"

            width={57}

            height={57}

            className="h-full w-full object-contain p-1"

          />

        </div>

        <div

          className={`

            absolute

            inset-0

            flex

            items-center

            justify-center

            text-[#071A4A]

            transition-all

            duration-300

            ${

              open

                ? "rotate-0 scale-100 opacity-100"

                : "rotate-90 scale-75 opacity-0"

            }

          `}

        >

          <CloseIcon className="h-6 w-6" />

        </div>

        {!open && (

          <span className="absolute bottom-[5px] right-[4px] z-20 h-4 w-4 rounded-full border-[3px] border-white bg-[#56D88A]" />

        )}

      </button>

    </>

  );

}
