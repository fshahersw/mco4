import type {
  CaseCategory,
  CaseStatus,
  DeadlineStatus,
  DocketType,
  EventType,
  FileTag,
  JurisdictionType,
  UserRole,
} from "../../shared/types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/** Tiny classnames joiner (clsx-lite): drops falsy values, joins with spaces. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? singular : (plural ?? `${singular}s`);
}

export function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function formatShortDate(iso: string): string {
  const d = parseIsoDate(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function formatLongDate(iso: string): string {
  const d = parseIsoDate(iso);
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** e.g. "Fri, Sep 11" */
export function formatWeekdayDate(iso: string): string {
  const d = parseIsoDate(iso);
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** e.g. "Friday, September 11, 2026" */
export function formatFullDate(iso: string): string {
  const d = parseIsoDate(iso);
  return `${WEEKDAYS_LONG[d.getUTCDay()]}, ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function formatMonthYear(year: number, month: number): string {
  return `${MONTHS_LONG[month]} ${year}`;
}

export function dayOfMonth(iso: string): number {
  return parseIsoDate(iso).getUTCDate();
}

export function monthAbbrev(iso: string): string {
  return MONTHS[parseIsoDate(iso).getUTCMonth()];
}

export function weekdayLabel(index: number): string {
  return WEEKDAYS[index];
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = parseIsoDate(fromIso).getTime();
  const b = parseIsoDate(toIso).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function relativeDayLabel(iso: string, todayIso: string): string {
  const diff = daysBetween(todayIso, iso);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

/** Compact relative label for feeds: "2d ago", "in 5d", "today". */
export function relativeDaysCompact(iso: string, todayIso: string): string {
  const diff = daysBetween(todayIso, iso);
  if (diff === 0) return "today";
  if (diff > 0) return `in ${diff}d`;
  return `${Math.abs(diff)}d ago`;
}

/** Calendar month grid: array of 6 weeks x 7 days, each cell an ISO date string, padded into adjacent months. */
export function buildMonthGrid(year: number, month: number): string[][] {
  const first = new Date(Date.UTC(year, month, 1));
  const startOffset = first.getUTCDay();
  const start = new Date(first);
  start.setUTCDate(1 - startOffset);
  const grid: string[][] = [];
  const cursor = new Date(start);
  for (let week = 0; week < 6; week++) {
    const row: string[] = [];
    for (let day = 0; day < 7; day++) {
      row.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    grid.push(row);
  }
  return grid;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export type Tone = "ink" | "blue" | "green" | "amber" | "red" | "brass" | "teal" | "gray";

export function toneClasses(tone: Tone): string {
  switch (tone) {
    case "blue":
      return "bg-brand-blue-soft text-brand-blue";
    case "green":
      return "bg-brand-green-soft text-brand-green";
    case "amber":
      return "bg-brand-amber-soft text-brand-amber";
    case "red":
      return "bg-brand-red-soft text-brand-red";
    case "brass":
      return "bg-brass-soft text-brass-ink";
    case "teal":
      return "bg-brand-teal-soft text-brand-teal";
    case "ink":
      return "bg-ink text-white";
    default:
      return "bg-neutral-soft text-slate";
  }
}

/** Solid dot color for a tone (used in legends / status dots). */
export function toneDot(tone: Tone): string {
  switch (tone) {
    case "blue":
      return "bg-brand-blue";
    case "green":
      return "bg-brand-green";
    case "amber":
      return "bg-brand-amber";
    case "red":
      return "bg-brand-red";
    case "brass":
      return "bg-brass";
    case "teal":
      return "bg-brand-teal";
    case "ink":
      return "bg-ink";
    default:
      return "bg-muted";
  }
}

/** Accent bar / fill color for a tone (charts, progress). */
export function toneFill(tone: Tone): string {
  switch (tone) {
    case "blue":
      return "var(--color-brand-blue)";
    case "green":
      return "var(--color-brand-green)";
    case "amber":
      return "var(--color-brand-amber)";
    case "red":
      return "var(--color-brand-red)";
    case "brass":
      return "var(--color-brass)";
    case "teal":
      return "var(--color-brand-teal)";
    case "ink":
      return "var(--color-ink)";
    default:
      return "var(--color-muted)";
  }
}

export function caseStatusTone(status: CaseStatus): Tone {
  switch (status) {
    case "active":
      return "green";
    case "settling":
      return "amber";
    case "stayed":
      return "gray";
    case "closed":
      return "gray";
  }
}

export function caseStatusLabel(status: CaseStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function caseCategoryLabel(category: CaseCategory): string {
  switch (category) {
    case "mdl":
      return "MDL";
    case "consolidated":
      return "Consolidated";
    case "individual":
      return "Individual";
    case "jpml_pending":
      return "JPML — Pending";
    case "state_mcl":
      return "NJ MCL";
    case "state_jccp":
      return "CA JCCP";
    case "state_clc":
      return "Complex Litig. Ctr.";
    case "state_general":
      return "State";
  }
}

export function jurisdictionTypeLabel(t: JurisdictionType): string {
  switch (t) {
    case "federal":
      return "Federal";
    case "state":
      return "State";
    case "jpml":
      return "JPML";
  }
}

export function jurisdictionTypeTone(t: JurisdictionType): Tone {
  switch (t) {
    case "federal":
      return "blue";
    case "state":
      return "green";
    case "jpml":
      return "brass";
  }
}

export function docketTypeTone(t: DocketType): Tone {
  switch (t) {
    case "order":
      return "red";
    case "motion":
      return "amber";
    case "notice":
      return "blue";
    case "cmo":
      return "brass";
    case "report":
      return "teal";
    case "filing":
      return "gray";
  }
}

export function docketTypeLabel(t: DocketType): string {
  switch (t) {
    case "order":
      return "Order";
    case "motion":
      return "Motion";
    case "notice":
      return "Notice";
    case "cmo":
      return "CMO";
    case "report":
      return "Report";
    case "filing":
      return "Filing";
  }
}

export function fileTagTone(t: FileTag): Tone {
  switch (t) {
    case "order":
      return "red";
    case "motion":
      return "amber";
    case "notice":
      return "blue";
    case "cmo":
      return "brass";
    case "report":
      return "teal";
    case "exhibit":
      return "green";
  }
}

export function eventTypeTone(t: EventType): Tone {
  switch (t) {
    case "Filing deadline":
      return "red";
    case "Hearing":
      return "amber";
    case "Case management conf.":
      return "blue";
    case "Internal review":
      return "gray";
    case "Reminder":
      return "brass";
  }
}

export function userRoleTone(role: UserRole): Tone {
  switch (role) {
    case "Admin":
      return "ink";
    case "Managing Clerk":
      return "brass";
    case "Lit Paralegal":
      return "blue";
    case "Associate":
      return "teal";
    case "Partner":
      return "green";
  }
}

export function deadlineStatusTone(status: DeadlineStatus): Tone {
  switch (status) {
    case "upcoming":
      return "amber";
    case "calendared":
      return "green";
    case "past":
      return "gray";
  }
}

export interface Urgency {
  tone: Tone;
  label: string;
  /** bucket key for grouping */
  bucket: "overdue" | "today" | "soon" | "week" | "later";
}

/** Maps days-away into an urgency bucket for deadlines/events. */
export function urgencyFor(daysAway: number): Urgency {
  if (daysAway < 0) return { tone: "red", label: `${Math.abs(daysAway)}d overdue`, bucket: "overdue" };
  if (daysAway === 0) return { tone: "red", label: "Due today", bucket: "today" };
  if (daysAway <= 3) return { tone: "amber", label: `in ${daysAway}d`, bucket: "soon" };
  if (daysAway <= 7) return { tone: "amber", label: `in ${daysAway}d`, bucket: "week" };
  return { tone: "gray", label: `in ${daysAway}d`, bucket: "later" };
}

export function reminderLabel(r: {
  kind: string;
  daysBefore?: number;
  hoursBefore?: number;
  time?: string;
  customUnit?: string;
  customValue?: number;
}): string {
  switch (r.kind) {
    case "days_before":
      return `${r.daysBefore ?? 1} day${(r.daysBefore ?? 1) === 1 ? "" : "s"} before`;
    case "hours_before":
      return `${r.hoursBefore ?? 18} hours before`;
    case "same_day_time":
      return `Same day at ${r.time ? formatTime(r.time) : "9:00 AM"}`;
    case "custom":
      return `${r.customValue ?? 1} ${r.customUnit ?? "hours"} before`;
    default:
      return "Reminder";
  }
}
