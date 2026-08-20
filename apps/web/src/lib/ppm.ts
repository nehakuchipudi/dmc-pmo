import type {
  CrossDependency,
  Portfolio,
  Program,
  Project,
  ResourceAllocation,
  RiskItem,
  StrategicObjective,
} from "./types";

export function riskScore(probability: string, impact: string) {
  const rank: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };
  return (rank[probability] ?? 1) * (rank[impact] ?? 1);
}

export function portfolioHealth(projects: Project[]): "Healthy" | "Watch" | "Critical" {
  if (!projects.length) return "Watch";
  const critical = projects.filter((p) => p.status === "Overdue").length;
  const watch = projects.filter((p) => p.status === "At Risk").length;
  if (critical > 0 || watch >= 2) return "Critical";
  if (watch > 0) return "Watch";
  return "Healthy";
}

export function projectsFor(ids: string[], projects: Project[]) {
  return projects.filter((p) => ids.includes(p.id));
}

export function portfolioMetrics(portfolio: Portfolio, projects: Project[]) {
  const items = projectsFor(portfolio.projectIds, projects);
  const invested = items.reduce((sum, p) => sum + p.budgetAmount, 0);
  const progress = items.length
    ? Math.round(items.reduce((sum, p) => sum + p.progress, 0) / items.length)
    : 0;
  const hoursUsed = items.reduce((sum, p) => sum + p.loggedHours, 0);
  const hoursBudget = items.reduce((sum, p) => sum + p.budgetHours, 0);
  const margin = items.length
    ? Math.round(items.reduce((sum, p) => sum + p.marginPct, 0) / items.length)
    : 0;
  return {
    items,
    invested,
    progress,
    hoursUsed,
    hoursBudget,
    margin,
    health: portfolioHealth(items),
    atRisk: items.filter((p) => p.status !== "On Track" && p.status !== "Completed" && p.status !== "Planned").length,
  };
}

export function programMetrics(program: Program, projects: Project[]) {
  return portfolioMetrics(
    {
      id: program.id,
      name: program.name,
      owner: program.owner,
      theme: "",
      budget: 0,
      projectIds: program.projectIds,
      objectiveIds: program.objectiveId ? [program.objectiveId] : [],
      description: program.description,
    },
    projects,
  );
}

export function allocationByMember(allocations: ResourceAllocation[]) {
  const map = new Map<string, { name: string; pct: number; hours: number; count: number }>();
  for (const row of allocations) {
    const cur = map.get(row.memberId) ?? { name: row.memberName, pct: 0, hours: 0, count: 0 };
    cur.pct += row.allocationPct;
    cur.hours += row.hoursPerWeek;
    cur.count += 1;
    map.set(row.memberId, cur);
  }
  return [...map.entries()].map(([id, v]) => ({ id, ...v }));
}

export function openHighRisks(risks: RiskItem[]) {
  return risks.filter((r) => r.status !== "Closed" && (r.impact === "High" || r.impact === "Critical"));
}

export function blockedDependencies(deps: CrossDependency[]) {
  return deps.filter((d) => d.status !== "On Track");
}

export function objectiveCoverage(objectives: StrategicObjective[], projects: Project[], programs: Program[]) {
  return objectives.map((objective) => {
    const linkedPrograms = programs.filter((p) => p.objectiveId === objective.id);
    const projectIds = new Set(linkedPrograms.flatMap((p) => p.projectIds));
    const linked = projects.filter((p) => projectIds.has(p.id));
    return { objective, linked, programs: linkedPrograms };
  });
}

export function ideaComposite(idea: { strategicFit: number; valueScore: number; riskScore: number }) {
  return Math.round(((idea.strategicFit + idea.valueScore + (10 - idea.riskScore)) / 30) * 100);
}
