"use client";

import Link from "next/link";
import { money, profitability } from "@/lib/data";
import { PageHeader, SideRail } from "@/components/ui";

export default function ProfitabilityPage() {
  const p = profitability;
  return (
    <div className="fade-in">
      <div className="mb-2 text-sm text-[var(--color-muted)]">
        <Link href="/app/reports">Reports</Link> / Profitability Dashboard
      </div>
      <PageHeader
        title="Profitability Dashboard"
        subtitle="All Companies · Q3 2026 · Filters: Date Range, Team, Company."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue Recognized" value={money(p.revenueRecognized)} delta={p.revenueDelta} good />
        <Kpi label="Actual Cost" value={money(p.actualCost)} delta={p.costDelta} />
        <Kpi label="Gross Margin" value={`${p.grossMargin}%`} delta={p.marginDelta} good />
        <Kpi label="Avg. Utilization" value={`${p.avgUtilization}%`} delta={p.utilDelta} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="panel p-4">
          <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Margin by Project</h2>
          <div className="flex h-64 items-end gap-3 rounded-lg bg-[var(--color-bg)] p-4">
            {[70, 45, 88, 62, 55, 40, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-[var(--color-navy)] to-[var(--color-gold)]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <SideRail title="Top Accounts by Revenue">
          <ul className="space-y-3 text-sm">
            {p.topAccounts.map((a) => (
              <li key={a.name} className="flex justify-between gap-2">
                <span>{a.name}</span>
                <strong>{money(a.amount)}</strong>
              </li>
            ))}
          </ul>
        </SideRail>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  delta,
  good,
}: {
  label: string;
  value: string;
  delta: string;
  good?: boolean;
}) {
  return (
    <div className="panel p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[var(--color-navy)]">{value}</div>
      <div className={`mt-1 text-xs ${good ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
        {delta}
      </div>
    </div>
  );
}
