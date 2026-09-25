"use client";

import { create } from "zustand";
import {
  initialsFromName,
  seedActivities,
  seedAutomations,
  seedCompanies,
  seedCompanyAssets,
  seedContacts,
  seedEmailOutbox,
  seedExpenses,
  seedInvoices,
  seedInvoiceTemplates,
  seedMilestones,
  seedNotifications,
  seedOpportunities,
  seedProjects,
  seedRetainers,
  seedRetainerPeriods,
  seedTasks,
  seedTeam,
  seedTicketMessages,
  seedTickets,
  seedTimeEntries,
  uid,
  users,
} from "./seed";
import { findAccount, findAccountByEmail, readAccountExtras, upsertDirectoryUser, writeAccountExtras } from "./directory";
import { applyTeamRole, can, isAssignedName, type Capability } from "./rbac";
import { makeActivity } from "./activity";
import {
  DEFAULT_PROJECT_WORKFLOW,
  canChangeProjectStatus,
  isValidProjectTransition,
  normalizeProjectStatus,
  toggleWorkflowTransition,
} from "./project-lifecycle";
import { weeklyHoursFromAllocation } from "./project-team";
import {
  seedAllocations,
  seedBenefits,
  seedDependencies,
  seedGates,
  seedIdeas,
  seedIssues,
  seedObjectives,
  seedPortfolios,
  seedRisks,
} from "./ppm-seed";
import { ideaComposite } from "./ppm";
import {
  buildDnsRecords,
  domainStatus,
  inspectDnsRecords,
  loadEmailDomains,
  localPart,
  normalizeDomain,
  persistEmailDomains,
} from "./email-domain";
import type {
  ActivityItem,
  ActivityType,
  AutomationRule,
  Benefit,
  Company,
  CompanyAsset,
  CompanyFile,
  Contact,
  ContactNote,
  CrossDependency,
  EmailDomain,
  EmailOutboxItem,
  Expense,
  GateStatus,
  GovernanceGate,
  Idea,
  IdeaStage,
  Invoice,
  InvoiceLineItem,
  InvoiceTemplate,
  IssueItem,
  Milestone,
  NotificationItem,
  Opportunity,
  Portfolio,
  Project,
  ProjectFile,
  ProjectNote,
  ProjectScope,
  ProjectStatus,
  ProjectStatusChange,
  ProjectWorkflow,
  Role,
  ResourceAllocation,
  Retainer,
  RetainerPeriod,
  RetainerType,
  RiskItem,
  RiskStatus,
  StrategicObjective,
  Task,
  TaskLink,
  TaskPriority,
  TaskStatus,
  TeamMember,
  Ticket,
  User,
  TicketMessage,
  TimeEntry,
} from "./types";
import { computeLineAmount, dueFromTerms, emptyInvoiceLine, invoiceTotals, nextInvoiceNumber } from "./invoice";

type CreateCompanyInput = {
  name: string;
  status: Company["status"];
  accountManager: string;
  accountManagers?: string[];
  industry: string;
  billingTerms: string;
  website?: string;
  phone?: string;
  fax?: string;
  email?: string;
  address?: string;
  addresses?: Company["addresses"];
  tags?: string[];
  privacy?: Company["privacy"];
  customFields?: Company["customFields"];
  notes?: string;
};

type CreateProjectInput = {
  name: string;
  companyId: string;
  manager: string;
  due: string;
  budgetHours: number;
};

type CreateTicketInput = {
  subject: string;
  companyId: string;
  priority: Ticket["priority"];
  assignee: string;
  projectId?: string;
};

type CreateTaskInput = {
  name: string;
  projectId: string;
  assignee: string;
  due: string;
  start?: string;
  status?: TaskStatus;
  milestoneId?: string;
  parentTaskId?: string;
  estimateHours?: number;
  budgetAmount?: number;
  priority?: TaskPriority;
};

type CreateTimeInput = {
  userName: string;
  projectId: string;
  taskId?: string;
  date: string;
  start?: string;
  hours: number;
  billable: boolean;
  note: string;
};

export type CreateInvoiceInput = {
  projectId?: string;
  retainerId?: string;
  amount?: number;
  description?: string;
  title?: string;
  owner?: string;
  billToContactId?: string;
  billToName?: string;
  currency?: string;
  raised?: string;
  due?: string;
  billingThrough?: string;
  poNumber?: string;
  internalDescription?: string;
  templateId?: string;
  terms?: string;
  number?: string;
  lineItems?: InvoiceLineItem[];
  send?: boolean;
};

type Toast = { id: string; message: string; tone?: "success" | "info" | "danger" };

