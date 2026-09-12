import { useEffect, useMemo, useState } from "react";
import { Button, Field, inputClass, Modal } from "./ui/primitives";
import { useApp } from "../context/AppContext";
import { deadlineRulesForJurisdiction } from "../../shared/rules/jurisdictions";
import { computeDeadlineDate } from "../../shared/rules/engine";

export default function DeadlineTriggerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cases, addDeadline } = useApp();
  const [caseId, setCaseId] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [triggerDate, setTriggerDate] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCase = cases.find((c) => c.id === caseId);
  const applicableRules = useMemo(
    () => (selectedCase ? deadlineRulesForJurisdiction(selectedCase.jurisdictionType) : []),
    [selectedCase],
  );
  const selectedRule = applicableRules.find((r) => r.id === ruleId);
  const computedDate = selectedRule && triggerDate ? computeDeadlineDate(triggerDate, selectedRule) : null;

  useEffect(() => {
    setRuleId("");
  }, [caseId]);

  const close = () => {
    setCaseId("");
    setRuleId("");
    setTriggerDate("");
    setLabel("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!caseId || !ruleId || !triggerDate || !label.trim()) {
      setError("Case, rule, trigger date, and label are all required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addDeadline({ caseId, ruleId, triggerDate, label: label.trim() });
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Trigger a deadline">
      <Field label="Case">
        <select className={inputClass} value={caseId} onChange={(e) => setCaseId(e.target.value)}>
          <option value="">Select a case…</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.shortName} — {c.jurisdictionLabel}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Jurisdiction rule" hint={!selectedCase ? "Pick a case first." : undefined}>
        <select className={inputClass} value={ruleId} onChange={(e) => setRuleId(e.target.value)} disabled={!selectedCase}>
          <option value="">Select a rule…</option>
          {applicableRules.map((r) => (
            <option key={r.id} value={r.id}>
              {r.citation} — {r.description.slice(0, 60)}…
            </option>
          ))}
        </select>
      </Field>
      <Field label="Trigger event date" hint={selectedRule ? `Trigger: ${selectedRule.triggerEvent}` : undefined}>
        <input type="date" className={inputClass} value={triggerDate} onChange={(e) => setTriggerDate(e.target.value)} />
      </Field>
      <Field label="Label">
        <input
          className={inputClass}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Answer due — Doe v. Acme Aviation"
        />
      </Field>

      {computedDate && (
        <div className="mb-3.5 rounded-lg border border-brand-blue-soft bg-brand-blue-soft px-3 py-2.5 text-[13px] text-ink">
          Computed deadline: <b>{computedDate}</b> ({selectedRule?.days} {selectedRule?.dayType} days
          {selectedRule?.rollForward ? ", rolled forward off weekends/holidays" : ""})
        </div>
      )}
      {error && <p className="mb-3 text-xs font-medium text-brand-red">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button onClick={close}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={saving}>
          {saving ? "Saving…" : "Track deadline"}
        </Button>
      </div>
    </Modal>
  );
}
