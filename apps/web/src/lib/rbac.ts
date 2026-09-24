import type { Role, TeamMember, User } from "./types";

export type CreateRecordKind =
  | "company"
  | "contact"
  | "project"
  | "ticket"
  | "task"
  | "expense"
  | "time"
  | "milestone"
  | "idea"
  | "risk"
  | "portfolio"
  | "objective";

export type Capability =
  | "view_home"
  | "view_strategy"
  | "view_ideas"
  | "view_portfolios"
  | "view_projects"
  | "view_work"
  | "view_tickets"
  | "view_timesheets"
  | "view_companies"
  | "view_contacts"
  | "view_sales"
  | "view_retainers"
  | "view_resources"
  | "view_risks"
  | "view_dependencies"
  | "view_governance"
  | "view_billing"
  | "view_benefits"
  | "view_reports"
  | "view_insights"
  | "view_automations"
  | "view_users"
  | "manage_users"
  | "configure_lifecycle"
  | "manage_automations"
  | "create_company"
  | "edit_company"
  | "create_contact"
  | "edit_contact"
  | "create_project"
  | "edit_project"
  | "delete_project"
  | "manage_plan"
  | "manage_project_team"
  | "manage_files"
  | "manage_rates"
  | "create_ticket"
  | "update_ticket"
  | "create_task"
  | "edit_assigned_task"
  | "log_time"
  | "approve_time"
  | "create_expense"
  | "approve_expense"
  | "create_invoice"
  | "manage_invoice"
  | "pay_invoice"
  | "create_retainer"
  | "manage_retainer"
  | "create_opportunity"
  | "advance_opportunity"
  | "create_objective"
  | "edit_objective"
  | "create_idea"
  | "edit_idea"
  | "convert_idea"
  | "create_portfolio"
  | "edit_portfolio"
  | "create_risk"
  | "update_risk"
  | "create_dependency"
  | "decide_governance"
  | "approve_signoff"
  | "see_financials"
  | "add_note";

export const USER_ROLES: Role[] = ["admin", "pm", "staff", "finance", "leadership", "client"];

export const ROLE_SUMMARIES: { role: Role; title: string; body: string }[] = [
  { role: "admin", title: "Admin", body: "Every module, user, rate, invoice, and lifecycle setting." },
  { role: "leadership", title: "Leadership", body: "Strategy, portfolios, governance, and financial visibility. No user admin." },
  { role: "pm", title: "Project Manager", body: "Own delivery: projects, plan, team, files, invoices, and time approval." },
  { role: "finance", title: "Finance", body: "Companies, billing, retainers, expenses, and time approval. No plan edits." },
  { role: "staff", title: "Staff", body: "Assigned work, tickets, and own timesheets. Hours only unless granted." },
  { role: "client", title: "Client", body: "Company portal only. No internal PMO workspace." },
];

const ALL_CAPS = [
  "view_home",
  "view_strategy",
  "view_ideas",
  "view_portfolios",
  "view_projects",
  "view_work",
  "view_tickets",
  "view_timesheets",
  "view_companies",
  "view_contacts",
  "view_sales",
  "view_retainers",
  "view_resources",
  "view_risks",
  "view_dependencies",
  "view_governance",
  "view_billing",
  "view_benefits",
  "view_reports",
  "view_insights",
  "view_automations",
  "view_users",
  "manage_users",
  "configure_lifecycle",
  "manage_automations",
  "create_company",
  "edit_company",
  "create_contact",
  "edit_contact",
  "create_project",
  "edit_project",
  "delete_project",
  "manage_plan",
  "manage_project_team",
  "manage_files",
  "manage_rates",
  "create_ticket",
  "update_ticket",
  "create_task",
  "edit_assigned_task",
  "log_time",
  "approve_time",
  "create_expense",
  "approve_expense",
  "create_invoice",
  "manage_invoice",
  "pay_invoice",
  "create_retainer",
  "manage_retainer",
  "create_opportunity",
  "advance_opportunity",
  "create_objective",
  "edit_objective",
  "create_idea",
  "edit_idea",
  "convert_idea",
  "create_portfolio",
  "edit_portfolio",
  "create_risk",
  "update_risk",
  "create_dependency",
  "decide_governance",
  "approve_signoff",
  "see_financials",
  "add_note",
] as const satisfies readonly Capability[];

