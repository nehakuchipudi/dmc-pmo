import { allocationByMember, riskScore } from "./ppm";
import { computeProjectMetrics } from "./project-workspace";
import { utilizationLevel } from "./project-team";
import type {
  Expense,
  Milestone,
  Project,
  ProjectHealth,
  ResourceAllocation,
  RiskItem,
  Task,
  TeamMember,
  TimeEntry,
} from "./types";

export type InsightHealth = ProjectHealth;

export type InsightDeadline = {
  id: string;
  kind: "task" | "milestone" | "project";
  name: string;
  due: string;
  status: string;
};

export type MilestoneInsight = {
  id: string;
  name: string;
  status: Milestone["status"];
  due: string;
  progress: number;
  taskCount: number;
  overdue: boolean;
};

function todayIso(asOf?: string) {
  return asOf ?? new Date().toISOString().slice(0, 10);
}

function worstHealth(values: InsightHealth[]): InsightHealth {
  if (values.includes("Critical")) return "Critical";
  if (values.includes("Watch")) return "Watch";
  return "Healthy";
}

function phaseProgress(status: Milestone["status"], taskProgress: number[]) {
  if (status === "Approved") return 100;
  if (taskProgress.length) return Math.round(taskProgress.reduce((sum, n) => sum + n, 0) / taskProgress.length);
  if (status === "Awaiting Signoff") return 90;
  if (status === "In Progress") return 50;
  return 0;
}

export function scheduleHealth(input: {
  status: Project["status"];
  due: string;
  overdueTasks: number;
  overdueMilestones: number;
  asOf: string;
}): InsightHealth {
  const closed = input.status === "Completed" || input.status === "Cancelled";
  const projectLate = !closed && input.due < input.asOf;
  if (projectLate || input.overdueTasks >= 2 || input.overdueMilestones >= 2) return "Critical";
  if (input.overdueTasks > 0 || input.overdueMilestones > 0 || input.status === "At Risk" || input.status === "On Hold") {
    return "Watch";
  }
  return "Healthy";
}

export function budgetHealth(input: { budgetAmount: number; actualCost: number; progress: number }): InsightHealth {
  if (input.actualCost > input.budgetAmount) return "Critical";
  const costPct = input.budgetAmount ? (input.actualCost / input.budgetAmount) * 100 : 0;
  if (costPct - input.progress > 15) return "Watch";
  return "Healthy";
}

export function resourceHealth(utilizations: number[]): InsightHealth {
  if (!utilizations.length) return "Watch";
  if (utilizations.some((pct) => pct > 100)) return "Critical";
  if (utilizations.some((pct) => pct >= 80)) return "Watch";
  return "Healthy";
}

export function riskHealth(risks: RiskItem[]): InsightHealth {
  const open = risks.filter((risk) => risk.status !== "Closed");
  if (open.some((risk) => riskScore(risk.probability, risk.impact) >= 9 || risk.impact === "Critical")) {
    return "Critical";
  }
  if (open.length) return "Watch";
  return "Healthy";
}

