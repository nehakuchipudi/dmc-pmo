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
  | "view_service_ops"
  | "manage_service_ops"
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
  "view_service_ops",
  "manage_service_ops",
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
    "view_service_ops",
    "manage_service_ops",
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
    "view_service_ops",
    "manage_service_ops",
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
    "view_service_ops",
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
    "view_service_ops",
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
  "/app/quotes": "view_sales",
  "/app/analytics": "view_reports",
  "/app/audit": "view_home",
  "/app/settings": "view_home",
  "/app/work-journey": "view_service_ops",
  "/app/work-orders": "view_service_ops",
  "/app/recurring-services": "view_service_ops",
  "/app/documents": "view_service_ops",
  "/app/work-schedule": "view_service_ops",
  "/app/scheduling": "view_service_ops",
  "/app/approvals": "view_service_ops",
  "/app/employee": "view_service_ops",
  "/app/team": "view_service_ops",
  "/app/roles": "view_service_ops",
  "/app/instances": "view_service_ops",
  "/app/promotional-trial": "view_service_ops",
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

export type EditableRole = Exclude<Role, "admin">;
export type RoleGrants = Record<EditableRole, Capability[]>;

const EDITABLE_ROLES: EditableRole[] = ["leadership", "pm", "finance", "staff", "client"];

let readRoleGrants: () => RoleGrants | null = () => null;

export function bindRoleGrants(read: () => RoleGrants | null) {
  readRoleGrants = read;
}

export function defaultRoleGrants(): RoleGrants {
  return {
    leadership: [...ROLE_CAPS.leadership],
    pm: [...ROLE_CAPS.pm],
    finance: [...ROLE_CAPS.finance],
    staff: [...ROLE_CAPS.staff],
    client: [],
  };
}

function grantsFor(role: Role): readonly Capability[] {
  if (role === "admin") return ALL_CAPS;
  const custom = readRoleGrants();
  const list = custom?.[role] ?? defaultRoleGrants()[role];
  return list ?? [];
}

export function can(role: Role | undefined | null, cap: Capability): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  return grantsFor(role).includes(cap);
}

export function roleHasGrant(grants: RoleGrants | null | undefined, role: EditableRole, cap: Capability): boolean {
  const list = grants?.[role] ?? defaultRoleGrants()[role];
  return list.includes(cap);
}

