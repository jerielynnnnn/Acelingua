import test from "node:test";
import assert from "node:assert/strict";
import { flattenCourseLessons, getActiveLesson, getMapCoordinates, buildMapPath } from "./courseMapUtils.js";

const units = [
  { id: "b", title: "Second", unit_order: 2, lessons: [{ id: "three", lesson_order: 1 }] },
  { id: "a", title: "First", unit_order: 1, lessons: [{ id: "two", lesson_order: 2 }, { id: "one", lesson_order: 1 }] },
];

test("sorts across units without mutating source and unlocks the first lesson", () => {
  const lessons = flattenCourseLessons(units);
  assert.deepEqual(lessons.map((lesson) => lesson.id), ["one", "two", "three"]);
  assert.deepEqual(lessons.map((lesson) => lesson.isUnlocked), [true, false, false]);
  assert.equal(lessons[2].sequence, 3);
  assert.equal(units[0].id, "b");
  assert.equal(units[1].lessons[0].id, "two");
});

test("completion unlocks across unit boundaries; in-progress does not", () => {
  const lessons = flattenCourseLessons(units, [
    { lesson_id: "one", status: "completed" }, { lesson_id: "two", status: "in_progress" },
  ]);
  assert.deepEqual(lessons.map((lesson) => lesson.isUnlocked), [true, true, false]);
  assert.equal(getActiveLesson(lessons).id, "two");
  const advanced = flattenCourseLessons(units, [
    { lesson_id: "one", status: "completed" }, { lesson_id: "two", status: "completed" },
  ]);
  assert.equal(getActiveLesson(advanced).id, "three");
  assert.equal(advanced[2].isUnlocked, true);
});

test("empty and fully completed courses have no active lesson", () => {
  assert.equal(getActiveLesson([]), null);
  assert.equal(getActiveLesson(flattenCourseLessons(units, ["one", "two", "three"].map((lesson_id) => ({ lesson_id, status: "completed" })))), null);
  assert.equal(buildMapPath([]), "");
});

test("curve segments meet every coordinate with 180px vertical spacing", () => {
  const points = getMapCoordinates(flattenCourseLessons(units));
  assert.deepEqual(points.map(({ x, y }) => [x, y]), [[25, 130], [75, 310], [25, 490]]);
  assert.equal(buildMapPath(points), "M 25 130 C 25 220, 75 220, 75 310 C 75 400, 25 400, 25 490");
});
