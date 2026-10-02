// W1-4 red: scheduler stub — automatic checking not implemented yet.
export const CHECK_INTERVAL_MS = 0;
export function createReminder(_options: unknown) {
  return { start() {}, stop() {}, check() { return false; } };
}
