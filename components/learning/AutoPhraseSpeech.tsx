"use client";

import { useEffect } from "react";
import { languageLocales, matchingVoice, recordingFor } from "@/lib/voice-learning";

/**
 * Automatically plays each new learning phrase. No autoplay toggle is needed.
 * An uploaded MP3 from lib/voice-learning.ts has priority; otherwise use a
 * matching browser voice when installed. The existing Listen control stays as
 * a manual replay button.
 */
type Props = { languageCode: string; text: string };
const AUTOPLAY_DELAY_MS = 160;
const CODE_ALIASES: Record<string, string> = {
  kr: "ko", jp: "ja", cn: "zh", ph: "fil", gb: "en", tl: "fil",
};

export default function AutoPhraseSpeech({ languageCode, text }: Props) {
  useEffect(() => {
    const phrase = text.trim();
    if (!phrase || typeof window === "undefined") return;

    const rawCode = languageCode.trim().toLowerCase().split("-")[0];
    const code = CODE_ALIASES[rawCode] ?? rawCode;
    const locale = languageLocales[code];
    let cancelled = false;
    let audio: HTMLAudioElement | null = null;
    let utterance: SpeechSynthesisUtterance | null = null;

    async function playPhrase() {
      if (cancelled) return;
      // Stop other ACELINGUA audio first, avoiding overlapping phrases.
      window.dispatchEvent(new Event("acelingua:audio-starting"));

      const path = recordingFor(code, phrase);
      if (path) {
        audio = new Audio(path);
        audio.preload = "auto";
        try {
          await audio.play();
          if (cancelled) audio.pause();
          return;
        } catch {
          audio.pause();
          audio = null;
          // Broken or blocked MP3: a matching speech voice can be tried.
        }
      }

      if (cancelled || !locale || !('speechSynthesis' in window) ||
          !('SpeechSynthesisUtterance' in window)) return;

      const synthesis = window.speechSynthesis;
      const voice = matchingVoice(synthesis.getVoices(), locale);
      if (!voice) return; // Never pronounce Korean with an English default voice.

      const next = new SpeechSynthesisUtterance(phrase);
      next.lang = locale;
      next.voice = voice;
      next.rate = 0.9;
      next.pitch = 1;
      utterance = next;
      try {
        synthesis.cancel();
        if (!cancelled) synthesis.speak(next);
      } catch {
        // Browser policies or missing voices can block automatic playback.
      }
    }

    const timer = window.setTimeout(() => void playPhrase(), AUTOPLAY_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (audio) audio.pause();
      if (utterance && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [languageCode, text]);

  return null;
}
