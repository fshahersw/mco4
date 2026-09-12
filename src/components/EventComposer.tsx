import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button, Field, inputClass, Modal, Toggle } from "./ui/primitives";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import type { EventType, ReminderRule } from "../../shared/types";

const EVENT_TYPES: EventType[] = [
  "Filing deadline",
  "Hearing",
  "Case management conf.",
  "Internal review",
  "Reminder",
];

interface Props {
  open: boolean;
  onClose: () => void;
  defaultCaseId?: string;
  defaultTitle?: string;
  defaultDate?: string;
  defaultType?: EventType;
}

export default function EventComposer({ open, onClose, defaultCaseId, defaultTitle, defaultDate, defaultType }: Props) {
  const { cases, users, assignments, addEvent } = useApp();

  const [caseId, setCaseId] = useState(defaultCaseId ?? "");
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [date, setDate] = useState(defaultDate ?? "");
  const [time, setTime] = useState("17:00");
  const [type, setType] = useState<EventType>(defaultType ?? "Filing deadline");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const [dayBefore, setDayBefore] = useState(true);
  const [hours18, setHours18] = useState(false);
  const [sameDay, setSameDay] = useState(false);
  const [sameDayTime, setSameDayTime] = useState("09:00");
  const [custom, setCustom] = useState(false);
  const [customValue, setCustomValue] = useState(2);
  const [customUnit, setCustomUnit] = useState<"minutes" | "hours" | "days">("hours");

  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCaseId(defaultCaseId ?? "");
      setTitle(defaultTitle ?? "");
      setDate(defaultDate ?? "");
      setType(defaultType ?? "Filing deadline");
      setAttendeeIds([]);
      setNote("");
      setDraftError(null);
      setSaveError(null);
    }
  }, [open, defaultCaseId, defaultTitle, defaultDate, defaultType]);

  const caseTeamIds = useMemo(
    () => new Set(assignments.filter((a) => a.caseId === caseId).map((a) => a.userId)),
    [assignments, caseId],
  );
  const caseTeam = users.filter((u) => caseTeamIds.has(u.id));
  const otherUsers = users.filter((u) => !caseTeamIds.has(u.id));
  const selectedCase = cases.find((c) => c.id === caseId);

  const toggleAttendee = (id: string) => {
    setAttendeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const buildReminders = (): ReminderRule[] => {
    const list: ReminderRule[] = [];
    if (dayBefore) list.push({ id: "r1", kind: "days_before", enabled: true, daysBefore: 1 });
    if (hours18) list.push({ id: "r2", kind: "hours_before", enabled: true, hoursBefore: 18 });
    if (sameDay) list.push({ id: "r3", kind: "same_day_time", enabled: true, time: sameDayTime });
    if (custom) list.push({ id: "r4", kind: "custom", enabled: true, customUnit, customValue });
    return list;
  };

  const runDraft = async () => {
    if (!selectedCase || !title || !date) {
      setDraftError("Pick a case, title, and date first.");
      return;
    }
    setDrafting(true);
    setDraftError(null);
    try {
      const recipientEmails = attendeeIds
        .map((id) => users.find((u) => u.id === id)?.email)
        .filter((e): e is string => Boolean(e));
      const { draft } = await api.draft({
        eventTitle: title,
        eventType: type,
        caseName: selectedCase.shortName,
        dueDate: date,
        dueTime: time,
        recipients: recipientEmails,
        notes: note || undefined,
      });
      setNote(draft);
    } catch (e) {
      setDraftError((e as Error).message);
    } finally {
      setDrafting(false);
    }
  };

  const submit = async () => {
    if (!caseId || !title || !date || !time) {
      setSaveError("Case, title, date, and time are required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await addEvent({
        caseId,
        title,
        date,
        time,
        type,
        reminders: buildReminders(),
        attendeeUserIds: attendeeIds,
        note: note || undefined,
      });
      onClose();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New calendar event" width="max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Case">
          <select className={inputClass} value={caseId} onChange={(e) => setCaseId(e.target.value)}>
            <option value="">Select a case…</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Event type">
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as EventType)}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Event title">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Daubert response due"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Time">
          <input type="time" className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>

      <Field label="Attendees">
        <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-line p-2">
          {caseTeam.length > 0 && (
            <>
              <span className="w-full text-[10px] font-bold uppercase tracking-wide text-muted">Case team</span>
              {caseTeam.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleAttendee(u.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    attendeeIds.includes(u.id)
                      ? "border-brand-blue bg-brand-blue-soft text-brand-blue"
                      : "border-line text-slate"
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </>
          )}
          {otherUsers.length > 0 && (
            <span className="w-full text-[10px] font-bold uppercase tracking-wide text-muted">Other firm members</span>
          )}
          {otherUsers.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => toggleAttendee(u.id)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                attendeeIds.includes(u.id) ? "border-brand-blue bg-brand-blue-soft text-brand-blue" : "border-line text-slate"
              }`}
            >
              {u.name}
            </button>
          ))}
        </div>
      </Field>

      <div className="mb-3.5 rounded-lg border border-line p-3">
        <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-slate">Reminder emails</div>
        <div className="flex flex-col gap-2.5">
          <label className="flex items-center justify-between gap-3">
            <span className="text-[13px]">1 day before</span>
            <Toggle checked={dayBefore} onChange={setDayBefore} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-[13px]">18 hours before</span>
            <Toggle checked={hours18} onChange={setHours18} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-[13px]">Same day, at</span>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={sameDayTime}
                onChange={(e) => setSameDayTime(e.target.value)}
                disabled={!sameDay}
                className="rounded-md border border-line px-2 py-1 text-xs disabled:opacity-40"
              />
              <Toggle checked={sameDay} onChange={setSameDay} />
            </div>
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-[13px]">Custom</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={customValue}
                disabled={!custom}
                onChange={(e) => setCustomValue(Number(e.target.value))}
                className="w-16 rounded-md border border-line px-2 py-1 text-xs disabled:opacity-40"
              />
              <select
                value={customUnit}
                disabled={!custom}
                onChange={(e) => setCustomUnit(e.target.value as "minutes" | "hours" | "days")}
                className="rounded-md border border-line px-2 py-1 text-xs disabled:opacity-40"
              >
                <option value="minutes">minutes before</option>
                <option value="hours">hours before</option>
                <option value="days">days before</option>
              </select>
              <Toggle checked={custom} onChange={setCustom} />
            </div>
          </label>
        </div>
      </div>

      <Field label="Reminder email text" hint="Optional — draft with AI or write your own. Sent with the reminder emails above.">
        <textarea
          className={`${inputClass} min-h-24`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add context for the recipients…"
        />
      </Field>
      <button
        type="button"
        onClick={runDraft}
        disabled={drafting}
        className="mb-3.5 inline-flex items-center gap-1.5 rounded-lg border border-brass/40 bg-brass-soft px-3 py-1.5 text-xs font-semibold text-brass-ink hover:bg-brass-soft/70 disabled:opacity-50"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {drafting ? "Drafting with Claude…" : "Draft with AI"}
      </button>
      {draftError && <p className="mb-3 text-xs font-medium text-brand-red">{draftError}</p>}

      {saveError && <p className="mb-3 text-xs font-medium text-brand-red">{saveError}</p>}
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={saving}>
          {saving ? "Creating…" : "Create & email event"}
        </Button>
      </div>
    </Modal>
  );
}
