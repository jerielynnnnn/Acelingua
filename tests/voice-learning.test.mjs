import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync } from "node:fs";
import { languageLocales, matchingVoice, recordingFor, uniqueMatchWords, shuffled, phraseMatches } from "../lib/voice-learning.ts";

test("all audited active languages have correct locale configuration", () => {
  assert.deepEqual(["ja", "ko", "zh", "es", "fr", "de", "th"].map(code => languageLocales[code]), ["ja-JP", "ko-KR", "zh-CN", "es-ES", "fr-FR", "de-DE", "th-TH"]);
});
test("Japanese audio cannot silently select an English voice", () => {
  assert.equal(matchingVoice([{ lang: "en-US" }], "ja-JP"), null);
  const voice = { lang: "ja-JP" };
  assert.equal(matchingVoice([{ lang: "en-US" }, voice], "ja-JP"), voice);
});
test("voice matching prioritizes exact locale then the same language only", () => {
  const regional = { lang: "es-MX" }; const exact = { lang: "es-ES" };
  assert.equal(matchingVoice([regional, exact], "es-ES"), exact);
  assert.equal(matchingVoice([regional], "es-ES"), regional);
  assert.equal(matchingVoice([{ lang: "ko_KR" }], "ko-KR").lang, "ko_KR");
  assert.equal(matchingVoice([], "zh-CN"), null);
  assert.equal(matchingVoice([{ lang: "zh-HK" }], "zh-CN"), null);
});
test("recordings reference files that actually exist and native phrases only", () => {
  for (const phrase of ["안녕하세요", "안녕히 가세요"]) {
    const path = recordingFor("ko", phrase);
    assert.ok(path); assert.ok(existsSync(new URL(`../public${path}`, import.meta.url)));
  }
  assert.equal(recordingFor("ko", "Hello"), null);
  assert.equal(recordingFor("ja", "こんにちは"), null);
});
test("matching excludes ambiguous meanings, native forms, and duplicate IDs", () => {
  const words = [{ id: "a", word: "hello", translation: "Hello" }, { id: "b", word: "hi", translation: " hello " },
    { id: "c", word: "bye", translation: "Goodbye" }, { id: "d", word: "thanks", translation: "Thank you" }];
  assert.deepEqual(uniqueMatchWords(words).map(w => w.id), ["c", "d"]);
  assert.equal(uniqueMatchWords([{ id: "a", word: "A", translation: "one" }, { id: "a", word: "B", translation: "two" }]).length, 0);
});
test("shuffle preserves complete phrase units and never mutates source", () => {
  const source = ["こんにちは", "안녕하세요", "你好"];
  assert.deepEqual([...shuffled(source, () => 0)].sort(), [...source].sort());
  assert.deepEqual(source, ["こんにちは", "안녕하세요", "你好"]);
});
test("phrase matching compares transcripts without pretending to measure pronunciation", () => {
  assert.equal(phraseMatches("こんにちは", "こんにちは。"), true);
  assert.equal(phraseMatches("안녕하세요", "안녕 하세요"), true);
  assert.equal(phraseMatches("Bonjour", "bonjour!"), true);
  assert.equal(phraseMatches("你好", "Hello"), false);
  assert.equal(phraseMatches("你好", ""), false);
});