export function computeProjectInsights(input: {
  project: Project;
  tasks: Task[];
  milestones: Milestone[];
  timeEntries: TimeEntry[];
  expenses: Expense[];
  allocations: ResourceAllocation[];
  team: TeamMember[];
  risks: RiskItem[];
  memberNames: string[];
  asOf?: string;
}) {
  const asOf = todayIso(input.asOf);
  const { project } = input;
  const metrics = computeProjectMetrics({
    project,
    team: input.team,
    timeEntries: input.timeEntries,
    expenses: input.expenses,
    memberNames: input.memberNames,
  });

  const openTasks = input.tasks.filter((task) => task.status !== "Done");
  const overdueTasks = openTasks.filter((task) => task.due < asOf);
  const phases = input.milestones.filter((row) => row.kind === "phase" || !row.parentId);
  const groups = input.milestones.filter((row) => row.kind === "group");
  const milestoneRows: MilestoneInsight[] = phases.map((phase) => {
    const childIds = new Set([
      phase.id,
      ...groups.filter((group) => group.parentId === phase.id).map((group) => group.id),
    ]);
    const phaseTasks = input.tasks.filter((task) => task.milestoneId && childIds.has(task.milestoneId));
    const progress = phaseProgress(
      phase.status,
      phaseTasks.map((task) => task.progress),
    );
    return {
      id: phase.id,
      name: phase.name,
      status: phase.status,
      due: phase.due,
      progress,
      taskCount: phaseTasks.length,
      overdue: phase.status !== "Approved" && phase.due < asOf,
    };
  });
  const overdueMilestones = milestoneRows.filter((row) => row.overdue);
  const milestonePct = milestoneRows.length
    ? Math.round(milestoneRows.reduce((sum, row) => sum + row.progress, 0) / milestoneRows.length)
    : 0;

  const capacity = allocationByMember(input.allocations);
  const roster = input.allocations.filter((row) => row.projectId === project.id);
  const utilizations = roster.map((row) => capacity.find((item) => item.id === row.memberId)?.pct ?? row.allocationPct);
  const avgUtilization = utilizations.length
    ? Math.round(utilizations.reduce((sum, n) => sum + n, 0) / utilizations.length)
    : 0;
  const overloaded = utilizations.filter((pct) => pct > 100).length;
  const nearCapacity = utilizations.filter((pct) => utilizationLevel(pct) === "watch").length;

  const projectRisks = input.risks.filter((risk) => risk.projectId === project.id);
  const openRisks = projectRisks.filter((risk) => risk.status !== "Closed");

  const schedule = scheduleHealth({
    status: project.status,
    due: project.due,
    overdueTasks: overdueTasks.length,
    overdueMilestones: overdueMilestones.length,
    asOf,
  });
  const budget = budgetHealth({
    budgetAmount: project.budgetAmount,
    actualCost: metrics.actualCost,
    progress: project.progress,
  });
  const resource = resourceHealth(utilizations);
  const risk = riskHealth(projectRisks);
  const overall = worstHealth([metrics.health, schedule, budget, resource, risk]);

  const upcoming: InsightDeadline[] = [
    ...openTasks.map((task) => ({
      id: task.id,
      kind: "task" as const,
      name: task.name,
      due: task.due,
      status: task.status,
    })),
    ...milestoneRows
      .filter((row) => row.status !== "Approved")
      .map((row) => ({
        id: row.id,
        kind: "milestone" as const,
        name: row.name,
        due: row.due,
        status: row.status,
      })),
    ...(project.status !== "Completed" && project.status !== "Cancelled"
      ? [{ id: project.id, kind: "project" as const, name: `${project.name} deadline`, due: project.due, status: project.status }]
      : []),
  ]
    .filter((row) => row.due >= asOf)
    .sort((a, b) => a.due.localeCompare(b.due) || a.name.localeCompare(b.name));

  const plannedHours = project.budgetHours;
  const actualHours = project.loggedHours;
  const estimateHours = input.tasks.reduce((sum, task) => sum + (task.estimateHours ?? 0), 0);
  const entryHours = input.timeEntries.reduce((sum, row) => sum + row.hours, 0);

  return {
    asOf,
    overall,
    schedule,
    budget,
    resource,
    risk,
    deliveryHealth: metrics.health,
    progress: project.progress,
    plannedHours,
    actualHours,
    hoursVariance: plannedHours - actualHours,
    hoursPct: metrics.hoursPct,
    estimateHours,
    entryHours,
    plannedCost: project.budgetAmount,
    actualCost: metrics.actualCost,
    earned: metrics.earned,
    costVariance: metrics.variance,
    costPct: project.budgetAmount ? Math.round((metrics.actualCost / project.budgetAmount) * 100) : 0,
    milestonePct,
    milestoneRows,
    overdueTasks: overdueTasks
      .slice()
      .sort((a, b) => a.due.localeCompare(b.due))
      .map((task) => ({
        id: task.id,
        name: task.name,
        due: task.due,
        status: task.status,
        assignee: task.assignee,
      })),
    overdueMilestones,
    upcoming: upcoming.slice(0, 8),
    openRisks,
    avgUtilization,
    overloaded,
    nearCapacity,
    rosterCount: roster.length,
  };
}
