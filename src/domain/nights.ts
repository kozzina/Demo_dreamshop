/** A night can be booked from today up to 30 days ahead (content/knowledge.md, section 3). */
export const BOOKING_WINDOW_DAYS = 30;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date as YYYY-MM-DD in UTC; the demo does not know the buyer's time zone. */
export const today = (now: Date = new Date()): string => now.toISOString().slice(0, 10);

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isBookableNight(night: string, now: Date = new Date()): boolean {
  if (!ISO_DATE.test(night)) return false;
  const parsed = new Date(`${night}T00:00:00Z`);
  // round trip rejects impossible dates such as 2026-02-30
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== night) return false;
  const first = today(now);
  return night >= first && night <= addDays(first, BOOKING_WINDOW_DAYS);
}
