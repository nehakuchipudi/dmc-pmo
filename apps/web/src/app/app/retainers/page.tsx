"use client";

import { useState } from "react";
import { PageHeader, ProgressBar, StatusPill, statusTone } from "@/components/ui";
import { useAppStore } from "@/lib/store";

export default function RetainersPage() {
  const retainers = useAppStore((s) => s.retainers);
  const allocate = useAppStore((s) => s.allocateRetainerHours);
  const [hours, setHours] = useState<Record<string, string>>({});

  return (
    <div className="fade-in">
      <PageHeader
        title="Retainers"
        subtitle="Recurring contracts with period budgets, allocation, and usage."
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Retainer</th>
              <th>Company</th>
              <th>Period</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Allocate</th>
            </tr>
          </thead>
          <tbody>
            {retainers.map((r) => {
              const pct = Math.round((r.usedHours / r.budgetHours) * 100);
              return (
                <tr key={r.id}>
                  <td className="font-medium text-[var(--color-navy)]">{r.name}</td>
                  <td>{r.companyName}</td>
                  <td>{r.periodLabel}</td>
                  <td className="min-w-[180px]">
                    <div className="mb-1 text-sm tabular-nums">
                      {r.usedHours} / {r.budgetHours} hrs
                    </div>
                    <ProgressBar value={pct} />
                  </td>
                  <td>
                    <StatusPill tone={statusTone(r.status)}>{r.status}</StatusPill>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <input
                        className="field-input w-20"
                        type="number"
                        min="0.25"
                        step="0.25"
                        placeholder="hrs"
                        value={hours[r.id] ?? ""}
                        onChange={(e) => setHours((h) => ({ ...h, [r.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="btn btn-primary text-sm"
                        onClick={() => {
                          const n = Number(hours[r.id]);
                          if (!n) return;
                          allocate(r.id, n);
                          setHours((h) => ({ ...h, [r.id]: "" }));
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
