# W2 plan — Ask the Human (`ask_user` tool)

| ID | Task | depends_on | Files | Completion evidence |
|---|---|---|---|---|
| W2-0 | Agree on the tool contract and asking policy | [] | `docs/w2/plan.md` | Input/result shapes and ask/proceed examples below |
| W2-1 | Write failing contract tests (fake dialog UI) | [W2-0] | `tests/ask-user/*.test.ts` | `docs/evidence/w2-1-red.txt` |
| W2-2 | Implement tool registration and interaction | [W2-1] | `extensions/ask-user/*.ts` | `docs/evidence/w2-2-green.txt`, real dialog works |
| W2-3 | Independently prepare review cases | [W2-1] | `docs/w2/review.md` | Cases + expected outcomes from the spec |
| W2-4 | Review implementation, fix supported findings | [W2-2, W2-3] | as needed | Reproduced findings resolved, tests pass |
| W2-5 | Demonstrate agent behavior and submit | [W2-4] | `README.md` | Demo video, PR |

```text
W2-0 → W2-1 ─┬→ W2-2 ─┐
              └→ W2-3 ─┴→ W2-4 → W2-5
```

## Tool contract (W2-0)

**Input** (`ask_user` parameters)

| Field | Type | Rule |
|---|---|---|
| `question` | string | required, one clear question |
| `reason` | string | required, why the choice matters |
| `options` | `{ label, tradeoff }[]` | 2–3 items, labels non-empty and unique, tradeoff non-empty |
| `recommendation` | string? | optional; must equal one option label |

**Result** (returned to the model as text + `details`)

| status | fields | meaning |
|---|---|---|
| `answered` | `answer`, `source: "option" \| "custom"`, `option?` | The human chose an option or wrote an answer (preserved exactly, trimmed) |
| `cancelled` | `reason: "dismissed" \| "empty_answer"` | The human closed the dialog or submitted an empty custom answer — **no default is chosen** |
| `unavailable` | `reason: "no_interactive_ui"` | No dialog-capable UI (print/JSON mode) — **no consent is claimed** |
| `invalid` | `error` | Input broke the contract; the model should fix the call |

The tool always waits for the human before returning `answered`. One question per call.

## Asking policy

Ask when an unresolved choice **materially changes user-visible behavior, scope, or rework**, and the user has not already decided it. Proceed without asking when the requirement is explicit or the detail is routine and reversible (variable names, file layout within conventions, formatting).

| Prompt | Expected |
|---|---|
| "Add a config file for the reminder — JSON or YAML, whatever you think is best." | **Proceed** — the user explicitly delegated the choice. |
| "Add a config file for the reminder. I haven't decided between JSON and YAML; it changes what users edit." | **Ask** — important, unresolved, user-visible. |
| "Should reminders persist after restart? (session-only vs. on disk)" left open in the task | **Ask** — scope + rework tradeoff. |
| "Keep reminder state only for this session." | **Proceed** — already specified. |
| "Name the helper function anything sensible." | **Proceed** — routine, reversible. |

If the tool returns `cancelled` or `unavailable`, the agent must not invent an answer: it states the decision is still open and either stops or continues only with work that does not depend on it.
