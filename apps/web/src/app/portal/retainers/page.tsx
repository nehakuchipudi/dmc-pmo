"use client";

import { PageHeader, ProgressBar, StatusPill, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";

export default function PortalRetainersPage() {
  const { user } = useAuth();
  const retainers = useAppStore((s) => s.retainers).filter((r) => r.companyId === user?.companyId);

  return (
    <div className="fade-in">
      <PageHeader
        title="Retainers"
        subtitle="Hours included in your current support periods."
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Retainer</th>
              <th>Period</th>
              <th>Usage</th>
              <th>Remaining</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {retainers.map((r) => {
              const remaining = Math.max(0, r.budgetHours - r.usedHours);
              const pct = Math.round((r.usedHours / r.budgetHours) * 100);
              return (
                <tr key={r.id}>
                  <td className="font-medium text-[var(--color-navy)]">{r.name}</td>
                  <td>{r.periodLabel}</td>
                  <td className="min-w-[160px]">
                    <div className="mb-1 text-sm tabular-nums">
                      {r.usedHours} / {r.budgetHours} hrs
                    </div>
                    <ProgressBar value={pct} />
                  </td>
                  <td className="tabular-nums font-semibold">{remaining} hrs</td>
                  <td>
                    <StatusPill tone={statusTone(r.status)}>{r.status}</StatusPill>
                  </td>
                </tr>
              );
            })}
            {!retainers.length ? (
              <tr>
                <td colSpan={5} className="text-[var(--color-muted)]">
                  No active retainers for your company.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
