export type PackId = "project_management" | "project_delivery" | "service_operations";

export type NavGroupId =
  | "project_management"
  | "resource_management"
  | "service_operations"
  | "business_management"
  | "intelligence"
  | "administration"
  | "settings";

export const PACKS: { id: PackId; label: string; summary: string }[] = [
  {
    id: "project_management",
    label: "Project management",
    summary: "Ideas, reports, and the office book of work.",
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

export const NAV_GROUPS: { id: NavGroupId; label: string; summary: string }[] = [
  { id: "project_management", label: "Project Management", summary: "Plan, execute, and track projects." },
  { id: "resource_management", label: "Resource Management", summary: "Manage people, capacity, and teams." },
  { id: "service_operations", label: "Service Operations", summary: "End-to-end service and field operations." },
  { id: "business_management", label: "Business Management", summary: "Contracts, billing, and client relationships." },
  { id: "intelligence", label: "Intelligence & Analytics", summary: "Track performance and drive insights." },
  { id: "administration", label: "Administration", summary: "Configure, control, and manage your organization." },
  { id: "settings", label: "Settings", summary: "Workspace setup and automations." },
];

export const DEFAULT_PACKS: PackId[] = ["project_management", "project_delivery", "service_operations"];

export type NavModule = {
  href: string;
  label: string;
  pack?: PackId;
  group: NavGroupId;
  exact?: boolean;
};

export const NAV_MODULES: NavModule[] = [
  { href: "/app/ideas", label: "Ideas", pack: "project_management", group: "project_management" },
  { href: "/app/projects", label: "Projects", pack: "project_delivery", group: "project_management" },
  { href: "/app/work", label: "Work", pack: "project_delivery", group: "project_management" },
  { href: "/app/tickets", label: "Tickets", pack: "project_delivery", group: "project_management" },
  { href: "/app/timesheets", label: "Timesheets", pack: "project_delivery", group: "project_management" },
  { href: "/app/resources", label: "Resources", pack: "project_delivery", group: "resource_management" },
  { href: "/app/team", label: "Team Management", pack: "service_operations", group: "resource_management" },
  { href: "/app/employee", label: "Employee Portal", pack: "service_operations", group: "resource_management" },
  { href: "/app/roles", label: "Role Management", pack: "service_operations", group: "resource_management" },
  { href: "/app/work-journey", label: "Work Journey", pack: "service_operations", group: "service_operations" },
  { href: "/app/work-orders", label: "Work Orders", pack: "service_operations", group: "service_operations" },
  { href: "/app/recurring-services", label: "Recurring Services", pack: "service_operations", group: "service_operations" },
  { href: "/app/documents", label: "Documents", pack: "service_operations", group: "service_operations" },
  { href: "/app/work-schedule", label: "Work Schedule", pack: "service_operations", group: "service_operations" },
  { href: "/app/scheduling", label: "Scheduling", pack: "service_operations", group: "service_operations" },
  { href: "/app/approvals", label: "Approval Center", pack: "service_operations", group: "service_operations" },
  { href: "/app/companies", label: "Companies", pack: "project_management", group: "business_management" },
  { href: "/app/contacts", label: "Contacts", pack: "project_management", group: "business_management" },
  { href: "/app/retainers", label: "Retainers", pack: "project_delivery", group: "business_management" },
  { href: "/app/billing", label: "Billing", pack: "project_delivery", group: "business_management" },
  { href: "/app/quotes", label: "Quotes", pack: "project_delivery", group: "business_management" },
  { href: "/app/reports", label: "Reports", pack: "project_management", group: "intelligence" },
  { href: "/app/analytics", label: "Analytics", pack: "project_management", group: "intelligence" },
  { href: "/app/instances", label: "Instances", pack: "service_operations", group: "administration" },
  { href: "/app/promotional-trial", label: "Promotional Trial", pack: "service_operations", group: "administration" },
  { href: "/app/audit", label: "Audit Trail", pack: "project_management", group: "administration" },
  { href: "/app/settings", label: "Settings", group: "settings" },
  { href: "/app/automations", label: "Automations", pack: "project_management", group: "settings" },
];

export const NAV_GROUP_ORDER: NavGroupId[] = [
  "project_management",
  "resource_management",
  "service_operations",
  "business_management",
  "intelligence",
  "administration",
];

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
