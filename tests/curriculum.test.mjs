import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateCurriculum, generateCurriculumSql } from "../scripts/generate-curriculum.mjs";

const curriculum = JSON.parse(await readFile(new URL("../supabase/curriculum.json", import.meta.url), "utf8"));

test("every supported language has complete, language-specific playable lessons", () => {
  validateCurriculum(curriculum);
  const signatures = new Set();
  for (const language of curriculum.languages) {
    const words = Object.values(language.words).flat();
    assert.equal(words.length, 18);
    signatures.add(words.map(([word]) => word).join("|"));
    assert.ok(language.course_title.includes(language.name));
  }
  assert.equal(signatures.size, 7);
});

test("incomplete lessons and repeated language codes fail before generating SQL", () => {
  const missingWords = structuredClone(curriculum);
  missingWords.languages[0].words.greetings.pop();
  assert.throws(() => generateCurriculumSql(missingWords), /Expected three vocabulary/);
  const duplicateLanguage = structuredClone(curriculum);
  duplicateLanguage.languages[1].code = "ja";
  assert.throws(() => generateCurriculumSql(duplicateLanguage), /seven supported languages/);
});

test("generated migration is synchronized with the Unicode curriculum source", async () => {
  const actual = await readFile(new URL("../supabase/migrations/202610050003_language_curriculum.sql", import.meta.url), "utf8");
  assert.equal(actual, generateCurriculumSql(curriculum));
  assert.ok(actual.includes("こんにちは"));
  assert.ok(actual.includes("S'il vous plaît"));
  assert.ok(actual.includes("สวัสดี"));
});

test("SQL dollar delimiters in content are rejected before generation", () => {
  for (const delimiter of ["$seed$", "$curriculum$"]) {
    const unsafe = structuredClone(curriculum);
    unsafe.languages[0].course_title += delimiter;
    assert.throws(() => generateCurriculumSql(unsafe), /SQL delimiter/);
  }
});

test("unit shift makes room for starter units without colliding with existing unique orders", () => {
  const sql = generateCurriculumSql(curriculum);
  assert.match(sql, /for existing_unit in\s+select id, unit_order from public\.units\s+where course_id = course_entry\.id\s+order by unit_order desc\s+loop/);
  assert.match(sql, /where id = existing_unit\.id and course_id = course_entry\.id/);

  const orders = new Set([1, 2, 3, 4, 5, 6]);
  for (const order of [...orders].sort((a, b) => b - a)) {
    const target = order + 3;
    assert.equal(orders.has(target), false, `Order ${target} must be free before moving unit ${order}`);
    orders.delete(order);
    orders.add(target);
  }
  assert.deepEqual([...orders].sort((a, b) => a - b), [4, 5, 6, 7, 8, 9]);
  for (const starterOrder of [1, 2, 3]) assert.equal(orders.has(starterOrder), false);
});
