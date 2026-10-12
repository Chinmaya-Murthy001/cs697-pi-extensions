# W2-3 / W2-4 — Independent review cases

Cases were derived from the specification (not from the implementation) and checked against the code and tests.

| # | Case | Expected outcome | Covered by |
|---|---|---|---|
| R1 | User selects option 2 | `answered`, `source: option`, exact label | `interaction.test.ts`, `extension.test.ts` |
| R2 | User picks an option that contradicts the recommendation | answer preserved, never overridden | `interaction.test.ts` |
| R3 | User writes a custom answer with surrounding spaces | `answered`, `source: custom`, text preserved (trimmed) | `interaction.test.ts`, `extension.test.ts` |
| R4 | User closes the selector (Esc) | `cancelled/dismissed`, no default chosen | `interaction.test.ts`, `extension.test.ts` |
| R5 | User chooses "write my own" then closes the input | `cancelled/dismissed` | `interaction.test.ts` |
| R6 | User submits an empty / whitespace custom answer | `cancelled/empty_answer`, not consent | `interaction.test.ts` |
| R7 | No dialog UI (`ctx.hasUI === false`, print/JSON mode) | `unavailable`, UI never touched | `interaction.test.ts`, `extension.test.ts` |
| R8 | Ambiguous / duplicate option labels ("A" vs "a ") | `invalid`, no dialog shown | `contract.test.ts` |
| R9 | 1 or 4 options, empty tradeoff, empty question/reason | `invalid` | `contract.test.ts` |
| R10 | Recommendation that is not one of the options | `invalid` | `contract.test.ts` |
| R11 | Dialog returns a value that is not in the displayed list | `cancelled` (never guess) | code review of `interaction.ts` |
| R12 | Model-facing text for cancelled/unavailable | tells the agent not to assume an answer | `interaction.test.ts` |

## Behavioral scenarios (model judgment — observations, not proof)

| Prompt | Expected agent behavior |
|---|---|
| "Add a config file for the midnight reminder. I haven't decided between JSON and YAML — users will edit it by hand." | Calls `ask_user` with JSON vs YAML tradeoffs, then writes the file in the chosen format. |
| "Add a JSON config file for the midnight reminder." | Proceeds without asking (fully specified). |

## Findings

- Checked the Pi 1.0.0 `ExtensionUIContext` types: `select` / `input` resolve `undefined` on dismiss, so dismissal maps to `cancelled`, never to a default.
- `ctx.hasUI` (not `ctx.mode`) is the right guard here: RPC clients can forward select/input dialogs, so the tool works there too, and is `unavailable` only when no dialog UI exists.
- Type-checked against `@earendil-works/pi-coding-agent` 1.0.0 with `tsc`; extension loads in real Pi (`pi -e extensions/ask-user/index.ts`).
