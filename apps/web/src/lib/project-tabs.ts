export const PROJECT_WORKSPACE_TABS = [
  "Overview",
  "Team",
  "Schedule",
  "Insights",
  "Tasks",
  "Activity",
  "Attachments",
  "Expenses",
  "Rates",
  "Billing",
  "Assets",
  "Details",
] as const;

export type ProjectWorkspaceTab = (typeof PROJECT_WORKSPACE_TABS)[number];

export function resolveProjectTab(value?: string | null): ProjectWorkspaceTab {
  const match = PROJECT_WORKSPACE_TABS.find((tab) => tab.toLowerCase() === (value ?? "").toLowerCase());
  return match ?? "Overview";
}

export function projectWorkspaceHref(id: string, tab?: string) {
  if (!tab) return `/app/projects/view/?id=${id}`;
  return `/app/projects/view/?id=${id}&tab=${encodeURIComponent(tab)}`;
}
