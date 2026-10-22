"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Gamepad2,
  Headphones,
  Puzzle,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  X,
} from "lucide-react";

import {
  readPreview,
  writePreview,
  previewResults,
  type GuestPreview,
  type PreviewAnswer,
} from "@/lib/guest-preview";
import LanguageAudio from "./LanguageAudio";
import AutoPhraseSpeech from "./AutoPhraseSpeech";
import { languageLocales, matchingVoice, recordingFor } from "@/lib/voice-learning";

/* ========================================================================
   ACELINGUA GUEST PREVIEW — CUSTOMIZABLE QUESTION BANK
   ========================================================================

   HOW TO EDIT A LANGUAGE:
   1. Find its code in LANGUAGE_QUIZZES: ko, ja, zh, es, de, th, fr, etc.
   2. Edit the task's prompt (question).
   3. Edit options (the four visible A/B/C/D choices).
   4. Set correct to EXACTLY ONE of those four option strings.
   5. For matching, edit pairs; for word order, edit spokenWord, expected,
      and optional distractors (extra jumble tiles).
   6. Keep each task ID unique and stable. Change its ID if you want to
      invalidate previously saved answers to that particular question.

   These are EDITABLE DEMO QUESTIONS, not database-generated questions.
   Languages not listed below fall back to the Supabase vocabulary, if there
   are at least four distinct translations available.
   ======================================================================== */

type Word = {
  id: string;
  word: string;
  translation: string;
  pronunciation?: string | null;
  example_sentence: string | null;
  example_translation: string | null;
};

type Props = {
  languageId: string;
  languageCode: string;
  courseId: string;
  lessonId: string;
  words: Word[];
  onComplete: () => void;
};

type AnswerKind = PreviewAnswer["kind"];
type FourChoices = [string, string, string, string];

type ChoiceTask = {
  id: string;
  kind: AnswerKind;
  mode: "choice" | "listen";
  prompt: string;
  options: FourChoices;
  correct: string;
  spokenWord?: string;
};

type MatchTask = {
  id: string;
  kind: AnswerKind;
  mode: "match";
  prompt: string;
  pairs: { phrase: string; meaning: string }[];
};

type OrderTask = {
  id: string;
  kind: AnswerKind;
  mode: "order";
  prompt: string;
  spokenWord?: string; // Native phrase for the Listen button
  expected: string[]; // Correct English word order
  distractors?: string[]; // Extra tiles that should NOT be used
};

type Task = ChoiceTask | MatchTask | OrderTask;

type LanguageQuizPack = {
  name: string;
  flag: string;
  accent: string;
  tint: string;
  tasks: Task[];
};

