# AGENTS.md

Instructions for coding agents working in this repository.

## Project

Pi Coding Agent extensions for CS 480/697 (UMass Boston, Fall 2026).

- `extensions/midnight-reminder/` — W1 Midnight Reminder extension (entry point: `index.ts`).
- `tests/` — tests, kept outside extension discovery. One folder per extension.
- `docs/` — plan, documentation notes, and test evidence.

## Commands

- Run all tests: `npm test` (Node.js >= 22.19, uses the built-in `node:test` runner and native TypeScript type stripping; no `npm install` needed).
- Load the extension in Pi for manual testing: `pi --extension ./extensions/midnight-reminder/index.ts`

## Rules

- Follow red-green TDD: add a failing test that shows the missing behavior, then make the smallest change that passes.
- Keep the time policy (pure functions) separate from Pi UI and timers so it can be tested with simulated time.
- Use explicit local date components in tests (`new Date(2026, 9, 6, 0, 0)`), never UTC ISO strings for local dates.
- Never change the system clock or wait for real midnight; use the injectable clock and fake timers.
- Use `import type` for type-only imports and include `.ts` in relative import paths (required by Node type stripping).
- No runtime dependencies, no extra model calls, never block tools or terminate Pi.
- Keep commits small; keep README in sync with behavior.
