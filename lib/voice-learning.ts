export const languageLocales: Record<string, string> = {
  ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", es: "es-ES", fr: "fr-FR", de: "de-DE", th: "th-TH",
  en: "en-US", fil: "fil-PH", tl: "fil-PH",
};
// Existing project recordings, matched to native phrases rather than translations.
const recordings: Record<string, Record<string, string>> = {
  ko: { "안녕하세요": "/audio/ko/annyeonghaseyo.mp3", "안녕히 가세요": "/audio/ko/annyeonghigaseyo.mp3" },
};
export function recordingFor(code: string, text: string) { return recordings[code.toLowerCase()]?.[text.trim()] ?? null; }
export function matchingVoice<T extends { lang: string }>(voices: T[], locale: string): T | null {
  const normalized = locale.toLowerCase().replaceAll("_", "-");
  const language = normalized.split("-")[0];
  return voices.find(v => v.lang.toLowerCase().replaceAll("_", "-") === normalized)
    ?? voices.find(v => {
      const candidate = v.lang.toLowerCase().replaceAll("_", "-");
      // Avoid selecting a Hong Kong/Macao voice for Mandarin just because its
      // browser locale has the broad "zh" prefix.
      if (language === "zh") return ["zh", "zh-cn", "zh-tw", "zh-sg", "zh-hans", "zh-hant"].includes(candidate);
      return candidate.split("-")[0] === language;
    }) ?? null;
}
export type MatchWord = { id: string; word: string; translation: string };
const normalize = (value: string) => value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
export function uniqueMatchWords<T extends MatchWord>(words: T[]): T[] {
  // Exclude every ambiguous pair, including duplicates with differing casing.
  return words.filter(word => word.word.trim() && word.translation.trim()
    && words.filter(other => other.id === word.id).length === 1
    && words.filter(other => normalize(other.word) === normalize(word.word)).length === 1
    && words.filter(other => normalize(other.translation) === normalize(word.translation)).length === 1).slice(0, 6);
}
export function phraseMatches(expected: string, recognized: string) {
  const normalize = (text: string) => text.normalize("NFKC").toLocaleLowerCase().replace(/[\p{P}\p{Z}\s]/gu, "");
  return Boolean(recognized.trim()) && normalize(expected) === normalize(recognized);
}
export function shuffled<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
