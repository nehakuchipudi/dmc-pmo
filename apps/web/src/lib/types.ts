export type Role =
  | "admin"
  | "pm"
  | "staff"
  | "finance"
  | "leadership"
  | "client";

export type CompanyStatus = "Active" | "Prospect" | "Overdue Inv.";
export type ProjectStatus = "On Track" | "At Risk" | "Overdue" | "Planned" | "Completed";
export type TicketPriority = "Urgent" | "High" | "Medium" | "Low";
export type TicketStatus = "Open" | "In Progress" | "Resolved";
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
export type TaskStatus = "Not Started" | "In Progress" | "Review" | "Done";
export type TaskPriority = "Critical" | "High" | "Med" | "Low";
export type MilestoneStatus = "Approved" | "Awaiting Signoff" | "In Progress" | "Not Started";
export type TimeEntryStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
export type RetainerType = "Monthly T&M" | "Pre-paid" | "Fixed";
export type RetainerStatus = "Active" | "Expired" | "Cancelled";
export type PeriodStatus = "Opened" | "Closed" | "Invoiced";

export interface User {
  id: string;
  name: string;
  initials: string;
  role: Role;
  email: string;
  companyId?: string;
}

export interface Company {
  id: string;
  name: string;
  initials: string;
  status: CompanyStatus;
  accountManager: string;
  openProjects: number;
  openTickets: number;
  lastActivity: string;
  industry: string;
  billingTerms: string;
  portalContacts: number;
}

export interface Contact {
  id: string;
  name: string;
  initials: string;
  companyId: string;
  companyName: string;
  title: string;
  email: string;
  portal: "Enabled" | "Not Invited";
  lastInteraction: string;
}

export interface MaterialLine {
  id: string;
  item: string;
  title: string;
  qty: number;
  purchasePrice: number;
  salePrice: number;
}

export interface ProjectFile {
  id: string;
  folder: string;
  name: string;
  kind: "pdf" | "docx" | "pptx" | "img" | "other";
  sizeKb: number;
}

export interface ProjectNote {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  visibility: "internal" | "client";
}

export interface Project {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  manager: string;
  progress: number;
  status: ProjectStatus;
  due: string;
  start: string;
  budgetHours: number;
  loggedHours: number;
  marginPct: number;
  portalShared: boolean;
  portalContacts: number;
  projectType: string;
  description: string;
  budgetAmount: number;
  materials: MaterialLine[];
  files: ProjectFile[];
  notes: ProjectNote[];
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  due: string;
  start: string;
  status: MilestoneStatus;
}

export interface Ticket {
  id: string;
  number: number;
  subject: string;
  companyId: string;
  companyName: string;
  projectId?: string;
  priority: TicketPriority;
  assignee: string;
  slaDue: string;
  status: TicketStatus;
  submitted: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  author: string;
  body: string;
  createdAt: string;
  visibility: "client" | "internal";
}

export interface Task {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  milestoneId?: string;
  assignee: string;
  assigneeInitials: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  due: string;
  start: string;
  dueLabel?: string;
  clientEditable: boolean;
  estimateHours: number;
  dependsOn?: string;
}

export interface Invoice {
  id: string;
  number: string;
  companyId: string;
  companyName: string;
  amount: number;
  terms: string;
  due: string;
  status: InvoiceStatus;
  lineItems: { description: string; amount: number }[];
  projectId?: string;
  retainerId?: string;
}

export interface TimeEntry {
  id: string;
  userName: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;
  date: string;
  hours: number;
  billable: boolean;
  note: string;
  status: TimeEntryStatus;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export interface ActivityItem {
  id: string;
  companyId?: string;
  projectId?: string;
  when: string;
  text: string;
}

export interface RetainerPeriod {
  id: string;
  retainerId: string;
  start: string;
  end: string;
  status: PeriodStatus;
  usedHours: number;
  budgetHours: number;
  invoiceId?: string;
}

export interface Retainer {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  type: RetainerType;
  manager: string;
  contactId?: string;
  contactName?: string;
  periodLabel: string;
  usedHours: number;
  budgetHours: number;
  status: RetainerStatus;
  autoRenew: boolean;
  expires: string;
  openPeriods: number;
  files: ProjectFile[];
  notes: ProjectNote[];
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  enabled: boolean;
}

export interface EmailOutboxItem {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  status: "Queued" | "Sent" | "Failed";
}

export interface Expense {
  id: string;
  vendor: string;
  projectId: string;
  projectName: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  date: string;
  note: string;
}

export interface Opportunity {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  stage: "Qualify" | "Propose" | "Negotiate" | "Won" | "Lost";
  amount: number;
  close: string;
}
