import { useState } from "react";
import {
  User,
  Bell,
  AlarmClock,
  Monitor,
  Plug,
  ShieldCheck,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  PageHeader,
  Segmented,
  Toggle,
  inputClass,
  selectClass,
} from "../components/ui/primitives";
import { cx, userRoleTone } from "../lib/utils";

type Section = "profile" | "reminders" | "notifications" | "display" | "integrations" | "compliance";

const SECTIONS: { value: Section; label: string; icon: LucideIcon }[] = [
  { value: "profile", label: "Profile", icon: User },
  { value: "reminders", label: "Reminder defaults", icon: AlarmClock },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "display", label: "Display", icon: Monitor },
  { value: "integrations", label: "Integrations", icon: Plug },
  { value: "compliance", label: "Data & compliance", icon: ShieldCheck },
];

const INTEGRATIONS = [
  { key: "litify", name: "Litify / Salesforce", desc: "Matter and party records, case metadata", connected: true },
  { key: "docrio", name: "Docrio", desc: "Document storage and versioning", connected: true },
  { key: "pacer", name: "PACER / CM-ECF", desc: "Federal docket monitoring and filing", connected: false },
  { key: "outlook", name: "Outlook Calendar", desc: "Two-way sync for hearings and deadlines", connected: false },
  { key: "bedrock", name: "Amazon Bedrock", desc: "AI drafting of deadline notices and summaries", connected: true },
];

