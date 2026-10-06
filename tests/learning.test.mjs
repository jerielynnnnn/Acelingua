import test from "node:test";
import assert from "node:assert/strict";
import { getOrderedLessons, getPublishedCourse, getCourseUnits } from "../lib/learning.ts";

function queryClient(data, error = null) {
  const calls = [];
  const query = {
    select(value) { calls.push(["select", value]); return query; },
    eq(key, value) { calls.push(["eq", key, value]); return query; },
    order(key) { calls.push(["order", key]); return query; },
    limit(value) { calls.push(["limit", value]); return query; },
    maybeSingle() { return query; },
    then(resolve, reject) { return Promise.resolve({ data, error }).then(resolve, reject); },
  };
  return { calls, from(table) { calls.push(["from", table]); return query; } };
}

const course = { id: "course-ja", language_id: "ja", title: "Japanese basics", description: "Start learning Japanese", level: "beginner" };
const intro = { id: "first", title: "Greetings", lesson_order: 1, is_published: true };
const units = [
  { id: "unit-2", title: "Next unit", unit_order: 2, lessons: [{ ...intro, id: "third" }] },
  { id: "unit-1", title: "First unit", unit_order: 1, lessons: [
    { ...intro, id: "draft", lesson_order: 0, is_published: false },
    { ...intro, id: "second", lesson_order: 2 }, intro,
  ] },
];

test("guest and authenticated language entries resolve the same course with deterministic ordering", async () => {
  const guest = queryClient(course);
  const authenticated = queryClient(course);
  assert.deepEqual(await getPublishedCourse(guest, { languageId: "ja" }), course);
  assert.deepEqual(await getPublishedCourse(authenticated, { languageId: "ja" }), course);
  assert.deepEqual(guest.calls, authenticated.calls);
  assert.deepEqual(guest.calls.filter((call) => call[0] === "order"), [["order", "created_at"], ["order", "id"]]);
  assert.ok(guest.calls.some((call) => call[0] === "eq" && call[1] === "is_published" && call[2] === true));
});

test("published outline and guest preview begin with the same lesson and omit draft lessons", () => {
  const original = JSON.stringify(units);
  const published = getOrderedLessons(units);
  const preview = getOrderedLessons([{ ...units[1], lessons: [intro] }]);
  assert.deepEqual(published.map((lesson) => lesson.id), ["first", "second", "third"]);
  assert.equal(published[0].id, preview[0].id);
  assert.equal(JSON.stringify(units), original);
});

test("course outline filters draft lessons and sorts lessons within their units", async () => {
  const supabase = queryClient([units[1]]);
  const result = await getCourseUnits(supabase, course.id);
  assert.deepEqual(result[0].lessons.map((lesson) => lesson.id), ["first", "second"]);
  assert.ok(supabase.calls.some((call) => call[0] === "eq" && call[1] === "course_id" && call[2] === course.id));
});

test("course lookup reports missing or unpublished courses instead of selecting a different language", async () => {
  await assert.rejects(getPublishedCourse(queryClient(null), { languageId: "ja" }), /does not have a published course/);
  await assert.rejects(getPublishedCourse(queryClient(null), {}), /Choose a language/);
});
