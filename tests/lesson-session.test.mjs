import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const output = ts.transpileModule(fs.readFileSync(new URL("../lib/lesson-session.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { activitySteps, normalizeLessonAnswer, questionIsSupported, questionChoices } = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
const activity = (id, activity_order) => ({ id, activity_order });
const question = (id, activity_id, question_order, changes = {}) => ({ id, activity_id, question_order, question_type: "multiple_choice", correct_answer: "Hello", options: ["Hello", "Goodbye"], ...changes });
test("activities retain database ordering; instructional screens do not become questions", () => {
  const steps = activitySteps([activity("speaking", 4), activity("grammar", 2), activity("listening", 3)], [question("second", "grammar", 2), question("first", "grammar", 1)]);
  assert.deepEqual(steps.map((step) => [step.activity.id, step.question?.id ?? null]), [["grammar", null], ["grammar", "first"], ["grammar", "second"], ["listening", null], ["speaking", null]]);
  assert.equal(steps.filter((step) => step.question).length, 2);
});
test("translation comparison tolerates whitespace/case without rewriting Japanese", () => {
  assert.equal(normalizeLessonAnswer("  THANK   YOU \n"), normalizeLessonAnswer("Thank you"));
  assert.equal(normalizeLessonAnswer("こんにちは"), "こんにちは");
  assert.notEqual(normalizeLessonAnswer("Goodbye"), normalizeLessonAnswer("Hello"));
});
test("only seeded types and usable stored options are supported", () => {
  assert.ok(questionIsSupported(question("q", "a", 1)));
  assert.ok(questionIsSupported(question("q", "a", 1, { question_type: "true_false", correct_answer: "false", options: ["true", "false"] })));
  assert.ok(questionIsSupported(question("q", "a", 1, { question_type: "translation", options: null })));
  assert.equal(questionIsSupported(question("q", "a", 1, { question_type: "listening" })), false);
  assert.equal(questionIsSupported(question("q", "a", 1, { options: { A: "Hello" } })), false);
  assert.equal(questionIsSupported(question("q", "a", 1, { correct_answer: "Not an option" })), false);
  assert.deepEqual(questionChoices(question("q", "a", 1)), ["Hello", "Goodbye"]);
});
