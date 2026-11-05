export type PackId = "project_management" | "project_delivery" | "service_operations";

export const PACKS: { id: PackId; label: string; summary: string }[] = [
  {
    id: "project_management",
    label: "Project management",
    summary: "Home, companies, ideas, reports, and automations for the office book of work.",
  },
  {
    id: "project_delivery",
    label: "Project delivery",
    summary: "Projects, tasks, tickets, time, resources, retainers, and billing.",
  },
  {
    id: "service_operations",
    label: "Service operations",
    summary: "Field work: journeys, work orders, recurring service, schedule, and crew.",
  },
];

export const DEFAULT_PACKS: PackId[] = ["project_management", "project_delivery", "service_operations"];

export type NavModule = {
  href: string;
  label: string;
  pack: PackId;
  exact?: boolean;
};

export const NAV_MODULES: NavModule[] = [
  { href: "/app/home", label: "Home", pack: "project_management", exact: true },
  { href: "/app/companies", label: "Companies", pack: "project_management" },
  { href: "/app/ideas", label: "Ideas", pack: "project_management" },
  { href: "/app/reports", label: "Reports", pack: "project_management" },
  { href: "/app/automations", label: "Automations", pack: "project_management" },
  { href: "/app/projects", label: "Projects", pack: "project_delivery" },
  { href: "/app/work", label: "Work", pack: "project_delivery" },
  { href: "/app/tickets", label: "Tickets", pack: "project_delivery" },
  { href: "/app/timesheets", label: "Timesheets", pack: "project_delivery" },
  { href: "/app/resources", label: "Resources", pack: "project_delivery" },
  { href: "/app/retainers", label: "Retainers", pack: "project_delivery" },
  { href: "/app/billing", label: "Billing", pack: "project_delivery" },
  { href: "/app/work-journey", label: "Work Journey", pack: "service_operations" },
  { href: "/app/work-orders", label: "Work Orders", pack: "service_operations" },
  { href: "/app/recurring-services", label: "Recurring Services", pack: "service_operations" },
  { href: "/app/documents", label: "Documents", pack: "service_operations" },
  { href: "/app/work-schedule", label: "Work Schedule", pack: "service_operations" },
  { href: "/app/scheduling", label: "Scheduling", pack: "service_operations" },
  { href: "/app/approvals", label: "Approval Center", pack: "service_operations" },
  { href: "/app/employee", label: "Employee Portal", pack: "service_operations" },
  { href: "/app/team", label: "Team Management", pack: "service_operations" },
  { href: "/app/roles", label: "Role Management", pack: "service_operations" },
  { href: "/app/instances", label: "Instances", pack: "service_operations" },
  { href: "/app/promotional-trial", label: "Promotional Trial", pack: "service_operations" },
];

export const NAV_GROUP_ORDER: PackId[] = ["project_management", "project_delivery", "service_operations"];

export function packForHref(pathname: string): PackId | null {
  const match = NAV_MODULES.filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
  return match?.pack ?? null;
}

export function packsOf(list: PackId[] | undefined | null): PackId[] {
  if (!list) return DEFAULT_PACKS;
  return list.filter((id): id is PackId => PACKS.some((pack) => pack.id === id));
}

export function hasPack(list: PackId[] | undefined | null, pack: PackId) {
  return packsOf(list).includes(pack);
}
