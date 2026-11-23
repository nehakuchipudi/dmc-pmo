export const PROJECT_WORKSPACE_TABS = [
  "Overview",
  "Team",
  "Schedule",
  "Insights",
  "Activity",
  "Attachments",
  "Expenses",
  "Billing",
] as const;

export type ProjectWorkspaceTab = (typeof PROJECT_WORKSPACE_TABS)[number];

const TAB_ALIASES: Record<string, ProjectWorkspaceTab> = {
  tasks: "Schedule",
  plan: "Schedule",
  rates: "Team",
  assets: "Attachments",
  details: "Overview",
  stream: "Activity",
};

export function resolveProjectTab(value?: string | null): ProjectWorkspaceTab {
  const key = (value ?? "").toLowerCase();
  const aliased = TAB_ALIASES[key];
  if (aliased) return aliased;
  const match = PROJECT_WORKSPACE_TABS.find((tab) => tab.toLowerCase() === key);
  return match ?? "Overview";
}

export function projectWorkspaceHref(id: string, tab?: string) {
  if (!tab) return `/app/projects/view/?id=${id}`;
  return `/app/projects/view/?id=${id}&tab=${encodeURIComponent(tab)}`;
}

export function projectTabHref(id: string, tab?: string | null) {
  const resolved = resolveProjectTab(tab);
  return projectWorkspaceHref(id, resolved === "Overview" ? undefined : resolved);
}

export function invoiceViewHref(id: string, returnTo?: string) {
  const params = new URLSearchParams({ id });
  const safeReturn = safeAppHref(returnTo);
  if (safeReturn) params.set("returnTo", safeReturn);
  return `/app/billing/view/?${params.toString()}`;
}

export function safeAppHref(value?: string | null) {
  if (!value) return undefined;
  if (!value.startsWith("/app/")) return undefined;
  if (value.startsWith("//") || value.includes("://") || value.includes("\\")) return undefined;
  return value;
}
