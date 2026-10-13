export type SpeechRecognitionEngine = {
  lang: string; continuous: boolean; interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { resultIndex?: number; results: { length?: number; [index: number]: { isFinal?: boolean; [index: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; abort: () => void;
};
export type RecognitionConstructor = new () => SpeechRecognitionEngine;
export function speechErrorMessage(code: string) {
  const errors: Record<string, string> = {
    "not-allowed": "Microphone access is blocked. Allow Microphone in this site's browser permissions, then retry.",
    "service-not-allowed": "This browser's speech recognition service is blocked or unavailable. Try another supported browser or use text practice.",
    "audio-capture": "No working microphone was found. Check your input device and operating-system microphone permissions, then retry.",
    "network": "The browser could not reach its speech recognition service. Check your connection or use text practice.",
    "no-speech": "No speech was detected. Move closer to your microphone and try again.",
    "language-not-supported": "The recognition service doesn't support this language. Use text practice instead.",
    "language-unavailable": "Speech recognition for this language is unavailable. Use text practice instead.",
    "aborted": "Recognition stopped. You can try again.",
  };
  return errors[code] ?? "Speech recognition could not finish. Try again or use text practice.";
}
// Isolated lifecycle so browser failures, silence, and late callbacks are testable.
export function startSpeechSession(Constructor: RecognitionConstructor, locale: string, callbacks: {
  onState: (state: "starting" | "listening" | "idle") => void;
  onResult: (text: string) => void; onError: (message: string) => void;
}, timeoutMs = 20000) {
  const recognition = new Constructor();
  let stopped = false;
  const timer = setTimeout(() => fail("Speech recognition timed out. Check microphone permission and your connection, then retry."), timeoutMs);
  function cleanup() {
    if (stopped) return;
    stopped = true; clearTimeout(timer);
    recognition.onstart = null; recognition.onresult = null; recognition.onerror = null; recognition.onend = null;
    try { recognition.abort(); } catch { /* Already stopped. */ }
    callbacks.onState("idle");
  }
  function fail(message: string) { if (!stopped) { cleanup(); callbacks.onError(message); } }
  recognition.lang = locale; recognition.continuous = false; recognition.interimResults = false;
  recognition.onstart = () => { if (!stopped) callbacks.onState("listening"); };
  recognition.onresult = event => {
    if (stopped) return;
    const index = event.resultIndex ?? 0;
    const result = event.results[index];
    if (result?.isFinal === false) return;
    const text = result?.[0]?.transcript?.trim() ?? "";
    if (!text) { fail("No words were recognized. Try again or use text practice."); return; }
    cleanup(); callbacks.onResult(text);
  };
  recognition.onerror = event => fail(speechErrorMessage(event.error));
  recognition.onend = () => fail("The microphone stopped without recognizing words. Try again or use text practice.");
  callbacks.onState("starting");
  try { recognition.start(); }
  catch (cause) { fail(cause instanceof Error && cause.name === "NotAllowedError" ? speechErrorMessage("not-allowed") : "Microphone practice could not start. Retry or use text practice."); }
  return { stop: cleanup };
}
