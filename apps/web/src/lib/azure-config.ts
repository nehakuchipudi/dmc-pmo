export type AzureRuntimeConfig = {
  apiUrl: string;
  entraClientId: string;
  entraTenantId: string;
  entraAuthority: string;
  database: boolean;
};

const emptyConfig = (): AzureRuntimeConfig => ({
  apiUrl: "",
  entraClientId: "",
  entraTenantId: "",
  entraAuthority: "",
  database: false,
});

let runtime = emptyConfig();
let loaded = false;
let loadPromise: Promise<AzureRuntimeConfig> | null = null;

export function azureRuntimeConfig() {
  return runtime;
}

export function azureApiUrl() {
  return runtime.apiUrl.replace(/\/$/, "");
}

export function azureDatabaseEnabled() {
  return runtime.database;
}

export function setAzureRuntimeConfig(next: Partial<AzureRuntimeConfig>) {
  runtime = {
    ...runtime,
    ...next,
    apiUrl: (next.apiUrl ?? runtime.apiUrl).trim(),
    entraClientId: (next.entraClientId ?? runtime.entraClientId).trim(),
    entraTenantId: (next.entraTenantId ?? runtime.entraTenantId).trim(),
    entraAuthority: (next.entraAuthority ?? runtime.entraAuthority).trim(),
  };
}

export async function loadAzureRuntimeConfig() {
  if (loaded) return runtime;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const res = await fetch("/config.json", { cache: "no-store" });
      if (res.ok) {
        const body = (await res.json()) as Partial<AzureRuntimeConfig>;
        setAzureRuntimeConfig(body);
      }
    } catch {
      // Local Next.js has no /config.json. Build-time NEXT_PUBLIC_* values still apply.
    }
    loaded = true;
    return runtime;
  })();
  return loadPromise;
}
