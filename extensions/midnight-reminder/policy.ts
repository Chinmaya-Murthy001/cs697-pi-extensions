// Time policy for the midnight reminder (pure functions, no Pi or timers).

/** Late-night window: 00:00 inclusive to 06:00 exclusive, local time. */
export const LATE_NIGHT_START_HOUR = 0;
export const LATE_NIGHT_END_HOUR = 6;

export const REMINDER_MESSAGE = "It is after midnight. Consider saving your work and getting some sleep.";

/** Local calendar date as "YYYY-MM-DD", built from local fields (not toISOString(), which is UTC). */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** True when the local time is within [00:00, 06:00). */
export function isLateNight(date: Date): boolean {
  const hour = date.getHours();
  return hour >= LATE_NIGHT_START_HOUR && hour < LATE_NIGHT_END_HOUR;
}

/**
 * Decide whether to show the automatic reminder.
 * @param now               the current local date/time (supplied, so tests can simulate time)
 * @param lastRemindedDate  local date key of the last automatic reminder, or null if none yet
 */
export function shouldRemind(now: Date, lastRemindedDate: string | null): boolean {
  return isLateNight(now) && lastRemindedDate !== localDateKey(now);
}
