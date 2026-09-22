import type { Milestone, Project, Task } from "./types";

export function toTime(iso: string) {
  return new Date(`${iso}T12:00:00`).getTime();
}

export function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function durationDays(start: string, due: string) {
  return Math.max(1, Math.round((toTime(due) - toTime(start)) / 86400000) + 1);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ganttDayLabel(iso: string) {
  const parts = iso.split("-");
  const month = parts[1];
  const day = parts[2];
  return month && day ? `${month}/${day}` : iso;
}

export function ganttMonthLabel(iso: string) {
  const parts = iso.split("-");
  const year = parts[0];
  const month = MONTHS[Number(parts[1]) - 1];
  return month && year ? `${month} ${year}` : iso;
}

export function ganttMonthBands(ticks: string[]) {
  const bands: { key: string; label: string; count: number }[] = [];
  ticks.forEach((tick) => {
    const key = tick.slice(0, 7);
    const last = bands[bands.length - 1];
    if (last && last.key === key) {
      last.count += 1;
      return;
    }
    bands.push({ key, label: ganttMonthLabel(tick), count: 1 });
  });
  return bands;
}

export function isWeekend(iso: string) {
  const day = new Date(`${iso}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

export function sortPlanItems<T extends { sortOrder?: number; name: string }>(items: T[]) {
  return items.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
}

export function phaseMilestones(milestones: Milestone[]) {
  return milestones.filter((row) => row.kind === "phase" || !row.parentId);
}

export function groupMilestones(milestones: Milestone[]) {
  return milestones.filter((row) => row.kind === "group" || !!row.parentId);
}

export function milestoneIdForTask(task: Task, milestones: Milestone[]) {
  if (!task.milestoneId) return undefined;
  const row = milestones.find((item) => item.id === task.milestoneId);
  if (!row) return task.milestoneId;
  return row.parentId ?? row.id;
}

export function tasksForMilestone(milestoneId: string, tasks: Task[], milestones: Milestone[]) {
  const groups = groupMilestones(milestones).filter((row) => row.parentId === milestoneId);
  const ids = new Set([milestoneId, ...groups.map((row) => row.id)]);
  return sortPlanItems(tasks.filter((task) => !task.parentTaskId && task.milestoneId && ids.has(task.milestoneId)));
}

export function taskBudget(task: Task, hourlyRate: number) {
  if (task.budgetAmount != null) return task.budgetAmount;
  return Math.round((task.estimateHours || 0) * hourlyRate);
}

export function rollupRange(items: { start: string; due: string; progress: number }[]) {
  if (!items.length) {
    const today = new Date().toISOString().slice(0, 10);
    return { start: today, due: today, duration: 1, progress: 0 };
  }
  const start = items.map((item) => item.start).sort()[0];
  const due = items.map((item) => item.due).sort().slice(-1)[0];
  const progress = Math.round(items.reduce((sum, item) => sum + item.progress, 0) / items.length);
  return { start, due, duration: durationDays(start, due), progress };
}

export type PlanRowKind = "project" | "milestone" | "task" | "subtask";

export type PlanRow = {
  kind: PlanRowKind;
  id: string;
  name: string;
  assignee: string;
  status: string;
  start: string;
  due: string;
  duration: number;
  estimateHours: number;
  actualHours: number;
  budget: number;
  dependsOn?: string;
  progress: number;
  depth: number;
  task?: Task;
  milestone?: Milestone;
  parentTaskId?: string;
  milestoneId?: string;
  canExpand?: boolean;
};

export function buildPlanRows(input: {
  project: Pick<Project, "id" | "name" | "status" | "start" | "due">;
  milestones: Milestone[];
  tasks: Task[];
  hoursByTaskId: Record<string, number>;
  rateFor: (assignee: string) => number;
  collapsed: Record<string, boolean>;
  query?: string;
}): PlanRow[] {
  const q = input.query?.trim().toLowerCase() ?? "";
  const match = (name: string, assignee?: string) =>
    !q || name.toLowerCase().includes(q) || (assignee ?? "").toLowerCase().includes(q);
  const phases = phaseMilestones(input.milestones);
  const childrenOf = (parentId: string) =>
    sortPlanItems(input.tasks.filter((task) => task.parentTaskId === parentId));

  const rows: PlanRow[] = [];
  const leafMetrics: { start: string; due: string; progress: number; estimate: number; actual: number; budget: number }[] = [];

  phases.forEach((phase) => {
    const tasks = tasksForMilestone(phase.id, input.tasks, input.milestones).filter((task) => {
      if (match(task.name, task.assignee)) return true;
      return childrenOf(task.id).some((child) => match(child.name, child.assignee));
    });
    const descendant = tasks.flatMap((task) => [task, ...childrenOf(task.id)]);
    const estimateHours = descendant.reduce((sum, task) => sum + task.estimateHours, 0);
    const actualHours = descendant.reduce((sum, task) => sum + (input.hoursByTaskId[task.id] ?? 0), 0);
    const budget = descendant.reduce((sum, task) => sum + taskBudget(task, input.rateFor(task.assignee)), 0);
    const roll = rollupRange(
      descendant.length ? descendant : [{ start: phase.start, due: phase.due, progress: phase.status === "Approved" ? 100 : 0 }],
    );
    leafMetrics.push({ ...roll, estimate: estimateHours, actual: actualHours, budget });
    rows.push({
      kind: "milestone",
      id: phase.id,
      name: phase.name,
      assignee: "",
      status: phase.status,
      start: roll.start,
      due: roll.due,
      duration: roll.duration,
      estimateHours,
      actualHours,
      budget,
      progress: roll.progress,
      depth: 1,
      milestone: phase,
      milestoneId: phase.id,
      canExpand: true,
    });
    if (input.collapsed[phase.id]) return;
    tasks.forEach((task) => {
      const subs = childrenOf(task.id).filter((child) => match(child.name, child.assignee) || match(task.name, task.assignee));
      const family = [task, ...childrenOf(task.id)];
      const taskEstimate = family.reduce((sum, row) => sum + row.estimateHours, 0);
      const taskActual = family.reduce((sum, row) => sum + (input.hoursByTaskId[row.id] ?? 0), 0);
      const taskBudgetTotal = family.reduce((sum, row) => sum + taskBudget(row, input.rateFor(row.assignee)), 0);
      rows.push({
        kind: "task",
        id: task.id,
        name: task.name,
        assignee: task.assignee,
        status: task.status,
        start: task.start,
        due: task.due,
        duration: durationDays(task.start, task.due),
        estimateHours: taskEstimate,
        actualHours: taskActual,
        budget: taskBudgetTotal,
        dependsOn: task.dependsOn,
        progress: task.progress,
        depth: 2,
        task,
        parentTaskId: task.parentTaskId,
        milestoneId: phase.id,
        canExpand: childrenOf(task.id).length > 0,
      });
      if (input.collapsed[task.id]) return;
      subs.forEach((child) => {
        rows.push({
          kind: "subtask",
          id: child.id,
          name: child.name,
          assignee: child.assignee,
          status: child.status,
          start: child.start,
          due: child.due,
          duration: durationDays(child.start, child.due),
          estimateHours: child.estimateHours,
          actualHours: input.hoursByTaskId[child.id] ?? 0,
          budget: taskBudget(child, input.rateFor(child.assignee)),
          dependsOn: child.dependsOn,
          progress: child.progress,
          depth: 3,
          task: child,
          parentTaskId: child.parentTaskId,
          milestoneId: phase.id,
        });
      });
    });
  });

  const projectRoll = rollupRange(leafMetrics);
  const projectRow: PlanRow = {
    kind: "project",
    id: input.project.id,
    name: input.project.name,
    assignee: "",
    status: input.project.status,
    start: input.project.start,
    due: input.project.due,
    duration: durationDays(input.project.start, input.project.due),
    estimateHours: leafMetrics.reduce((sum, row) => sum + row.estimate, 0),
    actualHours: leafMetrics.reduce((sum, row) => sum + row.actual, 0),
    budget: leafMetrics.reduce((sum, row) => sum + row.budget, 0),
    progress: projectRoll.progress,
    depth: 0,
    canExpand: true,
  };
  return [projectRow, ...rows];
}
