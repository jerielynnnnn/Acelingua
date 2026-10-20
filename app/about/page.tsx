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
  Rocket, Send, Star, Trophy, UserRound, X as CloseIcon,
} from "lucide-react";

// These languages mirror the destinations showcased on ACELingua's home page.
const languages = [
  { name: "Japanese", native: "日本語", flag: "🇯🇵", hello: "Konnichiwa", tint: "#FCE7EA" },
  { name: "Korean", native: "한국어", flag: "🇰🇷", hello: "Annyeonghaseyo", tint: "#E9EEFF" },
  { name: "Mandarin", native: "中文", flag: "🇨🇳", hello: "Nǐ hǎo", tint: "#FFEDD7" },
  { name: "Spanish", native: "Español", flag: "🇪🇸", hello: "Hola", tint: "#FFF2CD" },
  { name: "German", native: "Deutsch", flag: "🇩🇪", hello: "Hallo", tint: "#EDE8FC" },
  { name: "Thai", native: "ไทย", flag: "🇹🇭", hello: "Sawasdee", tint: "#E6F7F1" },
  { name: "French", native: "Français", flag: "🇫🇷", hello: "Bonjour", tint: "#E6F3FF" },
] as const;

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
    bg: "#EAF4FF", color: "#3558AE", deco: "✦",
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
            
  <h1 className="text-[clamp(3rem,5.8vw,5.7rem)] font-black leading-[1.035] tracking-[-.055em] text-[#102452]">
  About{" "}
  </h1>
  <h1
  className={`${fredoka.className} text-[clamp(3rem,5.8vw,5.7rem)] font-bold leading-[1.035] tracking-[-.045em] text-[#102452]`}
>{" "}
  <span className="text-[#FFD36E]">A</span>
  <span className="text-[#FF7D82]">C</span>
  <span className="text-[#69CEFF]">E</span>
  Lingua
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

        {/* LANGUAGES — aligned to landing gallery */}
        <section className="relative px-5 py-20 sm:px-8 lg:px-14 lg:py-28">
          <div className="mx-auto max-w-[1240px] rounded-[38px] border border-white/85 bg-white/40 px-5 py-12 shadow-[0_18px_55px_rgba(16,36,82,.06)] backdrop-blur-xl sm:px-10 lg:px-14 lg:py-16">
            <div className="mx-auto max-w-[670px] text-center">
              <SectionEyebrow>HELLO, WORLD</SectionEyebrow>
              <h2 className="mt-4 text-[clamp(2.2rem,4.5vw,3.8rem)] font-black tracking-[-.045em]">So many ways to say hello.</h2>
              <p className="mt-4 text-sm leading-7 text-[#536384]">Explore the languages and cultures featured on our journey.</p>
            </div>
            <div className="mt-11 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {languages.map((language) => (
                <div key={language.name} className="group flex flex-col items-center rounded-[23px] border border-white/90 bg-white/70 px-3 py-5 text-center shadow-[0_8px_24px_rgba(16,36,82,.05)] transition-all duration-300 hover:-translate-y-2 hover:bg-white hover:shadow-[0_18px_35px_rgba(16,36,82,.12)]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/80 text-[34px] shadow-[0_5px_18px_rgba(16,36,82,.07)]" style={{ backgroundColor: language.tint }}><span role="img" aria-label={`${language.name} flag`}>{language.flag}</span></div>
                  <h3 className="mt-4 text-[13px] font-black">{language.name}</h3>
                  <p className="mt-1 text-[10px] font-semibold text-[#536384]">{language.native}</p>
                  <p className="mt-3 text-[10px] font-bold text-[#3558AE]">{language.hello}</p>
                </div>
              ))}
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
        @media(prefers-reduced-motion:reduce) { .acel-about,.acel-about-reveal,.acel-about-float-slow,.acel-about-aurora-one,.acel-about-aurora-two,.acel-about-aurora-three,.acel-about-cloud-one,.acel-about-cloud-two,.acel-about-cloud-three { animation:none!important; } .acel-about * { scroll-behavior:auto!important; } }
      `}</style>
    </main>
  );
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
          <div className="mt-5 rounded-[19px] bg-[#E8F2FF] p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[24px]">🇯🇵</span><div className="min-w-0 flex-1"><p className="text-[11px] font-black text-[#102452]">Continue Japanese</p><p className="mt-1 text-[8px] font-medium text-[#536384]">Greetings & Basics</p></div><span className="rounded-full bg-white px-2 py-1 text-[8px] font-bold text-[#3558AE]">5/10</span></div><div className="mt-4 h-[6px] overflow-hidden rounded-full bg-white"><div className="h-full w-[55%] rounded-full bg-gradient-to-r from-[#85D8FA] to-[#3558AE]" /></div></div>
          <div className="mt-5 flex items-center justify-between"><p className="text-[11px] font-black">Explore languages</p><span className="text-[8px] font-bold text-[#3558AE]">See all →</span></div><div className="mt-3 grid grid-cols-4 gap-2">{languages.slice(0,4).map(l=><div key={l.name} className="rounded-xl bg-[#F0F4FA] px-1 py-2 text-center"><span className="text-xl">{l.flag}</span><p className="mt-1 text-[7px] font-bold text-[#536384]">{l.name}</p></div>)}</div>
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

// Keep the same Ace assistant functionality and styling as the landing page.
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