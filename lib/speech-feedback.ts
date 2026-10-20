import { phraseMatches } from "./voice-learning";
function normalized(text: string) { return Array.from(text.normalize("NFKC").toLocaleLowerCase().replace(/[\p{P}\p{Z}\s]/gu, "")); }
export function speechFeedback(expected: string, recognized: string) {
  const target = normalized(expected); const heard = normalized(recognized);
  let prefix = 0; let suffix = 0;
  while (prefix < target.length && prefix < heard.length && target[prefix] === heard[prefix]) prefix++;
  while (suffix < target.length - prefix && suffix < heard.length - prefix && target[target.length - 1 - suffix] === heard[heard.length - 1 - suffix]) suffix++;
  const parts = (chars: string[]) => ({ before: chars.slice(0, prefix).join(""), different: chars.slice(prefix, chars.length - suffix).join(""), after: suffix ? chars.slice(-suffix).join("") : "" });
  return { matches: phraseMatches(expected, recognized), expected: parts(target), heard: parts(heard) };
}
