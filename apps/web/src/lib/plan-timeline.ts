import { formatShortDate } from "./seed";
import type { Milestone, Project, Task } from "./types";

export type TimelineError = { title: string; body: string };
export type DateWindow = { start: string; end: string };

export const DATE_OUTSIDE_TITLE = "Date Outside Project Timeline";

export function isoDay(value: string | undefined) {
  return (value ?? "").slice(0, 10);
}

export function isIsoDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function laterDay(a: string, b: string) {
  return a > b ? a : b;
}

export function earlierDay(a: string, b: string) {
  return a < b ? a : b;
}

export function projectWindow(project: Pick<Project, "start" | "due">): DateWindow {
  return { start: isoDay(project.start), end: isoDay(project.due) };
}

export function intersectWindows(windows: DateWindow[]): DateWindow | null {
  if (!windows.length) return null;
  const start = windows.reduce((acc, window) => laterDay(acc, window.start), windows[0].start);
  const end = windows.reduce((acc, window) => earlierDay(acc, window.end), windows[0].end);
  if (!isIsoDay(start) || !isIsoDay(end) || start > end) return null;
  return { start, end };
}

export function outsideProjectMessage(window: DateWindow): TimelineError {
  return {
    title: DATE_OUTSIDE_TITLE,
    body: `The selected date falls outside the project's scheduled timeline. Please select a date between ${formatShortDate(window.start)} and ${formatShortDate(window.end)}.`,
  };
}

export function startAfterDueError(): TimelineError {
  return {
    title: DATE_OUTSIDE_TITLE,
    body: "The start date cannot be after the due date. Please choose a start date on or before the due date.",
  };
}

export function outsideParentMessage(name: string, window: DateWindow): TimelineError {
  return {
    title: DATE_OUTSIDE_TITLE,
    body: `The selected date falls outside ${name}. Please select a date between ${formatShortDate(window.start)} and ${formatShortDate(window.end)}.`,
  };
}

export function validateRange(
  start: string,
  due: string,
  window: DateWindow | null,
  project: DateWindow,
  parentName?: string,
): TimelineError | null {
  const startDay = isoDay(start);
  const dueDay = isoDay(due);
  if (!isIsoDay(startDay) || !isIsoDay(dueDay)) return outsideProjectMessage(project);
  if (startDay > dueDay) return startAfterDueError();
  if (startDay < project.start || dueDay > project.end || startDay > project.end || dueDay < project.start) {
    return outsideProjectMessage(project);
  }
  if (!window) return outsideProjectMessage(project);
  if (startDay < window.start || dueDay > window.end) {
    return parentName ? outsideParentMessage(parentName, window) : outsideProjectMessage(project);
  }
  return null;
}

export function parentMilestonesForTask(task: Pick<Task, "milestoneId">, milestones: Milestone[]) {
  const direct = milestones.find((row) => row.id === task.milestoneId);
  if (!direct) return [] as Milestone[];
  const phase = direct.parentId ? milestones.find((row) => row.id === direct.parentId) : undefined;
  return phase && phase.id !== direct.id ? [phase, direct] : [direct];
}

export function windowForTask(
  task: Pick<Task, "milestoneId" | "parentTaskId">,
  project: Pick<Project, "start" | "due">,
  milestones: Milestone[],
  tasks: Task[],
  overrides?: { milestone?: Milestone; parentTask?: Pick<Task, "start" | "due" | "name"> },
): { window: DateWindow | null; project: DateWindow; parentName?: string } {
  const projectWin = projectWindow(project);
  const windows: DateWindow[] = [projectWin];
  let parentName: string | undefined;
  const parents = overrides?.milestone ? [overrides.milestone] : parentMilestonesForTask(task, milestones);
  parents.forEach((row) => {
    windows.push({ start: isoDay(row.start), end: isoDay(row.due) });
    parentName = row.name;
  });
  const parentTask =
    overrides?.parentTask ?? (task.parentTaskId ? tasks.find((row) => row.id === task.parentTaskId) : undefined);
  if (parentTask) {
    windows.push({ start: isoDay(parentTask.start), end: isoDay(parentTask.due) });
    parentName = parentTask.name;
  }
  return { window: intersectWindows(windows), project: projectWin, parentName };
}