export default function SettingsPage() {
  const { currentUser, role } = useApp();
  const [section, setSection] = useState<Section>("profile");

  return (
    <>
      <PageHeader title="Settings" sub="Preferences are stored locally for this demo — nothing is written back to firm systems." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => {
            const active = section === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setSection(s.value)}
                className={cx(
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors",
                  active ? "bg-ink text-white" : "text-slate hover:bg-hover hover:text-ink",
                )}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {section === "profile" && (
            <Card className="p-5">
              <SectionTitle icon={User} title="Profile" sub="Your identity as reflected in this session." />
              <div className="mt-4 flex items-center gap-4">
                <Avatar name={currentUser?.name ?? "User"} tone={userRoleTone(role)} size="lg" />
                <div>
                  <div className="text-[16px] font-bold text-ink">{currentUser?.name}</div>
                  <div className="text-[13px] text-muted">{currentUser?.email}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge tone={userRoleTone(role)}>{role}</Badge>
                    {currentUser?.title && <span className="text-[12px] text-slate">{currentUser.title}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 border-t border-line-soft pt-4 sm:grid-cols-2">
                <Field label="Display name"><input className={inputClass} defaultValue={currentUser?.name} /></Field>
                <Field label="Email"><input className={inputClass} defaultValue={currentUser?.email} /></Field>
                <Field label="Title"><input className={inputClass} defaultValue={currentUser?.title ?? ""} placeholder="e.g. Managing Clerk" /></Field>
                <Field label="Phone" hint="Synthetic contact only."><input className={inputClass} placeholder="(000) 000-0000" /></Field>
              </div>
              <div className="mt-2 flex justify-end">
                <Button variant="primary">Save profile</Button>
              </div>
            </Card>
          )}

          {section === "reminders" && (
            <Card className="p-5">
              <SectionTitle icon={AlarmClock} title="Reminder defaults" sub="Applied to new deadlines and calendar events." />
              <div className="mt-4 space-y-4">
                <Field label="Default lead time">
                  <DefaultLeadTime />
                </Field>
                <Field label="Default reminder time" hint="Time of day for same-day reminders.">
                  <input type="time" className={cx(inputClass, "max-w-[160px]")} defaultValue="08:30" />
                </Field>
                <ToggleRow label="Second reminder day-of" desc="Send an additional nudge the morning a filing is due." defaultChecked />
                <ToggleRow label="Escalate overdue items" desc="Notify the managing clerk when a deadline passes unfiled." defaultChecked />
              </div>
            </Card>
          )}

          {section === "notifications" && (
            <Card className="p-5">
              <SectionTitle icon={Bell} title="Notifications" sub="Choose what surfaces in the bell and by email." />
              <div className="mt-4 divide-y divide-line-soft">
                <ToggleRow label="Overdue deadline alerts" desc="Immediate alert when a tracked deadline goes overdue." defaultChecked />
                <ToggleRow label="Deadlines due within 7 days" desc="Daily reminder for filings coming due this week." defaultChecked />
                <ToggleRow label="New docket filings" desc="Alert when a new entry is filed on your matters." defaultChecked />
                <ToggleRow label="Hearing & conference reminders" desc="Reminders ahead of scheduled appearances." defaultChecked />
                <ToggleRow label="JPML / CTO activity" desc="Conditional Transfer Orders and opposition windows." defaultChecked />
                <ToggleRow label="Daily email digest" desc="Morning summary of the day's deadlines and filings." />
                <ToggleRow label="Weekly portfolio summary" desc="Friday recap of activity across your matters." />
              </div>
            </Card>
          )}

          {section === "display" && (
            <Card className="p-5">
              <SectionTitle icon={Monitor} title="Display" sub="Tune the interface to your workflow." />
              <div className="mt-4 space-y-4">
                <Field label="Row density">
                  <Density />
                </Field>
                <Field label="Default landing page">
                  <select className={cx(selectClass, "max-w-xs")} defaultValue="/">
                    <option value="/">Dashboard</option>
                    <option value="/cases">Cases</option>
                    <option value="/deadlines">Deadlines</option>
                    <option value="/calendar">Calendar</option>
                    <option value="/docket">Docket Activity</option>
                  </select>
                </Field>
                <ToggleRow label="Show weekends in calendar" desc="Include Saturday and Sunday columns in the month view." defaultChecked />
                <ToggleRow label="Compact sidebar on launch" desc="Start with the navigation collapsed to icons." />
              </div>
            </Card>
          )}

          {section === "integrations" && (
            <Card className="p-5">
              <SectionTitle icon={Plug} title="Integrations" sub="Connections to firm systems. Read-only in this demo." />
              <div className="mt-4 space-y-2.5">
                {INTEGRATIONS.map((i) => (
                  <IntegrationRow key={i.key} name={i.name} desc={i.desc} connected={i.connected} />
                ))}
              </div>
            </Card>
          )}

          {section === "compliance" && (
            <Card className="p-5">
              <SectionTitle icon={ShieldCheck} title="Data & compliance" sub="How this environment handles data." />
              <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-slate">
                <p className="rounded-lg border border-brand-amber/30 bg-brand-amber-soft/50 p-3 text-[12.5px] text-ink">
                  This dashboard runs on synthetic data only. No real client, matter, or protected health
                  information is present, logged, or transmitted.
                </p>
                <ComplianceRow label="Data classification" value="Synthetic / demo" />
                <ComplianceRow label="PHI handling" value="None — HIPAA discipline enforced" />
                <ComplianceRow label="Inference" value="Amazon Bedrock, us-east-1 (firm account)" />
                <ComplianceRow label="Audit logging" value="Enabled — no PHI in logs" />
                <ComplianceRow label="Retention" value="Session-scoped; nothing persisted to firm systems" />
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

/* --------------------------------------------------------------- helpers */

function SectionTitle({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neutral-soft text-slate">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div>
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        <p className="text-[12px] text-muted">{sub}</p>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, defaultChecked = false }: { label: string; desc: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink">{label}</div>
        <div className="text-[12px] text-muted">{desc}</div>
      </div>
      <Toggle checked={on} onChange={setOn} />
    </div>
  );
}

function DefaultLeadTime() {
  const [days, setDays] = useState("3");
  return (
    <Segmented
      options={[
        { value: "1", label: "1 day" },
        { value: "3", label: "3 days" },
        { value: "7", label: "1 week" },
        { value: "14", label: "2 weeks" },
      ]}
      value={days}
      onChange={setDays}
    />
  );
}

function Density() {
  const [d, setD] = useState("comfortable");
  return (
    <Segmented
      options={[
        { value: "comfortable", label: "Comfortable" },
        { value: "compact", label: "Compact" },
      ]}
      value={d}
      onChange={setD}
    />
  );
}

function IntegrationRow({ name, desc, connected }: { name: string; desc: string; connected: boolean }) {
  const [on, setOn] = useState(connected);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-ink">{name}</span>
          {on ? (
            <Badge tone="green"><Check className="h-3 w-3" />Connected</Badge>
          ) : (
            <Badge tone="gray">Not connected</Badge>
          )}
        </div>
        <div className="mt-0.5 text-[12px] text-muted">{desc}</div>
      </div>
      {on ? (
        <Button size="sm" onClick={() => setOn(false)}>Disconnect</Button>
      ) : (
        <Button size="sm" variant="primary" onClick={() => setOn(true)}>Connect</Button>
      )}
    </div>
  );
}

function ComplianceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line-soft py-2 last:border-0">
      <span className="text-[12.5px] text-muted">{label}</span>
      <span className="text-[12.5px] font-semibold text-ink">{value}</span>
    </div>
  );
}
