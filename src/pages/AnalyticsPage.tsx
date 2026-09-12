import { useMemo } from "react";
import { Briefcase, FileText, AlarmClock, AlertTriangle, TrendingUp } from "lucide-react";
import { useApp, TODAY_ISO } from "../context/AppContext";
import { Card, CardHeader, PageHeader, StatCard, ProgressBar } from "../components/ui/primitives";
import {
  cx,
  daysBetween,
  toneFill,
  toneDot,
  docketTypeLabel,
  docketTypeTone,
  caseStatusLabel,
  caseStatusTone,
  jurisdictionTypeLabel,
  jurisdictionTypeTone,
  type Tone,
} from "../lib/utils";
import { indexBy, scopeRows, scopeCases, enrichDeadline } from "../lib/selectors";
import type { CaseStatus, DocketType, JurisdictionType } from "../../shared/types";

interface Slice {
  label: string;
  value: number;
  tone: Tone;
}

export default function AnalyticsPage() {
  const { cases, dockets, deadlines, scopedCaseIds } = useApp();
  const caseMap = useMemo(() => indexBy(cases), [cases]);

  const myCases = useMemo(() => scopeCases(cases, scopedCaseIds), [cases, scopedCaseIds]);
  const myDockets = useMemo(() => scopeRows(dockets, scopedCaseIds), [dockets, scopedCaseIds]);
  const myDeadlines = useMemo(
    () => scopeRows(deadlines, scopedCaseIds).map((d) => enrichDeadline(d, caseMap, TODAY_ISO)),
    [deadlines, scopedCaseIds, caseMap],
  );

  const open = myDeadlines.filter((d) => d.status !== "past");
  const overdue = open.filter((d) => d.daysAway < 0).length;

  // Filing activity, last 8 weeks (bucket 0 = current week).
  const weeks = useMemo(() => {
    const buckets = Array.from({ length: 8 }, () => 0);
    for (const d of myDockets) {
      const diff = daysBetween(d.filedDate, TODAY_ISO);
      if (diff < 0) continue;
      const idx = Math.floor(diff / 7);
      if (idx < 8) buckets[idx] += 1;
    }
    return buckets
      .map((n, i) => ({ label: i === 0 ? "This wk" : `${i}w`, value: n }))
      .reverse();
  }, [myDockets]);

  const jxMix = useMemo<Slice[]>(() => {
    const order: JurisdictionType[] = ["federal", "state", "jpml"];
    return order
      .map((t) => ({ label: jurisdictionTypeLabel(t), value: myCases.filter((c) => c.jurisdictionType === t).length, tone: jurisdictionTypeTone(t) }))
      .filter((s) => s.value > 0);
  }, [myCases]);

  const deadlineHealth = useMemo<Slice[]>(() => {
    const week = open.filter((d) => d.daysAway >= 0 && d.daysAway <= 7).length;
    const upcoming = open.filter((d) => d.daysAway > 7).length;
    const rows: Slice[] = [
      { label: "Overdue", value: overdue, tone: "red" },
      { label: "Due ≤ 7d", value: week, tone: "amber" },
      { label: "Upcoming", value: upcoming, tone: "gray" },
    ];
    return rows.filter((s) => s.value > 0);
  }, [open, overdue]);

  const filingTypes = useMemo<Slice[]>(() => {
    const order: DocketType[] = ["order", "motion", "notice", "cmo", "report", "filing"];
    return order
      .map((t) => ({ label: docketTypeLabel(t), value: myDockets.filter((d) => d.type === t).length, tone: docketTypeTone(t) }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [myDockets]);

  const statusMix = useMemo<Slice[]>(() => {
    const order: CaseStatus[] = ["active", "settling", "stayed", "closed"];
    return order
      .map((s) => ({ label: caseStatusLabel(s), value: myCases.filter((c) => c.status === s).length, tone: caseStatusTone(s) }))
      .filter((s) => s.value > 0);
  }, [myCases]);

  const busiest = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of myDockets) counts.set(d.caseId, (counts.get(d.caseId) ?? 0) + 1);
    return [...counts.entries()]
      .map(([id, n]) => ({ label: caseMap.get(id)?.shortName ?? "—", value: n, tone: "teal" as Tone }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [myDockets, caseMap]);

  return (
    <>
      <PageHeader title="Analytics" sub="Portfolio health, filing velocity, and deadline exposure at a glance" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Matters" value={myCases.length} icon={Briefcase} tone="blue" hint={`${myCases.filter((c) => c.status === "active").length} active`} />
        <StatCard label="Filings tracked" value={myDockets.length} icon={FileText} tone="teal" hint="Across all matters" />
        <StatCard label="Open deadlines" value={open.length} icon={AlarmClock} tone="brass" hint="Awaiting filing" />
        <StatCard label="Overdue" value={overdue} icon={AlertTriangle} tone={overdue > 0 ? "red" : "green"} hint={overdue > 0 ? "Needs action" : "All clear"} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader title="Filing activity" icon={TrendingUp} sub="Docket entries filed per week, last 8 weeks" />
          <div className="p-5">
            <Columns data={weeks} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Deadline health" sub="Open deadlines by urgency" />
          <div className="flex items-center gap-5 p-5">
            <Donut segments={deadlineHealth} centerLabel="open" />
            <Legend segments={deadlineHealth} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Jurisdiction mix" sub="Matters by court system" />
          <div className="flex items-center gap-5 p-5">
            <Donut segments={jxMix} centerLabel="matters" />
            <Legend segments={jxMix} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Matter status" sub="Portfolio breakdown" />
          <div className="space-y-3 p-5">
            <Bars data={statusMix} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Filings by type" sub="Composition of docket activity" />
          <div className="space-y-3 p-5">
            <Bars data={filingTypes} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Busiest matters" sub="Most docket activity tracked" />
          <div className="space-y-3 p-5">
            <Bars data={busiest} />
          </div>
        </Card>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- charts */

function Donut({ segments, centerLabel }: { segments: Slice[]; centerLabel: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const size = 132;
  let acc = 0;
  const stops =
    total === 0
      ? "var(--color-neutral-soft) 0deg 360deg"
      : segments
          .map((s) => {
            const start = (acc / total) * 360;
            acc += s.value;
            const end = (acc / total) * 360;
            return `${toneFill(s.tone)} ${start}deg ${end}deg`;
          })
          .join(", ");
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="h-full w-full rounded-full" style={{ background: `conic-gradient(${stops})` }} />
      <div
        className="absolute inset-0 m-auto grid place-items-center rounded-full bg-white"
        style={{ width: size * 0.6, height: size * 0.6 }}
      >
        <div className="text-center">
          <div className="text-[24px] font-bold leading-none text-ink">{total}</div>
          <div className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wide text-muted">{centerLabel}</div>
        </div>
      </div>
    </div>
  );
}

function Legend({ segments }: { segments: Slice[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  if (segments.length === 0) return <div className="text-[13px] text-muted">No data in view.</div>;
  return (
    <div className="min-w-0 flex-1 space-y-2">
      {segments.map((s) => (
        <div key={s.label} className="flex items-center gap-2 text-[12.5px]">
          <span className={cx("h-2.5 w-2.5 shrink-0 rounded-sm", toneDot(s.tone))} />
          <span className="flex-1 truncate text-slate">{s.label}</span>
          <span className="font-semibold text-ink">{s.value}</span>
          <span className="w-9 text-right text-muted">{Math.round((s.value / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

function Columns({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height: 160 }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5">
          <div className="text-[10.5px] font-semibold text-slate">{d.value}</div>
          <div
            className="w-full max-w-[38px] rounded-t-md transition-all"
            style={{ height: Math.max(3, (d.value / max) * 128), background: toneFill(i === data.length - 1 ? "blue" : "teal") }}
          />
          <div className="text-[9.5px] font-medium text-muted">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function Bars({ data }: { data: Slice[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <div className="text-[13px] text-muted">No data in view.</div>;
  return (
    <>
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className="truncate text-slate">{d.label}</span>
            <span className="font-semibold text-ink">{d.value}</span>
          </div>
          <ProgressBar value={(d.value / max) * 100} tone={d.tone} />
        </div>
      ))}
    </>
  );
}
