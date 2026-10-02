import { test } from "node:test";
import assert from "node:assert/strict";
import { createMidnightReminderExtension } from "../../extensions/midnight-reminder/index.ts";
import { REMINDER_MESSAGE } from "../../extensions/midnight-reminder/policy.ts";
import { FakeTime, fakeContext, fakePi } from "./fakes.ts";

const SEC = 1000;
const at = (day: number, h: number, m = 0, s = 0) => new Date(2026, 9, day, h, m, s);

function load(start: Date) {
  const time = new FakeTime(start);
  const fake = fakePi();
  createMidnightReminderExtension({ now: time.now, timers: time.timers })(fake.pi as never);
  return { time, ...fake };
}

test("loading the extension registers /bedtime-test and creates no timer", () => {
  const { commands, time } = load(at(6, 0, 30));
  assert.ok(commands.has("bedtime-test"));
  assert.equal(time.createdCount, 0, "timers must not start in the factory");
});

test("/bedtime-test shows the message without changing automatic reminder state", async () => {
  const { commands, emit, time } = load(at(5, 23, 59, 40));
  const { ctx, notes } = fakeContext("tui");
  await emit("session_start", { type: "session_start", reason: "startup" }, ctx);
  await commands.get("bedtime-test")!.handler("", ctx);
  assert.deepEqual(notes.map((n) => n.message), [REMINDER_MESSAGE]);
  time.advance(60 * SEC); // cross midnight
  assert.equal(notes.length, 2, "automatic reminder still fires after a preview");
  await commands.get("bedtime-test")!.handler("", ctx);
  assert.equal(notes.length, 3, "preview works even after the automatic reminder");
  time.advance(10 * 60 * SEC);
  assert.equal(notes.length, 3, "no duplicate automatic reminder");
});

test("interactive startup after midnight shows a visible warning immediately", async () => {
  const { emit } = load(at(6, 0, 30));
  const { ctx, notes } = fakeContext("tui");
  await emit("session_start", { type: "session_start", reason: "startup" }, ctx);
  assert.deepEqual(notes, [{ message: REMINDER_MESSAGE, type: "warning" }]);
});

for (const mode of ["print", "json", "rpc"] as const) {
  test(`non-interactive mode "${mode}" creates no timer and no notification`, async () => {
    const { emit, time } = load(at(6, 1, 0));
    const { ctx, notes } = fakeContext(mode);
    await emit("session_start", { type: "session_start", reason: "startup" }, ctx);
    time.advance(5 * 60 * SEC);
    assert.equal(time.createdCount, 0);
    assert.equal(notes.length, 0);
  });
}

test("session_shutdown clears the timer and is idempotent", async () => {
  const { emit, time } = load(at(5, 22, 0));
  const { ctx } = fakeContext("tui");
  await emit("session_start", { type: "session_start", reason: "startup" }, ctx);
  assert.equal(time.activeCount, 1);
  await emit("session_shutdown", { type: "session_shutdown", reason: "quit" }, ctx);
  await emit("session_shutdown", { type: "session_shutdown", reason: "quit" }, ctx);
  assert.equal(time.activeCount, 0);
});

test("reload/new session leaves one timer and never uses the old context", async () => {
  const { emit, time } = load(at(5, 23, 59));
  const first = fakeContext("tui");
  await emit("session_start", { type: "session_start", reason: "startup" }, first.ctx);
  await emit("session_shutdown", { type: "session_shutdown", reason: "new" }, first.ctx);
  const second = fakeContext("tui");
  await emit("session_start", { type: "session_start", reason: "new" }, second.ctx);
  assert.equal(time.activeCount, 1);
  time.advance(2 * 60 * SEC);
  assert.equal(first.notes.length, 0, "old context is not used");
  assert.equal(second.notes.length, 1);
});

test("session_start without a prior shutdown still keeps a single timer", async () => {
  const { emit, time } = load(at(5, 21, 0));
  const a = fakeContext("tui");
  await emit("session_start", { type: "session_start", reason: "startup" }, a.ctx);
  const b = fakeContext("tui");
  await emit("session_start", { type: "session_start", reason: "resume" }, b.ctx);
  assert.equal(time.activeCount, 1);
});
