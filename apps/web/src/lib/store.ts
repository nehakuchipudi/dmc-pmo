"use client";

import { create } from "zustand";
import {
  initialsFromName,
  seedActivities,
  seedAutomations,
  seedCompanies,
  seedContacts,
  seedEmailOutbox,
  seedInvoices,
  seedMilestones,
  seedNotifications,
  seedProjects,
  seedRetainers,
  seedTasks,
  seedTicketMessages,
  seedTickets,
  seedTimeEntries,
  uid,
} from "./seed";
import type {
  ActivityItem,
  AutomationRule,
  Company,
  Contact,
  EmailOutboxItem,
  Invoice,
  Milestone,
  NotificationItem,
  Project,
  Retainer,
  Task,
  TaskStatus,
  Ticket,
  TicketMessage,
  TimeEntry,
} from "./types";

type CreateCompanyInput = {
  name: string;
  status: Company["status"];
  accountManager: string;
  industry: string;
  billingTerms: string;
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
  status?: TaskStatus;
};

type CreateTimeInput = {
  userName: string;
  projectId: string;
  taskId?: string;
  date: string;
  hours: number;
  billable: boolean;
  note: string;
};

type Toast = { id: string; message: string; tone?: "success" | "info" | "danger" };

type AppState = {
  companies: Company[];
  contacts: Contact[];
  projects: Project[];
  milestones: Milestone[];
  tickets: Ticket[];
  ticketMessages: TicketMessage[];
  tasks: Task[];
  invoices: Invoice[];
  timeEntries: TimeEntry[];
  notifications: NotificationItem[];
  activities: ActivityItem[];
  retainers: Retainer[];
  automations: AutomationRule[];
  emailOutbox: EmailOutboxItem[];
  toasts: Toast[];
  recentlyViewed: { type: string; id: string; label: string }[];

  pushToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  trackView: (type: string, id: string, label: string) => void;

  createCompany: (input: CreateCompanyInput) => string;
  createContact: (input: Omit<Contact, "id" | "initials" | "lastInteraction">) => string;
  createProject: (input: CreateProjectInput) => string;
  createTicket: (input: CreateTicketInput) => string;
  createTask: (input: CreateTaskInput) => string;
  createMilestone: (projectId: string, name: string, due: string) => string;
  createTimeEntry: (input: CreateTimeInput) => string;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTicketStatus: (ticketId: string, status: Ticket["status"]) => void;
  addTicketMessage: (ticketId: string, author: string, body: string, visibility: "client" | "internal") => void;
  submitTimeEntry: (id: string) => void;
  approveTimeEntry: (id: string) => void;
  rejectTimeEntry: (id: string) => void;
  allocateRetainerHours: (id: string, hours: number) => void;
  createInvoiceDraft: (companyId: string) => string;
  sendInvoice: (id: string) => void;
  payInvoice: (id: string) => void;
  requestSignoff: (projectId: string, milestoneName: string) => void;
  approveSignoff: (milestoneId: string) => void;
  toggleAutomation: (id: string) => void;
  runAutomation: (id: string) => void;
  queueEmail: (to: string, subject: string, body: string) => void;
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

export const useAppStore = create<AppState>((set, get) => ({
  companies: seedCompanies,
  contacts: seedContacts,
  projects: seedProjects,
  milestones: seedMilestones,
  tickets: seedTickets,
  ticketMessages: seedTicketMessages,
  tasks: seedTasks,
  invoices: seedInvoices,
  timeEntries: seedTimeEntries,
  notifications: seedNotifications,
  activities: seedActivities,
  retainers: seedRetainers,
  automations: seedAutomations,
  emailOutbox: seedEmailOutbox,
  toasts: [],
  recentlyViewed: [
    { type: "company", id: "c-cascade", label: "Cascade Ventures" },
    { type: "company", id: "c-oakton", label: "Oakton Technologies" },
    { type: "company", id: "c-northridge", label: "Northridge Retail Group" },
  ],

  pushToast: (message, tone = "success") => {
    const id = uid("toast");
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    window.setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
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

  createCompany: (input) => {
    const id = uid("c");
    const company: Company = {
      id,
      name: input.name,
      initials: initialsFromName(input.name),
      status: input.status,
      accountManager: input.accountManager,
      openProjects: 0,
      openTickets: 0,
      lastActivity: formatDisplayDate(todayIso()),
      industry: input.industry,
      billingTerms: input.billingTerms,
      portalContacts: 0,
    };
    set((s) => ({
      companies: [company, ...s.companies],
      activities: [
        { id: uid("a"), companyId: id, when: displayNow(), text: `Company created: ${company.name}.` },
        ...s.activities,
      ],
    }));
    get().pushToast(`Company ${company.name} created`);
    return id;
  },

  createContact: (input) => {
    const id = uid("ct");
    const contact: Contact = {
      id,
      ...input,
      initials: initialsFromName(input.name),
      lastInteraction: formatDisplayDate(todayIso()),
    };
    set((s) => ({ contacts: [contact, ...s.contacts] }));
    get().pushToast(`Contact ${contact.name} created`);
    return id;
  },

  createProject: (input) => {
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
      status: "On Track",
      due: input.due,
      start: todayIso(),
      budgetHours: input.budgetHours,
      loggedHours: 0,
      marginPct: 35,
      portalShared: true,
      portalContacts: company.portalContacts,
    };
    set((s) => ({
      projects: [project, ...s.projects],
      companies: s.companies.map((c) =>
        c.id === company.id ? { ...c, openProjects: c.openProjects + 1, lastActivity: formatDisplayDate(todayIso()) } : c,
      ),
    }));
    get().pushToast(`Project ${project.name} created`);
    return id;
  },

  createTicket: (input) => {
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
    const project = get().projects.find((p) => p.id === input.projectId);
    if (!project) return "";
    const id = uid("tk");
    const task: Task = {
      id,
      name: input.name,
      projectId: project.id,
      projectName: project.name,
      assignee: input.assignee,
      assigneeInitials: initialsFromName(input.assignee),
      status: input.status ?? "Not Started",
      due: input.due,
      start: todayIso(),
      clientEditable: false,
      estimateHours: 4,
    };
    set((s) => ({ tasks: [task, ...s.tasks] }));
    get().pushToast(`Task created on ${project.name}`);
    return id;
  },

  createMilestone: (projectId, name, due) => {
    const id = uid("m");
    set((s) => ({
      milestones: [
        { id, projectId, name, due, start: todayIso(), status: "Not Started" },
        ...s.milestones,
      ],
    }));
    get().pushToast("Milestone added");
    return id;
  },

  createTimeEntry: (input) => {
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
        {
          id: uid("a"),
          companyId: project.companyId,
          projectId: project.id,
          when: displayNow(),
          text: `${input.userName} logged ${input.hours}h on ${project.name}.`,
        },
        ...s.activities,
      ],
    }));
    get().pushToast("Time entry saved");
    return id;
  },

  updateTaskStatus: (taskId, status) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status, dueLabel: status === "Done" ? `Completed ${formatDisplayDate(todayIso())}` : t.dueLabel } : t)),
    }));
  },

  updateTicketStatus: (ticketId, status) => {
    set((s) => ({
      tickets: s.tickets.map((t) => (t.id === ticketId ? { ...t, status } : t)),
    }));
    get().pushToast(`Ticket marked ${status}`);
  },

  addTicketMessage: (ticketId, author, body, visibility) => {
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
    set((s) => ({
      timeEntries: s.timeEntries.map((t) => (t.id === id ? { ...t, status: "Submitted" } : t)),
    }));
    get().pushToast("Timesheet line submitted");
  },

  approveTimeEntry: (id) => {
    set((s) => ({
      timeEntries: s.timeEntries.map((t) => (t.id === id ? { ...t, status: "Approved" } : t)),
    }));
    get().pushToast("Time approved");
  },

  rejectTimeEntry: (id) => {
    set((s) => ({
      timeEntries: s.timeEntries.map((t) => (t.id === id ? { ...t, status: "Rejected" } : t)),
    }));
    get().pushToast("Time rejected", "danger");
  },

  allocateRetainerHours: (id, hours) => {
    set((s) => ({
      retainers: s.retainers.map((r) =>
        r.id === id
          ? { ...r, usedHours: Math.min(r.budgetHours, Math.max(0, r.usedHours + hours)) }
          : r,
      ),
    }));
    get().pushToast(hours >= 0 ? `Allocated ${hours}h to retainer` : `Removed ${Math.abs(hours)}h from retainer`);
  },

  createInvoiceDraft: (companyId) => {
    const company = get().companies.find((c) => c.id === companyId);
    if (!company) return "";
    const id = uid("inv");
    const number = `INV-${2302 + get().invoices.length}`;
    const invoice: Invoice = {
      id,
      number,
      companyId: company.id,
      companyName: company.name,
      amount: 2500,
      terms: company.billingTerms,
      due: todayIso(),
      status: "Draft",
      lineItems: [{ description: "Professional services", amount: 2500 }],
    };
    set((s) => ({ invoices: [invoice, ...s.invoices] }));
    get().pushToast(`${number} draft created`);
    return id;
  },

  sendInvoice: (id) => {
    const inv = get().invoices.find((i) => i.id === id);
    if (!inv) return;
    set((s) => ({
      invoices: s.invoices.map((i) => (i.id === id ? { ...i, status: i.status === "Draft" ? "Sent" : i.status } : i)),
      emailOutbox: [
        {
          id: uid("e"),
          to: "billing@client.com",
          subject: `Invoice ${inv.number}`,
          body: `Please find invoice ${inv.number} for ${inv.amount}.`,
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
    const inv = get().invoices.find((i) => i.id === id);
    if (!inv) return;
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
    const project = get().projects.find((p) => p.id === projectId);
    set((s) => ({
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
    get().pushToast("Signoff requested");
  },

  approveSignoff: (milestoneId) => {
    set((s) => ({
      milestones: s.milestones.map((m) =>
        m.id === milestoneId ? { ...m, status: "Approved" } : m,
      ),
    }));
    get().pushToast("Signoff approved");
  },

  toggleAutomation: (id) => {
    set((s) => ({
      automations: s.automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    }));
  },

  runAutomation: (id) => {
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

  queueEmail: (to, subject, body) => {
    set((s) => ({
      emailOutbox: [
        { id: uid("e"), to, subject, body, sentAt: displayNow(), status: "Sent" },
        ...s.emailOutbox,
      ],
    }));
  },
}));

function formatDisplayDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
