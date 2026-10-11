import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function moduleUrl(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
  return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
}
const avatarUrl = moduleUrl("../lib/avatar.ts");
const worldSource = readFileSync(new URL("../lib/world/data.ts", import.meta.url), "utf8").replace('"@/lib/avatar"', JSON.stringify(avatarUrl));
const worldOutput = ts.transpileModule(worldSource, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { loadWorldData } = await import(`data:text/javascript;base64,${Buffer.from(worldOutput).toString("base64")}`);
const { languageLocations, mapPosition } = await import(moduleUrl("../lib/world/languageLocations.ts"));

test("world queries are read-only, scoped to the learner, and preserve missing progress", async () => {
  const calls = [];
  const rows = {
    languages: [{ id: "ja", code: "ja", name: "Japanese" }],
    user_courses: [{ course_id: "course", status: "active" }],
    courses: [{ id: "course", language_id: "ja", title: "Japanese Beginner", level: "beginner" }],
    course_progress: [], avatar_items: [], user_avatar_items: [], user_avatar_equipped: null,
  };
  const db = { from(table) {
    const call = { table, filters: [] }; calls.push(call);
    const query = {
      select() { return query; }, order() { return query; }, maybeSingle() { return query; },
      eq(key, value) { call.filters.push([key, value]); return query; },
      in(key, value) { call.filters.push([key, value]); return query; },
      then(resolve, reject) { return Promise.resolve({ data: rows[table], error: null }).then(resolve, reject); },
    };
    return query;
  } };
  const result = await loadWorldData(db, "learner");
  assert.equal(result.courses[0].progress, null);
  assert.equal(result.hasAvatar, false);
  assert.deepEqual(result.avatar, []);
  for (const table of ["user_courses", "course_progress", "user_avatar_items", "user_avatar_equipped"]) {
    assert.ok(calls.find(call => call.table === table).filters.some(([key, value]) => key === "user_id" && value === "learner"));
  }
  assert.ok(calls.find(call => call.table === "languages").filters.some(([key, value]) => key === "is_active" && value === true));
  assert.ok(calls.find(call => call.table === "courses").filters.some(([key, value]) => key === "is_published" && value === true));
});

test("configured map positions stay inside the map and Japan lies east of France", () => {
  for (const location of Object.values(languageLocations)) {
    const { x, y } = mapPosition(location);
    assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100);
  }
  assert.ok(mapPosition(languageLocations.ja).x > mapPosition(languageLocations.fr).x);
});
