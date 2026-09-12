import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Newspaper,
  FileText,
  Users as UsersIcon,
  ShieldCheck,
  ShieldAlert,
  Server,
  Database,
  Scale,
  Cpu,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
  ProgressBar,
} from "../components/ui/primitives";
import { useApp, TODAY_ISO } from "../context/AppContext";
import { cx, formatShortDate, formatFullDate, userRoleTone, toneDot } from "../lib/utils";
import type { JurisdictionType } from "../../shared/types";

interface Health {
  ok: boolean;
  docketbirdConfigured: boolean;
  courtlistenerConfigured: boolean;
  bedrockRegion: string;
  bedrockModelId: string;
}

export default function AdminPage() {
  const { role, cases, dockets, files, rules, users, assignments, events, deadlines } = useApp();
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch((e: Error) => setHealthError(e.message));
  }, []);

  const coverage = useMemo(() => {
    const order: JurisdictionType[] = ["federal", "state", "jpml"];
    const max = Math.max(1, ...order.map((t) => rules.filter((r) => r.jurisdictionType === t).length));
    return order.map((t) => ({
      type: t,
      count: rules.filter((r) => r.jurisdictionType === t).length,
      max,
    }));
  }, [rules]);

  if (role !== "Admin") {
    return (
      <Card>
        <EmptyState icon={ShieldAlert} title="Administrator access only">
          Switch to the Admin role in the top bar to view system health and configuration.
        </EmptyState>
      </Card>
    );
  }

  const apiUp = healthError ? false : health?.ok ?? null;

  return (
    <>
      <PageHeader
        title="Admin"
        sub="System health, environment, and data coverage for this prototype"
        actions={
          apiUp === null ? (
            <Badge tone="gray">Checking…</Badge>
          ) : apiUp ? (
            <Badge tone="green" dot>All systems nominal</Badge>
          ) : (
            <Badge tone="red" dot>API unreachable</Badge>
          )
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Matters" value={cases.length} icon={Briefcase} tone="blue" hint="Tracked in system" />
        <StatCard label="Docket entries" value={dockets.length} icon={Newspaper} tone="teal" hint="Across all matters" />
        <StatCard label="Documents" value={files.length} icon={FileText} tone="brass" hint="Indexed files" />
        <StatCard label="Team members" value={users.length} icon={UsersIcon} tone="green" hint="On the roster" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="System health" icon={Server} sub="Integrations and inference backend" />
          <div className="divide-y divide-line-soft">
            <HealthRow
              mono="API"
              tone="blue"
              name="Mock API server"
              desc="In-memory Express service"
              status={apiUp === null ? { tone: "gray", label: "Checking…" } : apiUp ? { tone: "green", label: "Online" } : { tone: "red", label: "Offline" }}
            />
            <HealthRow
              mono="DB"
              tone="teal"
              name="DocketBird"
              desc="PACER-backed federal docket monitoring"
              status={health?.docketbirdConfigured ? { tone: "green", label: "Key set" } : { tone: "amber", label: "Not set" }}
              note="Mock data in use"
            />
            <HealthRow
              mono="CL"
              tone="green"
              name="CourtListener"
              desc="RECAP / opinion & docket lookup API"
              status={health?.courtlistenerConfigured ? { tone: "green", label: "Key set" } : { tone: "amber", label: "Not set" }}
              note="Mock data in use"
            />
            <HealthRow
              mono="AI"
              tone="brass"
              name="Amazon Bedrock — draft assist"
              desc={health ? `${health.bedrockModelId} · ${health.bedrockRegion}` : "Loading…"}
              status={{ tone: "blue", label: "SSO creds" }}
              note="No static keys"
            />
          </div>
          {healthError && <p className="border-t border-line-soft px-4 py-3 text-xs text-brand-red">Could not reach the API server: {healthError}</p>}
        </Card>

        <Card>
          <CardHeader title="Environment" icon={Cpu} />
          <div className="space-y-0 p-4">
            <EnvRow label="Data classification" value="Synthetic / demo" />
            <EnvRow label="Region" value={health?.bedrockRegion ?? "us-east-1"} />
            <EnvRow label="Inference model" value={health?.bedrockModelId ?? "—"} />
            <EnvRow label="Credentials" value="IAM Identity Center (SSO)" />
            <EnvRow label="PHI in system" value="None" />
            <EnvRow label="Session date" value={formatShortDate(TODAY_ISO)} />
          </div>
        </Card>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Data inventory" icon={Database} sub="Record counts loaded into this session" />
          <div className="grid grid-cols-2 gap-px bg-line-soft sm:grid-cols-4">
            {[
              { label: "Matters", n: cases.length },
              { label: "Dockets", n: dockets.length },
              { label: "Files", n: files.length },
              { label: "Rules", n: rules.length },
              { label: "Users", n: users.length },
              { label: "Assignments", n: assignments.length },
              { label: "Events", n: events.length },
              { label: "Deadlines", n: deadlines.length },
            ].map((x) => (
              <div key={x.label} className="bg-white p-4">
                <div className="text-[22px] font-bold leading-none text-ink">{x.n}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{x.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Rules coverage" icon={Scale} />
          <div className="space-y-3 p-4">
            {coverage.map((c) => (
              <div key={c.type}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="capitalize text-slate">{c.type}</span>
                  <span className="font-semibold text-ink">{c.count}</span>
                </div>
                <ProgressBar value={(c.count / c.max) * 100} tone={c.type === "federal" ? "blue" : c.type === "state" ? "green" : "brass"} />
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-line-soft pt-3 text-[12px]">
              <span className="text-muted">Deadline / format split</span>
              <span className="font-semibold text-ink">
                {rules.filter((r) => r.days > 0).length} / {rules.filter((r) => r.days === 0).length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Team roster" icon={UsersIcon} sub={`${users.length} members`} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-line-soft text-[10.5px] font-bold uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5">Member</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Matters</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Added</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const load = assignments.filter((a) => a.userId === u.id).length;
                return (
                  <tr key={u.id} className="border-b border-line-soft transition-colors last:border-0 hover:bg-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} tone={userRoleTone(u.role)} size="sm" />
                        <div>
                          <div className="text-[13px] font-semibold text-ink">{u.name}</div>
                          <div className="text-[11px] text-muted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge tone={userRoleTone(u.role)}>{u.role}</Badge></td>
                    <td className="px-4 py-3 text-[12.5px] text-slate">{u.title ?? "—"}</td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-ink">{load}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-slate">
                        <span className={cx("h-1.5 w-1.5 rounded-full", toneDot(u.status === "active" ? "green" : "amber"))} />
                        {u.status === "active" ? "Active" : "Invited"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted">{formatShortDate(u.createdDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-muted">
        <ShieldCheck className="h-3.5 w-3.5" />
        Synthetic data only · session dated {formatFullDate(TODAY_ISO)} · no PHI present or logged
      </p>
    </>
  );
}

function HealthRow({
  mono,
  tone,
  name,
  desc,
  status,
  note,
}: {
  mono: string;
  tone: "blue" | "teal" | "green" | "brass";
  name: string;
  desc: string;
  status: { tone: Parameters<typeof Badge>[0]["tone"]; label: string };
  note?: string;
}) {
  const bg = { blue: "bg-brand-blue", teal: "bg-brand-teal", green: "bg-brand-green", brass: "bg-brass" }[tone];
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white", bg)}>
        {mono}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-ink">{name}</div>
        <div className="truncate text-[11.5px] text-muted">{desc}</div>
      </div>
      {note && <span className="hidden text-[11px] text-muted sm:inline">{note}</span>}
      <Badge tone={status.tone}>{status.label}</Badge>
    </div>
  );
}

function EnvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line-soft py-2.5 last:border-0">
      <span className="text-[12px] text-muted">{label}</span>
      <span className="max-w-[60%] truncate text-[12px] font-semibold text-ink" title={value}>{value}</span>
    </div>
  );
}
