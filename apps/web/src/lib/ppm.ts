import { isOpenProjectStatus } from "./project-lifecycle";
import type {
  CrossDependency,
  IdeaStage,
  Portfolio,
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
  const critical = projects.filter((p) => p.status === "At Risk").length;
  const watch = projects.filter((p) => p.status === "On Hold").length;
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
    atRisk: items.filter((p) => p.status === "At Risk" || p.status === "On Hold").length,
  };
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

export function objectiveCoverage(objectives: StrategicObjective[], projects: Project[], portfolios: Portfolio[]) {
  return objectives.map((objective) => {
    const linkedPortfolios = portfolios.filter((p) => p.objectiveIds.includes(objective.id));
    const projectIds = new Set(linkedPortfolios.flatMap((p) => p.projectIds));
    const linked = projects.filter((p) => projectIds.has(p.id));
    return { objective, linked, portfolios: linkedPortfolios };
  });
}

export function ideaComposite(idea: { strategicFit: number; valueScore: number; riskScore: number }) {
  return Math.round(((idea.strategicFit + idea.valueScore + (10 - idea.riskScore)) / 30) * 100);
}

export const IDEA_STAGES = ["Submitted", "In Progress", "Approved", "On Hold", "Rejected", "Converted"] as const;
export const IDEA_STATUS_OPTIONS = ["Submitted", "In Progress", "Approved", "On Hold", "Rejected"] as const;
export const PROJECT_CREATE_TYPES = ["Internal", "Client Work"] as const;
export type ProjectCreateType = (typeof PROJECT_CREATE_TYPES)[number];
export const PROJECT_LIST_FILTERS = [
  "All Open Projects",
  "Recently Created",
  "Managed By Me",
  "Projects Overdue",
] as const;
export type ProjectListFilter = (typeof PROJECT_LIST_FILTERS)[number];

export function normalizeIdeaStage(stage: string | undefined): IdeaStage {
  if (stage === "Scoring") return "In Progress";
  if (stage === "Deferred") return "On Hold";
  if ((IDEA_STAGES as readonly string[]).includes(stage ?? "")) return stage as IdeaStage;
  return "Submitted";
}

export function ideaIsOpen(stage: string | undefined) {
  const next = normalizeIdeaStage(stage);
  return next !== "Converted" && next !== "Rejected";
}

export function ideaCanConvert(idea: { stage?: string; convertedProjectId?: string }) {
  return ideaIsOpen(idea.stage) && !idea.convertedProjectId;
}

export function resolveIdeaObjective(text: string, objectives: { id: string; code: string; name: string }[]) {
  const name = text.trim();
  if (!name) return { objectiveId: undefined, objectiveName: undefined };
  const key = name.toLowerCase();
  const match = objectives.find(
    (row) =>
      row.name.toLowerCase() === key ||
      row.code.toLowerCase() === key ||
      `${row.code} ${row.name}`.toLowerCase() === key,
  );
  if (match) return { objectiveId: match.id, objectiveName: undefined as string | undefined };
  return { objectiveId: undefined, objectiveName: name };
}

export function ideaObjectiveLabel(
  idea: { objectiveId?: string; objectiveName?: string },
  objectives: { id: string; code: string; name: string }[],
) {
  const linked = idea.objectiveId ? objectives.find((row) => row.id === idea.objectiveId) : undefined;
  if (linked) return `${linked.code} ${linked.name}`.trim();
  return idea.objectiveName?.trim() || "";
}

export function nextProjectNumber(projects: { number?: number }[]) {
  return Math.max(0, ...projects.map((row) => row.number ?? 0)) + 1;
}

export function projectDisplayId(project: { id: string; number?: number }) {
  return project.number != null ? String(project.number) : project.id.replace(/^p-/, "");
}

export function projectEarnedValue(project: { progress: number; budgetAmount: number }) {
  return Math.round((project.progress / 100) * project.budgetAmount);
}

export function projectIsOverdue(project: { due: string; status: Project["status"] }, today: string) {
  return isOpenProjectStatus(project.status) && Boolean(project.due) && project.due < today;
}

export function projectManagedBy(project: { manager: string }, userName?: string) {
  const name = userName?.trim() ?? "";
  if (!name) return false;
  const last = name.split(" ").slice(-1)[0] ?? "";
  return project.manager === name || (Boolean(last) && project.manager.includes(last));
}

export function lastProjectContactIso(
  projectId: string,
  input: {
    activities?: { projectId?: string; at?: string }[];
    tickets?: { id: string; projectId?: string; submitted: string }[];
    ticketMessages?: { ticketId: string; createdAt: string }[];
    timeEntries?: { projectId: string; date: string }[];
  },
) {
  const dates: string[] = [];
  for (const row of input.activities ?? []) {
    if (row.projectId === projectId && row.at) dates.push(row.at.slice(0, 10));
  }
  const ticketIds = new Set<string>();
  for (const row of input.tickets ?? []) {
    if (row.projectId === projectId) {
      ticketIds.add(row.id);
      if (row.submitted) dates.push(row.submitted.slice(0, 10));
    }
  }
  for (const row of input.ticketMessages ?? []) {
    if (ticketIds.has(row.ticketId) && row.createdAt) dates.push(row.createdAt.slice(0, 10));
  }
  for (const row of input.timeEntries ?? []) {
    if (row.projectId === projectId && row.date) dates.push(row.date.slice(0, 10));
  }
  dates.sort();
  return dates.at(-1);
}

export function filterProjectList(
  projects: Project[],
  filter: string,
  ctx: { userName?: string; today: string },
) {
  if (filter === "Managed By Me") return projects.filter((row) => projectManagedBy(row, ctx.userName));
  if (filter === "Recently Created") return [...projects].sort((a, b) => b.start.localeCompare(a.start));
  if (filter === "Projects Overdue") return projects.filter((row) => projectIsOverdue(row, ctx.today));
  return projects.filter((row) => isOpenProjectStatus(row.status));
}
