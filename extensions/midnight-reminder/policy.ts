// Time policy for the midnight reminder (pure functions, no Pi or timers).
// W1-2: stubs only — behavior is not implemented yet.

export const REMINDER_MESSAGE = "";

export function localDateKey(_date: Date): string {
  throw new Error("not implemented");
}

export function isLateNight(_date: Date): boolean {
  return false;
}

export function shouldRemind(_now: Date, _lastRemindedDate: string | null): boolean {
  return false;
}
