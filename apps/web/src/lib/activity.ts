import type {
  ActivityItem,
  ActivityType,
  Company,
  CompanyFile,
  Milestone,
  Project,
  ProjectFile,
  ProjectNote,
  Task,
  TimeEntry,
} from "./types";

export const ACTIVITY_TYPES: { id: ActivityType; label: string }[] = [
  { id: "comment", label: "Comments" },
  { id: "status", label: "Status" },
  { id: "task", label: "Tasks" },
  { id: "time", label: "Time" },
  { id: "approval", label: "Approvals" },
  { id: "file", label: "Files" },
  { id: "budget", label: "Budget" },
  { id: "milestone", label: "Milestones" },
  { id: "project", label: "Projects" },
];

export type DateFilter = "all" | "today" | "7d" | "30d";

export const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: "all", label: "All dates" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

export function makeActivity(input: {
  companyId?: string;
  projectId?: string;
  type: ActivityType;
  actor: string;
  action: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  href?: string;
  text?: string;
  id?: string;
  at?: string;
  when?: string;
}): ActivityItem {
  const at = input.at ?? new Date().toISOString();
  const when = input.when ?? formatWhen(at);
  const entity = input.entityLabel ? ` on ${input.entityLabel}` : "";
  return {
    id: input.id ?? `a-${Math.random().toString(36).slice(2, 9)}`,
    companyId: input.companyId,
    projectId: input.projectId,
    type: input.type,
    actor: input.actor,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    entityLabel: input.entityLabel,
    href: input.href,
    at,
    when,
    text: input.text ?? `${input.actor} ${input.action}${entity}.`,
  };
}

export function inferActivityType(text: string): ActivityType {
  const t = text.toLowerCase();
  if (t.includes("logged") && t.includes("h")) return "time";
  if (t.includes("approved") || t.includes("signoff") || t.includes("gate")) return "approval";
  if (t.includes("attachment") || t.includes("uploaded") || t.includes("file")) return "file";
  if (t.includes("budget")) return "budget";
  if (t.includes("milestone") || t.includes("phase") || t.includes("workstream")) return "milestone";
  if (t.includes("task")) return "task";
  if (t.includes("status")) return "status";
  if (t.includes("project")) return "project";
  return "comment";
}

export function normalizeActivity(item: ActivityItem): ActivityItem {
  const type = item.type ?? inferActivityType(item.text);
  const actor = item.actor ?? guessActor(item.text);
  const action = item.action ?? item.text.replace(new RegExp(`^${actor}\\s*`, "i"), "").replace(/\.$/, "");
  return {
    ...item,
    type,
    actor,
    action,
    at: item.at ?? isoFromWhen(item.when),
    href: item.href ?? defaultHref(item),
  };
}

export function activityTime(item: ActivityItem) {
  return new Date(item.at ?? isoFromWhen(item.when)).getTime();
}

export function filterActivities(
  items: ActivityItem[],
  type: ActivityType | "all",
  date: DateFilter,
) {
  const start = dateStart(date);
  return items.filter((item) => {
    if (type !== "all" && item.type !== type) return false;
    if (start && activityTime(item) < start) return false;
    return true;
  });
}

