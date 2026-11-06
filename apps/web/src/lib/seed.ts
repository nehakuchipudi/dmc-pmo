import type {
  ActivityItem,
  AutomationRule,
  Company,
  CompanyAsset,
  Contact,
  EmailOutboxItem,
  BillMaterial,
  Expense,
  Invoice,
  Purchase,
  InvoiceTemplate,
  Milestone,
  NotificationItem,
  Opportunity,
  Project,
  Retainer,
  RetainerPeriod,
  Task,
  TeamMember,
  Ticket,
  TicketMessage,
  TimeEntry,
  User,
} from "./types";

export const users: User[] = [
  {
    id: "u-admin",
    name: "Dillon Morgan",
    initials: "DM",
    role: "admin",
    email: "dillon@dillonmorgan.com",
  },
  {
    id: "u-pm",
    name: "M. Doyle",
    initials: "MD",
    role: "pm",
    email: "mdoyle@dillonmorgan.com",
  },
  {
    id: "u-staff",
    name: "J. Kim",
    initials: "JK",
    role: "staff",
    email: "jkim@dillonmorgan.com",
  },
  {
    id: "u-finance",
    name: "J. Alvarez",
    initials: "JA",
    role: "finance",
    email: "jalvarez@dillonmorgan.com",
  },
  {
    id: "u-lead",
    name: "P. Rivera",
    initials: "PR",
    role: "leadership",
    email: "privera@dillonmorgan.com",
  },
  {
    id: "u-ap",
    name: "Aishwarya Phalak",
    initials: "AP",
    role: "pm",
    email: "aishwarya.phalak@dillonmorgan.com",
    notifyEmail: true,
  },
  {
    id: "u-client",
    name: "Dana Kessler",
    initials: "DK",
    role: "client",
    email: "dana@cascadeventures.com",
  },
];

export const seedCompanies: Company[] = [];
export const seedCompanyAssets: CompanyAsset[] = [];
export const seedContacts: Contact[] = [];
export const seedProjects: Project[] = [];
export const seedMilestones: Milestone[] = [];
export const seedTickets: Ticket[] = [];
export const seedTicketMessages: TicketMessage[] = [];
export const seedTasks: Task[] = [];

export const seedTeam: TeamMember[] = [
  { id: "tm-dm", name: "Dillon Morgan", firstName: "Dillon", lastName: "Morgan", title: "Managing Director", email: "dillon@dillonmorgan.com", initials: "DM", role: "admin", active: true, billRate: 225, costRate: 80, department: "Leadership", username: "dillon", financialVisibility: "rates_and_budgets", timezone: "America/Chicago" },
  { id: "tm-md", name: "M. Doyle", firstName: "Morgan", lastName: "Doyle", title: "Delivery Lead", email: "mdoyle@dillonmorgan.com", initials: "MD", role: "pm", active: true, billRate: 185, costRate: 65, department: "Delivery", managerId: "tm-dm", username: "mdoyle", financialVisibility: "rates_and_budgets", timezone: "America/Chicago" },
  { id: "tm-jk", name: "J. Kim", firstName: "Jordan", lastName: "Kim", title: "Consultant", email: "jkim@dillonmorgan.com", initials: "JK", role: "staff", active: true, billRate: 145, costRate: 52, department: "Delivery", managerId: "tm-md", username: "jkim", financialVisibility: "hours", timezone: "America/New_York" },
  { id: "tm-sc", name: "S. Cho", firstName: "Sam", lastName: "Cho", title: "Project Manager", email: "scho@dillonmorgan.com", initials: "SC", role: "pm", active: true, billRate: 185, costRate: 65, department: "PMO", managerId: "tm-dm", username: "scho", financialVisibility: "rates_and_budgets", timezone: "America/Chicago" },
  { id: "tm-sa", name: "S. Ahmed", firstName: "Sara", lastName: "Ahmed", title: "Analyst", email: "sahmed@dillonmorgan.com", initials: "SA", role: "staff", active: true, billRate: 145, costRate: 52, department: "Delivery", managerId: "tm-sc", username: "sahmed", financialVisibility: "hours", timezone: "America/Chicago" },
  { id: "tm-ja", name: "J. Alvarez", firstName: "Jules", lastName: "Alvarez", title: "Finance Partner", email: "jalvarez@dillonmorgan.com", initials: "JA", role: "finance", active: true, billRate: 165, costRate: 58, department: "Finance", managerId: "tm-dm", username: "jalvarez", financialVisibility: "rates_and_budgets", timezone: "America/Chicago" },
  { id: "tm-pr", name: "P. Rivera", firstName: "Pat", lastName: "Rivera", title: "PMO Director", email: "privera@dillonmorgan.com", initials: "PR", role: "leadership", active: true, billRate: 210, costRate: 75, department: "Leadership", managerId: "tm-dm", username: "privera", financialVisibility: "rates_and_budgets", timezone: "America/Chicago" },
  { id: "tm-ac", name: "A. Chen", firstName: "Avery", lastName: "Chen", title: "Engineering Manager", email: "achen@rowletttx.gov", initials: "AC", role: "pm", active: true, billRate: 0, costRate: 62, department: "Capital Delivery", managerId: "tm-pr", username: "achen", financialVisibility: "rates_and_budgets", timezone: "America/Chicago" },
  { id: "tm-ap", name: "Aishwarya Phalak", firstName: "Aishwarya", lastName: "Phalak", title: "Project Owner", email: "aishwarya.phalak@dillonmorgan.com", initials: "AP", role: "pm", active: true, billRate: 185, costRate: 65, department: "PMO", managerId: "tm-pr", username: "aphalak", financialVisibility: "rates_and_budgets", timezone: "America/Chicago", notifyEmail: true },
];

