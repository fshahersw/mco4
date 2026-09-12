import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, FileText, CheckCheck } from "lucide-react";
import { useApp, TODAY_ISO } from "../context/AppContext";
import { indexBy, buildNotifications } from "../lib/selectors";
import { cx, formatShortDate, toneClasses, type Tone } from "../lib/utils";

const KIND_ICON: Record<string, typeof Clock> = {
  overdue: AlertTriangle,
  deadline: Clock,
  docket: FileText,
};

export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { cases, deadlines, dockets, scopedCaseIds } = useApp();
  const navigate = useNavigate();

  const items = useMemo(() => {
    const caseMap = indexBy(cases);
    return buildNotifications(deadlines, dockets, caseMap, scopedCaseIds, TODAY_ISO).slice(0, 12);
  }, [cases, deadlines, dockets, scopedCaseIds]);

  const go = (to: string) => {
    navigate(to);
    onClose();
  };

  return (
    <div className="absolute right-0 top-11 z-50 w-[360px] animate-slide-down overflow-hidden rounded-xl border border-line bg-white text-ink shadow-pop">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="text-[13px] font-bold">Notifications</div>
        <div className="text-[11px] text-muted">Docket & deadline activity</div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-brand-green-soft text-brand-green">
              <CheckCheck className="h-5 w-5" />
            </span>
            <div className="text-[13px] font-semibold">You're all caught up</div>
            <div className="mt-0.5 text-[11.5px] text-muted">No deadlines due soon or new filings.</div>
          </div>
        ) : (
          items.map((n) => {
            const Icon = KIND_ICON[n.kind];
            return (
              <button
                key={n.id}
                onClick={() => go(n.to)}
                className="flex w-full items-start gap-3 border-b border-line-soft px-4 py-3 text-left transition-colors last:border-0 hover:bg-hover"
              >
                <span className={cx("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg", toneClasses(n.tone as Tone))}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold text-ink">{n.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                    <span className="truncate">{n.caseShort}</span>
                    <span>·</span>
                    <span className="shrink-0">{formatShortDate(n.dateIso)}</span>
                  </span>
                </span>
                <span
                  className={cx(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    n.kind === "docket" ? "bg-neutral-soft text-slate" : toneClasses(n.tone as Tone),
                  )}
                >
                  {n.meta}
                </span>
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={() => go("/deadlines")}
        className="w-full border-t border-line px-4 py-2.5 text-center text-[12px] font-semibold text-brand-blue transition-colors hover:bg-hover"
      >
        View all deadlines
      </button>
    </div>
  );
}
