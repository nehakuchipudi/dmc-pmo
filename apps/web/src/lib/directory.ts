import { initialsFromName, users as seedUsers } from "./seed";
import type { EmailOutboxItem, NotificationItem, Role, TeamMember, User } from "./types";

const DIRECTORY_KEY = "dmc-pmo-directory";
const PENDING_KEY = "dmc-pmo-pending-signup";

export type PendingSignup = {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  companyId?: string;
  notifyEmail: boolean;
};

export function readDirectory(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DIRECTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as User[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeDirectory(users: User[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DIRECTORY_KEY, JSON.stringify(users));
}

export function allAccounts(): User[] {
  const extra = readDirectory();
  const seen = new Set(seedUsers.map((u) => u.id));
  return [...seedUsers, ...extra.filter((u) => !seen.has(u.id))];
}

export function findAccount(id?: string | null) {
  if (!id) return undefined;
  return allAccounts().find((u) => u.id === id);
}

export function findAccountByEmail(email: string) {
  const needle = email.trim().toLowerCase();
  if (!needle) return undefined;
  return allAccounts().find((u) => u.email.toLowerCase() === needle);
}

export function findAccountByOid(oid: string) {
  if (!oid) return undefined;
  return allAccounts().find((u) => u.entraOid === oid);
}

export function upsertDirectoryUser(input: {
  id?: string;
  name: string;
  email: string;
  role: Role;
  companyId?: string;
  entraOid?: string;
  notifyEmail?: boolean;
}): User {
  const existing = input.entraOid
    ? findAccountByOid(input.entraOid) ?? findAccountByEmail(input.email)
    : findAccountByEmail(input.email);
  const next: User = {
    id: existing?.id ?? input.id ?? `u-${Math.random().toString(36).slice(2, 10)}`,
    name: input.name.trim() || existing?.name || input.email,
    initials: initialsFromName(input.name.trim() || input.email),
    role: existing?.role ?? input.role,
    email: input.email.trim().toLowerCase(),
    companyId: input.companyId ?? existing?.companyId,
    entraOid: input.entraOid ?? existing?.entraOid,
    notifyEmail: input.notifyEmail ?? existing?.notifyEmail ?? true,
    avatarUrl: existing?.avatarUrl ?? `https://i.pravatar.cc/128?u=${encodeURIComponent(input.email)}`,
  };
  const others = readDirectory().filter((u) => u.id !== next.id);
  const isSeed = seedUsers.some((u) => u.id === next.id);
  writeDirectory(isSeed ? others : [next, ...others]);
  return next;
}

export function savePendingSignup(pending: PendingSignup) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

const EXTRAS_KEY = "dmc-pmo-account-extras";

export type AccountExtras = {
  team: TeamMember[];
  mail: EmailOutboxItem[];
  notes: NotificationItem[];
};

export function readAccountExtras(): AccountExtras {
  if (typeof window === "undefined") return { team: [], mail: [], notes: [] };
  try {
    const raw = window.localStorage.getItem(EXTRAS_KEY);
    if (!raw) return { team: [], mail: [], notes: [] };
    const parsed = JSON.parse(raw) as AccountExtras;
    return {
      team: parsed.team ?? [],
      mail: parsed.mail ?? [],
      notes: parsed.notes ?? [],
    };
  } catch {
    return { team: [], mail: [], notes: [] };
  }
}

export function writeAccountExtras(extras: AccountExtras) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EXTRAS_KEY, JSON.stringify(extras));
}

export function takePendingSignup(): PendingSignup | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PENDING_KEY);
  window.sessionStorage.removeItem(PENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingSignup;
  } catch {
    return null;
  }
}
