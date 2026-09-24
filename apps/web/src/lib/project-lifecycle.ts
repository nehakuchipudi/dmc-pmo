import type { ProjectStatus, ProjectWorkflow, Role } from "./types";

export const PROJECT_LIFECYCLE_STATUSES: ProjectStatus[] = [
  "Draft",
  "Planning",
  "Active",
  "On Hold",
  "At Risk",
  "Completed",
  "Cancelled",
];

export const DEFAULT_LIFECYCLE_ROLES: Role[] = ["admin", "pm", "leadership"];

export const DEFAULT_PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  Draft: ["Planning", "Cancelled"],
  Planning: ["Draft", "Active", "On Hold", "Cancelled"],
  Active: ["On Hold", "At Risk", "Completed", "Cancelled"],
  "On Hold": ["Planning", "Active", "At Risk", "Cancelled"],
  "At Risk": ["Active", "On Hold", "Completed", "Cancelled"],
  Completed: ["Active"],
  Cancelled: ["Draft", "Planning"],
};

export const DEFAULT_PROJECT_WORKFLOW: ProjectWorkflow = {
  transitions: DEFAULT_PROJECT_TRANSITIONS,
  changerRoles: DEFAULT_LIFECYCLE_ROLES,
};

export function normalizeProjectStatus(status: string): ProjectStatus {
  if (status === "On Track") return "Active";
  if (status === "Planned") return "Planning";
  if (status === "Overdue") return "At Risk";
  if (PROJECT_LIFECYCLE_STATUSES.includes(status as ProjectStatus)) return status as ProjectStatus;
  return "Planning";
}

export function canChangeProjectStatus(role: Role | undefined, workflow: ProjectWorkflow) {
  if (role === "admin") return true;
  return !!role && workflow.changerRoles.includes(role);
}

export function allowedProjectTransitions(from: ProjectStatus, workflow: ProjectWorkflow): ProjectStatus[] {
  return workflow.transitions[from] ?? [];
}

export function isValidProjectTransition(from: ProjectStatus, to: ProjectStatus, workflow: ProjectWorkflow) {
  if (from === to) return true;
  return allowedProjectTransitions(from, workflow).includes(to);
}

export function isOpenProjectStatus(status: ProjectStatus) {
  return status !== "Completed" && status !== "Cancelled";
}

export function isWatchLifecycle(status: ProjectStatus) {
  return status === "At Risk" || status === "On Hold";
}

export function toggleWorkflowTransition(
  workflow: ProjectWorkflow,
  from: ProjectStatus,
  to: ProjectStatus,
  allowed: boolean,
): ProjectWorkflow {
  const current = new Set(workflow.transitions[from] ?? []);
  if (allowed) current.add(to);
  else current.delete(to);
  return {
    ...workflow,
    transitions: {
      ...workflow.transitions,
      [from]: PROJECT_LIFECYCLE_STATUSES.filter((status) => current.has(status)),
    },
  };
}