export function composeActivityFeed({
  companyId,
  projectId,
  activities,
  projects,
  tasks,
  timeEntries,
  milestones,
  company,
}: {
  companyId?: string;
  projectId?: string;
  activities: ActivityItem[];
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  milestones: Milestone[];
  company?: Company;
}): ActivityItem[] {
  const scopedProjects = projects.filter((p) => {
    if (projectId) return p.id === projectId;
    if (companyId) return p.companyId === companyId;
    return true;
  });
  const projectIds = new Set(scopedProjects.map((p) => p.id));
  const stored = activities
    .filter((a) => {
      if (projectId) return a.projectId === projectId;
      if (companyId) return a.companyId === companyId || (!!a.projectId && projectIds.has(a.projectId));
      return true;
    })
    .map(normalizeActivity);

  const covered = new Set(
    stored.filter((e) => e.entityId && e.type).map((e) => `${e.type}:${e.entityId}:${e.action}`),
  );
  const derived: ActivityItem[] = [];

  function add(item: ActivityItem) {
    const key = `${item.type}:${item.entityId ?? item.id}:${item.action}`;
    if (covered.has(key)) return;
    covered.add(key);
    derived.push(item);
  }

  for (const project of scopedProjects) {
    for (const file of project.files) {
      add(
        makeActivity({
          id: `derived-file-${project.id}-${file.id}`,
          type: "file",
          actor: project.manager,
          action: "uploaded a file",
          companyId: project.companyId,
          projectId: project.id,
          entityType: "file",
          entityId: file.id,
          entityLabel: file.name,
          href: `/app/projects/view/?id=${project.id}`,
          at: `${project.start}T10:00:00`,
          when: formatWhen(`${project.start}T10:00:00`),
        }),
      );
    }
    for (const note of project.notes) {
      add(
        makeActivity({
          id: `derived-note-${note.id}`,
          type: "comment",
          actor: note.author,
          action: note.body,
          companyId: project.companyId,
          projectId: project.id,
          entityType: "note",
          entityId: note.id,
          entityLabel: project.name,
          href: `/app/projects/view/?id=${project.id}`,
          at: isoFromWhen(note.createdAt),
          when: note.createdAt,
        }),
      );
    }
  }

  const scopedTime = timeEntries.filter((t) => projectIds.has(t.projectId));
  for (const entry of scopedTime) {
    const project = scopedProjects.find((p) => p.id === entry.projectId);
    add(
      makeActivity({
        id: `derived-time-${entry.id}`,
        type: "time",
        actor: entry.userName,
        action: `logged ${entry.hours}h`,
        companyId: project?.companyId,
        projectId: entry.projectId,
        entityType: entry.taskId ? "task" : "project",
        entityId: entry.id,
        entityLabel: entry.taskName ?? entry.projectName,
        href: `/app/projects/view/?id=${entry.projectId}`,
        at: `${entry.date}T12:00:00`,
        when: formatWhen(`${entry.date}T12:00:00`),
        text: `${entry.userName} logged ${entry.hours}h on ${entry.projectName}.`,
      }),
    );
    if (entry.status === "Approved") {
      add(
        makeActivity({
          id: `derived-time-approval-${entry.id}`,
          type: "approval",
          actor: project?.manager ?? "PM",
          action: "approved time",
          companyId: project?.companyId,
          projectId: entry.projectId,
          entityType: "time",
          entityId: entry.id,
          entityLabel: `${entry.hours}h · ${entry.projectName}`,
          href: "/app/timesheets",
          at: `${entry.date}T16:00:00`,
          when: formatWhen(`${entry.date}T16:00:00`),
        }),
      );
    }
  }

  const scopedMilestones = milestones.filter((m) => projectIds.has(m.projectId));
  for (const milestone of scopedMilestones) {
    const project = scopedProjects.find((p) => p.id === milestone.projectId);
    add(
      makeActivity({
        id: `derived-ms-${milestone.id}`,
        type: "milestone",
        actor: project?.manager ?? "PM",
        action: milestone.status === "Not Started" ? "added a milestone" : `updated milestone to ${milestone.status}`,
        companyId: project?.companyId,
        projectId: milestone.projectId,
        entityType: "milestone",
        entityId: milestone.id,
        entityLabel: milestone.name,
        href: `/app/projects/view/?id=${milestone.projectId}`,
        at: `${milestone.start}T09:00:00`,
        when: formatWhen(`${milestone.start}T09:00:00`),
      }),
    );
    if (milestone.status === "Approved") {
      add(
        makeActivity({
          id: `derived-ms-approval-${milestone.id}`,
          type: "approval",
          actor: project?.manager ?? "PM",
          action: "approved milestone",
          companyId: project?.companyId,
          projectId: milestone.projectId,
          entityType: "milestone",
          entityId: milestone.id,
          entityLabel: milestone.name,
          href: `/app/projects/view/?id=${milestone.projectId}`,
          at: `${milestone.due}T15:00:00`,
          when: formatWhen(`${milestone.due}T15:00:00`),
        }),
      );
    }
  }

  if (company && !projectId) {
    for (const item of collectCompanyFileEvents(company)) add(item);
  }

  const scopedTasks = tasks.filter((t) => projectIds.has(t.projectId));
  for (const task of scopedTasks.filter((t) => t.status === "Done" || t.status === "In Progress" || t.status === "Review")) {
    const project = scopedProjects.find((p) => p.id === task.projectId);
    add(
      makeActivity({
        id: `derived-task-${task.id}`,
        type: "task",
        actor: task.assignee,
        action: `moved task to ${task.status}`,
        companyId: project?.companyId,
        projectId: task.projectId,
        entityType: "task",
        entityId: task.id,
        entityLabel: task.name,
        href: `/app/projects/view/?id=${task.projectId}`,
        at: `${task.start}T14:00:00`,
        when: formatWhen(`${task.start}T14:00:00`),
      }),
    );
  }

  return [...stored, ...derived].sort((a, b) => activityTime(b) - activityTime(a));
}

export function composeCompanyFiles(company: Company | undefined): { files: CompanyFile[]; company?: Company } {
  return { files: company?.files ?? [], company };
}

export function collectCompanyFileEvents(company: Company | undefined): ActivityItem[] {
  if (!company) return [];
  return (company.files ?? []).map((file: ProjectFile | CompanyFile) =>
    makeActivity({
      id: `derived-cfile-${company.id}-${file.id}`,
      type: "file",
      actor: company.accountManager,
      action: "uploaded a file",
      companyId: company.id,
      entityType: "file",
      entityId: file.id,
      entityLabel: file.name,
      href: `/app/companies/view/?id=${company.id}`,
      at: company.createdAt ? `${company.createdAt}T11:00:00` : undefined,
    }),
  );
}

function guessActor(text: string) {
  const match = text.match(/^([A-Z][a-z]+(?:\s[A-Z]\.?\s[A-Z][a-z]+)?|[A-Z]\.\s[A-Z][a-z]+)/);
  return match?.[1] ?? "Staff";
}

function defaultHref(item: ActivityItem) {
  if (item.projectId) return `/app/projects/view/?id=${item.projectId}`;
  if (item.companyId) return `/app/companies/view/?id=${item.companyId}`;
  return undefined;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const time = date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  if (day === start) return `Today, ${time}`;
  if (day === start - 86400000) return `Yesterday, ${time}`;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isoFromWhen(when: string) {
  if (/today/i.test(when)) return new Date().toISOString();
  if (/yesterday/i.test(when)) return new Date(Date.now() - 86400000).toISOString();
  const parsed = new Date(when);
  if (!Number.isNaN(parsed.getTime()) && /\d{4}|,/.test(when)) return parsed.toISOString();
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const idx = months.findIndex((m) => when.toLowerCase().includes(m));
  if (idx >= 0) {
    const day = Number((when.match(/\d{1,2}/) ?? ["1"])[0]);
    return new Date(2026, idx, day, 12, 0, 0).toISOString();
  }
  return new Date().toISOString();
}

function dateStart(filter: DateFilter) {
  if (filter === "all") return 0;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (filter === "today") return start;
  if (filter === "7d") return start - 6 * 86400000;
  return start - 29 * 86400000;
}
