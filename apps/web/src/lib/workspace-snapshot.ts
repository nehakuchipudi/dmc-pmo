import { blankInvoiceTemplate } from "./invoice";
import { seedInvoiceTemplates } from "./seed";
import type { InvoiceTemplate } from "./types";

export const WORKSPACE_KEYS = [
  "seedGeneration",
  "templatesBlankGeneration",
  "demoWorkspaceGeneration",
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
export const TEMPLATES_BLANK_GENERATION = "blank-v1";
export const DEMO_WORKSPACE_GENERATION = "play-v1";
export const LOCAL_WORKSPACE_KEY = "dmc-pmo-workspace";

const RECORD_KEYS = [
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
  "team",
  "invoiceTemplates",
  "emailDomains",
  "workspaceInstances",
] as const;

export type WorkspaceSnapshot = {
  version: 1;
  data: Record<string, unknown>;
};

export function emptyWorkspaceData(): Record<string, unknown> {
  const data: Record<string, unknown> = {
    seedGeneration: EMPTY_WORKSPACE_GENERATION,
    templatesBlankGeneration: TEMPLATES_BLANK_GENERATION,
    focusCompanyId: null,
  };
  for (const key of RECORD_KEYS) data[key] = [];
  return data;
}

function sanitizeInvoiceTemplates(rows: unknown[], resetSeed: boolean): InvoiceTemplate[] {
  const seedIds = new Set(seedInvoiceTemplates.map((row) => row.id));
  const extras: InvoiceTemplate[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object" || !("id" in row)) continue;
    const template = blankInvoiceTemplate(row as InvoiceTemplate);
    if (resetSeed && seedIds.has(template.id)) continue;
    extras.push({ ...template, summary: "" });
  }
  if (resetSeed) return [...seedInvoiceTemplates.map((row) => ({ ...row })), ...extras];
  return extras;
}

export function extractWorkspace(state: Record<string, unknown>): WorkspaceSnapshot {
  const data: Record<string, unknown> = {};
  for (const key of WORKSPACE_KEYS) {
    if (state[key] !== undefined) data[key] = state[key];
  }
  data.seedGeneration = EMPTY_WORKSPACE_GENERATION;
  data.templatesBlankGeneration = TEMPLATES_BLANK_GENERATION;
  return { version: 1, data };
}

export function workspacePatch(snapshot: WorkspaceSnapshot | null | undefined) {
  if (!snapshot?.data || typeof snapshot.data !== "object") return {};
  const source: Record<string, unknown> = {
    ...snapshot.data,
    seedGeneration: EMPTY_WORKSPACE_GENERATION,
  };
  const resetSeedTemplates = source.templatesBlankGeneration !== TEMPLATES_BLANK_GENERATION;
  const patch: Record<string, unknown> = {};
  for (const key of WORKSPACE_KEYS) {
    if (source[key] !== undefined) patch[key] = source[key];
  }
  if (Array.isArray(patch.invoiceTemplates) || resetSeedTemplates) {
    const rows = Array.isArray(patch.invoiceTemplates) ? patch.invoiceTemplates : [];
    patch.invoiceTemplates = sanitizeInvoiceTemplates(rows, resetSeedTemplates);
  }
  patch.templatesBlankGeneration = TEMPLATES_BLANK_GENERATION;
  return patch;
}

function isRecordArray(value: unknown): value is { id: string }[] {
  return Array.isArray(value) && value.every((row) => row && typeof row === "object" && "id" in row);
}

export function mergeById<T extends { id: string }>(remote: T[], local: T[]) {
  const map = new Map<string, T>();
  for (const row of remote) {
    if (row?.id) map.set(row.id, row);
  }
  for (const row of local) {
    if (row?.id) map.set(row.id, row);
  }
  return [...map.values()];
}

export function workspaceRecordCount(data: Record<string, unknown>) {
  let count = 0;
  for (const key of RECORD_KEYS) {
    const value = data[key];
    if (Array.isArray(value)) count += value.length;
  }
  return count;
}

export function mergeWorkspace(local: WorkspaceSnapshot, remote: WorkspaceSnapshot): WorkspaceSnapshot {
  const data: Record<string, unknown> = { ...remote.data, ...local.data };
  for (const key of WORKSPACE_KEYS) {
    const left = local.data[key];
    const right = remote.data[key];
    if (isRecordArray(left) || isRecordArray(right)) {
      data[key] = mergeById(isRecordArray(right) ? right : [], isRecordArray(left) ? left : []);
      continue;
    }
    if (Array.isArray(left) && Array.isArray(right)) {
      data[key] = left.length >= right.length ? left : right;
      continue;
    }
    if (left !== undefined) data[key] = left;
    else if (right !== undefined) data[key] = right;
  }
  data.seedGeneration = EMPTY_WORKSPACE_GENERATION;
  return { version: 1, data };
}

export function readLocalWorkspace(): WorkspaceSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_WORKSPACE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceSnapshot;
    if (parsed?.version === 1 && parsed.data && typeof parsed.data === "object") return parsed;
  } catch {
    return null;
  }
  return null;
}

export function writeLocalWorkspace(snapshot: WorkspaceSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_WORKSPACE_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota or private mode. Azure remains the remote copy.
  }
}
