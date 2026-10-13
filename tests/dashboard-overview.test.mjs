import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(new URL("../lib/dashboard-overview.ts", import.meta.url), "utf8")
  .replace('import { loadLearnerAvatar } from "@/lib/avatar";', 'const loadLearnerAvatar = async () => ({ items: [], ownedIds: new Set(), equipped: null });');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { loadDashboardOverview, achievementPreviews } = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
function database({ empty = false, goalFailure = false } = {}) {
  const calls = [];
  return { calls, from(table) {
    const filters = {}; calls.push({ table, filters });
    const query = { select() { return this; }, eq(key, value) { filters[key] = value; return this; }, in(key, value) { filters[key] = value; return this; }, order() { return this; }, limit() { return this; }, maybeSingle() { return this; },
      then(resolve, reject) { return Promise.resolve().then(() => {
        if (goalFailure && table === "daily_goals") return { data: null, error: { message: "Goal permission denied" } };
        const records = {
          profiles: { username: "learner", display_name: "Alex", level: 3, xp: 221, coins: 42, gems: 7, hearts: 4, streak: 2 },
          user_courses: empty ? [] : [{ course_id: "a" }, { course_id: "b" }],
          courses: [{ id: "a", title: "Japanese", level: "Beginner", language_id: "ja" }, { id: "b", title: "Korean", level: "Beginner", language_id: "ko" }],
          languages: [{ id: "ja", name: "Japanese", code: "ja" }, { id: "ko", name: "Korean", code: "ko" }],
          course_progress: { course_id: "b" }, daily_goals: null,
          achievements: [{ id: "award", name: "First step", description: "Finish a lesson" }],
          user_achievements: [{ achievement_id: "award", earned_at: "2026-10-14T01:00:00Z" }],
        };
        assert.ok(table in records); return { data: records[table], error: null };
      }).then(resolve, reject); },
    }; return query;
  } };
}
test("dashboard uses actual profile balances and last-accessed enrolled course without writes", async () => {
  const db = database(); const result = await loadDashboardOverview(db, "owner");
  assert.equal(result.profile.xp, 221); assert.equal(result.profile.coins, 42); assert.equal(result.currentCourseId, "b");
  for (const table of ["user_courses", "daily_goals", "user_achievements", "course_progress"]) assert.equal(db.calls.find(call => call.table === table).filters.user_id, "owner");
  assert.equal(db.calls.find(call => call.table === "courses").filters.is_published, true);
  assert.equal(db.calls.find(call => call.table === "languages").filters.is_active, true);
  assert.equal(result.achievementCount, 1);
});
test("no enrollment or daily goal remains an honest empty state", async () => {
  const result = await loadDashboardOverview(database({ empty: true }), "owner");
  assert.deepEqual(result.courses, []); assert.equal(result.currentCourseId, null); assert.equal(result.goal, null); assert.equal(result.goalUnavailable, false);
});
test("optional goal failure does not erase profile or enrolled courses", async () => {
  const result = await loadDashboardOverview(database({ goalFailure: true }), "owner");
  assert.equal(result.courses.length, 2); assert.equal(result.goal, null); assert.equal(result.goalUnavailable, true);
  assert.ok(result.warnings.includes("Goal permission denied"));
});
test("achievement previews distinguish locked rows and use actual unlock dates", () => {
  const result = achievementPreviews([{ id: "a", name: "A" }, { id: "b", title: "B" }, { id: "c", name: "C" }],
    [{ achievement_id: "a", earned_at: "2026-10-01" }, { achievement_id: "b", unlocked_at: "2026-10-14" }]);
  assert.deepEqual(result.map(row => row.id), ["b", "a", "c"]); assert.equal(result[2].unlocked, false);
});
