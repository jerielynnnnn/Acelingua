import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const js = ts.transpileModule(fs.readFileSync(new URL("../lib/authenticated-lesson.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  .replace('import { loadRoadmap } from "@/lib/roadmap";', 'const loadRoadmap = (...args) => globalThis.lessonTestRoadmap(...args);');
const { loadAuthenticatedLesson, startAuthenticatedLesson, completeAuthenticatedLesson } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const id = "d89e8b91-8bf0-1092-fe5b-3179a295f7a1";
function database(responses = [], user = { id: "learner" }, reward = null) {
  const calls = [];
  return { calls, auth: { getUser: async () => ({ data: { user }, error: null }) },
    rpc: async (name, params) => { calls.push({ name, params }); return reward ?? { data: null, error: null }; },
    from(table) {
      const expected = responses.shift();
      assert.ok(expected, `Unexpected ${table} query`);
      assert.equal(expected.table, table);
      const call = { table }; calls.push(call);
      const query = { select(fields) { call.fields = fields; return query; }, eq() { return query; }, order() { return query; }, in() { return query; }, maybeSingle() { return query; }, single() { return query; }, then(resolve, reject) { return Promise.resolve({ data: expected.data, error: expected.error ?? null }).then(resolve, reject); } };
      return query;
    },
  };
}
const base = () => [{ table: "lessons", data: { id, unit_id: "unit" } }, { table: "units", data: { id: "unit", course_id: "course", unit_order: 4, title: "Greetings & Introductions" } }];
test("locked direct URL never loads vocabulary or activities and never writes", async () => {
  globalThis.lessonTestRoadmap = async () => ({ states: new Map([[id, "locked"]]) });
  const db = database(base());
  await assert.rejects(loadAuthenticatedLesson(db, "learner", id, "course"), /still locked/);
  assert.deepEqual(db.calls.map((c) => c.table), ["lessons", "units"]);
});
test("loading available content uses only confirmed vocabulary fields and performs no RPC", async () => {
  globalThis.lessonTestRoadmap = async () => ({ course: { id: "course" }, language: { code: "ja" }, units: [{ id: "unit", lessons: [{ id }] }], states: new Map([[id, "current"]]) });
  const db = database([...base(), { table: "vocabulary", data: [{ id: "word", word: "こんにちは", translation: "Hello" }] }, { table: "activities", data: [] }]);
  const content = await loadAuthenticatedLesson(db, "learner", id, "course");
  assert.equal(content.words.length, 1);
  assert.equal(content.unit.unit_order, 4);
  assert.deepEqual(content.questions, []);
  assert.equal(db.calls.find((c) => c.table === "vocabulary").fields, "id, word, translation, pronunciation, example_sentence, example_translation");
  assert.ok(db.calls.every((c) => c.table));
});
test("course mismatch blocks content access", async () => {
  await assert.rejects(loadAuthenticatedLesson(database(base()), "learner", id, "other-course"), /does not belong/);
});
test("changed authentication prevents start and completion calls", async () => {
  for (const operation of [startAuthenticatedLesson, completeAuthenticatedLesson]) {
    const db = database([], { id: "other" });
    await assert.rejects(operation(db, "learner", id), /session changed/);
    assert.equal(db.calls.length, 0);
  }
});
test("completion delegates atomic rewards to the RPC and accepts zero reward replay", async () => {
  const result = { replay: true, xp_awarded: 0, coins_awarded: 0, completed_lessons: 1, total_lessons: 12 };
  const db = database([], { id: "learner" }, { data: result, error: null });
  assert.deepEqual(await completeAuthenticatedLesson(db, "learner", id), result);
  assert.deepEqual(db.calls, [{ name: "acelingua_complete_lesson", params: { p_lesson_id: id } }]);
});
test("completion error is surfaced and no result is fabricated", async () => {
  const db = database([], { id: "learner" }, { data: null, error: { message: "coin_transactions insert failed" } });
  await assert.rejects(completeAuthenticatedLesson(db, "learner", id), /coin_transactions insert failed/);
});

test("assessed completion sends answers/acknowledgments to server grading, never a client score", async () => {
  const assessment = { answers: [{ question_id: "question", answer: "Wrong answer" }], acknowledged: ["speaking"] };
  const result = { replay: false, xp_awarded: 10, coins_awarded: 5, correct_answers: 0, total_questions: 1 };
  const db = database([], { id: "learner" }, { data: result, error: null });
  assert.deepEqual(await completeAuthenticatedLesson(db, "learner", id, assessment), result);
  assert.deepEqual(db.calls, [{ name: "acelingua_complete_assessed_lesson", params: { p_lesson_id: id, p_answers: assessment.answers, p_acknowledged: assessment.acknowledged } }]);
});
