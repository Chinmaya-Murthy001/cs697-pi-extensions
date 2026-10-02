import { test } from "node:test";
import assert from "node:assert/strict";
import { createReminder, CHECK_INTERVAL_MS } from "../../extensions/midnight-reminder/reminder.ts";
import { REMINDER_MESSAGE } from "../../extensions/midnight-reminder/policy.ts";
import { FakeTime } from "./fakes.ts";

const SEC = 1000;
const MIN = 60 * SEC;
const at = (day: number, h: number, m = 0, s = 0) => new Date(2026, 9, day, h, m, s);

function setup(start: Date) {
  const time = new FakeTime(start);
  const sent: { message: string; at: Date }[] = [];
  const reminder = createReminder({
    now: time.now,
    timers: time.timers,
    notify: (message) => sent.push({ message, at: time.now() }),
  });
  return { time, sent, reminder };
}

test("checks every 30 seconds", () => {
  assert.equal(CHECK_INTERVAL_MS, 30 * SEC);
});

test("crossing midnight while idle delivers within 60 simulated seconds", () => {
  const { time, sent, reminder } = setup(at(5, 23, 59, 0));
  reminder.start();
  assert.equal(sent.length, 0, "no reminder at 23:59");
  time.advance(2 * MIN);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].message, REMINDER_MESSAGE);
  const delayMs = sent[0].at.getTime() - at(6, 0, 0, 0).getTime();
  assert.ok(delayMs >= 0 && delayMs <= 60 * SEC, `delivered ${delayMs} ms after midnight`);
});

test("repeated timer checks do not duplicate the reminder", () => {
  const { time, sent, reminder } = setup(at(5, 23, 59, 30));
  reminder.start();
  time.advance(5 * 60 * MIN); // until 04:59
  assert.equal(sent.length, 1);
  reminder.check();
  reminder.check();
  assert.equal(sent.length, 1);
});

test("startup during the late-night window reminds immediately", () => {
  const { sent, reminder } = setup(at(6, 1, 15));
  reminder.start();
  assert.equal(sent.length, 1);
});

test("the next night reminds again", () => {
  const { time, sent, reminder } = setup(at(5, 23, 59));
  reminder.start();
  time.advance(25 * 60 * MIN); // to 00:59 on Oct 7
  assert.equal(sent.length, 2);
});

test("no reminder between 06:00 and midnight", () => {
  const { time, sent, reminder } = setup(at(6, 6, 0));
  reminder.start();
  time.advance(17 * 60 * MIN); // to 23:00
  assert.equal(sent.length, 0);
});

test("resuming from sleep inside the window reminds on the next check", () => {
  const { time, sent, reminder } = setup(at(5, 23, 0));
  reminder.start();
  time.sleep(3 * 60 * MIN); // asleep until 02:00, no callbacks ran
  assert.equal(sent.length, 0);
  time.advance(30 * SEC);
  assert.equal(sent.length, 1);
});

test("resuming from sleep after 06:00 skips the missed reminder", () => {
  const { time, sent, reminder } = setup(at(5, 23, 0));
  reminder.start();
  time.sleep(7.5 * 60 * MIN); // asleep until 06:30
  time.advance(10 * MIN);
  assert.equal(sent.length, 0);
});

test("stop() clears the timer, is idempotent, and nothing fires afterwards", () => {
  const { time, sent, reminder } = setup(at(5, 23, 59));
  reminder.start();
  assert.equal(time.activeCount, 1);
  reminder.stop();
  reminder.stop();
  assert.equal(time.activeCount, 0);
  time.advance(10 * MIN);
  assert.equal(sent.length, 0);
});

test("start() twice does not create a second timer", () => {
  const { time, reminder } = setup(at(5, 22, 0));
  reminder.start();
  reminder.start();
  assert.equal(time.activeCount, 1);
  assert.equal(time.createdCount, 1);
});