const ROLE_CAPS: Record<Exclude<Role, "admin" | "client">, Capability[]> = {
  leadership: [
    "view_home",
    "view_strategy",
    "view_ideas",
    "view_portfolios",
    "view_projects",
    "view_work",
    "view_tickets",
    "view_timesheets",
    "view_companies",
    "view_contacts",
    "view_sales",
    "view_retainers",
    "view_resources",
    "view_risks",
    "view_dependencies",
    "view_governance",
    "view_billing",
    "view_benefits",
    "view_reports",
    "view_insights",
    "view_users",
    "create_project",
    "create_objective",
    "edit_objective",
    "create_idea",
    "edit_idea",
    "convert_idea",
    "create_portfolio",
    "edit_portfolio",
    "create_risk",
    "update_risk",
    "create_dependency",
    "decide_governance",
    "see_financials",
    "add_note",
  ],
  pm: [
    "view_home",
    "view_strategy",
    "view_ideas",
    "view_portfolios",
    "view_projects",
    "view_work",
    "view_tickets",
    "view_timesheets",
    "view_companies",
    "view_contacts",
    "view_sales",
    "view_retainers",
    "view_resources",
    "view_risks",
    "view_dependencies",
    "view_governance",
    "view_billing",
    "view_benefits",
    "view_reports",
    "view_insights",
    "view_users",
    "create_company",
    "edit_company",
    "create_contact",
    "edit_contact",
    "create_project",
    "edit_project",
    "delete_project",
    "manage_plan",
    "manage_project_team",
    "manage_files",
    "manage_rates",
    "create_ticket",
    "update_ticket",
    "create_task",
    "edit_assigned_task",
    "log_time",
    "approve_time",
    "create_expense",
    "create_invoice",
    "manage_invoice",
    "create_opportunity",
    "advance_opportunity",
    "create_idea",
    "edit_idea",
    "convert_idea",
    "create_risk",
    "update_risk",
    "create_dependency",
    "approve_signoff",
    "see_financials",
    "add_note",
  ],
  finance: [
    "view_home",
    "view_projects",
    "view_timesheets",
    "view_companies",
    "view_contacts",
    "view_sales",
    "view_retainers",
    "view_billing",
    "view_benefits",
    "view_reports",
    "view_users",
    "edit_company",
    "create_contact",
    "edit_contact",
    "log_time",
    "approve_time",
    "create_expense",
    "approve_expense",
    "create_invoice",
    "manage_invoice",
    "pay_invoice",
    "create_retainer",
    "manage_retainer",
    "create_opportunity",
    "advance_opportunity",
    "see_financials",
    "add_note",
  ],
  staff: [
    "view_home",
    "view_ideas",
    "view_projects",
    "view_work",
    "view_tickets",
    "view_timesheets",
    "view_companies",
    "view_contacts",
    "create_ticket",
    "update_ticket",
    "edit_assigned_task",
    "log_time",
    "create_expense",
    "create_idea",
    "manage_files",
    "add_note",
  ],
};

const ROLE_CAP_SET: Record<Role, ReadonlySet<Capability>> = {
  admin: new Set(ALL_CAPS),
  leadership: new Set(ROLE_CAPS.leadership),
  pm: new Set(ROLE_CAPS.pm),
  finance: new Set(ROLE_CAPS.finance),
  staff: new Set(ROLE_CAPS.staff),
  client: new Set(),
};

export const NAV_CAPABILITY: Record<string, Capability> = {
  "/app/home": "view_home",
  "/app/strategy": "view_strategy",
  "/app/ideas": "view_ideas",
  "/app/portfolios": "view_portfolios",
  "/app/projects": "view_projects",
  "/app/work": "view_work",
  "/app/tickets": "view_tickets",
  "/app/timesheets": "view_timesheets",
  "/app/companies": "view_companies",
  "/app/contacts": "view_contacts",
  "/app/sales": "view_sales",
  "/app/retainers": "view_retainers",
  "/app/resources": "view_resources",
  "/app/risks": "view_risks",
  "/app/dependencies": "view_dependencies",
  "/app/governance": "view_governance",
  "/app/billing": "view_billing",
  "/app/benefits": "view_benefits",
  "/app/reports": "view_reports",
  "/app/ai": "view_insights",
  "/app/automations": "view_automations",
  "/app/settings": "view_users",
};

const CREATE_KIND_CAP: Record<CreateRecordKind, Capability> = {
  company: "create_company",
  contact: "create_contact",
  project: "create_project",
  ticket: "create_ticket",
  task: "create_task",
  expense: "create_expense",
  time: "log_time",
  milestone: "manage_plan",
  idea: "create_idea",
  risk: "create_risk",
  portfolio: "create_portfolio",
  objective: "create_objective",
};

export function can(role: Role | undefined | null, cap: Capability): boolean {
  if (!role) return false;
  return ROLE_CAP_SET[role]?.has(cap) ?? false;
}

export function roleCapabilities(role: Role): Capability[] {
  return ALL_CAPS.filter((cap) => can(role, cap));
}

export function applyTeamRole(user: User | null, team: TeamMember[]): User | null {
  if (!user) return null;
  const member = team.find((m) => m.email.toLowerCase() === user.email.toLowerCase());
  if (!member) return user;
  return {
    ...user,
    name: member.name || user.name,
    initials: member.initials || user.initials,
    role: member.role,
    avatarUrl: member.avatarUrl ?? user.avatarUrl,
  };
}

export function teamFinancialVisibility(user: User | null, team: TeamMember[]): "hours" | "rates_and_budgets" {
  if (!user) return "hours";
  const member = team.find((m) => m.email.toLowerCase() === user.email.toLowerCase());
  return member?.financialVisibility ?? (can(user.role, "see_financials") ? "rates_and_budgets" : "hours");
}

export function canSeeFinancials(user: User | null, team: TeamMember[] = []): boolean {
  if (!user) return false;
  if (can(user.role, "see_financials")) return true;
  return teamFinancialVisibility(user, team) === "rates_and_budgets";
}

export function canAccessHref(role: Role | undefined | null, href: string): boolean {
  const match = Object.keys(NAV_CAPABILITY)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => href === prefix || href.startsWith(`${prefix}/`) || href.startsWith(`${prefix}?`));
  if (!match) return can(role, "view_home");
  return can(role, NAV_CAPABILITY[match]);
}

export function createKindCapability(kind: CreateRecordKind | null): Capability | null {
  if (!kind) return null;
  return CREATE_KIND_CAP[kind];
}

export function canCreateKind(role: Role | undefined | null, kind: CreateRecordKind | null): boolean {
  const cap = createKindCapability(kind);
  return !!cap && can(role, cap);
}

export function isAssignedName(user: User | null | undefined, assignee: string, initials?: string): boolean {
  if (!user) return false;
  const last = user.name.split(" ").slice(-1)[0] ?? "";
  return (
    assignee === user.name ||
    assignee === `${user.initials}` ||
    (!!last && assignee.includes(last)) ||
    (!!initials && initials === user.initials)
  );
}

export function hiddenMoney(show: boolean, value: string): string {
  return show ? value : "Hidden";
}
