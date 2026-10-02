# Pi documentation notes (installed version: @earendil-works/pi-coding-agent)

Sources: Pi extension guide (`packages/coding-agent/docs/extensions.md`) and `src/core/extensions/types.ts`.

- An extension is a TypeScript module whose **default export** is a factory `(pi: ExtensionAPI) => void`. Pi loads it with `jiti`, so no build step.
- Load during development: `pi --extension ./extensions/midnight-reminder/index.ts`. Global location: `~/.pi/agent/extensions/`.
- **Do not start timers in the factory** — some invocations load extensions without starting a session. Start long-lived resources in `session_start`; clean them up in an **idempotent** `session_shutdown` handler.
- `session_start` reasons: `startup | reload | new | resume | fork`. `session_shutdown` reasons: `quit | reload | new | resume | fork`. Reload replaces the extension runtime, so old state/context must not be reused.
- `pi.registerCommand(name, { description, handler: async (args, ctx) => … })` adds a `/name` command typed by the user. Tools (`pi.registerTool`) are called by the model instead.
- `ctx.ui.notify(message, type?)` where type is `"info" | "warning" | "error"`.
- `ctx.mode` is `"tui" | "rpc" | "json" | "print"`; `ctx.hasUI` is true in TUI and RPC. We treat only `"tui"` as interactive, so print/JSON/RPC runs create no timer and no notification.
- Why a prompt alone cannot do this: an idle model never runs, so nothing wakes it at midnight. Runtime code (a timer inside the Pi process) must check the clock; the reminder needs no LLM call.
