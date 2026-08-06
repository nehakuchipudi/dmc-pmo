"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { users } from "./data";
import type { Role, User } from "./types";

const STORAGE_KEY = "dmc-pmo-user";

type AuthContextValue = {
  user: User | null;
  setUserId: (id: string) => void;
  logout: () => void;
  isInternal: boolean;
  isClient: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const found = users.find((u) => u.id === saved) ?? null;
    setUser(found);
    setReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUserId: (id: string) => {
        const next = users.find((u) => u.id === id) ?? null;
        setUser(next);
        if (next) window.localStorage.setItem(STORAGE_KEY, next.id);
        else window.localStorage.removeItem(STORAGE_KEY);
      },
      logout: () => {
        setUser(null);
        window.localStorage.removeItem(STORAGE_KEY);
      },
      isInternal: !!user && user.role !== "client",
      isClient: !!user && user.role === "client",
    }),
    [user],
  );

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--color-bg)] text-[var(--color-muted)]">
        Loading Dillon Morgan PMO…
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
