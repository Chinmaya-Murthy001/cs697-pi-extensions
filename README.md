# CS 480/697 Pi Extensions

Pi Coding Agent extensions built for CS 480/697 (UMass Boston, Fall 2026).

## W1 — Midnight Reminder

A Pi extension that reminds the user to stop working during late-night hours.

### Behavior specification / acceptance criteria

1. Uses the **local time zone** of the machine running Pi. Late-night hours are **00:00 inclusive to 06:00 exclusive**.
2. Displays a visible message: *"It is after midnight. Consider saving your work and getting some sleep."* The user remains free to continue working; nothing is blocked.
3. While interactive Pi stays open and the computer is awake, the reminder appears **within one minute after midnight** without another user prompt (periodic check every 30 seconds).
4. If Pi **starts** between 00:00 and 06:00, the reminder is shown on startup. If execution resumes after a pause during that window, it is shown on the next check. If the computer resumes after 06:00, the missed reminder is skipped.
5. **At most one automatic reminder per local calendar date** within the current extension session. Repeated prompts and timer checks never produce duplicates. The next night reminds again.
6. A fresh session or extension reload may remind again. Persistence across restarts is not implemented (optional). Separate Pi processes keep separate state.
7. `/bedtime-test` previews the message **without changing** the automatic reminder state.
8. The timer stops when the extension session shuts down. Reloading does not accumulate timers or use an old session context.
9. No extra model calls, no tool blocking, never terminates Pi. In **non-interactive** modes (print, JSON, RPC) no notification and no timer are created.

### Test cases (simulated time)

| Supplied local time / state | Expected |
|---|---|
| 23:59, no prior reminder | No reminder |
| 00:00, no reminder for this date | Remind |
| 00:01, already reminded today | No duplicate |
| 05:59, no reminder today | Remind |
| 06:00 or noon | No reminder |
| Midnight on the next date | Remind again |

### Repository layout

```
extensions/midnight-reminder/
  index.ts      Pi entry point: /bedtime-test, session_start / session_shutdown
  policy.ts     pure time policy: isLateNight, localDateKey, shouldRemind
  reminder.ts   scheduler: immediate check + every 30 s, duplicate prevention, stop()
  clock.ts      real clock, or simulated clock via BEDTIME_FAKE_NOW
tests/midnight-reminder/   tests (outside extension discovery) + fakes.ts test doubles
docs/                      plan, Pi documentation notes, reflection, red/green evidence
```

### Requirements

- Node.js **22.19+** (tests use the built-in `node:test` runner with native TypeScript type stripping — no `npm install` needed)
- Pi Coding Agent (`npm install -g --ignore-scripts @earendil-works/pi-coding-agent`)

### Run the tests

```bash
npm test
```

31 tests cover the policy table above, crossing midnight while idle (delivered within 60 simulated seconds), no duplicates from repeated checks, startup inside the window, resume-from-sleep inside/after the window, the next night, `/bedtime-test` not changing state, non-interactive modes, shutdown/reload cleanup and the simulated clock. Red/green output is in [`docs/evidence/`](docs/evidence/).

### Load the extension in Pi

```bash
pi --extension ./extensions/midnight-reminder/index.ts
```

Then type `/bedtime-test` to preview the reminder. To install it permanently, copy the `extensions/midnight-reminder` folder into `~/.pi/agent/extensions/` (Windows: `%USERPROFILE%\.pi\agent\extensions\`) and run `/reload` in Pi.

### Demo with simulated time

Set `BEDTIME_FAKE_NOW` to a local date-time; the extension's clock starts there and keeps ticking. Your system clock is not changed.

PowerShell (Windows):

```powershell
$env:BEDTIME_FAKE_NOW = "2026-10-05T23:59:40"
pi --extension ./extensions/midnight-reminder/index.ts
# leave Pi idle: within ~30 s after simulated midnight the warning appears, and only once
Remove-Item Env:BEDTIME_FAKE_NOW
```

bash / macOS:

```bash
BEDTIME_FAKE_NOW=2026-10-05T23:59:40 pi --extension ./extensions/midnight-reminder/index.ts
```

Startup inside the window: `BEDTIME_FAKE_NOW=2026-10-06T01:00:00` shows the reminder immediately. Non-interactive: `pi -p "hi" --extension ...` creates no timer and no notification.

### Where is time checked, and why not just a prompt?

Time is checked only in `reminder.ts → check()`, which reads the clock on every call: once on interactive `session_start`, then every 30 s via `setInterval`. The decision itself is `policy.ts → shouldRemind()`. A prompt alone cannot do this: an idle model never runs, so nothing would wake it at midnight. A timer inside the Pi process (runtime code) has to check the clock; the reminder makes no model calls.

See also [`docs/plan.md`](docs/plan.md), [`docs/pi-notes.md`](docs/pi-notes.md) and [`docs/reflection.md`](docs/reflection.md).
