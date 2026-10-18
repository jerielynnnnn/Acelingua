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
  const carouselRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const interval = window.setInterval(() => {
      if (pausedRef.current) return;
      carousel.scrollLeft += 1;
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
    <main className="acelingua-home min-h-svh overflow-x-hidden bg-[#EAF5FF] text-[#071A4A]">
      <SocialSidebar />
      <FloatingChatbot />
      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
      <PublicHeader />
      <div className="mx-auto flex min-h-[calc(100svh-6rem)] w-full max-w-[var(--page-max-width)] flex-col justify-center pb-8">
      <section className="flex min-h-[35.625rem] items-center justify-center px-6 pb-10 pt-4">
        <div className="w-full text-center">
          <div className="relative mx-auto h-[20.625rem] w-[40.625rem] max-w-full">
            <AnimatedWorld />
            <div className="absolute left-[1.25rem] top-[2.8125rem] z-30 sm:left-[2.8125rem]">
              <div className="relative rounded-2xl border border-[#3558AE]/15 bg-white px-4 py-2.5 shadow-[0_5px_18px_rgba(7,26,74,0.08)]">
                <p className="text-xs font-semibold text-[#071A4A]">
                  <span className="mr-1.5 text-[0.625rem] font-extrabold text-[#3558AE]">
                    ES
                  </span>
                  ¡Hola!
                </p>
                <div className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-[#3558AE]/15 bg-white" />
              </div>
            </div>
            <div className="absolute right-[1.25rem] top-[4.0625rem] z-30 sm:right-[2.8125rem]">
              <div className="relative rounded-2xl border border-[#3558AE]/15 bg-white px-4 py-2.5 shadow-[0_5px_18px_rgba(7,26,74,0.08)]">
                <p className="text-xs font-semibold text-[#071A4A]">
                  <span className="mr-1.5 text-[0.625rem] font-extrabold text-[#3558AE]">
                    DE
                  </span>
                  Hallo!
                </p>
                <div className="absolute -bottom-1.5 left-5 h-3 w-3 rotate-45 border-b border-r border-[#3558AE]/15 bg-white" />
              </div>
            </div>
            <div className="absolute bottom-[2.1875rem] right-[1.875rem] z-30 sm:right-[4.6875rem]">
              <div className="relative rounded-2xl border border-[#3558AE]/15 bg-white px-4 py-2.5 shadow-[0_5px_18px_rgba(7,26,74,0.08)]">
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#071A4A]">
            <span className="mr-1.5 text-[0.625rem] font-extrabold text-[#3558AE]">
              JP
            </span>
              こんにちは
            </p>
            </div>
            <p className="mt-0.5 text-[0.5625rem] font-medium text-[#071A4A]/45">
              Kon · ni · chi · wa
            </p>
    <div className="absolute -top-1.5 left-5 h-3 w-3 rotate-45 border-l border-t border-[#3558AE]/15 bg-white" />
      </div>
    </div>
            <div className="absolute bottom-[3.125rem] left-[1.5625rem] z-30 sm:left-[4.0625rem]">
              <div className="relative rounded-2xl border border-[#3558AE]/15 bg-white px-4 py-2.5 shadow-[0_5px_18px_rgba(7,26,74,0.08)]">
                <p className="text-xs font-semibold text-[#071A4A]">
                  <span className="mr-1.5 text-[0.625rem] font-extrabold text-[#3558AE]">
                    KR
                  </span>
                  안녕하세요
                </p>
                <p className="mt-0.5 text-[0.5625rem] font-medium text-[#071A4A]/45">
                  An · nyeong · ha · se · yo
                </p>
                <div className="absolute -top-1.5 right-5 h-3 w-3 rotate-45 border-l border-t border-[#3558AE]/15 bg-white" />
              </div>
            </div>
          </div>
          <div className="-mt-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#071A4A] sm:text-3xl">
              Learn. Speak. Explore.
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#071A4A]/55 sm:text-base">
              Learn languages through interactive lessons, practice, and
              rewarding progress.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/onboarding/languages"
              className="group inline-flex min-w-[145px] items-center justify-center gap-2 rounded-full bg-[#071A4A] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#3558AE]"
            >
              Get Started
              <span className="transition group-hover:translate-x-1">
                ›
              </span>
            </Link>
                        <button
              type="button"
              onClick={() => setIsVideoOpen(true)}
              aria-label="Watch the How It Works video"
              className="group inline-flex min-w-[145px] items-center justify-center gap-2 rounded-full border border-[#071A4A]/25 bg-white/50 px-6 py-3 text-sm font-semibold shadow-[0_4px_15px_rgba(7,26,74,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#3558AE]/40 hover:bg-white hover:shadow-[0_9px_25px_rgba(7,26,74,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3558AE] motion-reduce:transition-none"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#071A4A] text-white transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#3558AE] motion-reduce:transition-none">
                <Play size={10} fill="currentColor" />
              </span>
              Watch Video
            </button>
          </div>
        </div>
      </section>
      <section className="pb-12">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3558AE]">
            Languages
          </p>
          <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
            Explore languages
          </h2>
        </div>
        <div className="mx-auto w-full max-w-[53.125rem] overflow-hidden px-4 sm:px-0">
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
                href={`/onboarding/languages?language=${encodeURIComponent(language.code)}`}
                onClick={() => {
                  // Remember what the user clicked even if a redirect strips the query.
                  try {
                    window.sessionStorage.setItem(
                      "acelingua_pending_language",
                      language.code
                    );
                  } catch {
                    // The URL parameter remains the primary selection mechanism.
                  }
                }}
                className="group w-[10.625rem] shrink-0 sm:w-[11.875rem]"
              >
                <div className="rounded-2xl border border-white bg-white/75 p-3 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg">
                  <div className="relative h-[5.9375rem] w-full overflow-hidden rounded-xl border border-[#071A4A]/5 bg-white sm:h-[6.5625rem]">
                    <Image
                      src={language.flag}
                      alt={`${language.name} flag`}
                      fill
                      sizes="190px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
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
      </div>
    </main>
  );
}
/** ACELingua cinematic video lightbox. */
function VideoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  function stopVideo() {
    const video = videoRef.current;
    if (!video) return;
    // Pause immediately, even while the modal fades out.
    video.pause();
    if (video.readyState > 0) video.currentTime = 0;
    setProgress(0);
  }
  function closeVideo() {
    stopVideo();
    onClose();
  }
  // Mount before animating in; animate out before unmounting.
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      let secondFrame = 0;
      const firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => setIsVisible(true));
      });
      return () => {
        window.cancelAnimationFrame(firstFrame);
        window.cancelAnimationFrame(secondFrame);
      };
    }
    setIsVisible(false);
    videoRef.current?.pause();
    const exitTimer = window.setTimeout(() => setIsMounted(false), 380);
    return () => window.clearTimeout(exitTimer);
  }, [isOpen]);
  // Lock background scrolling and support the Escape key.
  useEffect(() => {
    if (!isMounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        const video = videoRef.current;
        if (video) {
          video.pause();
          if (video.readyState > 0) video.currentTime = 0;
        }
        setProgress(0);
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      videoRef.current?.pause();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMounted, isOpen, onClose]);
  function handleTimeUpdate() {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  }
  if (!isMounted) return null;
  return (
    <div
      role="presentation"
      onClick={closeVideo}
      className={`fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-3 transition-opacity duration-[380ms] ease-out sm:p-7 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Cinema lights: all visual layers ignore clicks so the backdrop closes. */}
      <div className="pointer-events-none absolute inset-0 bg-[#020712]/85 backdrop-blur-[9px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[65vh] w-[80vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3558AE]/20 blur-[100px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="acelingua-video-title"
        aria-describedby="acelingua-video-description"
        onClick={(event) => event.stopPropagation()}
        className={`relative my-auto w-full max-w-[59.375rem] transform-gpu overflow-hidden rounded-[24px] border border-white/15 bg-[#071A4A] shadow-[0_35px_110px_rgba(0,0,0,0.65)] transition-[transform,opacity] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:rounded-[30px] ${
          isVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-[0.94] opacity-0"
        }`}
      >
        {/* Thin gradient highlight on the top edge. */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#C7A9D4] via-[#6D94F5] to-[#F9C3D7]" />
        {/* Branded header. */}
        <header className="relative flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 sm:h-12 sm:w-12">
              <Image
                src="/icon head.png"
                alt="Ace mascot"
                width={48}
                height={48}
                className="h-full w-full object-contain p-1"
              />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C7A9D4] opacity-70 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#C7A9D4]" />
                </span>
                <span className="text-[0.5625rem] font-bold uppercase tracking-[0.22em] text-[#C7A9D4] sm:text-[0.625rem]">
                  ACELingua · Quick Tour
                </span>
              </div>
              <h2
                id="acelingua-video-title"
                className="truncate text-sm font-bold tracking-tight text-white sm:text-lg"
              >
                Discover How It Works
              </h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeVideo}
            aria-label="Close video"
            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 outline-none transition-all duration-300 hover:rotate-90 hover:border-white/30 hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-[#C7A9D4] motion-reduce:transition-none"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>
        {/* Native HTML5 player, framed like a little cinema screen. */}
        <div className="px-2 pb-2 sm:px-5">
          <div className="relative overflow-hidden rounded-[16px] border border-white/15 bg-black shadow-[0_18px_55px_rgba(0,0,0,0.35)] sm:rounded-[20px]">
            <video
              ref={videoRef}
              src="/Videos/acelingua.mp4"
              controls
              autoPlay
              playsInline
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              className="block aspect-video max-h-[70vh] w-full bg-black object-contain"
            >
              Your browser does not support HTML5 video.
            </video>
          </div>
        </div>
        {/* Extra branded progress indicator and quiet footer. */}
        <div className="px-5 pb-5 pt-3 sm:px-7 sm:pb-6 sm:pt-4">
          <div
            aria-hidden="true"
            className="h-[3px] overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C7A9D4] via-[#7AA3FF] to-[#F9C3D7] transition-[width] duration-150 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p
              id="acelingua-video-description"
              className="text-[0.6875rem] font-medium tracking-wide text-white/70 sm:text-xs"
            >
              Learn. Speak. Explore. <span className="text-white/35">Your journey starts here.</span>
            </p>
            <span className="text-[0.625rem] text-white/40 sm:text-[0.6875rem]">
              Press Esc or click outside to close
            </span>
          </div>
        </div>
      </section>
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
