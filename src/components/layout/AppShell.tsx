import { type ReactNode, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeft,
  Search,
  Bell,
  ChevronDown,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useApp, TODAY_ISO } from "../../context/AppContext";
import { visibleGroups } from "../../lib/nav";
import { cx, initials, userRoleTone } from "../../lib/utils";
import { indexBy, buildNotifications, attentionCount } from "../../lib/selectors";
import { Avatar, Badge } from "../ui/primitives";
import CommandPalette from "../CommandPalette";
import NotificationsPanel from "../NotificationsPanel";
import type { UserRole } from "../../../shared/types";
import wordmark from "../../assets/brand/seegerweiss-wordmark.png";
import monogram from "../../assets/brand/sw-monogram.png";

const COLLAPSE_KEY = "mco.sidebar.collapsed";
const ROLE_OPTIONS: UserRole[] = ["Admin", "Managing Clerk", "Lit Paralegal", "Associate", "Partner"];

type OpenMenu = null | "role" | "notif" | "user";

export default function AppShell({ children }: { children: ReactNode }) {
  const { role, setRole, currentUser, users, cases, deadlines, dockets, scopedCaseIds } = useApp();

  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const [menu, setMenu] = useState<OpenMenu>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = useMemo(() => visibleGroups(role), [role]);
  const notifCount = useMemo(() => {
    const caseMap = indexBy(cases);
    return attentionCount(buildNotifications(deadlines, dockets, caseMap, scopedCaseIds, TODAY_ISO));
  }, [cases, deadlines, dockets, scopedCaseIds]);

  const roleSubtitle = (r: UserRole) =>
    r === "Admin" ? "System operations" : users.find((u) => u.role === r)?.name ?? "Firm member";

  const sidebarWidth = collapsed ? 68 : 256;
  const isAdmin = role === "Admin";

  return (
    <div
      className="grid h-screen bg-canvas"
      style={{ gridTemplateColumns: `${sidebarWidth}px 1fr`, gridTemplateRows: "60px 1fr", transition: "grid-template-columns 200ms ease" }}
    >
      {/* ---------------------------------------------------------- topbar */}
      <header className="col-span-2 flex items-center bg-ink text-white">
        <div
          className="flex h-full shrink-0 items-center border-r border-white/10 px-3"
          style={{ width: sidebarWidth }}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              className="grid h-10 w-full place-items-center rounded-lg transition-colors hover:bg-white/10"
            >
              <img src={monogram} alt="Seeger Weiss LLP" className="h-7 w-7 object-contain" />
            </button>
          ) : (
            <>
              <img src={wordmark} alt="Seeger Weiss LLP" className="h-7 w-auto object-contain" />
              <button
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <PanelLeftClose className="h-[18px] w-[18px]" />
              </button>
            </>
          )}
        </div>

        <div className="flex flex-1 items-center gap-3 px-5">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 max-w-md flex-1 items-center gap-2.5 rounded-lg bg-white/10 px-3 text-left text-[13px] text-white/55 transition-colors hover:bg-white/[0.14]"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">Search cases, dockets, documents…</span>
            <kbd className="hidden shrink-0 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/70 sm:block">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* viewing-as role switch */}
            <div className="relative">
              <button
                onClick={() => setMenu((m) => (m === "role" ? null : "role"))}
                className="flex items-center gap-2 rounded-lg bg-white/10 py-1.5 pl-2.5 pr-2 text-[12.5px] font-semibold transition-colors hover:bg-white/[0.14]"
              >
                <span className="hidden text-[10px] font-medium uppercase tracking-wide text-white/50 md:inline">Viewing as</span>
                <span>{role}</span>
                <ChevronDown className="h-3.5 w-3.5 text-white/60" />
              </button>
              {menu === "role" && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
                  <div className="absolute right-0 top-11 z-50 w-64 animate-slide-down overflow-hidden rounded-xl border border-line bg-white p-1.5 text-ink shadow-pop">
                    <div className="px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted">
                      Switch demo persona
                    </div>
                    {ROLE_OPTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setRole(r);
                          setMenu(null);
                        }}
                        className={cx(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-hover",
                          r === role && "bg-neutral-soft",
                        )}
                      >
                        <Avatar name={roleSubtitle(r)} tone={userRoleTone(r)} size="sm" icon={r === "Admin" ? ShieldCheck : undefined} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-semibold">{r}</span>
                          <span className="block truncate text-[11px] text-muted">{roleSubtitle(r)}</span>
                        </span>
                        {r === role && <Check className="h-4 w-4 shrink-0 text-brass" />}
                      </button>
                    ))}
                    <div className="mt-1 border-t border-line-soft px-2.5 py-2 text-[10.5px] leading-relaxed text-muted">
                      Firm-wide roles see every matter. Associates and partners see only assigned matters.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* notifications */}
            <div className="relative">
              <button
                onClick={() => setMenu((m) => (m === "notif" ? null : "notif"))}
                title="Notifications"
                className="relative grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-white/[0.14] hover:text-white"
              >
                <Bell className="h-[17px] w-[17px]" />
                {notifCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white ring-2 ring-ink">
                    {notifCount}
                  </span>
                )}
              </button>
              {menu === "notif" && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
                  <NotificationsPanel onClose={() => setMenu(null)} />
                </>
              )}
            </div>

            {/* user menu */}
            <div className="relative">
              <button
                onClick={() => setMenu((m) => (m === "user" ? null : "user"))}
                className="flex items-center gap-1.5 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-white/10"
              >
                <Avatar
                  name={currentUser?.name ?? "—"}
                  tone={isAdmin ? "brass" : "blue"}
                  size="sm"
                  icon={isAdmin ? ShieldCheck : undefined}
                />
                <ChevronDown className="h-3.5 w-3.5 text-white/60" />
              </button>
              {menu === "user" && currentUser && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
                  <div className="absolute right-0 top-11 z-50 w-64 animate-slide-down overflow-hidden rounded-xl border border-line bg-white text-ink shadow-pop">
                    <div className="flex items-center gap-3 border-b border-line-soft p-3.5">
                      <Avatar
                        name={currentUser.name}
                        tone={isAdmin ? "brass" : "blue"}
                        size="lg"
                        icon={isAdmin ? ShieldCheck : undefined}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-bold">{currentUser.name}</div>
                        <div className="truncate text-[11.5px] text-muted">{currentUser.email}</div>
                      </div>
                    </div>
                    <div className="space-y-2 p-3.5 text-[12px]">
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Role</span>
                        <Badge tone={userRoleTone(currentUser.role)}>{currentUser.role}</Badge>
                      </div>
                      {currentUser.title && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted">Title</span>
                          <span className="truncate text-right font-medium text-ink">{currentUser.title}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Visible matters</span>
                        <span className="font-medium text-ink">{scopedCaseIds ? scopedCaseIds.size : cases.length}</span>
                      </div>
                    </div>
                    <div className="border-t border-line-soft px-3.5 py-2.5 text-[10.5px] leading-relaxed text-muted">
                      Demo build — synthetic data only. Not connected to live court systems.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- sidebar */}
      <aside className="flex flex-col overflow-y-auto overflow-x-hidden border-r border-line bg-white">
        <nav className="flex-1 px-3 py-3">
          {groups.map((g, gi) => (
            <div key={g.label} className={cx(gi > 0 && (collapsed ? "mt-2 border-t border-line-soft pt-2" : "mt-4"))}>
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted">{g.label}</div>
              )}
              <div className="flex flex-col gap-0.5">
                {g.items.map((n) => {
                  const Icon = n.icon;
                  return (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      end={n.to === "/"}
                      title={collapsed ? n.label : undefined}
                      className={({ isActive }) =>
                        cx(
                          "relative flex items-center rounded-lg text-[13px] transition-colors",
                          collapsed ? "mx-auto h-10 w-10 justify-center" : "gap-3 px-3 py-2",
                          isActive
                            ? "bg-neutral-soft font-semibold text-ink"
                            : "font-medium text-slate hover:bg-hover hover:text-ink",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brass" />
                          )}
                          <Icon className={cx("h-[18px] w-[18px] shrink-0", isActive ? "text-ink" : "text-muted")} />
                          {!collapsed && <span className="truncate">{n.label}</span>}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line-soft p-3">
          {collapsed ? (
            <div className="grid h-8 w-full place-items-center" title="Demo data — not connected live">
              <span className="h-2 w-2 rounded-full bg-brand-amber" />
            </div>
          ) : (
            <div className="rounded-lg bg-canvas p-2.5 text-[11px] leading-relaxed text-muted">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-ink">
                <span className="h-2 w-2 rounded-full bg-brand-amber" />
                Demo data source
              </div>
              DocketBird &amp; CourtListener — synthetic, not connected live.
            </div>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------ main */}
      <main className="overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-7 py-6">{children}</div>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
