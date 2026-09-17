import type {
  Expense,
  Project,
  ProjectHealth,
  Role,
  TeamMember,
  TimeEntry,
} from "./types";

export function roleBillRate(role: Role): number {
  if (role === "admin" || role === "leadership") return 225;
  if (role === "pm") return 185;
  if (role === "finance") return 165;
  if (role === "staff") return 145;
  return 0;
}

export function memberRate(memberName: string, project: Project, team: TeamMember[]): number {
  const override = project.rates?.find((row) => row.memberName === memberName);
  if (override) return override.hourlyRate;
  const member = team.find((row) => row.name === memberName);
  if (member?.billRate) return member.billRate;
  if (member) return roleBillRate(member.role);
  return 180;
}

export function blendedRate(project: Project, team: TeamMember[], names: string[]): number {
  const rates = names.map((name) => memberRate(name, project, team)).filter((rate) => rate > 0);
  if (rates.length) return Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length);
  return project.budgetHours ? Math.round(project.budgetAmount / project.budgetHours) : 180;
}

export function projectHealth(input: {
  status: Project["status"];
  progress: number;
  budgetHours: number;
  loggedHours: number;
  budgetAmount: number;
  actualCost: number;
}): ProjectHealth {
  const hoursPct = input.budgetHours ? (input.loggedHours / input.budgetHours) * 100 : 0;
  const costPct = input.budgetAmount ? (input.actualCost / input.budgetAmount) * 100 : 0;
  if (input.status === "Overdue" || input.loggedHours > input.budgetHours || input.actualCost > input.budgetAmount) {
    return "Critical";
  }
  if (input.status === "At Risk") return "Watch";
  if (hoursPct - input.progress > 15 || costPct - input.progress > 15) return "Watch";
  return "Healthy";
}

export function computeProjectMetrics(input: {
  project: Project;
  team: TeamMember[];
  timeEntries: TimeEntry[];
  expenses: Expense[];
  memberNames: string[];
}) {
  const { project, team, timeEntries, expenses, memberNames } = input;
  const remainingHours = project.budgetHours - project.loggedHours;
  const earned = Math.round((project.progress / 100) * project.budgetAmount);
  const expenseTotal = expenses.reduce((sum, row) => sum + row.amount, 0);
  const materialsPurchase = project.materials.reduce((sum, row) => sum + row.purchasePrice * row.qty, 0);
  const materialsSale = project.materials.reduce((sum, row) => sum + row.salePrice * row.qty, 0);
  const blend = blendedRate(project, team, memberNames);
  const entryHours = timeEntries.reduce((sum, row) => sum + row.hours, 0);
  const entryCost = timeEntries.reduce((sum, row) => sum + row.hours * memberRate(row.userName, project, team), 0);
  const unlogged = Math.max(0, project.loggedHours - entryHours);
  const laborCost = Math.round(entryCost + unlogged * blend);
  const actualCost = laborCost + expenseTotal + materialsPurchase;
  const health = projectHealth({
    status: project.status,
    progress: project.progress,
    budgetHours: project.budgetHours,
    loggedHours: project.loggedHours,
    budgetAmount: project.budgetAmount,
    actualCost,
  });
  const hoursPct = project.budgetHours ? Math.round((project.loggedHours / project.budgetHours) * 100) : 0;
  const billedHours = timeEntries.filter((row) => row.billable).reduce((sum, row) => sum + row.hours, 0);
  return {
    remainingHours,
    earned,
    expenseTotal,
    materialsPurchase,
    materialsSale,
    laborCost,
    actualCost,
    health,
    hoursPct,
    blend,
    billedHours,
    variance: project.budgetAmount - actualCost,
  };
}
