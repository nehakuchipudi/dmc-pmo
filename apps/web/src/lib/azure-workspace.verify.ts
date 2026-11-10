import {
  extractWorkspace,
  mergeWorkspace,
  workspacePatch,
  workspaceRecordCount,
  type WorkspaceSnapshot,
} from "./workspace-snapshot";

export function verifyAzureWorkspaceRoundTrip() {
  const state = {
    companies: [{ id: "c-1", name: "Rowlett" }],
    team: [{ id: "u-1", name: "Dana" }],
    toasts: [{ id: "skip" }],
  };
  const snapshot = extractWorkspace(state);
  if (snapshot.version !== 1) throw new Error("snapshot version");
  if (!Array.isArray(snapshot.data.companies)) throw new Error("companies missing");
  if (snapshot.data.toasts) throw new Error("toasts should not persist");
  const patch = workspacePatch(snapshot);
  if (!Array.isArray(patch.companies)) throw new Error("hydrate companies");
  if (patch.toasts) throw new Error("hydrate leaked toasts");
  const empty = workspacePatch(null);
  if (Object.keys(empty).length) throw new Error("null snapshot should be empty");
  const invalid = workspacePatch({ version: 1 } as WorkspaceSnapshot);
  if (Object.keys(invalid).length) throw new Error("missing data should be empty");
  const local: WorkspaceSnapshot = {
    version: 1,
    data: { projects: [{ id: "p-local", name: "Kept" }], companies: [{ id: "c-1", name: "Local Co" }] },
  };
  const remote: WorkspaceSnapshot = {
    version: 1,
    data: { projects: [], companies: [{ id: "c-1", name: "Remote Co" }, { id: "c-2", name: "Other" }] },
  };
  const merged = mergeWorkspace(local, remote);
  const projects = merged.data.projects as { id: string }[];
  const companies = merged.data.companies as { id: string; name: string }[];
  if (!projects.some((row) => row.id === "p-local")) throw new Error("merge dropped local project");
  if (!companies.some((row) => row.id === "c-2")) throw new Error("merge dropped remote company");
  if (companies.find((row) => row.id === "c-1")?.name !== "Local Co") throw new Error("local company should win");
  if (workspaceRecordCount(local.data) < 1) throw new Error("record count");
  return true;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("azure-workspace.verify.ts")) {
  verifyAzureWorkspaceRoundTrip();
  console.log("Azure workspace snapshot round-trip passed.");
}
