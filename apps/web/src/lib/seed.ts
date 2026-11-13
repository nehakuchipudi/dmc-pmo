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
    summary: "",
    kind: "time_materials",
    titlePattern: "Invoice for {project}",
    terms: "Net 30",
    currency: "USD",
    taxPct: 0,
    description: "",
    internalDescription: "",
    invoiceFor: "Work completed",
    defaultLines: [],
  },
  {
    id: "tpl-progress",
    name: "Progress billing",
    summary: "",
    kind: "progress",
    titlePattern: "{project} progress billing",
    terms: "Net 30",
    currency: "USD",
    taxPct: 0,
    description: "",
    internalDescription: "",
    invoiceFor: "Work completed",
    defaultLines: [],
  },
  {
    id: "tpl-retainer",
    name: "Retainer period",
    summary: "",
    kind: "retainer",
    titlePattern: "{company} retainer",
    terms: "Net 15",
    currency: "USD",
    taxPct: 0,
    description: "",
    internalDescription: "",
    invoiceFor: "Retainer period",
    defaultLines: [],
  },
  {
    id: "tpl-fixed",
    name: "Fixed fee milestone",
    summary: "",
    kind: "fixed_fee",
    titlePattern: "{project} milestone",
    terms: "Net 15",
    currency: "USD",
    taxPct: 0,
    description: "",
    internalDescription: "",
    invoiceFor: "Milestone",
    defaultLines: [],
  },
  {
    id: "tpl-expense",
    name: "Expense recovery",
    summary: "",
    kind: "expense",
    titlePattern: "Expenses for {company}",
    terms: "Due on receipt",
    currency: "USD",
    taxPct: 0,
    description: "",
    internalDescription: "",
    invoiceFor: "Expenses",
    defaultLines: [],
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

export function moneyExact(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatLongMonthDay(iso: string) {
  if (!iso.includes("-")) return iso;
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
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