// ====================== EDIT YOUR QUESTIONS BELOW =======================
// Example: For Korean, change LANGUAGE_QUIZZES.ko.tasks.
// Every "choice" and "listen" task MUST have 4 distinct options.
// The correct answer MUST also appear in options.
const LANGUAGE_QUIZZES: Record<string, LanguageQuizPack> = {
  ko: {
    name: "Korean", flag: "🇰🇷", accent: "#8568C8", tint: "#F1EBFF",
    tasks: [
      {
        id: "v2-ko-greeting", kind: "practice", mode: "choice",
        prompt: "What does ‘안녕하세요 (Annyeonghaseyo)’ mean?",
        options: ["Good morning", "Hello", "Goodbye", "Thank you"],
        correct: "Hello", spokenWord: "안녕하세요",
      },
      {
        id: "v2-ko-thanks", kind: "quiz", mode: "listen",
        prompt: "Listen to the Korean phrase. What does it mean?",
        options: ["I'm sorry", "You're welcome", "Thank you", "Excuse me"],
        correct: "Thank you", spokenWord: "감사합니다",
      },
      {
        id: "v2-ko-match", kind: "game", mode: "match",
        prompt: "Match each Korean phrase with its meaning.",
        pairs: [
          { phrase: "안녕하세요", meaning: "Hello" },
          { phrase: "감사합니다", meaning: "Thank you" },
          { phrase: "안녕히 가세요", meaning: "Goodbye" },
        ],
      },
      {
        id: "v3-ko-order-audio-jumble", kind: "game", mode: "order",
        prompt: "Listen, then arrange the English meaning of ‘처음 뵙겠습니다’.",
        spokenWord: "처음 뵙겠습니다", // /audio/ko/cheoeum-boepgetseumnida.mp3
        expected: ["Nice", "to", "meet", "you"],
        distractors: ["Goodbye", "Thanks"], // Optional extra jumbled tiles
      },
    ],
  },
  ja: {
    name: "Japanese", flag: "🇯🇵", accent: "#E47D98", tint: "#FFEAF0",
    tasks: [
      {
        id: "v2-ja-greeting", kind: "practice", mode: "choice",
        prompt: "What does ‘こんにちは (Konnichiwa)’ mean?",
        options: ["Goodbye", "Thank you", "Hello", "Sorry"],
        correct: "Hello", spokenWord: "こんにちは",
      },
      {
        id: "v2-ja-thanks", kind: "quiz", mode: "listen",
        prompt: "Listen to the Japanese phrase. What does it mean?",
        options: ["Thank you", "Good night", "Excuse me", "Goodbye"],
        correct: "Thank you", spokenWord: "ありがとう",
      },
      {
        id: "v2-ja-match", kind: "game", mode: "match",
        prompt: "Match each Japanese phrase with its meaning.",
        pairs: [
          { phrase: "こんにちは", meaning: "Hello" },
          { phrase: "ありがとう", meaning: "Thank you" },
          { phrase: "さようなら", meaning: "Goodbye" },
        ],
      },
      {
        id: "v2-ja-order", kind: "game", mode: "order",
        prompt: "Arrange the English meaning of ‘はじめまして’.",
        expected: ["Nice", "to", "meet", "you"],
      },
    ],
  },
  zh: {
    name: "Chinese", flag: "🇨🇳", accent: "#EA9276", tint: "#FFF0E8",
    tasks: [
      {
        id: "v2-zh-greeting", kind: "practice", mode: "choice",
        prompt: "What does ‘你好 (Nǐ hǎo)’ mean?",
        options: ["Hello", "Goodbye", "Please", "Thank you"],
        correct: "Hello", spokenWord: "你好",
      },
      {
        id: "v2-zh-thanks", kind: "quiz", mode: "listen",
        prompt: "Listen to the Mandarin phrase. What does it mean?",
        options: ["Excuse me", "Thank you", "Good night", "Goodbye"],
        correct: "Thank you", spokenWord: "谢谢",
      },
      {
        id: "v2-zh-match", kind: "game", mode: "match",
        prompt: "Match each Mandarin phrase with its meaning.",
        pairs: [
          { phrase: "你好", meaning: "Hello" },
          { phrase: "谢谢", meaning: "Thank you" },
          { phrase: "再见", meaning: "Goodbye" },
        ],
      },
      {
        id: "v2-zh-order", kind: "game", mode: "order",
        prompt: "Arrange the English meaning of ‘很高兴认识你’.",
        expected: ["Nice", "to", "meet", "you"],
      },
    ],
  },
  es: {
    name: "Spanish", flag: "🇪🇸", accent: "#D9A24D", tint: "#FFF4DD",
    tasks: [
      {
        id: "v2-es-greeting", kind: "practice", mode: "choice",
        prompt: "What does ‘Hola’ mean?",
        options: ["Sorry", "Hello", "Goodbye", "Please"],
        correct: "Hello", spokenWord: "Hola",
      },
      {
        id: "v2-es-thanks", kind: "quiz", mode: "listen",
        prompt: "Listen to the Spanish phrase. What does it mean?",
        options: ["Good night", "You're welcome", "Goodbye", "Thank you"],
        correct: "Thank you", spokenWord: "Gracias",
      },
      {
        id: "v2-es-match", kind: "game", mode: "match",
        prompt: "Match each Spanish phrase with its meaning.",
        pairs: [
          { phrase: "Hola", meaning: "Hello" },
          { phrase: "Gracias", meaning: "Thank you" },
          { phrase: "Adiós", meaning: "Goodbye" },
        ],
      },
      {
        id: "v2-es-order", kind: "game", mode: "order",
        prompt: "Arrange the English meaning of ‘Mucho gusto’.",
        expected: ["Nice", "to", "meet", "you"],
      },
    ],
  },
  de: {
    name: "German", flag: "🇩🇪", accent: "#7A9AC8", tint: "#EAF1FF",
    tasks: [
      {
        id: "v2-de-greeting", kind: "practice", mode: "choice",
        prompt: "What does ‘Hallo’ mean?",
        options: ["Please", "Goodbye", "Hello", "Sorry"],
        correct: "Hello", spokenWord: "Hallo",
      },
      {
        id: "v2-de-thanks", kind: "quiz", mode: "listen",
        prompt: "Listen to the German phrase. What does it mean?",
        options: ["Thank you", "Goodbye", "Good night", "Excuse me"],
        correct: "Thank you", spokenWord: "Danke",
      },
      {
        id: "v2-de-match", kind: "game", mode: "match",
        prompt: "Match each German phrase with its meaning.",
        pairs: [
          { phrase: "Hallo", meaning: "Hello" },
          { phrase: "Danke", meaning: "Thank you" },
          { phrase: "Auf Wiedersehen", meaning: "Goodbye" },
        ],
      },
      {
        id: "v2-de-order", kind: "game", mode: "order",
        prompt: "Arrange the English meaning of ‘Freut mich, dich kennenzulernen’.",
        expected: ["Nice", "to", "meet", "you"],
      },
    ],
  },
  th: {
    name: "Thai", flag: "🇹🇭", accent: "#6CB6AC", tint: "#E5F8F3",
    tasks: [
      {
        id: "v2-th-greeting", kind: "practice", mode: "choice",
        prompt: "What does ‘สวัสดี (Sawatdee)’ mean?",
        options: ["Hello", "Sorry", "Thank you", "Goodbye"],
        correct: "Hello", spokenWord: "สวัสดี",
      },
      {
        id: "v2-th-thanks", kind: "quiz", mode: "listen",
        prompt: "Listen to the Thai phrase. What does it mean?",
        options: ["Goodbye", "Good morning", "Thank you", "Excuse me"],
        correct: "Thank you", spokenWord: "ขอบคุณ",
      },
      {
        id: "v2-th-match", kind: "game", mode: "match",
        prompt: "Match each Thai phrase with its meaning.",
        pairs: [
          { phrase: "สวัสดี", meaning: "Hello" },
          { phrase: "ขอบคุณ", meaning: "Thank you" },
          { phrase: "ลาก่อน", meaning: "Goodbye" },
        ],
      },
      {
        id: "v2-th-order", kind: "game", mode: "order",
        prompt: "Arrange the English meaning of ‘ยินดีที่ได้รู้จัก’.",
        expected: ["Nice", "to", "meet", "you"],
      },
    ],
  },
  fr: {
    name: "French", flag: "🇫🇷", accent: "#7CA0DD", tint: "#EAF2FF",
    tasks: [
      {
        id: "v2-fr-greeting", kind: "practice", mode: "choice",
        prompt: "What does ‘Bonjour’ mean?",
        options: ["Thank you", "Goodbye", "Excuse me", "Hello"],
        correct: "Hello", spokenWord: "Bonjour",
      },
      {
        id: "v2-fr-thanks", kind: "quiz", mode: "listen",
        prompt: "Listen to the French phrase. What does it mean?",
        options: ["Sorry", "Thank you", "Good night", "Goodbye"],
        correct: "Thank you", spokenWord: "Merci",
      },
      {
        id: "v2-fr-match", kind: "game", mode: "match",
        prompt: "Match each French phrase with its meaning.",
        pairs: [
          { phrase: "Bonjour", meaning: "Hello" },
          { phrase: "Merci", meaning: "Thank you" },
          { phrase: "Au revoir", meaning: "Goodbye" },
        ],
      },
      {
        id: "v2-fr-order", kind: "game", mode: "order",
        prompt: "Arrange the English meaning of ‘Enchanté(e)’.",
        expected: ["Nice", "to", "meet", "you"],
      },
    ],
  },
  fil: {
    name: "Filipino", flag: "🇵🇭", accent: "#D99B50", tint: "#FFF2E0",
    tasks: [
      {
        id: "v2-fil-greeting", kind: "practice", mode: "choice",
        prompt: "What does ‘Kumusta?’ mean in English?",
        options: ["Goodbye", "Thank you", "How are you?", "Please"],
        correct: "How are you?", spokenWord: "Kumusta",
      },
      {
        id: "v2-fil-thanks", kind: "quiz", mode: "listen",
        prompt: "Listen to the Filipino phrase. What does it mean?",
        options: ["Thank you", "Excuse me", "I'm sorry", "Goodbye"],
        correct: "Thank you", spokenWord: "Salamat",
      },
      {
        id: "v2-fil-match", kind: "game", mode: "match",
        prompt: "Match each Filipino phrase with its meaning.",
        pairs: [
          { phrase: "Kumusta?", meaning: "How are you?" },
          { phrase: "Salamat", meaning: "Thank you" },
          { phrase: "Paalam", meaning: "Goodbye" },
        ],
      },
      {
        id: "v2-fil-order", kind: "game", mode: "order",
        prompt: "Arrange the English meaning of ‘Ikinagagalak kitang makilala’.",
        expected: ["Nice", "to", "meet", "you"],
      },
    ],
  },
  en: {
    name: "English", flag: "🇬🇧", accent: "#649ED7", tint: "#EAF3FF",
    tasks: [
      {
        id: "v2-en-greeting", kind: "practice", mode: "choice",
        prompt: "Which English phrase would you say when greeting someone?",
        options: ["Goodbye", "Hello", "Thank you", "I'm sorry"],
        correct: "Hello", spokenWord: "Hello",
      },
      {
        id: "v2-en-thanks", kind: "quiz", mode: "listen",
        prompt: "Listen to the English phrase. What is its purpose?",
        options: ["To apologize", "To greet", "To say farewell", "To thank someone"],
        correct: "To thank someone", spokenWord: "Thank you",
      },
      {
        id: "v2-en-match", kind: "game", mode: "match",
        prompt: "Match each English phrase with its purpose.",
        pairs: [
          { phrase: "Hello", meaning: "Greeting" },
          { phrase: "Thank you", meaning: "Gratitude" },
          { phrase: "Goodbye", meaning: "Farewell" },
        ],
      },
      {
        id: "v2-en-order", kind: "game", mode: "order",
        prompt: "Arrange the words to make a friendly introduction.",
        expected: ["Nice", "to", "meet", "you"],
      },
    ],
  },
};
// ====================== END OF EDITABLE QUESTION BANK ===================

