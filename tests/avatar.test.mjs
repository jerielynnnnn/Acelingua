import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test, beforeEach } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../lib/avatar.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { initialAvatarSelection, canUseAvatarItem, saveLearnerAvatar, finishAvatarOnboarding } = await import(
  `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`,
);
const user = { id: "learner", user_metadata: {} };
const selection = { base: "base", face: "face", hair: "hair", clothes: "clothes" };
const starter = (category, changes = {}) => ({ id: category, name: category, category, image_path: `/test/${category}.png`, price_coins: 0, price_gems: 0, is_default: true, is_active: true, ...changes });
let storage;
beforeEach(() => {
  storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
});

// Test fixtures only; application choices always come from Supabase.
function database({ items = Object.keys(selection).map((category) => starter(category)), avatarFailure = null, progress = true, signedIn = user } = {}) {
  const owned = new Set();
  const equipped = new Map();
  const writes = [];
  return {
    owned, equipped, writes,
    auth: { getUser: async () => ({ data: { user: signedIn }, error: null }), updateUser: async () => ({ error: null }) },
    from(table) {
      let values, options;
      const query = {
        select() { return query; }, eq() { return query; }, in() { return query; },
        order() { return query; }, limit() { return query; }, maybeSingle() { return query; },
        upsert(input, config) { values = input; options = config; return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            if (values) {
              writes.push({ table, values });
              if (table === "user_avatar_items") {
                assert.deepEqual(options, { onConflict: "user_id,avatar_item_id", ignoreDuplicates: true });
                for (const row of values) { assert.equal(row.user_id, user.id); owned.add(row.avatar_item_id); }
              } else if (table === "user_avatar_equipped") {
                assert.equal(values.user_id, user.id);
                assert.deepEqual(options, { onConflict: "user_id" });
                if (avatarFailure) return { error: { message: avatarFailure } };
                equipped.set(values.user_id, values);
              } else assert.fail(`Unexpected write to ${table}`);
              return { error: null };
            }
            if (table === "avatar_items") return { data: items, error: null };
            if (table === "user_avatar_items") return { data: [...owned].map((avatar_item_id) => ({ avatar_item_id })), error: null };
            if (table === "user_courses") return { data: { id: "enrollment" }, error: null };
            if (table === "course_progress") return { data: progress ? { id: "progress" } : null, error: null };
            assert.fail(`Unexpected query to ${table}`);
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

test("initial selection prefers free defaults, restores equipped choices, and never grants paid defaults", () => {
  const items = [starter("hair", { id: "paid", price_coins: 20 }), starter("hair"), starter("hair", { id: "owned", price_gems: 10 })];
  assert.equal(initialAvatarSelection(items, new Set(), null).hair, "hair");
  assert.equal(initialAvatarSelection(items, new Set(["owned"]), { hair_id: "owned" }).hair, "owned");
  assert.equal(canUseAvatarItem(items[0], new Set()), false);
  assert.equal(initialAvatarSelection([], new Set(), null).base, null);
});
test("save and repeat create four ownership rows and one equipped row", async () => {
  const db = database();
  await saveLearnerAvatar(db, user.id, selection);
  await saveLearnerAvatar(db, user.id, selection);
  assert.equal(db.owned.size, 4);
  assert.equal(db.equipped.size, 1);
  assert.equal(db.writes.filter((write) => write.table === "user_avatar_items").length, 1);
  assert.equal(db.equipped.get(user.id).hair_id, "hair");
  assert.ok(db.writes.every((write) => ["user_avatar_items", "user_avatar_equipped"].includes(write.table)));
});
test("changed or missing session prevents writes", async () => {
  const changed = database({ signedIn: { ...user, id: "other" } });
  await assert.rejects(saveLearnerAvatar(changed, user.id, selection), /account changed/);
  assert.equal(changed.writes.length, 0);
  const guest = database({ signedIn: null });
  await assert.rejects(saveLearnerAvatar(guest, user.id, selection), /sign in/);
  assert.equal(guest.writes.length, 0);
});
test("paid unowned and category-mismatched selections are rejected before any writes", async () => {
  const items = Object.keys(selection).map((category) => starter(category));
  items[2].price_coins = 50;
  const paid = database({ items });
  await assert.rejects(saveLearnerAvatar(paid, user.id, selection), /not owned/);
  assert.equal(paid.writes.length, 0);
  items[2].price_coins = 0; items[2].category = "base";
  const wrong = database({ items });
  await assert.rejects(saveLearnerAvatar(wrong, user.id, selection), /hair/);
  assert.equal(wrong.writes.length, 0);
});
test("RLS save failure preserves onboarding state and reports the exact error", async () => {
  storage.set("acelingua_intro_completed", "true");
  const db = database({ avatarFailure: "new row violates row-level security policy" });
  await assert.rejects(saveLearnerAvatar(db, user.id, selection), /row-level security policy/);
  assert.equal(db.equipped.size, 0);
  assert.equal(storage.get("acelingua_intro_completed"), "true");
});
test("cleanup requires confirmed enrollment and course progress", async () => {
  storage.set("acelingua_onboarding_started", "true");
  storage.set("acelingua_onboarding_user_id", user.id);
  storage.set("acelingua_onboarding_course_id", "course");
  await assert.rejects(finishAvatarOnboarding(database({ progress: false }), user), /finish preparing your course/);
  assert.equal(storage.get("acelingua_onboarding_started"), "true");
  await finishAvatarOnboarding(database(), user);
  assert.equal(storage.get("acelingua_onboarding_started"), undefined);
  assert.equal(storage.get("acelingua_onboarding_completed_user_id"), user.id);
});
test("revisiting an existing avatar ignores another account's stale browser onboarding", async () => {
  storage.set("acelingua_onboarding_started", "true");
  storage.set("acelingua_onboarding_user_id", "another-learner");
  await finishAvatarOnboarding({ from: () => assert.fail("Must not read another account's selection") }, user);
  assert.equal(storage.get("acelingua_onboarding_started"), "true");
});
