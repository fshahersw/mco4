import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { useApp } from "../context/AppContext";
import { ALL_ITEMS } from "../lib/nav";
import { cx, caseCategoryLabel, jurisdictionTypeTone } from "../lib/utils";
import { scopeCases } from "../lib/selectors";
import { Badge } from "./ui/primitives";

interface Result {
  key: string;
  group: "Navigate" | "Cases";
  label: string;
  sub?: string;
  to: string;
  icon?: React.ReactNode;
  badge?: string;
}

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cases, role, scopedCaseIds } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const needle = q.trim().toLowerCase();
    const pages: Result[] = ALL_ITEMS.filter((i) => !i.roles || i.roles.includes(role))
      .filter((i) => !needle || i.label.toLowerCase().includes(needle) || i.desc.toLowerCase().includes(needle))
      .map((i) => {
        const Icon = i.icon;
        return {
          key: `p-${i.to}`,
          group: "Navigate" as const,
          label: i.label,
          sub: i.desc,
          to: i.to,
          icon: <Icon className="h-4 w-4" />,
        };
      });

    const visibleCases = scopeCases(cases, scopedCaseIds);
    const matchedCases: Result[] = visibleCases
      .filter(
        (c) =>
          !needle ||
          c.name.toLowerCase().includes(needle) ||
          c.shortName.toLowerCase().includes(needle) ||
          c.docketNo.toLowerCase().includes(needle) ||
          c.court.toLowerCase().includes(needle) ||
          c.jurisdictionLabel.toLowerCase().includes(needle),
      )
      .slice(0, needle ? 8 : 6)
      .map((c) => ({
        key: `c-${c.id}`,
        group: "Cases" as const,
        label: c.shortName,
        sub: `${c.jurisdictionLabel} · ${c.docketNo}`,
        to: `/cases/${c.id}`,
        badge: caseCategoryLabel(c.category),
      }));

    return [...pages, ...matchedCases];
  }, [q, cases, role, scopedCaseIds]);

  useEffect(() => {
    if (active >= results.length) setActive(0);
  }, [results, active]);

  const go = (to: string) => {
    navigate(to);
    onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) go(r.to);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[60] flex animate-fade justify-center bg-ink/40 px-4 pt-[12vh] backdrop-blur-[1px]" onClick={onClose}>
      <div
        className="h-fit w-full max-w-xl animate-pop overflow-hidden rounded-2xl bg-white shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search cases, dockets, or jump to a page…"
            className="h-14 flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
          />
          <kbd className="rounded border border-line bg-neutral-soft px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="px-3 py-10 text-center text-sm text-muted">No matches for "{q}"</div>
          )}
          {results.map((r, i) => {
            const showHeader = r.group !== lastGroup;
            lastGroup = r.group;
            return (
              <div key={r.key}>
                {showHeader && (
                  <div className="px-2 pb-1 pt-2.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted">
                    {r.group}
                  </div>
                )}
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r.to)}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                    i === active ? "bg-neutral-soft" : "hover:bg-hover",
                  )}
                >
                  <span
                    className={cx(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      r.group === "Navigate" ? "bg-neutral-soft text-slate" : "bg-brass-soft text-brass-ink",
                    )}
                  >
                    {r.icon ?? <span className="text-[11px] font-bold">{r.label.slice(0, 2).toUpperCase()}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">{r.label}</span>
                    {r.sub && <span className="block truncate text-[11.5px] text-muted">{r.sub}</span>}
                  </span>
                  {r.badge && (
                    <Badge tone={r.group === "Cases" ? "brass" : "gray"}>{r.badge}</Badge>
                  )}
                  {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            <ArrowDown className="h-3 w-3" />
            navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" />
            open
          </span>
          <span className="ml-auto">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
