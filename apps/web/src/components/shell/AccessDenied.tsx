"use client";

import Link from "next/link";
import { roleLabel, useAuth } from "@/lib/auth";

export function AccessDenied({ moduleName }: { moduleName?: string }) {
  const { user } = useAuth();
  return (
    <div className="fade-in grid min-h-[50vh] place-items-center">
      <div className="panel max-w-lg p-6 text-center">
        <div className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">Restricted</div>
        <h1 className="mt-2 text-xl font-semibold text-[var(--color-navy)]">
          {moduleName ? `${moduleName} is not available for your role` : "You do not have access"}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Signed in as {user?.name ?? "a workspace user"} ({roleLabel(user?.role ?? "staff")}). Ask an admin if you need
          this area.
        </p>
        <Link href="/app/home" className="btn btn-primary mt-4 inline-flex justify-center">
          Back to home
        </Link>
      </div>
    </div>
  );
}
