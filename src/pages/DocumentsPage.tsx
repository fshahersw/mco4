import { useMemo, useState } from "react";
import { Search, FileText, Eye, FolderOpen } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  Badge,
  Card,
  Chip,
  PageHeader,
  StatCard,
  EmptyState,
  inputClass,
  selectClass,
} from "../components/ui/primitives";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { cx, fileTagTone, formatShortDate } from "../lib/utils";
import { indexBy, scopeRows, scopeCases } from "../lib/selectors";
import type { FileRecord, FileTag } from "../../shared/types";

type TagFilter = "all" | FileTag;

const TAG_FILTERS: { value: TagFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "order", label: "Orders" },
  { value: "motion", label: "Motions" },
  { value: "notice", label: "Notices" },
  { value: "cmo", label: "CMOs" },
  { value: "report", label: "Reports" },
  { value: "exhibit", label: "Exhibits" },
];

export default function DocumentsPage() {
  const { cases, files, scopedCaseIds } = useApp();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<TagFilter>("all");
  const [caseId, setCaseId] = useState("all");
  const [preview, setPreview] = useState<FileRecord | null>(null);

  const caseMap = useMemo(() => indexBy(cases), [cases]);
  const visibleFiles = useMemo(() => scopeRows(files, scopedCaseIds), [files, scopedCaseIds]);
  const visibleCases = useMemo(() => scopeCases(cases, scopedCaseIds), [cases, scopedCaseIds]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return visibleFiles
      .filter((f) => tag === "all" || f.tag === tag)
      .filter((f) => caseId === "all" || f.caseId === caseId)
      .filter((f) => !needle || f.name.toLowerCase().includes(needle) || (caseMap.get(f.caseId)?.shortName.toLowerCase().includes(needle) ?? false))
      .sort((a, b) => (a.addedDate < b.addedDate ? 1 : -1));
  }, [visibleFiles, tag, caseId, q, caseMap]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: visibleFiles.length };
    for (const f of visibleFiles) m[f.tag] = (m[f.tag] ?? 0) + 1;
    return m;
  }, [visibleFiles]);

  const pdfCount = visibleFiles.filter((f) => f.type === "pdf").length;
  const orderCount = visibleFiles.filter((f) => f.tag === "order" || f.tag === "cmo").length;

  return (
    <>
      <PageHeader title="Documents" sub="Filed orders, motions, notices, and reports across your matters" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Documents" value={visibleFiles.length} icon={FileText} tone="blue" />
        <StatCard label="PDFs" value={pdfCount} icon={FileText} tone="red" />
        <StatCard label="Orders & CMOs" value={orderCount} icon={FolderOpen} tone="brass" />
        <StatCard label="Matters covered" value={new Set(visibleFiles.map((f) => f.caseId)).size} icon={FolderOpen} tone="teal" />
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents…" className={cx(inputClass, "pl-9")} />
          </div>
          <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className={cx(selectClass, "sm:max-w-xs")}>
            <option value="all">All matters</option>
            {visibleCases.map((c) => (
              <option key={c.id} value={c.id}>{c.shortName}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TAG_FILTERS.map((t) => (
            <Chip key={t.value} active={tag === t.value} onClick={() => setTag(t.value)} count={counts[t.value] ?? 0}>
              {t.label}
            </Chip>
          ))}
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No documents match">Adjust your search or filters.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-line-soft text-[10.5px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5">Document</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Matter</th>
                  <th className="px-4 py-2.5">Size</th>
                  <th className="px-4 py-2.5">Added</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => setPreview(f)}
                    className="cursor-pointer border-b border-line-soft transition-colors last:border-0 hover:bg-hover"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-red-soft text-brand-red">
                          <FileText className="h-4 w-4" />
                        </span>
                        <span className="max-w-[320px] truncate text-[13px] font-semibold text-ink">{f.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge tone={fileTagTone(f.tag)}>{f.tag}</Badge></td>
                    <td className="px-4 py-3 text-[12.5px] text-slate">{caseMap.get(f.caseId)?.shortName ?? "—"}</td>
                    <td className="px-4 py-3 text-[12px] text-muted">{f.sizeLabel}</td>
                    <td className="px-4 py-3 text-[12.5px] text-slate">{formatShortDate(f.addedDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-blue">
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PdfPreviewModal file={preview} onClose={() => setPreview(null)} />
    </>
  );
}
