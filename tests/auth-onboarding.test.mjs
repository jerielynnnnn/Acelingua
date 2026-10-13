import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test, beforeEach } from "node:test";
import ts from "typescript";

const catalogSource = readFileSync(new URL("../lib/language-catalog.ts", import.meta.url), "utf8");
const catalogOutput = ts.transpileModule(catalogSource, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const catalogUrl = "data:text/javascript;base64," + Buffer.from(catalogOutput).toString("base64");
const source = readFileSync(new URL("../lib/auth-onboarding.ts", import.meta.url), "utf8").replace('"@/lib/language-catalog"', JSON.stringify(catalogUrl));
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { continueAuthenticatedOnboarding, readOnboardingSelection, selectStartingCourse, enrollStartingCourse } = await import(
  `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`,
);
const languageId = "9e3b5bd7-f38e-42cc-8301-100e0fad7873";
const user = { id: "test-user", user_metadata: {} };
let storage;
beforeEach(() => {
  storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
});
function pending() {
  storage.set("acelingua_onboarding_started", "true");
  storage.set("acelingua_intro_completed", "true");
  storage.set("acelingua_selected_language_id", languageId);
  storage.set("acelingua_selected_language", "ja");
}

// A narrow Supabase test double models RLS failures and atomic conflict handling.
function database({ avatar = false, existingAccount = false, failure = null, vocabulary = 3, publishedLessons = true } = {}) {
  const records = { enrollment: null, progress: null };
  const writes = [];
  return {
    records, writes,
    from(table) {
      let values, options, head = false;
      const filters = {};
      const query = {
        select(columns, config) { head = Boolean(config?.head); return query; },
        range() { return query; },
        eq(key, value) { filters[key] = value; return query; },
        order() { return query; },
        limit() { return query; },
        maybeSingle() { return query; },
        upsert(input, config) { values = input; options = config; return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            if (values) {
              assert.equal(values.user_id, user.id);
              assert.deepEqual(options, { onConflict: "user_id,course_id", ignoreDuplicates: true });
              writes.push({ table, values });
              if (failure?.table === table) return { data: null, error: failure.error };
              if (table === "user_courses") records.enrollment ??= { id: "enrollment", ...values };
              else if (table === "course_progress") records.progress ??= { id: "progress", ...values };
              else assert.fail(`Unexpected write to ${table}`);
              return { data: null, error: null };
            }
            let data;
            if (table === "user_avatar_equipped") data = avatar ? { user_id: user.id } : null;
            else if (table === "user_courses") data = records.enrollment ?? (existingAccount && !filters.course_id ? { course_id: "other-course" } : null);
            else if (table === "course_progress") data = records.progress;
            else if (table === "languages") data = { id: languageId, code: "ja" };
            else if (table === "courses") data = [{ id: "course", title: "Japanese Beginner", level: "Beginner" }];
            else if (table === "lessons") return { data: head ? null : publishedLessons ? [{ id: "lesson" }] : [], error: null, count: publishedLessons ? 12 : 0 };
            else if (table === "units") data = [{ id: "unit", unit_order: 1 }];
            else if (table === "vocabulary") return { data: null, error: null, count: vocabulary };
            else if (table === "activities") data = [];
            else assert.fail(`Unexpected table ${table}`);
            return { data, error: null };
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

test("beginner formatting is normalized; sole course is safe; ambiguous choices fail", () => {
  assert.equal(selectStartingCourse([{ level: "advanced" }, { level: " Beginner " }]).level, " Beginner ");
  assert.equal(selectStartingCourse([{ level: null }]).level, null);
  assert.throws(() => selectStartingCourse([{ level: "advanced" }, { level: "intermediate" }]), /starting course/);
});
test("returning login checks setup and does not write enrollment", async () => {
  const db = database({ avatar: true, existingAccount: true });
  assert.equal(await continueAuthenticatedOnboarding(db, user), "/dashboard");
  assert.deepEqual(db.writes, []);
});

test("enrollment rejects missing published lessons or unusable intro before writing", async () => {
  for (const config of [{ publishedLessons: false }, { vocabulary: 0 }]) {
    const db = database(config);
    await assert.rejects(enrollStartingCourse(db, user, { languageId, languageCode: "ja" }), /Course in Preparation/);
    assert.deepEqual(db.writes, []);
  }
});

test("direct registration without language resumes selection", async () => {
  const db = database();
  assert.equal(await continueAuthenticatedOnboarding(db, { ...user, user_metadata: { acelingua_onboarding: { source: "direct_registration" } } }), "/onboarding/languages");
  assert.deepEqual(db.writes, []);
});

test("direct registration still chooses language when signup has default avatar and enrollment", async () => {
  const db = database({ avatar: true, existingAccount: true });
  assert.equal(await continueAuthenticatedOnboarding(db, { ...user, user_metadata: { acelingua_onboarding: { source: "direct_registration" } } }), "/onboarding/languages");
  assert.deepEqual(db.writes, []);
});

test("World enrolls the selected language directly and repeated starts retain progress", async () => {
  const db = database({ avatar: true, existingAccount: true });
  const selection = { languageId, languageCode: "ja" };
  assert.equal(await enrollStartingCourse(db, user, selection), "course");
  db.records.progress.completed_lessons = 4;
  assert.equal(await enrollStartingCourse(db, user, selection), "course");
  assert.equal(db.records.progress.completed_lessons, 4);
  assert.deepEqual(db.writes.map(write => write.table), ["user_courses", "course_progress"]);
  assert.equal(storage.size, 0, "World enrollment does not replace onboarding state");
});

test("interrupted avatar finalization resumes avatar even when equipped", async () => {
  const db = database({ avatar: true, existingAccount: true });
  const signup = { ...user, user_metadata: { acelingua_onboarding: { source: "guest_preview", languageId, languageCode: "ja", introCompleted: true } } };
  assert.equal(await continueAuthenticatedOnboarding(db, signup), "/avatar/setup");
});

test("Google registration with bound signup metadata skips repeating the preview", async () => {
  const db = database();
  const signup = { ...user, app_metadata: { provider: "google" }, user_metadata: { acelingua_onboarding: { source: "guest_preview", languageId, languageCode: "ja", introCompleted: true } } };
  assert.equal(await continueAuthenticatedOnboarding(db, signup), "/avatar/setup");
});

test("new Google account without a selection must choose a language before avatar setup", async () => {
  const db = database();
  assert.equal(await continueAuthenticatedOnboarding(db, user), "/onboarding/languages");
  assert.deepEqual(db.writes, []);
});

test("authenticated language selection enrolls without requiring a guest intro", async () => {
  pending();
  storage.delete("acelingua_intro_completed");
  storage.set("acelingua_onboarding_user_id", user.id);
  const db = database();
  assert.equal(await continueAuthenticatedOnboarding(db, user), "/avatar/setup");
  assert.deepEqual(db.writes.map(write => write.table), ["user_courses", "course_progress"]);
  assert.equal(readOnboardingSelection(), null, "Guest selection still requires intro completion");
});

test("new Google account confirms language despite an unbound guest preview", async () => {
  pending();
  const db = database();
  const googleUser = { ...user, app_metadata: { provider: "google" } };
  assert.equal(await continueAuthenticatedOnboarding(db, googleUser), "/onboarding/languages");
  assert.deepEqual(db.writes, []);
  storage.set("acelingua_onboarding_user_id", user.id);
  assert.equal(await continueAuthenticatedOnboarding(db, googleUser), "/avatar/setup");
});
test("stale unbound selection cannot enroll an established learner in another course", async () => {
  pending();
  const db = database({ avatar: true, existingAccount: true });
  assert.equal(await continueAuthenticatedOnboarding(db, user), "/dashboard");
  assert.deepEqual(db.writes, []);
});
test("new learner enrollment initializes actual lesson count with zero completed progress", async () => {
  pending();
  const db = database();
  assert.equal(await continueAuthenticatedOnboarding(db, user), "/avatar/setup");
  assert.equal(db.records.progress.total_lessons, 12);
  assert.equal(db.records.progress.completed_lessons, 0);
  assert.equal(db.records.progress.progress_percentage, 0);
  assert.deepEqual(db.writes.map((write) => write.table), ["user_courses", "course_progress"]);
  assert.equal(storage.get("acelingua_intro_completed"), "true");
  await continueAuthenticatedOnboarding(db, user);
  assert.equal(db.writes.length, 2, "Retry must reuse enrollment and progress");
});
test("equipped returning learner ignores stale selection even when browser state is account-bound", async () => {
  pending(); storage.set("acelingua_onboarding_user_id", user.id);
  const db = database({ avatar: true, existingAccount: true });
  assert.equal(await continueAuthenticatedOnboarding(db, user), "/dashboard");
  assert.deepEqual(db.writes, []);
});
test("verified signup metadata restores selection without localStorage on another device", async () => {
  const db = database();
  const account = { ...user, user_metadata: { acelingua_onboarding: { languageId, languageCode: "ja", introCompleted: true } } };
  assert.equal(await continueAuthenticatedOnboarding(db, account), "/avatar/setup");
  assert.equal(db.records.enrollment.course_id, "course");
});
test("RLS failure preserves pending selection and reports exact error", async () => {
  pending();
  const db = database({ failure: { table: "user_courses", error: { code: "42501", message: "new row violates row-level security policy" } } });
  await assert.rejects(continueAuthenticatedOnboarding(db, user), /row-level security policy/);
  assert.equal(db.records.progress, null);
  assert.equal(storage.get("acelingua_selected_language_id"), languageId);
});
test("missing uniqueness fails safely; progress is not initialized", async () => {
  pending();
  const db = database({ failure: { table: "user_courses", error: { code: "42P10", message: "no unique constraint" } } });
  await assert.rejects(continueAuthenticatedOnboarding(db, user), /unique constraint on user_id and course_id/);
  assert.equal(db.records.enrollment, null);
  assert.equal(db.records.progress, null);
});
test("progress failure can be retried without creating another enrollment", async () => {
  pending();
  const failure = { table: "course_progress", error: { code: "42501", message: "progress denied" } };
  const db = database({ failure });
  await assert.rejects(continueAuthenticatedOnboarding(db, user), /progress denied/);
  failure.table = "none";
  assert.equal(await continueAuthenticatedOnboarding(db, user), "/avatar/setup");
  assert.equal(db.writes.filter((write) => write.table === "user_courses").length, 1);
});
test("invalid language UUID is rejected before any database queries", () => {
  pending(); storage.set("acelingua_selected_language_id", "invalid");
  assert.throws(readOnboardingSelection, /invalid/);
});
