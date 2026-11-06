export const WORKSPACE_KEYS = [
  "seedGeneration",
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
  "purchases",
  "billMaterials",
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
  "enabledPacks",
  "rolePacks",
  "workOrders",
  "recurringServices",
  "serviceDocuments",
  "fieldClocks",
  "workspaceInstances",
  "promotionalTrial",
] as const;

export const EMPTY_WORKSPACE_GENERATION = "empty-v1";

const WIPED_KEYS = [
  "companies",
  "companyAssets",
  "contacts",
  "projects",
  "milestones",
  "tickets",
  "ticketMessages",
  "tasks",
  "invoices",
  "timeEntries",
  "notifications",
  "activities",
  "retainers",
  "retainerPeriods",
  "automations",
  "emailOutbox",
  "expenses",
  "purchases",
  "billMaterials",
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
  "recentlyViewed",
  "workOrders",
  "recurringServices",
  "serviceDocuments",
  "fieldClocks",
] as const;

export type WorkspaceSnapshot = {
  version: 1;
  data: Record<string, unknown>;
};

export function emptyWorkspaceData(): Record<string, unknown> {
  const data: Record<string, unknown> = {
    seedGeneration: EMPTY_WORKSPACE_GENERATION,
    focusCompanyId: null,
  };
  for (const key of WIPED_KEYS) data[key] = [];
  return data;
}

export function extractWorkspace(state: Record<string, unknown>): WorkspaceSnapshot {
  const data: Record<string, unknown> = {};
  for (const key of WORKSPACE_KEYS) {
    if (state[key] !== undefined) data[key] = state[key];
  }
  data.seedGeneration = EMPTY_WORKSPACE_GENERATION;
  return { version: 1, data };
}

export function workspacePatch(snapshot: WorkspaceSnapshot | null | undefined) {
  if (!snapshot?.data || typeof snapshot.data !== "object") return {};
  const stale = snapshot.data.seedGeneration !== EMPTY_WORKSPACE_GENERATION;
  const source = stale
    ? {
        ...emptyWorkspaceData(),
        team: snapshot.data.team,
        emailDomains: snapshot.data.emailDomains,
        invoiceTemplates: snapshot.data.invoiceTemplates,
        projectWorkflow: snapshot.data.projectWorkflow,
        enabledPacks: snapshot.data.enabledPacks,
        rolePacks: snapshot.data.rolePacks,
        workspaceInstances: snapshot.data.workspaceInstances,
        promotionalTrial: snapshot.data.promotionalTrial,
      }
    : snapshot.data;
  const patch: Record<string, unknown> = {};
  for (const key of WORKSPACE_KEYS) {
    if (source[key] !== undefined) patch[key] = source[key];
  }
  return patch;
}
