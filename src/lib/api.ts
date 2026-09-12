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

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface DraftRequestBody {
  eventTitle: string;
  eventType: string;
  caseName: string;
  dueDate: string;
  dueTime?: string;
  recipients: string[];
  notes?: string;
}

export const api = {
  cases: () => request<CaseRecord[]>("/cases"),
  dockets: () => request<DocketEntry[]>("/dockets"),
  files: () => request<FileRecord[]>("/files"),
  rules: () => request<JurisdictionRule[]>("/rules"),

  users: () => request<UserRecord[]>("/users"),
  createUser: (body: Pick<UserRecord, "name" | "email" | "role" | "title">) =>
    request<UserRecord>("/users", { method: "POST", body: JSON.stringify(body) }),

  assignments: () => request<AssignmentRecord[]>("/assignments"),
  createAssignment: (body: Pick<AssignmentRecord, "caseId" | "userId" | "teamRole">) =>
    request<AssignmentRecord>("/assignments", { method: "POST", body: JSON.stringify(body) }),
  deleteAssignment: (id: string) => request<void>(`/assignments/${id}`, { method: "DELETE" }),

  events: () => request<CalendarEventRecord[]>("/calendar-events"),
  createEvent: (body: Omit<CalendarEventRecord, "id">) =>
    request<CalendarEventRecord>("/calendar-events", { method: "POST", body: JSON.stringify(body) }),
  updateEvent: (id: string, body: Partial<CalendarEventRecord>) =>
    request<CalendarEventRecord>(`/calendar-events/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  deadlines: () => request<TriggeredDeadline[]>("/deadlines"),
  computeDeadline: (ruleId: string, triggerDate: string) =>
    request<{ computedDate: string }>("/deadlines/compute", {
      method: "POST",
      body: JSON.stringify({ ruleId, triggerDate }),
    }),
  createDeadline: (body: { caseId: string; ruleId: string; triggerDate: string; label: string }) =>
    request<TriggeredDeadline>("/deadlines", { method: "POST", body: JSON.stringify(body) }),
  updateDeadline: (id: string, body: Partial<TriggeredDeadline>) =>
    request<TriggeredDeadline>(`/deadlines/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  draft: (body: DraftRequestBody) =>
    request<{ draft: string }>("/draft", { method: "POST", body: JSON.stringify(body) }),
};
