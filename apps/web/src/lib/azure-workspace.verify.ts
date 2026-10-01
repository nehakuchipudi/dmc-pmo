import { extractWorkspace, workspacePatch, type WorkspaceSnapshot } from "./workspace-snapshot";

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
  return true;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("azure-workspace.verify.ts")) {
  verifyAzureWorkspaceRoundTrip();
  console.log("Azure workspace snapshot round-trip passed.");
}
