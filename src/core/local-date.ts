// Shared by Limiter — used to detect a day rollover (reset the daily budget) in the user's own
// local timezone, not UTC, since "daily" should mean the user's day.
export function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
