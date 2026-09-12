import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Briefcase, Activity, Landmark, Gavel, Plus, AlarmClock } from "lucide-react";
import { useApp, TODAY_ISO } from "../context/AppContext";
import {
  Badge,
  Button,
  Chip,
  PageHeader,
  StatCard,
  Card,
  EmptyState,
  Avatar,
  inputClass,
} from "../components/ui/primitives";
import DeadlineTriggerDialog from "../components/DeadlineTriggerDialog";
import {
  cx,
  caseCategoryLabel,
  caseStatusLabel,
  caseStatusTone,
  jurisdictionTypeLabel,
  jurisdictionTypeTone,
  formatShortDate,
  relativeDaysCompact,
  userRoleTone,
} from "../lib/utils";
import { indexBy, scopeCases, teamForCase, docketsForCase } from "../lib/selectors";
import type { CaseStatus, JurisdictionType } from "../../shared/types";

type JxFilter = "all" | JurisdictionType;
type StFilter = "all" | CaseStatus;

export default function CasesPage() {
  const { cases, dockets, deadlines, assignments, users, scopedCaseIds } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [jx, setJx] = useState<JxFilter>("all");
  const [st, setSt] = useState<StFilter>("all");
  const [triggerOpen, setTriggerOpen] = useState(false);

  const userMap = useMemo(() => indexBy(users), [users]);
  const visibleCases = useMemo(() => scopeCases(cases, scopedCaseIds), [cases, scopedCaseIds]);

  const openDeadlinesByCase = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of deadlines) if (d.status !== "past") m.set(d.caseId, (m.get(d.caseId) ?? 0) + 1);
    return m;
  }, [deadlines]);

  const lastActivityByCase = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of dockets) {
      const cur = m.get(d.caseId);
      if (!cur || d.filedDate > cur) m.set(d.caseId, d.filedDate);
    }
    return m;
  }, [dockets]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return visibleCases
      .filter((c) => jx === "all" || c.jurisdictionType === jx)
      .filter((c) => st === "all" || c.status === st)
      .filter(
        (c) =>
          !needle ||
          c.name.toLowerCase().includes(needle) ||
          c.shortName.toLowerCase().includes(needle) ||
          c.docketNo.toLowerCase().includes(needle) ||
          c.court.toLowerCase().includes(needle) ||
          c.practiceArea.toLowerCase().includes(needle),
      )
      .sort((a, b) => (lastActivityByCase.get(b.id) ?? "").localeCompare(lastActivityByCase.get(a.id) ?? ""));
  }, [visibleCases, jx, st, q, lastActivityByCase]);

  const stats = useMemo(
    () => ({
      total: visibleCases.length,
      active: visibleCases.filter((c) => c.status === "active").length,
      mdl: visibleCases.filter((c) => c.category === "mdl").length,
      jpml: visibleCases.filter((c) => c.jurisdictionType === "jpml").length,
    }),
    [visibleCases],
  );

  const jxChips: { value: JxFilter; label: string }[] = [
    { value: "all", label: "All jurisdictions" },
    { value: "federal", label: "Federal" },
    { value: "state", label: "State" },
    { value: "jpml", label: "JPML" },
  ];
  const stChips: { value: StFilter; label: string }[] = [
    { value: "all", label: "Any status" },
    { value: "active", label: "Active" },
    { value: "settling", label: "Settling" },
    { value: "stayed", label: "Stayed" },
    { value: "closed", label: "Closed" },
  ];

  return (
    <>
      <PageHeader
        title="Cases & Matters"
        sub={`${stats.total} tracked ${stats.total === 1 ? "matter" : "matters"} across federal, state, and JPML dockets`}
        actions={
          <Button variant="primary" onClick={() => setTriggerOpen(true)}>
            <AlarmClock className="h-4 w-4" />
            Track deadline
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total matters" value={stats.total} icon={Briefcase} tone="blue" />
        <StatCard label="Active" value={stats.active} icon={Activity} tone="green" />
        <StatCard label="MDLs" value={stats.mdl} icon={Landmark} tone="brass" />
        <StatCard label="Pending JPML" value={stats.jpml} icon={Gavel} tone="teal" />
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by caption, docket no., court, practice area…"
            className={cx(inputClass, "pl-9")}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {jxChips.map((c) => (
            <Chip key={c.value} active={jx === c.value} onClick={() => setJx(c.value)}>
              {c.label}
            </Chip>
          ))}
          <span className="mx-1 h-4 w-px bg-line" />
          {stChips.map((c) => (
            <Chip key={c.value} active={st === c.value} onClick={() => setSt(c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={Briefcase} title="No matters match" action={<Button onClick={() => { setQ(""); setJx("all"); setSt("all"); }}>Clear filters</Button>}>
            Adjust your search or filters to see tracked matters.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-line-soft text-[10.5px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-bold">Matter</th>
                  <th className="px-4 py-2.5 font-bold">Jurisdiction</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                  <th className="px-4 py-2.5 font-bold">Open deadlines</th>
                  <th className="px-4 py-2.5 font-bold">Team</th>
                  <th className="px-4 py-2.5 font-bold">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const team = teamForCase(c.id, assignments, userMap);
                  const openCount = openDeadlinesByCase.get(c.id) ?? 0;
                  const last = lastActivityByCase.get(c.id);
                  const lastEntries = docketsForCase(c.id, dockets);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/cases/${c.id}`)}
                      className="cursor-pointer border-b border-line-soft transition-colors last:border-0 hover:bg-hover"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-ink">{c.shortName}</span>
                          <Badge tone="gray">{caseCategoryLabel(c.category)}</Badge>
                        </div>
                        <div className="mt-0.5 max-w-md truncate text-[11.5px] text-muted">{c.name}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-slate">{c.docketNo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={jurisdictionTypeTone(c.jurisdictionType)}>
                          {jurisdictionTypeLabel(c.jurisdictionType)}
                        </Badge>
                        <div className="mt-1 text-[11.5px] text-slate">{c.jurisdictionLabel}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={caseStatusTone(c.status)} dot>
                          {caseStatusLabel(c.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {openCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                            <AlarmClock className="h-3.5 w-3.5 text-brand-amber" />
                            {openCount}
                          </span>
                        ) : (
                          <span className="text-[13px] text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex -space-x-1.5">
                          {team.slice(0, 3).map((m) => (
                            <span key={m.id} className="rounded-lg ring-2 ring-white">
                              <Avatar name={m.name} tone={userRoleTone(m.role)} size="xs" />
                            </span>
                          ))}
                          {team.length > 3 && (
                            <span className="grid h-6 w-6 place-items-center rounded-lg bg-neutral-soft text-[9px] font-bold text-slate ring-2 ring-white">
                              +{team.length - 3}
                            </span>
                          )}
                          {team.length === 0 && <span className="text-[13px] text-muted">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {last ? (
                          <>
                            <div className="text-[12.5px] text-ink">{formatShortDate(last)}</div>
                            <div className="text-[11px] text-muted">
                              {relativeDaysCompact(last, TODAY_ISO)} · {lastEntries[0]?.title.slice(0, 28) ?? ""}
                              {(lastEntries[0]?.title.length ?? 0) > 28 ? "…" : ""}
                            </div>
                          </>
                        ) : (
                          <span className="text-[13px] text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <DeadlineTriggerDialog open={triggerOpen} onClose={() => setTriggerOpen(false)} />
    </>
  );
}
