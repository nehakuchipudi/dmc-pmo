"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import type { Capability } from "@/lib/rbac";

export function IfCan({
  cap,
  children,
}: {
  cap: Capability;
  children: ReactNode;
}) {
  const { can } = useAuth();
  if (!can(cap)) return null;
  return <>{children}</>;
}
