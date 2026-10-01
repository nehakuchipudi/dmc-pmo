import { azureApiUrl, azureDatabaseEnabled, azureRuntimeConfig } from "./azure-config";
import { acquireWorkspaceToken } from "./entra";
import { useAppStore } from "./store";
import { extractWorkspace, workspacePatch, type WorkspaceSnapshot } from "./workspace-snapshot";

export { extractWorkspace, workspacePatch, WORKSPACE_KEYS, type WorkspaceSnapshot } from "./workspace-snapshot";

function workspaceEndpoint() {
  return `${azureApiUrl()}/api/workspace`;
}

async function authHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (azureRuntimeConfig().entraClientId) {
    const token = await acquireWorkspaceToken();
    if (!token) return null;
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function pullAzureWorkspace() {
  if (!azureDatabaseEnabled() && !azureApiUrl()) return null;
  const headers = await authHeaders();
  if (!headers) return null;
  const res = await fetch(workspaceEndpoint(), {
    headers,
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(await res.text());
  const body = (await res.json()) as { snapshot?: WorkspaceSnapshot | null };
  return body.snapshot ?? null;
}

export async function pushAzureWorkspace(snapshot: WorkspaceSnapshot) {
  if (!azureDatabaseEnabled() && !azureApiUrl()) return;
  const headers = await authHeaders();
  if (!headers) return;
  const res = await fetch(workspaceEndpoint(), {
    method: "PUT",
    headers,
    body: JSON.stringify({ snapshot }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export function applyWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  const patch = workspacePatch(snapshot);
  if (Object.keys(patch).length) useAppStore.setState(patch);
}

export function startWorkspaceSync(onStatus?: (message: string) => void) {
  if (typeof window === "undefined") return () => {};
  if (!azureDatabaseEnabled() && !azureApiUrl()) return () => {};

  let timer: number | undefined;
  let stopped = false;

  const persist = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const snapshot = extractWorkspace(useAppStore.getState() as unknown as Record<string, unknown>);
      void pushAzureWorkspace(snapshot).catch((error) => {
        console.warn("Azure workspace save failed", error);
        onStatus?.("Azure Database save failed. Your latest change is still on this device.");
      });
    }, 800);
  };

  void (async () => {
    try {
      const remote = await pullAzureWorkspace();
      if (stopped) return;
      if (remote?.data) {
        applyWorkspaceSnapshot(remote);
        onStatus?.("Workspace loaded from Azure Database.");
      } else {
        persist();
      }
    } catch (error) {
      console.warn("Azure workspace load failed", error);
      onStatus?.("Could not reach Azure Database. Working from this browser until it reconnects.");
    }
  })();

  const unsubscribe = useAppStore.subscribe(persist);
  return () => {
    stopped = true;
    window.clearTimeout(timer);
    unsubscribe();
  };
}
