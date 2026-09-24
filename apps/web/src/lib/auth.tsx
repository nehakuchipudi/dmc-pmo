"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { findAccount } from "./directory";
import { entraConfigured, startEntraSignOut } from "./entra";
import { users } from "./data";
import { applyTeamRole, can as roleCan, canSeeFinancials as roleSeesMoney, type Capability } from "./rbac";
import { useAppStore } from "./store";
import type { Role, User } from "./types";

const STORAGE_KEY = "dmc-pmo-user";

type AuthContextValue = {
  user: User | null;
  setUserId: (id: string) => void;
  setSessionUser: (next: User) => void;
  logout: () => void;
  isInternal: boolean;
  isClient: boolean;
  can: (cap: Capability) => boolean;
  canSeeFinancials: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function lookupUser(id: string | null) {
  if (!id) return null;
  return findAccount(id) ?? users.find((u) => u.id === id) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const team = useAppStore((s) => s.team);
  const resolved = useMemo(() => applyTeamRole(user, team), [user, team]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setUser(lookupUser(saved));
    setReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: resolved,
      setUserId: (id: string) => {
        const next = lookupUser(id);
        setUser(next);
        if (next) window.localStorage.setItem(STORAGE_KEY, next.id);
        else window.localStorage.removeItem(STORAGE_KEY);
      },
      setSessionUser: (next: User) => {
        setUser(next);
        window.localStorage.setItem(STORAGE_KEY, next.id);
      },
      logout: () => {
        const usedEntra = Boolean(resolved?.entraOid);
        setUser(null);
        window.localStorage.removeItem(STORAGE_KEY);
        if (usedEntra && entraConfigured()) {
          void startEntraSignOut();
        }
      },
      isInternal: !!resolved && resolved.role !== "client",
      isClient: !!resolved && resolved.role === "client",
      can: (cap: Capability) => roleCan(resolved?.role, cap),
      canSeeFinancials: roleSeesMoney(resolved, team),
    }),
    [resolved, team],
  );

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--color-bg)] text-[var(--color-muted)]">
        Loading Dillon Morgan PMO...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function roleLabel(role: Role) {
  switch (role) {
    case "admin":
      return "Admin";
    case "pm":
      return "Project Manager";
    case "staff":
      return "Staff";
    case "finance":
      return "Finance";
    case "leadership":
      return "Leadership";
    case "client":
      return "Client Contact";
  }
}
