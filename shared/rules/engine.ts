import type { JurisdictionRule } from "../types";

/** Federal holidays 2026 (plus Jan 1 2027) as YYYY-MM-DD, for roll-forward and court-day counting. */
const US_FEDERAL_HOLIDAYS = new Set([
  "2026-01-01",
  "2026-01-19",
  "2026-02-16",
  "2026-05-25",
  "2026-06-19",
  "2026-07-03",
  "2026-09-07",
  "2026-10-12",
  "2026-11-11",
  "2026-11-26",
  "2026-12-25",
  "2027-01-01",
]);

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isWeekendOrHoliday(d: Date): boolean {
  const day = d.getUTCDay();
  if (day === 0 || day === 6) return true;
  return US_FEDERAL_HOLIDAYS.has(toIso(d));
}

function addCalendarDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addCourtDays(date: Date, days: number): Date {
  let d = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    d = addCalendarDays(d, 1);
    if (!isWeekendOrHoliday(d)) remaining--;
  }
  return d;
}

/** Computes a deadline date from a trigger date and a jurisdiction rule (FRCP 6(a)-style: calendar-day count, roll forward off the final weekend/holiday). */
export function computeDeadlineDate(
  triggerDateIso: string,
  rule: Pick<JurisdictionRule, "days" | "dayType" | "rollForward">,
): string {
  const trigger = new Date(`${triggerDateIso}T00:00:00Z`);
  let result = rule.dayType === "court" ? addCourtDays(trigger, rule.days) : addCalendarDays(trigger, rule.days);
  if (rule.rollForward) {
    while (isWeekendOrHoliday(result)) {
      result = addCalendarDays(result, 1);
    }
  }
  return toIso(result);
}

export function daysUntil(dateIso: string, fromIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${dateIso}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}