type AppState = {
  companies: Company[];
  companyAssets: CompanyAsset[];
  contacts: Contact[];
  projects: Project[];
  milestones: Milestone[];
  tickets: Ticket[];
  ticketMessages: TicketMessage[];
  tasks: Task[];
  invoices: Invoice[];
  invoiceTemplates: InvoiceTemplate[];
  timeEntries: TimeEntry[];
  notifications: NotificationItem[];
  activities: ActivityItem[];
  retainers: Retainer[];
  retainerPeriods: RetainerPeriod[];
  automations: AutomationRule[];
  emailOutbox: EmailOutboxItem[];
  emailDomains: EmailDomain[];
  expenses: Expense[];
  opportunities: Opportunity[];
  objectives: StrategicObjective[];
  ideas: Idea[];
  portfolios: Portfolio[];
  risks: RiskItem[];
  issues: IssueItem[];
  dependencies: CrossDependency[];
  benefits: Benefit[];
  gates: GovernanceGate[];
  allocations: ResourceAllocation[];
  toasts: Toast[];
  recentlyViewed: { type: string; id: string; label: string }[];
  focusCompanyId: string | null;
  projectWorkflow: ProjectWorkflow;

  pushToast: (message: string, tone?: Toast["tone"]) => void;
  setFocusCompanyId: (id: string | null) => void;
  dismissToast: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  trackView: (type: string, id: string, label: string) => void;
  addActivityNote: (companyId: string, text: string, projectId?: string) => void;
  logActivity: (input: {
    companyId?: string;
    projectId?: string;
    type: ActivityType;
    actor?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    entityLabel?: string;
    href?: string;
    text?: string;
  }) => void;

  createCompany: (input: CreateCompanyInput) => string;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  addCompanyFile: (companyId: string, file: Omit<CompanyFile, "id">) => void;
  deleteCompanyFile: (companyId: string, fileId: string) => void;
  createCompanyAsset: (input: Omit<CompanyAsset, "id">) => string;
  updateCompanyAsset: (id: string, patch: Partial<CompanyAsset>) => void;
  deleteCompanyAsset: (id: string) => void;
  createContact: (input: Omit<Contact, "id" | "initials" | "lastInteraction"> & { primary?: boolean }) => string;
  updateContact: (id: string, patch: Partial<Contact> & { primary?: boolean }) => void;
  addContactNote: (contactId: string, body: string, author?: string) => void;
  setPrimaryContact: (contactId: string) => void;
  linkContactProject: (contactId: string, projectId: string) => void;
  unlinkContactProject: (contactId: string, projectId: string) => void;
  createProject: (input: CreateProjectInput) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  setProjectStatus: (projectId: string, next: ProjectStatus) => boolean;
  setProjectWorkflowTransition: (from: ProjectStatus, to: ProjectStatus, allowed: boolean) => void;
  setProjectWorkflowRoles: (roles: Role[]) => void;
  setProjectRate: (projectId: string, memberName: string, hourlyRate: number) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => string;
  deleteProjectFile: (projectId: string, fileId: string) => void;
  moveProjectFile: (projectId: string, fileId: string, folder: string) => void;
  deleteRetainerFile: (retainerId: string, fileId: string) => void;
  moveRetainerFile: (retainerId: string, fileId: string, folder: string) => void;
  createTicket: (input: CreateTicketInput) => string;
  createTask: (input: CreateTaskInput) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (orderedIds: string[]) => void;
  createMilestone: (
    projectId: string,
    name: string,
    due: string,
    opts?: { kind?: "phase" | "group"; parentId?: string; start?: string },
  ) => string;
  updateMilestone: (id: string, patch: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  addTaskLink: (taskId: string, link: Omit<TaskLink, "id">) => void;
  removeTaskLink: (taskId: string, linkId: string) => void;
  linkFileToTask: (projectId: string, fileId: string, taskId: string) => void;
  updateProjectScope: (projectId: string, scope: ProjectScope) => void;
  team: TeamMember[];
  addTeamMember: (input: Omit<TeamMember, "id" | "initials" | "active"> & { active?: boolean }) => string;
  registerAccount: (input: {
    name: string;
    email: string;
    role?: Role;
    companyId?: string;
    entraOid?: string;
    notifyEmail?: boolean;
  }) => User;
  updateTeamMember: (id: string, patch: Partial<TeamMember>) => void;
  setTeamMemberActive: (id: string, active: boolean) => void;
  addProjectMember: (input: {
    projectId: string;
    memberId: string;
    projectRole: string;
    responsibility: string;
    allocationPct: number;
  }) => string;
  updateProjectMember: (
    id: string,
    patch: Partial<Pick<ResourceAllocation, "projectRole" | "responsibility" | "allocationPct" | "hoursPerWeek" | "start" | "end">>,
  ) => void;
  removeProjectMember: (id: string) => void;
  createTimeEntry: (input: CreateTimeInput) => string;
  createExpense: (input: { vendor: string; projectId: string; amount: number; note: string }) => string;
  createOpportunity: (input: { name: string; companyId: string; amount: number; close: string }) => string;
  advanceOpportunity: (id: string) => void;
  approveExpense: (id: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTicketStatus: (ticketId: string, status: Ticket["status"]) => void;
  updateTicket: (ticketId: string, patch: Partial<Pick<Ticket, "assignee" | "priority" | "subject">>) => void;
  addTicketMessage: (ticketId: string, author: string, body: string, visibility: "client" | "internal") => void;
  submitTimeEntry: (id: string) => void;
  approveTimeEntry: (id: string) => void;
  rejectTimeEntry: (id: string) => void;
  allocateRetainerHours: (id: string, hours: number) => void;
  createRetainer: (input: {
    name: string;
    companyId: string;
    type: RetainerType;
    manager: string;
    contactId?: string;
    budgetHours: number;
    expires: string;
  }) => string;
  updateRetainer: (id: string, patch: Partial<Retainer>) => void;
  deleteRetainer: (id: string) => void;
  addRetainerPeriod: (retainerId: string, start: string, end: string, budgetHours: number) => string;
  createInvoiceDraft: (companyId: string, opts?: CreateInvoiceInput) => string;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  createInvoiceTemplate: (input: Omit<InvoiceTemplate, "id">) => string;
  updateInvoiceTemplate: (id: string, patch: Partial<InvoiceTemplate>) => void;
  generateProjectInvoice: (projectId: string) => string;
  generatePeriodInvoice: (periodId: string) => string;
  addProjectFile: (projectId: string, file: Omit<ProjectFile, "id">) => void;
  addProjectNote: (projectId: string, note: Omit<ProjectNote, "id" | "createdAt">) => void;
  addRetainerFile: (retainerId: string, file: Omit<ProjectFile, "id">) => void;
  addRetainerNote: (retainerId: string, note: Omit<ProjectNote, "id" | "createdAt">) => void;
  addMaterial: (projectId: string, title: string, salePrice: number) => void;
  sendInvoice: (id: string) => void;
  payInvoice: (id: string) => void;
  requestSignoff: (projectId: string, milestoneName: string) => void;
  approveSignoff: (milestoneId: string) => void;
  toggleAutomation: (id: string) => void;
  runAutomation: (id: string) => void;
  queueEmail: (to: string, subject: string, body: string, status?: EmailOutboxItem["status"]) => string;
  addEmailDomain: (input: { domain: string; fromName: string; fromEmail: string }) => string | undefined;
  removeEmailDomain: (id: string) => void;
  setPrimaryEmailDomain: (id: string) => void;
  checkEmailDomain: (id: string) => Promise<EmailDomain | undefined>;
  createObjective: (input: { name: string; owner: string; horizon: string; target: string; description: string }) => string;
  updateObjective: (id: string, patch: Partial<StrategicObjective>) => void;
  createIdea: (input: { name: string; summary: string; submitter: string; requestedBudget: number; companyId?: string; objectiveId?: string }) => string;
  updateIdea: (id: string, patch: Partial<Idea>) => void;
  advanceIdea: (id: string) => void;
  convertIdea: (id: string) => string | undefined;
  createPortfolio: (input: {
    name: string;
    owner: string;
    theme: string;
    budget: number;
    description: string;
    projectIds?: string[];
    objectiveIds?: string[];
  }) => string;
  updatePortfolio: (id: string, patch: Partial<Portfolio>) => void;
  createRisk: (input: { title: string; owner: string; projectId?: string; probability: RiskItem["probability"]; impact: RiskItem["impact"]; mitigation: string; due: string }) => string;
  updateRiskStatus: (id: string, status: RiskStatus) => void;
  updateIssueStatus: (id: string, status: IssueItem["status"]) => void;
  decideGate: (id: string, status: Extract<GateStatus, "Approved" | "Rejected">) => void;
  createDependency: (input: { predecessorProjectId: string; successorProjectId: string; type: CrossDependency["type"]; note: string }) => string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function displayNow() {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const WORKFLOW_KEY = "dmc-pmo-project-workflow";

function loadProjectWorkflow() {
  if (typeof window === "undefined") return DEFAULT_PROJECT_WORKFLOW;
  try {
    const raw = window.localStorage.getItem(WORKFLOW_KEY);
    if (!raw) return DEFAULT_PROJECT_WORKFLOW;
    const parsed = JSON.parse(raw) as ProjectWorkflow;
    if (!parsed?.transitions || !parsed?.changerRoles) return DEFAULT_PROJECT_WORKFLOW;
    return parsed;
  } catch {
    return DEFAULT_PROJECT_WORKFLOW;
  }
}

function persistProjectWorkflow(workflow: ProjectWorkflow) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(WORKFLOW_KEY, JSON.stringify(workflow));
  }
}

function mergeTeam() {
  const extras = readAccountExtras().team;
  const byEmail = new Map(extras.map((m) => [m.email.toLowerCase(), m]));
  const mergedSeed = seedTeam.map((s) => byEmail.get(s.email.toLowerCase()) ?? s);
  const extrasOnly = extras.filter((m) => !seedTeam.some((s) => s.email.toLowerCase() === m.email.toLowerCase()));
  return [...extrasOnly, ...mergedSeed];
}

function persistTeam(team: TeamMember[]) {
  const extras = readAccountExtras();
  writeAccountExtras({ ...extras, team });
}

function currentUser() {
  if (typeof window === "undefined") return undefined;
  const id = window.localStorage.getItem("dmc-pmo-user");
  const base = findAccount(id) ?? users.find((u) => u.id === id);
  if (!base) return undefined;
  try {
    return applyTeamRole(base, useAppStore.getState().team) ?? base;
  } catch {
    return base;
  }
}

function requireCap(get: () => Pick<AppState, "pushToast">, cap: Capability): boolean {
  if (can(currentUser()?.role, cap)) return true;
  get().pushToast("Your role cannot do that.", "danger");
  return false;
}

function requireAny(get: () => Pick<AppState, "pushToast">, ...caps: Capability[]): boolean {
  const role = currentUser()?.role;
  if (caps.some((cap) => can(role, cap))) return true;
  get().pushToast("Your role cannot do that.", "danger");
  return false;
}

function canMutateTask(task: { assignee: string; assigneeInitials?: string }): boolean {
  const user = currentUser();
  if (can(user?.role, "manage_plan")) return true;
  return can(user?.role, "edit_assigned_task") && isAssignedName(user, task.assignee, task.assigneeInitials);
}

function currentActor() {
  return currentUser()?.name ?? "Staff";
}

function activityRecord(
  input: {
    companyId?: string;
    projectId?: string;
    type: ActivityType;
    actor?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    entityLabel?: string;
    href?: string;
    text?: string;
  },
): ActivityItem {
  return makeActivity({
    ...input,
    id: uid("a"),
    actor: input.actor ?? currentActor(),
  });
}

export const useAppStore = create<AppState>((set, get) => ({
  companies: seedCompanies,
  companyAssets: seedCompanyAssets,
  contacts: seedContacts,
  projects: seedProjects,
  milestones: seedMilestones,
  tickets: seedTickets,
  ticketMessages: seedTicketMessages,
  tasks: seedTasks,
  team: mergeTeam(),
  invoices: seedInvoices,
  invoiceTemplates: seedInvoiceTemplates,
  timeEntries: seedTimeEntries,
  notifications: [...readAccountExtras().notes, ...seedNotifications],
  activities: seedActivities,
  retainers: seedRetainers,
  retainerPeriods: seedRetainerPeriods,
  automations: seedAutomations,
  emailOutbox: [...readAccountExtras().mail, ...seedEmailOutbox],
  emailDomains: loadEmailDomains(),
  expenses: seedExpenses,
  opportunities: seedOpportunities,
  objectives: seedObjectives,
  ideas: seedIdeas,
  portfolios: seedPortfolios,
  risks: seedRisks,
  issues: seedIssues,
  dependencies: seedDependencies,
  benefits: seedBenefits,
  gates: seedGates,
  allocations: seedAllocations,
  toasts: [],
  recentlyViewed: [
    { type: "company", id: "c-cascade", label: "Cascade Ventures" },
    { type: "company", id: "c-oakton", label: "Oakton Technologies" },
    { type: "company", id: "c-northridge", label: "Northridge Retail Group" },
  ],
  focusCompanyId: typeof window !== "undefined" ? window.localStorage.getItem("dmc-pmo-focus-company") : null,
  projectWorkflow: loadProjectWorkflow(),

  pushToast: (message, tone = "success") => {
    const id = uid("toast");
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    window.setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setFocusCompanyId: (id) => {
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem("dmc-pmo-focus-company", id);
      else window.localStorage.removeItem("dmc-pmo-focus-company");
    }
    set({ focusCompanyId: id });
  },
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  trackView: (type, id, label) =>
    set((s) => ({
      recentlyViewed: [{ type, id, label }, ...s.recentlyViewed.filter((r) => !(r.type === type && r.id === id))].slice(0, 8),
    })),

  addActivityNote: (companyId, text, projectId) => {
    if (!requireCap(get, "add_note")) return;
    const project = projectId ? get().projects.find((p) => p.id === projectId) : undefined;
    get().logActivity({
      type: "comment",
      action: text,
      companyId,
      projectId,
      entityType: project ? "project" : "company",
      entityId: projectId ?? companyId,
      entityLabel: project?.name ?? get().companies.find((c) => c.id === companyId)?.name,
      href: projectId ? `/app/projects/view/?id=${projectId}` : `/app/companies/view/?id=${companyId}`,
    });
    get().pushToast("Note saved to activity");
  },
  logActivity: (input) => {
    const event = activityRecord(input);
    set((s) => ({
      activities: [event, ...s.activities],
      companies: event.companyId
        ? s.companies.map((c) =>
            c.id === event.companyId ? { ...c, lastActivity: formatDisplayDate(todayIso()) } : c,
          )
        : s.companies,
    }));
  },

  createCompany: (input) => {
    if (!requireCap(get, "create_company")) return "";
    const id = uid("c");
    const managers = input.accountManagers?.filter(Boolean).length
      ? input.accountManagers.filter(Boolean)
      : [input.accountManager];
    const company: Company = {
      id,
      name: input.name,
      initials: initialsFromName(input.name),
      status: input.status,
      accountManager: managers[0] ?? input.accountManager,
      openProjects: 0,
      openTickets: 0,
      lastActivity: formatDisplayDate(todayIso()),
      industry: input.industry,
      billingTerms: input.billingTerms,
      portalContacts: 0,
      accountManagers: managers,
      website: input.website ?? "",
      phone: input.phone ?? "",
      fax: input.fax ?? "",
      email: input.email ?? "",
      address: input.address ?? "",
      addresses: input.addresses ?? [],
      tags: input.tags ?? (input.industry ? [input.industry] : []),
      privacy: input.privacy ?? "Standard",
      customFields: input.customFields ?? [],
      notes: input.notes ?? "",
      files: [],
      createdAt: todayIso(),
    };
    set((s) => ({
      companies: [company, ...s.companies],
      activities: [
        activityRecord({
          type: "status",
          actor: input.accountManager,
          action: "created the company",
          companyId: id,
          entityType: "company",
          entityId: id,
          entityLabel: company.name,
          href: `/app/companies/view/?id=${id}`,
        }),
        ...s.activities,
      ],
    }));
    get().pushToast(`Company ${company.name} created`);
    return id;
  },

  updateCompany: (id, patch) => {
    if (!requireCap(get, "edit_company")) return;
    const prev = get().companies.find((c) => c.id === id);
    set((s) => ({
      companies: s.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
    if (prev && patch.status && patch.status !== prev.status) {
      get().logActivity({
        type: "status",
        action: `changed company status to ${patch.status}`,
        companyId: id,
        entityType: "company",
        entityId: id,
        entityLabel: prev.name,
        href: `/app/companies/view/?id=${id}`,
      });
    }
    get().pushToast("Company updated");
  },
  addCompanyFile: (companyId, file) => {
    if (!requireCap(get, "manage_files")) return;
    set((s) => ({
      companies: s.companies.map((c) =>
        c.id === companyId ? { ...c, files: [{ id: uid("cf"), ...file }, ...(c.files ?? [])] } : c,
      ),
      activities: [
        activityRecord({
          type: "file",
          action: "uploaded a file",
          companyId,
          entityType: "file",
          entityId: file.name,
          entityLabel: file.name,
          href: `/app/companies/view/?id=${companyId}`,
        }),
        ...s.activities,
      ],
    }));
    get().pushToast("Attachment added");
  },
  deleteCompanyFile: (companyId, fileId) => {
    if (!requireCap(get, "manage_files")) return;
    set((s) => ({
      companies: s.companies.map((c) =>
        c.id === companyId ? { ...c, files: (c.files ?? []).filter((f) => f.id !== fileId) } : c,
      ),
    }));
    get().pushToast("Attachment removed");
  },
  createCompanyAsset: (input) => {
    if (!requireCap(get, "edit_company")) return "";
    const id = uid("ca");
    const asset: CompanyAsset = { id, ...input };
    set((s) => ({
      companyAssets: [asset, ...s.companyAssets],
      activities: [
        activityRecord({
          type: "project",
          action: "added an asset",
          companyId: input.companyId,
          projectId: input.projectId,
          entityType: "asset",
          entityId: id,
          entityLabel: asset.name,
          href: `/app/companies/view/?id=${input.companyId}`,
        }),
        ...s.activities,
      ],
    }));
    get().pushToast(`Asset ${asset.name} added`);
    return id;
  },
  updateCompanyAsset: (id, patch) => {
    if (!requireCap(get, "edit_company")) return;
    set((s) => ({
      companyAssets: s.companyAssets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  },
  deleteCompanyAsset: (id) => {
    if (!requireCap(get, "edit_company")) return;
    const asset = get().companyAssets.find((a) => a.id === id);
    set((s) => ({ companyAssets: s.companyAssets.filter((a) => a.id !== id) }));
    if (asset) get().pushToast(`Asset ${asset.name} removed`);
  },

  createContact: (input) => {
    if (!requireCap(get, "create_contact")) return "";
    const id = uid("ct");
    const company = get().companies.find((c) => c.id === input.companyId);
    const { primary, ...fields } = input;
    const contact: Contact = {
      id,
      ...fields,
      companyName: company?.name ?? input.companyName,
      initials: initialsFromName(input.name),
      lastInteraction: formatDisplayDate(todayIso()),
      phone: input.phone ?? "",
      notes: input.notes ?? "",
      noteItems: input.noteItems ?? [],
      projectIds: input.projectIds,
    };
    set((s) => ({
      contacts: [contact, ...s.contacts],
      companies: s.companies.map((c) =>
        c.id === input.companyId
          ? {
              ...c,
              portalContacts: input.portal === "Enabled" ? c.portalContacts + 1 : c.portalContacts,
              lastActivity: formatDisplayDate(todayIso()),
              primaryContactId: primary || !c.primaryContactId ? id : c.primaryContactId,
            }
          : c,
      ),
    }));
    get().logActivity({
      type: "status",
      action: "created the contact",
      companyId: contact.companyId,
      entityType: "contact",
      entityId: id,
      entityLabel: contact.name,
      href: `/app/contacts/view/?id=${id}`,
    });
    get().pushToast(`Contact ${contact.name} created`);
    return id;
  },

  updateContact: (id, patch) => {
    if (!requireCap(get, "edit_contact")) return;
    const prev = get().contacts.find((c) => c.id === id);
    if (!prev) return;
    const { primary, ...fields } = patch;
    const nextCompany = fields.companyId ? get().companies.find((c) => c.id === fields.companyId) : undefined;
    const next: Contact = {
      ...prev,
      ...fields,
      initials: fields.name ? initialsFromName(fields.name) : prev.initials,
      companyName: nextCompany?.name ?? fields.companyName ?? prev.companyName,
      lastInteraction: formatDisplayDate(todayIso()),
    };
    set((s) => ({
      contacts: s.contacts.map((c) => (c.id === id ? next : c)),
      companies: s.companies.map((c) => {
        if (c.id === prev.companyId && prev.companyId !== next.companyId) {
          return {
            ...c,
            portalContacts:
              prev.portal === "Enabled" ? Math.max(0, c.portalContacts - 1) : c.portalContacts,
            primaryContactId: c.primaryContactId === id ? undefined : c.primaryContactId,
          };
        }
        if (c.id === next.companyId) {
          let portalContacts = c.portalContacts;
          if (prev.companyId !== next.companyId) {
            portalContacts = next.portal === "Enabled" ? portalContacts + 1 : portalContacts;
          } else if (fields.portal && fields.portal !== prev.portal) {
            portalContacts = fields.portal === "Enabled" ? portalContacts + 1 : Math.max(0, portalContacts - 1);
          }
          return {
            ...c,
            portalContacts,
            lastActivity: formatDisplayDate(todayIso()),
            primaryContactId: primary ? id : primary === false && c.primaryContactId === id ? undefined : c.primaryContactId,
          };
        }
        return c;
      }),
    }));
    if (fields.companyId && fields.companyId !== prev.companyId) {
      get().logActivity({
        type: "status",
        action: `moved contact to ${next.companyName}`,
        companyId: next.companyId,
        entityType: "contact",
        entityId: id,
        entityLabel: next.name,
        href: `/app/contacts/view/?id=${id}`,
      });
    } else {
      get().logActivity({
        type: "status",
        action: "updated contact details",
        companyId: next.companyId,
        entityType: "contact",
        entityId: id,
        entityLabel: next.name,
        href: `/app/contacts/view/?id=${id}`,
      });
    }
    get().pushToast("Contact updated");
  },

  addContactNote: (contactId, body, author) => {
    if (!requireAny(get, "edit_contact", "add_note")) return;
    const contact = get().contacts.find((c) => c.id === contactId);
    if (!contact || !body.trim()) return;
    const note: ContactNote = {
      id: uid("cn"),
      author: author ?? currentActor(),
      body: body.trim(),
      createdAt: formatDisplayDate(todayIso()),
    };
    set((s) => ({
      contacts: s.contacts.map((c) =>
        c.id === contactId
          ? { ...c, lastInteraction: note.createdAt, noteItems: [note, ...(c.noteItems ?? [])] }
          : c,
      ),
    }));
    get().logActivity({
      type: "comment",
      actor: note.author,
      action: note.body,
      companyId: contact.companyId,
      entityType: "contact",
      entityId: contactId,
      entityLabel: contact.name,
      href: `/app/contacts/view/?id=${contactId}`,
    });
    get().pushToast("Note saved to contact");
  },

  setPrimaryContact: (contactId) => {
    if (!requireCap(get, "edit_contact")) return;
    const contact = get().contacts.find((c) => c.id === contactId);
    if (!contact) return;
    set((s) => ({
      companies: s.companies.map((c) =>
        c.id === contact.companyId ? { ...c, primaryContactId: contactId } : c,
      ),
      contacts: s.contacts.map((c) =>
        c.id === contactId ? { ...c, lastInteraction: formatDisplayDate(todayIso()) } : c,
      ),
    }));
    get().logActivity({
      type: "status",
      action: "set as primary contact",
      companyId: contact.companyId,
      entityType: "contact",
      entityId: contactId,
      entityLabel: contact.name,
      href: `/app/contacts/view/?id=${contactId}`,
    });
    get().pushToast(`${contact.name} is now the primary contact`);
  },

  linkContactProject: (contactId, projectId) => {
    if (!requireCap(get, "edit_contact")) return;
    const contact = get().contacts.find((c) => c.id === contactId);
    const project = get().projects.find((p) => p.id === projectId);
    if (!contact || !project) return;
    const current = contact.projectIds?.length
      ? contact.projectIds
      : get().projects.filter((p) => p.companyId === contact.companyId).map((p) => p.id);
    if (current.includes(projectId)) return;
    set((s) => ({
      contacts: s.contacts.map((c) =>
        c.id === contactId
          ? { ...c, projectIds: [...current, projectId], lastInteraction: formatDisplayDate(todayIso()) }
          : c,
      ),
    }));
    get().logActivity({
      type: "project",
      action: `linked to ${project.name}`,
      companyId: contact.companyId,
      projectId,
      entityType: "contact",
      entityId: contactId,
      entityLabel: contact.name,
      href: `/app/contacts/view/?id=${contactId}`,
    });
    get().pushToast(`Linked ${project.name}`);
  },

  unlinkContactProject: (contactId, projectId) => {
    if (!requireCap(get, "edit_contact")) return;
    const contact = get().contacts.find((c) => c.id === contactId);
    const project = get().projects.find((p) => p.id === projectId);
    if (!contact) return;
    const current = contact.projectIds?.length
      ? contact.projectIds
      : get().projects.filter((p) => p.companyId === contact.companyId).map((p) => p.id);
    set((s) => ({
      contacts: s.contacts.map((c) =>
        c.id === contactId
          ? { ...c, projectIds: current.filter((id) => id !== projectId), lastInteraction: formatDisplayDate(todayIso()) }
          : c,
      ),
    }));
    if (project) get().pushToast(`Removed ${project.name}`);
  },

  createProject: (input) => {
    if (!requireCap(get, "create_project")) return "";
    const company = get().companies.find((c) => c.id === input.companyId);
    if (!company) return "";
    const id = uid("p");
    const project: Project = {
      id,
      name: input.name,
      companyId: company.id,
      companyName: company.name,
      manager: input.manager,
      progress: 0,
      status: "Draft",
      due: input.due,
      start: todayIso(),
      budgetHours: input.budgetHours,
      loggedHours: 0,
      marginPct: 35,
      portalShared: true,
      portalContacts: company.portalContacts,
      projectType: "Client Work",
      description: "",
      budgetAmount: input.budgetHours * 180,
      materials: [],
      files: [],
      notes: [],
      rates: [],
      statusHistory: [],
      scope: {
        objectives: "",
        inScope: [],
        outOfScope: [],
        deliverables: [],
        assumptions: [],
      },
    };
    set((s) => ({
      projects: [project, ...s.projects],
      companies: s.companies.map((c) =>
        c.id === company.id ? { ...c, openProjects: c.openProjects + 1, lastActivity: formatDisplayDate(todayIso()) } : c,
      ),
    }));
    get().logActivity({
      type: "project",
      actor: input.manager,
      action: "created the project",
      companyId: company.id,
      projectId: id,
      entityType: "project",
      entityId: id,
      entityLabel: project.name,
      href: `/app/projects/view/?id=${id}`,
    });
    get().pushToast(`Project ${project.name} created`);
    return id;
  },

  setProjectStatus: (projectId, nextRaw) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return false;
    const from = normalizeProjectStatus(project.status);
    const next = normalizeProjectStatus(nextRaw);
    if (from === next) return true;
    const user = currentUser();
    if (!canChangeProjectStatus(user?.role, get().projectWorkflow)) {
      get().pushToast("You are not allowed to change project status", "danger");
      return false;
    }
    if (!isValidProjectTransition(from, next, get().projectWorkflow)) {
      get().pushToast(`Cannot move from ${from} to ${next}`, "danger");
      return false;
    }
    const actor = user?.name ?? currentActor();
    const at = new Date().toISOString();
    const when = displayNow();
    const change: ProjectStatusChange = {
      id: uid("sh"),
      from,
      to: next,
      actor,
      at,
      when,
    };
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, status: next, statusHistory: [...(p.statusHistory ?? []), change] }
          : p,
      ),
    }));
    get().logActivity({
      type: "status",
      actor,
      action: `moved status from ${from} to ${next}`,
      companyId: project.companyId,
      projectId,
      entityType: "project",
      entityId: projectId,
      entityLabel: project.name,
      href: `/app/projects/view/?id=${projectId}`,
    });
    get().pushToast(`Status moved to ${next}`);
    return true;
  },
  setProjectWorkflowTransition: (from, to, allowed) => {
    if (!requireCap(get, "configure_lifecycle")) return;
    const projectWorkflow = toggleWorkflowTransition(get().projectWorkflow, from, to, allowed);
    persistProjectWorkflow(projectWorkflow);
    set({ projectWorkflow });
    get().pushToast(allowed ? `Allowed ${from} to ${to}` : `Blocked ${from} to ${to}`);
  },
  setProjectWorkflowRoles: (roles) => {
    if (!requireCap(get, "configure_lifecycle")) return;
    const changerRoles: Role[] = roles.includes("admin") ? roles : ["admin", ...roles];
    const projectWorkflow = { ...get().projectWorkflow, changerRoles };
    persistProjectWorkflow(projectWorkflow);
    set({ projectWorkflow });
    get().pushToast("Lifecycle roles updated");
  },

  updateProject: (id, patch) => {
    if (!requireCap(get, "edit_project")) return;
    const prev = get().projects.find((p) => p.id === id);
    const { status: nextStatus, ...rest } = patch;
    if (nextStatus && prev && normalizeProjectStatus(nextStatus) !== normalizeProjectStatus(prev.status)) {
      if (!get().setProjectStatus(id, nextStatus)) {
        if (!Object.keys(rest).length) return;
      }
    }
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...rest } : p)),
    }));
    if (prev) {
      if (
        (patch.budgetAmount !== undefined && patch.budgetAmount !== prev.budgetAmount) ||
        (patch.budgetHours !== undefined && patch.budgetHours !== prev.budgetHours)
      ) {
        get().logActivity({
          type: "budget",
          action:
            patch.budgetAmount !== undefined
              ? `changed budget to $${patch.budgetAmount.toLocaleString()}`
              : `changed hour budget to ${patch.budgetHours}h`,
          companyId: prev.companyId,
          projectId: id,
          entityType: "project",
          entityId: id,
          entityLabel: prev.name,
          href: `/app/projects/view/?id=${id}`,
        });
      } else if (patch.name || patch.due || patch.start || patch.description) {
        get().logActivity({
          type: "project",
          action: "updated project details",
          companyId: prev.companyId,
          projectId: id,
          entityType: "project",
          entityId: id,
          entityLabel: patch.name ?? prev.name,
          href: `/app/projects/view/?id=${id}`,
        });
      }
    }
    get().pushToast("Project updated");
  },

  deleteProject: (id) => {
    if (!requireCap(get, "delete_project")) return;
    const project = get().projects.find((p) => p.id === id);
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.filter((t) => t.projectId !== id),
      milestones: s.milestones.filter((m) => m.projectId !== id),
      companies: project
        ? s.companies.map((c) =>
            c.id === project.companyId ? { ...c, openProjects: Math.max(0, c.openProjects - 1) } : c,
          )
        : s.companies,
    }));
    get().pushToast("Project deleted", "danger");
  },

  duplicateProject: (id) => {
    if (!requireCap(get, "create_project")) return "";
    const source = get().projects.find((p) => p.id === id);
    if (!source) return "";
    const newId = uid("p");
    const msMap = new Map<string, string>();
    get()
      .milestones.filter((m) => m.projectId === id)
      .forEach((m) => msMap.set(m.id, uid("m")));
    const newMilestones = get()
      .milestones.filter((m) => m.projectId === id)
      .map((m) => ({
        ...m,
        id: msMap.get(m.id)!,
        projectId: newId,
        parentId: m.parentId ? msMap.get(m.parentId) : undefined,
        status: "Not Started" as const,
      }));
    const newTasks = get()
      .tasks.filter((t) => t.projectId === id)
      .map((t) => ({
        ...t,
        id: uid("tk"),
        projectId: newId,
        projectName: `${source.name} (copy)`,
        milestoneId: t.milestoneId ? msMap.get(t.milestoneId) : undefined,
        status: "Not Started" as const,
        progress: 0,
        links: t.links.map((l) => ({ ...l, id: uid("tl") })),
      }));
    const project: Project = {
      ...source,
      id: newId,
      name: `${source.name} (copy)`,
      progress: 0,
      status: "Draft",
      loggedHours: 0,
      materials: source.materials.map((m) => ({ ...m, id: uid("mat") })),
      files: [],
      notes: [],
      statusHistory: [],
      scope: { ...source.scope, inScope: [...source.scope.inScope], outOfScope: [...source.scope.outOfScope], deliverables: [...source.scope.deliverables], assumptions: [...source.scope.assumptions] },
    };
    set((s) => ({
      projects: [project, ...s.projects],
      milestones: [...newMilestones, ...s.milestones],
      tasks: [...newTasks, ...s.tasks],
      companies: s.companies.map((c) =>
        c.id === source.companyId ? { ...c, openProjects: c.openProjects + 1 } : c,
      ),
    }));
    get().pushToast("Project duplicated");
    return newId;
  },

  createTicket: (input) => {
    if (!requireCap(get, "create_ticket")) return "";
    const company = get().companies.find((c) => c.id === input.companyId);
    if (!company) return "";
    const number = Math.max(...get().tickets.map((t) => t.number), 1000) + 1;
    const id = uid("t");
    const ticket: Ticket = {
      id,
      number,
      subject: input.subject,
      companyId: company.id,
      companyName: company.name,
      projectId: input.projectId,
      priority: input.priority,
      assignee: input.assignee,
      slaDue: "1d",
      status: "Open",
      submitted: todayIso(),
    };
    set((s) => ({
      tickets: [ticket, ...s.tickets],
      companies: s.companies.map((c) =>
        c.id === company.id ? { ...c, openTickets: c.openTickets + 1 } : c,
      ),
      notifications: [
        {
          id: uid("n"),
          title: "New ticket",
          body: `#${number} ${input.subject}`,
          createdAt: displayNow(),
          read: false,
          href: `/app/tickets/view/?id=${id}`,
        },
        ...s.notifications,
      ],
    }));
    get().pushToast(`Ticket #${number} created`);
    return id;
  },

  createTask: (input) => {
    if (!requireCap(get, "create_task")) return "";
    const project = get().projects.find((p) => p.id === input.projectId);
    if (!project) return "";
    const id = uid("tk");
    const task: Task = {
      id,
      name: input.name,
      projectId: project.id,
      projectName: project.name,
      milestoneId: input.milestoneId,
      assignee: input.assignee,
      assigneeInitials: initialsFromName(input.assignee),
      status: input.status ?? "Not Started",
      priority: input.priority ?? "Med",
      progress: input.status === "Done" ? 100 : 0,
      due: input.due,
      start: input.start ?? todayIso(),
      clientEditable: false,
      estimateHours: input.estimateHours ?? 4,
      budgetAmount: input.budgetAmount,
      parentTaskId: input.parentTaskId,
      sortOrder: get().tasks.filter((t) =>
        input.parentTaskId
          ? t.parentTaskId === input.parentTaskId
          : t.projectId === project.id && t.milestoneId === input.milestoneId && !t.parentTaskId,
      ).length,
      links: [],
    };
    set((s) => ({ tasks: [task, ...s.tasks] }));
    get().logActivity({
      type: "task",
      actor: input.assignee,
      action: "created a task",
      companyId: project.companyId,
      projectId: project.id,
      entityType: "task",
      entityId: id,
      entityLabel: task.name,
      href: `/app/projects/view/?id=${project.id}`,
    });
    get().pushToast(`Task created on ${project.name}`);
    return id;
  },

  updateTask: (id, patch) => {
    const prev = get().tasks.find((t) => t.id === id);
    if (!prev || !canMutateTask(prev)) {
      get().pushToast("Your role cannot do that.", "danger");
      return;
    }
    set((s) => {
      const tasks = s.tasks.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...patch };
        if (patch.status === "Done") next.progress = 100;
        if (patch.assignee) next.assigneeInitials = initialsFromName(patch.assignee);
        return next;
      });
      const task = tasks.find((t) => t.id === id);
      if (!task) return { tasks };
      const projectTasks = tasks.filter((t) => t.projectId === task.projectId);
      const progress = projectTasks.length
        ? Math.round(projectTasks.reduce((sum, t) => sum + t.progress, 0) / projectTasks.length)
        : 0;
      return {
        tasks,
        projects: s.projects.map((p) => (p.id === task.projectId ? { ...p, progress } : p)),
      };
    });
    if (prev) {
      const project = get().projects.find((p) => p.id === prev.projectId);
      if (patch.status && patch.status !== prev.status) {
        get().logActivity({
          type: "task",
          actor: prev.assignee,
          action: `moved task to ${patch.status}`,
          companyId: project?.companyId,
          projectId: prev.projectId,
          entityType: "task",
          entityId: id,
          entityLabel: prev.name,
          href: `/app/projects/view/?id=${prev.projectId}`,
        });
      } else if (patch.name || patch.assignee || patch.due) {
        get().logActivity({
          type: "task",
          action: "updated a task",
          companyId: project?.companyId,
          projectId: prev.projectId,
          entityType: "task",
          entityId: id,
          entityLabel: patch.name ?? prev.name,
          href: `/app/projects/view/?id=${prev.projectId}`,
        });
      }
    }
  },

  deleteTask: (id) => {
    if (!requireCap(get, "manage_plan")) return;
    set((s) => {
      const remove = new Set([id, ...s.tasks.filter((t) => t.parentTaskId === id).map((t) => t.id)]);
      return { tasks: s.tasks.filter((t) => !remove.has(t.id)) };
    });
    get().pushToast("Task deleted", "danger");
  },

  reorderTasks: (orderedIds) => {
    if (!requireCap(get, "manage_plan")) return;
    set((s) => ({
      tasks: s.tasks.map((task) => {
        const index = orderedIds.indexOf(task.id);
        return index >= 0 ? { ...task, sortOrder: index } : task;
      }),
    }));
  },

  createMilestone: (projectId, name, due, opts) => {
    if (!requireCap(get, "manage_plan")) return "";
    const id = uid("m");
    const kind = opts?.kind ?? (opts?.parentId ? "group" : "phase");
    set((s) => ({
      milestones: [
        {
          id,
          projectId,
          name,
          due,
          start: opts?.start ?? todayIso(),
          status: "Not Started",
          kind,
          parentId: opts?.parentId,
        },
        ...s.milestones,
      ],
    }));
    const project = get().projects.find((p) => p.id === projectId);
    get().logActivity({
      type: "milestone",
      action: kind === "phase" ? "added a phase" : "added a workstream",
      companyId: project?.companyId,
      projectId,
      entityType: "milestone",
      entityId: id,
      entityLabel: name,
      href: `/app/projects/view/?id=${projectId}`,
    });
    get().pushToast(kind === "phase" ? "Phase added" : "Workstream added");
    return id;
  },

  updateMilestone: (id, patch) => {
    if (!requireCap(get, "manage_plan")) return;
    const prev = get().milestones.find((m) => m.id === id);
    set((s) => ({
      milestones: s.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
    if (prev && (patch.name || patch.status || patch.due || patch.start)) {
      const project = get().projects.find((p) => p.id === prev.projectId);
      get().logActivity({
        type: "milestone",
        action: patch.status && patch.status !== prev.status ? `updated milestone to ${patch.status}` : "updated a milestone",
        companyId: project?.companyId,
        projectId: prev.projectId,
        entityType: "milestone",
        entityId: id,
        entityLabel: patch.name ?? prev.name,
        href: `/app/projects/view/?id=${prev.projectId}`,
      });
    }
  },

  deleteMilestone: (id) => {
    if (!requireCap(get, "manage_plan")) return;
    set((s) => {
      const childIds = s.milestones.filter((m) => m.parentId === id).map((m) => m.id);
      const remove = new Set([id, ...childIds]);
      return {
        milestones: s.milestones.filter((m) => !remove.has(m.id)),
        tasks: s.tasks.map((t) =>
          t.milestoneId && remove.has(t.milestoneId) ? { ...t, milestoneId: undefined } : t,
        ),
      };
    });
    get().pushToast("Plan item deleted", "danger");
  },

  addTaskLink: (taskId, link) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task || !canMutateTask(task)) {
      get().pushToast("Your role cannot do that.", "danger");
      return;
    }
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, links: [{ id: uid("tl"), ...link }, ...t.links] } : t,
      ),
    }));
    get().pushToast("Link added to task");
  },

  removeTaskLink: (taskId, linkId) => {
    if (!requireCap(get, "manage_plan")) return;
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, links: t.links.filter((l) => l.id !== linkId) } : t,
      ),
    }));
  },

  linkFileToTask: (projectId, fileId, taskId) => {
    if (!requireAny(get, "manage_plan", "manage_files")) return;
    const file = get().projects.find((p) => p.id === projectId)?.files.find((f) => f.id === fileId);
    if (!file) return;
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              files: p.files.map((f) =>
                f.id === fileId
                  ? { ...f, linkedTaskIds: Array.from(new Set([...(f.linkedTaskIds ?? []), taskId])) }
                  : f,
              ),
            }
          : p,
      ),
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              links: t.links.some((l) => l.fileId === fileId)
                ? t.links
                : [
                    {
                      id: uid("tl"),
                      type: file.kind === "img" ? "image" : "file",
                      label: file.name,
                      href: `#${fileId}`,
                      fileId,
                    },
                    ...t.links,
                  ],
            }
          : t,
      ),
    }));
    get().pushToast(`Linked ${file.name} to task`);
  },

  updateProjectScope: (projectId, scope) => {
    if (!requireCap(get, "edit_project")) return;
    set((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, scope } : p)),
    }));
    get().pushToast("Scope updated");
  },

  setProjectRate: (projectId, memberName, hourlyRate) => {
    if (!requireCap(get, "manage_rates")) return;
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;
    const rates = [
      ...(project.rates ?? []).filter((row) => row.memberName !== memberName),
      { memberName, hourlyRate },
    ];
    set((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, rates } : p)),
    }));
    get().logActivity({
      type: "budget",
      action: `set ${memberName} rate to $${hourlyRate}/h`,
      companyId: project.companyId,
      projectId,
      entityType: "project",
      entityId: projectId,
      entityLabel: project.name,
      href: `/app/projects/view/?id=${projectId}`,
    });
    get().pushToast(`Rate updated for ${memberName}`);
  },

  addTeamMember: (input) => {
    if (currentUser() && !requireCap(get, "manage_users")) return "";
    const id = uid("tm");
    const member: TeamMember = {
      id,
      name: input.name,
      firstName: input.firstName,
      lastName: input.lastName,
      title: input.title,
      email: input.email,
      phone: input.phone,
      mobile: input.mobile,
      role: input.role,
      initials: initialsFromName(input.name),
      active: input.active ?? true,
      billRate: input.billRate,
      costRate: input.costRate,
      managerId: input.managerId,
      department: input.department,
      skills: input.skills,
      timezone: input.timezone,
      startDate: input.startDate,
      username: input.username,
      financialVisibility: input.financialVisibility,
      avatarUrl: input.avatarUrl ?? `https://i.pravatar.cc/128?u=${encodeURIComponent(input.email)}`,
    };
    set((s) => ({ team: [member, ...s.team] }));
    persistTeam(get().team);
    get().pushToast(`${member.name} added`);
    return id;
  },

  registerAccount: (input) => {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim() || email;
    const role = input.role ?? "staff";
    const notifyEmail = input.notifyEmail ?? true;
    const isNew = !findAccountByEmail(email);
    const user = upsertDirectoryUser({
      name,
      email,
      role,
      companyId: input.companyId,
      entraOid: input.entraOid,
      notifyEmail,
    });
    const alreadyOnTeam = get().team.some((m) => m.email.toLowerCase() === email);
    if (role !== "client" && !alreadyOnTeam) {
      const [firstName, ...rest] = name.split(" ");
      get().addTeamMember({
        name,
        firstName,
        lastName: rest.join(" "),
        title: role === "admin" ? "Administrator" : "Team member",
        email,
        role,
        billRate: 0,
        costRate: 0,
        department: "PMO",
        username: email.split("@")[0],
        financialVisibility: "hours",
        avatarUrl: user.avatarUrl,
      });
    }
    if (isNew && notifyEmail) {
      get().queueEmail(
        email,
        "Welcome to DMC PMO",
        `Hi ${name.split(" ")[0] || "there"},\n\nYour DMC PMO account is ready. We will send workspace notifications to ${email}. Sign in with Microsoft Entra ID using this same address.\n\nOpen the workspace: ${typeof window !== "undefined" ? window.location.origin : ""}/login/\n`,
      );
      set((s) => ({
        notifications: [
          {
            id: uid("n"),
            title: "Welcome to DMC PMO",
            body: `Account created for ${email}. Notifications will go to this address.`,
            createdAt: displayNow(),
            read: false,
            href: "/app/settings",
          },
          ...s.notifications,
        ],
      }));
    }
    const extras = readAccountExtras();
    const welcomeMail = get().emailOutbox.filter((e) => e.subject.includes("Welcome to DMC PMO"));
    const welcomeNotes = get().notifications.filter((n) => n.title === "Welcome to DMC PMO");
    writeAccountExtras({
      team: get().team,
      mail: [...welcomeMail, ...extras.mail.filter((e) => !welcomeMail.some((w) => w.id === e.id))],
      notes: [...welcomeNotes, ...extras.notes.filter((n) => !welcomeNotes.some((w) => w.id === n.id))],
    });
    get().pushToast(isNew ? `Account ready for ${email}` : `Signed in as ${email}`);
    return user;
  },

  updateTeamMember: (id, patch) => {
    if (!requireCap(get, "manage_users")) return;
    set((s) => ({
      team: s.team.map((m) => (m.id === id ? { ...m, ...patch, initials: patch.name ? initialsFromName(patch.name) : m.initials } : m)),
    }));
    persistTeam(get().team);
    get().pushToast("Team member updated");
  },

  setTeamMemberActive: (id, active) => {
    if (!requireCap(get, "manage_users")) return;
    set((s) => ({ team: s.team.map((m) => (m.id === id ? { ...m, active } : m)) }));
    persistTeam(get().team);
    get().pushToast(active ? "Member reactivated" : "Member deactivated", active ? "success" : "danger");
  },
  addProjectMember: (input) => {
    if (!requireCap(get, "manage_project_team")) return "";
    const project = get().projects.find((p) => p.id === input.projectId);
    const member = get().team.find((m) => m.id === input.memberId);
    if (!project || !member) return "";
    if (get().allocations.some((row) => row.projectId === project.id && row.memberId === member.id)) {
      get().pushToast(`${member.name} is already on this team`, "info");
      return "";
    }
    const id = uid("al");
    const allocationPct = Math.max(0, input.allocationPct);
    const allocation: ResourceAllocation = {
      id,
      memberId: member.id,
      memberName: member.name,
      projectId: project.id,
      projectName: project.name,
      allocationPct,
      hoursPerWeek: weeklyHoursFromAllocation(allocationPct),
      start: project.start,
      end: project.due,
      projectRole: input.projectRole,
      responsibility: input.responsibility,
    };
    set((s) => ({ allocations: [allocation, ...s.allocations] }));
    get().logActivity({
      type: "project",
      action: `added ${member.name} to the team`,
      companyId: project.companyId,
      projectId: project.id,
      entityType: "project",
      entityId: project.id,
      entityLabel: project.name,
      href: `/app/projects/view/?id=${project.id}`,
    });
    get().pushToast(`${member.name} added to the team`);
    return id;
  },
  updateProjectMember: (id, patch) => {
    if (!requireCap(get, "manage_project_team")) return;
    const prev = get().allocations.find((row) => row.id === id);
    const nextPatch = { ...patch };
    if (nextPatch.allocationPct !== undefined) {
      nextPatch.hoursPerWeek = weeklyHoursFromAllocation(nextPatch.allocationPct);
    }
    set((s) => ({
      allocations: s.allocations.map((row) => (row.id === id ? { ...row, ...nextPatch } : row)),
    }));
    if (prev) {
      const project = get().projects.find((p) => p.id === prev.projectId);
      get().logActivity({
        type: "project",
        action: `updated ${prev.memberName} on the team`,
        companyId: project?.companyId,
        projectId: prev.projectId,
        entityType: "project",
        entityId: prev.projectId,
        entityLabel: project?.name ?? prev.projectName,
        href: `/app/projects/view/?id=${prev.projectId}`,
      });
    }
    get().pushToast("Team assignment updated");
  },
  removeProjectMember: (id) => {
    if (!requireCap(get, "manage_project_team")) return;
    const prev = get().allocations.find((row) => row.id === id);
    set((s) => ({ allocations: s.allocations.filter((row) => row.id !== id) }));
    if (prev) {
      const project = get().projects.find((p) => p.id === prev.projectId);
      get().logActivity({
        type: "project",
        action: `removed ${prev.memberName} from the team`,
        companyId: project?.companyId,
        projectId: prev.projectId,
        entityType: "project",
        entityId: prev.projectId,
        entityLabel: project?.name ?? prev.projectName,
        href: `/app/projects/view/?id=${prev.projectId}`,
      });
      get().pushToast(`${prev.memberName} removed from the team`);
    }
  },

  createTimeEntry: (input) => {
    if (!requireCap(get, "log_time")) return "";
    const actor = currentUser();
    if (actor?.role === "staff" && input.userName !== actor.name && input.userName !== "J. Kim") {
      get().pushToast("Staff can only log their own time.", "danger");
      return "";
    }
    const project = get().projects.find((p) => p.id === input.projectId);
    if (!project) return "";
    const task = get().tasks.find((t) => t.id === input.taskId);
    const id = uid("te");
    const entry: TimeEntry = {
      id,
      userName: input.userName,
      projectId: project.id,
      projectName: project.name,
      taskId: task?.id,
      taskName: task?.name,
      date: input.date,
      start: input.start,
      hours: input.hours,
      billable: input.billable,
      note: input.note,
      status: "Draft",
    };
    set((s) => ({
      timeEntries: [entry, ...s.timeEntries],
      projects: s.projects.map((p) =>
        p.id === project.id ? { ...p, loggedHours: p.loggedHours + input.hours } : p,
      ),
      activities: [
        activityRecord({
          type: "time",
          actor: input.userName,
          action: `logged ${input.hours}h`,
          companyId: project.companyId,
          projectId: project.id,
          entityType: task ? "task" : "project",
          entityId: id,
          entityLabel: task?.name ?? project.name,
          href: `/app/projects/view/?id=${project.id}`,
          text: `${input.userName} logged ${input.hours}h on ${project.name}.`,
        }),
        ...s.activities,
      ],
    }));
    get().pushToast("Time entry saved");
    return id;
  },

  createExpense: (input) => {
    if (!requireCap(get, "create_expense")) return "";
    const project = get().projects.find((p) => p.id === input.projectId);
    if (!project) return "";
    const id = uid("ex");
    const expense: Expense = {
      id,
      vendor: input.vendor,
      projectId: project.id,
      projectName: project.name,
      amount: input.amount,
      status: "Pending",
      date: todayIso(),
      note: input.note,
    };
    set((s) => ({ expenses: [expense, ...s.expenses] }));
    get().pushToast("Expense submitted for approval");
    return id;
  },

  createOpportunity: (input) => {
    if (!requireCap(get, "create_opportunity")) return "";
    const company = get().companies.find((c) => c.id === input.companyId);
    if (!company) return "";
    const id = uid("o");
    const opp: Opportunity = {
      id,
      name: input.name,
      companyId: company.id,
      companyName: company.name,
      stage: "Qualify",
      amount: input.amount,
      close: input.close,
    };
    set((s) => ({ opportunities: [opp, ...s.opportunities] }));
    get().pushToast("Opportunity added");
    return id;
  },

  advanceOpportunity: (id) => {
    if (!requireCap(get, "advance_opportunity")) return;
    const order: Opportunity["stage"][] = ["Qualify", "Propose", "Negotiate", "Won"];
    const opp = get().opportunities.find((o) => o.id === id);
    if (!opp || opp.stage === "Won" || opp.stage === "Lost") return;
    const idx = order.indexOf(opp.stage);
    const next = order[Math.min(idx + 1, order.length - 1)];
    set((s) => ({
      opportunities: s.opportunities.map((o) => (o.id === id ? { ...o, stage: next } : o)),
    }));
    if (next === "Won") {
      get().createProject({
        name: opp.name,
        companyId: opp.companyId,
        manager: "M. Doyle",
        due: opp.close,
        budgetHours: 80,
      });
      get().pushToast(`${opp.name} won and converted to a project`);
    } else {
      get().pushToast(`Moved to ${next}`);
    }
  },

  approveExpense: (id) => {
    if (!requireCap(get, "approve_expense")) return;
    set((s) => ({
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, status: "Approved" } : e)),
    }));
    const expense = get().expenses.find((e) => e.id === id);
    const project = expense ? get().projects.find((p) => p.id === expense.projectId) : undefined;
    if (expense) {
      get().logActivity({
        type: "approval",
        action: "approved an expense",
        companyId: project?.companyId,
        projectId: expense.projectId,
        entityType: "expense",
        entityId: id,
        entityLabel: `${expense.vendor} · $${expense.amount}`,
        href: `/app/projects/view/?id=${expense.projectId}`,
      });
    }
    get().pushToast("Expense approved");
  },

  updateTaskStatus: (taskId, status) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task || !canMutateTask(task)) {
      get().pushToast("Your role cannot do that.", "danger");
      return;
    }
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status, dueLabel: status === "Done" ? `Completed ${formatDisplayDate(todayIso())}` : t.dueLabel }
          : t,
      );
      if (!task) return { tasks };
      const projectTasks = tasks.filter((t) => t.projectId === task.projectId);
      const done = projectTasks.filter((t) => t.status === "Done").length;
      const progress = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
      return {
        tasks,
        projects: s.projects.map((p) => (p.id === task.projectId ? { ...p, progress } : p)),
      };
    });
    if (task) {
      const project = get().projects.find((p) => p.id === task.projectId);
      get().logActivity({
        type: "task",
        actor: task.assignee,
        action: `moved task to ${status}`,
        companyId: project?.companyId,
        projectId: task.projectId,
        entityType: "task",
        entityId: taskId,
        entityLabel: task.name,
        href: `/app/projects/view/?id=${task.projectId}`,
      });
    }
  },

  updateTicketStatus: (ticketId, status) => {
    if (!requireCap(get, "update_ticket")) return;
    const prev = get().tickets.find((t) => t.id === ticketId);
    const actor = currentUser();
    if (actor?.role === "staff" && prev && !isAssignedName(actor, prev.assignee)) {
      get().pushToast("Staff can only update tickets assigned to them.", "danger");
      return;
    }
    set((s) => {
      const tickets = s.tickets.map((t) => (t.id === ticketId ? { ...t, status } : t));
      let companies = s.companies;
      if (prev && prev.status !== "Resolved" && status === "Resolved") {
        companies = s.companies.map((c) =>
          c.id === prev.companyId ? { ...c, openTickets: Math.max(0, c.openTickets - 1) } : c,
        );
      } else if (prev && prev.status === "Resolved" && status !== "Resolved") {
        companies = s.companies.map((c) =>
          c.id === prev.companyId ? { ...c, openTickets: c.openTickets + 1 } : c,
        );
      }
      return { tickets, companies };
    });
    get().pushToast(`Ticket marked ${status}`);
  },

  updateTicket: (ticketId, patch) => {
    if (!requireCap(get, "update_ticket")) return;
    const prev = get().tickets.find((t) => t.id === ticketId);
    const actor = currentUser();
    if (actor?.role === "staff" && prev && !isAssignedName(actor, prev.assignee)) {
      get().pushToast("Staff can only update tickets assigned to them.", "danger");
      return;
    }
    set((s) => ({
      tickets: s.tickets.map((t) => (t.id === ticketId ? { ...t, ...patch } : t)),
    }));
    get().pushToast(patch.assignee ? `Ticket assigned to ${patch.assignee}` : "Ticket updated");
  },

  addTicketMessage: (ticketId, author, body, visibility) => {
    if (!requireAny(get, "update_ticket", "add_note")) return;
    set((s) => ({
      ticketMessages: [
        {
          id: uid("tm"),
          ticketId,
          author,
          body,
          createdAt: displayNow(),
          visibility,
        },
        ...s.ticketMessages,
      ],
    }));
    get().pushToast(visibility === "internal" ? "Internal note added" : "Reply sent");
  },

  submitTimeEntry: (id) => {
    if (!requireCap(get, "log_time")) return;
    const entry = get().timeEntries.find((t) => t.id === id);
    const actor = currentUser();
    if (actor?.role === "staff" && entry && entry.userName !== actor.name && entry.userName !== "J. Kim") {
      get().pushToast("Staff can only submit their own time.", "danger");
      return;
    }
    set((s) => ({
      timeEntries: s.timeEntries.map((t) => (t.id === id ? { ...t, status: "Submitted" } : t)),
    }));
    get().pushToast("Timesheet line submitted");
  },

  approveTimeEntry: (id) => {
    if (!requireCap(get, "approve_time")) return;
    set((s) => ({
      timeEntries: s.timeEntries.map((t) => (t.id === id ? { ...t, status: "Approved" } : t)),
    }));
    const entry = get().timeEntries.find((t) => t.id === id);
    const project = entry ? get().projects.find((p) => p.id === entry.projectId) : undefined;
    if (entry) {
      get().logActivity({
        type: "approval",
        action: "approved time",
        companyId: project?.companyId,
        projectId: entry.projectId,
        entityType: "time",
        entityId: id,
        entityLabel: `${entry.hours}h · ${entry.projectName}`,
        href: "/app/timesheets",
      });
    }
    get().pushToast("Time approved");
  },

  rejectTimeEntry: (id) => {
    if (!requireCap(get, "approve_time")) return;
    set((s) => ({
      timeEntries: s.timeEntries.map((t) => (t.id === id ? { ...t, status: "Rejected" } : t)),
    }));
    get().pushToast("Time rejected", "danger");
  },

  allocateRetainerHours: (id, hours) => {
    if (!requireCap(get, "manage_retainer")) return;
    set((s) => {
      const retainers = s.retainers.map((r) =>
        r.id === id ? { ...r, usedHours: Math.max(0, r.usedHours + hours) } : r,
      );
      const open = s.retainerPeriods.find((p) => p.retainerId === id && p.status === "Opened");
      const retainerPeriods = open
        ? s.retainerPeriods.map((p) =>
            p.id === open.id ? { ...p, usedHours: Math.max(0, p.usedHours + hours) } : p,
          )
        : s.retainerPeriods;
      return { retainers, retainerPeriods };
    });
    get().pushToast(hours >= 0 ? `Allocated ${hours}h to retainer` : `Removed ${Math.abs(hours)}h from retainer`);
  },

  createInvoiceDraft: (companyId, opts) => {
    if (!requireCap(get, "create_invoice")) return "";
    const company = get().companies.find((c) => c.id === companyId);
    if (!company) return "";
    const project = opts?.projectId ? get().projects.find((p) => p.id === opts.projectId) : undefined;
    const retainer = opts?.retainerId ? get().retainers.find((r) => r.id === opts.retainerId) : undefined;
    const contact = opts?.billToContactId ? get().contacts.find((c) => c.id === opts.billToContactId) : undefined;
    const id = uid("inv");
    const raised = opts?.raised ?? todayIso();
    const terms = opts?.terms ?? company.billingTerms;
    const lineItems =
      opts?.lineItems?.map((line) => ({
        ...line,
        id: line.id || uid("il"),
        amount: computeLineAmount(line),
      })) ?? [emptyInvoiceLine("service", { description: opts?.description ?? "Professional services", amount: opts?.amount ?? 2500 })];
    const totals = invoiceTotals(lineItems);
    const amount = opts?.amount ?? totals.total;
    const number = opts?.number?.trim() || nextInvoiceNumber(get().invoices.length);
    const invoice: Invoice = {
      id,
      number,
      companyId: company.id,
      companyName: company.name,
      amount,
      terms,
      due: opts?.due ?? dueFromTerms(raised, terms),
      status: "Draft",
      lineItems,
      projectId: project?.id,
      retainerId: retainer?.id,
      title: opts?.title ?? opts?.description ?? (project ? `${project.name} invoice` : `Invoice for ${company.name}`),
      owner: opts?.owner,
      billToContactId: contact?.id ?? opts?.billToContactId,
      billToName: contact?.name ?? opts?.billToName,
      currency: opts?.currency ?? "USD",
      raised,
      billingThrough: opts?.billingThrough,
      poNumber: opts?.poNumber,
      description: opts?.description,
      internalDescription: opts?.internalDescription,
      templateId: opts?.templateId,
      taxAmount: totals.tax,
    };
    set((s) => ({ invoices: [invoice, ...s.invoices] }));
    get().pushToast(`${number} draft created`);
    if (opts?.send) get().sendInvoice(id);
    return id;
  },

  updateInvoice: (id, patch) => {
    if (!requireCap(get, "manage_invoice")) return;
    set((s) => ({
      invoices: s.invoices.map((invoice) => {
        if (invoice.id !== id) return invoice;
        const next = { ...invoice, ...patch };
        if (patch.lineItems) {
          const totals = invoiceTotals(patch.lineItems);
          next.amount = totals.total;
          next.taxAmount = totals.tax;
        }
        return next;
      }),
    }));
  },

  createInvoiceTemplate: (input) => {
    if (!requireCap(get, "manage_invoice")) return "";
    const id = uid("tpl");
    const template: InvoiceTemplate = { ...input, id };
    set((s) => ({ invoiceTemplates: [template, ...s.invoiceTemplates] }));
    get().pushToast(`${template.name} saved as a template`);
    return id;
  },

  updateInvoiceTemplate: (id, patch) => {
    if (!requireCap(get, "manage_invoice")) return;
    set((s) => ({
      invoiceTemplates: s.invoiceTemplates.map((template) => (template.id === id ? { ...template, ...patch } : template)),
    }));
    get().pushToast("Invoice template updated");
  },

  generateProjectInvoice: (projectId) => {
    if (!requireCap(get, "create_invoice")) return "";
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return "";
    const materialLines = project.materials.map((m) =>
      emptyInvoiceLine("material", {
        description: m.title,
        quantity: m.qty,
        rate: m.salePrice,
        amount: m.salePrice * m.qty,
      }),
    );
    const materials = materialLines.reduce((sum, line) => sum + line.amount, 0);
    const services = Math.max(project.budgetAmount - materials, project.loggedHours * 180);
    const serviceLine = emptyInvoiceLine("service", {
      description: `${project.name} progress billing`,
      amount: services,
    });
    return get().createInvoiceDraft(project.companyId, {
      projectId,
      title: `${project.name} progress billing`,
      description: `${project.name} progress billing`,
      templateId: "tpl-progress",
      lineItems: [serviceLine, ...materialLines],
    });
  },

  generatePeriodInvoice: (periodId) => {
    if (!requireCap(get, "create_invoice")) return "";
    const period = get().retainerPeriods.find((p) => p.id === periodId);
    const retainer = period ? get().retainers.find((r) => r.id === period.retainerId) : undefined;
    if (!period || !retainer) return "";
    const hours = period.usedHours;
    const rate = 175;
    const serviceLine = emptyInvoiceLine("service", {
      description: `${retainer.name} (${period.start} to ${period.end})`,
      hours,
      rate,
      amount: Math.round(hours * rate),
    });
    const invId = get().createInvoiceDraft(retainer.companyId, {
      retainerId: retainer.id,
      title: `${retainer.name} period invoice`,
      description: `${retainer.name} (${period.start} to ${period.end})`,
      templateId: "tpl-retainer",
      lineItems: [serviceLine],
    });
    set((s) => ({
      retainerPeriods: s.retainerPeriods.map((p) =>
        p.id === periodId ? { ...p, status: "Invoiced", invoiceId: invId } : p,
      ),
    }));
    return invId;
  },

  createRetainer: (input) => {
    if (!requireCap(get, "create_retainer")) return "";
    const company = get().companies.find((c) => c.id === input.companyId);
    if (!company) return "";
    const contact = input.contactId ? get().contacts.find((c) => c.id === input.contactId) : undefined;
    const id = uid("r");
    const retainer: Retainer = {
      id,
      companyId: company.id,
      companyName: company.name,
      name: input.name,
      type: input.type,
      manager: input.manager,
      contactId: contact?.id,
      contactName: contact?.name,
      periodLabel: `Current period to ${input.expires}`,
      usedHours: 0,
      budgetHours: input.budgetHours,
      status: "Active",
      autoRenew: true,
      expires: input.expires,
      openPeriods: 1,
      files: [],
      notes: [],
    };
    const period: RetainerPeriod = {
      id: uid("rp"),
      retainerId: id,
      start: todayIso(),
      end: input.expires,
      status: "Opened",
      usedHours: 0,
      budgetHours: input.budgetHours,
    };
    set((s) => ({
      retainers: [retainer, ...s.retainers],
      retainerPeriods: [period, ...s.retainerPeriods],
    }));
    get().pushToast(`Retainer ${retainer.name} created`);
    return id;
  },

  updateRetainer: (id, patch) => {
    if (!requireCap(get, "manage_retainer")) return;
    set((s) => ({
      retainers: s.retainers.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        if ("contactId" in patch) {
          if (patch.contactId) {
            const contact = get().contacts.find((c) => c.id === patch.contactId);
            next.contactName = contact?.name;
          } else {
            next.contactId = undefined;
            next.contactName = undefined;
          }
        }
        return next;
      }),
    }));
    get().pushToast("Retainer updated");
  },

  deleteRetainer: (id) => {
    if (!requireCap(get, "manage_retainer")) return;
    set((s) => ({
      retainers: s.retainers.filter((r) => r.id !== id),
      retainerPeriods: s.retainerPeriods.filter((p) => p.retainerId !== id),
    }));
    get().pushToast("Retainer deleted", "danger");
  },

  addRetainerPeriod: (retainerId, start, end, budgetHours) => {
    if (!requireCap(get, "manage_retainer")) return "";
    const id = uid("rp");
    set((s) => ({
      retainerPeriods: [
        { id, retainerId, start, end, status: "Opened", usedHours: 0, budgetHours },
        ...s.retainerPeriods,
      ],
      retainers: s.retainers.map((r) =>
        r.id === retainerId
          ? { ...r, openPeriods: r.openPeriods + 1, periodLabel: `${start} to ${end}`, budgetHours, expires: end }
          : r,
      ),
    }));
    get().pushToast("Period added");
    return id;
  },

  addProjectFile: (projectId, file) => {
    if (!requireCap(get, "manage_files")) return;
    const project = get().projects.find((p) => p.id === projectId);
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, files: [{ id: uid("f"), ...file }, ...p.files] } : p,
      ),
    }));
    if (project) {
      get().logActivity({
        type: "file",
        action: "uploaded a file",
        companyId: project.companyId,
        projectId,
        entityType: "file",
        entityId: file.name,
        entityLabel: file.name,
        href: `/app/projects/view/?id=${projectId}`,
      });
    }
    get().pushToast("File uploaded");
  },

  deleteProjectFile: (projectId, fileId) => {
    if (!requireCap(get, "manage_files")) return;
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, files: p.files.filter((f) => f.id !== fileId) } : p,
      ),
    }));
    get().pushToast("File removed", "danger");
  },

  moveProjectFile: (projectId, fileId, folder) => {
    if (!requireCap(get, "manage_files")) return;
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, files: p.files.map((f) => (f.id === fileId ? { ...f, folder } : f)) }
          : p,
      ),
    }));
    get().pushToast(`Moved to ${folder}`);
  },

  addProjectNote: (projectId, note) => {
    if (!requireCap(get, "add_note")) return;
    const project = get().projects.find((p) => p.id === projectId);
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              notes: [{ id: uid("pn"), createdAt: formatDisplayDate(todayIso()), ...note }, ...p.notes],
            }
          : p,
      ),
    }));
    if (project) {
      get().logActivity({
        type: "comment",
        actor: note.author,
        action: note.body,
        companyId: project.companyId,
        projectId,
        entityType: "project",
        entityId: projectId,
        entityLabel: project.name,
        href: `/app/projects/view/?id=${projectId}`,
      });
    }
    get().pushToast("Note added");
  },

  addRetainerFile: (retainerId, file) => {
    if (!requireCap(get, "manage_retainer")) return;
    set((s) => ({
      retainers: s.retainers.map((r) =>
        r.id === retainerId ? { ...r, files: [{ id: uid("f"), ...file }, ...r.files] } : r,
      ),
    }));
    get().pushToast("File uploaded");
  },

  deleteRetainerFile: (retainerId, fileId) => {
    if (!requireCap(get, "manage_retainer")) return;
    set((s) => ({
      retainers: s.retainers.map((r) =>
        r.id === retainerId ? { ...r, files: r.files.filter((f) => f.id !== fileId) } : r,
      ),
    }));
    get().pushToast("File removed", "danger");
  },

  moveRetainerFile: (retainerId, fileId, folder) => {
    if (!requireCap(get, "manage_retainer")) return;
    set((s) => ({
      retainers: s.retainers.map((r) =>
        r.id === retainerId
          ? { ...r, files: r.files.map((f) => (f.id === fileId ? { ...f, folder } : f)) }
          : r,
      ),
    }));
    get().pushToast(`Moved to ${folder}`);
  },

  addRetainerNote: (retainerId, note) => {
    if (!requireCap(get, "manage_retainer")) return;
    set((s) => ({
      retainers: s.retainers.map((r) =>
        r.id === retainerId
          ? {
              ...r,
              notes: [{ id: uid("rn"), createdAt: formatDisplayDate(todayIso()), ...note }, ...r.notes],
            }
          : r,
      ),
    }));
    get().pushToast("Note added");
  },

  addMaterial: (projectId, title, salePrice) => {
    if (!requireCap(get, "edit_project")) return;
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              materials: [
                {
                  id: uid("mat"),
                  item: `MAT-${p.materials.length + 1}`,
                  title,
                  qty: 1,
                  purchasePrice: Math.round(salePrice * 0.7),
                  salePrice,
                },
                ...p.materials,
              ],
            }
          : p,
      ),
    }));
    get().pushToast("Material added");
  },

  sendInvoice: (id) => {
    if (!requireCap(get, "manage_invoice")) return;
    const inv = get().invoices.find((i) => i.id === id);
    if (!inv) return;
    set((s) => ({
      invoices: s.invoices.map((i) => (i.id === id ? { ...i, status: i.status === "Draft" ? "Sent" : i.status } : i)),
      emailOutbox: [
        {
          id: uid("e"),
          to: "billing@client.com",
          subject: `Invoice ${inv.number}`,
          body: `Please find invoice ${inv.number}${inv.title ? ` (${inv.title})` : ""} for ${inv.companyName}.`,
          sentAt: displayNow(),
          status: "Sent",
        },
        ...s.emailOutbox,
      ],
      notifications: [
        {
          id: uid("n"),
          title: "Invoice sent",
          body: `${inv.number} emailed to ${inv.companyName}.`,
          createdAt: displayNow(),
          read: false,
          href: `/app/billing/view/?id=${id}`,
        },
        ...s.notifications,
      ],
    }));
    get().pushToast(`${inv.number} sent`);
  },

  payInvoice: (id) => {
    if (!requireCap(get, "pay_invoice")) return;
    const inv = get().invoices.find((i) => i.id === id);
    if (!inv) return;
    if (inv.status === "Draft") {
      get().pushToast("Send the invoice before recording payment", "danger");
      return;
    }
    if (inv.status === "Paid") return;
    set((s) => ({
      invoices: s.invoices.map((i) => (i.id === id ? { ...i, status: "Paid" } : i)),
      notifications: [
        {
          id: uid("n"),
          title: "Payment received",
          body: `${inv.number} marked paid.`,
          createdAt: displayNow(),
          read: false,
          href: `/app/billing/view/?id=${id}`,
        },
        ...s.notifications,
      ],
    }));
    get().pushToast(`${inv.number} paid`);
  },

  requestSignoff: (projectId, milestoneName) => {
    if (!requireCap(get, "edit_project")) return;
    const project = get().projects.find((p) => p.id === projectId);
    const milestone = get().milestones.find(
      (m) => m.projectId === projectId && m.name === milestoneName && m.status !== "Approved",
    ) ?? get().milestones.find((m) => m.projectId === projectId && m.status !== "Approved");
    set((s) => ({
      milestones: milestone
        ? s.milestones.map((m) =>
            m.id === milestone.id ? { ...m, status: "Awaiting Signoff" } : m,
          )
        : s.milestones,
      notifications: [
        {
          id: uid("n"),
          title: "Signoff requested",
          body: `${milestoneName} on ${project?.name ?? "project"} awaits approval.`,
          createdAt: displayNow(),
          read: false,
          href: `/app/projects/view/?id=${projectId}`,
        },
        ...s.notifications,
      ],
      emailOutbox: [
        {
          id: uid("e"),
          to: "dana@cascadeventures.com",
          subject: `Signoff requested: ${milestoneName}`,
          body: `Please review and approve ${milestoneName} in the client portal.`,
          sentAt: displayNow(),
          status: "Sent",
        },
        ...s.emailOutbox,
      ],
    }));
    if (project) {
      get().logActivity({
        type: "approval",
        action: "requested signoff",
        companyId: project.companyId,
        projectId,
        entityType: "milestone",
        entityId: milestoneName,
        entityLabel: milestoneName,
        href: `/app/projects/view/?id=${projectId}`,
      });
    }
    get().pushToast("Signoff requested");
  },

  approveSignoff: (milestoneId) => {
    if (!requireCap(get, "approve_signoff")) return;
    const milestone = get().milestones.find((m) => m.id === milestoneId);
    const project = milestone ? get().projects.find((p) => p.id === milestone.projectId) : undefined;
    set((s) => ({
      milestones: s.milestones.map((m) =>
        m.id === milestoneId ? { ...m, status: "Approved" } : m,
      ),
    }));
    if (milestone && project) {
      get().logActivity({
        type: "approval",
        action: "approved milestone",
        companyId: project.companyId,
        projectId: project.id,
        entityType: "milestone",
        entityId: milestoneId,
        entityLabel: milestone.name,
        href: `/app/projects/view/?id=${project.id}`,
      });
    }
    get().pushToast("Signoff approved");
  },

  toggleAutomation: (id) => {
    if (!requireCap(get, "manage_automations")) return;
    set((s) => ({
      automations: s.automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    }));
  },

  runAutomation: (id) => {
    if (!requireCap(get, "manage_automations")) return;
    const rule = get().automations.find((a) => a.id === id);
    if (!rule) return;
    get().queueEmail("ops@dillonmorgan.com", `Automation ran: ${rule.name}`, rule.action);
    set((s) => ({
      notifications: [
        {
          id: uid("n"),
          title: "Automation ran",
          body: rule.name,
          createdAt: displayNow(),
          read: false,
          href: "/app/automations",
        },
        ...s.notifications,
      ],
    }));
    get().pushToast(`Ran ${rule.name}`);
  },

  addEmailDomain: (input) => {
    if (!requireAny(get, "manage_automations", "manage_users")) return undefined;
    const domain = normalizeDomain(input.domain);
    if (!domain) {
      get().pushToast("Enter a valid domain such as dillonmorgan.com.", "danger");
      return undefined;
    }
    if (get().emailDomains.some((row) => row.domain === domain)) {
      get().pushToast("That domain is already on the list.", "danger");
      return undefined;
    }
    const id = uid("ed");
    const row: EmailDomain = {
      id,
      domain,
      fromName: input.fromName.trim() || "DMC PMO",
      fromEmail: `${localPart(input.fromEmail.split("@")[0] || "notifications")}@${domain}`,
      primary: get().emailDomains.length === 0,
      status: "Not checked",
      records: buildDnsRecords(domain),
    };
    set((s) => {
      const emailDomains = [...s.emailDomains, row];
      persistEmailDomains(emailDomains);
      return { emailDomains };
    });
    get().pushToast(`Added ${domain}`);
    return id;
  },

  removeEmailDomain: (id) => {
    if (!requireAny(get, "manage_automations", "manage_users")) return;
    set((s) => {
      const remaining = s.emailDomains.filter((row) => row.id !== id).map((row) => ({ ...row }));
      if (remaining.length && !remaining.some((row) => row.primary)) remaining[0] = { ...remaining[0], primary: true };
      persistEmailDomains(remaining);
      return { emailDomains: remaining };
    });
    get().pushToast("Email domain removed");
  },

  setPrimaryEmailDomain: (id) => {
    if (!requireAny(get, "manage_automations", "manage_users")) return;
    set((s) => {
      const emailDomains = s.emailDomains.map((row) => ({ ...row, primary: row.id === id }));
      persistEmailDomains(emailDomains);
      return { emailDomains };
    });
    get().pushToast("Sending domain updated");
  },

  checkEmailDomain: async (id) => {
    const current = get().emailDomains.find((row) => row.id === id);
    if (!current) return undefined;
    const records = await inspectDnsRecords(current.records);
    const status = domainStatus(records);
    const next: EmailDomain = { ...current, records, status, lastChecked: displayNow() };
    set((s) => {
      const emailDomains = s.emailDomains.map((row) => (row.id === id ? next : row));
      persistEmailDomains(emailDomains);
      return { emailDomains };
    });
    get().pushToast(
      status === "Verified" ? `${current.domain} is verified.` : `${current.domain} is ${status.toLowerCase()}.`,
      status === "Verified" ? "success" : status === "Partial" ? "info" : "danger",
    );
    return next;
  },

  queueEmail: (to, subject, body, status = "Sent") => {
    const id = uid("e");
    set((s) => ({
      emailOutbox: [
        { id, to, subject, body, sentAt: displayNow(), status },
        ...s.emailOutbox,
      ],
    }));
    get().pushToast(status === "Queued" ? "Email drafted in the outbox" : "Email sent to the outbox");
    return id;
  },

  createObjective: (input) => {
    if (!requireCap(get, "create_objective")) return "";
    const id = uid("so");
    const objective: StrategicObjective = {
      id,
      code: `SO-${get().objectives.length + 1}`,
      name: input.name,
      owner: input.owner,
      horizon: input.horizon,
      status: "On Track",
      target: input.target,
      progress: 0,
      description: input.description,
    };
    set((s) => ({ objectives: [objective, ...s.objectives] }));
    get().pushToast("Objective added");
    return id;
  },

  updateObjective: (id, patch) => {
    if (!requireCap(get, "edit_objective")) return;
    const prev = get().objectives.find((o) => o.id === id);
    if (!prev) return;
    const progress =
      patch.progress == null ? prev.progress : Math.max(0, Math.min(100, Math.round(Number(patch.progress) || 0)));
    set((s) => ({
      objectives: s.objectives.map((o) => (o.id === id ? { ...o, ...patch, id: o.id, code: o.code, progress } : o)),
    }));
    get().pushToast("Objective updated");
  },

  createIdea: (input) => {
    if (!requireCap(get, "create_idea")) return "";
    const company = get().companies.find((c) => c.id === input.companyId);
    const id = uid("idea");
    const idea: Idea = {
      id,
      name: input.name,
      companyId: company?.id,
      companyName: company?.name,
      submitter: input.submitter,
      stage: "Submitted",
      score: 50,
      strategicFit: 5,
      valueScore: 5,
      riskScore: 5,
      objectiveId: input.objectiveId,
      requestedBudget: input.requestedBudget,
      summary: input.summary,
    };
    set((s) => ({ ideas: [idea, ...s.ideas] }));
    get().pushToast("Idea submitted");
    return id;
  },

  updateIdea: (id, patch) => {
    if (!requireCap(get, "edit_idea")) return;
    const prev = get().ideas.find((i) => i.id === id);
    if (!prev) return;
    const companyId = patch.companyId === "" ? undefined : (patch.companyId ?? prev.companyId);
    const company = companyId ? get().companies.find((c) => c.id === companyId) : undefined;
    const next: Idea = {
      ...prev,
      ...patch,
      companyId,
      companyName: companyId ? (company?.name ?? patch.companyName ?? prev.companyName) : undefined,
      objectiveId: patch.objectiveId === "" ? undefined : (patch.objectiveId ?? prev.objectiveId),
    };
    if (patch.score == null && (patch.strategicFit != null || patch.valueScore != null || patch.riskScore != null)) {
      next.score = ideaComposite(next);
    }
    set((s) => ({ ideas: s.ideas.map((i) => (i.id === id ? next : i)) }));
    get().pushToast("Idea updated");
  },

  advanceIdea: (id) => {
    if (!requireCap(get, "edit_idea")) return;
    const order: IdeaStage[] = ["Submitted", "Scoring", "Approved", "Converted"];
    const idea = get().ideas.find((i) => i.id === id);
    if (!idea || idea.stage === "Deferred" || idea.stage === "Converted") return;
    const next = order[Math.min(order.indexOf(idea.stage) + 1, order.length - 1)];
    if (next === "Converted") {
      get().convertIdea(id);
      return;
    }
    set((s) => ({ ideas: s.ideas.map((i) => (i.id === id ? { ...i, stage: next, score: Math.min(99, i.score + 8) } : i)) }));
    get().pushToast(`Idea moved to ${next}`);
  },

  convertIdea: (id) => {
    if (!requireCap(get, "convert_idea")) return;
    const idea = get().ideas.find((i) => i.id === id);
    if (!idea || idea.convertedProjectId) return;
    const companyId = idea.companyId ?? get().companies[0]?.id;
    if (!companyId) return;
    const projectId = get().createProject({
      name: idea.name,
      companyId,
      manager: idea.submitter,
      due: todayIso(),
      budgetHours: Math.max(40, Math.round(idea.requestedBudget / 250)),
    });
    set((s) => ({
      ideas: s.ideas.map((i) => (i.id === id ? { ...i, stage: "Converted", convertedProjectId: projectId } : i)),
      portfolios: s.portfolios.map((p) =>
        p.id === "pf-delivery" ? { ...p, projectIds: [...p.projectIds, projectId] } : p,
      ),
    }));
    get().pushToast("Idea converted to a project");
    return projectId;
  },

  createPortfolio: (input) => {
    if (!requireCap(get, "create_portfolio")) return "";
    const id = uid("pf");
    const portfolio: Portfolio = {
      id,
      name: input.name,
      owner: input.owner,
      theme: input.theme,
      budget: input.budget,
      projectIds: input.projectIds ?? [],
      objectiveIds: input.objectiveIds ?? [],
      description: input.description,
    };
    set((s) => ({ portfolios: [portfolio, ...s.portfolios] }));
    get().pushToast("Portfolio created");
    return id;
  },

  updatePortfolio: (id, patch) => {
    if (!requireCap(get, "edit_portfolio")) return;
    const prev = get().portfolios.find((p) => p.id === id);
    if (!prev) return;
    set((s) => ({
      portfolios: s.portfolios.map((p) => (p.id === id ? { ...p, ...patch, id: p.id } : p)),
    }));
    get().pushToast("Portfolio updated");
  },

  createRisk: (input) => {
    if (!requireCap(get, "create_risk")) return "";
    const id = uid("rk");
    const risk: RiskItem = {
      id,
      title: input.title,
      projectId: input.projectId,
      owner: input.owner,
      probability: input.probability,
      impact: input.impact,
      status: "Open",
      due: input.due,
      mitigation: input.mitigation,
    };
    set((s) => ({ risks: [risk, ...s.risks] }));
    get().pushToast("Risk logged");
    return id;
  },

  updateRiskStatus: (id, status) => {
    if (!requireCap(get, "update_risk")) return;
    set((s) => ({ risks: s.risks.map((r) => (r.id === id ? { ...r, status } : r)) }));
    get().pushToast(`Risk ${status.toLowerCase()}`);
  },

  updateIssueStatus: (id, status) => {
    if (!requireCap(get, "update_risk")) return;
    set((s) => ({ issues: s.issues.map((i) => (i.id === id ? { ...i, status } : i)) }));
    get().pushToast("Issue updated");
  },

  decideGate: (id, status) => {
    if (!requireCap(get, "decide_governance")) return;
    const gate = get().gates.find((g) => g.id === id);
    const project = gate ? get().projects.find((p) => p.id === gate.projectId) : undefined;
    set((s) => ({ gates: s.gates.map((g) => (g.id === id ? { ...g, status } : g)) }));
    if (gate && project) {
      get().addActivityNote(project.companyId, `Gate ${status.toLowerCase()}: ${gate.name}`, project.id);
    }
    get().pushToast(`Gate ${status.toLowerCase()}`);
  },

  createDependency: (input) => {
    if (!requireCap(get, "create_dependency")) return "";
    const id = uid("dep");
    set((s) => ({
      dependencies: [
        { id, ...input, status: "On Track" },
        ...s.dependencies,
      ],
    }));
    get().pushToast("Dependency recorded");
    return id;
  },
}));

function formatDisplayDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
