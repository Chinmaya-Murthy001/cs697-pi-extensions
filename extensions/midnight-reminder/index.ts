// Midnight Reminder — Pi extension entry point.
// Load with: pi --extension ./extensions/midnight-reminder/index.ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { REMINDER_MESSAGE } from "./policy.ts";
import { createReminder } from "./reminder.ts";
import type { Reminder, TimerApi } from "./reminder.ts";
import { createClock } from "./clock.ts";

export interface ExtensionDeps {
  now: () => Date;
  timers: TimerApi;
}

export function createMidnightReminderExtension(deps: ExtensionDeps) {
  return function midnightReminder(pi: ExtensionAPI) {
    // One scheduler per session, bound to that session's ctx. Never started in the factory.
    let reminder: Reminder | undefined;

    const stopReminder = () => {
      reminder?.stop();
      reminder = undefined;
    };

    pi.registerCommand("bedtime-test", {
      description: "Preview the midnight reminder (does not change the automatic reminder state)",
      handler: async (_args, ctx) => {
        ctx.ui.notify(REMINDER_MESSAGE, "warning");
      },
    });

    pi.on("session_start", async (_event, ctx) => {
      stopReminder(); // never accumulate timers, even without a prior shutdown
      if (ctx.mode !== "tui") return; // non-interactive: no timer, no notification
      reminder = createReminder({
        now: deps.now,
        timers: deps.timers,
        notify: (message) => ctx.ui.notify(message, "warning"),
      });
      reminder.start();
    });

    pi.on("session_shutdown", async () => {
      stopReminder(); // idempotent
    });
  };
}

const realTimers: TimerApi = {
  setInterval: (fn, ms) => {
    const handle = setInterval(fn, ms);
    handle.unref?.(); // never keep the process alive just for the reminder
    return handle;
  },
  clearInterval: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
};

export default createMidnightReminderExtension({
  now: createClock(process.env),
  timers: realTimers,
});
