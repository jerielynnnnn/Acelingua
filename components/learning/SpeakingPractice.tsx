"use client";
import { useEffect, useRef, useState } from "react";
import { languageLocales, phraseMatches } from "@/lib/voice-learning";
import { startSpeechSession, speechErrorMessage, type RecognitionConstructor } from "@/lib/speech-recognition";
import { withTimeout } from "@/lib/request-timeout";
import LanguageAudio from "./LanguageAudio";

type SpeechWindow = Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };

export default function SpeakingPractice({ text, languageCode }: { text: string; languageCode: string }) {
  const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<"starting" | "listening" | "idle">("idle");
  const listening = phase !== "idle";
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState("");
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const startAttempt = useRef(0);
  const locale = languageLocales[languageCode.toLowerCase()];
  useEffect(() => {
    mounted.current = true;
    const attemptCounter = startAttempt;
    let cancelled = false;
    Promise.resolve().then(() => { const browser = window as SpeechWindow; if (!cancelled) setSupported(Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition)); });
    return () => { cancelled = true; mounted.current = false; attemptCounter.current++; recognitionRef.current?.stop(); busy.current = false; };
  }, []);
  function compare(value: string, source: "Recognition" | "Text practice") {
    setFeedback(phraseMatches(text, value) ? `${source}: the words match the phrase. This is phrase matching, not pronunciation scoring.` : `${source}: the words differ. Listen again and try the phrase once more.`);
  }
  async function start() {
    if (busy.current) return;
    const browser = window as SpeechWindow;
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!window.isSecureContext) { setFeedback("Microphone practice needs HTTPS or localhost. Use text practice on this address."); return; }
    if (!Constructor) { setFeedback("This browser does not provide speech recognition. Use text practice."); return; }
    if (!locale) { setFeedback("Speech recognition is not configured for this language. Use text practice."); return; }
    recognitionRef.current?.stop();
    window.dispatchEvent(new Event("acelingua:microphone-starting"));
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    busy.current = true; setTranscript(""); setFeedback("Starting microphone. Allow access if the browser asks.");
    setPhase("starting");
    const attempt = ++startAttempt.current;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        // Always release the permission-check stream, even after cancellation.
        await withTimeout(navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          stream.getTracks().forEach(track => track.stop());
        }), 15000, "Microphone permission is still pending. Respond to the browser permission prompt, then retry.");
      }
      if (!mounted.current || attempt !== startAttempt.current) return;
      recognitionRef.current = startSpeechSession(Constructor, locale, {
        onState: state => { busy.current = state !== "idle"; if (mounted.current) { setPhase(state); if (state === "listening") setFeedback("Listening. Say the phrase now."); } },
        onResult: value => { if (mounted.current) { setTranscript(value); compare(value, "Recognition"); } },
        onError: message => { if (mounted.current) setFeedback(message); },
      });
    } catch (cause) {
      if (!mounted.current || attempt !== startAttempt.current) return;
      busy.current = false; setPhase("idle");
      const name = cause instanceof Error ? cause.name : "";
      setFeedback(name === "NotAllowedError" || name === "SecurityError" ? speechErrorMessage("not-allowed")
        : name === "NotFoundError" || name === "NotReadableError" ? speechErrorMessage("audio-capture")
        : cause instanceof Error ? cause.message : "The browser could not initialize speech recognition. Use text practice.");
    }
  }

  return <details className="mt-5 rounded-2xl border border-[#C7A9D4]/35 p-4 text-left"><summary className="cursor-pointer text-sm font-bold text-[#3558AE]">Speaking practice</summary><p lang={languageCode} className="mt-4 text-lg font-bold">{text}</p><LanguageAudio languageCode={languageCode} text={text} /><p className="mt-3 text-xs leading-6 text-[#62759C]">Repeat the phrase. Feedback compares recognized words; it does not measure phoneme-level pronunciation.</p>{supported && locale ? <div className="mt-4 flex gap-3"><button type="button" disabled={listening} onClick={start} className="rounded-full bg-[#071A4A] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">{phase === "starting" ? "Starting microphone..." : phase === "listening" ? "Listening..." : "Use microphone"}</button><button type="button" disabled={!listening} onClick={() => { startAttempt.current++; recognitionRef.current?.stop(); busy.current = false; setPhase("idle"); setFeedback("Stopped."); }} className="rounded-full px-4 py-2.5 text-sm font-bold text-[#3558AE]">Stop</button></div> : <p className="mt-3 text-sm">Speech recognition for this language is unavailable in this browser. Use text practice.</p>}{transcript && <p className="mt-4 text-sm">Recognized words: <span lang={languageCode}>{transcript}</span></p>}<form className="mt-4" onSubmit={event => { event.preventDefault(); compare(typed, "Text practice"); }}><label className="block text-xs font-bold">Text alternative<input required value={typed} onChange={event => setTyped(event.target.value)} lang={languageCode} className="mt-2 block w-full rounded-xl border border-[#3558AE]/25 p-3 text-sm" /></label><button type="submit" className="mt-3 text-sm font-bold text-[#3558AE]">Check phrase</button></form><p role="status" aria-live="polite" className="mt-3 text-sm leading-6">{feedback}</p></details>;
}
