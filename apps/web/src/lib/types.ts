export type Role =
  | "admin"
  | "pm"
  | "staff"
  | "finance"
  | "leadership"
  | "client";

export type CompanyStatus = "Active" | "Prospect" | "Overdue Inv.";
export type ProjectStatus = "On Track" | "At Risk" | "Overdue";
export type TicketPriority = "Urgent" | "High" | "Medium" | "Low";
export type TicketStatus = "Open" | "In Progress" | "Resolved";
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
export type TaskStatus = "Not Started" | "In Progress" | "Review" | "Done";

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

export interface Project {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  manager: string;
  progress: number;
  status: ProjectStatus;
  due: string;
  budgetHours: number;
  loggedHours: number;
  marginPct: number;
  portalShared: boolean;
  portalContacts: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  due: string;
  status: "Approved" | "In Progress" | "Not Started";
}

export interface Ticket {
  id: string;
  number: number;
  subject: string;
  companyId: string;
  companyName: string;
  priority: TicketPriority;
  assignee: string;
  slaDue: string;
  status: TicketStatus;
  submitted: string;
}

export interface Task {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  assignee: string;
  assigneeInitials: string;
  status: TaskStatus;
  dueLabel?: string;
  clientEditable: boolean;
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
}

export interface ActivityItem {
  id: string;
  when: string;
  text: string;
}
