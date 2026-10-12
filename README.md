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

## W2 — Ask the Human (`ask_user` tool)

A Pi extension that registers a model-callable `ask_user` tool. The agent uses it when an unresolved choice materially changes user-visible behavior, scope, or rework. The tool shows one question, why it matters, 2–3 options with tradeoffs and an optional recommendation; the user picks an option or writes a custom answer, and the result goes back to the agent.

- **Results:** `answered` (option or custom, preserved exactly), `cancelled` (dismissed or empty answer — never a default), `unavailable` (no dialog UI — never claims consent), `invalid` (bad input, model should fix the call).
- **Contract, asking policy and task plan:** [`docs/w2/plan.md`](docs/w2/plan.md). **Review cases:** [`docs/w2/review.md`](docs/w2/review.md).

```
extensions/ask-user/
  index.ts        registerTool("ask_user"): TypeBox schema, description, prompt guidelines (when to ask / proceed)
  interaction.ts  select/input dialog flow, result mapping, model-facing text
  contract.ts     input/result types and validation
tests/ask-user/   contract, interaction (fake dialog UI) and registration tests
```

### Run the tests

```bash
npm install   # dev dependency: typebox (used by the tool schema)
npm test
```

### Use it in Pi

```bash
pi --extension ./extensions/ask-user/index.ts
```

Example prompt with an unresolved choice:

> Add a small config file for the midnight reminder with the reminder message and quiet hours. I haven't decided between JSON and YAML — users will edit it by hand. Don't write any code yet; just create the file.

The agent calls `ask_user`; pick an option (or write your own answer) and the agent creates the file in that format. With a fully specified prompt ("…as JSON") it proceeds without asking.
