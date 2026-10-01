"use client";

import { useEffect, useState, type ReactNode } from "react";
import { loadAzureRuntimeConfig } from "@/lib/azure-config";
import { startWorkspaceSync } from "@/lib/workspace-sync";
import { useAppStore } from "@/lib/store";

export function AzureRuntime({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadAzureRuntimeConfig().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--color-bg)] text-[var(--color-muted)]">
        Connecting to Azure...
      </div>
    );
  }

  return (
    <>
      <AzureWorkspaceBridge />
      {children}
    </>
  );
}

function AzureWorkspaceBridge() {
  const pushToast = useAppStore((s) => s.pushToast);

  useEffect(() => {
    return startWorkspaceSync((message) => pushToast(message, "info"));
  }, [pushToast]);

  return null;
}
