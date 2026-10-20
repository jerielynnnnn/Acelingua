"use client";
import { useEffect, useRef, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { languageLocales, matchingVoice, recordingFor } from "@/lib/voice-learning";
import styles from "./VoicePractice.module.css";

type Props = { languageCode: string; text: string; hideText?: boolean; compact?: boolean };
export default function LanguageAudio({ languageCode, text, hideText = false, compact = false }: Props) {
  const locale = languageLocales[languageCode.toLowerCase()]; const recording = recordingFor(languageCode, text);
  const audioRef = useRef<HTMLAudioElement>(null); const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeRef = useRef(false); const playAttempt = useRef(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playing, setPlaying] = useState(false); const [slow, setSlow] = useState(false);
  const [message, setMessage] = useState(""); const [recordingFailed, setRecordingFailed] = useState(false);
  useEffect(() => {
    const attemptCounter = playAttempt;
    const audioElement = audioRef.current;
    const cancel = () => {
      playAttempt.current++; audioRef.current?.pause(); utteranceRef.current = null;
      if (activeRef.current && "speechSynthesis" in window) window.speechSynthesis.cancel();
      activeRef.current = false; setPlaying(false);
    };
    window.addEventListener("acelingua:microphone-starting", cancel); window.addEventListener("acelingua:audio-starting", cancel);
    window.addEventListener("acelingua:voice-playback-starting", cancel);
    return () => { window.removeEventListener("acelingua:microphone-starting", cancel); window.removeEventListener("acelingua:audio-starting", cancel); window.removeEventListener("acelingua:voice-playback-starting", cancel); attemptCounter.current++; audioElement?.pause(); utteranceRef.current = null; if (activeRef.current && "speechSynthesis" in window) window.speechSynthesis.cancel(); activeRef.current = false; };
  }, [text, languageCode]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", refresh); Promise.resolve().then(refresh);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, []);
  const voice = locale ? matchingVoice(voices, locale) : null;
  const useRecording = Boolean(recording && !recordingFailed); const available = useRecording || Boolean(voice);
  function stop() { playAttempt.current++; audioRef.current?.pause(); utteranceRef.current = null; if (activeRef.current && "speechSynthesis" in window) window.speechSynthesis.cancel(); activeRef.current = false; setPlaying(false); }
  async function play() {
    window.dispatchEvent(new Event("acelingua:audio-starting")); setMessage("");
    const attempt = ++playAttempt.current;
    if (useRecording && audioRef.current) {
      const audio = audioRef.current; audio.currentTime = 0; audio.playbackRate = slow ? 0.75 : 1;
      try { await audio.play(); if (attempt === playAttempt.current) setPlaying(true); }
      catch { if (attempt === playAttempt.current) { setMessage("Recording unavailable. Tap Listen to retry with a language voice, if available."); setRecordingFailed(true); setPlaying(false); } }
    } else if (voice && locale && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text); utterance.voice = voice; utterance.lang = locale; utterance.rate = slow ? 0.75 : 1;
      utterance.onstart = () => { if (utteranceRef.current === utterance) setPlaying(true); };
      utterance.onend = () => { if (utteranceRef.current === utterance) { activeRef.current = false; setPlaying(false); } };
      utterance.onerror = () => { if (utteranceRef.current === utterance) { activeRef.current = false; setPlaying(false); setMessage("Audio could not play. Please try again."); } };
      utteranceRef.current = utterance; activeRef.current = true; setPlaying(true);
      try { window.speechSynthesis.speak(utterance); } catch { activeRef.current = false; setPlaying(false); setMessage("Audio could not start. Please try again."); }
    }
  }
  return <div className={compact ? styles.compactAudio : styles.audio}>
    {useRecording && <audio ref={audioRef} src={recording!} preload="none" onEnded={() => setPlaying(false)} onError={() => { setRecordingFailed(true); setPlaying(false); setMessage("This recording is unavailable."); }} />}
    {!compact && <div className={styles.audioLabel}><Volume2 size={17} /><span>Listen to the phrase</span>{!hideText && <span className="sr-only" lang={languageCode}>{text}</span>}</div>}
    <div className={styles.audioControls}><button type="button" className={styles.listenButton} disabled={!available} aria-label={playing ? "Stop audio" : hideText ? "Listen to the phrase" : "Listen to " + text} onClick={() => { if (playing) stop(); else void play(); }}>{playing ? <Square size={16} /> : <Volume2 size={18} />}{playing ? "Stop" : "Listen"}</button>
      {!compact && <button type="button" className={styles.speed} disabled={!available || playing} aria-pressed={slow} onClick={() => setSlow(!slow)}>{slow ? "Slow · 0.75×" : "Normal · 1×"}</button>}
    </div>
    {(!available || message) && <p role="status" className={styles.feedback}>{message || "No audio voice for this language is installed in this browser."}</p>}
    {!compact && available && !message && <small className={styles.note}>{useRecording ? "Recorded audio" : "Browser language voice"}</small>}
  </div>;
}