export const seedInvoiceTemplates: InvoiceTemplate[] = [
  {
    id: "tpl-tm",
    name: "Time and materials",
    summary: "Bill approved hours at the project rate, plus any materials.",
    kind: "time_materials",
    titlePattern: "Invoice for {project}",
    terms: "Net 30",
    currency: "USD",
    taxPct: 0,
    description: "Professional services for the billing period.",
    internalDescription: "Pulled from approved time and project materials.",
    invoiceFor: "Work completed",
    defaultLines: [
      { kind: "service", description: "Professional services", hours: 10, rate: 180, amount: 1800, taxPct: 0, includeInPdf: true },
    ],
  },
  {
    id: "tpl-progress",
    name: "Progress billing",
    summary: "Invoice a slice of the project budget as work lands.",
    kind: "progress",
    titlePattern: "{project} progress billing",
    terms: "Net 30",
    currency: "USD",
    taxPct: 0,
    description: "Progress billing against the current project budget.",
    internalDescription: "Use when the engagement is percent complete.",
    invoiceFor: "Work completed",
    defaultLines: [
      { kind: "service", description: "Progress billing", amount: 8500, taxPct: 0, includeInPdf: true },
    ],
  },
  {
    id: "tpl-retainer",
    name: "Retainer period",
    summary: "Close a retainer window at the contracted hourly rate.",
    kind: "retainer",
    titlePattern: "{company} retainer",
    terms: "Net 15",
    currency: "USD",
    taxPct: 0,
    description: "Retainer hours for the selected period.",
    internalDescription: "Match the open retainer period before sending.",
    invoiceFor: "Retainer period",
    defaultLines: [
      { kind: "service", description: "Retainer hours", hours: 40, rate: 175, amount: 7000, taxPct: 0, includeInPdf: true },
    ],
  },
  {
    id: "tpl-fixed",
    name: "Fixed fee milestone",
    summary: "One agreed amount when a milestone is ready to bill.",
    kind: "fixed_fee",
    titlePattern: "{project} milestone",
    terms: "Net 15",
    currency: "USD",
    taxPct: 0,
    description: "Fixed fee for the agreed milestone.",
    internalDescription: "Confirm the milestone is signed off before sending.",
    invoiceFor: "Milestone",
    defaultLines: [
      { kind: "service", description: "Milestone fee", amount: 12000, taxPct: 0, includeInPdf: true },
    ],
  },
  {
    id: "tpl-expense",
    name: "Expense recovery",
    summary: "Pass approved expenses and materials through to the client.",
    kind: "expense",
    titlePattern: "Expenses for {company}",
    terms: "Due on receipt",
    currency: "USD",
    taxPct: 0,
    description: "Reimbursable expenses and materials for the period.",
    internalDescription: "Only include approved spend.",
    invoiceFor: "Expenses",
    defaultLines: [
      { kind: "expense", description: "Travel and lodging", amount: 420, taxPct: 0, includeInPdf: true },
    ],
  },
];

export const seedInvoices: Invoice[] = [];
export const seedTimeEntries: TimeEntry[] = [];
export const seedNotifications: NotificationItem[] = [];
export const seedActivities: ActivityItem[] = [];
export const seedRetainers: Retainer[] = [];
export const seedRetainerPeriods: RetainerPeriod[] = [];
export const seedAutomations: AutomationRule[] = [];
export const seedEmailOutbox: EmailOutboxItem[] = [];
export const seedExpenses: Expense[] = [];
export const seedPurchases: Purchase[] = [];
export const seedBillMaterials: BillMaterial[] = [];
export const seedOpportunities: Opportunity[] = [];

export function staticRecordIds<T extends { id: string }>(records: T[]) {
  return records.length ? records.map((item) => ({ id: item.id })) : [{ id: "_" }];
}

export function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDisplayDate(iso: string) {
  if (!iso.includes("-")) return iso;
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Consistent table/Gantt short date: MM/DD/YYYY */
export function formatShortDate(iso: string) {
  if (!iso.includes("-")) return iso;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${m}/${d}/${y}`;
}

export function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
