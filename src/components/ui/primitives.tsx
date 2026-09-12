import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { cx, initials, toneClasses, toneFill, type Tone } from "../../lib/utils";

/* ------------------------------------------------------------------ labels */

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("text-[11px] font-bold uppercase tracking-[0.07em] text-muted", className)}>{children}</div>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={cx("h-px w-full bg-line-soft", className)} />;
}

/* ------------------------------------------------------------------ badges */

export function Badge({
  tone,
  children,
  dot = false,
  className = "",
}: {
  tone: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide",
        toneClasses(tone),
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
        active ? "border-ink bg-ink text-white" : "border-line bg-white text-slate hover:border-[#cdd3df] hover:text-ink",
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cx("rounded-full px-1.5 text-[10px]", active ? "bg-white/20" : "bg-neutral-soft text-muted")}>
          {count}
        </span>
      )}
    </button>
  );
}

/* --------------------------------------------------------------- segmented */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-lg border border-line bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
            value === o.value ? "bg-ink text-white" : "text-slate hover:bg-hover hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- buttons */

type ButtonVariant = "default" | "primary" | "brass" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export function Button({
  variant = "default",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes: Record<ButtonSize, string> = {
    sm: "px-2.5 py-1.5 text-[11.5px]",
    md: "px-3.5 py-2 text-[12.5px]",
  };
  const variants: Record<ButtonVariant, string> = {
    default: "border border-line bg-white text-ink hover:bg-hover",
    primary: "border border-ink bg-ink text-white hover:bg-ink-2",
    brass: "border border-brass bg-brass text-white hover:brightness-[1.06]",
    ghost: "text-slate hover:bg-neutral-soft hover:text-ink",
    danger: "border border-brand-red/30 bg-brand-red-soft text-brand-red hover:bg-brand-red-soft/70",
  };
  return <button className={cx(base, sizes[size], variants[variant], className)} {...props} />;
}

export function IconButton({
  label,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        "grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-slate transition-colors hover:bg-hover hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- avatars */

export function Avatar({
  name,
  tone = "blue",
  size = "md",
  icon: Icon,
}: {
  name: string;
  tone?: Tone;
  size?: "xs" | "sm" | "md" | "lg";
  icon?: LucideIcon;
}) {
  const sizes = {
    xs: "h-6 w-6 text-[9px]",
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-[11px]",
    lg: "h-11 w-11 text-[13px]",
  };
  const iconSizes = { xs: "h-3 w-3", sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };
  return (
    <span
      className={cx(
        "grid shrink-0 place-items-center rounded-lg font-bold",
        sizes[size],
        toneClasses(tone),
      )}
      title={name}
    >
      {Icon ? <Icon className={iconSizes[size]} /> : initials(name)}
    </span>
  );
}

/* ------------------------------------------------------------------- cards */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-xl border border-line bg-white shadow-card", className)}>{children}</div>;
}

export function CardHeader({
  title,
  sub,
  icon: Icon,
  action,
}: {
  title: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5">
      {Icon && (
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-soft text-slate">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {sub && <p className="mt-0.5 text-[11.5px] text-muted">{sub}</p>}
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- page head */

export function PageHeader({
  title,
  sub,
  actions,
  breadcrumbs,
}: {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
}) {
  return (
    <div className="mb-5">
      {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
      <div className="flex items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight text-ink">{title}</h1>
          {sub && <p className="mt-1 text-[13px] text-slate">{sub}</p>}
        </div>
        {actions && <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- KPI stat */

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
  delta,
  hint,
  onClick,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  delta?: { value: string; dir: "up" | "down" | "flat" };
  hint?: ReactNode;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cx(
        "flex flex-col rounded-xl border border-line bg-white p-4 text-left shadow-card transition-colors",
        onClick && "hover:border-[#cdd3df]",
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <span className={cx("grid h-7 w-7 place-items-center rounded-lg", toneClasses(tone))}>
            <Icon className="h-4 w-4" />
          </span>
        )}
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-[27px] font-bold leading-none tracking-tight text-ink">{value}</span>
        {delta && (
          <span
            className={cx(
              "mb-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold",
              delta.dir === "up" && "bg-brand-green-soft text-brand-green",
              delta.dir === "down" && "bg-brand-red-soft text-brand-red",
              delta.dir === "flat" && "bg-neutral-soft text-slate",
            )}
          >
            {delta.value}
          </span>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-slate">{hint}</div>}
    </Comp>
  );
}

/* ------------------------------------------------------------- empty state */

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon?: LucideIcon;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-neutral-soft text-muted">
          <Icon className="h-5 w-5" />
        </span>
      )}
      {title && <div className="text-sm font-semibold text-ink">{title}</div>}
      {children && <div className="mt-1 max-w-sm text-[13px] text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- progress */

export function ProgressBar({ value, tone = "blue" }: { value: number; tone?: Tone }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-soft">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: toneFill(tone) }}
      />
    </div>
  );
}

/* -------------------------------------------------------------- skeletons */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-md bg-neutral-soft", className)} />;
}

/* ------------------------------------------------------------------- tabs */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            "-mb-px border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors",
            value === t.value
              ? "border-ink text-ink"
              : "border-transparent text-muted hover:text-slate",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={cx(
                "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                value === t.value ? "bg-ink text-white" : "bg-neutral-soft text-muted",
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------- form primitives */

export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cx("mb-3.5", className)}>
      <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-slate">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-[22px] w-10 shrink-0 rounded-full transition-colors disabled:opacity-40",
        checked ? "bg-brand-green" : "bg-line",
      )}
    >
      <span
        className={cx(
          "absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all",
          checked ? "left-[21px]" : "left-[3px]",
        )}
      />
    </button>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink placeholder:text-muted transition-colors focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue-soft";

export const selectClass = inputClass;
export const textareaClass = cx(inputClass, "min-h-24 leading-relaxed");

/* ------------------------------------------------------------------ modal */

export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid animate-fade place-items-center bg-ink/40 p-4 backdrop-blur-[1px]" onClick={onClose}>
      <div
        className={cx("w-full animate-pop overflow-hidden rounded-2xl bg-white shadow-pop", width)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-ink">{title}</h2>
            {sub && <p className="mt-0.5 text-[12px] text-muted">{sub}</p>}
          </div>
          <button
            onClick={onClose}
            className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-neutral-soft hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- drawer */

export function Drawer({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  width = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex animate-fade justify-end bg-ink/40 backdrop-blur-[1px]" onClick={onClose}>
      <div
        className={cx("flex h-full w-full animate-drawer flex-col bg-white shadow-pop", width)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-ink">{title}</div>
            {sub && <div className="mt-0.5 text-[12px] text-muted">{sub}</div>}
          </div>
          <button
            onClick={onClose}
            className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-neutral-soft hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