export function withRoleGrant(grants: RoleGrants | null | undefined, role: EditableRole, cap: Capability, enabled: boolean): RoleGrants {
  const next = grants ? { ...grants, [role]: [...grants[role]] } : defaultRoleGrants();
  const list = new Set(next[role]);
  if (enabled) list.add(cap);
  else list.delete(cap);
  next[role] = EDITABLE_ROLES.includes(role) ? [...list] : next[role];
  return next;
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

export type PermissionItem = { cap: Capability; label: string; detail: string };
export type PermissionArea = { id: string; label: string; items: PermissionItem[] };

export const PERMISSION_AREAS: PermissionArea[] = [
  {
    id: "home",
    label: "Home & reports",
    items: [
      { cap: "view_home", label: "View home", detail: "Open the home dashboard." },
      { cap: "view_insights", label: "View insights", detail: "Open the insights page." },
      { cap: "view_reports", label: "View reports", detail: "Open reports and analytics." },
    ],
  },
  {
    id: "companies",
    label: "Companies & contacts",
    items: [
      { cap: "view_companies", label: "View companies", detail: "See company records." },
      { cap: "create_company", label: "Add companies", detail: "Create a company." },
      { cap: "edit_company", label: "Edit companies", detail: "Change company details." },
      { cap: "view_contacts", label: "View contacts", detail: "See people at companies." },
      { cap: "create_contact", label: "Add contacts", detail: "Create a contact." },
      { cap: "edit_contact", label: "Edit contacts", detail: "Change contact details." },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    items: [
      { cap: "view_projects", label: "View projects", detail: "Open the project list and records." },
      { cap: "create_project", label: "Add projects", detail: "Create a project." },
      { cap: "edit_project", label: "Edit projects", detail: "Change project details." },
      { cap: "delete_project", label: "Delete projects", detail: "Remove a project." },
      { cap: "manage_plan", label: "Edit the plan", detail: "Change tasks, dates, and the schedule." },
      { cap: "manage_project_team", label: "Edit the project team", detail: "Assign people to a project." },
      { cap: "manage_files", label: "Manage files", detail: "Add and remove project files." },
      { cap: "view_work", label: "View work", detail: "Open the work list." },
      { cap: "create_task", label: "Add tasks", detail: "Create a task." },
      { cap: "edit_assigned_task", label: "Edit assigned tasks", detail: "Update tasks assigned to this person." },
    ],
  },
  {
    id: "tickets",
    label: "Tickets",
    items: [
      { cap: "view_tickets", label: "View tickets", detail: "See support tickets." },
      { cap: "create_ticket", label: "Add tickets", detail: "Create a ticket." },
      { cap: "update_ticket", label: "Update tickets", detail: "Change ticket status and replies." },
    ],
  },
  {
    id: "time",
    label: "Time & expenses",
    items: [
      { cap: "view_timesheets", label: "View timesheets", detail: "Open timesheets." },
      { cap: "log_time", label: "Log time", detail: "Enter hours." },
      { cap: "approve_time", label: "Approve time", detail: "Approve or reject submitted time." },
      { cap: "create_expense", label: "Add expenses", detail: "Enter an expense." },
      { cap: "approve_expense", label: "Approve expenses", detail: "Approve or reject an expense." },
    ],
  },
  {
    id: "billing",
    label: "Invoices & retainers",
    items: [
      { cap: "view_billing", label: "View invoices", detail: "Open billing." },
      { cap: "create_invoice", label: "Create invoices", detail: "Draft an invoice." },
      { cap: "manage_invoice", label: "Manage invoices", detail: "Edit invoices, tax, and imports." },
      { cap: "pay_invoice", label: "Record payments", detail: "Mark an invoice paid." },
      { cap: "view_retainers", label: "View retainers", detail: "Open retainers." },
      { cap: "create_retainer", label: "Add retainers", detail: "Create a retainer." },
      { cap: "manage_retainer", label: "Manage retainers", detail: "Change retainer terms." },
      { cap: "manage_rates", label: "Manage rates", detail: "Change bill and cost rates." },
      { cap: "see_financials", label: "See money", detail: "Show amounts, rates, and budgets." },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { cap: "view_sales", label: "View sales", detail: "Open opportunities and quotes." },
      { cap: "create_opportunity", label: "Add opportunities", detail: "Create a sale." },
      { cap: "advance_opportunity", label: "Move opportunities", detail: "Change the sales stage." },
    ],
  },
  {
    id: "strategy",
    label: "Strategy & ideas",
    items: [
      { cap: "view_strategy", label: "View strategy", detail: "Open objectives." },
      { cap: "create_objective", label: "Add objectives", detail: "Create an objective." },
      { cap: "edit_objective", label: "Edit objectives", detail: "Change an objective." },
      { cap: "view_ideas", label: "View ideas", detail: "Open the idea list." },
      { cap: "create_idea", label: "Add ideas", detail: "Submit an idea." },
      { cap: "edit_idea", label: "Edit ideas", detail: "Change an idea." },
      { cap: "convert_idea", label: "Convert ideas", detail: "Turn an idea into a project." },
      { cap: "view_portfolios", label: "View portfolios", detail: "Open portfolios." },
      { cap: "create_portfolio", label: "Add portfolios", detail: "Create a portfolio." },
      { cap: "edit_portfolio", label: "Edit portfolios", detail: "Change a portfolio." },
    ],
  },
  {
    id: "governance",
    label: "Risks & governance",
    items: [
      { cap: "view_risks", label: "View risks", detail: "Open risks and issues." },
      { cap: "create_risk", label: "Add risks", detail: "Record a risk." },
      { cap: "update_risk", label: "Update risks", detail: "Change a risk or issue." },
      { cap: "view_dependencies", label: "View dependencies", detail: "See cross-project links." },
      { cap: "create_dependency", label: "Add dependencies", detail: "Link two projects." },
      { cap: "view_governance", label: "View governance", detail: "Open stage gates." },
      { cap: "decide_governance", label: "Decide gates", detail: "Approve or reject a gate." },
      { cap: "approve_signoff", label: "Approve signoff", detail: "Sign off a milestone." },
      { cap: "view_benefits", label: "View benefits", detail: "Open benefits tracking." },
    ],
  },
  {
    id: "people",
    label: "Users & settings",
    items: [
      { cap: "view_users", label: "View users", detail: "See the roster and these permissions." },
      { cap: "manage_users", label: "Manage users", detail: "Invite people and change permissions." },
      { cap: "configure_lifecycle", label: "Configure lifecycle", detail: "Change project status rules." },
      { cap: "view_resources", label: "View resources", detail: "Open the resource view." },
      { cap: "view_automations", label: "View automations", detail: "See automation rules." },
      { cap: "manage_automations", label: "Manage automations", detail: "Change automation rules." },
    ],
  },
  {
    id: "field",
    label: "Field service",
    items: [
      { cap: "view_service_ops", label: "View field service", detail: "Open work orders and scheduling." },
      { cap: "manage_service_ops", label: "Manage field service", detail: "Change field service setup." },
    ],
  },
  {
    id: "notes",
    label: "Notes",
    items: [{ cap: "add_note", label: "Add notes", detail: "Write a note on a record." }],
  },
];

export function permissionCatalogCaps(): Capability[] {
  return PERMISSION_AREAS.flatMap((area) => area.items.map((item) => item.cap));
}
