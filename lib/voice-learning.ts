
/* =========================================================
   ACELINGUA — VOICE LEARNING CONFIGURATION
   File: lib/voice-learning.ts
========================================================= */

/* =========================================================
   1. LANGUAGE LOCALES
========================================================= */

export const languageLocales: Record<string, string> = {
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  th: "th-TH",
  en: "en-US",
  fil: "fil-PH",
  tl: "fil-PH",
};

/* =========================================================
   2. MP3 AUDIO RECORDINGS

   FORMAT:
   "Native phrase": "/audio/language/filename.mp3"

   Example:
   "こんにちは": "/audio/ja/konnichiwa.mp3"

   All entries below are intentionally empty.
========================================================= */

const recordings: Record<string, Record<string, string>> = {

  // JAPANESE
  ja: {
    // Add Japanese MP3 paths here
    "こんばんは": "/audio/ja/konbanwa.mp3",
  },

  // KOREAN
  ko: {
    // Add Korean MP3 paths here
    "안녕하세요": "/audio/ko/annyeonghaseyo.mp3","안녕히 가세요": "/audio/ko/annyeonghigaseyo.mp3", 
    "좋은 아침이에요": "/audio/ko/joeun achimieyo.mp3", "감사합니다": "/audio/ko/gamsamhamnida.mp3",
    "처음 뵙겠습니다": "/audio/ko/cheoeum boepgetseumnida.mp3"
  },

  // CHINESE (MANDARIN)
  zh: {
    // Add Chinese MP3 paths here
  },

  // SPANISH
  es: {
    // Add Spanish MP3 paths here
  },

  // FRENCH
  fr: {
    // Add French MP3 paths here
  },

  // GERMAN
  de: {
    // Add German MP3 paths here
  },

  // THAI
  th: {
    // Add Thai MP3 paths here
  },

  // ENGLISH
  en: {
    // Add English MP3 paths here
  },

  // FILIPINO / TAGALOG
  fil: {
    // Add Filipino MP3 paths here
  },

  tl: {
    // Add Tagalog MP3 paths here
  },

};

/* =========================================================
   3. GET AUDIO RECORDING
========================================================= */

export function recordingFor(
  code: string,
  text: string
): string | null {
  const normalizedCode = code.toLowerCase().trim();

  return (
    recordings[normalizedCode]?.[text.trim()] ??
    null
  );
}

/* =========================================================
   4. MATCH BROWSER LANGUAGE VOICE
========================================================= */

export function matchingVoice<T extends { lang: string }>(
  voices: T[],
  locale: string
): T | null {
  const normalized = locale
    .toLowerCase()
    .replaceAll("_", "-");

  const language = normalized.split("-")[0];

  return (
    voices.find(
      (v) =>
        v.lang.toLowerCase().replaceAll("_", "-") ===
        normalized
    ) ??
    voices.find((v) => {
      const candidate = v.lang
        .toLowerCase()
        .replaceAll("_", "-");

      if (language === "zh") {
        return [
          "zh",
          "zh-cn",
          "zh-tw",
          "zh-sg",
          "zh-hans",
          "zh-hant",
        ].includes(candidate);
      }

      return candidate.split("-")[0] === language;
    }) ??
    null
  );
}

/* =========================================================
   5. MATCHING WORD TYPES
========================================================= */

export type MatchWord = {
  id: string;
  word: string;
  translation: string;
};

const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();

/* =========================================================
   6. UNIQUE MATCH WORDS
========================================================= */

export function uniqueMatchWords<T extends MatchWord>(
  words: T[]
): T[] {
  return words
    .filter(
      (word) =>
        word.word.trim() &&
        word.translation.trim() &&
        words.filter(
          (other) => other.id === word.id
        ).length === 1 &&
        words.filter(
          (other) =>
            normalize(other.word) ===
            normalize(word.word)
        ).length === 1 &&
        words.filter(
          (other) =>
            normalize(other.translation) ===
            normalize(word.translation)
        ).length === 1
    )
    .slice(0, 6);
}

/* =========================================================
   7. PHRASE MATCHING
========================================================= */

export function phraseMatches(
  expected: string,
  recognized: string
): boolean {
  const normalizePhrase = (text: string) =>
    text
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/[\p{P}\p{Z}\s]/gu, "");

  return (
    Boolean(recognized.trim()) &&
    normalizePhrase(expected) ===
      normalizePhrase(recognized)
  );
}

/* =========================================================
   8. SHUFFLE ITEMS
========================================================= */

export function shuffled<T>(
  items: T[],
  random: () => number = Math.random
): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}
