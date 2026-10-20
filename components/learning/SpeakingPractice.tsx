"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, CheckCircle2 } from "lucide-react";
import { languageLocales } from "@/lib/voice-learning";
import { speechFeedback } from "@/lib/speech-feedback";
import { startSpeechSession, type RecognitionConstructor } from "@/lib/speech-recognition";
import { startVoiceRecording } from "@/lib/voice-recording";
import { withTimeout } from "@/lib/request-timeout";
import LanguageAudio from "./LanguageAudio";
import styles from "./VoicePractice.module.css";

type SpeechWindow = Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
export default function SpeakingPractice({ text, languageCode, pronunciation, onVerified }: { text: string; languageCode: string; pronunciation?: string | null; onVerified?: (verified: boolean) => void }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<"starting" | "listening" | "processing" | "idle">("idle");
  const [transcript, setTranscript] = useState("");
  const [correction, setCorrection] = useState<ReturnType<typeof speechFeedback> | null>(null);
  const [feedback, setFeedback] = useState(""); const [matched, setMatched] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(""); const [recordingError, setRecordingError] = useState("");
  const recordingRef = useRef<ReturnType<typeof startVoiceRecording> | null>(null);
  const clipUrl = useRef(""); const playback = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<ReturnType<typeof startSpeechSession> | null>(null);
  const busy = useRef(false); const mounted = useRef(false); const attempt = useRef(0);
  const locale = languageLocales[languageCode.toLowerCase()];
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    const urls = clipUrl;
    Promise.resolve().then(() => { const browser = window as SpeechWindow; if (!cancelled) setSupported(Boolean(window.isSecureContext && (browser.SpeechRecognition || browser.webkitSpeechRecognition || (window.MediaRecorder && navigator.mediaDevices?.getUserMedia)))); });
    const cancel = () => { const wasBusy = busy.current; attempt.current++; recognitionRef.current?.stop(); recordingRef.current?.cancel(); playback.current?.pause(); busy.current = false; if (mounted.current) { setPhase("idle"); if (wasBusy) setFeedback("Practice paused. Tap Start speaking when you are ready."); } };
    window.addEventListener("acelingua:audio-starting", cancel);
    window.addEventListener("acelingua:microphone-starting", cancel);
    const otherPlayback = (event: Event) => { if ((event as CustomEvent).detail !== playback.current) cancel(); };
    window.addEventListener("acelingua:voice-playback-starting", otherPlayback);
    return () => { cancelled = true; mounted.current = false; cancel(); if (urls.current) URL.revokeObjectURL(urls.current); urls.current = ""; window.removeEventListener("acelingua:audio-starting", cancel); window.removeEventListener("acelingua:microphone-starting", cancel); window.removeEventListener("acelingua:voice-playback-starting", otherPlayback); };
  }, [text, languageCode]);
  function compare(value: string) {
    const comparison = speechFeedback(text, value); setMatched(comparison.matches); setCorrection(comparison);
    onVerified?.(comparison.matches);
    setFeedback(comparison.matches ? "Nicely done! The recognized words match the phrase." : "Some recognized words differ. Review the highlighted part below, listen again, and repeat the whole phrase.");
  }
  async function start() {
    if (busy.current) return;
    onVerified?.(false);
    const browser = window as SpeechWindow; const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!window.isSecureContext || !locale) { setFeedback("Microphone practice needs a supported browser on HTTPS or localhost."); return; }
    window.dispatchEvent(new Event("acelingua:microphone-starting"));
    const current = ++attempt.current; busy.current = true; setMatched(false); setTranscript(""); setCorrection(null);
    recognitionRef.current = null; recordingRef.current = null;
    if (clipUrl.current) URL.revokeObjectURL(clipUrl.current); clipUrl.current = ""; setRecordingUrl(""); setRecordingError("");
    setFeedback("Allow microphone access if your browser asks."); setPhase("starting");
    const active = () => mounted.current && current === attempt.current;
    try {
      if (window.MediaRecorder && navigator.mediaDevices?.getUserMedia) {
        const stream = await withTimeout(navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          if (!active()) { stream.getTracks().forEach(track => track.stop()); return null; }
          return stream;
        }), 15000, "Microphone permission is still pending. Allow access, then try again.");
        if (!active() || !stream) return;
        recordingRef.current = startVoiceRecording(stream, {
          onReady: clip => { if (active()) { const url = URL.createObjectURL(clip); clipUrl.current = url; setRecordingUrl(url); if (!Constructor) { busy.current = false; setPhase("idle"); setFeedback(onVerified ? "Your recording is ready, but this browser cannot verify spoken words. Open the lesson in a browser with speech recognition to continue." : "Recording ready. Listen back to your voice below."); } } },
          onError: () => { if (active()) setRecordingError("We couldn't capture a playable recording. Please try again."); },
        });
      } else setRecordingError("Voice playback recording is not available in this browser.");
      if (!active()) return;
      if (!Constructor) {
        if (!recordingRef.current) throw new Error("Microphone practice is unavailable.");
        setPhase("listening"); setFeedback("Recording your voice. Tap Done speaking to listen back. Word recognition is unavailable in this browser."); return;
      }
      recognitionRef.current = startSpeechSession(Constructor, locale, {
        onState: state => { if (active()) { busy.current = state !== "idle"; setPhase(state); if (state === "idle") recordingRef.current?.finish(); if (state === "listening") setFeedback("Listening… say the phrase naturally."); } },
        onInterim: value => { if (active()) setTranscript(value); },
        onResult: value => { if (active()) { setTranscript(value); compare(value); } },
        onError: message => { if (active()) { onVerified?.(false); setMatched(false); setCorrection(null); setFeedback(message.replace(/ or use text practice\.?| Use text practice instead\.?| Use text practice\.?/gi, "")); } },
      });
    } catch (cause) { if (!active()) return; attempt.current++; recordingRef.current?.cancel(); busy.current = false; setPhase("idle"); setFeedback(cause instanceof Error && cause.name === "NotAllowedError" ? "Microphone access is blocked. Allow it in your browser's site permissions, then try again." : cause instanceof Error ? cause.message : "The microphone could not start. Please try again."); }
  }
  function finish() { if (phase !== "listening") return; recordingRef.current?.finish(); if (recognitionRef.current) { setPhase("processing"); setFeedback("Checking what you said…"); recognitionRef.current.finish(); } else { busy.current = false; setPhase("idle"); setFeedback("Recording finished. Listen back to your voice below."); } }
  function cancel() { attempt.current++; recognitionRef.current?.stop(); recordingRef.current?.cancel(); busy.current = false; setPhase("idle"); setFeedback("Recording cancelled. Try again when you are ready."); }
  return <section className={styles.speaking} aria-label="Speaking practice">
    <div className={styles.heading}><span className={styles.icon}><Mic size={21} /></span><div><h3>Your turn to speak</h3><p>Listen once, then say the phrase aloud.</p></div></div>
    <div className={styles.target}><p lang={languageCode}>{text}</p><LanguageAudio languageCode={languageCode} text={text} compact /></div>
    <div className={styles.controls}>
      {phase === "idle" ? <button type="button" className={styles.primary} disabled={supported !== true || !locale} onClick={start}><Mic size={17} />{transcript ? "Try speaking again" : "Start speaking"}</button> : <><button type="button" className={styles.primary} disabled={phase !== "listening"} onClick={finish}><Square size={15} />{phase === "starting" ? "Opening microphone…" : phase === "processing" ? "Checking…" : "Done speaking"}</button><button type="button" className={styles.secondary} onClick={cancel}>Cancel</button></>}
      {phase === "listening" && <span className={styles.listening}><span />Microphone is listening</span>}
    </div>
    {transcript && <div className={styles.transcript}><span>You said</span><p lang={languageCode}>{transcript}</p></div>}
    {correction && !correction.matches && <div className={styles.correction} aria-label="Speaking correction"><h4>Try this correction</h4><span>Expected phrase</span><p lang={languageCode}>{correction.expected.before}<mark>{correction.expected.different}</mark>{correction.expected.after}</p>{pronunciation && <p className={styles.reading}>{pronunciation}</p>}<span>Recognized as</span><p lang={languageCode}>{correction.heard.before}<mark>{correction.heard.different || "[missing sound or word]"}</mark>{correction.heard.after}</p><small>Recognition can mishear you. Compare your recording with the model, focus on the highlighted part, then try again.</small></div>}
    {recordingUrl && <div className={styles.recording}><h4>Your voice recording</h4><p>Listen back, then compare with the lesson audio above.</p><audio ref={playback} controls preload="metadata" src={recordingUrl} aria-label="Listen to your voice recording" onPlay={() => window.dispatchEvent(new CustomEvent("acelingua:voice-playback-starting", { detail: playback.current }))} /></div>}
    {recordingError && <p role="status" className={styles.feedback}>{recordingError}</p>}
    <p role="status" aria-live="polite" className={matched ? styles.success : styles.feedback}>{matched && <CheckCircle2 size={16} />}{feedback || (supported === false ? "Microphone practice is unavailable in this browser. You can still listen to the model phrase above." : "Tap Start speaking when you are ready.")}</p>
    <small className={styles.note}>Checks the recognized words. This is not a pronunciation score.</small>
  </section>;
}
