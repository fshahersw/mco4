import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type {
  AssignmentRecord,
  CalendarEventRecord,
  CaseRecord,
  DocketEntry,
  FileRecord,
  JurisdictionRule,
  TriggeredDeadline,
  UserRecord,
  UserRole,
} from "../../shared/types";

/** Fixed "today" for this demo so seeded relative dates (deadlines, calendar) read naturally. */
export const TODAY_ISO = "2026-09-11";

/**
 * The Admin view represents the firm's MCO system administrator — a generic
 * operational identity, not a person on the case roster. Keeping it out of
 * USERS means the roster and assignment pickers only show real team members.
 */
export const ADMIN_IDENTITY: UserRecord = {
  id: "u-system",
  name: "System Administrator",
  email: "mco-admin@seegerweiss.example",
  role: "Admin",
  title: "MCO Systems Administrator",
  status: "active",
  createdDate: "2026-01-06",
};

interface AppState {
  loading: boolean;
  error: string | null;
  cases: CaseRecord[];
  dockets: DocketEntry[];
  files: FileRecord[];
  rules: JurisdictionRule[];
  users: UserRecord[];
  assignments: AssignmentRecord[];
  events: CalendarEventRecord[];
  deadlines: TriggeredDeadline[];
  role: UserRole;
  setRole: (r: UserRole) => void;
  currentUser: UserRecord | undefined;
  /** null => sees all matters (Admin / Managing Clerk); Set => scoped to assigned matters. */
  scopedCaseIds: Set<string> | null;
  addUser: (u: Pick<UserRecord, "name" | "email" | "role" | "title">) => Promise<UserRecord>;
  addAssignment: (a: Pick<AssignmentRecord, "caseId" | "userId" | "teamRole">) => Promise<void>;
  removeAssignment: (id: string) => Promise<void>;
  addEvent: (e: Omit<CalendarEventRecord, "id">) => Promise<CalendarEventRecord>;
  updateEvent: (id: string, patch: Partial<CalendarEventRecord>) => Promise<void>;
  addDeadline: (d: { caseId: string; ruleId: string; triggerDate: string; label: string }) => Promise<TriggeredDeadline>;
  updateDeadline: (id: string, patch: Partial<TriggeredDeadline>) => Promise<void>;
}

const AppCtx = createContext<AppState | null>(null);

const ROLE_TO_USER_ID: Partial<Record<UserRole, string>> = {
  "Managing Clerk": "u-mgarner",
  "Lit Paralegal": "u-ssiegal",
  Associate: "u-dwhitfield",
  Partner: "u-alipsky",
};

/** Roles that see the whole portfolio rather than only their assigned matters. */
const FIRM_WIDE_ROLES: UserRole[] = ["Admin", "Managing Clerk"];

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [dockets, setDockets] = useState<DocketEntry[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [rules, setRules] = useState<JurisdictionRule[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [events, setEvents] = useState<CalendarEventRecord[]>([]);
  const [deadlines, setDeadlines] = useState<TriggeredDeadline[]>([]);
  const [role, setRole] = useState<UserRole>("Managing Clerk");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.cases(),
      api.dockets(),
      api.files(),
      api.rules(),
      api.users(),
      api.assignments(),
      api.events(),
      api.deadlines(),
    ])
      .then(([cs, dk, fl, ru, us, as, ev, dl]) => {
        if (cancelled) return;
        setCases(cs);
        setDockets(dk);
        setFiles(fl);
        setRules(ru);
        setUsers(us);
        setAssignments(as);
        setEvents(ev);
        setDeadlines(dl);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const currentUser = useMemo(() => {
    if (role === "Admin") return ADMIN_IDENTITY;
    const id = ROLE_TO_USER_ID[role];
    return users.find((u) => u.id === id);
  }, [users, role]);

  const scopedCaseIds = useMemo(() => {
    if (FIRM_WIDE_ROLES.includes(role) || !currentUser) return null;
    return new Set(assignments.filter((a) => a.userId === currentUser.id).map((a) => a.caseId));
  }, [role, currentUser, assignments]);

  const value: AppState = {
    loading,
    error,
    cases,
    dockets,
    files,
    rules,
    users,
    assignments,
    events,
    deadlines,
    role,
    setRole,
    currentUser,
    scopedCaseIds,
    addUser: async (u) => {
      const created = await api.createUser(u);
      setUsers((p) => [...p, created]);
      return created;
    },
    addAssignment: async (a) => {
      const created = await api.createAssignment(a);
      setAssignments((p) => [...p, created]);
    },
    removeAssignment: async (id) => {
      await api.deleteAssignment(id);
      setAssignments((p) => p.filter((x) => x.id !== id));
    },
    addEvent: async (e) => {
      const created = await api.createEvent(e);
      setEvents((p) => [...p, created]);
      return created;
    },
    updateEvent: async (id, patch) => {
      const updated = await api.updateEvent(id, patch);
      setEvents((p) => p.map((x) => (x.id === id ? updated : x)));
    },
    addDeadline: async (d) => {
      const created = await api.createDeadline(d);
      setDeadlines((p) => [...p, created]);
      return created;
    },
    updateDeadline: async (id, patch) => {
      const updated = await api.updateDeadline(id, patch);
      setDeadlines((p) => p.map((x) => (x.id === id ? updated : x)));
    },
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
