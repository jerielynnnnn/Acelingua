import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadRoute(path, auth) {
  const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, URL, require(name) {
    if (name === "@/lib/supabase/server") return { createClient: async () => ({ auth }) };
    if (name === "next/server") return { NextResponse: { redirect: (url, options) => ({ url, options }) } };
    throw Error("Unexpected import " + name);
  } });
  return exports.GET;
}
let verified;
const recovery = loadRoute("../app/auth/recovery/route.ts", { verifyOtp: async options => { verified = options; return { error: null }; } });
assert.equal((await recovery({ url: "http://localhost:3000/auth/recovery?token_hash=test&next=https://evil.example" })).url, "http://localhost:3000/reset-password");
assert.equal(verified.type, "recovery");
assert.equal(verified.token_hash, "test");
assert.equal((await recovery({ url: "http://localhost:3000/auth/recovery" })).url, "http://localhost:3000/forgot-password?error=recovery");
const expired = loadRoute("../app/auth/recovery/route.ts", { verifyOtp: async () => ({ error: new Error("expired") }) });
assert.equal((await expired({ url: "http://localhost:3000/auth/recovery?token_hash=expired" })).url, "http://localhost:3000/forgot-password?error=recovery");
const callback = loadRoute("../app/auth/callback/route.ts", { exchangeCodeForSession: async () => ({ error: null }) });
assert.equal((await callback({ url: "http://localhost:3000/auth/callback?code=test&next=/reset-password" })).url, "http://localhost:3000/reset-password");
assert.equal((await callback({ url: "http://localhost:3000/auth/callback?code=test&next=https://evil.example" })).url, "http://localhost:3000/onboarding/continue");
assert.equal((await callback({ url: "http://localhost:3000/auth/callback?code=test" })).url, "http://localhost:3000/onboarding/continue");
console.log("Passed recovery token verification, invalid/expired links, reset callback routing, redirect allowlist, and existing sign-in routing.");
