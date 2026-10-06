import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/roadmap.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  .replace('import { getPublishedCourse } from "@/lib/learning";', 'const getPublishedCourse = async () => { throw new Error("Unexpected curriculum request"); };');
const { roadmapStates } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const units = [
  { id: "later", unit_order: 2, lessons: [{ id: "c", lesson_order: 1 }] },
  { id: "empty", unit_order: 3, lessons: [] },
  { id: "first", unit_order: 1, lessons: [{ id: "b", lesson_order: 2 }, { id: "a", lesson_order: 1 }] },
];
test("only the first ordered lesson is current for a new learner", () => {
  assert.deepEqual([...roadmapStates(units, [])], [["a", "current"], ["b", "locked"], ["c", "locked"]]);
});
test("completion unlocks the next lesson and then the next unit", () => {
  assert.equal(roadmapStates(units, [{ lesson_id: "a", status: "completed" }]).get("b"), "current");
  assert.equal(roadmapStates(units, [{ lesson_id: "a", status: "completed" }]).get("c"), "locked");
  assert.equal(roadmapStates(units, ["a", "b"].map((lesson_id) => ({ lesson_id, status: "completed" }))).get("c"), "current");
});
test("historical completion cannot bypass an earlier incomplete prerequisite", () => {
  const states = roadmapStates(units, [{ lesson_id: "b", status: "completed" }]);
  assert.equal(states.get("b"), "completed");
  assert.equal(states.get("a"), "current");
  assert.equal(states.get("c"), "locked");
});
test("in-progress stays current; unknown progress and empty units do not unlock later lessons", () => {
  assert.deepEqual([...roadmapStates(units, [{ lesson_id: "a", status: "in_progress" }, { lesson_id: "other", status: "completed" }])], [["a", "current"], ["b", "locked"], ["c", "locked"]]);
  assert.equal(roadmapStates([], []).size, 0);
});
test("completed course retains all lessons for review", () => {
  assert.ok([...roadmapStates(units, ["a", "b", "c"].map((lesson_id) => ({ lesson_id, status: "completed" }))).values()].every((state) => state === "completed"));
});
