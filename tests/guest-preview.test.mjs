import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function moduleUrl(file) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
  return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
}
const previewUrl = moduleUrl("../lib/guest-preview.ts");
const { readPreview, writePreview, validatePreview, previewResults, PREVIEW_KEY } = await import(previewUrl);
const transferSource = readFileSync(new URL("../lib/transfer-preview.ts", import.meta.url), "utf8")
  .replace('"@/lib/guest-preview"', JSON.stringify(previewUrl));
const output = ts.transpileModule(transferSource, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { transferPreview, prepareRegistrationPreview } = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
const id = "9e3b5bd7-f38e-42cc-8301-100e0fad7873";
const otherId = "8e3b5bd7-f38e-42cc-8301-100e0fad7873";
const preview = { version: 1, source: "guest_preview", languageId: id, languageCode: "ja", courseId: id, lessonId: id,
  answers: [{ id: "quiz-1", answer: "Hello", correct: true, kind: "quiz" }], completed: true, updatedAt: "2026-10-13T01:00:00.000Z" };
const user = { id, user_metadata: { acelingua_onboarding: { source: "guest_preview" } } };
let values;
beforeEach(() => {
  values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
});
test("refresh restores answers and derives temporary rewards", () => {
  writePreview(preview);
  assert.deepEqual(previewResults(readPreview()), { correct: 1, score: 100, stars: 3, xp: 5, coins: 2 });
  assert.equal(JSON.parse(values.get(PREVIEW_KEY)).temporaryXp, 5);
});
test("malformed, oversized, duplicated or wrongly typed history is rejected", () => {
  values.set(PREVIEW_KEY, "broken"); assert.equal(readPreview(), null);
  for (const value of [{ ...preview, lessonId: "invalid" }, { ...preview, updatedAt: "invalid" },
    { ...preview, answers: [...preview.answers, ...preview.answers] },
    { ...preview, answers: [{ ...preview.answers[0], correct: "true" }] },
    { ...preview, answers: [{ ...preview.answers[0], answer: "x".repeat(501) }] }]) assert.equal(validatePreview(value), null);
});
test("server failure binds and preserves local preview; success clears it; retry is a no-op", async () => {
  writePreview(preview);
  let calls = 0;
  const db = { rpc: async () => { calls++; return { error: calls === 1 ? { message: "offline" } : null }; } };
  await assert.rejects(transferPreview(db, user), /still saved/);
  assert.equal(readPreview().ownerId, id);
  await transferPreview(db, user);
  assert.equal(readPreview(), null);
  await transferPreview(db, user);
  assert.equal(calls, 2);
});
test("verification on another browser restores preview from signup metadata", async () => {
  let sent;
  await transferPreview({ rpc: async (name, args) => { sent = { name, args }; return { error: null }; } },
    { id, user_metadata: { acelingua_guest_preview: preview } });
  assert.equal(sent.name, "acelingua_save_guest_preview");
  assert.equal(sent.args.p_preview.lessonId, id);
});
test("a preview bound to another account and unfinished previews are never transferred", async () => {
  const db = { rpc: () => assert.fail("Unexpected transfer") };
  writePreview({ ...preview, ownerId: otherId }); await transferPreview(db, user);
  writePreview({ ...preview, completed: false }); await transferPreview(db, user);
});
test("returning Google account ignores pending signup preview", async () => {
  writePreview(preview); values.set("acelingua_registration_pending", "true");
  const query = { select() { return this; }, eq() { return this; }, limit() { return this; }, maybeSingle: async () => ({ data: { course_id: id }, error: null }) };
  const db = { from: () => query, auth: { updateUser: () => assert.fail("Existing account metadata changed") } };
  assert.equal(await prepareRegistrationPreview(db, user), user);
  assert.ok(readPreview());
});

test("new Google signup preserves the preview's exact course in metadata", async () => {
  writePreview(preview); values.set("acelingua_registration_pending", "true");
  const query = { select() { return this; }, eq() { return this; }, limit() { return this; }, maybeSingle: async () => ({ data: null, error: null }) };
  let metadata;
  const db = { from: () => query, auth: { updateUser: async input => { metadata = input.data; return { data: { user: { ...user, user_metadata: metadata } }, error: null }; } } };
  const prepared = await prepareRegistrationPreview(db, user);
  assert.equal(prepared.user_metadata.acelingua_onboarding.courseId, preview.courseId);
  assert.equal(metadata.acelingua_onboarding.source, "guest_preview");
  assert.ok(readPreview(), "Keep local preview until receipt confirmation");
});
