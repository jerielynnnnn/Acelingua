import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
const compile = source => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText).toString("base64")}`;
const avatarUrl = compile(readFileSync(new URL("../lib/avatar.ts", import.meta.url), "utf8"));
const source = readFileSync(new URL("../lib/store.ts", import.meta.url), "utf8").replace('"@/lib/avatar"', JSON.stringify(avatarUrl));
const { loadStore, purchaseAvatarItem, validStorePrice } = await import(compile(source));
const item = { id: "item", name: "Hair", category: "hair", price_coins: 10, price_gems: 2 };
test("prices reject negatives, missing values, fractions and unsafe numbers", () => {
  assert.equal(validStorePrice(item), true);
  assert.equal(validStorePrice({ price_coins: 0, price_gems: 0 }), true);
  for (const value of [-1, 0.5, NaN, undefined, "10", Number.MAX_SAFE_INTEGER + 1]) assert.equal(validStorePrice({ price_coins: value, price_gems: 0 }), false);
});
test("store reads only active catalog and this learner's ownership and balances", async () => {
  const calls = [];
  const db = { from(table) {
    const filters = {}; calls.push({ table, filters });
    const query = { select() { return this; }, eq(key, value) { filters[key] = value; return this; }, order() { return this; }, maybeSingle() { return this; },
      then(resolve, reject) { return Promise.resolve({ data: table === "avatar_items" ? [item] : table === "user_avatar_items" ? [{ avatar_item_id: "item" }] : { coins: 30, gems: 5 }, error: null }).then(resolve, reject); } };
    return query;
  } };
  const result = await loadStore(db, "learner");
  assert.equal(result.coins, 30); assert.equal(result.gems, 5); assert.ok(result.ownedIds.has("item"));
  assert.deepEqual(calls.map(c => c.filters), [{ is_active: true }, { user_id: "learner" }, { id: "learner" }]);
});
test("purchase delegates item and expected prices to RPC without client balance writes", async () => {
  let call;
  const db = { auth: { getUser: async () => ({ data: { user: { id: "learner" } }, error: null }) }, rpc: async (name, args) => {
    call = { name, args }; return { data: { already_owned: false, coins: 20, gems: 3 }, error: null };
  } };
  assert.equal((await purchaseAvatarItem(db, "learner", item)).coins, 20);
  assert.deepEqual(call, { name: "acelingua_purchase_avatar_item", args: { p_item_id: "item", p_expected_coins: 10, p_expected_gems: 2 } });
});
test("changed session prevents any purchase call", async () => {
  const db = { auth: { getUser: async () => ({ data: { user: { id: "other" } }, error: null }) }, rpc: () => assert.fail("Unexpected purchase") };
  await assert.rejects(purchaseAvatarItem(db, "learner", item), /session changed/);
});
test("missing purchase function and insufficient funds do not fabricate success", async () => {
  for (const error of [{ code: "PGRST202", message: "function missing" }, { message: "Insufficient funds" }]) {
    const db = { auth: { getUser: async () => ({ data: { user: { id: "learner" } }, error: null }) }, rpc: async () => ({ data: null, error }) };
    await assert.rejects(purchaseAvatarItem(db, "learner", item), error.code ? /not available yet/ : /Insufficient funds/);
  }
});
test("repeat receipt retains the server balances and invalid receipts are rejected", async () => {
  const db = { auth: { getUser: async () => ({ data: { user: { id: "learner" } }, error: null }) }, rpc: async () => ({ data: { already_owned: true, coins: 20, gems: 3 }, error: null }) };
  assert.equal((await purchaseAvatarItem(db, "learner", item)).already_owned, true);
  db.rpc = async () => ({ data: { coins: "20" }, error: null });
  await assert.rejects(purchaseAvatarItem(db, "learner", item), /couldn't confirm/);
});
