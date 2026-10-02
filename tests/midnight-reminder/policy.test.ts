import { test } from "node:test";
import assert from "node:assert/strict";
import { isLateNight, localDateKey, shouldRemind, REMINDER_MESSAGE } from "../../extensions/midnight-reminder/policy.ts";

// Explicit local date components: new Date(year, monthIndex, day, hour, minute).
// October = monthIndex 9.
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute);

test("23:59 with no prior reminder -> no reminder", () => {
  assert.equal(shouldRemind(at(5, 23, 59), null), false);
});

test("00:00 with no reminder for this date -> remind", () => {
  assert.equal(shouldRemind(at(6, 0, 0), null), true);
  assert.equal(shouldRemind(at(6, 0, 0), "2026-10-05"), true);
});

test("00:01 already reminded today -> no duplicate", () => {
  assert.equal(shouldRemind(at(6, 0, 1), "2026-10-06"), false);
});

test("05:59 with no reminder today -> remind", () => {
  assert.equal(shouldRemind(at(6, 5, 59), "2026-10-05"), true);
});

test("06:00 or noon -> no reminder", () => {
  assert.equal(shouldRemind(at(6, 6, 0), null), false);
  assert.equal(shouldRemind(at(6, 12, 0), null), false);
});

test("midnight on the next date -> remind again", () => {
  assert.equal(shouldRemind(at(7, 0, 0), "2026-10-06"), true);
});

test("late-night window is [00:00, 06:00)", () => {
  assert.equal(isLateNight(at(6, 0, 0)), true);
  assert.equal(isLateNight(at(6, 5, 59)), true);
  assert.equal(isLateNight(at(6, 6, 0)), false);
  assert.equal(isLateNight(at(5, 23, 59)), false);
});

test("date key is built from LOCAL fields, not UTC", () => {
  // 00:30 local on Jan 1 can still be Dec 31 in UTC (e.g. in Asia/Calcutta).
  assert.equal(localDateKey(new Date(2026, 0, 1, 0, 30)), "2026-01-01");
  assert.equal(localDateKey(at(6, 0, 0)), "2026-10-06");
});

test("reminder message matches the specification", () => {
  assert.equal(REMINDER_MESSAGE, "It is after midnight. Consider saving your work and getting some sleep.");
});
