"use client";

import { useAuth } from "@/lib/auth";
import { PageHeader, StatusPill } from "@/components/ui";

export default function PortalRetainersPage() {
  const { user } = useAuth();

  return (
    <div className="fade-in">
      <PageHeader
        title="Retainers"
        subtitle="Your remaining entitlement for the current period. Cost rates are hidden."
      />
      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm text-[var(--color-muted)]">Company</div>
            <div className="text-lg font-semibold text-[var(--color-navy)]">
              {user?.companyId === "c-cascade" ? "Cascade Ventures" : "Your company"}
            </div>
            <div className="mt-2 text-sm">Monthly Managed Support</div>
            <div className="text-sm text-[var(--color-muted)]">Period: Aug 1 to Aug 31, 2026</div>
          </div>
          <StatusPill tone="success">Active</StatusPill>
        </div>
        <div className="mt-5 rounded-lg bg-[var(--color-bg)] p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Hours remaining</div>
          <div className="mt-1 text-3xl font-semibold text-[var(--color-navy)]">12 / 40 hrs</div>
          <div className="progress mt-3">
            <span style={{ width: "70%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
