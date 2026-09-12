import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  AlarmClock,
  AlertTriangle,
  FileText,
  CalendarClock,
  Plus,
  ChevronRight,
  Clock,
  Newspaper,
} from "lucide-react";
import { useApp, TODAY_ISO } from "../context/AppContext";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  PageHeader,
  StatCard,
  EmptyState,
  ProgressBar,
} from "../components/ui/primitives";
import EventComposer from "../components/EventComposer";
import DeadlineTriggerDialog from "../components/DeadlineTriggerDialog";
import {
  cx,
  formatFullDate,
  formatShortDate,
  formatTime,
  relativeDaysCompact,
  docketTypeLabel,
  docketTypeTone,
  eventTypeTone,
  jurisdictionTypeLabel,
  jurisdictionTypeTone,
  toneDot,
} from "../lib/utils";
import { indexBy, scopeRows, scopeCases, enrichDeadline } from "../lib/selectors";
import { daysUntil } from "../../shared/rules/engine";
import type { JurisdictionType } from "../../shared/types";

export default function DashboardPage() {
  const { cases, dockets, deadlines, events, currentUser, role, scopedCaseIds } = useApp();
  const navigate = useNavigate();
  const [eventOpen, setEventOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);

  const caseMap = useMemo(() => indexBy(cases), [cases]);
  const myCases = useMemo(() => scopeCases(cases, scopedCaseIds), [cases, scopedCaseIds]);
  const myDockets = useMemo(() => scopeRows(dockets, scopedCaseIds), [dockets, scopedCaseIds]);
  const myEvents = useMemo(() => scopeRows(events, scopedCaseIds), [events, scopedCaseIds]);
  const myDeadlines = useMemo(
    () => scopeRows(deadlines, scopedCaseIds).map((d) => enrichDeadline(d, caseMap, TODAY_ISO)),
    [deadlines, scopedCaseIds, caseMap],
  );

  const open = useMemo(() => myDeadlines.filter((d) => d.status !== "past").sort((a, b) => a.daysAway - b.daysAway), [myDeadlines]);
  const overdue = open.filter((d) => d.daysAway < 0);
  const dueThisWeek = open.filter((d) => d.daysAway >= 0 && d.daysAway <= 7);

  const recentFilings = useMemo(
    () =>
      myDockets
        .map((d) => ({ d, age: daysUntil(d.filedDate, TODAY_ISO) }))
        .filter((x) => x.age <= 0 && x.age >= -10)
        .sort((a, b) => (a.d.filedDate < b.d.filedDate ? 1 : -1)),
    [myDockets],
  );
  const filingsThisWeek = recentFilings.filter((x) => x.age >= -7).length;

  const weekEvents = useMemo(
    () =>
      myEvents
        .map((e) => ({ e, days: daysUntil(e.date, TODAY_ISO) }))
        .filter((x) => x.days >= 0 && x.days <= 10)
        .sort((a, b) => (a.e.date === b.e.date ? a.e.time.localeCompare(b.e.time) : a.e.date < b.e.date ? -1 : 1)),
    [myEvents],
  );
  const hearingsThisWeek = weekEvents.filter((x) => x.days <= 7 && x.e.type === "Hearing").length;

  const jxMix = useMemo(() => {
    const order: JurisdictionType[] = ["federal", "state", "jpml"];
    return order
      .map((t) => ({ t, n: myCases.filter((c) => c.jurisdictionType === t).length }))
      .filter((x) => x.n > 0);
  }, [myCases]);

  const firstName = currentUser?.name.split(" ")[0] ?? "there";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        sub={`${formatFullDate(TODAY_ISO)} · Viewing as ${role}`}
        actions={
          <>
            <Button onClick={() => setDeadlineOpen(true)}>
              <AlarmClock className="h-4 w-4" />
              Track deadline
            </Button>
            <Button variant="primary" onClick={() => setEventOpen(true)}>
              <Plus className="h-4 w-4" />
              New event
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Active matters" value={myCases.filter((c) => c.status === "active").length} icon={Briefcase} tone="blue" hint={`${myCases.length} total tracked`} onClick={() => navigate("/cases")} />
        <StatCard label="Overdue" value={overdue.length} icon={AlertTriangle} tone={overdue.length > 0 ? "red" : "green"} hint={overdue.length > 0 ? "Needs attention" : "None overdue"} onClick={() => navigate("/deadlines")} />
        <StatCard label="Due ≤ 7 days" value={dueThisWeek.length} icon={AlarmClock} tone={dueThisWeek.length > 0 ? "amber" : "green"} hint="Filing deadlines" onClick={() => navigate("/deadlines")} />
        <StatCard label="Filings this week" value={filingsThisWeek} icon={FileText} tone="teal" hint="New docket entries" onClick={() => navigate("/docket")} />
        <StatCard label="Hearings ≤ 7 days" value={hearingsThisWeek} icon={CalendarClock} tone="brass" hint="On the calendar" onClick={() => navigate("/calendar")} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Needs attention"
              icon={AlarmClock}
              sub="Overdue and upcoming deadlines, soonest first"
              action={<Link to="/deadlines" className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-blue hover:underline">All deadlines <ChevronRight className="h-3.5 w-3.5" /></Link>}
            />
            <div className="divide-y divide-line-soft">
              {open.slice(0, 6).map((d) => (
                <Link
                  key={d.id}
                  to={`/cases/${d.caseId}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-hover"
                >
                  <span className={cx("h-2 w-2 shrink-0 rounded-full", toneDot(d.urgency.tone))} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">{d.label}</div>
                    <div className="text-[11.5px] text-muted">
                      {d.case?.shortName} · {d.rule?.citation} · {formatShortDate(d.computedDate)}
                    </div>
                  </div>
                  <Badge tone={d.urgency.tone}>{d.urgency.label}</Badge>
                </Link>
              ))}
              {open.length === 0 && <EmptyState icon={AlarmClock} title="No open deadlines">Everything tracked is filed or calendared.</EmptyState>}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Recent docket activity"
              icon={Newspaper}
              sub="Latest filings across your matters"
              action={<Link to="/docket" className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-blue hover:underline">Full feed <ChevronRight className="h-3.5 w-3.5" /></Link>}
            />
            <div className="divide-y divide-line-soft">
              {recentFilings.slice(0, 6).map(({ d }) => (
                <Link key={d.id} to={`/cases/${d.caseId}`} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-hover">
                  <Badge tone={docketTypeTone(d.type)}>{docketTypeLabel(d.type)}</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">{d.title}</div>
                    <div className="text-[11.5px] text-muted">{caseMap.get(d.caseId)?.shortName} · No. {d.entryNo}</div>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-muted">
                    <div>{formatShortDate(d.filedDate)}</div>
                    <div>{relativeDaysCompact(d.filedDate, TODAY_ISO)}</div>
                  </div>
                </Link>
              ))}
              {recentFilings.length === 0 && <EmptyState icon={Newspaper} title="No recent filings" />}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="This week"
              icon={CalendarClock}
              action={<Link to="/calendar" className="text-[12px] font-semibold text-brand-blue hover:underline">Calendar</Link>}
            />
            <div className="divide-y divide-line-soft">
              {weekEvents.slice(0, 6).map(({ e, days }) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-11 shrink-0 text-center">
                    <div className="text-[9.5px] font-bold uppercase text-muted">{formatShortDate(e.date).split(" ")[0]}</div>
                    <div className="text-[16px] font-bold leading-none text-ink">{formatShortDate(e.date).split(" ")[1]}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold text-ink">{e.title}</div>
                    <div className="flex items-center gap-1 text-[11px] text-muted">
                      <Clock className="h-3 w-3" />
                      {formatTime(e.time)} · {days === 0 ? "today" : `in ${days}d`}
                    </div>
                  </div>
                  <span className={cx("h-2 w-2 shrink-0 rounded-full", toneDot(eventTypeTone(e.type)))} />
                </div>
              ))}
              {weekEvents.length === 0 && <EmptyState icon={CalendarClock} title="Nothing scheduled" />}
            </div>
          </Card>

          <Card>
            <CardHeader title="Jurisdiction mix" icon={Briefcase} />
            <div className="space-y-3 p-4">
              {jxMix.map(({ t, n }) => {
                const pct = myCases.length ? Math.round((n / myCases.length) * 100) : 0;
                return (
                  <div key={t}>
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-1.5 font-medium text-slate">
                        <Badge tone={jurisdictionTypeTone(t)}>{jurisdictionTypeLabel(t)}</Badge>
                      </span>
                      <span className="font-semibold text-ink">{n} · {pct}%</span>
                    </div>
                    <ProgressBar value={pct} tone={jurisdictionTypeTone(t)} />
                  </div>
                );
              })}
              {jxMix.length === 0 && <div className="py-4 text-center text-[13px] text-muted">No matters in view.</div>}
            </div>
          </Card>
        </div>
      </div>

      <EventComposer open={eventOpen} onClose={() => setEventOpen(false)} />
      <DeadlineTriggerDialog open={deadlineOpen} onClose={() => setDeadlineOpen(false)} />
    </>
  );
}
