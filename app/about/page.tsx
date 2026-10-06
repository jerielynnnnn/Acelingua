"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  ArrowRight,
  Bell,
  BookOpen,
  ChevronRight,
  Globe2,
  Home,
  Languages,
  Send,
  Trophy,
  UserRound,
  X as CloseIcon,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type FlagCode = "JP" | "KR" | "ES" | "FR";

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
      "ACELingua is an interactive language-learning platform where learners can study languages, complete lessons, explore cultures, earn rewards, and customize their avatar.",
  },
  {
    question: "What languages can I learn?",
    answer:
      "ACELingua currently features Japanese, Korean, Spanish, and French. More languages can be added as the platform grows.",
  },
  {
    question: "How do lessons work?",
    answer:
      "Lessons are organized from beginner to more advanced levels. You can learn vocabulary, useful phrases, grammar, and practical conversations step by step.",
  },
  {
    question: "How do I start learning?",
    answer:
      "Create an account, choose the language you want to learn, and ACELingua will guide you to your first lesson.",
  },
  {
    question: "What are XP and coins?",
    answer:
      "You earn XP by completing lessons and activities. Coins can be used for rewards and avatar customization in ACELingua.",
  },
  {
    question: "Can I customize my avatar?",
    answer:
      "Yes! You can customize your avatar using different outfits, hairstyles, accessories, and other unlockable items.",
  },
];

/* =========================================================
   ABOUT PAGE
========================================================= */

