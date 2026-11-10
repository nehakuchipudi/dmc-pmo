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