const ALIASES: Record<string, string> = {
  kr: "ko", jp: "ja", cn: "zh", ph: "fil", tl: "fil", gb: "en",
};

function normalizeCode(code: string): string {
  const value = code.trim().toLowerCase().split("-")[0];
  return ALIASES[value] ?? value;
}

const PLAY_COUNTDOWN_STEP_MS = 1000; // Visible 3… 2… 1… before every advance.

const cta =
  "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-[#102452] px-5 py-2.5 text-[12px] font-extrabold text-white shadow-[0_10px_22px_rgba(16,36,82,.13)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3558AE] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3558AE]";

const panel =
  "rounded-[17px] border border-[#E2E9F4] bg-white/95 px-3 py-[clamp(8px,1.55dvh,15px)] text-left text-[clamp(11px,1.6dvh,14px)] font-bold leading-snug transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3558AE]";

function fallbackTasks(words: Word[]): Task[] {
  // Four different translations are necessary to make four valid A/B/C/D choices.
  const distinct = words.filter(
    (item, index, array) =>
      item.word.trim() && item.translation.trim() &&
      array.findIndex((entry) => entry.translation === item.translation) === index,
  );
  if (distinct.length < 4) return [];
  const sample = distinct.slice(0, 4);
  const meanings = sample.map((item) => item.translation) as FourChoices;
  const phrases = sample.map((item) => item.word) as FourChoices;
  return [
    {
      id: `v2-auto-${sample[0].id}`,
      kind: "practice", mode: "choice",
      prompt: `What does ‘${sample[0].word}’ mean?`,
      options: meanings, correct: sample[0].translation,
      spokenWord: sample[0].word,
    },
    {
      id: `v2-auto-listen-${sample[1].id}`,
      kind: "quiz", mode: "listen",
      prompt: "Listen to the phrase. Choose its meaning.",
      options: meanings, correct: sample[1].translation,
      spokenWord: sample[1].word,
    },
    {
      id: `v2-auto-quiz-${sample[2].id}`,
      kind: "quiz", mode: "choice",
      prompt: `Which phrase means ‘${sample[2].translation}’?`,
      options: phrases, correct: sample[2].word,
    },
    {
      id: `v2-auto-match-${sample[3].id}`,
      kind: "game", mode: "match",
      prompt: "Match the phrases to their meanings.",
      pairs: sample.slice(0, 3).map(({ word, translation }) => ({
        phrase: word, meaning: translation,
      })),
    },
  ];
}

