# W1 plan — Midnight Reminder (one agent)

| ID | Task | depends_on | Files | Completion evidence |
|---|---|---|---|---|
| W1-0 | Environment check, repository, branch | [] | `package.json`, `AGENTS.md`, `README.md` | `npm test` runs; branch `w1-midnight-reminder` |
| W1-1 | Specify behavior, read Pi docs | [W1-0] | `README.md`, `docs/pi-notes.md`, GitHub issue | Acceptance criteria in README and issue |
| W1-2 | Failing time-policy tests | [W1-1] | `tests/midnight-reminder/policy.test.ts` | `docs/evidence/w1-2-red.txt` |
| W1-3 | Implement time policy | [W1-2] | `extensions/midnight-reminder/policy.ts` | `docs/evidence/w1-3-green.txt` |
| W1-4 | Pi integration, scheduling, cleanup (tests first) | [W1-3] | `reminder.ts`, `clock.ts`, `index.ts` + tests | `w1-4-red.txt`, `w1-4-green.txt` |
| W1-5 | Inspect diff, demo, submit | [W1-4] | `README.md` | Demo video, PR |

Dependency graph: `W1-0 → W1-1 → W1-2 → W1-3 → W1-4 → W1-5`.

## Design

- `policy.ts` — pure functions. `shouldRemind(now, lastRemindedDate)` returns true only when the local hour is in [0, 6) and the local calendar date (`YYYY-MM-DD` built from local fields, not `toISOString()`) differs from the last automatic reminder date.
- `reminder.ts` — a small scheduler with an injected clock, timer API and `notify` function. `start()` runs one immediate check and a periodic check every 30 s; `check()` reads the actual time on every call and records the date **before** notifying in the same synchronous path; `stop()` is idempotent.
- `clock.ts` — real clock, or a simulated clock when `BEDTIME_FAKE_NOW` is set (used for the live demo).
- `index.ts` — Pi entry point. Registers `/bedtime-test`, creates the scheduler on `session_start` (only when `ctx.mode === "tui"`), stops it on `session_shutdown`. Each session gets a fresh scheduler bound to that session's `ctx`.
