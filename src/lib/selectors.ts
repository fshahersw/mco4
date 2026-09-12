import type {
  AssignmentRecord,
  CalendarEventRecord,
  CaseRecord,
  DocketEntry,
  FileRecord,
  JurisdictionRule,
  TriggeredDeadline,
  UserRecord,
} from "../../shared/types";
import { daysUntil } from "../../shared/rules/engine";
import { ruleById } from "../../shared/rules/jurisdictions";
import { docketTypeTone, eventTypeTone, urgencyFor, type Tone, type Urgency } from "./utils";

/** Build an id -> record map for O(1) lookups. */
export function indexBy<T extends { id: string }>(rows: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const r of rows) m.set(r.id, r);
  return m;
}

/** Filter any case-scoped rows to the caller's visible matters (null = sees all). */
export function scopeRows<T extends { caseId: string }>(rows: T[], scope: Set<string> | null): T[] {
  if (!scope) return rows;
  return rows.filter((r) => scope.has(r.caseId));
}

/** Filter case records themselves to the caller's visible matters (keyed by id; null = sees all). */
export function scopeCases(cases: CaseRecord[], scope: Set<string> | null): CaseRecord[] {
  if (!scope) return cases;
  return cases.filter((c) => scope.has(c.id));
}

/* -------------------------------------------------------------- deadlines */

export interface EnrichedDeadline extends TriggeredDeadline {
  case?: CaseRecord;
  rule?: JurisdictionRule;
  daysAway: number;
  urgency: Urgency;
}

export function enrichDeadline(
  d: TriggeredDeadline,
  caseMap: Map<string, CaseRecord>,
  todayIso: string,
): EnrichedDeadline {
  const daysAway = daysUntil(d.computedDate, todayIso);
  return {
    ...d,
    case: caseMap.get(d.caseId),
    rule: ruleById(d.ruleId),
    daysAway,
    urgency: urgencyFor(daysAway),
  };
}

/** Deadlines that still need action (not filed/past) ordered by soonest first. */
export function openDeadlines(list: EnrichedDeadline[]): EnrichedDeadline[] {
  return list.filter((d) => d.status !== "past").sort((a, b) => a.daysAway - b.daysAway);
}

/* ---------------------------------------------------------- notifications */

export interface NotificationItem {
  id: string;
  kind: "overdue" | "deadline" | "docket";
  tone: Tone;
  title: string;
  caseShort: string;
  caseId: string;
  dateIso: string;
  meta: string;
  to: string;
}

/**
 * Attention feed for the topbar bell: open deadlines within the next ~10 days
 * (overdue surfaced first) plus docket entries filed in the last 3 days.
 */
export function buildNotifications(
  deadlines: TriggeredDeadline[],
  dockets: DocketEntry[],
  caseMap: Map<string, CaseRecord>,
  scope: Set<string> | null,
  todayIso: string,
): NotificationItem[] {
  const items: NotificationItem[] = [];

  for (const d of scopeRows(deadlines, scope)) {
    if (d.status === "past") continue;
    const daysAway = daysUntil(d.computedDate, todayIso);
    if (daysAway > 10) continue;
    const u = urgencyFor(daysAway);
    items.push({
      id: `nd-${d.id}`,
      kind: daysAway < 0 ? "overdue" : "deadline",
      tone: u.tone,
      title: d.label,
      caseShort: caseMap.get(d.caseId)?.shortName ?? "—",
      caseId: d.caseId,
      dateIso: d.computedDate,
      meta: u.label,
      to: "/deadlines",
    });
  }

  for (const dk of scopeRows(dockets, scope)) {
    const daysAway = daysUntil(dk.filedDate, todayIso);
    if (daysAway > 0 || daysAway < -3) continue;
    items.push({
      id: `nk-${dk.id}`,
      kind: "docket",
      tone: docketTypeTone(dk.type),
      title: dk.title,
      caseShort: caseMap.get(dk.caseId)?.shortName ?? "—",
      caseId: dk.caseId,
      dateIso: dk.filedDate,
      meta: daysAway === 0 ? "filed today" : `${Math.abs(daysAway)}d ago`,
      to: `/cases/${dk.caseId}`,
    });
  }

  const rank = { overdue: 0, deadline: 1, docket: 2 } as const;
  return items.sort((a, b) => {
    if (rank[a.kind] !== rank[b.kind]) return rank[a.kind] - rank[b.kind];
    return a.dateIso < b.dateIso ? -1 : a.dateIso > b.dateIso ? 1 : 0;
  });
}

/** Count of items that represent an action owed (overdue + upcoming deadlines). */
export function attentionCount(items: NotificationItem[]): number {
  return items.filter((i) => i.kind !== "docket").length;
}

/* ----------------------------------------------------------------- events */

export interface EnrichedEvent extends CalendarEventRecord {
  case?: CaseRecord;
  daysAway: number;
  tone: Tone;
}

export function enrichEvent(
  e: CalendarEventRecord,
  caseMap: Map<string, CaseRecord>,
  todayIso: string,
): EnrichedEvent {
  return {
    ...e,
    case: caseMap.get(e.caseId),
    daysAway: daysUntil(e.date, todayIso),
    tone: eventTypeTone(e.type),
  };
}

/* ------------------------------------------------------------------- team */

export interface CaseTeamMember extends UserRecord {
  teamRole: string;
  assignmentId: string;
}

export function teamForCase(
  caseId: string,
  assignments: AssignmentRecord[],
  userMap: Map<string, UserRecord>,
): CaseTeamMember[] {
  return assignments
    .filter((a) => a.caseId === caseId)
    .map((a) => {
      const u = userMap.get(a.userId);
      return u ? { ...u, teamRole: a.teamRole, assignmentId: a.id } : null;
    })
    .filter((x): x is CaseTeamMember => x !== null);
}

/** Files that belong to a case, newest first. */
export function filesForCase(caseId: string, files: FileRecord[]): FileRecord[] {
  return files.filter((f) => f.caseId === caseId).sort((a, b) => (a.addedDate < b.addedDate ? 1 : -1));
}

/** Docket entries for a case, newest first. */
export function docketsForCase(caseId: string, dockets: DocketEntry[]): DocketEntry[] {
  return dockets.filter((d) => d.caseId === caseId).sort((a, b) => (a.filedDate < b.filedDate ? 1 : -1));
}
