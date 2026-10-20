"use client";

import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Square, Volume2 } from "lucide-react";
import { languageLocales, matchingVoice, recordingFor } from "@/lib/voice-learning";

type Props = { languageCode: string; text: string; hideText?: boolean; compact?: boolean };
export default function LanguageAudio({ languageCode, text, hideText = false, compact = false }: Props) {
  const locale = languageLocales[languageCode.toLowerCase()];
  const recording = recordingFor(languageCode, text);
  const audioRef = useRef<HTMLAudioElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeRef = useRef(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState("");
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [message, setMessage] = useState("");
  const [recordingFailed, setRecordingFailed] = useState(false);
  useEffect(() => {
    const stopForMicrophone = () => {
      audioRef.current?.pause();
      utteranceRef.current = null;
      if (activeRef.current && "speechSynthesis" in window) window.speechSynthesis.cancel();
      activeRef.current = false; setPlaying(false);
    };
    window.addEventListener("acelingua:microphone-starting", stopForMicrophone);
    return () => window.removeEventListener("acelingua:microphone-starting", stopForMicrophone);
  }, []);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    Promise.resolve().then(refresh);
    return () => { window.speechSynthesis.removeEventListener("voiceschanged", refresh); };
  }, []);
  useEffect(() => () => {
    audioRef.current?.pause();
    utteranceRef.current = null;
    if (activeRef.current && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, [text, languageCode]);
  const availableVoices = locale ? voices.filter(v => matchingVoice([v], locale)) : [];
  const voice = availableVoices.find(v => v.voiceURI === voiceUri) ?? (locale ? matchingVoice(voices, locale) : null);
  const useRecording = Boolean(recording && !recordingFailed);
  const available = useRecording || Boolean(voice);
  function stop() {
    audioRef.current?.pause();
    utteranceRef.current = null;
    if (activeRef.current && "speechSynthesis" in window) window.speechSynthesis.cancel();
    activeRef.current = false; setPlaying(false);
  }
  async function play() {
    stop(); setMessage("");
    if (useRecording && audioRef.current) {
      const audio = audioRef.current;
      audio.currentTime = 0; audio.playbackRate = slow ? 0.75 : 1;
      try { await audio.play(); setPlaying(true); }
      catch { setMessage("The recording could not play. Try again or use an available synthesized voice."); setRecordingFailed(true); }
    } else if (voice && locale && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice; utterance.lang = locale; utterance.rate = slow ? 0.75 : 1;
      utterance.onstart = () => { if (utteranceRef.current === utterance) setPlaying(true); };
      utterance.onend = () => { if (utteranceRef.current === utterance) { activeRef.current = false; setPlaying(false); } };
      utterance.onerror = () => { if (utteranceRef.current === utterance) { activeRef.current = false; setPlaying(false); setMessage("Synthesized speech could not play. Try again."); } };
      utteranceRef.current = utterance; activeRef.current = true;
      window.speechSynthesis.speak(utterance);
    }
  }
  const control = "inline-flex items-center gap-2 rounded-full border border-[#3558AE]/20 bg-white px-4 py-2 text-sm font-bold text-[#3558AE] disabled:opacity-40";
  if (compact) return <div className="inline-flex flex-col items-start gap-1">
    {useRecording && <audio ref={audioRef} src={recording!} preload="none" onEnded={() => setPlaying(false)} onError={() => { setRecordingFailed(true); setPlaying(false); }} />}
    <button type="button" aria-label={"Listen to " + text} disabled={!available} onClick={() => void play()}><Volume2 size={16} /><span className="sr-only">Listen</span></button>
    {message && <span role="status" className="text-xs">{message}</span>}
    {!available && <span className="text-[10px]">Audio unavailable</span>}
  </div>;
  return <div className="mt-5 rounded-2xl bg-[#EAF5FF] p-4 text-left">
    <p className="flex items-center gap-2 text-sm font-bold"><Volume2 size={18} /> Listen{!hideText && <span lang={locale}>{text}</span>}</p>
    {useRecording && <audio ref={audioRef} src={recording!} preload="none" onEnded={() => setPlaying(false)} onError={() => { setRecordingFailed(true); setPlaying(false); }} />}
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={control} disabled={!available} onClick={() => void play()}><Play size={15} />Play</button><button type="button" className={control} disabled={!playing} onClick={stop}><Square size={15} />Stop</button><button type="button" className={control} disabled={!available} onClick={() => void play()}><RotateCcw size={15} />Replay</button><button type="button" className={control} disabled={!available || playing} aria-pressed={slow} onClick={() => setSlow(!slow)}>{slow ? "0.75× Slow" : "1× Normal"}</button></div>
    {!useRecording && availableVoices.length > 1 && <label className="mt-3 block text-xs">Synthesized voice<select value={voice?.voiceURI ?? ""} onChange={event => setVoiceUri(event.target.value)} disabled={playing} className="ml-2 max-w-full rounded-lg bg-white p-2">{availableVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}</select></label>}
    <p role="status" aria-live="polite" className="mt-3 text-xs leading-5 text-[#62759C]">{message || (playing ? "Playing…" : useRecording ? "Stored audio recording. Tap Play to listen." : voice ? "Browser-synthesized speech; not a native-speaker recording." : "No recording or suitable language voice is available in this browser.")}</p>
  </div>;
}
