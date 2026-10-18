import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { adventureSql, validateAdventure } from "../scripts/build-country-adventure.mjs";

function loadModule(path, imports = {}) {
  const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const exports = {};
  vm.runInNewContext(compiled.outputText, { exports, require: name => imports[name] ?? {}, Set, Map, Error });
  return exports;
}
const { roadmapStates } = loadModule("../lib/roadmap.ts");
const { loadCourseTravelAccess } = loadModule("../lib/travel/access.ts");
const plan = JSON.parse(fs.readFileSync(new URL("../supabase/japan-adventure.json", import.meta.url), "utf8"));
const lesson = (id, order) => ({ id, lesson_order: order });
const unit = (id, order, lessons) => ({ id, unit_order: order, lessons });

test("sequential progression spans units and resumes the earliest gap", () => {
  const units = [unit("u2", 2, [lesson("c", 1)]), unit("u1", 1, [lesson("b", 2), lesson("a", 1)])];
  const result = roadmapStates(units, [{ lesson_id: "a", status: "completed" }, { lesson_id: "b", status: "in_progress" }]);
  assert.equal(result.get("a"), "completed");
  assert.equal(result.get("b"), "current");
  assert.equal(result.get("c"), "locked");
});
test("historical later completions survive reordering without unlocking gaps", () => {
  const result = roadmapStates([unit("u", 1, [lesson("new", 1), lesson("old", 2), lesson("later", 3)])], [{ lesson_id: "old", status: "completed" }]);
  assert.equal(result.get("new"), "current");
  assert.equal(result.get("old"), "completed");
  assert.equal(result.get("later"), "locked");
});
test("another course's progress never completes a lesson in this course", () => {
  const result = roadmapStates([unit("u", 1, [lesson("a", 1), lesson("b", 2)])], [{ lesson_id: "foreign", status: "completed" }]);
  assert.equal(result.get("a"), "current");
  assert.equal(result.get("b"), "locked");
});
test("UUID tie breakers yield a single current lesson and do not mutate input", () => {
  const units = [unit("u", 1, [lesson("z", 1), lesson("a", 1)])];
  const result = roadmapStates(units, []);
  assert.equal(result.get("a"), "current");
  assert.equal(result.get("z"), "locked");
  assert.equal(units[0].lessons[0].id, "z");
});

function database(results) {
  return { from(table) {
    const builder = new Proxy({}, { get: (_, prop) => prop === "then" ? resolve => Promise.resolve(results[table]).then(resolve) : () => builder });
    return builder;
  } };
}
const catalog = {
  travel_country_languages: { data: [{ country_id: "jp" }, { country_id: "other" }], error: null },
  travel_countries: { data: [{ id: "jp", name: "Japan" }, { id: "other", name: "Elsewhere" }], error: null },
  travel_country_units: { data: [{ country_id: "jp", unit_id: "u" }], error: null },
};
test("an unrelated country's visit cannot bypass a mapped destination arrival", async () => {
  const db = database({ ...catalog, travel_visits: { data: [{ country_id: "other", introduction_completed_at: "2026-10-18" }], error: null } });
  const access = await loadCourseTravelAccess(db, "user", "language", "ja", ["u"]);
  assert.equal(access.arrived, false);
  assert.equal(access.href, "/world/ja");
});
test("only a completed introduction opens the country course", async () => {
  for (const completed of [null, "2026-10-18"]) {
    const db = database({ ...catalog, travel_visits: { data: [{ country_id: "jp", introduction_completed_at: completed }], error: null } });
    assert.equal((await loadCourseTravelAccess(db, "user", "language", "ja", ["u"])).arrived, Boolean(completed));
  }
});
test("travel query failures fail closed", async () => {
  const db = database({ travel_country_languages: { data: null, error: { message: "offline" } } });
  await assert.rejects(() => loadCourseTravelAccess(db, "user", "language", "ja", []), /could not be verified/);
});
test("all eight authored destinations have five roles and valid practical scenarios", () => {
  validateAdventure(plan);
  assert.equal(plan.units.length * 5, 40);
  for (const unit of plan.units) {
    assert.equal(unit.roles.length, 5);
    assert.ok(unit.scenario.explanation.length > 30);
  }
});
test("invalid content cannot generate a publishable seed", () => {
  const broken = structuredClone(plan);
  broken.units[0].scenario.answer = "not in options";
  assert.throws(() => adventureSql(broken), /Invalid scenario/);
  broken.units[0] = structuredClone(plan.units[0]);
  broken.units[0].words = [];
  assert.throws(() => adventureSql(broken), /Incomplete unit/);
});
