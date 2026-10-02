import { test } from "node:test";
import assert from "node:assert/strict";
import { createClock } from "../../extensions/midnight-reminder/clock.ts";

test("without BEDTIME_FAKE_NOW the clock is real time", () => {
  const now = createClock({}, () => 1_000);
  assert.equal(now().getTime(), 1_000);
});

test("BEDTIME_FAKE_NOW starts a simulated local clock that keeps ticking", () => {
  let real = 5_000;
  const now = createClock({ BEDTIME_FAKE_NOW: "2026-10-05T23:59:30" }, () => real);
  assert.equal(now().getTime(), new Date(2026, 9, 5, 23, 59, 30).getTime());
  real += 45_000;
  const later = now();
  assert.equal(later.getHours(), 0);
  assert.equal(later.getMinutes(), 0);
  assert.equal(later.getSeconds(), 15);
});

test("an invalid BEDTIME_FAKE_NOW is rejected with a clear error", () => {
  assert.throws(() => createClock({ BEDTIME_FAKE_NOW: "midnight" }), /BEDTIME_FAKE_NOW/);
  assert.throws(() => createClock({ BEDTIME_FAKE_NOW: "2026-10-06" }), /BEDTIME_FAKE_NOW/);
});
