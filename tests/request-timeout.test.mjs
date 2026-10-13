import assert from "node:assert/strict";
import { test } from "node:test";
import { withTimeout } from "../lib/request-timeout.ts";

test("a stalled session or catalog read stops waiting with a retryable error", async () => {
  await assert.rejects(withTimeout(new Promise(() => {}), 10, "Please retry"), /Please retry/);
});
test("successful reads and actual database failures retain their original result", async () => {
  assert.equal(await withTimeout(Promise.resolve("languages"), 1000, "timeout"), "languages");
  await assert.rejects(withTimeout(Promise.reject(new Error("RLS denied")), 1000, "timeout"), /RLS denied/);
});
