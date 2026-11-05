import { isAssignedName } from "./rbac";
import { addDaysIso } from "./service-ops";
import type { WorkOrder } from "./service-ops";
import { formatDisplayDate } from "./seed";
import { startOfWeek, todayIso, weekDays } from "./timesheet";
import type { Expense, NotificationItem, Project, ResourceAllocation, Task, TeamMember, Ticket, TimeEntry, User } from "./types";

export type PortalTab = "My Overview" | "My Work" | "My Requests" | "My Profile";

export const PORTAL_TABS: PortalTab[] = ["My Overview", "My Work", "My Requests", "My Profile"];

export function isPortalTab(value: string | null): value is PortalTab {
  return PORTAL_TABS.includes(value as PortalTab);
}

export type AssignmentKind = "Project" | "Work order" | "Task" | "Ticket";

export type PortalAssignment = {
  id: string;
  title: string;
  kind: AssignmentKind;
  subtitle: string;
  status: string;
  href: string;
  date?: string;
};

export type PortalRequest = {
  id: string;
  kind: "Time off" | "Expense";
  title: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
  memberName: string;
};

export type PortalAnnouncement = {
  id: string;
  title: string;
  body: string;
  posted: string;
  href?: string;
};

const REQUESTS_KEY = "dmc-pmo-employee-requests";

const DEMO_NAMES = new Set([
  "Dillon Morgan",
  "M. Doyle",
  "J. Kim",
  "J. Alvarez",
  "P. Rivera",
  "Aishwarya Phalak",
]);

export function isDemoEmployee(name: string) {
  return DEMO_NAMES.has(name);
}

function weekStart() {
  return startOfWeek(todayIso());
}

export function firmAnnouncements(): PortalAnnouncement[] {
  const today = todayIso();
  return [
    {
      id: "ann-safety",
      title: "Q3 Safety training",
      body: "Complete the required training by Nov 15.",
      posted: addDaysIso(today, -2),
      href: "/app/documents",
    },
    {
      id: "ann-holiday",
      title: "Holiday schedule update",
      body: "Office will be closed on Nov 27-28.",
      posted: addDaysIso(today, -5),
      href: "/app/work-schedule",
    },
    {
      id: "ann-timesheet",
      title: "Friday timesheet reminder",
      body: "Submit hours before 5 PM so approvals can close the week.",
      posted: addDaysIso(today, -1),
      href: "/app/timesheets",
    },
  ];
}

function defaultRequests(name: string): PortalRequest[] {
  const today = todayIso();
  if (name === "Dillon Morgan") {
    return [
      { id: "er-dm-1", memberName: name, kind: "Time off", title: "Time off", date: addDaysIso(today, 9), status: "Pending" },
      { id: "er-dm-2", memberName: name, kind: "Expense", title: "Team site visit", date: addDaysIso(today, -3), status: "Approved" },
    ];
  }
  if (name === "J. Kim") {
    return [
      { id: "er-jk-1", memberName: name, kind: "Time off", title: "Time off", date: addDaysIso(today, 16), status: "Pending" },
    ];
  }
  return [];
}

function defaultAssignments(name: string): PortalAssignment[] {
  if (!isDemoEmployee(name)) return [];
  const today = todayIso();
  const start = weekStart();
  return [
    {
      id: "as-lakeside",
      title: "Lakeside Renovation Phase 2",
      kind: "Project",
      subtitle: "Design",
      status: "In Progress",
      href: "/app/projects",
      date: today,
    },
    {
      id: "as-hvac",
      title: "HVAC Maintenance",
      kind: "Work order",
      subtitle: "Facilities",
      status: "Scheduled",
      href: "/app/work-orders",
      date: addDaysIso(start, 2),
    },
    {
      id: "as-generator",
      title: "Generator Inspection",
      kind: "Work order",
      subtitle: "Facilities",
      status: "Scheduled",
      href: "/app/work-orders",
      date: addDaysIso(start, 4),
    },
  ];
}

function defaultWeekHours(name: string) {
  if (!isDemoEmployee(name)) return [0, 0, 0, 0, 0];
  return [8, 8, 6, 8, 8];
}

export function loadEmployeeRequests(name: string): PortalRequest[] {
  if (typeof window === "undefined") return defaultRequests(name);
  try {
    const raw = window.localStorage.getItem(REQUESTS_KEY);
    if (!raw) return defaultRequests(name);
    const parsed = JSON.parse(raw) as PortalRequest[];
    return parsed.filter((row) => row.memberName === name);
  } catch {
    return defaultRequests(name);
  }
}

export function saveEmployeeRequest(request: Omit<PortalRequest, "id" | "status"> & { status?: PortalRequest["status"] }) {
  const next: PortalRequest = {
    ...request,
    id: `er-${Math.random().toString(36).slice(2, 9)}`,
    status: request.status ?? "Pending",
  };
  let stored: PortalRequest[] = [];
  try {
    const raw = window.localStorage.getItem(REQUESTS_KEY);
    stored = raw ? (JSON.parse(raw) as PortalRequest[]) : defaultRequests(request.memberName);
  } catch {
    stored = defaultRequests(request.memberName);
  }
  window.localStorage.setItem(REQUESTS_KEY, JSON.stringify([next, ...stored]));
  return next;
}

