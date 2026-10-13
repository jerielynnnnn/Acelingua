import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(new URL("../lib/language-catalog.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { loadLanguageCatalog, publishedCourseAvailability } = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);

function client({ vocabulary = 3, activities = [], questions = [], empty = false, failure = null } = {}) {
  const calls = [];
  return { calls, from(table) {
    const filters = {}; let head = false;
    const call = { table, filters }; calls.push(call);
    const query = {
      select(columns, config) { head = Boolean(config?.head); return this; },
      eq(key, value) { filters[key] = value; return this; },
      in(key, value) { filters[key] = value; return this; },
      order() { return this; }, range() { return this; }, maybeSingle() { return this; },
      then(resolve, reject) { return Promise.resolve().then(() => {
        if (table === failure) return { data: null, error: { message: "RLS denied" } };
        const data = {
          languages: [{ id: "language", code: "ja", name: "Japanese", native_name: "日本語", flag_emoji: "🇯🇵" }, { id: "empty", code: "ko", name: "Korean" }],
          courses: filters.language_id === "empty" ? [] : [{ id: "course", language_id: "language", title: "Beginner", level: "Beginner" }],
          units: [{ id: "unit", unit_order: 1 }], lessons: empty ? [] : [{ id: "first" }, { id: "second" }],
          vocabulary: null, activities, questions, user_courses: { status: "active" }, lesson_progress: [{ lesson_id: "first" }],
        }[table];
        assert.notEqual(data, undefined, `Unexpected table ${table}`);
        if (["languages", "courses", "units", "lessons"].includes(table)) assert.equal(filters[table === "languages" ? "is_active" : "is_published"], true);
        return { data: head ? null : data, error: null, count: table === "vocabulary" ? vocabulary : undefined };
      }).then(resolve, reject); },
    }; return query;
  } };
}
test("guests see active languages including preparation states, with no account queries or writes", async () => {
  const db = client(); const result = await loadLanguageCatalog(db);
  assert.equal(result.languages.length, 2); assert.equal(result.courses.length, 1);
  assert.equal(result.courses[0].previewAvailable, true);
  assert.equal(result.courses[0].completedLessons, null);
  assert.ok(!db.calls.some(c => ["user_courses", "lesson_progress", "activities", "questions"].includes(c.table)));
});
test("enrolled catalog calculates published completions from owned lesson records", async () => {
  const db = client(); const result = await loadLanguageCatalog(db, "learner");
  assert.equal(result.courses[0].publishedLessons, 2);
  assert.equal(result.courses[0].completedLessons, 1);
  assert.equal(result.courses[0].status, "active");
  const progress = db.calls.find(c => c.table === "lesson_progress");
  assert.equal(progress.filters.user_id, "learner");
  assert.deepEqual(progress.filters.lesson_id, ["first", "second"]);
});
test("published empty curriculum and a first lesson without content are preparation states", async () => {
  assert.equal((await publishedCourseAvailability(client({ empty: true }), "course", true)).playable, false);
  assert.equal((await publishedCourseAvailability(client({ vocabulary: 0 }), "course", true)).playable, false);
});
test("unsupported and question-less activity lessons cannot be advertised as playable", async () => {
  const activities = [{ id: "a", activity_type: "quiz", instructions: "Practice" }];
  assert.equal((await publishedCourseAvailability(client({ activities }), "course", true)).playable, false);
  assert.equal((await publishedCourseAvailability(client({ activities, questions: [{ question_type: "speaking", correct_answer: "hi" }] }), "course", true)).playable, false);
});
test("real vocabulary and supported quiz content are playable without fabricated questions", async () => {
  const db = client({ vocabulary: 3, activities: [{ id: "a", activity_type: "quiz" }], questions: [{ question_type: "multiple_choice", correct_answer: "Hello", options: ["Hello", "Bye"] }] });
  const result = await publishedCourseAvailability(db, "course", true);
  assert.equal(result.playable, true); assert.equal(result.previewAvailable, true);
});
test("quiz-only content remains in preparation until the vocabulary-first player supports it", async () => {
  const db = client({ vocabulary: 0, activities: [{ id: "a", activity_type: "quiz" }], questions: [{ question_type: "multiple_choice", correct_answer: "Hello", options: ["Hello", "Bye"] }] });
  assert.equal((await publishedCourseAvailability(db, "course", true)).playable, false);
});
test("permission failure is surfaced rather than mislabeled as missing content", async () => {
  await assert.rejects(publishedCourseAvailability(client({ failure: "vocabulary" }), "course", true), { message: "RLS denied" });
});
