/** Dates of stays are handled as UTC midnight "calendar days". */
export function parseDay(s: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error("invalid date");
  const d = new Date(s + "T00:00:00.000Z");
  if (isNaN(d.getTime())) throw new Error("invalid date");
  return d;
}
export const dayKey = (d: Date) => d.toISOString().slice(0, 10);
export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}
export function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  const day = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + n);
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
}
export const nightsBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000);
export function eachNight(checkIn: Date, checkOut: Date): Date[] {
  const out: Date[] = [];
  for (let d = new Date(checkIn); d < checkOut; d = addDays(d, 1)) out.push(new Date(d));
  return out;
}
export const todayUTC = () => parseDay(new Date().toISOString().slice(0, 10));

/** Saudi Arabia is UTC+3 all year (no daylight saving). */
export const RIYADH_OFFSET_HOURS = 3;

/** The exact moment of check-in: the stay date at the host's check-in time, Makkah/Madinah time. */
export function checkInInstant(day: Date, time = "15:00"): Date {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  const h = m ? Math.min(23, Number(m[1])) : 15;
  const min = m ? Math.min(59, Number(m[2])) : 0;
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h - RIYADH_OFFSET_HOURS, min));
}
export const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
