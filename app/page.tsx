"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Play,
  Send,
  X as CloseIcon,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

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
   CHATBOT TYPES
========================================================= */

type ChatMessage = {
  id: number;
  sender: "user" | "bot";
  text: string;
};

/* =========================================================
   CHATBOT QUESTIONS
========================================================= */

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
      "Click Get Started, create your account, choose a language, and ACELingua will guide you through your learning journey.",
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
          SOCIAL MEDIA SIDEBAR
      =================================================== */}

      <SocialSidebar />

      {/* ===================================================
          FLOATING ACE CHATBOT
      =================================================== */}

      <FloatingChatbot />

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
                alt="Ace ACELingua mascot"
                width={220}
                height={220}
                priority
                quality={100}
                className="h-[170px] w-[170px] object-contain drop-shadow-[0_18px_16px_rgba(7,26,74,0.18)]"
              />
            </div>

            {/* ===============================================
                SPANISH BUBBLE
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
                =============================================== */}

            <div className="absolute bottom-[35px] right-[30px] z-30 sm:right-[75px]">
              <div className="relative rounded-2xl border border-[#3558AE]/15 bg-white px-4 py-2.5 shadow-[0_5px_18px_rgba(7,26,74,0.08)]">
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#071A4A]">
            <span className="mr-1.5 text-[10px] font-extrabold text-[#3558AE]">
              JP
            </span>
              こんにちは
            </p>
            </div>

            <p className="mt-0.5 text-[9px] font-medium text-[#071A4A]/45">
              Kon · ni · chi · wa
            </p>

    <div className="absolute -top-1.5 left-5 h-3 w-3 rotate-45 border-l border-t border-[#3558AE]/15 bg-white" />
      </div>
    </div>

            {/* ===============================================
                KOREAN BUBBLE
            =============================================== */}

            <div className="absolute bottom-[50px] left-[25px] z-30 sm:left-[65px]">
              <div className="relative rounded-2xl border border-[#3558AE]/15 bg-white px-4 py-2.5 shadow-[0_5px_18px_rgba(7,26,74,0.08)]">
                <p className="text-xs font-semibold text-[#071A4A]">
                  <span className="mr-1.5 text-[10px] font-extrabold text-[#3558AE]">
                    KR
                  </span>

                  안녕하세요
                  
                </p>

                <p className="mt-0.5 text-[9px] font-medium text-[#071A4A]/45">
                  An · nyeong · ha · se · yo
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
            {/* GET STARTED */}

            <Link
              href="/register"
              className="group inline-flex min-w-[145px] items-center justify-center gap-2 rounded-full bg-[#071A4A] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#3558AE]"
            >
              Get Started

              <span className="transition group-hover:translate-x-1">
                ›
              </span>
            </Link>

            {/* HOW IT WORKS */}

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
                href="/register"
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
            href="/languages"
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

