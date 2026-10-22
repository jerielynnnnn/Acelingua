"use client";

import { Fredoka } from "next/font/google";

const fredoka = Fredoka({

  subsets: ["latin"],

  weight: ["600", "700"],

  display: "swap",

});

import Image from "next/image";

import Logo from "@/components/Logo";

import Link from "next/link";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import {

  ArrowRight, BookOpen, ChevronRight, Cloud,

  Compass, Flame, Globe2, Heart, Languages,

  Rocket, Send, Trophy, UserRound, X as CloseIcon,

} from "lucide-react";

// Language palette and greetings. Flags below are drawn as SVGs (not letter codes or emoji),
// so they look like actual flags even on Windows devices that don't render flag emoji.
const languages = [
  {
    code: "jp", name: "Japanese", native: "日本語", greeting: "こんにちは", hello: "Konnichiwa",
    accent: "#C94E6B", soft: "#FFE1E9", front: "linear-gradient(140deg, #FFF6F8 0%, #FFE3EB 56%, #FFD0DC 100%)",
    back: "linear-gradient(135deg, #FF9297 0%, #DC557B 100%)",
  },
  {
    code: "kr", name: "Korean", native: "한국어", greeting: "안녕하세요", hello: "Annyeonghaseyo",
    accent: "#526CCA", soft: "#DFE7FF", front: "linear-gradient(140deg, #F9FAFF 0%, #E4EAFF 55%, #CFD9FF 100%)",
    back: "linear-gradient(135deg, #849EF1 0%, #5469C7 100%)",
  },
  {
    code: "cn", name: "Mandarin", native: "中文", greeting: "你好", hello: "Nǐ hǎo",
    accent: "#C66A42", soft: "#FFE5D0", front: "linear-gradient(140deg, #FFF9F1 0%, #FFEBD9 53%, #FFD6B6 100%)",
    back: "linear-gradient(135deg, #FFAD79 0%, #DC7753 100%)",
  },
  {
    code: "es", name: "Spanish", native: "Español", greeting: "¡Hola!", hello: "Hola",
    accent: "#B27A24", soft: "#FFF2C9", front: "linear-gradient(140deg, #FFFEF2 0%, #FFF4D8 54%, #FFE5A0 100%)",
    back: "linear-gradient(135deg, #F4CB66 0%, #D9A342 100%)",
  },
  {
    code: "de", name: "German", native: "Deutsch", greeting: "Hallo!", hello: "Hallo",
    accent: "#8160B7", soft: "#EDE0FF", front: "linear-gradient(140deg, #FCF9FF 0%, #F1E8FF 52%, #DBC9FF 100%)",
    back: "linear-gradient(135deg, #B195EA 0%, #8063C3 100%)",
  },
  {
    code: "th", name: "Thai", native: "ไทย", greeting: "สวัสดี", hello: "Sawasdee",
    accent: "#248F76", soft: "#DCF8EC", front: "linear-gradient(140deg, #F5FFF9 0%, #E1F9EC 52%, #BAEBD9 100%)",
    back: "linear-gradient(135deg, #6BCCAB 0%, #26977F 100%)",
  },
  {
    code: "fr", name: "French", native: "Français", greeting: "Bonjour !", hello: "Bonjour",
    accent: "#3988BA", soft: "#DDF2FF", front: "linear-gradient(140deg, #F6FCFF 0%, #E4F4FF 55%, #C8E8FF 100%)",
    back: "linear-gradient(135deg, #79C5EB 0%, #3B8DC8 100%)",
  },
] as const;

type LanguageItem = (typeof languages)[number];
type LanguageCode = LanguageItem["code"];

const flowSteps = [

  { n: "01", title: "Create account", text: "Sign up to set up your ACELingua learning profile and save your progress.", icon: Rocket, tint: "#E5F4FF" },

  { n: "02", title: "Choose language", text: "Choose the language you want to learn and explore its learning path.", icon: Languages, tint: "#F4E9FF" },

  { n: "03", title: "Learn & practice", text: "Follow structured lessons, learn phrases, and practice with interactive activities.", icon: BookOpen, tint: "#FFF1DF" },

  { n: "04", title: "Explore cultures", text: "Discover destinations, landmarks, and interesting facts alongside each language.", icon: Compass, tint: "#E4F8EC" },

  { n: "05", title: "Earn rewards", text: "Complete lessons and challenges to collect XP, coins, achievements, and more.", icon: Trophy, tint: "#FFE7EF" },

] as const;

