import { useMemo, useState } from "react";
import { Scale, Search, Clock, FileText, Type, BookOpen } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  Badge,
  Card,
  Chip,
  PageHeader,
  StatCard,
  Segmented,
  EmptyState,
  inputClass,
} from "../components/ui/primitives";
import { cx, jurisdictionTypeLabel, jurisdictionTypeTone } from "../lib/utils";
import type { JurisdictionRule, JurisdictionType } from "../../shared/types";

type JxFilter = "all" | JurisdictionType;
type KindFilter = "all" | "deadline" | "format";

const JX_FILTERS: { value: JxFilter; label: string }[] = [
  { value: "all", label: "All courts" },
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
  { value: "jpml", label: "JPML" },
];

export default function RulesLibraryPage() {
  const { rules } = useApp();
  const [q, setQ] = useState("");
  const [jx, setJx] = useState<JxFilter>("all");
  const [kind, setKind] = useState<KindFilter>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rules
      .filter((r) => jx === "all" || r.jurisdictionType === jx)
      .filter((r) => (kind === "all" ? true : kind === "deadline" ? r.days > 0 : r.days === 0))
      .filter((r) => {
        if (!needle) return true;
        return (
          r.citation.toLowerCase().includes(needle) ||
          r.description.toLowerCase().includes(needle) ||
          r.jurisdictionLabel.toLowerCase().includes(needle) ||
          r.triggerEvent.toLowerCase().includes(needle)
        );
      });
  }, [rules, jx, kind, q]);

  const groups = useMemo(() => {
    const order: JurisdictionType[] = ["federal", "state", "jpml"];
    return order
      .map((t) => ({
        type: t,
        rules: filtered
          .filter((r) => r.jurisdictionType === t)
          .sort((a, b) => a.jurisdictionLabel.localeCompare(b.jurisdictionLabel) || a.citation.localeCompare(b.citation)),
      }))
      .filter((g) => g.rules.length > 0);
  }, [filtered]);

  const deadlineCount = rules.filter((r) => r.days > 0).length;
  const formatCount = rules.filter((r) => r.days === 0).length;
  const jurisdictions = new Set(rules.map((r) => r.jurisdictionLabel)).size;

  return (
    <>
      <PageHeader
        title="Rules Library"
        sub="Deadline computation and filing-format rules, cited to primary sources"
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Rules" value={rules.length} icon={Scale} tone="brass" hint="Researched entries" />
        <StatCard label="Deadline rules" value={deadlineCount} icon={Clock} tone="blue" hint="With a countdown" />
        <StatCard label="Format rules" value={formatCount} icon={Type} tone="teal" hint="Page / word / font limits" />
        <StatCard label="Jurisdictions" value={jurisdictions} icon={BookOpen} tone="green" hint="Courts covered" />
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search citations, rules, or triggers…" className={cx(inputClass, "pl-9")} />
          </div>
          <Segmented
            options={[
              { value: "all", label: "All" },
              { value: "deadline", label: "Deadlines" },
              { value: "format", label: "Formatting" },
            ]}
            value={kind}
            onChange={(v) => setKind(v as KindFilter)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {JX_FILTERS.map((f) => (
            <Chip key={f.value} active={jx === f.value} onClick={() => setJx(f.value)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <Card><EmptyState icon={Scale} title="No rules match">Adjust your search or filters.</EmptyState></Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.type}>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={jurisdictionTypeTone(g.type)} dot>{jurisdictionTypeLabel(g.type)}</Badge>
                <span className="text-[11.5px] text-muted">{g.rules.length} {g.rules.length === 1 ? "rule" : "rules"}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {g.rules.map((r) => (
                  <RuleCard key={r.id} rule={r} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function RuleCard({ rule }: { rule: JurisdictionRule }) {
  const isDeadline = rule.days > 0;
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-ink">{rule.citation}</div>
          <div className="mt-0.5 text-[11.5px] text-muted">{rule.jurisdictionLabel}</div>
        </div>
        {isDeadline ? (
          <Badge tone="blue">{rule.days} {rule.dayType === "court" ? "court" : "cal."} days</Badge>
        ) : (
          <Badge tone="teal">Formatting</Badge>
        )}
      </div>

      <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate">{rule.description}</p>

      {isDeadline ? (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line-soft pt-3">
          <Meta icon={Clock} label="Trigger" value={rule.triggerEvent} />
          <Meta icon={Scale} label="Count" value={`${rule.days} ${rule.dayType} days`} />
          <Meta icon={FileText} label="Roll forward" value={rule.rollForward ? "Yes — next business day" : "No"} />
        </div>
      ) : (
        rule.formatting && (
          <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 border-t border-line-soft pt-3 sm:grid-cols-2">
            {rule.formatting.pageLimit && <Meta icon={FileText} label="Page limit" value={rule.formatting.pageLimit} />}
            {rule.formatting.wordLimit && <Meta icon={FileText} label="Word limit" value={rule.formatting.wordLimit} />}
            {rule.formatting.font && <Meta icon={Type} label="Font" value={rule.formatting.font} />}
            {rule.formatting.fontSize && <Meta icon={Type} label="Size" value={rule.formatting.fontSize} />}
          </div>
        )
      )}

      {rule.source && (
        <div className="mt-3 border-t border-line-soft pt-2.5 text-[10.5px] leading-relaxed text-muted">
          <span className="font-semibold uppercase tracking-wide">Source</span> · {rule.source}
        </div>
      )}
    </Card>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-0.5 text-[12px] text-ink">{value}</div>
    </div>
  );
}
