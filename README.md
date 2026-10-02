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

_Loading and test instructions are added once the extension is implemented._
