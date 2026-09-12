import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Briefcase,
  Newspaper,
  FileText,
  CalendarDays,
  AlarmClock,
  Users,
  BarChart3,
  Scale,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { UserRole } from "../../shared/types";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  desc: string;
  /** if set, only these roles see the item */
  roles?: UserRole[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, desc: "Your docket command center" }],
  },
  {
    label: "Docket",
    items: [
      { to: "/cases", label: "Cases & Matters", icon: Briefcase, desc: "Every tracked matter" },
      { to: "/docket", label: "Docket Activity", icon: Newspaper, desc: "Cross-matter filings feed" },
      { to: "/documents", label: "Documents", icon: FileText, desc: "Filed document library" },
    ],
  },
  {
    label: "Scheduling",
    items: [
      { to: "/calendar", label: "Calendar", icon: CalendarDays, desc: "Hearings, conferences & deadlines" },
      { to: "/deadlines", label: "Deadlines", icon: AlarmClock, desc: "Rules-driven deadline tracking" },
    ],
  },
  {
    label: "Team",
    items: [{ to: "/assignments", label: "Assignments & Team", icon: Users, desc: "Case teams and firm roster" }],
  },
  {
    label: "Insights",
    items: [
      {
        to: "/analytics",
        label: "Analytics",
        icon: BarChart3,
        desc: "Docket volume & workload metrics",
        roles: ["Admin", "Managing Clerk"],
      },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/rules", label: "Rules Library", icon: Scale, desc: "Jurisdiction deadline & format rules" },
      { to: "/settings", label: "Settings", icon: Settings, desc: "Reminders, alerts & integrations" },
      { to: "/admin", label: "Admin", icon: ShieldCheck, desc: "System health & user management", roles: ["Admin"] },
    ],
  },
];

export function visibleGroups(role: UserRole): NavGroup[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.roles || i.roles.includes(role)),
  })).filter((g) => g.items.length > 0);
}

export const ALL_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