export default function AboutPage() {
  const flowSteps = [
    {
      number: "01",
      title: "Create Account",
      description: "Sign up and create your ACELingua learning profile.",
      href: "/register",
    },
    {
      number: "02",
      title: "Choose Language",
      description: "Select the language you want to start learning.",
      href: "/register",
    },
    {
      number: "03",
      title: "Learn",
      description: "Complete lessons and practice real conversations.",
      href: "/register",
    },
    {
      number: "04",
      title: "Explore",
      description: "Discover destinations, culture, and language trivia.",
      href: "/register",
    },
    {
      number: "05",
      title: "Earn Rewards",
      description: "Gain XP, coins, achievements, and avatar items.",
      href: "/register",
    },
  ];

  const languages: {
    code: FlagCode;
    language: string;
  }[] = [
    {
      code: "JP",
      language: "Japanese",
    },
    {
      code: "KR",
      language: "Korean",
    },
    {
      code: "ES",
      language: "Spanish",
    },
    {
      code: "FR",
      language: "French",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fcfcfd] text-[#111111]">
      {/* =====================================================
          SOCIAL SIDEBAR
      ====================================================== */}

      <SocialSidebar />

      {/* =====================================================
          ACE CHATBOT
      ====================================================== */}

      <FloatingChatbot />

      {/* =====================================================
          HERO / ABOUT
      ====================================================== */}

      <section className="min-h-screen">
        <div className="mx-auto w-full max-w-[1280px] px-6 pb-20 pt-8 md:px-10 lg:px-12">
          {/* HEADER */}

          <header className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo.png"
                alt="ACELingua"
                width={400}
                height={120}
                priority
                className="h-auto w-[210px] object-contain sm:w-[240px] lg:w-[250px]"
              />
            </Link>

            <Link
              href="/register"
              className="group hidden items-center gap-2 text-[13px] font-medium text-[#777d89] transition-colors duration-200 hover:text-[#071a50] sm:flex"
            >
              Create an account

              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </header>

          {/* HERO CONTENT */}

          <div className="grid min-h-[700px] items-center gap-12 py-12 lg:grid-cols-[410px_minmax(0,1fr)] lg:gap-16">
            {/* =================================================
                PHONE
            ================================================== */}

            <div className="flex items-center justify-center lg:justify-end">
              <div className="relative w-[280px] rounded-[48px] bg-[#111111] p-[9px] shadow-[0_30px_70px_rgba(15,27,69,0.16)] sm:w-[310px]">
                {/* PHONE BUTTONS */}

                <div className="absolute -left-[4px] top-[105px] h-[45px] w-[5px] rounded-l bg-[#242424]" />

                <div className="absolute -left-[4px] top-[165px] h-[65px] w-[5px] rounded-l bg-[#242424]" />

                <div className="absolute -right-[4px] top-[150px] h-[80px] w-[5px] rounded-r bg-[#242424]" />

                {/* SCREEN */}

                <div className="relative overflow-hidden rounded-[40px] bg-white">
                  {/* STATUS */}

                  <div className="relative flex h-10 items-center justify-between px-6 pt-2 text-[9px] font-semibold text-[#151515]">
                    <span>9:41</span>

                    <div className="absolute left-1/2 top-[9px] h-[22px] w-[82px] -translate-x-1/2 rounded-full bg-black" />

                    <div className="flex items-center gap-[3px]">
                      <span>●</span>
                      <span>◒</span>
                    </div>
                  </div>

                  {/* APP CONTENT */}

                  <div className="px-5 pb-5 pt-4">
                    {/* HEADER */}

                    <div className="flex items-start justify-between">
                      <div>
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#071a50]">
                          <Languages className="h-[17px] w-[17px] text-white" />
                        </div>

                        <p className="text-[10px] font-medium text-[#8c919d]">
                          Good morning,
                        </p>

                        <h2 className="mt-1 text-[18px] font-extrabold leading-tight text-[#101936]">
                          Let&apos;s learn
                          <br />
                          together!
                        </h2>
                      </div>

                      <button
                        type="button"
                        aria-label="Notifications"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8eaf0]"
                      >
                        <Bell className="h-3.5 w-3.5 text-[#737986]" />
                      </button>
                    </div>

                    {/* CONTINUE LEARNING */}

                    <div className="mt-6">
                      <p className="mb-2 text-[9px] font-semibold text-[#7c8290]">
                        Continue Learning
                      </p>

                      <div className="rounded-[20px] bg-[#edf3ff] p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <FlagIcon country="JP" size={38} />

                            <div className="min-w-0">
                              <p className="text-[12px] font-bold text-[#132153]">
                                Japanese
                              </p>

                              <p className="text-[8px] text-[#7c8496]">
                                Daily Conversation
                              </p>
                            </div>
                          </div>

                          <span className="ml-2 shrink-0 text-[8px] font-semibold text-[#6f7690]">
                            5/10
                          </span>
                        </div>

                        <div className="mt-4 h-[5px] rounded-full bg-white">
                          <div className="h-full w-[55%] rounded-full bg-[#3867e8]" />
                        </div>
                      </div>
                    </div>

                    {/* LANGUAGES */}

                    <div className="mt-5">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-[#121b3e]">
                          Explore Languages
                        </p>

                        <button
                          type="button"
                          className="text-[8px] font-medium text-[#7d8492] transition-colors hover:text-[#3867e8]"
                        >
                          See All
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {languages.map(({ code, language }) => (
                          <div
                            key={language}
                            className="flex min-w-0 flex-col items-center rounded-[14px] bg-[#f7f8fb] px-1 py-3"
                          >
                            <FlagIcon country={code} size={34} />

                            <p className="mt-2 w-full truncate text-center text-[7px] font-medium text-[#495168]">
                              {language}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* TODAY'S LESSON */}

                    <div className="mt-5">
                      <p className="text-[11px] font-bold text-[#121b3e]">
                        Today&apos;s Lesson
                      </p>

                      <div className="mt-3 flex items-center gap-3 rounded-[17px] border border-[#eef0f5] p-2.5">
                        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#edf2ff]">
                          <BookOpen className="h-5 w-5 text-[#3867e8]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="rounded bg-[#edf2ff] px-1.5 py-0.5 text-[7px] font-bold text-[#3867e8]">
                            A1
                          </span>

                          <p className="mt-1 truncate text-[10px] font-bold text-[#15204a]">
                            Greetings &amp; Basics
                          </p>

                          <p className="mt-0.5 truncate text-[7px] text-[#8b909d]">
                            Learn useful phrases for daily life.
                          </p>
                        </div>

                        <ChevronRight className="h-4 w-4 shrink-0 text-[#3867e8]" />
                      </div>
                    </div>

                    {/* NAVIGATION */}

                    <div className="mt-5 flex items-center justify-around border-t border-[#f0f1f4] pt-4">
                      <PhoneNav
                        icon={<Home className="h-4 w-4" />}
                        label="Home"
                        active
                      />

                      <PhoneNav
                        icon={<BookOpen className="h-4 w-4" />}
                        label="Learn"
                      />

                      <PhoneNav
                        icon={<Globe2 className="h-4 w-4" />}
                        label="Explore"
                      />

                      <PhoneNav
                        icon={<UserRound className="h-4 w-4" />}
                        label="Profile"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                ABOUT
            ================================================== */}

            <div className="max-w-[590px] lg:pl-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a0a4ae]">
                Overview
              </p>

              <h1 className="mt-3 text-[44px] font-black leading-[1.04] tracking-[-0.04em] text-[#070707] sm:text-[52px] lg:text-[58px]">
                About ACELingua
              </h1>

              <p className="mt-8 max-w-[560px] text-[15px] leading-[1.9] text-[#777d89] [text-align:justify] [text-justify:inter-word] sm:text-[16px]">
                ACELingua is an interactive language-learning platform designed
                to make learning new languages simple, engaging, and enjoyable.
                Learners can practice through structured lessons, explore
                different cultures, earn rewards, and build confidence through
                everyday language experiences.
              </p>

              {/* GOAL */}

              <div className="mt-10 border-t border-[#eceef2] pt-8">
                <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#3867e8]">
                  Goal
                </p>

                <p className="mt-3 max-w-[540px] text-[14px] leading-[1.85] text-[#777d89] [text-align:justify] [text-justify:inter-word] sm:text-[15px]">
                  To provide an accessible and enjoyable learning experience
                  where users can study a language while discovering different
                  destinations, cultures, and real-world conversations.
                </p>
              </div>

              {/* PLATFORM */}

              <div className="mt-8">
                <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#3867e8]">
                  Platform
                </p>

                <p className="mt-2 text-[14px] text-[#686e7c]">
                  Web Application
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          LEARNING FLOW
      ====================================================== */}

      <section className="border-t border-[#f0f1f4] bg-white px-6 py-28 md:px-10 lg:px-16">
        <div className="mx-auto max-w-[1250px]">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a0a4ae]">
              Planning
            </p>

            <h2 className="mt-3 text-[38px] font-black tracking-[-0.04em] text-[#090909] sm:text-[48px]">
              Learning Flow
            </h2>

            <p className="mx-auto mt-4 max-w-[600px] text-[14px] leading-7 text-[#8b909b]">
              A simple overview of how learners move through the ACELingua
              experience.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {flowSteps.map((step) => (
              <Link
                href={step.href}
                key={step.number}
                className="
                  group
                  relative
                  block
                  overflow-hidden
                  rounded-[20px]
                  border
                  border-[#edf0f4]
                  bg-white
                  p-6
                  transition-all
                  duration-300
                  ease-out

                  hover:-translate-y-2
                  hover:border-[#d6e1ff]
                  hover:shadow-[0_20px_45px_rgba(20,40,90,0.09)]
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    bg-[#edf2ff]
                    text-[11px]
                    font-bold
                    text-[#3867e8]
                    transition-all
                    duration-300

                    group-hover:bg-[#3867e8]
                    group-hover:text-white
                  "
                >
                  {step.number}
                </div>

                <h3 className="mt-5 text-[15px] font-bold text-[#131b38]">
                  {step.title}
                </h3>

                <p className="mt-2 min-h-[72px] text-[12px] leading-6 text-[#8b909c]">
                  {step.description}
                </p>

                <div
                  className="
                    mt-4
                    flex
                    items-center
                    gap-2
                    text-[11px]
                    font-semibold
                    text-[#3867e8]
                    opacity-0
                    transition-all
                    duration-300

                    group-hover:translate-x-1
                    group-hover:opacity-100
                  "
                >
                  Get started

                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          LEARNING EXPERIENCE
      ====================================================== */}

      <section className="bg-[#f8faff] px-6 py-28 md:px-10 lg:px-16">
        <div className="mx-auto max-w-[1150px]">
          <div className="grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
            {/* LEFT */}

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3867e8]">
                Learning Experience
              </p>

              <h2 className="mt-4 max-w-[500px] text-[36px] font-black leading-tight tracking-[-0.035em] text-[#0a0a0b] sm:text-[44px]">
                Language learning that feels like a journey.
              </h2>

              <p className="mt-6 max-w-[510px] text-[14px] leading-7 text-[#7e8490] [text-align:justify] [text-justify:inter-word]">
                Learn through structured lessons, explore destinations and
                cultures, customize your avatar, and earn rewards while you
                progress.
              </p>

              <Link
                href="/register"
                className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#071a50] px-6 py-3 text-[13px] font-semibold text-white transition-all duration-300 hover:bg-[#102b72]"
              >
                Start Learning

                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* FEATURE CARDS */}

            <div className="grid gap-5 sm:grid-cols-2">
              <FeatureCard
                icon={<BookOpen className="h-6 w-6" />}
                title="Interactive Lessons"
                text="Progress from beginner lessons to practical conversations."
              />

              <FeatureCard
                icon={<Globe2 className="h-6 w-6" />}
                title="World Exploration"
                text="Discover destinations, culture, history, and useful trivia."
              />

              <FeatureCard
                icon={<Trophy className="h-6 w-6" />}
                title="Progress & Rewards"
                text="Earn XP, coins, streaks, achievements, and exclusive items."
              />

              <FeatureCard
                icon={<UserRound className="h-6 w-6" />}
                title="Custom Avatar"
                text="Create a character using outfits and accessories."
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-[#eef0f4] bg-white px-6 py-8 md:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1250px] flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <Image
            src="/logo.png"
            alt="ACELingua"
            width={160}
            height={55}
            className="h-auto w-[145px] object-contain"
          />

          <p className="text-[11px] text-[#9ca1aa]">
            © 2026 ACELingua. Learn languages. Explore the world.
          </p>
        </div>
      </footer>
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
      text: "Hi! I'm Ace. 👋 How can I help you with ACELingua today?",
    },
  ]);

  const [input, setInput] = useState("");

  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /* AUTO SCROLL */

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, isTyping, open]);

  /* =======================================================
     AUTO ANSWER
  ======================================================== */

  function getAutoAnswer(question: string) {
    const normalized = question.toLowerCase();

    if (
      normalized.includes("what is acelingua") ||
      normalized.includes("about acelingua")
    ) {
      return chatbotQuestions[0].answer;
    }

    if (
      normalized.includes("language") ||
      normalized.includes("japanese") ||
      normalized.includes("korean") ||
      normalized.includes("spanish") ||
      normalized.includes("french")
    ) {
      return chatbotQuestions[1].answer;
    }

    if (
      normalized.includes("lesson") ||
      normalized.includes("course") ||
      normalized.includes("study")
    ) {
      return chatbotQuestions[2].answer;
    }

    if (
      normalized.includes("start") ||
      normalized.includes("register") ||
      normalized.includes("account") ||
      normalized.includes("sign up")
    ) {
      return chatbotQuestions[3].answer;
    }

    if (
      normalized.includes("xp") ||
      normalized.includes("coin") ||
      normalized.includes("reward")
    ) {
      return chatbotQuestions[4].answer;
    }

    if (
      normalized.includes("avatar") ||
      normalized.includes("outfit") ||
      normalized.includes("hair") ||
      normalized.includes("custom")
    ) {
      return chatbotQuestions[5].answer;
    }

    return (
      "I can help you with ACELingua languages, lessons, registration, " +
      "XP, coins, rewards, and avatar customization. You can also try one " +
      "of the suggested questions below."
    );
  }

  /* =======================================================
     SEND MESSAGE
  ======================================================== */

  function sendMessage(question: string) {
    const cleanedQuestion = question.trim();

    if (!cleanedQuestion || isTyping) {
      return;
    }

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
          right-5
          z-[80]
          w-[calc(100%-40px)]
          max-w-[365px]
          origin-bottom-right
          overflow-hidden
          rounded-[26px]
          border
          border-[#e8ecf4]
          bg-white
          shadow-[0_25px_80px_rgba(7,26,80,0.18)]

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
        {/* CHAT HEADER */}

        <div className="flex items-center justify-between bg-[#071a50] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white">
              <Image
                src="/icons/ace-chatbot.png"
                alt="Ace"
                width={44}
                height={44}
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-bold text-white">
                  Ace
                </p>

                <span className="h-2 w-2 rounded-full bg-[#63e698]" />
              </div>

              <p className="text-[10px] text-white/60">
                ACELingua Assistant
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chatbot"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              text-white/70

              transition-all
              duration-200

              hover:rotate-90
              hover:bg-white/10
              hover:text-white
            "
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* =================================================
            CHAT MESSAGES
        ================================================== */}

        <div className="max-h-[315px] min-h-[270px] space-y-4 overflow-y-auto bg-[#fbfcff] px-4 py-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {/* BOT ICON */}

              {message.sender === "bot" && (
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e6eaf3] bg-white">
                  <Image
                    src="/icons/ace-chatbot.png"
                    alt="Ace"
                    width={26}
                    height={26}
                    className="h-full w-full object-contain p-1"
                  />
                </div>
              )}

              {/* MESSAGE */}

              <div
                className={`
                  max-w-[78%]
                  px-4
                  py-3
                  text-[12px]
                  leading-5

                  ${
                    message.sender === "user"
                      ? "rounded-[18px] rounded-br-[5px] bg-[#3867e8] text-white"
                      : "rounded-[18px] rounded-bl-[5px] border border-[#edf0f5] bg-white text-[#656c79] shadow-[0_4px_14px_rgba(20,40,90,0.035)]"
                  }
                `}
              >
                {message.text}
              </div>
            </div>
          ))}

          {/* TYPING */}

          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-[#e6eaf3] bg-white">
                <Image
                  src="/icons/ace-chatbot.png"
                  alt="Ace"
                  width={26}
                  height={26}
                  className="h-full w-full object-contain p-1"
                />
              </div>

              <div className="flex items-center gap-1 rounded-[16px] rounded-bl-[5px] border border-[#edf0f5] bg-white px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9ba2af] [animation-delay:-0.3s]" />

                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9ba2af] [animation-delay:-0.15s]" />

                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9ba2af]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* =================================================
            QUICK QUESTIONS
        ================================================== */}

        <div className="border-t border-[#eef0f5] bg-white px-4 py-3">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#a0a6b1]">
            Quick Questions
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
                  border-[#dfe6fa]
                  bg-[#f5f8ff]
                  px-3
                  py-2
                  text-[10px]
                  font-medium
                  text-[#3867e8]

                  transition-all
                  duration-200

                  hover:border-[#3867e8]
                  hover:bg-[#3867e8]
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
          className="flex items-center gap-2 border-t border-[#eef0f5] bg-white p-3"
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
              border-[#e2e6ee]
              bg-[#f8f9fb]
              px-4
              py-2.5
              text-[12px]
              text-[#303746]
              outline-none

              transition-all
              duration-200

              placeholder:text-[#a7acb5]

              focus:border-[#9db3f1]
              focus:bg-white
              focus:ring-2
              focus:ring-[#3867e8]/10
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
              bg-[#071a50]
              text-white

              transition-all
              duration-200

              hover:scale-105
              hover:bg-[#3867e8]

              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* =====================================================
          FLOATING ACE BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close Ace chatbot" : "Open Ace chatbot"}
        className="
          group
          fixed
          bottom-6
          right-5
          z-[81]
          flex
          h-[68px]
          w-[68px]
          items-center
          justify-center
          rounded-full
          border
          border-[#dfe5f1]
          bg-white
          shadow-[0_12px_40px_rgba(7,26,80,0.18)]

          transition-all
          duration-300
          ease-out

          hover:-translate-y-1
          hover:scale-105
          hover:shadow-[0_18px_48px_rgba(7,26,80,0.24)]

          sm:right-7
        "
      >
        {/* PULSE */}

        {!open && (
          <span className="absolute inset-0 animate-ping rounded-full border border-[#3867e8]/25" />
        )}

        {/* ACE */}

        <div
          className={`
            relative
            z-10
            flex
            h-[56px]
            w-[56px]
            items-center
            justify-center
            overflow-hidden
            rounded-full
            bg-[#f2f5ff]

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
            src="/icons/ace-chatbot.png"
            alt="Chat with Ace"
            width={56}
            height={56}
            priority
            className="h-full w-full object-contain p-1.5"
          />
        </div>

        {/* CLOSE */}

        <div
          className={`
            absolute
            inset-0
            flex
            items-center
            justify-center
            text-[#071a50]

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

        {/* ONLINE */}

        {!open && (
          <span className="absolute bottom-[5px] right-[4px] z-20 h-4 w-4 rounded-full border-[3px] border-white bg-[#52d987]" />
        )}
      </button>
    </>
  );
}

/* =========================================================
   SOCIAL SIDEBAR
========================================================= */

function SocialSidebar() {
  return (
    <aside className="fixed right-0 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
      <SocialLink
        href="#"
        label="Facebook"
        icon={<FacebookLogo />}
      />

      <SocialLink
        href="#"
        label="Instagram"
        icon={<InstagramLogo />}
      />

      <SocialLink
        href="#"
        label="X"
        icon={<XLogo />}
      />
    </aside>
  );
}

/* =========================================================
   SOCIAL LINK
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
  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (href === "#") {
      event.preventDefault();
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      aria-label={label}
      target={href === "#" ? undefined : "_blank"}
      rel={href === "#" ? undefined : "noopener noreferrer"}
      className="
        group
        flex
        h-12
        w-12
        items-center
        overflow-hidden
        rounded-l-[14px]
        border
        border-r-0
        border-[#e6eaf1]
        bg-white
        text-[#071a50]
        shadow-[0_7px_25px_rgba(15,27,69,0.07)]

        transition-all
        duration-300
        ease-out

        hover:w-[140px]
        hover:-translate-x-1
        hover:border-[#d4def8]
        hover:bg-[#071a50]
        hover:text-white
        hover:shadow-[0_12px_30px_rgba(7,26,80,0.16)]
      "
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>

      <span
        className="
          -translate-x-2
          whitespace-nowrap
          pr-5
          text-[12px]
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
   FACEBOOK
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
   INSTAGRAM
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

      <circle cx="12" cy="12" r="4" />

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

/* =========================================================
   PHONE NAV
========================================================= */

function PhoneNav({
  icon,
  label,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`text-center ${
        active ? "text-[#3867e8]" : "text-[#979ca7]"
      }`}
    >
      <div className="mx-auto flex h-5 w-5 items-center justify-center">
        {icon}
      </div>

      <p className="mt-1 text-[7px] font-medium">{label}</p>
    </div>
  );
}

/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      tabIndex={0}
      className="
        group
        relative
        h-[225px]
        cursor-pointer
        overflow-hidden
        rounded-[24px]
        border
        border-[#e8ecf3]
        bg-white
        outline-none
        shadow-[0_8px_25px_rgba(30,50,110,0.035)]

        transition-all
        duration-500
        ease-[cubic-bezier(0.4,0,0.2,1)]

        hover:-translate-y-2
        hover:scale-[1.03]
        hover:border-[#d4def8]
        hover:bg-[#071a50]
        hover:shadow-[0_25px_55px_rgba(7,26,80,0.18)]

        focus:-translate-y-2
        focus:scale-[1.03]
        focus:bg-[#071a50]
      "
    >
      {/* GLOW */}

      <div
        className="
          pointer-events-none
          absolute
          -right-16
          -top-16
          h-36
          w-36
          scale-50
          rounded-full
          bg-[#3867e8]/20
          opacity-0
          blur-3xl
          transition-all
          duration-700

          group-hover:scale-125
          group-hover:opacity-100
        "
      />

      {/* FIRST */}

      <div
        className="
          absolute
          inset-0
          flex
          flex-col
          items-center
          justify-center
          px-6
          text-center
          opacity-100

          transition-all
          duration-500

          group-hover:-translate-y-8
          group-hover:scale-[0.92]
          group-hover:opacity-0

          group-focus:-translate-y-8
          group-focus:scale-[0.92]
          group-focus:opacity-0
        "
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#edf2ff] text-[#3867e8]">
          {icon}
        </div>

        <h3 className="mt-6 text-[17px] font-bold text-[#151d3c]">
          {title}
        </h3>

        <div className="mt-3 flex items-center gap-2">
          <span className="h-px w-4 bg-[#cbd2df]" />

          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#adb2bd]">
            Hover to explore
          </p>

          <span className="h-px w-4 bg-[#cbd2df]" />
        </div>
      </div>

      {/* SECOND */}

      <div
        className="
          absolute
          inset-0
          flex
          translate-y-10
          rotate-[7deg]
          scale-[0.88]
          flex-col
          items-center
          justify-center
          px-7
          text-center
          opacity-0

          transition-all
          duration-500
          ease-[cubic-bezier(0.34,1.56,0.64,1)]

          group-hover:translate-y-0
          group-hover:rotate-0
          group-hover:scale-100
          group-hover:opacity-100

          group-focus:translate-y-0
          group-focus:rotate-0
          group-focus:scale-100
          group-focus:opacity-100
        "
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white">
          {icon}
        </div>

        <h3 className="mt-5 text-[18px] font-bold text-white">
          {title}
        </h3>

        <p className="mt-3 max-w-[220px] text-[12px] leading-[1.8] text-white/70">
          {text}
        </p>

        <div className="mt-5 h-[2px] w-10 rounded-full bg-[#6f92ff]" />
      </div>
    </div>
  );
}

/* =========================================================
   COUNTRY FLAGS
========================================================= */

function FlagIcon({
  country,
  size = 36,
}: {
  country: FlagCode;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
      }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e1e5ec] bg-white shadow-[0_2px_8px_rgba(20,35,80,0.06)]"
    >
      {/* JAPAN */}

      {country === "JP" && (
        <svg
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          aria-label="Japan flag"
        >
          <rect width="48" height="48" fill="#FFFFFF" />

          <circle cx="24" cy="24" r="10" fill="#BC002D" />
        </svg>
      )}

      {/* KOREA */}

      {country === "KR" && (
        <svg
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          aria-label="South Korea flag"
        >
          <rect width="48" height="48" fill="#FFFFFF" />

          <path
            d="M24 14 A10 10 0 0 1 24 34 A5 5 0 0 0 24 24 A5 5 0 0 1 24 14"
            fill="#E31D1C"
          />

          <path
            d="M24 34 A10 10 0 0 1 24 14 A5 5 0 0 0 24 24 A5 5 0 0 1 24 34"
            fill="#3D58DB"
          />

          <g
            stroke="#272727"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="9" y1="12" x2="15" y2="8" />
            <line x1="10.5" y1="15" x2="16.5" y2="11" />
            <line x1="12" y1="18" x2="18" y2="14" />

            <line x1="33" y1="8" x2="39" y2="12" />
            <line x1="31.5" y1="11" x2="37.5" y2="15" />
            <line x1="30" y1="14" x2="36" y2="18" />

            <line x1="9" y1="36" x2="15" y2="40" />
            <line x1="10.5" y1="33" x2="16.5" y2="37" />
            <line x1="12" y1="30" x2="18" y2="34" />

            <line x1="33" y1="40" x2="39" y2="36" />
            <line x1="31.5" y1="37" x2="37.5" y2="33" />
            <line x1="30" y1="34" x2="36" y2="30" />
          </g>
        </svg>
      )}

      {/* SPAIN */}

      {country === "ES" && (
        <div className="flex h-full w-full items-center justify-center bg-white">
          <div className="h-[88%] w-[88%] overflow-hidden rounded-full">
            <svg
              viewBox="0 0 32 24"
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full"
              aria-label="Spain flag"
              preserveAspectRatio="xMidYMid slice"
            >
              <path d="M0 0V24H32V0H0Z" fill="#FFB400" />

              <path d="M0 0V6H32V0H0Z" fill="#C51918" />

              <path d="M0 18V24H32V18H0Z" fill="#C51918" />

              <rect
                x="6"
                y="9"
                width="4"
                height="7"
                rx="0.6"
                fill="#AD1619"
              />

              <rect
                x="6.8"
                y="10"
                width="2.4"
                height="5"
                rx="0.3"
                fill="#FFC034"
              />

              <circle
                cx="8"
                cy="8.5"
                r="1.2"
                fill="#C88A02"
              />
            </svg>
          </div>
        </div>
      )}

      {/* FRANCE */}

      {country === "FR" && (
        <svg
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          aria-label="France flag"
        >
          <rect width="16" height="48" x="0" fill="#0055A4" />

          <rect width="16" height="48" x="16" fill="#FFFFFF" />

          <rect width="16" height="48" x="32" fill="#EF4135" />
        </svg>
      )}
    </div>
  );
}