export function windowForMilestone(
  milestone: Pick<Milestone, "parentId">,
  project: Pick<Project, "start" | "due">,
  milestones: Milestone[],
): { window: DateWindow | null; project: DateWindow; parentName?: string } {
  const projectWin = projectWindow(project);
  const windows: DateWindow[] = [projectWin];
  let parentName: string | undefined;
  if (milestone.parentId) {
    const parent = milestones.find((row) => row.id === milestone.parentId);
    if (parent) {
      windows.push({ start: isoDay(parent.start), end: isoDay(parent.due) });
      parentName = parent.name;
    }
  }
  return { window: intersectWindows(windows), project: projectWin, parentName };
}

export function validateTaskDates(
  task: Pick<Task, "start" | "due" | "milestoneId" | "parentTaskId">,
  project: Pick<Project, "start" | "due">,
  milestones: Milestone[],
  tasks: Task[],
  overrides?: { milestone?: Milestone; parentTask?: Pick<Task, "start" | "due" | "name"> },
) {
  const ctx = windowForTask(task, project, milestones, tasks, overrides);
  return validateRange(task.start, task.due, ctx.window, ctx.project, ctx.parentName);
}

export function validateMilestoneDates(
  milestone: Pick<Milestone, "start" | "due" | "parentId" | "name">,
  project: Pick<Project, "start" | "due">,
  milestones: Milestone[],
) {
  const ctx = windowForMilestone(milestone, project, milestones);
  return validateRange(milestone.start, milestone.due, ctx.window, ctx.project, ctx.parentName);
}

export function childTasksOutsideMilestone(
  milestone: Pick<Milestone, "id" | "start" | "due" | "name">,
  milestones: Milestone[],
  tasks: Task[],
) {
  const ids = new Set([
    milestone.id,
    ...milestones.filter((row) => row.parentId === milestone.id).map((row) => row.id),
  ]);
  return tasks.filter(
    (task) =>
      task.milestoneId &&
      ids.has(task.milestoneId) &&
      (isoDay(task.start) < isoDay(milestone.start) || isoDay(task.due) > isoDay(milestone.due)),
  );
}

export function childTasksOutsideTask(parent: Pick<Task, "id" | "start" | "due">, tasks: Task[]) {
  return tasks.filter(
    (task) =>
      task.parentTaskId === parent.id &&
      (isoDay(task.start) < isoDay(parent.start) || isoDay(task.due) > isoDay(parent.due)),
  );
}

export function defaultDatesInWindow(window: DateWindow | null, project: DateWindow) {
  const next = window ?? project;
  return { start: next.start, due: next.end };
}

export function pickerBounds(window: DateWindow | null, project: DateWindow, start: string, due: string) {
  const next = window ?? project;
  return {
    startMin: next.start,
    startMax: earlierDay(next.end, due || next.end),
    dueMin: laterDay(next.start, start || next.start),
    dueMax: next.end,
  };
}

export function projectDateConflict(
  nextStart: string,
  nextDue: string,
  milestones: Milestone[],
  tasks: Task[],
): TimelineError | null {
  const start = isoDay(nextStart);
  const due = isoDay(nextDue);
  if (!isIsoDay(start) || !isIsoDay(due)) {
    return outsideProjectMessage({ start: nextStart, end: nextDue });
  }
  if (start > due) return startAfterDueError();
  const window = { start, end: due };
  const outside = [
    ...milestones.filter((row) => isoDay(row.start) < start || isoDay(row.due) > due),
    ...tasks.filter((row) => isoDay(row.start) < start || isoDay(row.due) > due),
  ];
  if (!outside.length) return null;
  const names = outside.slice(0, 6).map((row) => row.name).join(", ");
  const extra = outside.length > 6 ? ` and ${outside.length - 6} more` : "";
  const base = outsideProjectMessage(window);
  return {
    title: DATE_OUTSIDE_TITLE,
    body: `${base.body} These items would fall outside the new dates: ${names}${extra}. Resolve those dates first.`,
  };
}
