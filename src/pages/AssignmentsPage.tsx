import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserPlus, Briefcase, Search, X, Plus, UserCog } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  PageHeader,
  StatCard,
  EmptyState,
  Field,
  Modal,
  ProgressBar,
  Segmented,
  inputClass,
  selectClass,
} from "../components/ui/primitives";
import UserFormModal from "../components/UserFormModal";
import {
  cx,
  jurisdictionTypeLabel,
  jurisdictionTypeTone,
  userRoleTone,
} from "../lib/utils";
import { indexBy, scopeCases, teamForCase } from "../lib/selectors";
import type { CaseRecord } from "../../shared/types";

const TEAM_ROLES = ["Lead attorney", "Reviewing partner", "Associate", "Lit paralegal", "Managing clerk", "Support"];

export default function AssignmentsPage() {
  const { cases, users, assignments, scopedCaseIds, removeAssignment } = useApp();
  const [view, setView] = useState<"matter" | "person">("matter");
  const [q, setQ] = useState("");
  const [userModal, setUserModal] = useState(false);
  const [assignFor, setAssignFor] = useState<CaseRecord | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const userMap = useMemo(() => indexBy(users), [users]);
  const visibleCases = useMemo(() => scopeCases(cases, scopedCaseIds), [cases, scopedCaseIds]);
  const visibleCaseIds = useMemo(() => new Set(visibleCases.map((c) => c.id)), [visibleCases]);

  const workload = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of assignments) {
      if (!visibleCaseIds.has(a.caseId)) continue;
      counts.set(a.userId, (counts.get(a.userId) ?? 0) + 1);
    }
    return users
      .map((u) => ({ user: u, count: counts.get(u.id) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [assignments, users, visibleCaseIds]);

  const maxLoad = Math.max(1, ...workload.map((w) => w.count));
  const staffedCaseIds = new Set(assignments.map((a) => a.caseId));
  const unstaffed = visibleCases.filter((c) => !staffedCaseIds.has(c.id)).length;

  const filteredCases = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return visibleCases
      .filter((c) => !needle || c.shortName.toLowerCase().includes(needle) || c.name.toLowerCase().includes(needle))
      .sort((a, b) => a.shortName.localeCompare(b.shortName));
  }, [visibleCases, q]);

  const filteredPeople = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return workload.filter(
      (w) => !needle || w.user.name.toLowerCase().includes(needle) || w.user.role.toLowerCase().includes(needle),
    );
  }, [workload, q]);

  const openAssign = (c: CaseRecord | null) => {
    setAssignFor(c);
    setAssignOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Team & Assignments"
        sub="Who is staffed on which matter, and where coverage is thin"
        actions={
          <>
            <Button onClick={() => setUserModal(true)}>
              <UserPlus className="h-4 w-4" />
              Add teammate
            </Button>
            <Button variant="primary" onClick={() => openAssign(null)}>
              <Plus className="h-4 w-4" />
              Assign to matter
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Team members" value={users.length} icon={Users} tone="blue" hint={`${users.filter((u) => u.status === "active").length} active`} />
        <StatCard label="Matters staffed" value={visibleCases.filter((c) => staffedCaseIds.has(c.id)).length} icon={Briefcase} tone="teal" hint={`${visibleCases.length} in view`} />
        <StatCard label="Assignments" value={assignments.filter((a) => visibleCaseIds.has(a.caseId)).length} icon={UserCog} tone="brass" hint="Active seat count" />
        <StatCard label="Unstaffed" value={unstaffed} icon={Users} tone={unstaffed > 0 ? "amber" : "green"} hint={unstaffed > 0 ? "Needs coverage" : "All covered"} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented
          options={[{ value: "matter", label: "By matter" }, { value: "person", label: "By person" }]}
          value={view}
          onChange={(v) => setView(v as "matter" | "person")}
        />
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={view === "matter" ? "Search matters…" : "Search people…"} className={cx(inputClass, "pl-9")} />
        </div>
      </div>

      {view === "matter" ? (
        <div className="space-y-3">
          {filteredCases.length === 0 ? (
            <Card><EmptyState icon={Briefcase} title="No matters match" /></Card>
          ) : (
            filteredCases.map((c) => {
              const team = teamForCase(c.id, assignments, userMap);
              return (
                <Card key={c.id} className="p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/cases/${c.id}`} className="text-[14px] font-bold text-ink hover:text-brand-blue">{c.shortName}</Link>
                        <Badge tone={jurisdictionTypeTone(c.jurisdictionType)}>{jurisdictionTypeLabel(c.jurisdictionType)}</Badge>
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-muted">{c.name}</div>
                    </div>
                    <Button size="sm" onClick={() => openAssign(c)}>
                      <Plus className="h-3.5 w-3.5" />
                      Assign
                    </Button>
                  </div>
                  {team.length === 0 ? (
                    <div className="mt-3 rounded-lg border border-dashed border-line bg-canvas px-3 py-2.5 text-[12px] text-muted">
                      No one staffed yet.
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {team.map((m) => (
                        <div key={m.assignmentId} className="group flex items-center gap-2 rounded-lg border border-line bg-white py-1 pl-1.5 pr-1">
                          <Avatar name={m.name} tone={userRoleTone(m.role)} size="xs" />
                          <div className="leading-tight">
                            <div className="text-[12px] font-semibold text-ink">{m.name}</div>
                            <div className="text-[10.5px] text-muted">{m.teamRole}</div>
                          </div>
                          <button
                            onClick={() => removeAssignment(m.assignmentId)}
                            title={`Remove ${m.name}`}
                            className="grid h-6 w-6 place-items-center rounded-md text-muted transition-colors hover:bg-brand-red-soft hover:text-brand-red"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredPeople.map(({ user, count }) => {
            const theirCases = assignments
              .filter((a) => a.userId === user.id && visibleCaseIds.has(a.caseId))
              .map((a) => ({ c: cases.find((x) => x.id === a.caseId), teamRole: a.teamRole }))
              .filter((x): x is { c: CaseRecord; teamRole: string } => Boolean(x.c));
            return (
              <Card key={user.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} tone={userRoleTone(user.role)} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-bold text-ink">{user.name}</span>
                      {user.status === "invited" && <Badge tone="amber">Invited</Badge>}
                    </div>
                    <div className="truncate text-[12px] text-muted">{user.title ?? user.role}</div>
                  </div>
                  <Badge tone={userRoleTone(user.role)}>{user.role}</Badge>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11.5px]">
                    <span className="font-medium text-slate">Workload</span>
                    <span className="font-semibold text-ink">{count} {count === 1 ? "matter" : "matters"}</span>
                  </div>
                  <ProgressBar value={(count / maxLoad) * 100} tone={count >= maxLoad && maxLoad > 1 ? "amber" : "blue"} />
                </div>
                {theirCases.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {theirCases.map(({ c, teamRole }) => (
                      <Link key={c.id} to={`/cases/${c.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-slate transition-colors hover:border-[#cdd3df] hover:text-ink">
                        {c.shortName}
                        <span className="text-muted">· {teamRole}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <UserFormModal open={userModal} onClose={() => setUserModal(false)} />
      <AssignModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        defaultCase={assignFor}
        cases={visibleCases}
      />
    </>
  );
}

function AssignModal({
  open,
  onClose,
  defaultCase,
  cases,
}: {
  open: boolean;
  onClose: () => void;
  defaultCase: CaseRecord | null;
  cases: CaseRecord[];
}) {
  const { users, assignments, addAssignment } = useApp();
  const [caseId, setCaseId] = useState(defaultCase?.id ?? "");
  const [userId, setUserId] = useState("");
  const [teamRole, setTeamRole] = useState(TEAM_ROLES[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync default case when the modal is (re)opened for a specific matter.
  const effectiveCaseId = caseId || defaultCase?.id || cases[0]?.id || "";

  const alreadyOn = new Set(assignments.filter((a) => a.caseId === effectiveCaseId).map((a) => a.userId));
  const availableUsers = users.filter((u) => !alreadyOn.has(u.id));

  const close = () => {
    setCaseId("");
    setUserId("");
    setTeamRole(TEAM_ROLES[0]);
    setError(null);
    onClose();
  };

  const submit = async () => {
    const cid = effectiveCaseId;
    if (!cid || !userId) {
      setError("Pick a matter and a team member.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addAssignment({ caseId: cid, userId, teamRole });
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Assign to matter" sub="Staff a team member on a matter.">
      <Field label="Matter">
        <select className={selectClass} value={effectiveCaseId} onChange={(e) => setCaseId(e.target.value)}>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>{c.shortName}</option>
          ))}
        </select>
      </Field>
      <Field label="Team member" hint={availableUsers.length === 0 ? "Everyone is already staffed on this matter." : undefined}>
        <select className={selectClass} value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Select a person…</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.name} · {u.role}</option>
          ))}
        </select>
      </Field>
      <Field label="Team role">
        <select className={selectClass} value={teamRole} onChange={(e) => setTeamRole(e.target.value)}>
          {TEAM_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </Field>
      {error && <p className="mb-3 text-xs font-medium text-brand-red">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button onClick={close}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={saving || availableUsers.length === 0}>
          {saving ? "Assigning…" : "Assign"}
        </Button>
      </div>
    </Modal>
  );
}
