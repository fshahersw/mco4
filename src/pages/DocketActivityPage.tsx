import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Newspaper, FileText, Eye } from "lucide-react";
import { useApp, TODAY_ISO } from "../context/AppContext";
import { Badge, Card, Chip, PageHeader, EmptyState, inputClass } from "../components/ui/primitives";
import PdfPreviewModal from "../components/PdfPreviewModal";
import {
  cx,
  docketTypeLabel,
  docketTypeTone,
  formatWeekdayDate,
  relativeDaysCompact,
} from "../lib/utils";
import { indexBy, scopeRows } from "../lib/selectors";
import { daysUntil } from "../../shared/rules/engine";
import type { DocketType, FileRecord } from "../../shared/types";

type TypeFilter = "all" | DocketType;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "order", label: "Orders" },
  { value: "motion", label: "Motions" },
  { value: "notice", label: "Notices" },
  { value: "cmo", label: "CMOs" },
  { value: "report", label: "Reports" },
  { value: "filing", label: "Filings" },
];

export default function DocketActivityPage() {
  const { cases, dockets, files, scopedCaseIds } = useApp();
  const [q, setQ] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [preview, setPreview] = useState<FileRecord | null>(null);

  const caseMap = useMemo(() => indexBy(cases), [cases]);
  const fileMap = useMemo(() => indexBy(files), [files]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return scopeRows(dockets, scopedCaseIds)
      .filter((d) => type === "all" || d.type === type)
      .filter((d) => {
        if (!needle) return true;
        const c = caseMap.get(d.caseId);
        return (
          d.title.toLowerCase().includes(needle) ||
          d.text.toLowerCase().includes(needle) ||
          (c?.shortName.toLowerCase().includes(needle) ?? false)
        );
      })
      .sort((a, b) => (a.filedDate === b.filedDate ? a.caseId.localeCompare(b.caseId) : a.filedDate < b.filedDate ? 1 : -1));
  }, [dockets, scopedCaseIds, type, q, caseMap]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof filtered>();
    for (const d of filtered) {
      const arr = m.get(d.filedDate) ?? [];
      arr.push(d);
      m.set(d.filedDate, arr);
    }
    return [...m.entries()];
  }, [filtered]);

  const counts = useMemo(() => {
    const scoped = scopeRows(dockets, scopedCaseIds);
    const m: Record<string, number> = { all: scoped.length };
    for (const d of scoped) m[d.type] = (m[d.type] ?? 0) + 1;
    return m;
  }, [dockets, scopedCaseIds]);

  return (
    <>
      <PageHeader title="Docket Activity" sub="Chronological feed of filings across every tracked matter" />

      <div className="mb-4 flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search docket titles, text, or matter…"
            className={cx(inputClass, "pl-9")}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((t) => (
            <Chip key={t.value} active={type === t.value} onClick={() => setType(t.value)} count={counts[t.value] ?? 0}>
              {t.label}
            </Chip>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <EmptyState icon={Newspaper} title="No matching filings">Adjust filters to see docket activity.</EmptyState>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([date, entries]) => {
            const age = daysUntil(date, TODAY_ISO);
            const isNew = age <= 0 && age >= -3;
            return (
              <div key={date}>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-[13px] font-bold text-ink">{formatWeekdayDate(date)}</h2>
                  <span className="text-[11.5px] text-muted">{relativeDaysCompact(date, TODAY_ISO)}</span>
                  {isNew && <Badge tone="green">New</Badge>}
                  <span className="text-[11.5px] text-muted">· {entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
                </div>
                <Card>
                  <div className="divide-y divide-line-soft">
                    {entries.map((d) => {
                      const c = caseMap.get(d.caseId);
                      return (
                        <div key={d.id} className="flex items-start gap-3 p-4">
                          <Badge tone={docketTypeTone(d.type)}>{docketTypeLabel(d.type)}</Badge>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-3">
                              <div className="text-[13.5px] font-semibold text-ink">{d.title}</div>
                              <span className="shrink-0 text-[11px] text-muted">No. {d.entryNo}</span>
                            </div>
                            <Link to={`/cases/${d.caseId}`} className="mt-0.5 inline-block text-[11.5px] font-medium text-brand-blue hover:underline">
                              {c?.shortName}
                            </Link>
                            <span className="ml-1.5 text-[11.5px] text-muted">· {c?.jurisdictionLabel}</span>
                            <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate">{d.text}</p>
                            {d.fileIds.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {d.fileIds.map((fid) => {
                                  const f = fileMap.get(fid);
                                  if (!f) return null;
                                  return (
                                    <button
                                      key={fid}
                                      onClick={() => setPreview(f)}
                                      className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink transition-colors hover:bg-hover"
                                    >
                                      <FileText className="h-3.5 w-3.5 text-brand-red" />
                                      <span className="max-w-[220px] truncate">{f.name}</span>
                                      <Eye className="h-3.5 w-3.5 text-muted" />
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <PdfPreviewModal file={preview} onClose={() => setPreview(null)} />
    </>
  );
}
