import assert from "node:assert/strict";
import { test } from "node:test";
import { startSpeechSession, speechErrorMessage } from "../lib/speech-recognition.ts";

function harness({ throwStart = false, timeout = 1000 } = {}) {
  const created = []; const states = []; const errors = []; const results = [];
  class FakeRecognition {
    constructor() { created.push(this); this.aborted = false; }
    start() { if (throwStart) { const error = new Error("permission"); error.name = "NotAllowedError"; throw error; } }
    abort() { this.aborted = true; this.onend?.(); }
    stop() { this.finished = true; }
  }
  const session = startSpeechSession(FakeRecognition, "ja-JP", { onState: state => states.push(state), onError: value => errors.push(value), onResult: value => results.push(value) }, timeout);
  return { engine: created[0], session, states, errors, results };
}
test("listening is reported only after the engine actually starts", () => {
  const h = harness(); assert.deepEqual(h.states, ["starting"]); assert.equal(h.engine.lang, "ja-JP");
  h.engine.onstart(); assert.deepEqual(h.states, ["starting", "listening"]); h.session.stop();
});
test("final transcript stops capture and late end cannot overwrite feedback", () => {
  const h = harness(); const end = h.engine.onend;
  h.engine.onresult({ results: { 0: { isFinal: true, 0: { transcript: " こんにちは " } } } });
  end(); assert.deepEqual(h.results, ["こんにちは"]); assert.deepEqual(h.errors, []); assert.ok(h.engine.aborted);
});
test("recognition ending with no result produces an actionable error", () => {
  const h = harness(); h.engine.onend(); assert.match(h.errors[0], /without recognizing/); assert.equal(h.states.at(-1), "idle");
});
test("network, permission, device and unsupported-language failures stay distinct", () => {
  for (const [code, expected] of [["network", /connection/], ["not-allowed", /permissions/], ["audio-capture", /input device/], ["language-not-supported", /doesn't support/], ["service-not-allowed", /service is blocked/]]) {
    const h = harness(); h.engine.onerror({ error: code }); assert.match(h.errors[0], expected); assert.equal(h.engine.onresult, null);
  }
  assert.match(speechErrorMessage("no-speech"), /No speech/);
});
test("start permission exception resets state so the user can retry", () => {
  const h = harness({ throwStart: true }); assert.equal(h.states.at(-1), "idle"); assert.match(h.errors[0], /permissions/);
});
test("stalled startup cannot leave an indefinite listening indicator", async () => {
  const h = harness({ timeout: 10 }); await new Promise(resolve => setTimeout(resolve, 30));
  assert.match(h.errors[0], /timed out/); assert.equal(h.states.at(-1), "idle"); assert.ok(h.engine.aborted);
});
test("manual stop silences callbacks and cannot generate a recognition result", () => {
  const h = harness(); const result = h.engine.onresult; h.session.stop();
  result({ results: { 0: { 0: { transcript: "こんにちは" } } } });
  assert.deepEqual(h.results, []); assert.deepEqual(h.errors, []);
});

test("done speaking requests a result without aborting captured speech", () => {
  const h = harness(); h.engine.onstart(); h.session.finish();
  assert.equal(h.engine.finished, true); assert.equal(h.engine.aborted, false);
  h.engine.onresult({ results: { 0: { isFinal: true, 0: { transcript: "こんにちは" } } } });
  assert.deepEqual(h.results, ["こんにちは"]); assert.deepEqual(h.errors, []);
});

test("interim words survive normal recognition end and can be checked", () => {
  const h = harness();
  h.engine.onresult({ results: { 0: { isFinal: false, 0: { transcript: "ありがとう" } } } });
  assert.deepEqual(h.results, []); h.session.finish(); h.engine.onend();
  assert.deepEqual(h.results, ["ありがとう"]); assert.deepEqual(h.errors, []);
});

test("cancel discards interim words and late callbacks stay silent", () => {
  const h = harness();
  h.engine.onresult({ results: { 0: { isFinal: false, 0: { transcript: "ありがとう" } } } });
  const ended = h.engine.onend; h.session.stop(); ended();
  assert.deepEqual(h.results, []); assert.deepEqual(h.errors, []);
});
