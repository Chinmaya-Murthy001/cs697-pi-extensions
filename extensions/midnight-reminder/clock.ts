// Clock used by the extension. Normally real time; when BEDTIME_FAKE_NOW is set
// (e.g. "2026-10-05T23:59:30", local time) the clock starts at that moment and keeps
// ticking in real time. Used for the live demo — no need to change the system clock.

const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

export function createClock(
  env: Record<string, string | undefined>,
  realNow: () => number = () => Date.now(),
): () => Date {
  const fake = env.BEDTIME_FAKE_NOW;
  if (!fake) return () => new Date(realNow());

  // A date-time string without an offset is parsed as LOCAL time by Date.
  const start = LOCAL_DATE_TIME.test(fake) ? new Date(fake) : new Date(NaN);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`BEDTIME_FAKE_NOW must be a local date-time like 2026-10-05T23:59:30, got "${fake}"`);
  }
  const offset = start.getTime() - realNow();
  return () => new Date(realNow() + offset);
}
