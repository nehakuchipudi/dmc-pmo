"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Field, PageHeader, SideRail, TextSelect } from "@/components/ui";
import { money } from "@/lib/seed";
import { exportCsv } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

export default function ProfitabilityPage() {
  const projects = useAppStore((s) => s.projects);
  const companies = useAppStore((s) => s.companies);
  const invoices = useAppStore((s) => s.invoices);
  const [companyId, setCompanyId] = useState("all");

  const filtered = useMemo(
    () => (companyId === "all" ? projects : projects.filter((p) => p.companyId === companyId)),
    [projects, companyId],
  );

  const kpis = useMemo(() => {
    const revenue = invoices
      .filter((i) => (companyId === "all" ? true : i.companyId === companyId) && i.status !== "Draft")
      .reduce((s, i) => s + i.amount, 0);
    const cost = filtered.reduce((s, p) => s + p.loggedHours * 95, 0);
    const margin = revenue ? Math.round(((revenue - cost) / revenue) * 100) : 0;
    const util = filtered.length
      ? Math.round(
          (filtered.reduce((s, p) => s + p.loggedHours / Math.max(p.budgetHours, 1), 0) / filtered.length) * 100,
        )
      : 0;
    return { revenue, cost, margin, util };
  }, [invoices, filtered, companyId]);

  const topAccounts = useMemo(() => {
    const map = new Map<string, number>();
    invoices
      .filter((i) => i.status !== "Draft")
      .forEach((i) => map.set(i.companyName, (map.get(i.companyName) ?? 0) + i.amount));
    return [...map.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [invoices]);

  const bars = filtered.map((p) => Math.max(12, Math.min(100, p.marginPct * 2)));

  return (
    <div className="fade-in">
      <div className="mb-2 text-sm text-[var(--color-muted)]">
        <Link href="/app/reports">Reports</Link> / Profitability Dashboard
      </div>
      <PageHeader
        title="Profitability Dashboard"
        subtitle="Live margins from projects and invoices in this session."
        actions={
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              exportCsv(
                "profitability.csv",
                filtered.map((p) => ({
                  project: p.name,
                  company: p.companyName,
                  margin: p.marginPct,
                  logged: p.loggedHours,
                  budget: p.budgetHours,
                })),
              )
            }
          >
            Export CSV
          </button>
        }
      />
      <div className="mb-4 max-w-xs">
        <Field label="Company filter">
          <TextSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="all">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </TextSelect>
        </Field>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue recognized" value={money(kpis.revenue)} />
        <Kpi label="Actual cost (blended)" value={money(kpis.cost)} />
        <Kpi label="Gross margin" value={`${kpis.margin}%`} good={kpis.margin >= 25} />
        <Kpi label="Avg. utilization" value={`${kpis.util}%`} good={kpis.util >= 70} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="panel p-4">
          <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Margin by project</h2>
          <div className="flex h-64 items-end gap-3 rounded-lg bg-[var(--color-bg)] p-4">
            {bars.map((h, i) => (
              <div key={filtered[i]?.id ?? i} className="flex flex-1 flex-col items-center gap-2" title={filtered[i]?.name}>
                <div
                  className="w-full rounded-t-md bg-[var(--color-navy)]"
                  style={{ height: `${h}%` }}
                />
                <span className="truncate text-[10px] text-[var(--color-muted)]">{filtered[i]?.marginPct}%</span>
              </div>
            ))}
          </div>
        </div>
        <SideRail title="Top accounts by revenue">
          <ul className="space-y-3 text-sm">
            {topAccounts.map((a) => (
              <li key={a.name} className="flex justify-between gap-2">
                <span>{a.name}</span>
                <strong className="tabular-nums">{money(a.amount)}</strong>
              </li>
            ))}
          </ul>
        </SideRail>
      </div>
    </div>
  );
}

function Kpi({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="panel p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[var(--color-navy)]">{value}</div>
      {good !== undefined ? (
        <div className={`mt-1 text-xs ${good ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
          {good ? "Healthy" : "Watch"}
        </div>
      ) : null}
    </div>
  );
}