const featureCards = [

  {

    icon: BookOpen, title: "Lessons that click", overline: "LEARN",

    description: "Go from your first greeting to practical everyday conversations with clear, bite-sized lessons.",

    bg: "#EAF4FF", color: "#3558AE", deco: "",

  },

  {

    icon: Globe2, title: "A world to explore", overline: "DISCOVER",

    description: "Go beyond vocabulary with destinations, landmarks, history, and cultural discoveries.",

    bg: "#F1E8FF", color: "#8064B8", deco: "✳",

  },

  {

    icon: Trophy, title: "Every win counts", overline: "GROW",

    description: "Stay motivated with XP, coins, streaks, challenges, and achievements as you progress.",

    bg: "#FFF0D8", color: "#B67A28", deco: "✧",

  },

  {

    icon: UserRound, title: "A journey that's yours", overline: "EXPRESS",

    description: "Make the adventure your own with a customizable avatar, outfits, and unlockable accessories.",

    bg: "#FFE7ED", color: "#B64074", deco: "♡",

  },

] as const;

type ChatMessage = { id: number; sender: "user" | "bot"; text: string };

const chatbotQuestions = [

  { question: "What is ACELingua?", answer: "ACELingua is an interactive language-learning platform where you can learn new languages through lessons, practice activities, cultural exploration, and rewards." },

  { question: "What languages are available?", answer: "ACELingua showcases Japanese, Korean, Mandarin, Spanish, German, Thai, and French. Explore the languages page for the current selection." },

  { question: "How do I start learning?", answer: "Create an account, choose a language, and follow the guided lessons. The steps on this About page lead to registration." },

  { question: "How do lessons work?", answer: "Lessons are organized from beginner to more advanced topics. You can learn vocabulary, useful phrases, grammar, and practical conversations." },

  { question: "Do I earn rewards?", answer: "Yes! As you complete lessons and activities, you can earn XP, coins, achievements, and other rewards." },

  { question: "Can I customize my avatar?", answer: "Yes. ACELingua includes avatar customization with outfits, hairstyles, accessories, and unlockable items." },

];

