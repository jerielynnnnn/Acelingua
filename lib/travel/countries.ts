/** Country identifiers remain independent of existing language-based URLs. */
export const travelDestinations: Record<string, { countryCode: string; greeting: string; meaning: string; introduction: string }> = {
  fr: { countryCode: "fr", greeting: "Bonjour", meaning: "Hello / Good day", introduction: "Say bonjour as you enter a bakery or café. A small greeting is a lovely start to your first conversation." },
  ja: { countryCode: "jp", greeting: "こんにちは", meaning: "Hello", introduction: "Japanese uses hiragana, katakana, and kanji. Discover the scripts in your Writing Studio as you explore." },
  ko: { countryCode: "kr", greeting: "안녕하세요", meaning: "Hello", introduction: "Hangul letters come together in syllable blocks. Try a friendly greeting before your first lesson." },
  es: { countryCode: "es", greeting: "Hola", meaning: "Hello", introduction: "Spanish questions begin with ¿ and finish with ?. Let your curiosity lead the way." },
  de: { countryCode: "de", greeting: "Hallo", meaning: "Hello", introduction: "German nouns begin with capital letters. Look for them as you discover your first words." },
  zh: { countryCode: "cn", greeting: "你好", meaning: "Hello", introduction: "Mandarin is tonal. Listen closely to the melody of your first greeting." },
  th: { countryCode: "th", greeting: "สวัสดี", meaning: "Hello", introduction: "Thai has its own script. Explore its shapes and sounds one small step at a time." },
};
export function languageForCountry(code: string) {
  return Object.entries(travelDestinations).find(([, destination]) => destination.countryCode === code)?.[0];
}