function makeBlankPreview(languageId: string, languageCode: string, courseId: string, lessonId: string): GuestPreview {
  return {
    version: 1,
    source: "guest_preview",
    languageId,
    languageCode,
    courseId,
    lessonId,
    answers: [],
    completed: false,
    updatedAt: new Date().toISOString(),
  };
}

// Stable shuffle, so a puzzle will not change after the component re-renders.
function shuffledTokens(task: OrderTask): { key: number; value: string }[] {
  // Keys 0..expected.length-1 refer to the correct sentence; any further
  // keys are distractors. We shuffle once per task, not on every click.
  const words = [...task.expected, ...(task.distractors ?? [])];
  const items = words.map((value, key) => ({ key, value }));
  let seed = Array.from(task.id).reduce(
    (number, char) => (number * 31 + char.charCodeAt(0)) >>> 0,
    7,
  );
  for (let i = items.length - 1; i > 0; i -= 1) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  if (items.length > 1 && items.every((item, index) => item.key === index)) {
    items.reverse();
  }
  return items;
}

function PreviewAnimations() {
  return (
    <style jsx global>{`
      @keyframes ac-preview-enter { from { opacity: 0; transform: translateX(18px) scale(.985); } to { opacity: 1; transform: translateX(0) scale(1); } }
      @keyframes ac-preview-pop { 0% { transform: scale(.94); } 65% { transform: scale(1.06); } 100% { transform: scale(1); } }
      @keyframes ac-preview-celebrate { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
      .ac-preview-enter { animation: ac-preview-enter .35s cubic-bezier(.2,.8,.2,1) both; }
      .ac-preview-pop { animation: ac-preview-pop .25s ease-out both; }
      .ac-preview-celebrate { animation: ac-preview-celebrate 2.4s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) { .ac-preview-enter, .ac-preview-pop, .ac-preview-celebrate { animation: none !important; } }
    `}</style>
  );
}