export function mineWorkOrders(workOrders: WorkOrder[], user: User | null) {
  return workOrders.filter((row) => isAssignedName(user, row.assignee) && row.status !== "Completed");
}

export function mineTasks(tasks: Task[], user: User | null) {
  return tasks.filter((row) => isAssignedName(user, row.assignee, row.assigneeInitials) && row.status !== "Done");
}

export function mineTickets(tickets: Ticket[], user: User | null) {
  return tickets.filter((row) => isAssignedName(user, row.assignee) && row.status !== "Resolved");
}

export function mineProjects(projects: Project[], allocations: ResourceAllocation[], user: User | null) {
  const name = user?.name ?? "";
  const allocated = new Set(allocations.filter((row) => row.memberName === name).map((row) => row.projectId));
  return projects.filter(
    (row) =>
      row.status !== "Completed" &&
      row.status !== "Cancelled" &&
      (row.manager === name || allocated.has(row.id)),
  );
}

export function portalAssignments(input: {
  user: User | null;
  projects: Project[];
  allocations: ResourceAllocation[];
  workOrders: WorkOrder[];
  tasks: Task[];
  tickets: Ticket[];
}): PortalAssignment[] {
  const { user } = input;
  const rows: PortalAssignment[] = [
    ...mineProjects(input.projects, input.allocations, user).map((row) => ({
      id: row.id,
      title: row.name,
      kind: "Project" as const,
      subtitle: row.projectType || row.companyName,
      status: row.status,
      href: `/app/projects/view/?id=${row.id}`,
      date: row.due,
    })),
    ...mineWorkOrders(input.workOrders, user).map((row) => ({
      id: row.id,
      title: row.title,
      kind: "Work order" as const,
      subtitle: row.companyName,
      status: row.status,
      href: "/app/work-orders",
      date: row.scheduled,
    })),
    ...mineTasks(input.tasks, user).map((row) => ({
      id: row.id,
      title: row.name,
      kind: "Task" as const,
      subtitle: row.projectName,
      status: row.status,
      href: `/app/projects/view/?id=${row.projectId}`,
      date: row.due,
    })),
    ...mineTickets(input.tickets, user).map((row) => ({
      id: row.id,
      title: row.subject,
      kind: "Ticket" as const,
      subtitle: row.companyName,
      status: row.status,
      href: `/app/tickets/view/?id=${row.id}`,
      date: row.slaDue,
    })),
  ];
  if (rows.length) return rows;
  return defaultAssignments(user?.name ?? "");
}

export function weekHoursByDay(entries: TimeEntry[], name: string, start = weekStart()) {
  const days = weekDays(start).slice(0, 5);
  const mine = entries.filter((row) => row.userName === name);
  const logged = days.map((day) => mine.filter((row) => row.date === day).reduce((sum, row) => sum + row.hours, 0));
  if (logged.some((value) => value > 0)) return logged;
  return defaultWeekHours(name);
}

export function weekHoursTotal(hours: number[]) {
  return Math.round(hours.reduce((sum, value) => sum + value, 0) * 10) / 10;
}

export function loggedWeekHours(entries: TimeEntry[], name: string, start = weekStart()) {
  const end = addDaysIso(start, 6);
  const total = entries
    .filter((row) => row.userName === name && row.date >= start && row.date <= end)
    .reduce((sum, row) => sum + row.hours, 0);
  if (total) return Math.round(total * 10) / 10;
  return isDemoEmployee(name) ? 28 : 0;
}

export function portalRequests(input: { name: string; expenses: Expense[] }): PortalRequest[] {
  const saved = loadEmployeeRequests(input.name);
  const expenses = input.expenses
    .filter((row) => row.userName === input.name)
    .map((row) => ({
      id: row.id,
      memberName: input.name,
      kind: "Expense" as const,
      title: row.vendor || row.note || "Expense",
      date: row.date,
      status: row.status,
    }));
  const ids = new Set(expenses.map((row) => row.title + row.date));
  return [...saved.filter((row) => row.kind !== "Expense" || !ids.has(row.title + row.date)), ...expenses];
}

export function portalAnnouncements(notifications: NotificationItem[]): PortalAnnouncement[] {
  const fromNotes = notifications.slice(0, 4).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    posted: row.createdAt.slice(0, 10),
    href: row.href,
  }));
  const firm = firmAnnouncements();
  const titles = new Set(fromNotes.map((row) => row.title));
  return [...fromNotes, ...firm.filter((row) => !titles.has(row.title))];
}

export function postedAgo(iso: string) {
  const days = Math.round((Date.now() - new Date(`${iso}T12:00:00`).getTime()) / 86400000);
  if (!Number.isFinite(days) || days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function allocationPct(allocations: ResourceAllocation[], name: string) {
  const mine = allocations.filter((row) => row.memberName === name);
  if (!mine.length) return isDemoEmployee(name) ? 80 : 0;
  return Math.round(mine.reduce((sum, row) => sum + row.allocationPct, 0));
}

export function memberManager(team: TeamMember[], member?: TeamMember) {
  if (!member?.managerId) return "";
  return team.find((row) => row.id === member.managerId)?.name ?? "";
}

export function requestLabel(row: PortalRequest) {
  return `${row.kind} · ${formatDisplayDate(row.date)}`;
}
