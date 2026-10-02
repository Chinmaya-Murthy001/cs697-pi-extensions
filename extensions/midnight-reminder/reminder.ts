// Scheduler for the automatic reminder. Clock, timers and notification are injected
// so tests can simulate time; index.ts wires in the real ones.
import { localDateKey, REMINDER_MESSAGE, shouldRemind } from "./policy.ts";

export const CHECK_INTERVAL_MS = 30_000;

export interface TimerApi {
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(handle: unknown): void;
}

export interface ReminderOptions {
  now: () => Date;
  timers: TimerApi;
  notify: (message: string) => void;
  intervalMs?: number;
}

export interface Reminder {
  start(): void;
  stop(): void;
  check(): boolean;
}

export function createReminder(options: ReminderOptions): Reminder {
  // Local date ("YYYY-MM-DD") of the last automatic reminder in this session.
  let lastRemindedDate: string | null = null;
  let handle: unknown = undefined;
  let running = false;

  // Reads the actual time on every call, so a delayed callback (e.g. after sleep)
  // never assumes the computer stayed awake.
  function check(): boolean {
    const now = options.now();
    if (!shouldRemind(now, lastRemindedDate)) return false;
    // Record the date before notifying, in the same synchronous path, so no
    // second check can slip in and produce a duplicate.
    lastRemindedDate = localDateKey(now);
    options.notify(REMINDER_MESSAGE);
    return true;
  }

  function start(): void {
    if (running) return;
    running = true;
    check(); // immediate check on startup
    handle = options.timers.setInterval(check, options.intervalMs ?? CHECK_INTERVAL_MS);
  }

  function stop(): void {
    if (!running) return;
    running = false;
    options.timers.clearInterval(handle);
    handle = undefined;
  }

  return { start, stop, check };
}