export default function GuestPreviewActivities(props: Props) {
  const { languageId, languageCode, courseId, lessonId, words, onComplete } = props;
  const normalizedCode = normalizeCode(languageCode);
  const pack = LANGUAGE_QUIZZES[normalizedCode];
  const tasks = useMemo(
    () => pack?.tasks ?? fallbackTasks(words),
    [pack, words],
  );

  const [state, setState] = useState<GuestPreview | null>(null);
  const [choiceAnswer, setChoiceAnswer] = useState<string | null>(null);
  const [pickedPhrase, setPickedPhrase] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [matchMistakes, setMatchMistakes] = useState(0);
  const [matchMessage, setMatchMessage] = useState("");
  const [orderedKeys, setOrderedKeys] = useState<number[]>([]);
  const [orderChecked, setOrderChecked] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Shared native-phrase audio for both matching tiles and word puzzles.
  // An uploaded MP3 takes priority over the browser's language voice.
  const matchAudioRef = useRef<HTMLAudioElement | null>(null);
  const matchSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const matchPlayIdRef = useRef(0);
  const [matchAudioNotice, setMatchAudioNotice] = useState("");

  const stopMatchAudio = useCallback(() => {
    matchPlayIdRef.current += 1;
    if (matchAudioRef.current) {
      matchAudioRef.current.pause();
      matchAudioRef.current = null;
    }
    if (matchSpeechRef.current && "speechSynthesis" in window) {
      matchSpeechRef.current = null;
      window.speechSynthesis.cancel();
    }
  }, []);

  // Respect existing ACELINGUA audio/microphone exclusivity events.
  // Cleanup also prevents a phrase continuing after navigating away.
  useEffect(() => {
    const stopForOtherAudio = () => stopMatchAudio();
    window.addEventListener("acelingua:audio-starting", stopForOtherAudio);
    window.addEventListener("acelingua:microphone-starting", stopForOtherAudio);
    window.addEventListener("acelingua:voice-playback-starting", stopForOtherAudio);
    return () => {
      window.removeEventListener("acelingua:audio-starting", stopForOtherAudio);
      window.removeEventListener("acelingua:microphone-starting", stopForOtherAudio);
      window.removeEventListener("acelingua:voice-playback-starting", stopForOtherAudio);
      stopMatchAudio();
    };
  }, [stopMatchAudio]);

  async function playMatchPhrase(phrase: string) {
    // Stop the other ACELINGUA audio players before starting a new phrase.
    window.dispatchEvent(new Event("acelingua:audio-starting"));
    setMatchAudioNotice("");
    const currentPlayId = matchPlayIdRef.current;

    const recording = recordingFor(normalizedCode, phrase);
    if (recording) {
      const audio = new Audio(recording);
      matchAudioRef.current = audio;
      audio.onended = () => {
        if (matchAudioRef.current === audio) matchAudioRef.current = null;
      };
      try {
        await audio.play();
        return;
      } catch {
        if (matchPlayIdRef.current !== currentPlayId) return;
        matchAudioRef.current = null;
        // Missing/broken MP3: try a browser voice for the same language.
      }
    }

    if (!("speechSynthesis" in window)) {
      setMatchAudioNotice("No playable audio. Add an MP3 in lib/voice-learning.ts.");
      return;
    }
    const locale = languageLocales[normalizedCode];
    const voice = locale
      ? matchingVoice(window.speechSynthesis.getVoices(), locale)
      : null;
    if (!voice || !locale) {
      setMatchAudioNotice("No voice found. Add this phrase's MP3 in lib/voice-learning.ts.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = locale;
    utterance.voice = voice;
    utterance.rate = 0.9;
    matchSpeechRef.current = utterance;
    utterance.onend = () => {
      if (matchSpeechRef.current === utterance) matchSpeechRef.current = null;
    };
    utterance.onerror = () => {
      if (matchSpeechRef.current === utterance) {
        matchSpeechRef.current = null;
        setMatchAudioNotice("Unable to play the phrase. Please add an MP3 recording.");
      }
    };
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      matchSpeechRef.current = null;
      setMatchAudioNotice("Unable to play the phrase. Please add an MP3 recording.");
    }
  }

  const activeIndex = state
    ? tasks.findIndex((item) => !state.answers.some((answer) => answer.id === item.id))
    : -1;
  const task = activeIndex >= 0 ? tasks[activeIndex] : undefined;
  const orderTokens = useMemo(
    () => task?.mode === "order" ? shuffledTokens(task) : [],
    [task],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      let saved: GuestPreview | null = null;
      try {
        saved = readPreview();
      } catch {
        // Browsers with disabled storage can still render the preview.
      }

      const validIds = new Set(tasks.map((item) => item.id));
      const compatible = Boolean(
        saved && saved.lessonId === lessonId &&
        saved.languageId === languageId &&
        saved.courseId === courseId &&
        saved.answers.every((answer) => validIds.has(answer.id)) &&
        (!saved.completed || tasks.every((item) =>
          saved!.answers.some((answer) => answer.id === item.id))),
      );
      const next = compatible && saved ? saved : makeBlankPreview(languageId, languageCode, courseId, lessonId);
      if (!compatible) {
        // Replace progress from the old question bank with the new task format.
        try { writePreview(next); } catch { /* Show storage error when saving. */ }
      }
      if (!cancelled) setState(next);
    });
    return () => { cancelled = true; };
  }, [languageId, languageCode, courseId, lessonId, tasks]);

  function resetControls() {
    setChoiceAnswer(null);
    setPickedPhrase(null);
    setMatched([]);
    setMatchMistakes(0);
    setMatchMessage("");
    setMatchAudioNotice("");
    stopMatchAudio();
    setOrderedKeys([]);
    setOrderChecked(false);
    setCountdown(null);
  }

  function chooseMatch(meaningIndex: number) {
    if (!task || task.mode !== "match" || pickedPhrase === null) return;
    if (matched.includes(meaningIndex)) return;
    if (pickedPhrase === meaningIndex) {
      setMatched((current) => [...current, meaningIndex]);
      setMatchMessage("Nice match! Keep going.");
      if (matched.length + 1 === task.pairs.length) {
        setCountdown(3); // Start the countdown after completing all pairs.
      }
    } else {
      setMatchMistakes((current) => current + 1);
      setMatchMessage("Not quite. Pick a phrase and try another meaning.");
    }
    setPickedPhrase(null);
  }

  function saveAnswer() {
    if (!state || !task) return;
    let answer = "";
    let isCorrect = false;

    if (task.mode === "choice" || task.mode === "listen") {
      if (choiceAnswer === null) return;
      answer = choiceAnswer;
      isCorrect = answer === task.correct;
    } else if (task.mode === "match") {
      if (matched.length !== task.pairs.length) return;
      answer = `Matched ${matched.length} pairs; ${matchMistakes} mistakes`;
      isCorrect = matchMistakes === 0;
    } else if (task.mode === "order") {
      if (!orderChecked || orderedKeys.length !== task.expected.length) return;
      answer = orderedKeys.map((key) => orderTokens.find((item) => item.key === key)?.value ?? "").join(" ");
      isCorrect = orderedKeys.every((index, position) => index === position);
    }

    const answers: PreviewAnswer[] = [
      ...state.answers.filter((item) => item.id !== task.id),
      { id: task.id, kind: task.kind, answer, correct: isCorrect },
    ];
    const completed = tasks.every((item) => answers.some((result) => result.id === item.id));
    const updated: GuestPreview = {
      ...state,
      answers,
      completed,
      updatedAt: new Date().toISOString(),
    };
    try {
      writePreview(updated);
      if (completed) {
        localStorage.setItem("acelingua_selected_language_id", languageId);
        localStorage.setItem("acelingua_selected_language", languageCode);
        localStorage.setItem("acelingua_onboarding_started", "true");
        localStorage.setItem("acelingua_intro_completed", "true");
        localStorage.setItem("acelingua_intro_lesson_id", lessonId);
      }
      setState(updated);
      resetControls();
      setError("");
      if (completed) onComplete();
    } catch {
      setCountdown(null);
      setError("Could not save your answer. Enable browser storage and try again.");
    }
  }

  // Run the countdown once the learner has answered. No Next activity click.
  // Each tick has a one-second delay: 3 -> 2 -> 1 -> next slide.
  // saveAnswer is the current render's function; it captures the latest task
  // and selected answer. When the countdown ticks, the component re-renders.
  useEffect(() => {
    if (countdown === null) return;
    const timer = window.setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        saveAnswer();
      }
    }, PLAY_COUNTDOWN_STEP_MS);
    return () => window.clearTimeout(timer);
    // The countdown and current task identity control this timer. Other
    // state changes must not restart the one-second tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, task?.id]);

  const results = state ? previewResults(state) : null;
  const progress = tasks.length && state ? (state.answers.length / tasks.length) * 100 : 0;
  const kindLabel = task?.mode === "listen" ? "Listen & choose"
    : task?.mode === "match" ? "Matching game"
      : task?.mode === "order" ? "Word puzzle"
        : task?.kind === "quiz" ? "Quick quiz" : "Practice";
  const KindIcon = task?.mode === "listen" ? Headphones
    : task?.mode === "match" || task?.mode === "order" ? Puzzle
      : task?.kind === "quiz" ? Trophy : Sparkles;
  const theme = {
    "--ace-preview-accent": pack?.accent ?? "#3558AE",
    "--ace-preview-tint": pack?.tint ?? "#EAF3FF",
  } as CSSProperties;

  if (!state) {
    return <div role="status" className="flex h-full items-center justify-center text-sm font-semibold text-[#8190A8]">Preparing your activities...</div>;
  }

  if (!tasks.length) {
    return (
      <div className="mx-auto flex h-full max-w-[460px] flex-col items-center justify-center gap-3 text-center">
        <Gamepad2 size={30} className="text-[#7E98C6]" />
        <h2 className="text-lg font-black text-[#102452]">Preview questions aren't ready yet.</h2>
        <p className="text-sm text-[#7A8AA4]">Add questions for this language in LANGUAGE_QUIZZES in GuestPreviewActivities.tsx, or provide at least four vocabulary entries with different translations.</p>
      </div>
    );
  }

  if (state.completed || !task) {
    return (
      <div style={theme} className="ac-preview-enter mx-auto flex h-full min-h-0 w-full max-w-[530px] flex-col items-center justify-center gap-[clamp(7px,1.35dvh,14px)] text-center">
        <PreviewAnimations />
        <div className="ac-preview-celebrate grid h-[clamp(55px,9dvh,84px)] w-[clamp(55px,9dvh,84px)] place-items-center rounded-[24px] bg-[#FFF4D9]">
          <Trophy className="h-1/2 w-1/2 text-[#D99A39]" />
        </div>
        <span className="rounded-full bg-[#EAF7EF] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#39835B]">Adventure complete!</span>
        <h2 className="text-[clamp(23px,4dvh,36px)] font-black leading-tight tracking-tight text-[#102452]">You did it! 🎉</h2>
        <div className="flex items-center gap-1 text-[#E7AC3F]" aria-label={`${results?.stars ?? 0} stars`}>
          {Array.from({ length: results?.stars ?? 0 }, (_, index) => <Star key={index} size={22} fill="currentColor" />)}
        </div>
        <p className="text-[clamp(11px,1.7dvh,14px)] font-semibold text-[#7487A5]">Quiz score: {results?.score ?? 0}% · {results?.correct ?? 0} correct answers</p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-extrabold text-[#647B9B]">
          <span className="rounded-full bg-[#F0F6FF] px-3 py-1.5">+{results?.xp ?? 0} preview XP</span>
          <span className="rounded-full bg-[#FFF5E5] px-3 py-1.5">+{results?.coins ?? 0} preview coins</span>
        </div>
        <p className="max-w-sm text-[clamp(11px,1.7dvh,14px)] leading-relaxed text-[#7D8CA4]">Create your free account to continue the adventure and save new progress.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/register" className={cta}>Create Free Account <ArrowRight size={15} /></Link>
          <Link href="/login" className="text-[12px] font-extrabold text-[#3558AE] underline-offset-4 hover:underline">Already have an account?</Link>
        </div>
        <p className="ac-optional max-w-sm text-[10px] leading-4 text-[#99A5B6]">Preview rewards are for practice. Real XP and coins are earned in full lessons.</p>
      </div>
    );
  }

  const isChoice = task.mode === "choice" || task.mode === "listen";
  const choiceIsCorrect = isChoice && choiceAnswer === task.correct;
  const orderResult = task.mode === "order" ? orderedKeys.every((key, index) => key === index) : false;
  const readyToCheckOrder = task.mode === "order" && orderedKeys.length === task.expected.length;

  return (
    <div style={theme} className="mx-auto flex h-full min-h-0 w-full max-w-[550px] flex-col justify-center gap-[clamp(6px,1.05dvh,11px)] text-[#102452]">
      <PreviewAnimations />

      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="inline-flex min-w-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.08em]" style={{ color: pack?.accent ?? "#3558AE", background: pack?.tint ?? "#EAF3FF" }}>
            <KindIcon size={13} /> {kindLabel}
          </span>
          <span className="hidden text-[11px] font-bold text-[#7A8CA8] sm:inline">{pack?.flag} {pack?.name ?? "Language"}</span>
        </div>
        <span className="shrink-0 text-[11px] font-extrabold text-[#8291A9]">{state.answers.length + 1} / {tasks.length}</span>
      </div>

      <div className="h-1.5 shrink-0 overflow-hidden rounded-full bg-[#E7EDF6]" aria-label="Activity progress">
        <div className="h-full rounded-full bg-[#3558AE] transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>

      <section key={task.id} className="ac-preview-enter flex min-h-0 flex-col gap-[clamp(7px,1.2dvh,12px)]">
        <h2 className="text-[clamp(17px,3dvh,26px)] font-black leading-[1.2] tracking-tight">{task.prompt}</h2>

        {isChoice && (
          <>
            {task.spokenWord && (
              <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-[14px] border border-[#E7EDF8] bg-[#F4F8FF] px-3 py-1.5">
                <AutoPhraseSpeech key={`autoplay-${task.id}`} languageCode={languageCode} text={task.spokenWord} />
                <LanguageAudio key={`manual-audio-${task.id}`} languageCode={languageCode} text={task.spokenWord} hideText compact />
                <span className="text-[10px] font-bold text-[#6C82A2]">Audio plays automatically · Tap Listen to replay</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-[clamp(6px,1dvh,10px)]" role="group" aria-label="Answer choices">
              {task.options.map((option, index) => {
                const chosen = choiceAnswer === option;
                const correct = choiceAnswer !== null && option === task.correct;
                return (
                  <button
                    key={`${task.id}-${index}`}
                    type="button"
                    disabled={choiceAnswer !== null}
                    aria-pressed={chosen}
                    onClick={() => {
                      setChoiceAnswer(option);
                      setCountdown(3); // Answer locks; countdown then auto-next.
                    }}
                    className={`${panel} flex min-h-[clamp(41px,6.5dvh,61px)] min-w-0 items-center gap-2 ${correct
                      ? "ac-preview-pop border-[#6CC698] bg-[#ECF9F0] text-[#286B49]"
                      : chosen
                        ? "border-[#EFB5AF] bg-[#FFF0EE] text-[#A85355]"
                        : "text-[#435A7D] hover:-translate-y-0.5 hover:border-[#A5BADC] hover:bg-[#F6F9FF]"}`}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[8px] bg-[#EFF4FB] text-[10px] font-black text-[#7B90AC]">{String.fromCharCode(65 + index)}</span>
                    <span className="min-w-0 flex-1 break-words">{option}</span>
                    {correct ? <Check size={15} className="shrink-0" /> : chosen ? <X size={14} className="shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
            {choiceAnswer !== null && (
              <div role="status" aria-live="polite" className={`rounded-xl px-3 py-2 text-[clamp(11px,1.6dvh,13px)] font-bold ${choiceIsCorrect ? "bg-[#EAF8EF] text-[#317A51]" : "bg-[#FFF3E9] text-[#986544]"}`}>
                {choiceIsCorrect ? "Great job! That's correct." : `Good try! The correct answer is “${task.correct}”.`}
              </div>
            )}
          </>
        )}

        {task.mode === "match" && (
          <>
            <p className="text-[11px] font-semibold text-[#8291A9]">
              Tap a phrase on the left to hear it, then choose its meaning on the right.
              Tap a matched phrase again to replay its audio.
            </p>
            <div className="grid grid-cols-2 gap-[clamp(8px,1.2dvh,13px)]">
              <div className="flex flex-col gap-[clamp(6px,1dvh,9px)]">
                {task.pairs.map((pair, index) => {
                  const done = matched.includes(index);
                  return (
                    <button
                      type="button" key={`left-${index}`}
                      onClick={() => {
                        void playMatchPhrase(pair.phrase);
                        if (!done) {
                          setPickedPhrase(index);
                          setMatchMessage("");
                        }
                      }}
                      aria-label={`Listen to ${pair.phrase}${done ? " again" : " and select for matching"}`}
                      aria-pressed={pickedPhrase === index}
                      className={`${panel} min-h-[clamp(42px,6.2dvh,57px)] text-center ${done
                        ? "border-[#A1DDBA] bg-[#EBF9F0] text-[#4A956B]"
                        : pickedPhrase === index
                          ? "border-[#8E9CE3] bg-[#ECF0FF] text-[#2F4988] shadow-[0_0_0_2px_rgba(92,116,198,.12)]"
                          : "text-[#435A7D] hover:border-[#A5BADC] hover:bg-[#F6F9FF]"}`}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <Volume2 size={15} className="shrink-0" aria-hidden="true" />
                        {pair.phrase}
                        {done && <Check size={13} className="shrink-0" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-[clamp(6px,1dvh,9px)]">
                {[...task.pairs].map((pair, index) => ({ ...pair, index })).reverse().map((pair) => {
                  const done = matched.includes(pair.index);
                  return (
                    <button
                      type="button" key={`right-${pair.index}`}
                      disabled={done || pickedPhrase === null}
                      onClick={() => chooseMatch(pair.index)}
                      className={`${panel} min-h-[clamp(42px,6.2dvh,57px)] text-center ${done
                        ? "border-[#A1DDBA] bg-[#EBF9F0] text-[#4A956B]"
                        : "text-[#435A7D] hover:border-[#A5BADC] hover:bg-[#F6F9FF] disabled:opacity-60"}`}
                    >
                      {done && <Check size={13} className="mr-1 inline" />}{pair.meaning}
                    </button>
                  );
                })}
              </div>
            </div>
            {matchAudioNotice && (
              <p role="status" className="text-[11px] font-semibold text-[#A16A43]">{matchAudioNotice}</p>
            )}
            <p role="status" aria-live="polite" className="min-h-5 text-[11px] font-semibold text-[#667D9A]">
              {matched.length === task.pairs.length
                ? (matchMistakes === 0 ? "Perfect matches!" : `All pairs matched. ${matchMistakes} mistake(s) along the way.`)
                : matchMessage || `${matched.length} of ${task.pairs.length} pairs matched`}
            </p>
          </>
        )}

        {task.mode === "order" && (
          <>
            {task.spokenWord && (
              <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[#E5EAF8] bg-[#F4F8FF] px-3 py-2">
                <AutoPhraseSpeech languageCode={languageCode} text={task.spokenWord} />
                <button
                  type="button"
                  onClick={() => void playMatchPhrase(task.spokenWord!)}
                  className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#CCDAF5] bg-white px-3 text-[12px] font-extrabold text-[#3558AE] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#E9F2FF]"
                  aria-label={`Listen to ${task.spokenWord}`}
                >
                  <Volume2 size={16} aria-hidden="true" /> Listen
                </button>
                <span lang={languageCode} className="text-[12px] font-bold text-[#5E76A0]">{task.spokenWord}</span>
                <span className="text-[10px] font-semibold text-[#8495AD]">Tap Listen to replay the phrase</span>
              </div>
            )}
            {matchAudioNotice && (
              <p role="status" className="text-[11px] font-semibold text-[#A16A43]">{matchAudioNotice}</p>
            )}
            <p className="text-[11px] font-semibold text-[#8291A9]">Choose the jumbled words in the correct order. Extra words may not belong in the answer.</p>
            <div className="rounded-[16px] border-2 border-dashed border-[#BDD0E9] bg-[#F5F9FF] px-3 py-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7085A9]">Your sentence</span>
                <span className="text-[10px] font-extrabold text-[#8DA0BD]">{orderedKeys.length} / {task.expected.length} words</span>
              </div>
              <div className="flex min-h-[clamp(39px,6dvh,58px)] flex-wrap items-center gap-2">
                {orderedKeys.length === 0 && <span className="text-[11px] font-semibold text-[#9AAEC7]">Tap the words below to build your answer...</span>}
                {orderedKeys.map((key) => {
                  const value = orderTokens.find((item) => item.key === key)?.value ?? "";
                  return (
                    <button
                      key={`chosen-${key}`} type="button" disabled={orderChecked}
                      onClick={() => setOrderedKeys((prev) => prev.filter((item) => item !== key))}
                      className="ac-preview-pop rounded-xl border border-[#B5CBED] bg-white px-3 py-2 text-[12px] font-bold text-[#314F86] shadow-sm transition hover:bg-[#EBF3FF] disabled:opacity-80"
                      aria-label={`Remove ${value}`}
                    >
                      {value} <X size={11} className="ml-1 inline" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-[16px] border border-[#E3EAF5] bg-white/90 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#7B8EAA]">Jumbled word bank</p>
              <div className="flex min-h-[clamp(43px,7dvh,65px)] flex-wrap items-center justify-center gap-2">
                {orderTokens.filter((item) => !orderedKeys.includes(item.key)).map((item) => (
                  <button
                    key={`bank-${item.key}`} type="button"
                    disabled={orderChecked || orderedKeys.length >= task.expected.length}
                    onClick={() => setOrderedKeys((prev) => prev.length >= task.expected.length ? prev : [...prev, item.key])}
                    className="rounded-xl border border-[#DCE6F4] bg-[#F7FAFF] px-3 py-2 text-[clamp(11px,1.7dvh,14px)] font-extrabold text-[#435B7F] shadow-sm transition hover:-translate-y-0.5 hover:border-[#8FA9DB] hover:bg-[#E9F2FF] disabled:cursor-not-allowed disabled:opacity-50"
                  >{item.value}</button>
                ))}
              </div>
            </div>
            {orderChecked && (
              <div role="status" aria-live="polite" className={`rounded-xl px-3 py-2 text-[clamp(11px,1.6dvh,13px)] font-bold ${orderResult ? "bg-[#EAF8EF] text-[#317A51]" : "bg-[#FFF3E9] text-[#986544]"}`}>
                {orderResult ? "Great job! The sentence is in the right order." : `Correct order: ${task.expected.join(" ")}.`}
              </div>
            )}
            {!orderChecked && orderedKeys.length > 0 && (
              <button type="button" onClick={() => setOrderedKeys([])} className="inline-flex w-fit items-center gap-1 text-[11px] font-bold text-[#8291A9] hover:text-[#3558AE]"><RotateCcw size={12} /> Clear tiles</button>
            )}
          </>
        )}
      </section>

      {error && <p role="alert" className="text-[11px] font-semibold text-[#B64074]">{error}</p>}
      <div className="flex shrink-0 items-center justify-between gap-2 pt-1">
        <span className="hidden items-center gap-1.5 text-[10px] font-semibold text-[#98A5B7] sm:inline-flex">
          <CheckCircle2 size={13} /> One activity at a time
        </span>
        {countdown !== null ? (
          <div role="status" aria-live="polite" className="ml-auto inline-flex items-center gap-3 rounded-full border border-[#C6D6F1] bg-[#F0F5FF] px-4 py-2 text-[12px] font-extrabold text-[#3558AE]">
            <span>{activeIndex === tasks.length - 1 ? "Finishing in" : "Next activity in"}</span>
            <span key={countdown} className="ac-preview-pop text-xl font-black tabular-nums text-[#102452]">{countdown}</span>
          </div>
        ) : error ? (
          <button type="button" className={`${cta} ml-auto`} onClick={saveAnswer}>
            Retry save <ArrowRight size={15} />
          </button>
        ) : task.mode === "order" && !orderChecked ? (
          <button type="button" className={`${cta} ml-auto`} disabled={!readyToCheckOrder}
            onClick={() => { setOrderChecked(true); setCountdown(3); }}>
            Check answer <Check size={15} />
          </button>
        ) : (
          <span className="ml-auto text-[11px] font-bold text-[#8A9AB2]">
            {task.mode === "match" ? "Match all phrases to continue" : "Choose an answer to continue automatically"}
          </span>
        )}
      </div>
    </div>
  );
}
