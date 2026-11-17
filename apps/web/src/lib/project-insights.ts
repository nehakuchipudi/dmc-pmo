import { roundMoney } from "./invoice";
import { allocationByMember, riskScore } from "./ppm";
import { allocationSummary, roundHours } from "./plan-allocation";
import { scheduleWindow } from "./project-plan";
import { computeProjectMetrics, memberRate } from "./project-workspace";
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

function monthKey(iso: string) {
  return (iso || "").slice(0, 7);
}

function nextMonth(key: string) {
  const [year, month] = key.split("-").map(Number);
  const next = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(next).padStart(2, "0")}`;
}

export type InsightTrendPoint = {
  key: string;
  label: string;
  hours: number;
  spend: number;
  hoursPct: number;
  spendPct: number;
};

export function budgetTimeTrend(input: {
  start: string;
  due: string;
  asOf: string;
  approvedHours: number;
  approvedBudget: number;
  timeEntries: TimeEntry[];
  expenses: Expense[];
  rateFor: (name: string) => number;
  extraHours?: number;
  extraSpend?: number;
}): InsightTrendPoint[] {
  const dates = [
    input.start,
    input.due,
    input.asOf,
    ...input.timeEntries.map((row) => row.date),
    ...input.expenses.map((row) => row.date),
  ].filter(Boolean);
  const startKey = monthKey(dates.slice().sort()[0] || input.asOf);
  const endKey = monthKey(dates.slice().sort().at(-1) || input.asOf);
  const keys: string[] = [];
  for (let key = startKey; key && key <= endKey && keys.length < 36; key = nextMonth(key)) {
    keys.push(key);
  }
  const windowKeys = (keys.length ? keys : [monthKey(input.asOf)]).slice(-12);

  const hoursBy: Record<string, number> = {};
  const spendBy: Record<string, number> = {};
  input.timeEntries.forEach((row) => {
    if (row.status === "Rejected") return;
    const key = monthKey(row.date);
    hoursBy[key] = (hoursBy[key] ?? 0) + (Number(row.hours) || 0);
    spendBy[key] = (spendBy[key] ?? 0) + (Number(row.hours) || 0) * input.rateFor(row.userName);
  });
  input.expenses.forEach((row) => {
    if (row.status === "Rejected") return;
    const key = monthKey(row.date);
    spendBy[key] = (spendBy[key] ?? 0) + (Number(row.amount) || 0);
  });
  const extraKey = windowKeys.includes(monthKey(input.asOf))
    ? monthKey(input.asOf)
    : (windowKeys.at(-1) || monthKey(input.asOf));
  const countedHours = Object.values(hoursBy).reduce((sum, value) => sum + value, 0);
  const countedSpend = Object.values(spendBy).reduce((sum, value) => sum + value, 0);
  if (input.extraHours && countedHours > 0) {
    const factor = (countedHours + input.extraHours) / countedHours;
    Object.keys(hoursBy).forEach((key) => {
      hoursBy[key] *= factor;
    });
  } else if (input.extraHours) {
    hoursBy[extraKey] = (hoursBy[extraKey] ?? 0) + input.extraHours;
  }
  if (input.extraSpend && countedSpend > 0) {
    const factor = (countedSpend + input.extraSpend) / countedSpend;
    Object.keys(spendBy).forEach((key) => {
      spendBy[key] *= factor;
    });
  } else if (input.extraSpend) {
    spendBy[extraKey] = (spendBy[extraKey] ?? 0) + input.extraSpend;
  }

  let hours = 0;
  let spend = 0;
  keys.forEach((key) => {
    if (windowKeys.includes(key)) return;
    hours += hoursBy[key] ?? 0;
    spend += spendBy[key] ?? 0;
  });
  return windowKeys.map((key) => {
    hours += hoursBy[key] ?? 0;
    spend += spendBy[key] ?? 0;
    const [year, month] = key.split("-");
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", { month: "short" });
    return {
      key,
      label,
      hours: roundHours(hours),
      spend: roundMoney(spend),
      hoursPct: input.approvedHours > 0 ? Math.round((hours / input.approvedHours) * 100) : 0,
      spendPct: input.approvedBudget > 0 ? Math.round((spend / input.approvedBudget) * 100) : 0,
    };
  });
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
  const allocation = allocationSummary(project, input.tasks, (task) => memberRate(task.assignee, project, input.team));
  const window = scheduleWindow(project.start, project.due, asOf);
  const teamLoad = roster
    .map((row) => ({
      name: row.memberName,
      pct: capacity.find((item) => item.id === row.memberId)?.pct ?? row.allocationPct,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
  const countedHours = input.timeEntries
    .filter((row) => row.status !== "Rejected")
    .reduce((sum, row) => sum + (Number(row.hours) || 0), 0);
  const countedSpend = input.timeEntries
    .filter((row) => row.status !== "Rejected")
    .reduce((sum, row) => sum + (Number(row.hours) || 0) * memberRate(row.userName, project, input.team), 0)
    + input.expenses
      .filter((row) => row.status !== "Rejected")
      .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const trend = budgetTimeTrend({
    start: project.start,
    due: project.due,
    asOf,
    approvedHours: plannedHours,
    approvedBudget: project.budgetAmount,
    timeEntries: input.timeEntries,
    expenses: input.expenses,
    rateFor: (name) => memberRate(name, project, input.team),
    extraHours: Math.max(0, actualHours - countedHours),
    extraSpend: Math.max(0, metrics.actualCost - countedSpend),
  });

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
    allocatedBudget: allocation.usedBudget,
    allocatedHours: allocation.usedHours,
    remainingBudget: allocation.remainingBudget,
    remainingHours: allocation.remainingHours,
    allocatedBudgetPct: allocation.budgetPct,
    allocatedHoursPct: allocation.hoursPct,
    trend,
    teamLoad,
    daysRemaining: window.remaining,
    daysOver: window.over,
    daysElapsed: window.elapsed,
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
