import { roundMoney } from "./invoice";
import { memberRate } from "./project-workspace";
import { RETAINER_SERVICE_ITEMS } from "./retainers";
import { moneyExact } from "./seed";
import type { MaterialLine, Project, Task, TeamMember } from "./types";

export type PlanAlert = { title: string; body: string };

export const BUDGET_EXCEEDS_TITLE = "Budget Exceeds Project Allocation";
export const TIME_EXCEEDS_TITLE = "Time Allocation Exceeded";

export const PLAN_SERVICE_ITEMS = [
  "No service item",
  ...RETAINER_SERVICE_ITEMS,
  "Project management",
  "Consulting",
] as const;

export function roundHours(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function taskHours(task: Pick<Task, "estimateHours" | "estimateMinutes">) {
  return roundHours((Number(task.estimateHours) || 0) + (Number(task.estimateMinutes) || 0) / 60);
}

export function formatHours(value: number) {
  const hours = roundHours(value);
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}h`;
}

export function materialsTotal(materials: MaterialLine[] | undefined) {
  return roundMoney(
    (materials ?? []).reduce((sum, row) => sum + (Number(row.qty) || 0) * (Number(row.salePrice) || 0), 0),
  );
}

export function laborBudget(hours: number, rate: number) {
  return roundMoney(hours * (Number(rate) || 0));
}

export function computedTaskBudget(task: Task, fallbackRate: number) {
  const hours = taskHours(task);
  const rate = task.hourlyRate ?? fallbackRate;
  const calculated = roundMoney(laborBudget(hours, rate) + materialsTotal(task.materials));
  if (task.budgetMode === "fixed") return roundMoney(Number(task.budgetAmount) || 0);
  if (task.budgetMode === "calculated") return calculated;
  if (task.budgetAmount != null) return roundMoney(task.budgetAmount);
  return calculated;
}

export function leafTasks(tasks: Task[]) {
  const parents = new Set(tasks.map((task) => task.parentTaskId).filter(Boolean) as string[]);
  return tasks.filter((task) => !parents.has(task.id));
}

export function milestoneTaskIds(milestoneId: string, milestones: { id: string; parentId?: string }[]) {
  const ids = new Set<string>([milestoneId]);
  let added = true;
  while (added) {
    added = false;
    milestones.forEach((row) => {
      if (row.parentId && ids.has(row.parentId) && !ids.has(row.id)) {
        ids.add(row.id);
        added = true;
      }
    });
  }
  return ids;
}

export function tasksUnderMilestone(
  milestoneId: string,
  milestones: { id: string; parentId?: string }[],
  tasks: Task[],
) {
  const ids = milestoneTaskIds(milestoneId, milestones);
  return tasks.filter((task) => task.milestoneId && ids.has(task.milestoneId));
}

export function allocatedBudget(tasks: Task[], rateFor: (task: Task) => number) {
  return roundMoney(leafTasks(tasks).reduce((sum, task) => sum + computedTaskBudget(task, rateFor(task)), 0));
}

export function allocatedHours(tasks: Task[]) {
  return roundHours(leafTasks(tasks).reduce((sum, task) => sum + taskHours(task), 0));
}

export function childTaskHours(parentId: string, tasks: Task[]) {
  return allocatedHours(tasks.filter((task) => task.parentTaskId === parentId || task.id === parentId));
}

export function childTaskBudget(parentId: string, tasks: Task[], rateFor: (task: Task) => number) {
  return allocatedBudget(
    tasks.filter((task) => task.parentTaskId === parentId || task.id === parentId),
    rateFor,
  );
}

export function remainingBudget(approved: number, allocated: number) {
  return roundMoney((Number(approved) || 0) - allocated);
}

export function remainingHours(approved: number, allocated: number) {
  return roundHours((Number(approved) || 0) - allocated);
}

export function allocationSummary(
  project: Pick<Project, "budgetAmount" | "budgetHours">,
  tasks: Task[],
  rateFor: (task: Task) => number,
) {
  const approvedBudget = roundMoney(Number(project.budgetAmount) || 0);
  const approvedHours = roundHours(Number(project.budgetHours) || 0);
  const usedBudget = allocatedBudget(tasks, rateFor);
  const usedHours = allocatedHours(tasks);
  return {
    approvedBudget,
    approvedHours,
    usedBudget,
    usedHours,
    remainingBudget: remainingBudget(approvedBudget, usedBudget),
    remainingHours: remainingHours(approvedHours, usedHours),
    budgetPct: approvedBudget > 0 ? Math.round((usedBudget / approvedBudget) * 100) : 0,
    hoursPct: approvedHours > 0 ? Math.round((usedHours / approvedHours) * 100) : 0,
  };
}

export function staffRateOptions(project: Project, team: TeamMember[]) {
  const rows: { name: string; rate: number }[] = [{ name: "No Rate", rate: 0 }];
  const seen = new Set(["no rate"]);
  team.forEach((member) => {
    const label = member.title?.trim() || member.name;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ name: label, rate: memberRate(member.name, project, team) });
  });
  (project.rates ?? []).forEach((row) => {
    const key = row.memberName.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ name: row.memberName, rate: row.hourlyRate });
  });
  return rows;
}

function budgetOverflowMessage(): PlanAlert {
  return {
    title: BUDGET_EXCEEDS_TITLE,
    body: "The total budget allocated to milestones and tasks exceeds the project's approved budget. Please adjust the allocation before saving.",
  };
}

function timeOverflowMessage(): PlanAlert {
  return {
    title: TIME_EXCEEDS_TITLE,
    body: "The total time allocated to milestones and tasks exceeds the project's available hours. Please adjust the allocation before saving.",
  };
}

export function validateTaskAllocation(
  next: Task,
  project: Pick<Project, "budgetAmount" | "budgetHours">,
  tasks: Task[],
  rateFor: (task: Task) => number,
): PlanAlert | null {
  const currentBudget = allocatedBudget(tasks, rateFor);
  const currentHours = allocatedHours(tasks);
  const others = tasks.filter((task) => task.id !== next.id);
  const nextTasks = leafTasks([...others, next]).some((task) => task.id === next.id)
    ? [...others, next]
    : others;
  const usedBudget = allocatedBudget(nextTasks, rateFor);
  const usedHours = allocatedHours(nextTasks);
  const approvedBudget = Number(project.budgetAmount) || 0;
  const approvedHours = Number(project.budgetHours) || 0;
  if (approvedBudget > 0 && usedBudget > approvedBudget + 0.009 && usedBudget > currentBudget + 0.009) {
    return budgetOverflowMessage();
  }
  if (approvedHours > 0 && usedHours > approvedHours + 0.009 && usedHours > currentHours + 0.009) {
    return timeOverflowMessage();
  }
  return null;
}

export function validateProjectCaps(
  nextBudget: number,
  nextHours: number,
  tasks: Task[],
  rateFor: (task: Task) => number,
): PlanAlert | null {
  const usedBudget = allocatedBudget(tasks, rateFor);
  const usedHours = allocatedHours(tasks);
  if (nextBudget > 0 && usedBudget > nextBudget + 0.009) {
    return {
      title: BUDGET_EXCEEDS_TITLE,
      body: `Allocated budget is ${moneyExact(usedBudget)}. The new project budget of ${moneyExact(nextBudget)} is below that amount. Please adjust the allocation before saving.`,
    };
  }
  if (nextHours > 0 && usedHours > nextHours + 0.009) {
    return {
      title: TIME_EXCEEDS_TITLE,
      body: `Allocated time is ${formatHours(usedHours)}. The new project hours of ${formatHours(nextHours)} are below that amount. Please adjust the allocation before saving.`,
    };
  }
  return null;
}
