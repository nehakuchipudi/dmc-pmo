export type Role =
  | "admin"
  | "pm"
  | "staff"
  | "finance"
  | "leadership"
  | "client";

export type CompanyStatus = "Active" | "Prospect" | "Overdue Inv.";
export type ProjectStatus =
  | "Draft"
  | "Planning"
  | "Active"
  | "On Hold"
  | "At Risk"
  | "Completed"
  | "Cancelled";
export type ProgramStatus = "On Track" | "At Risk" | "Overdue" | "Planned" | "Completed";

export interface ProjectStatusChange {
  id: string;
  from: ProjectStatus;
  to: ProjectStatus;
  actor: string;
  at: string;
  when: string;
}

export interface ProjectWorkflow {
  transitions: Record<ProjectStatus, ProjectStatus[]>;
  changerRoles: Role[];
}
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
  avatarUrl?: string;
}

export type CompanyAssetKind = "License" | "Hardware" | "Subscription" | "Environment";
export type CompanyAssetStatus = "Active" | "Expiring" | "Retired";

export interface CompanyFile {
  id: string;
  folder: string;
  name: string;
  kind: "pdf" | "docx" | "pptx" | "img" | "other";
  sizeKb: number;
}

export interface CompanyAsset {
  id: string;
  companyId: string;
  name: string;
  kind: CompanyAssetKind;
  status: CompanyAssetStatus;
  owner: string;
  projectId?: string;
  note: string;
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
  createdAt?: string;
  address?: string;
  tags?: string[];
  favorite?: boolean;
  primaryContactId?: string;
  accountManagers?: string[];
  notes?: string;
  files?: CompanyFile[];
}

export interface ContactNote {
  id: string;
  author: string;
  body: string;
  createdAt: string;
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
  phone?: string;
  notes?: string;
  noteItems?: ContactNote[];
  projectIds?: string[];
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
  linkedTaskIds?: string[];
}

export interface ProjectNote {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  visibility: "internal" | "client";
}

export interface ProjectScope {
  objectives: string;
  inScope: string[];
  outOfScope: string[];
  deliverables: string[];
  assumptions: string[];
}

export interface TaskLink {
  id: string;
  type: "file" | "url" | "image";
  label: string;
  href: string;
  fileId?: string;
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
  scope: ProjectScope;
  rates?: ProjectRate[];
  statusHistory?: ProjectStatusChange[];
}

/** L1 phase or L2 workstream/group in the project WBS */
export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  due: string;
  start: string;
  status: MilestoneStatus;
  kind: "phase" | "group";
  parentId?: string;
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
  /** Prefer L2 workstream id; may point at L1 phase when ungrouped */
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
  links: TaskLink[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: Role;
  active: boolean;
  avatarUrl?: string;
  billRate?: number;
}

export interface ProjectRate {
  memberName: string;
  hourlyRate: number;
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

export type ActivityType =
  | "comment"
  | "status"
  | "task"
  | "time"
  | "approval"
  | "file"
  | "budget"
  | "milestone"
  | "project";

export interface ActivityItem {
  id: string;
  companyId?: string;
  projectId?: string;
  when: string;
  text: string;
  type?: ActivityType;
  actor?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  href?: string;
  at?: string;
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

export type ObjectiveStatus = "On Track" | "At Risk" | "Lagging" | "Achieved";
export interface StrategicObjective {
  id: string;
  code: string;
  name: string;
  owner: string;
  horizon: string;
  status: ObjectiveStatus;
  target: string;
  progress: number;
  description: string;
}

export type IdeaStage = "Submitted" | "Scoring" | "Approved" | "Deferred" | "Converted";
export interface Idea {
  id: string;
  name: string;
  companyId?: string;
  companyName?: string;
  submitter: string;
  stage: IdeaStage;
  score: number;
  strategicFit: number;
  valueScore: number;
  riskScore: number;
  objectiveId?: string;
  requestedBudget: number;
  summary: string;
  convertedProjectId?: string;
}

export type PortfolioHealth = "Healthy" | "Watch" | "Critical";
export type ProjectHealth = PortfolioHealth;
export interface Portfolio {
  id: string;
  name: string;
  owner: string;
  theme: string;
  budget: number;
  projectIds: string[];
  objectiveIds: string[];
  description: string;
}

export interface Program {
  id: string;
  name: string;
  portfolioId: string;
  owner: string;
  status: ProgramStatus;
  projectIds: string[];
  objectiveId?: string;
  description: string;
}

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type RiskStatus = "Open" | "Mitigating" | "Closed";
export interface RiskItem {
  id: string;
  title: string;
  projectId?: string;
  programId?: string;
  owner: string;
  probability: RiskLevel;
  impact: RiskLevel;
  status: RiskStatus;
  due: string;
  mitigation: string;
}

export interface IssueItem {
  id: string;
  title: string;
  projectId: string;
  owner: string;
  severity: RiskLevel;
  status: "Open" | "In Progress" | "Resolved";
  raised: string;
}

export interface CrossDependency {
  id: string;
  predecessorProjectId: string;
  successorProjectId: string;
  type: "Finish to Start" | "Shared Resource" | "Data";
  status: "On Track" | "Blocked" | "At Risk";
  note: string;
}

export interface Benefit {
  id: string;
  name: string;
  objectiveId: string;
  projectId?: string;
  metric: string;
  baseline: string;
  target: string;
  current: string;
  progress: number;
  owner: string;
}

export type GateStatus = "Upcoming" | "In Review" | "Approved" | "Rejected";
export interface GovernanceGate {
  id: string;
  name: string;
  projectId: string;
  stage: string;
  owner: string;
  due: string;
  status: GateStatus;
  criteria: string;
}

export interface ResourceAllocation {
  id: string;
  memberId: string;
  memberName: string;
  projectId: string;
  projectName: string;
  allocationPct: number;
  hoursPerWeek: number;
  start: string;
  end: string;
}
