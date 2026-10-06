import test from "node:test";
import assert from "node:assert/strict";
import { readGuestLesson, rememberGuestLesson, saveGuestLesson, recordLessonCompletion } from "../lib/guest-onboarding.ts";

const pending = { courseId: "course-1", lessonId: "lesson-1" };

function storage() {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  return values;
}

function client(responses) {
  const calls = [];
  return {
    calls,
    auth: { updateUser: async (values) => { calls.push({ table: "auth", values }); return { error: null }; } },
    from(table) {
      const expected = responses.shift();
      assert.ok(expected, `Unexpected query for ${table}`);
      assert.equal(table, expected.table);
      const call = { table };
      calls.push(call);
      const query = {
        select() { return query; }, eq() { return query; }, in() { return query; }, limit() { return query; },
        insert(values) { call.operation = "insert"; call.values = values; return query; },
        update(values) { call.operation = "update"; call.values = values; return query; },
        maybeSingle() { return query; },
        then(resolve, reject) { return Promise.resolve({ data: expected.data ?? null, error: expected.error ?? null }).then(resolve, reject); },
      };
      return query;
    },
  };
}

function successResponses() {
  return [
    { table: "lessons", data: { id: pending.lessonId } },
    { table: "user_courses" }, { table: "user_courses" },
    { table: "lesson_progress" }, { table: "lesson_progress" },
    { table: "lessons", data: [{ id: "lesson-1" }, { id: "lesson-2" }] },
    { table: "lesson_progress", data: [{ lesson_id: "lesson-1" }] },
    { table: "course_progress" }, { table: "course_progress" },
  ];
}

test("missing or malformed browser state does not start enrollment", async () => {
  const values = storage();
  assert.equal(readGuestLesson(), null);
  values.set("acelingua:first-lesson", "invalid JSON");
  assert.equal(readGuestLesson(), null);
  const supabase = client([]);
  await saveGuestLesson(supabase, { id: "user-1", user_metadata: {} });
  assert.equal(supabase.calls.length, 0);
});

test("email-confirmation metadata restores enrollment and completion on another browser", async () => {
  storage();
  const supabase = client(successResponses());
  await saveGuestLesson(supabase, { id: "user-2", user_metadata: { guest_lesson: pending } });
  const enrollment = supabase.calls.find((call) => call.table === "user_courses" && call.operation === "insert");
  assert.equal(enrollment.values.user_id, "user-2");
  assert.equal(enrollment.values.course_id, pending.courseId);
  const progress = supabase.calls.find((call) => call.table === "course_progress" && call.operation === "insert");
  assert.equal(progress.values.completed_lessons, 1);
  assert.equal(progress.values.progress_percentage, 50);
  assert.deepEqual(supabase.calls.at(-1), { table: "auth", values: { data: { guest_lesson: null } } });
});

test("failed enrollment keeps guest completion for retry", async () => {
  storage();
  rememberGuestLesson(pending);
  const failure = new Error("Enrollment denied");
  const supabase = client([
    { table: "lessons", data: { id: pending.lessonId } },
    { table: "user_courses" }, { table: "user_courses", error: failure },
  ]);
  await assert.rejects(saveGuestLesson(supabase, { id: "user-3", user_metadata: {} }), /Enrollment denied/);
  assert.deepEqual(readGuestLesson(), pending);
});

test("concurrent handoffs share one save and clear browser state only after success", async () => {
  storage();
  rememberGuestLesson(pending);
  const supabase = client(successResponses());
  const user = { id: "user-4", user_metadata: {} };
  await Promise.all([saveGuestLesson(supabase, user), saveGuestLesson(supabase, user)]);
  assert.equal(supabase.calls.filter((call) => call.table === "user_courses" && call.operation === "insert").length, 1);
  assert.equal(readGuestLesson(), null);
});

test("unpublished or mismatched lesson cannot create authenticated progress", async () => {
  storage();
  rememberGuestLesson(pending);
  const supabase = client([{ table: "lessons", data: null }]);
  await assert.rejects(saveGuestLesson(supabase, { id: "user-5", user_metadata: {} }), /no longer available/);
  assert.equal(supabase.calls.length, 1);
  assert.deepEqual(readGuestLesson(), pending);
});

test("retry after an interrupted handoff preserves existing enrollment and completion", async () => {
  storage();
  rememberGuestLesson(pending);
  const supabase = client([
    { table: "lessons", data: { id: pending.lessonId } },
    { table: "user_courses", data: { id: "enrollment-1" } },
    { table: "lesson_progress", data: { id: "progress-1", status: "completed" } },
    { table: "lessons", data: [{ id: pending.lessonId }] },
    { table: "lesson_progress", data: [{ lesson_id: pending.lessonId }] },
    { table: "course_progress", data: { id: "course-progress-1" } },
    { table: "course_progress" },
  ]);
  await saveGuestLesson(supabase, { id: "user-6", user_metadata: {} });
  assert.equal(supabase.calls.some((call) => call.operation === "insert"), false);
  assert.equal(supabase.calls.find((call) => call.operation === "update").values.progress_percentage, 100);
  assert.equal(readGuestLesson(), null);
});

test("signed-in completion uses the same progress records without requiring guest storage", async () => {
  globalThis.localStorage = {
    getItem() { throw new Error("Storage unavailable"); },
    setItem() { throw new Error("Storage unavailable"); },
    removeItem() { throw new Error("Storage unavailable"); },
  };
  const supabase = client(successResponses());
  await recordLessonCompletion(supabase, { id: "user-7", user_metadata: {} }, pending);
  const progress = supabase.calls.find((call) => call.table === "lesson_progress" && call.operation === "insert");
  assert.equal(progress.values.lesson_id, pending.lessonId);
  assert.equal(progress.values.user_id, "user-7");
  assert.equal(progress.values.status, "completed");
  assert.equal(supabase.calls.some((call) => call.table === "auth"), false);
});
