import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Gavel,
  Scale,
  FileText,
  Users,
  Activity,
  AlarmClock,
  Plus,
  Eye,
  CalendarDays,
  Clock,
  Landmark,
  ChevronRight,
} from "lucide-react";
import { useApp, TODAY_ISO } from "../context/AppContext";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  PageHeader,
  StatCard,
  Tabs,
  EmptyState,
  Avatar,
  Divider,
} from "../components/ui/primitives";
import EventComposer from "../components/EventComposer";
import DeadlineTriggerDialog from "../components/DeadlineTriggerDialog";
import PdfPreviewModal from "../components/PdfPreviewModal";
import {
  cx,
  caseCategoryLabel,
  caseStatusLabel,
  caseStatusTone,
  jurisdictionTypeLabel,
  jurisdictionTypeTone,
  docketTypeLabel,
  docketTypeTone,
  fileTagTone,
  eventTypeTone,
  formatShortDate,
  formatLongDate,
  formatFullDate,
  formatTime,
  relativeDaysCompact,
  userRoleTone,
  toneDot,
  type Tone,
} from "../lib/utils";
import { indexBy, teamForCase, docketsForCase, filesForCase, enrichDeadline } from "../lib/selectors";
import type { FileRecord } from "../../shared/types";

type TabKey = "overview" | "docket" | "documents" | "deadlines" | "calendar" | "team" | "activity";

