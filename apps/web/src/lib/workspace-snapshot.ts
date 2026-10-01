export const WORKSPACE_KEYS = [
  "companies",
  "companyAssets",
  "contacts",
  "projects",
  "milestones",
  "tickets",
  "ticketMessages",
  "tasks",
  "invoices",
  "invoiceTemplates",
  "timeEntries",
  "notifications",
  "activities",
  "retainers",
  "retainerPeriods",
  "automations",
  "emailOutbox",
  "emailDomains",
  "expenses",
  "opportunities",
  "objectives",
  "ideas",
  "portfolios",
  "risks",
  "issues",
  "dependencies",
  "benefits",
  "gates",
  "allocations",
  "team",
  "recentlyViewed",
  "focusCompanyId",
  "projectWorkflow",
] as const;

export type WorkspaceSnapshot = {
  version: 1;
  data: Record<string, unknown>;
};

export function extractWorkspace(state: Record<string, unknown>): WorkspaceSnapshot {
  const data: Record<string, unknown> = {};
  for (const key of WORKSPACE_KEYS) {
    if (state[key] !== undefined) data[key] = state[key];
  }
  return { version: 1, data };
}

export function workspacePatch(snapshot: WorkspaceSnapshot | null | undefined) {
  if (!snapshot?.data || typeof snapshot.data !== "object") return {};
  const patch: Record<string, unknown> = {};
  for (const key of WORKSPACE_KEYS) {
    if (snapshot.data[key] !== undefined) patch[key] = snapshot.data[key];
  }
  return patch;
}
