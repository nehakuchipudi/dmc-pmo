import type { ResourceAllocation, Task, TeamMember, TimeEntry } from "./types";
import { allocationByMember } from "./ppm";

export const PROJECT_ROLES = [
  "Project Manager",
  "Tech Lead",
  "Developer",
  "Designer",
  "QA",
  "Analyst",
  "Specialist",
] as const;

export function weeklyHoursFromAllocation(allocationPct: number) {
  return Math.round((40 * Math.max(0, allocationPct)) / 100);
}

export function utilizationLevel(pct: number): "healthy" | "watch" | "over" {
  if (pct > 100) return "over";
  if (pct >= 80) return "watch";
  return "healthy";
}

export function utilizationLabel(level: ReturnType<typeof utilizationLevel>) {
  if (level === "over") return "Over allocated";
  if (level === "watch") return "Near capacity";
  return "Available";
}

export function availableProjectMembers(
  team: TeamMember[],
  allocations: ResourceAllocation[],
  projectId: string,
) {
  return team.filter(
    (member) =>
      member.active && !allocations.some((row) => row.projectId === projectId && row.memberId === member.id),
  );
}

export function projectTeamCards(input: {
  projectId: string;
  allocations: ResourceAllocation[];
  team: TeamMember[];
  tasks: Task[];
  timeEntries: TimeEntry[];
}) {
  const capacity = allocationByMember(input.allocations);
  const roster = input.allocations.filter((row) => row.projectId === input.projectId);
  return roster.map((row) => {
    const member = input.team.find((item) => item.id === row.memberId);
    const tasks = input.tasks.filter((task) => task.assignee === row.memberName);
    const openTasks = tasks.filter((task) => task.status !== "Done");
    const loggedHours = input.timeEntries
      .filter((entry) => entry.userName === row.memberName)
      .reduce((sum, entry) => sum + entry.hours, 0);
    const load = capacity.find((item) => item.id === row.memberId);
    const utilization = load?.pct ?? row.allocationPct;
    return {
      allocation: row,
      member,
      projectRole: row.projectRole || (member?.role === "pm" ? "Project Manager" : "Specialist"),
      responsibility: row.responsibility || "Not set",
      allocationPct: row.allocationPct,
      hoursPerWeek: row.hoursPerWeek,
      utilization,
      utilizationLevel: utilizationLevel(utilization),
      capacityHours: load?.hours ?? row.hoursPerWeek,
      projectCount: load?.count ?? 1,
      taskCount: tasks.length,
      openTasks: openTasks.length,
      loggedHours,
      otherProjects: Math.max(0, (load?.count ?? 1) - 1),
      assignedTasks: tasks.map((task) => ({ id: task.id, name: task.name, status: task.status })),
    };
  });
}

export function projectTeamContributors(input: {
  projectId: string;
  allocations: ResourceAllocation[];
  team: TeamMember[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  extraNames?: string[];
}) {
  const rosterIds = new Set(
    input.allocations.filter((row) => row.projectId === input.projectId).map((row) => row.memberId),
  );
  const names = new Set(input.extraNames ?? []);
  input.tasks.forEach((task) => names.add(task.assignee));
  input.timeEntries.forEach((entry) => names.add(entry.userName));
  return input.team.filter((member) => member.active && !rosterIds.has(member.id) && names.has(member.name));
}
