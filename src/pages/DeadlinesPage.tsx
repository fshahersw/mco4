import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlarmClock, AlertTriangle, CalendarCheck, Search, Clock, ChevronRight, Scale } from "lucide-react";
import { useApp, TODAY_ISO } from "../context/AppContext";
import {
  Badge,
  Button,
  Card,
  Chip,
  PageHeader,
  StatCard,
  EmptyState,
  inputClass,
} from "../components/ui/primitives";
import DeadlineTriggerDialog from "../components/DeadlineTriggerDialog";
import {
  cx,
  formatShortDate,
  jurisdictionTypeLabel,
  jurisdictionTypeTone,
  toneDot,
} from "../lib/utils";
import { indexBy, scopeRows, enrichDeadline, type EnrichedDeadline } from "../lib/selectors";
import type { JurisdictionType } from "../../shared/types";

type JxFilter = "all" | JurisdictionType;

const JX_FILTERS: { value: JxFilter; label: string }[] = [
  { value: "all", label: "All courts" },
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
  { value: "jpml", label: "JPML" },
];

interface Group {
  key: string;
  label: string;
  tone: Parameters<typeof toneDot>[0];
  hint: string;
  rows: EnrichedDeadline[];
}

export default function DeadlinesPage() {
  const { cases, deadlines, scopedCaseIds } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [jx, setJx] = useState<JxFilter>("all");
  const [showFiled, setShowFiled] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const caseMap = useMemo(() => indexBy(cases), [cases]);

  const enriched = useMemo(
    () => scopeRows(deadlines, scopedCaseIds).map((d) => enrichDeadline(d, caseMap, TODAY_ISO)),
    [deadlines, scopedCaseIds, caseMap],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return enriched
      .filter((d) => jx === "all" || d.case?.jurisdictionType === jx)
      .filter((d) => {
        if (!needle) return true;
        return (
          d.label.toLowerCase().includes(needle) ||
          (d.case?.shortName.toLowerCase().includes(needle) ?? false) ||
          (d.rule?.citation.toLowerCase().includes(needle) ?? false)
        );
      });
  }, [enriched, jx, q]);

  const open = filtered.filter((d) => d.status !== "past");
  const stats = useMemo(() => {
    const overdue = open.filter((d) => d.daysAway < 0).length;
    const week = open.filter((d) => d.daysAway >= 0 && d.daysAway <= 7).length;
    const calendared = open.filter((d) => d.status === "calendared").length;
    return { overdue, week, calendared, open: open.length };
  }, [open]);

  const groups = useMemo<Group[]>(() => {
    const overdue = open.filter((d) => d.daysAway < 0).sort((a, b) => a.daysAway - b.daysAway);
    const week = open.filter((d) => d.daysAway >= 0 && d.daysAway <= 7).sort((a, b) => a.daysAway - b.daysAway);
    const upcoming = open.filter((d) => d.daysAway > 7).sort((a, b) => a.daysAway - b.daysAway);
    const result: Group[] = [
      { key: "overdue", label: "Overdue", tone: "red", hint: "Past due — needs action now", rows: overdue },
      { key: "week", label: "Due this week", tone: "amber", hint: "Within the next 7 days", rows: week },
      { key: "upcoming", label: "Upcoming", tone: "gray", hint: "More than 7 days out", rows: upcoming },
    ];
    if (showFiled) {
      const filed = filtered.filter((d) => d.status === "past").sort((a, b) => (a.computedDate < b.computedDate ? 1 : -1));
      result.push({ key: "filed", label: "Filed / satisfied", tone: "green", hint: "Resolved deadlines", rows: filed });
    }
    return result.filter((g) => g.rows.length > 0);
  }, [open, filtered, showFiled]);

  return (
    <>
      <PageHeader
        title="Deadlines"
        sub="Rule-computed filing deadlines across your matters, grouped by urgency"
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <AlarmClock className="h-4 w-4" />
            Track deadline
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open" value={stats.open} icon={AlarmClock} tone="blue" hint="Not yet filed" />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} tone={stats.overdue > 0 ? "red" : "green"} hint={stats.overdue > 0 ? "Needs action" : "All clear"} />
        <StatCard label="Due ≤ 7 days" value={stats.week} icon={Clock} tone={stats.week > 0 ? "amber" : "green"} hint="This week" />
        <StatCard label="Calendared" value={stats.calendared} icon={CalendarCheck} tone="teal" hint="On the calendar" />
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search deadlines, matters, or citations…" className={cx(inputClass, "pl-9")} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {JX_FILTERS.map((f) => (
            <Chip key={f.value} active={jx === f.value} onClick={() => setJx(f.value)}>
              {f.label}
            </Chip>
          ))}
          <div className="ml-auto">
            <Chip active={showFiled} onClick={() => setShowFiled((v) => !v)}>
              {showFiled ? "Hide filed" : "Show filed"}
            </Chip>
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <EmptyState icon={AlarmClock} title="No deadlines in view">
            Nothing matches these filters. Track a deadline to start monitoring a rule.
          </EmptyState>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.key}>
              <div className="mb-2 flex items-center gap-2">
                <span className={cx("h-2 w-2 rounded-full", toneDot(g.tone))} />
                <h2 className="text-[13px] font-bold text-ink">{g.label}</h2>
                <span className="rounded-full bg-neutral-soft px-1.5 text-[11px] font-semibold text-slate">{g.rows.length}</span>
                <span className="text-[11.5px] text-muted">· {g.hint}</span>
              </div>
              <Card>
                <div className="divide-y divide-line-soft">
                  {g.rows.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => navigate(`/cases/${d.caseId}`)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover"
                    >
                      <div className="w-14 shrink-0 text-center">
                        <div className="text-[9.5px] font-bold uppercase text-muted">{formatShortDate(d.computedDate).split(" ")[0]}</div>
                        <div className="text-[17px] font-bold leading-none text-ink">{formatShortDate(d.computedDate).split(" ")[1]}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-semibold text-ink">{d.label}</span>
                          {d.status === "calendared" && <Badge tone="teal">Calendared</Badge>}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted">
                          <span className="font-medium text-slate">{d.case?.shortName}</span>
                          {d.case && (
                            <Badge tone={jurisdictionTypeTone(d.case.jurisdictionType)}>{jurisdictionTypeLabel(d.case.jurisdictionType)}</Badge>
                          )}
                          {d.rule && <span className="inline-flex items-center gap-1"><Scale className="h-3 w-3" />{d.rule.citation}</span>}
                          <span>· triggered {formatShortDate(d.triggerDate)}</span>
                        </div>
                      </div>
                      <Badge tone={d.urgency.tone}>{d.urgency.label}</Badge>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <DeadlineTriggerDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
