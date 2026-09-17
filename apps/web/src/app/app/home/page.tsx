"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { money } from "@/lib/seed";
import { allocationByMember, blockedDependencies, openHighRisks, portfolioMetrics } from "@/lib/ppm";
import { useAppStore } from "@/lib/store";

export default function HomePage() {
  const projects = useAppStore((s) => s.projects);
  const portfolios = useAppStore((s) => s.portfolios);
  const objectives = useAppStore((s) => s.objectives);
  const risks = useAppStore((s) => s.risks);
  const gates = useAppStore((s) => s.gates);
  const allocations = useAppStore((s) => s.allocations);
  const benefits = useAppStore((s) => s.benefits);
  const dependencies = useAppStore((s) => s.dependencies);
  const invoices = useAppStore((s) => s.invoices);

  const snapshot = useMemo(() => {
    const delivery = portfolios.find((p) => p.id === "pf-delivery");
    const metrics = delivery ? portfolioMetrics(delivery, projects) : null;
    const mapped = new Set(portfolios.flatMap((p) => p.projectIds));
    const aligned = projects.filter((p) => mapped.has(p.id)).length;
    const capacity = allocationByMember(allocations);
    const overloaded = capacity.filter((c) => c.pct > 100);
    const highRisks = openHighRisks(risks);
    const benefitAvg = benefits.length
      ? Math.round(benefits.reduce((sum, b) => sum + b.progress, 0) / benefits.length)
      : 0;
    const overdueCash = invoices.filter((i) => i.status === "Overdue").reduce((sum, i) => sum + i.amount, 0);
    return {
      metrics,
      alignedPct: projects.length ? Math.round((aligned / projects.length) * 100) : 0,
      overloaded,
      highRisks,
      benefitAvg,
      overdueCash,
      blocked: blockedDependencies(dependencies),
      pendingGates: gates.filter((g) => g.status === "In Review" || g.status === "Upcoming"),
    };
  }, [portfolios, projects, allocations, risks, benefits, invoices, dependencies, gates]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Portfolio home"
        subtitle="Are we on the right projects, with the right people, at the right cost, with acceptable risk, and are those projects moving the strategy?"
      />
      <MetricGrid>
        <MetricCard
          label="Right work"
          value={`${snapshot.alignedPct}%`}
          hint="Active projects mapped to a portfolio and objective"
          tone={snapshot.alignedPct >= 80 ? "good" : "warn"}
        />
        <MetricCard
          label="Right resources"
          value={snapshot.overloaded.length ? `${snapshot.overloaded.length} over` : "In band"}
          hint={snapshot.overloaded.length ? snapshot.overloaded.map((o) => o.name).join(", ") : "No one above 100% allocation"}
          tone={snapshot.overloaded.length ? "bad" : "good"}
        />
        <MetricCard
          label="Right cost"
          value={snapshot.metrics ? `${snapshot.metrics.margin}%` : "-"}
          hint={snapshot.metrics ? `${money(snapshot.metrics.invested)} invested · ${snapshot.metrics.hoursUsed}/${snapshot.metrics.hoursBudget} hrs` : "No portfolio"}
          tone={(snapshot.metrics?.margin ?? 0) >= 28 ? "good" : "warn"}
        />
        <MetricCard
          label="Acceptable risk"
          value={snapshot.highRisks.length}
          hint={`${snapshot.blocked.length} cross-project holds · ${money(snapshot.overdueCash)} overdue invoices`}
          tone={snapshot.highRisks.length > 2 ? "bad" : snapshot.highRisks.length ? "warn" : "good"}
        />
        <MetricCard
          label="Strategy moving"
          value={`${snapshot.benefitAvg}%`}
          hint="Average benefit realization against target"
          tone={snapshot.benefitAvg >= 60 ? "good" : "warn"}
        />
      </MetricGrid>

      <div className="split-2">
        <div className="panel p-5">
          <h2 className="section-title">Portfolios in flight</h2>
          <DataTable
            columns={["Portfolio", "Owner", "Health", "Progress", "Projects"]}
            rows={portfolios.map((portfolio) => {
              const m = portfolioMetrics(portfolio, projects);
              return [
                <Link key={portfolio.id} href={`/app/portfolios/view/?id=${portfolio.id}`} className="font-semibold text-[var(--color-navy)]">
                  {portfolio.name}
                </Link>,
                portfolio.owner,
                <Pill key={`${portfolio.id}-h`} value={m.health} />,
                <ProgressLine key={`${portfolio.id}-p`} value={m.progress} />,
                String(m.items.length),
              ];
            })}
          />
        </div>
        <div className="panel p-5">
          <h2 className="section-title">Needs a decision</h2>
          <div className="space-y-3">
            {snapshot.pendingGates.slice(0, 4).map((gate) => (
              <Link key={gate.id} href="/app/governance" className="insight-card block">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{gate.name}</div>
                  <Pill value={gate.status} />
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">
                  {gate.stage} · due {gate.due} · {gate.owner}
                </div>
              </Link>
            ))}
            {snapshot.highRisks.slice(0, 3).map((risk) => (
              <Link key={risk.id} href="/app/risks" className="insight-card block">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{risk.title}</div>
                  <Pill value={risk.impact} />
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">
                  {risk.owner} · {risk.status}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 panel p-5">
        <h2 className="section-title">Strategic objectives</h2>
        <DataTable
          columns={["Code", "Objective", "Owner", "Status", "Progress"]}
          rows={objectives.map((o) => [
            o.code,
            <Link key={o.id} href="/app/strategy" className="font-medium">
              {o.name}
            </Link>,
            o.owner,
            <Pill key={`${o.id}-s`} value={o.status} />,
            <ProgressLine key={`${o.id}-p`} value={o.progress} />,
          ])}
        />
      </div>
    </div>
  );
}