export default function CaseDetailPage() {
  const { id = "" } = useParams();
  const { cases, dockets, files, deadlines, events, assignments, users } = useApp();
  const [tab, setTab] = useState<TabKey>("overview");
  const [preview, setPreview] = useState<FileRecord | null>(null);
  const [eventOpen, setEventOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);

  const kase = cases.find((c) => c.id === id);
  const userMap = useMemo(() => indexBy(users), [users]);
  const fileMap = useMemo(() => indexBy(files), [files]);
  const caseMap = useMemo(() => indexBy(cases), [cases]);

  const caseDockets = useMemo(() => (kase ? docketsForCase(kase.id, dockets) : []), [kase, dockets]);
  const caseFiles = useMemo(() => (kase ? filesForCase(kase.id, files) : []), [kase, files]);
  const caseEvents = useMemo(
    () => (kase ? events.filter((e) => e.caseId === kase.id).sort((a, b) => a.date.localeCompare(b.date)) : []),
    [kase, events],
  );
  const caseDeadlines = useMemo(
    () =>
      kase
        ? deadlines
            .filter((d) => d.caseId === kase.id)
            .map((d) => enrichDeadline(d, caseMap, TODAY_ISO))
            .sort((a, b) => a.daysAway - b.daysAway)
        : [],
    [kase, deadlines, caseMap],
  );
  const team = useMemo(() => (kase ? teamForCase(kase.id, assignments, userMap) : []), [kase, assignments, userMap]);

  if (!kase) {
    return (
      <Card className="mt-10">
        <EmptyState icon={FileText} title="Matter not found" action={<Button variant="primary" onClick={() => history.back()}>Go back</Button>}>
          This matter may have been removed or the link is stale.
        </EmptyState>
      </Card>
    );
  }

  const openDeadlineCount = caseDeadlines.filter((d) => d.status !== "past").length;
  const upcomingEvents = caseEvents.filter((e) => e.date >= TODAY_ISO);

  const tabs: { value: TabKey; label: string; count?: number }[] = [
    { value: "overview", label: "Overview" },
    { value: "docket", label: "Docket", count: caseDockets.length },
    { value: "documents", label: "Documents", count: caseFiles.length },
    { value: "deadlines", label: "Deadlines", count: caseDeadlines.length },
    { value: "calendar", label: "Calendar", count: caseEvents.length },
    { value: "team", label: "Team", count: team.length },
    { value: "activity", label: "Activity" },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={
          <Link to="/cases" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted transition-colors hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" />
            Cases & Matters
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            {kase.shortName}
            <Badge tone={caseStatusTone(kase.status)} dot>
              {caseStatusLabel(kase.status)}
            </Badge>
          </span>
        }
        sub={kase.name}
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

      {/* meta strip */}
      <Card className="mb-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 md:grid-cols-4">
          <Meta icon={Scale} label="Jurisdiction">
            <Badge tone={jurisdictionTypeTone(kase.jurisdictionType)}>{jurisdictionTypeLabel(kase.jurisdictionType)}</Badge>
            <span className="ml-1.5 text-[12.5px] text-slate">{kase.jurisdictionLabel}</span>
          </Meta>
          <Meta icon={Building2} label="Court">
            <span className="text-[12.5px] text-ink">{kase.court}</span>
          </Meta>
          <Meta icon={Gavel} label="Judge">
            <span className="text-[12.5px] text-ink">{kase.judge ?? "—"}</span>
          </Meta>
          <Meta icon={Landmark} label="Docket no.">
            <span className="font-mono text-[12.5px] text-ink">{kase.docketNo}</span>
          </Meta>
          <Meta icon={FileText} label="Category">
            <span className="text-[12.5px] text-ink">{caseCategoryLabel(kase.category)}</span>
          </Meta>
          <Meta icon={Activity} label="Practice area">
            <span className="text-[12.5px] text-ink">{kase.practiceArea}</span>
          </Meta>
          <Meta icon={CalendarDays} label="Opened">
            <span className="text-[12.5px] text-ink">{formatLongDate(kase.openedDate)}</span>
          </Meta>
          <Meta icon={Users} label="Case team">
            <span className="text-[12.5px] text-ink">{team.length} members</span>
          </Meta>
        </div>
      </Card>

      <div className="mb-5">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader title="Matter summary" icon={FileText} />
              <div className="p-4 text-[13.5px] leading-relaxed text-slate">{kase.description}</div>
            </Card>
            <Card>
              <CardHeader
                title="Recent docket activity"
                icon={Activity}
                action={<button onClick={() => setTab("docket")} className="text-[12px] font-semibold text-brand-blue hover:underline">View all</button>}
              />
              <div className="divide-y divide-line-soft">
                {caseDockets.slice(0, 4).map((d) => (
                  <div key={d.id} className="flex items-start gap-3 px-4 py-3">
                    <Badge tone={docketTypeTone(d.type)}>{docketTypeLabel(d.type)}</Badge>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-ink">{d.title}</div>
                      <div className="text-[11.5px] text-muted">
                        No. {d.entryNo} · {formatShortDate(d.filedDate)} · {relativeDaysCompact(d.filedDate, TODAY_ISO)}
                      </div>
                    </div>
                  </div>
                ))}
                {caseDockets.length === 0 && <div className="px-4 py-6 text-center text-[13px] text-muted">No docket entries.</div>}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Docket entries" value={caseDockets.length} icon={Activity} tone="blue" />
              <StatCard label="Documents" value={caseFiles.length} icon={FileText} tone="teal" />
              <StatCard label="Open deadlines" value={openDeadlineCount} icon={AlarmClock} tone={openDeadlineCount > 0 ? "amber" : "green"} />
              <StatCard label="Team" value={team.length} icon={Users} tone="brass" />
            </div>
            <Card>
              <CardHeader title="Upcoming deadlines" icon={AlarmClock} />
              <div className="divide-y divide-line-soft">
                {caseDeadlines.filter((d) => d.status !== "past").slice(0, 4).map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-semibold text-ink">{d.label}</div>
                      <div className="text-[11px] text-muted">{d.rule?.citation} · {formatShortDate(d.computedDate)}</div>
                    </div>
                    <Badge tone={d.urgency.tone}>{d.urgency.label}</Badge>
                  </div>
                ))}
                {openDeadlineCount === 0 && <div className="px-4 py-6 text-center text-[13px] text-muted">No open deadlines.</div>}
              </div>
            </Card>
            <Card>
              <CardHeader title="Upcoming events" icon={CalendarDays} />
              <div className="divide-y divide-line-soft">
                {upcomingEvents.slice(0, 4).map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-semibold text-ink">{e.title}</div>
                      <div className="text-[11px] text-muted">{formatShortDate(e.date)} · {formatTime(e.time)}</div>
                    </div>
                    <Badge tone={eventTypeTone(e.type)}>{e.type}</Badge>
                  </div>
                ))}
                {upcomingEvents.length === 0 && <div className="px-4 py-6 text-center text-[13px] text-muted">Nothing scheduled.</div>}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "docket" && (
        <Card>
          <div className="divide-y divide-line-soft">
            {caseDockets.map((d) => (
              <div key={d.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Badge tone={docketTypeTone(d.type)}>{docketTypeLabel(d.type)}</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-[13.5px] font-semibold text-ink">{d.title}</div>
                      <div className="shrink-0 text-[11.5px] text-muted">{formatShortDate(d.filedDate)}</div>
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-muted">Entry No. {d.entryNo}</div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate">{d.text}</p>
                    {d.fileIds.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {d.fileIds.map((fid) => {
                          const f = fileMap.get(fid);
                          if (!f) return null;
                          return (
                            <button
                              key={fid}
                              onClick={() => setPreview(f)}
                              className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-hover"
                            >
                              <FileText className="h-3.5 w-3.5 text-brand-red" />
                              <span className="max-w-[240px] truncate">{f.name}</span>
                              <Eye className="h-3.5 w-3.5 text-muted" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {caseDockets.length === 0 && <EmptyState icon={Activity} title="No docket entries" />}
          </div>
        </Card>
      )}

      {tab === "documents" && (
        <Card>
          {caseFiles.length === 0 ? (
            <EmptyState icon={FileText} title="No documents filed" />
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              {caseFiles.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPreview(f)}
                  className="flex items-center gap-3 rounded-xl border border-line p-3 text-left transition-colors hover:border-[#cdd3df] hover:bg-hover"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-red-soft text-brand-red">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">{f.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                      <Badge tone={fileTagTone(f.tag)}>{f.tag}</Badge>
                      <span>{f.sizeLabel}</span>
                    </div>
                  </div>
                  <Eye className="h-4 w-4 shrink-0 text-muted" />
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "deadlines" && (
        <Card>
          <CardHeader
            title="Rules-driven deadlines"
            icon={AlarmClock}
            action={<Button size="sm" onClick={() => setDeadlineOpen(true)}><Plus className="h-3.5 w-3.5" />Track</Button>}
          />
          <div className="divide-y divide-line-soft">
            {caseDeadlines.map((d) => (
              <div key={d.id} className="flex items-start gap-3 px-4 py-3.5">
                <span className={cx("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", d.status === "past" ? "bg-neutral-soft text-slate" : "bg-brand-amber-soft text-brand-amber")}>
                  <AlarmClock className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-ink">{d.label}</div>
                  <div className="mt-0.5 text-[11.5px] text-muted">
                    {d.rule?.citation} — {d.rule?.triggerEvent} on {formatShortDate(d.triggerDate)}
                  </div>
                  <div className="mt-1 text-[11.5px] text-slate">
                    Computed: <span className="font-semibold text-ink">{formatFullDate(d.computedDate)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge tone={d.status === "past" ? "gray" : d.urgency.tone}>{d.status === "past" ? "Filed" : d.urgency.label}</Badge>
                  {d.calendarEventId && <span className="text-[10.5px] font-semibold text-brand-green">On calendar</span>}
                </div>
              </div>
            ))}
            {caseDeadlines.length === 0 && <EmptyState icon={AlarmClock} title="No deadlines tracked" action={<Button size="sm" variant="primary" onClick={() => setDeadlineOpen(true)}>Track a deadline</Button>} />}
          </div>
        </Card>
      )}

      {tab === "calendar" && (
        <Card>
          <CardHeader
            title="Scheduled events"
            icon={CalendarDays}
            action={<Button size="sm" onClick={() => setEventOpen(true)}><Plus className="h-3.5 w-3.5" />New</Button>}
          />
          <div className="divide-y divide-line-soft">
            {caseEvents.map((e) => (
              <div key={e.id} className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-12 shrink-0 text-center">
                  <div className="text-[10px] font-bold uppercase text-muted">{formatShortDate(e.date).split(" ")[0]}</div>
                  <div className="text-[18px] font-bold leading-none text-ink">{formatShortDate(e.date).split(" ")[1]}</div>
                </div>
                <Divider className="h-auto w-px self-stretch" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-ink">{e.title}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted">
                    <Clock className="h-3 w-3" />
                    {formatTime(e.time)} · {e.attendeeUserIds.length} attendees
                  </div>
                  {e.note && <p className="mt-1 line-clamp-2 text-[12px] text-slate">{e.note}</p>}
                </div>
                <Badge tone={eventTypeTone(e.type)}>{e.type}</Badge>
              </div>
            ))}
            {caseEvents.length === 0 && <EmptyState icon={CalendarDays} title="Nothing scheduled" action={<Button size="sm" variant="primary" onClick={() => setEventOpen(true)}>New event</Button>} />}
          </div>
        </Card>
      )}

      {tab === "team" && (
        <Card>
          <CardHeader
            title="Case team"
            icon={Users}
            action={<Link to="/assignments" className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-blue hover:underline">Manage <ChevronRight className="h-3.5 w-3.5" /></Link>}
          />
          <div className="divide-y divide-line-soft">
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={m.name} tone={userRoleTone(m.role)} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-ink">{m.name}</div>
                  <div className="text-[11.5px] text-muted">{m.email}</div>
                </div>
                <div className="text-right">
                  <Badge tone={userRoleTone(m.role)}>{m.role}</Badge>
                  <div className="mt-1 text-[11px] text-slate">{m.teamRole}</div>
                </div>
              </div>
            ))}
            {team.length === 0 && <EmptyState icon={Users} title="No one assigned" />}
          </div>
        </Card>
      )}

      {tab === "activity" && <ActivityTimeline caseId={kase.id} />}

      <EventComposer open={eventOpen} onClose={() => setEventOpen(false)} defaultCaseId={kase.id} />
      <DeadlineTriggerDialog open={deadlineOpen} onClose={() => setDeadlineOpen(false)} />
      <PdfPreviewModal file={preview} onClose={() => setPreview(null)} />
    </>
  );
}

function Meta({ icon: Icon, label, children }: { icon: typeof FileText; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-neutral-soft text-slate">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted">{label}</div>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function ActivityTimeline({ caseId }: { caseId: string }) {
  const { dockets, events, deadlines, cases } = useApp();
  const caseMap = useMemo(() => indexBy(cases), [cases]);

  const rows = useMemo(() => {
    type Row = { id: string; date: string; tone: Tone; label: string; sub: string; kind: string };
    const out: Row[] = [];
    for (const d of dockets.filter((x) => x.caseId === caseId)) {
      out.push({ id: `dk-${d.id}`, date: d.filedDate, tone: docketTypeTone(d.type), label: d.title, sub: `Docket entry No. ${d.entryNo}`, kind: docketTypeLabel(d.type) });
    }
    for (const e of events.filter((x) => x.caseId === caseId)) {
      out.push({ id: `ev-${e.id}`, date: e.date, tone: eventTypeTone(e.type), label: e.title, sub: `${e.type} · ${formatTime(e.time)}`, kind: "Event" });
    }
    for (const d of deadlines.filter((x) => x.caseId === caseId)) {
      const en = enrichDeadline(d, caseMap, TODAY_ISO);
      out.push({ id: `td-${d.id}`, date: d.computedDate, tone: en.urgency.tone, label: d.label, sub: `${en.rule?.citation ?? "Deadline"}`, kind: "Deadline" });
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [caseId, dockets, events, deadlines, caseMap]);

  return (
    <Card>
      <CardHeader title="Full activity timeline" icon={Activity} sub="Docket filings, deadlines, and calendar events, most recent first" />
      <div className="p-4">
        <div className="relative ml-1 border-l border-line pl-5">
          {rows.map((r) => (
            <div key={r.id} className="relative pb-5 last:pb-0">
              <span className={cx("absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white", toneDot(r.tone))} />
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[13px] font-semibold text-ink">{r.label}</div>
                <div className="shrink-0 text-[11px] text-muted">{formatShortDate(r.date)}</div>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge tone={r.tone}>{r.kind}</Badge>
                <span className="text-[11.5px] text-muted">{r.sub}</span>
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="py-6 text-center text-[13px] text-muted">No activity.</div>}
        </div>
      </div>
    </Card>
  );
}
