import type { Milestone, Project, Task, TimeEntry, TimesheetWorkKind } from "./types";

export type { TimesheetWorkKind };

export type TimesheetWork = {
  key: string;
  kind: TimesheetWorkKind;
  projectId: string;
  projectName: string;
  companyName?: string;
  milestoneId?: string;
  milestoneName?: string;
  taskId?: string;
  taskName?: string;
  parentTaskName?: string;
  label: string;
  detail: string;
};

export function workKey(work: {
  kind: TimesheetWorkKind;
  projectId: string;
  milestoneId?: string;
  taskId?: string;
}) {
  if (work.taskId) return `${work.kind}:${work.taskId}`;
  if (work.milestoneId) return `phase:${work.milestoneId}`;
  return `project:${work.projectId}`;
}

export function workKindOf(task?: Pick<Task, "parentTaskId"> | null, milestone?: Pick<Milestone, "id"> | null): TimesheetWorkKind {
  if (task?.parentTaskId) return "subtask";
  if (task) return "task";
  if (milestone) return "phase";
  return "project";
}

export function describeWork(work: Pick<TimesheetWork, "kind" | "projectName" | "milestoneName" | "taskName" | "parentTaskName">) {
  if (work.kind === "subtask") {
    return {
      label: work.taskName ?? "Subtask",
      detail: [work.parentTaskName, work.milestoneName, work.projectName].filter(Boolean).join(" / "),
    };
  }
  if (work.kind === "task") {
    return {
      label: work.taskName ?? "Task",
      detail: [work.milestoneName, work.projectName].filter(Boolean).join(" / "),
    };
  }
  if (work.kind === "phase") {
    return {
      label: work.milestoneName ?? "Phase",
      detail: work.projectName,
    };
  }
  return { label: work.projectName, detail: "Project" };
}

function hydrate(
  kind: TimesheetWorkKind,
  project: Pick<Project, "id" | "name"> & { companyName?: string },
  extras?: { milestone?: Pick<Milestone, "id" | "name">; task?: Pick<Task, "id" | "name" | "parentTaskId">; parentTaskName?: string },
): TimesheetWork {
  const base = {
    kind,
    projectId: project.id,
    projectName: project.name,
    companyName: project.companyName,
    milestoneId: extras?.milestone?.id,
    milestoneName: extras?.milestone?.name,
    taskId: extras?.task?.id,
    taskName: extras?.task?.name,
    parentTaskName: extras?.parentTaskName,
  };
  return { ...base, key: workKey(base), ...describeWork(base) };
}

type ProjectRef = Pick<Project, "id" | "name"> & { companyName?: string };
type TaskRef = Pick<Task, "id" | "name" | "projectId" | "milestoneId" | "parentTaskId">;
type MilestoneRef = Pick<Milestone, "id" | "name" | "projectId" | "kind" | "parentId">;

export function workFromEntry(
  entry: TimeEntry,
  projects: ProjectRef[],
  tasks: TaskRef[],
  milestones: MilestoneRef[],
): TimesheetWork {
  const project = projects.find((item) => item.id === entry.projectId) ?? {
    id: entry.projectId,
    name: entry.projectName,
    companyName: undefined,
  };
  const task = tasks.find((item) => item.id === entry.taskId);
  const parent = task?.parentTaskId ? tasks.find((item) => item.id === task.parentTaskId) : undefined;
  const milestone = milestones.find((item) => item.id === (entry.milestoneId ?? task?.milestoneId));
  const kind = entry.workKind ?? workKindOf(task, milestone);
  return hydrate(kind, project, { milestone, task, parentTaskName: parent?.name });
}

export function searchTimesheetWork(input: {
  query: string;
  objectType: "All" | TimesheetWorkKind | TimesheetWorkKind[];
  projects: ProjectRef[];
  tasks: TaskRef[];
  milestones: MilestoneRef[];
}): TimesheetWork[] {
  const q = input.query.trim().toLowerCase();
  if (!q) return [];
  const hits: TimesheetWork[] = [];
  const selected = Array.isArray(input.objectType) ? input.objectType : input.objectType === "All" ? [] : [input.objectType];
  const allow = (kind: TimesheetWorkKind) => !selected.length || selected.includes(kind);

  if (allow("project")) {
    for (const project of input.projects) {
      const hay = `${project.name} ${project.companyName ?? ""}`.toLowerCase();
      if (hay.includes(q)) hits.push(hydrate("project", project));
    }
  }
  if (allow("phase")) {
    for (const phase of input.milestones.filter((item) => item.kind === "phase" || !item.parentId)) {
      const project = input.projects.find((item) => item.id === phase.projectId);
      if (!project) continue;
      const hay = `${phase.name} ${project.name} ${project.companyName ?? ""} milestone`.toLowerCase();
      if (hay.includes(q)) {
        hits.push(hydrate("phase", project, { milestone: phase }));
      }
    }
  }
  if (allow("task") || allow("subtask")) {
    for (const task of input.tasks) {
      const kind = workKindOf(task);
      if (!allow(kind)) continue;
      const project = input.projects.find((item) => item.id === task.projectId);
      if (!project) continue;
      const parent = task.parentTaskId ? input.tasks.find((item) => item.id === task.parentTaskId) : undefined;
      const milestone = input.milestones.find((item) => item.id === task.milestoneId);
      const hay = `${task.name} ${parent?.name ?? ""} ${milestone?.name ?? ""} ${project.name} ${project.companyName ?? ""}`.toLowerCase();
      if (hay.includes(q)) hits.push(hydrate(kind, project, { milestone, task, parentTaskName: parent?.name }));
    }
  }
  return hits.slice(0, 12);
}

export function workToLogDefaults(
  work: Pick<TimesheetWork, "projectId" | "milestoneId" | "taskId" | "kind">,
  extra?: { date?: string; hours?: number; start?: string },
) {
  return {
    projectId: work.projectId,
    milestoneId: work.milestoneId,
    taskId: work.taskId,
    workKind: work.kind,
    date: extra?.date,
    hours: extra?.hours,
    start: extra?.start,
  };
}

export function timerClock(startedAt: number, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  return {
    seconds,
    label: `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
    hours: Math.max(0.25, Math.round((seconds / 3600) * 4) / 4),
  };
}
