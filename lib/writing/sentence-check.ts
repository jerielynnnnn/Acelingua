import type { WritingExercise } from "./course-curriculum";

export function normalizeJapanese(value: string) {
  return value.normalize("NFKC").replace(/[\s。.!！?？]/gu, "").trim();
}

export function canonicalJapanese(value: string) {
  let result = normalizeJapanese(value);
  // Validated orthographic variants for this beginner workbook, not arbitrary translation.
  for (const [kana, kanji] of [["わたし", "私"], ["がくせい", "学生"], ["ねこ", "猫"], ["すき", "好き"], ["きらい", "嫌い"], ["おちゃ", "お茶"], ["みず", "水"], ["のみます", "飲みます"], ["よみます", "読みます"], ["ほん", "本"]]) {
    result = result.replaceAll(kana, kanji);
  }
  return result;
}

export function checkWritingAnswer(exercise: WritingExercise, input: string) {
  const actual = normalizeJapanese(input);
  const accepted = [exercise.answer, ...(exercise.alternatives ?? [])].map(canonicalJapanese);
  if (!actual) return { correct: false, feedback: "Write or arrange an answer first." };
  if (accepted.includes(canonicalJapanese(actual))) return { correct: true, feedback: `Correct. ${exercise.explanation}` };
  if (!/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(actual)
    && exercise.kind === "sentence") {
    return { correct: false, feedback: "Try Japanese characters rather than romaji. Use a Japanese IME, or switch to word tiles to practice without one." };
  }
  if (exercise.requiredParticle && !actual.includes(exercise.requiredParticle)) {
    return { correct: false, feedback: `Check the particle ${exercise.requiredParticle}. ${exercise.explanation}` };
  }
  if (exercise.ending && !actual.endsWith(exercise.ending)) {
    return { correct: false, feedback: `Check the sentence ending (${exercise.ending}). ${exercise.explanation}` };
  }
  const tiles = exercise.tiles;
  if (tiles?.every(tile => actual.includes(normalizeJapanese(tile)))) {
    return { correct: false, feedback: `You have the key pieces. Check their order and remove extra words. ${exercise.explanation}` };
  }
  return { correct: false, feedback: `This does not match the sentence requested in this exercise. Compare your words and particles with the hint. ${exercise.explanation} Other Japanese sentences may be valid in a different context; this is not an open-ended grammar grader.` };
}
