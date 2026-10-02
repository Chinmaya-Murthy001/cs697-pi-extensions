// Test doubles: a controllable clock + timers, and a fake Pi API/context.

export class FakeTime {
  private nowMs: number;
  private nextId = 1;
  readonly intervals = new Map<number, { fn: () => void; ms: number; due: number }>();
  createdCount = 0;

  constructor(start: Date) {
    this.nowMs = start.getTime();
  }

  now = (): Date => new Date(this.nowMs);

  timers = {
    setInterval: (fn: () => void, ms: number): unknown => {
      const id = this.nextId++;
      this.intervals.set(id, { fn, ms, due: this.nowMs + ms });
      this.createdCount++;
      return id;
    },
    clearInterval: (handle: unknown): void => {
      this.intervals.delete(handle as number);
    },
  };

  get activeCount(): number {
    return this.intervals.size;
  }

  /** Advance simulated time, firing interval callbacks when they are due (computer awake). */
  advance(ms: number): void {
    const end = this.nowMs + ms;
    for (;;) {
      let nextId = -1;
      let nextDue = Infinity;
      for (const [id, t] of this.intervals) if (t.due < nextDue) { nextDue = t.due; nextId = id; }
      if (nextId === -1 || nextDue > end) break;
      this.nowMs = nextDue;
      const t = this.intervals.get(nextId)!;
      t.due += t.ms;
      t.fn();
    }
    this.nowMs = end;
  }

  /** Jump the clock without firing timers (computer asleep), then reschedule so the next tick fires one interval later. */
  sleep(ms: number): void {
    this.nowMs += ms;
    for (const t of this.intervals.values()) t.due = this.nowMs + t.ms;
  }
}

export type Note = { message: string; type?: string };

export function fakeContext(mode: "tui" | "rpc" | "json" | "print") {
  const notes: Note[] = [];
  const ctx = {
    mode,
    hasUI: mode === "tui" || mode === "rpc",
    ui: { notify: (message: string, type?: string) => { notes.push({ message, type }); } },
  };
  return { ctx, notes };
}

type Handler = (event: unknown, ctx: unknown) => unknown;

export function fakePi() {
  const commands = new Map<string, { description?: string; handler: (args: string, ctx: unknown) => unknown }>();
  const handlers = new Map<string, Handler[]>();
  const pi = {
    registerCommand(name: string, options: { description?: string; handler: (args: string, ctx: unknown) => unknown }) {
      commands.set(name, options);
    },
    on(event: string, handler: Handler) {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
      return () => {};
    },
  };
  async function emit(event: string, payload: unknown, ctx: unknown) {
    for (const h of handlers.get(event) ?? []) await h(payload, ctx);
  }
  return { pi, commands, handlers, emit };
}