/* =========================================================
   FLOATING ACE CHATBOT
========================================================= */

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

  /* =======================================================
     AUTO SCROLL
  ======================================================= */

  useEffect(() => {
    if (!open) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping, open]);

  /* =======================================================
     AUTO ANSWER
  ======================================================= */

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

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

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
      {/* =====================================================
          CHAT WINDOW
      ====================================================== */}

      <div
        className={`
          fixed
          bottom-[105px]
          right-4
          z-[80]
          w-[calc(100%-32px)]
          max-w-[365px]
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
        {/* =================================================
            CHAT HEADER
        ================================================== */}

        <div className="flex items-center justify-between bg-[#071A4A] px-5 py-4">
          <div className="flex items-center gap-3">
            {/* ACE AVATAR */}

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

              <p className="text-[10px] text-white/60">
                ACELingua Assistant
              </p>
            </div>
          </div>

          {/* CLOSE */}

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chatbot"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-all duration-200 hover:rotate-90 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* =================================================
            MESSAGES
        ================================================== */}

        <div className="max-h-[300px] min-h-[260px] space-y-4 overflow-y-auto bg-[#F8FBFF] px-4 py-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {/* ACE ICON */}

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

              {/* MESSAGE BUBBLE */}

              <div
                className={`
                  max-w-[78%]
                  px-4
                  py-3
                  text-left
                  text-[12px]
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

          {/* =================================================
              TYPING INDICATOR
          ================================================== */}

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

        {/* =================================================
            QUICK QUESTIONS
        ================================================== */}

        <div className="border-t border-[#071A4A]/5 bg-white px-4 py-3">
          <p className="mb-2 text-left text-[9px] font-bold uppercase tracking-[0.15em] text-[#071A4A]/35">
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
                  text-[10px]
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

        {/* =================================================
            INPUT
        ================================================== */}

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
              text-[12px]
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

      {/* =====================================================
          FLOATING CHATBOT BUTTON
      ====================================================== */}

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
          h-[68px]
          w-[68px]
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
        {/* PULSE */}

        {!open && (
          <span className="absolute inset-0 animate-ping rounded-full border border-[#3558AE]/20" />
        )}

        {/* ACE LOGO */}

        <div
          className={`
            relative
            z-10
            flex
            h-[57px]
            w-[57px]
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

        {/* CLOSE ICON */}

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

        {/* ONLINE DOT */}

        {!open && (
          <span className="absolute bottom-[5px] right-[4px] z-20 h-4 w-4 rounded-full border-[3px] border-white bg-[#56D88A]" />
        )}
      </button>
    </>
  );
}

/* =========================================================
   SOCIAL MEDIA SIDEBAR
========================================================= */

function SocialSidebar() {
  return (
    <aside
      className="
        fixed
        right-0
        top-1/2
        z-[60]
        hidden
        -translate-y-1/2
        flex-col
        gap-2
        lg:flex
      "
    >
      {/* FACEBOOK */}

      <SocialLink
        href="#"
        label="Facebook"
        icon={<FacebookLogo />}
      />

      {/* INSTAGRAM */}

      <SocialLink
        href="#"
        label="Instagram"
        icon={<InstagramLogo />}
      />

      {/* X */}

      <SocialLink
        href="#"
        label="X"
        icon={<XLogo />}
      />
    </aside>
  );
}

/* =========================================================
   SOCIAL MEDIA LINK
========================================================= */

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target={href === "#" ? undefined : "_blank"}
      rel={href === "#" ? undefined : "noopener noreferrer"}
      onClick={(event) => {
        /*
         * Prevent the page from jumping to the top while
         * you have not added the real social links yet.
         */

        if (href === "#") {
          event.preventDefault();
        }
      }}
      className="
        group
        flex
        h-12
        w-12
        items-center
        overflow-hidden
        rounded-l-2xl
        border
        border-r-0
        border-[#3558AE]/10
        bg-white
        text-[#071A4A]
        shadow-[0_7px_25px_rgba(7,26,74,0.08)]

        transition-all
        duration-300
        ease-out

        hover:w-[140px]
        hover:-translate-x-1
        hover:border-[#3558AE]/20
        hover:bg-[#071A4A]
        hover:text-white
        hover:shadow-[0_12px_30px_rgba(7,26,74,0.18)]
      "
    >
      {/* ICON */}

      <div
        className="
          flex
          h-12
          w-12
          shrink-0
          items-center
          justify-center

          transition-all
          duration-300

          group-hover:scale-110
        "
      >
        {icon}
      </div>

      {/* SOCIAL NAME */}

      <span
        className="
          -translate-x-2
          whitespace-nowrap
          pr-5
          text-xs
          font-semibold
          opacity-0

          transition-all
          delay-75
          duration-300

          group-hover:translate-x-0
          group-hover:opacity-100
        "
      >
        {label}
      </span>
    </a>
  );
}

/* =========================================================
   FACEBOOK LOGO
========================================================= */

function FacebookLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[19px] w-[19px]"
      fill="currentColor"
    >
      <path d="M13.5 22V13.2H16.5L16.95 9.75H13.5V7.55C13.5 6.55 13.78 5.87 15.23 5.87H17.08V2.79C16.76 2.75 15.66 2.65 14.38 2.65C11.71 2.65 9.88 4.28 9.88 7.28V9.75H6.86V13.2H9.88V22H13.5Z" />
    </svg>
  );
}

/* =========================================================
   INSTAGRAM LOGO
========================================================= */

function InstagramLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[19px] w-[19px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        ry="5"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
      />

      <circle
        cx="17.5"
        cy="6.5"
        r="1"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

/* =========================================================
   X LOGO
========================================================= */

function XLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[17px] w-[17px]"
      fill="currentColor"
    >
      <path d="M18.244 2H21.552L14.325 10.26L22.827 22H16.17L10.956 15.183L4.99 22H1.68L9.414 13.165L1.254 2H8.08L12.793 8.231L18.244 2ZM17.083 19.932H18.916L7.084 3.96H5.117L17.083 19.932Z" />
    </svg>
  );
}