export default function AboutPage() {

  return (

    <main className="acel-about relative isolate min-h-screen overflow-x-clip text-[#102452]">

      <AboutAtmosphere />

      <div className="relative z-10">

        <AboutHeader />

        <FloatingChatbot />

        {/* HERO — welcoming brand story alongside the app preview. */}

        <section className="relative mx-auto grid w-full max-w-[1380px] items-center gap-12 px-5 pb-20 pt-12 sm:px-8 md:pt-16 lg:min-h-[720px] lg:grid-cols-[1.04fr_.96fr] lg:gap-16 lg:px-14 lg:pb-24 lg:pt-12">

          <div className="acel-about-reveal relative z-10 max-w-[675px] text-center lg:text-left">

            <h1 className={`${fredoka.className} text-[clamp(3rem,5.8vw,5.7rem)] font-bold leading-[1.035] tracking-[-.045em] text-[#102452]`}>
              About <span className="whitespace-nowrap">
                <span className="text-[#FFD36E]">A</span><span className="text-[#FF7D82]">C</span><span className="text-[#69CEFF]">E</span>Lingua
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-[570px] text-[15px] leading-[1.85] text-[#536384] sm:text-[17px] lg:mx-0">

              ACELingua is a gamified language-learning platform that brings lessons, interactive practice, world exploration, and cultural discovery into one experience. Learners can progress through structured language courses while tracking achievements and personalizing their avatars.

            </p>

            <p className="mx-auto mt-5 max-w-[570px] text-[14px] leading-[1.85] text-[#536384] sm:text-[15px] lg:mx-0">

              Our aim is to make language learning approachable and engaging, with everyday conversation skills at the center of each journey.

            </p>

          </div>

          <div className="relative mx-auto flex w-full max-w-[560px] items-center justify-center py-10 lg:py-0" aria-label="Illustration of the ACELingua learning dashboard">

            <div aria-hidden="true" className="absolute inset-8 rounded-full bg-[radial-gradient(circle,rgba(133,216,250,.42)_0%,rgba(199,169,212,.16)_50%,transparent_75%)] blur-[28px]" />

            <AppPhonePreview />

          </div>

        </section>

        {/* OUR PURPOSE */}

        <section id="our-story" className="relative scroll-mt-24 px-5 py-20 sm:px-8 lg:px-14 lg:py-28">

          <div className="mx-auto grid max-w-[1240px] items-center gap-9 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">

            <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-[36px] border border-white/75 bg-white/35 p-8 shadow-[0_25px_65px_rgba(16,36,82,.06)] backdrop-blur-xl sm:min-h-[410px]">

              <div aria-hidden="true" className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[#85D8FA]/40 blur-3xl" />

              <div aria-hidden="true" className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-[#FF9297]/30 blur-3xl" />

              <div className="acel-about-float-slow relative flex flex-col items-center text-center">

                <div className="relative flex h-[165px] w-[165px] items-center justify-center rounded-full bg-white/80 shadow-[0_18px_50px_rgba(16,36,82,.09)] sm:h-[200px] sm:w-[200px]">

                  <Image src="/icon head.png" alt="Ace, the ACELingua mascot" width={185} height={185} sizes="(min-width: 640px) 185px, 155px" className="h-full w-full object-contain p-3" />

                  <span className="absolute -right-3 top-1 rounded-2xl bg-[#fff] px-3 py-1.5 text-xs font-black shadow-md">Hello, Explorer! 👋</span>

                </div>

                <p className="mt-7 text-sm font-black tracking-wide text-[#102452]">Your language-learning sidekick</p>

                <p className="mt-1 text-xs font-medium text-[#536384]">Meet Ace, your companion on the way.</p>

              </div>

              <Languages aria-hidden="true" className="absolute left-[13%] top-[14%] h-8 w-8 fill-[#FFD46E] text-[#E8AD4A]" />

              <Languages aria-hidden="true" className="absolute bottom-[17%] right-[12%] h-9 w-9 text-[#A48DE2]" />

            </div>

            <div>

              <SectionEyebrow>WHY WE CREATED ACELINGUA</SectionEyebrow>

              <h2 className="mt-4 text-[clamp(2.2rem,4.2vw,3.9rem)] font-black leading-[1.12] tracking-[-.045em]">Big dreams start with small conversations.</h2>

              <p className="mt-6 text-[15px] leading-[1.9] text-[#536384]">Our goal is to make language learning welcoming, accessible, and genuinely enjoyable. Instead of memorizing words alone, learners explore useful conversations and the cultures that give them meaning.</p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">

                <div className="rounded-[22px] border border-white/85 bg-white/60 p-5 shadow-[0_8px_22px_rgba(16,36,82,.04)] backdrop-blur-md">

                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5FF] text-[#3558AE]"><Heart size={20} /></div>

                  <h3 className="text-sm font-black">Our mission</h3>

                  <p className="mt-2 text-[12px] leading-6 text-[#536384]">Build confidence with meaningful, everyday language practice.</p>

                </div>

                <div className="rounded-[22px] border border-white/85 bg-white/60 p-5 shadow-[0_8px_22px_rgba(16,36,82,.04)] backdrop-blur-md">

                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1E8FF] text-[#8064B8]"><Globe2 size={20} /></div>

                  <h3 className="text-sm font-black">Our vision</h3>

                  <p className="mt-2 text-[12px] leading-6 text-[#536384]">Connect people to more cultures, places, and possibilities.</p>

                </div>

              </div>

              <p className="mt-6 text-xs font-semibold text-[#536384]/75">Platform: web-based language learning experience</p>

            </div>

          </div>

        </section>

        {/* HOW IT WORKS */}

        <section id="how-it-works" className="relative px-5 py-20 sm:px-8 lg:px-14 lg:py-28">

          <div className="mx-auto max-w-[1240px]">

            <div className="mx-auto max-w-[680px] text-center">

              <SectionEyebrow>THE LEARNING JOURNEY</SectionEyebrow>

              <h2 className="mt-4 text-[clamp(2.2rem,4.5vw,3.8rem)] font-black leading-[1.15] tracking-[-.045em]">Five steps</h2>

              <p className="mt-4 text-sm leading-7 text-[#536384] sm:text-base">A simple path from your first word to your next discovery.</p>

            </div>

            <div className="relative mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

              {flowSteps.map((step) => {

                const Icon = step.icon;

                return (

                  <Link href="/register" key={step.n} aria-label={`${step.title}: create an account to begin`} className="group relative block overflow-hidden rounded-[26px] border border-white/85 bg-white/65 p-6 shadow-[0_10px_35px_rgba(16,36,82,.055)] backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 hover:bg-white/85 hover:shadow-[0_22px_45px_rgba(16,36,82,.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85D8FA]">

                    <div className="flex items-center justify-between"><span className="text-[12px] font-black tracking-[.18em] text-[#536384]/55">{step.n}</span></div>

                    <div className="mt-7 flex h-14 w-14 items-center justify-center rounded-[18px] text-[#3558AE] transition-transform duration-300 group-hover:rotate-[-7deg] group-hover:scale-110" style={{ backgroundColor: step.tint }}><Icon size={25} strokeWidth={2} /></div>

                    <h3 className="mt-6 text-lg font-black">{step.title}</h3>

                    <p className="mt-3 min-h-[75px] text-[13px] leading-[1.8] text-[#536384]">{step.text}</p>

                    <div className="mt-5 flex items-center gap-2 text-[11px] font-bold text-[#3558AE]">Create an account <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" /></div>

                  </Link>

                );

              })}

            </div>

          </div>

        </section>

        {/* THE PRODUCT */}

        <section className="relative px-5 py-20 sm:px-8 lg:px-14 lg:py-28">

          <div className="mx-auto max-w-[1240px]">

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

              <div className="max-w-[720px]">

                <SectionEyebrow>THE ACELINGUA EXPERIENCE</SectionEyebrow>

                <h2 className="mt-4 text-[clamp(2.2rem,4.5vw,3.8rem)] font-black leading-[1.12] tracking-[-.045em]">More than lessons. A whole new world.</h2>

              </div>

            </div>

            <div className="mt-11 grid gap-5 sm:grid-cols-2">

              {featureCards.map((feature) => {

                const Icon = feature.icon;

                return (

                  <article key={feature.title} className="group relative min-h-[265px] overflow-hidden rounded-[30px] border border-white/80 bg-white/65 p-7 shadow-[0_14px_40px_rgba(16,36,82,.055)] backdrop-blur-lg transition-all duration-500 hover:-translate-y-1.5 hover:bg-white/90 hover:shadow-[0_25px_55px_rgba(16,36,82,.11)] sm:p-9">

                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full opacity-45 blur-2xl transition-transform duration-700 group-hover:scale-125" style={{ backgroundColor: feature.bg }} />

                    <div aria-hidden="true" className="absolute right-8 top-8 text-5xl font-black opacity-20" style={{ color: feature.color }}>{feature.deco}</div>

                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: feature.bg, color: feature.color }}><Icon size={27} strokeWidth={1.9} /></div>

                    <p className="relative mt-6 text-[10px] font-black tracking-[.19em]" style={{ color: feature.color }}>{feature.overline}</p>

                    <h3 className="relative mt-2 text-[22px] font-black tracking-tight">{feature.title}</h3>

                    <p className="relative mt-3 max-w-[410px] text-[13px] leading-7 text-[#536384] sm:text-sm">{feature.description}</p>

                  </article>

                );

              })}

            </div>

          </div>

        </section>

        {/* LANGUAGES — 3D flip-card gallery, fully self-contained */}
        <section id="languages" className="relative scroll-mt-24 px-4 py-20 sm:px-8 lg:px-14 lg:py-28">
          <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[38px] border border-white/85 bg-white/45 px-4 py-12 shadow-[0_18px_55px_rgba(16,36,82,.06)] backdrop-blur-xl sm:px-9 md:py-16 xl:px-12">
            <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-36 h-72 w-72 rounded-full bg-[#C9DFFF]/40 blur-[70px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-[#FFD9E8]/45 blur-[70px]" />
            <div className="relative mx-auto max-w-[690px] text-center">
              <SectionEyebrow>HELLO, WORLD</SectionEyebrow>
              <h2 className={`${fredoka.className} mt-4 text-[clamp(2.2rem,4.5vw,3.8rem)] font-bold leading-[1.12] tracking-[-.045em] text-[#102452]`}>
                So many ways to say <span className="text-[#E7768F]">hello.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#536384] sm:text-base">
                Meet the languages of ACELingua. Flip a card to see how people greet one another around the world.
              </p>
              <p className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-white/90 bg-white/70 px-4 py-2 text-[11px] font-extrabold tracking-wide text-[#526589] shadow-sm">
                <span aria-hidden="true"></span> Hover on desktop · Tap on mobile <span aria-hidden="true"></span>
              </p>
            </div>

            <div className="relative mt-12 grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 2xl:grid-cols-7">
              {languages.map((language, index) => (
                <LanguageFlipCard key={language.code} language={language} index={index} />
              ))}
            </div>

            <div className="relative mt-10 text-center">
              <Link href="/languages" className="group inline-flex items-center gap-2 rounded-full border border-[#102452]/10 bg-white/80 px-5 py-3 text-[12px] font-extrabold text-[#102452] shadow-[0_8px_24px_rgba(16,36,82,.06)] transition hover:-translate-y-0.5 hover:border-[#85D8FA] hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85D8FA]/60">
                Explore all languages <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/65 bg-white/25 px-5 py-8 backdrop-blur-md sm:px-8 lg:px-14">

          <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-5 sm:flex-row">

            <Link href="/" aria-label="ACELingua home"><Logo alt="ACELingua" className="h-auto w-[150px] object-contain" /></Link>

            <p className="text-center text-[11px] font-medium text-[#536384]">© 2026 ACELingua · Learn languages. Explore the world.</p>

            <div className="flex items-center gap-5 text-[12px] font-bold text-[#536384]"><Link href="/" className="transition hover:text-[#3558AE]">Home</Link><Link href="/languages" className="transition hover:text-[#3558AE]">Languages</Link><Link href="/login" className="transition hover:text-[#3558AE]">Log in</Link></div>

          </div>

        </footer>

      </div>

      <style jsx global>{`

        .acel-about { background: linear-gradient(124deg,#f9f2ff 0%,#e6f7ff 29%,#eeeafd 61%,#fff0e9 100%); background-size: 220% 220%; animation: acel-about-background 24s ease-in-out infinite alternate; }

        .acel-about-dot-pattern { background-image: radial-gradient(rgba(87,105,168,.13) 1px, transparent 1px); background-size: 26px 26px; mask-image: linear-gradient(to bottom,transparent,black 12%,black 80%,transparent); }

        .acel-about-reveal { animation: acel-about-rise .8s both cubic-bezier(.2,.8,.2,1); }

        .acel-about-float-slow { animation: acel-about-bob 8s -1s ease-in-out infinite; }

        .acel-about-aurora-one { animation: acel-about-drift 16s ease-in-out infinite alternate; }

        .acel-about-aurora-two { animation: acel-about-drift 21s -7s ease-in-out infinite alternate-reverse; }

        .acel-about-aurora-three { animation: acel-about-drift 18s -5s ease-in-out infinite alternate; }

        .acel-about-cloud-one { animation: acel-about-bob 10s ease-in-out infinite; }

        .acel-about-cloud-two { animation: acel-about-bob 13s -4s ease-in-out infinite alternate-reverse; }

        .acel-about-cloud-three { animation: acel-about-bob 11s -2s ease-in-out infinite; }

        @keyframes acel-about-background { from { background-position: 0% 30%; } to { background-position: 100% 70%; } }

        @keyframes acel-about-rise { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        @keyframes acel-about-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-13px); } }

        @keyframes acel-about-drift { from { transform:translate3d(-16px,10px,0) scale(1); } to { transform:translate3d(24px,-18px,0) scale(1.08); } }

        /* Language cards — no external CSS or image assets required. */
        .acel-flip-card { perspective: 1200px; -webkit-perspective: 1200px; isolation: isolate; }
        .acel-flip-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; -webkit-transform-style: preserve-3d; transition: transform .72s cubic-bezier(.22, .78, .2, 1); }
        @media (hover: hover) and (pointer: fine) {
          .acel-flip-card:hover .acel-flip-inner { transform: rotateY(180deg); }
        }
        .acel-flip-card[data-flipped="true"] .acel-flip-inner { transform: rotateY(180deg); }
        .acel-flip-face { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; border-radius: 24px; -webkit-backface-visibility: hidden; backface-visibility: hidden; border: 1px solid rgba(255,255,255,.85); box-shadow: 0 10px 26px rgba(16,36,82,.09), inset 0 1px 0 rgba(255,255,255,.8); }
        .acel-flip-card:hover .acel-flip-face, .acel-flip-card[data-flipped="true"] .acel-flip-face { box-shadow: 0 18px 42px rgba(16,36,82,.17), inset 0 1px 0 rgba(255,255,255,.65); }
        .acel-flip-back { transform: rotateY(180deg); }
        .acel-flip-shine { pointer-events: none; position: absolute; inset: 0; background: linear-gradient(118deg, rgba(255,255,255,.5), rgba(255,255,255,0) 45%, rgba(255,255,255,.13) 78%, rgba(255,255,255,0)); }
        .acel-flag { display: block; width: 100%; height: 100%; }
        @media(prefers-reduced-motion:reduce) { .acel-about,.acel-about-reveal,.acel-about-float-slow,.acel-about-aurora-one,.acel-about-aurora-two,.acel-about-aurora-three,.acel-about-cloud-one,.acel-about-cloud-two,.acel-about-cloud-three { animation:none!important; } .acel-flip-inner { transition:none!important; } .acel-about * { scroll-behavior:auto!important; } }

      `}</style>

    </main>

  );

}

/** Interactive flip card: mouse hover, keyboard activation, or touch. */
function LanguageFlipCard({ language, index }: { language: LanguageItem; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      className="acel-flip-card group relative block h-[252px] w-full min-w-0 cursor-pointer rounded-[24px] text-center outline-none focus-visible:ring-4 focus-visible:ring-[#85D8FA] sm:h-[274px] 2xl:h-[260px]"
      data-flipped={flipped}
      aria-pressed={flipped}
      aria-label={`${language.name} (${language.native}). ${language.greeting}, pronounced ${language.hello}, means hello. Press to flip the card.`}
      onClick={() => setFlipped((current) => !current)}
    >
      <span className="acel-flip-inner block">
        {/* FRONT — country flag and native language name */}
        <span className="acel-flip-face px-2 py-5 text-[#102452]" style={{ background: language.front }} aria-hidden="true">
          <span className="acel-flip-shine" />
          <span className="absolute left-4 top-4 text-[10px] font-black tracking-[.1em] opacity-50" style={{ color: language.accent }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="absolute right-4 top-3 text-xl opacity-45" style={{ color: language.accent }}></span>
          <span className="relative mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-full border border-white/90 bg-white/75 p-[15px] shadow-[0_10px_25px_rgba(16,36,82,.10)] transition-transform duration-500 group-hover:scale-105 2xl:h-[78px] 2xl:w-[78px]" style={{ boxShadow: `0 10px 28px ${language.accent}23` }}>
            <span className="block h-9 w-[55px] overflow-hidden rounded-[5px] bg-white shadow-[0_2px_9px_rgba(16,36,82,.20)] ring-1 ring-black/5">
              <CountryFlag code={language.code} />
            </span>
          </span>
          <span className="relative block text-[16px] font-black leading-tight tracking-tight sm:text-[18px] 2xl:text-[16px]">{language.name}</span>
          <span className="relative mt-1.5 block text-[17px] font-bold leading-normal sm:text-[19px]" style={{ color: language.accent }} lang={language.code === "jp" ? "ja" : language.code === "kr" ? "ko" : language.code === "cn" ? "zh" : language.code === "th" ? "th" : language.code === "es" ? "es" : language.code === "de" ? "de" : "fr"}>{language.native}</span>
          <span className="relative mt-5 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#536384]/80 sm:text-[10px]">
            Flip to say hello <span aria-hidden="true" className="text-[15px]">↻</span>
          </span>
        </span>

        {/* BACK — greeting, its romanization, and meaning */}
        <span className="acel-flip-face acel-flip-back px-3 py-6 text-white" style={{ background: language.back }} aria-hidden="true">
          <span className="acel-flip-shine opacity-35" />
          <span className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[20px] border-white/10" />
          <span className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full border-[20px] border-white/10" />
          <span className="relative mb-4 flex h-[47px] w-[66px] items-center justify-center overflow-hidden rounded-[7px] border-[3px] border-white/70 bg-white shadow-[0_6px_16px_rgba(16,36,82,.15)]">
            <CountryFlag code={language.code} />
          </span>
          <span className="relative text-[9px] font-black uppercase tracking-[.22em] text-white/90">How to say hello</span>
          <span className="relative mt-3 block max-w-full break-words text-[clamp(1.3rem,2.3vw,1.8rem)] font-black leading-[1.18]" lang={language.code === "jp" ? "ja" : language.code === "kr" ? "ko" : language.code === "cn" ? "zh" : language.code === "th" ? "th" : language.code === "es" ? "es" : language.code === "de" ? "de" : "fr"}>
            {language.greeting}
          </span>
          <span className="relative mt-2 block max-w-full break-words text-[11px] font-bold leading-snug text-white/95 sm:text-[13px] 2xl:text-[11px]">{language.hello}</span>
          <span className="relative mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/20 px-3 py-1 text-[11px] font-bold text-white">Hello!</span>
          <span className="relative mt-3 text-[9px] font-semibold text-white/80">Tap to flip back ↻</span>
        </span>
      </span>
    </button>
  );
}

/** Vector flag graphics; independent of emoji/font rendering and external image hosts. */
function CountryFlag({ code }: { code: LanguageCode }) {
  const common = { className: "acel-flag", viewBox: "0 0 60 40", role: "img" as const, "aria-label": `${code.toUpperCase()} country flag`, xmlns: "http://www.w3.org/2000/svg" };
  switch (code) {
    case "jp":
      return <svg {...common}><rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="12" fill="#BC002D"/></svg>;
    case "kr":
      return (
        <svg {...common}>
          <rect width="60" height="40" fill="#fff"/>
          <g transform="translate(30 20) rotate(33.7)">
            <path d="M-10 0a10 10 0 0 1 20 0 5 5 0 0 1-10 0 5 5 0 0 0-10 0" fill="#CD2E3A"/>
            <path d="M10 0a10 10 0 0 1-20 0 5 5 0 0 1 10 0 5 5 0 0 0 10 0" fill="#0047A0"/>
          </g>
          <g stroke="#111" strokeWidth="2" strokeLinecap="butt">
            <g transform="translate(13 9) rotate(-33.7)"><path d="M-5 -3H5M-5 0H5M-5 3H5"/></g>
            <g transform="translate(47 31) rotate(-33.7)"><path d="M-5 -3H-1M1 -3H5M-5 0H-1M1 0H5M-5 3H-1M1 3H5"/></g>
            <g transform="translate(47 9) rotate(33.7)"><path d="M-5 -3H-1M1 -3H5M-5 0H5M-5 3H-1M1 3H5"/></g>
            <g transform="translate(13 31) rotate(33.7)"><path d="M-5 -3H5M-5 0H-1M1 0H5M-5 3H5"/></g>
          </g>
        </svg>
      );
    case "cn":
      return (
        <svg {...common}>
          <rect width="60" height="40" fill="#DE2910"/>
          <polygon points="12,4 13.7,9.1 19,9.1 14.7,12.2 16.3,17.3 12,14.2 7.7,17.3 9.3,12.2 5,9.1 10.3,9.1" fill="#FFDE00"/>
          <g fill="#FFDE00">
            <polygon points="24,3 24.8,5 27,5.1 25.3,6.5 25.9,8.6 24,7.4 22.1,8.6 22.7,6.5 21,5.1 23.2,5"/>
            <polygon points="29,9 29.7,11 31.9,11 30.2,12.4 30.8,14.5 29,13.3 27.2,14.5 27.8,12.4 26.1,11 28.3,11"/>
            <polygon points="29,17 29.7,19 31.9,19 30.2,20.4 30.8,22.5 29,21.3 27.2,22.5 27.8,20.4 26.1,19 28.3,19"/>
            <polygon points="24,23 24.8,25 27,25.1 25.3,26.5 25.9,28.6 24,27.4 22.1,28.6 22.7,26.5 21,25.1 23.2,25"/>
          </g>
        </svg>
      );
    case "es":
      return (
        <svg {...common}>
          <rect width="60" height="40" fill="#AA151B"/>
          <rect y="10" width="60" height="20" fill="#F1BF00"/>
          <g transform="translate(18 20)">
            <path d="M-5 -8h10v12c0 4-3.5 6-5 6s-5-2-5-6z" fill="#fff" stroke="#B48723" strokeWidth=".9"/>
            <path d="M-4 -7H0V0H-4z" fill="#CE2636"/><path d="M0 -7H4V0H0z" fill="#F6D55A"/>
            <path d="M-4 0H0V7H-4z" fill="#F6D55A"/><path d="M0 0H4V7H0z" fill="#CE2636"/>
            <path d="M-6 -9q6-7 12 0" fill="none" stroke="#C89532" strokeWidth="2"/>
          </g>
        </svg>
      );
    case "de":
      return <svg {...common}><rect width="60" height="40" fill="#FFCE00"/><rect width="60" height="26.67" fill="#DD0000"/><rect width="60" height="13.33" fill="#000"/></svg>;
    case "th":
      return <svg {...common}><rect width="60" height="40" fill="#A51931"/><rect y="7" width="60" height="26" fill="#fff"/><rect y="13" width="60" height="14" fill="#2D2A4A"/></svg>;
    case "fr":
      return <svg {...common}><rect width="60" height="40" fill="#ED2939"/><rect width="40" height="40" fill="#fff"/><rect width="20" height="40" fill="#002395"/></svg>;
  }
}

function AboutHeader() {

  return (

    <header className="relative z-40 w-full border-b border-white/35 bg-white/10 backdrop-blur-[10px]">

      <div className="mx-auto flex min-h-[88px] w-full max-w-[1380px] flex-wrap items-center justify-between gap-x-5 gap-y-3 px-5 py-3 sm:px-8 lg:px-14">

        <Link href="/" className="flex shrink-0 items-center" aria-label="ACELingua home"><Logo alt="ACELingua" priority className="h-auto w-[165px] object-contain sm:w-[200px]" /></Link>

        <nav aria-label="Public navigation" className="order-3 flex w-full items-center justify-center gap-3 text-[12px] font-bold text-[#536384] sm:order-none sm:w-auto sm:gap-7 sm:text-sm">

        </nav>

        <Link href="/login" className="group relative isolate inline-flex h-11 shrink-0 items-center justify-center rounded-[14px] bg-[#102452] px-5 text-[13px] font-black text-white shadow-[0_8px_20px_rgba(16,36,82,.17)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3558AE] hover:shadow-[0_12px_26px_rgba(53,88,174,.25)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85D8FA]/60">Log In <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" /></Link>

      </div>

    </header>

  );

}

function AboutAtmosphere() {

  return (

    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">

      <div className="acel-about-dot-pattern absolute inset-0 opacity-55" />

      <div className="acel-about-aurora-one absolute -left-44 top-10 h-[600px] w-[600px] rounded-full bg-[#CDB8FF]/30 blur-[85px]" />

      <div className="acel-about-aurora-two absolute -right-40 top-32 h-[580px] w-[580px] rounded-full bg-[#78D6FF]/36 blur-[85px]" />

      <div className="acel-about-aurora-three absolute left-[29%] top-[670px] h-[520px] w-[560px] rounded-full bg-[#FFC3CD]/27 blur-[95px]" />

      <Cloud className="acel-about-cloud-one absolute left-[5%] top-[4%] h-16 w-20 text-[#fff]/50 sm:h-20 sm:w-28" strokeWidth={1.25} />

      <Cloud className="acel-about-cloud-two absolute right-[8%] top-[9%] h-16 w-24 text-[#69ceff]/50 sm:h-24 sm:w-32" strokeWidth={1.25} />

      <Cloud className="acel-about-cloud-three absolute left-[6%] top-[36%] h-16 w-24 text-white/55" strokeWidth={1.25} />

      <Cloud className="acel-about-cloud-two absolute right-[5%] top-[63%] h-20 w-28 text-white/60" strokeWidth={1.25} />

      <Cloud className="absolute left-[17%] top-[12%] h-6 w-6 fill-[#fff]/50 text-[#69ceff]/50" />

    </div>

  );

}

function SectionEyebrow({ children }: { children: ReactNode }) {

  return <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[.2em] text-[#3558AE]"><BookOpen size={13} className="text-[#00008B]" /> {children}</p>;

}

function AppPhonePreview() {

  return (

    <div className="acel-about-float-slow relative z-10 w-[265px] rounded-[43px] bg-[#142044] p-[8px] shadow-[0_35px_85px_rgba(16,36,82,.22)] sm:w-[310px]">

      <div className="absolute -left-[3px] top-[95px] h-10 w-[4px] rounded-l-lg bg-[#142044]" /><div className="absolute -right-[3px] top-[145px] h-16 w-[4px] rounded-r-lg bg-[#142044]" />

      <div className="relative overflow-hidden rounded-[36px] bg-[#FBFCFF]">

        <div className="relative flex h-10 items-center justify-between px-6 pt-2 text-[9px] font-black text-[#102452]"><span>9:41</span><div className="absolute left-1/2 top-[8px] h-[21px] w-[77px] -translate-x-1/2 rounded-full bg-[#142044]" /><span>● ◕</span></div>

        <div className="px-5 pb-5 pt-3">

          <div className="flex items-start justify-between"><div><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#102452] text-white"><Languages size={18} /></div><p className="mt-3 text-[10px] font-bold text-[#7986A2]">Good morning, explorer!</p><h3 className="mt-1 text-[19px] font-black leading-[1.1] tracking-tight text-[#102452]">Let's learn<br/>together!</h3></div><div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#E9EDFF]"><Image src="/icon head.png" alt="" width={32} height={32} className="h-full w-full object-contain" /></div></div>

          <div className="mt-5 rounded-[19px] bg-[#E8F2FF] p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-2"><span className="block h-[22px] w-8 overflow-hidden rounded-sm shadow-sm"><CountryFlag code="jp" /></span></span><div className="min-w-0 flex-1"><p className="text-[11px] font-black text-[#102452]">Continue Japanese</p><p className="mt-1 text-[8px] font-medium text-[#536384]">Greetings & Basics</p></div><span className="rounded-full bg-white px-2 py-1 text-[8px] font-bold text-[#3558AE]">5/10</span></div><div className="mt-4 h-[6px] overflow-hidden rounded-full bg-white"><div className="h-full w-[55%] rounded-full bg-gradient-to-r from-[#85D8FA] to-[#3558AE]" /></div></div>

          <div className="mt-5 flex items-center justify-between"><p className="text-[11px] font-black">Explore languages</p><span className="text-[8px] font-bold text-[#3558AE]">See all →</span></div><div className="mt-3 grid grid-cols-4 gap-2">{languages.slice(0,4).map(l=><div key={l.name} className="rounded-xl bg-[#F0F4FA] px-1 py-2 text-center"><span className="mx-auto block h-[15px] w-[23px] overflow-hidden rounded-[2px] shadow-sm"><CountryFlag code={l.code} /></span><p className="mt-1 text-[7px] font-bold text-[#536384]">{l.name}</p></div>)}</div>

          <p className="mt-5 text-[11px] font-black">Today's lesson</p><div className="mt-3 flex items-center gap-3 rounded-[17px] border border-[#E9EEFA] bg-white p-2.5"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EFFF] text-[#8064B8]"><BookOpen size={19} /></div><div className="min-w-0 flex-1"><p className="text-[9px] font-black">Say hello!</p><p className="mt-1 text-[8px] text-[#8C97AC]">Vocabulary & greetings</p></div><ChevronRight size={14} className="text-[#3558AE]" /></div>

          <div className="mt-5 flex items-center justify-around border-t border-[#E8EDF5] pt-4"><PhoneTab icon={<Globe2 size={16}/>} label="World"/><PhoneTab icon={<BookOpen size={16}/>} label="Learn" active/><PhoneTab icon={<Flame size={16}/>} label="Streak"/><PhoneTab icon={<UserRound size={16}/>} label="Avatar"/></div>

        </div>

      </div>

    </div>

  );

}

function PhoneTab({ icon, label, active=false }: {icon: ReactNode; label: string; active?: boolean}) {

  return <div className={`flex flex-col items-center gap-1 ${active ? "text-[#3558AE]" : "text-[#A2AABD]"}`}>{icon}<span className="text-[7px] font-bold">{label}</span></div>;

}

// Keep the same Ace assistant functionality and styling as the landing page.*

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
