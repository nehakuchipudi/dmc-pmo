import type { AccountInfo, AuthenticationResult, RedirectRequest } from "@azure/msal-browser";

export const ENTRA_SCOPES = ["openid", "profile", "email", "User.Read"];

export function entraClientId() {
  return (process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID ?? "").trim();
}

export function entraConfigured() {
  return Boolean(entraClientId());
}

export function entraAuthority() {
  const explicit = (process.env.NEXT_PUBLIC_ENTRA_AUTHORITY ?? "").trim();
  if (explicit) return explicit;
  const tenant = (process.env.NEXT_PUBLIC_ENTRA_TENANT_ID ?? "common").trim() || "common";
  return `https://login.microsoftonline.com/${tenant}`;
}

export function entraRedirectUri() {
  const fromEnv = (process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI ?? "").trim();
  if (fromEnv) return fromEnv;
  if (typeof window === "undefined") return "/auth/callback/";
  return `${window.location.origin}/auth/callback/`;
}

type MsalInstance = {
  initialize: () => Promise<void>;
  handleRedirectPromise: () => Promise<AuthenticationResult | null>;
  loginRedirect: (request: RedirectRequest) => Promise<void>;
  logoutRedirect: (request?: { postLogoutRedirectUri?: string }) => Promise<void>;
  getAllAccounts: () => AccountInfo[];
  getActiveAccount: () => AccountInfo | null;
  setActiveAccount: (account: AccountInfo | null) => void;
};

let instance: MsalInstance | null = null;
let initialized = false;

export async function getMsal(): Promise<MsalInstance | null> {
  if (!entraConfigured() || typeof window === "undefined") return null;
  if (!instance) {
    const { PublicClientApplication } = await import("@azure/msal-browser");
    instance = new PublicClientApplication({
      auth: {
        clientId: entraClientId(),
        authority: entraAuthority(),
        redirectUri: entraRedirectUri(),
        postLogoutRedirectUri: `${window.location.origin}/login/`,
      },
      cache: {
        cacheLocation: "localStorage",
      },
    });
  }
  if (!initialized) {
    await instance.initialize();
    initialized = true;
  }
  return instance;
}

export function claimsFromAccount(account: AccountInfo) {
  const claims = account.idTokenClaims ?? {};
  const email = String(claims.preferred_username ?? claims.email ?? account.username ?? "").trim();
  const given = String(claims.given_name ?? "").trim();
  const family = String(claims.family_name ?? "").trim();
  const name = String(claims.name ?? [given, family].filter(Boolean).join(" ") ?? email).trim();
  return {
    email,
    name,
    firstName: given,
    lastName: family,
    oid: String(claims.oid ?? account.localAccountId ?? ""),
  };
}

export async function startEntraSignIn(opts?: { email?: string; create?: boolean }) {
  const msal = await getMsal();
  if (!msal) throw new Error("Microsoft Entra ID is not configured.");
  await msal.loginRedirect({
    scopes: ENTRA_SCOPES,
    loginHint: opts?.email,
    prompt: opts?.create ? "create" : "select_account",
    redirectStartPage: entraRedirectUri(),
  });
}

export async function completeEntraRedirect() {
  const msal = await getMsal();
  if (!msal) return null;
  const result = await msal.handleRedirectPromise();
  const account = result?.account ?? msal.getActiveAccount() ?? msal.getAllAccounts()[0] ?? null;
  if (account) msal.setActiveAccount(account);
  return account;
}

export async function startEntraSignOut() {
  const msal = await getMsal();
  if (!msal) return;
  await msal.logoutRedirect({ postLogoutRedirectUri: `${window.location.origin}/login/` });
}
