# W1 reflection — decisions verified and agent assumptions corrected

> Edit this in your own words before submitting; each partner should be able to explain these points.

1. **Local date, not UTC.** The common shortcut `new Date().toISOString().slice(0, 10)` gives the **UTC** date: at 00:30 in Asia/Calcutta (UTC+5:30) it is still the previous day in UTC, so the reminder date would be wrong around midnight. We used `localDateKey()` built from `getFullYear/getMonth/getDate`, and added a test (`2026-01-01 00:30 local → "2026-01-01"`). The suite is run in several time zones (Asia/Calcutta, America/New_York, UTC, Pacific/Auckland).
2. **Notification type checked against the installed Pi types.** `ctx.ui.notify` accepts only `"info" | "warning" | "error"` in `extensions/types.ts`; a documentation summary also listed `"success"`, which the types do not allow, so we used `"warning"`. Verified with `tsc` against `@earendil-works/pi-coding-agent` 1.0.0.
3. **"Interactive" means `ctx.mode === "tui"`.** `ctx.hasUI` is also true in RPC mode, so using it would start a timer in a non-interactive client. The spec says skip both notification and timer outside interactive use.
4. **No timer in the factory.** The Pi docs say some invocations load extensions without starting a session, so the timer starts in `session_start` and stops in an idempotent `session_shutdown`; `session_start` also stops any previous scheduler so reloads never accumulate timers or use an old `ctx`.
5. **Preview must not consume the nightly reminder.** Test: preview at 23:59:40, then crossing midnight still delivers the automatic reminder.
6. **Prompt improvement.** "Make a bedtime reminder" was too vague. The improved prompt listed the 00:00–06:00 window, one reminder per local date, delivery within 1 minute while idle, `/bedtime-test` not changing state, non-interactive behavior, simulated-time testing, and red-green TDD.
