import { azureApiUrl, azureDatabaseEnabled, azureRuntimeConfig } from "./azure-config";
import { acquireWorkspaceToken } from "./entra";
import { useAppStore } from "./store";
import {
  extractWorkspace,
  mergeWorkspace,
  readLocalWorkspace,
  workspacePatch,
  workspaceRecordCount,
  writeLocalWorkspace,
  type WorkspaceSnapshot,
} from "./workspace-snapshot";

export {
  extractWorkspace,
  mergeWorkspace,
  workspacePatch,
  WORKSPACE_KEYS,
  type WorkspaceSnapshot,
} from "./workspace-snapshot";

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

type PullResult =
  | { status: "disabled" | "unauthenticated" | "empty"; snapshot: null }
  | { status: "loaded"; snapshot: WorkspaceSnapshot };

export async function pullAzureWorkspace() {
  const result = await pullAzureWorkspaceStatus();
  if (result.status === "loaded") return result.snapshot;
  return null;
}

export async function pullAzureWorkspaceStatus(): Promise<PullResult> {
  if (!azureDatabaseEnabled() && !azureApiUrl()) return { status: "disabled", snapshot: null };
  const headers = await authHeaders();
  if (!headers) return { status: "unauthenticated", snapshot: null };
  const res = await fetch(workspaceEndpoint(), {
    headers,
    cache: "no-store",
  });
  if (res.status === 401) return { status: "unauthenticated", snapshot: null };
  if (!res.ok) throw new Error(await res.text());
  const body = (await res.json()) as { snapshot?: WorkspaceSnapshot | null };
  if (!body.snapshot?.data) return { status: "empty", snapshot: null };
  return { status: "loaded", snapshot: body.snapshot };
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

let applyingRemote = false;

export function applyWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  const patch = workspacePatch(snapshot);
  if (!Object.keys(patch).length) return;
  applyingRemote = true;
  useAppStore.setState(patch);
  applyingRemote = false;
  if (patch.focusCompanyId === null && typeof window !== "undefined") {
    window.localStorage.removeItem("dmc-pmo-focus-company");
  }
}

function currentSnapshot() {
  return extractWorkspace(useAppStore.getState() as unknown as Record<string, unknown>);
}

function restoreLocalCache() {
  const cached = readLocalWorkspace();
  if (!cached?.data) return;
  if (workspaceRecordCount(cached.data) === 0) return;
  applyWorkspaceSnapshot(cached);
}

function persistSnapshot(snapshot: WorkspaceSnapshot, onStatus?: (message: string) => void) {
  writeLocalWorkspace(snapshot);
  void pushAzureWorkspace(snapshot).catch((error) => {
    console.warn("Azure workspace save failed", error);
    onStatus?.("Azure Database save failed. Your latest change is still on this device.");
  });
}

export function refreshWorkspaceFromAzure(onStatus?: (message: string) => void) {
  void (async () => {
    try {
      const result = await pullAzureWorkspaceStatus();
      if (result.status !== "loaded" || !result.snapshot) return;
      const merged = mergeWorkspace(currentSnapshot(), result.snapshot);
      applyWorkspaceSnapshot(merged);
      writeLocalWorkspace(merged);
    } catch (error) {
      console.warn("Azure workspace load failed", error);
      onStatus?.("Could not reach Azure Database. Working from this browser until it reconnects.");
    }
  })();
}

export function startWorkspaceSync(onStatus?: (message: string) => void) {
  if (typeof window === "undefined") return () => {};

  let timer: number | undefined;
  let stopped = false;
  let ready = false;

  restoreLocalCache();

  const persist = (immediate = false) => {
    if (!ready || applyingRemote || stopped) return;
    const snapshot = currentSnapshot();
    const cached = readLocalWorkspace();
    if (workspaceRecordCount(snapshot.data) === 0 && cached && workspaceRecordCount(cached.data) > 0) {
      applyWorkspaceSnapshot(cached);
      return;
    }
    const run = () => persistSnapshot(currentSnapshot(), onStatus);
    if (immediate) {
      window.clearTimeout(timer);
      run();
      return;
    }
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 400);
  };

  void (async () => {
    try {
      const result = await pullAzureWorkspaceStatus();
      if (stopped) return;
      if (result.status === "loaded" && result.snapshot) {
        const merged = mergeWorkspace(currentSnapshot(), result.snapshot);
        applyWorkspaceSnapshot(merged);
        writeLocalWorkspace(merged);
        onStatus?.("Workspace loaded from Azure Database.");
      } else if (result.status === "empty") {
        writeLocalWorkspace(currentSnapshot());
      } else {
        writeLocalWorkspace(currentSnapshot());
      }
    } catch (error) {
      console.warn("Azure workspace load failed", error);
      onStatus?.("Could not reach Azure Database. Working from this browser until it reconnects.");
    } finally {
      if (!stopped) {
        ready = true;
        persist(true);
      }
    }
  })();

  const unsubscribe = useAppStore.subscribe(() => persist());
  const flush = () => persist(true);
  const onHidden = () => {
    if (document.visibilityState === "hidden") flush();
  };
  window.addEventListener("beforeunload", flush);
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", onHidden);
  return () => {
    stopped = true;
    window.clearTimeout(timer);
    unsubscribe();
    window.removeEventListener("beforeunload", flush);
    window.removeEventListener("pagehide", flush);
    document.removeEventListener("visibilitychange", onHidden);
  };
}
