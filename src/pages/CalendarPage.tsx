import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Clock, Users, Bell, FileText } from "lucide-react";
import { useApp, TODAY_ISO } from "../context/AppContext";
import {
  Badge,
  Button,
  Card,
  Chip,
  PageHeader,
  Segmented,
  Drawer,
  EmptyState,
  Avatar,
} from "../components/ui/primitives";
import EventComposer from "../components/EventComposer";
import {
  cx,
  buildMonthGrid,
  formatMonthYear,
  weekdayLabel,
  dayOfMonth,
  formatFullDate,
  formatTime,
  formatWeekdayDate,
  relativeDayLabel,
  eventTypeTone,
  toneDot,
  userRoleTone,
  reminderLabel,
} from "../lib/utils";
import { indexBy, scopeRows } from "../lib/selectors";
import { parseIsoDate } from "../lib/utils";
import type { CalendarEventRecord, EventType } from "../../shared/types";

const EVENT_TYPES: EventType[] = ["Filing deadline", "Hearing", "Case management conf.", "Internal review", "Reminder"];

export default function CalendarPage() {
  const { cases, events, users, dockets, scopedCaseIds } = useApp();
  const today = parseIsoDate(TODAY_ISO);
  const [view, setView] = useState<"month" | "agenda">("month");
  const [year, setYear] = useState(today.getUTCFullYear());
  const [month, setMonth] = useState(today.getUTCMonth());
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(new Set());
  const [selected, setSelected] = useState<CalendarEventRecord | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const caseMap = useMemo(() => indexBy(cases), [cases]);
  const userMap = useMemo(() => indexBy(users), [users]);
  const docketMap = useMemo(() => indexBy(dockets), [dockets]);

  const visibleEvents = useMemo(() => {
    const scoped = scopeRows(events, scopedCaseIds);
    return activeTypes.size === 0 ? scoped : scoped.filter((e) => activeTypes.has(e.type));
  }, [events, scopedCaseIds, activeTypes]);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, CalendarEventRecord[]>();
    for (const e of visibleEvents) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.time.localeCompare(b.time));
    return m;
  }, [visibleEvents]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const agenda = useMemo(() => {
    const upcoming = [...visibleEvents]
      .filter((e) => e.date >= TODAY_ISO)
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date < b.date ? -1 : 1));
    const m = new Map<string, CalendarEventRecord[]>();
    for (const e of upcoming) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return [...m.entries()];
  }, [visibleEvents]);

  const shift = (delta: number) => {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  };

  const toggleType = (t: EventType) =>
    setActiveTypes((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  const selectedCase = selected ? caseMap.get(selected.caseId) : undefined;
  const linkedDocket = selected?.linkedDocketId ? docketMap.get(selected.linkedDocketId) : undefined;

  return (
    <>
      <PageHeader
        title="Calendar"
        sub="Hearings, conferences, filing deadlines, and reminders"
        actions={
          <Button variant="primary" onClick={() => setComposerOpen(true)}>
            <Plus className="h-4 w-4" />
            New event
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented
          options={[{ value: "month", label: "Month" }, { value: "agenda", label: "Agenda" }]}
          value={view}
          onChange={(v) => setView(v as "month" | "agenda")}
        />
        {view === "month" && (
          <div className="flex items-center gap-1">
            <button onClick={() => shift(-1)} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-slate transition-colors hover:bg-hover">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[150px] text-center text-[14px] font-bold text-ink">{formatMonthYear(year, month)}</div>
            <button onClick={() => shift(1)} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-slate transition-colors hover:bg-hover">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setYear(today.getUTCFullYear()); setMonth(today.getUTCMonth()); }}
              className="ml-1 rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-slate transition-colors hover:bg-hover"
            >
              Today
            </button>
          </div>
        )}
        <div className="ml-auto flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((t) => (
            <Chip key={t} active={activeTypes.has(t)} onClick={() => toggleType(t)}>
              <span className={cx("mr-1 inline-block h-1.5 w-1.5 rounded-full", toneDot(eventTypeTone(t)))} />
              {t}
            </Chip>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line-soft bg-canvas">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-wide text-muted">
                {weekdayLabel(i)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.flat().map((iso, idx) => {
              const inMonth = parseIsoDate(iso).getUTCMonth() === month;
              const isToday = iso === TODAY_ISO;
              const dayEvents = eventsByDate.get(iso) ?? [];
              return (
                <div
                  key={iso}
                  className={cx(
                    "min-h-[104px] border-b border-r border-line-soft p-1.5 last:border-r-0",
                    idx % 7 === 6 && "border-r-0",
                    !inMonth && "bg-canvas/60",
                  )}
                >
                  <div className="mb-1 flex justify-end">
                    <span
                      className={cx(
                        "grid h-6 w-6 place-items-center rounded-full text-[11.5px] font-semibold",
                        isToday ? "bg-ink text-white" : inMonth ? "text-slate" : "text-muted",
                      )}
                    >
                      {dayOfMonth(iso)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setSelected(e)}
                        className="flex w-full items-center gap-1.5 rounded-md bg-neutral-soft px-1.5 py-1 text-left transition-colors hover:bg-line-soft"
                      >
                        <span className={cx("h-1.5 w-1.5 shrink-0 rounded-full", toneDot(eventTypeTone(e.type)))} />
                        <span className="truncate text-[10.5px] font-medium text-ink">{e.title}</span>
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="px-1.5 text-[10px] font-semibold text-muted">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {agenda.length === 0 ? (
            <Card><EmptyState icon={CalendarDays} title="No upcoming events" /></Card>
          ) : (
            agenda.map(([date, dayEvents]) => (
              <div key={date}>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-[13px] font-bold text-ink">{formatWeekdayDate(date)}</h2>
                  <span className="text-[11.5px] text-muted">{relativeDayLabel(date, TODAY_ISO)}</span>
                </div>
                <Card>
                  <div className="divide-y divide-line-soft">
                    {dayEvents.map((e) => (
                      <button key={e.id} onClick={() => setSelected(e)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover">
                        <div className="w-16 shrink-0 text-[12px] font-semibold text-slate">{formatTime(e.time)}</div>
                        <span className={cx("h-2 w-2 shrink-0 rounded-full", toneDot(eventTypeTone(e.type)))} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-semibold text-ink">{e.title}</div>
                          <div className="text-[11.5px] text-muted">{caseMap.get(e.caseId)?.shortName}</div>
                        </div>
                        <Badge tone={eventTypeTone(e.type)}>{e.type}</Badge>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            ))
          )}
        </div>
      )}

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        sub={selected ? `${selectedCase?.shortName} · ${selectedCase?.jurisdictionLabel}` : undefined}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={eventTypeTone(selected.type)} dot>{selected.type}</Badge>
              <span className="text-[13px] text-slate">{formatFullDate(selected.date)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoTile icon={Clock} label="Time" value={formatTime(selected.time)} />
              <InfoTile icon={CalendarDays} label="When" value={relativeDayLabel(selected.date, TODAY_ISO)} />
            </div>

            {selected.note && (
              <div>
                <SectionTitle>Note</SectionTitle>
                <p className="rounded-lg border border-line bg-canvas p-3 text-[13px] leading-relaxed text-slate">{selected.note}</p>
              </div>
            )}

            <div>
              <SectionTitle><Users className="mr-1 inline h-3.5 w-3.5" />Attendees ({selected.attendeeUserIds.length})</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {selected.attendeeUserIds.map((uid) => {
                  const u = userMap.get(uid);
                  if (!u) return null;
                  return (
                    <div key={uid} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5">
                      <Avatar name={u.name} tone={userRoleTone(u.role)} size="xs" />
                      <span className="text-[12px] font-medium text-ink">{u.name}</span>
                    </div>
                  );
                })}
                {selected.attendeeUserIds.length === 0 && <span className="text-[13px] text-muted">No attendees.</span>}
              </div>
            </div>

            <div>
              <SectionTitle><Bell className="mr-1 inline h-3.5 w-3.5" />Reminders</SectionTitle>
              <div className="space-y-1.5">
                {selected.reminders.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-[13px] text-slate">
                    <span className="h-1.5 w-1.5 rounded-full bg-brass" />
                    {reminderLabel(r)}
                  </div>
                ))}
                {selected.reminders.length === 0 && <span className="text-[13px] text-muted">No reminders set.</span>}
              </div>
            </div>

            {linkedDocket && (
              <div>
                <SectionTitle><FileText className="mr-1 inline h-3.5 w-3.5" />Linked docket entry</SectionTitle>
                <Link to={`/cases/${selected.caseId}`} className="block rounded-lg border border-line p-3 transition-colors hover:bg-hover">
                  <div className="text-[13px] font-semibold text-ink">{linkedDocket.title}</div>
                  <div className="text-[11.5px] text-muted">No. {linkedDocket.entryNo}</div>
                </Link>
              </div>
            )}

            <Link to={`/cases/${selected.caseId}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-blue hover:underline">
              Open matter <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </Drawer>

      <EventComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
    </>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-[13.5px] font-semibold text-ink">{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate">{children}</div>;
}
