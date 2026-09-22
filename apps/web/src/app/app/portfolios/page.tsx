"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { money } from "@/lib/seed";
import { portfolioMetrics } from "@/lib/ppm";
import { useAppStore } from "@/lib/store";

export default function PortfoliosPage() {
  const portfolios = useAppStore((s) => s.portfolios);
  const projects = useAppStore((s) => s.projects);
  const objectives = useAppStore((s) => s.objectives);

  return (
    <div className="fade-in">
      <PageHeader
        title="Portfolios"
        subtitle="Investment books, not client accounts. Companies stay in Clients. Portfolios group the work leadership funds and reviews."
      />
      <MetricGrid>
        <MetricCard label="Portfolios" value={portfolios.length} />
        <MetricCard label="Objectives" value={objectives.length} />
        <MetricCard
          label="Booked"
          value={money(portfolios.reduce((s, p) => s + portfolioMetrics(p, projects).invested, 0))}
          hint="Sum of linked project budgets"
        />
        <MetricCard label="Approved envelope" value={money(portfolios.reduce((s, p) => s + p.budget, 0))} />
        <MetricCard label="Projects placed" value={new Set(portfolios.flatMap((p) => p.projectIds)).size} />
      </MetricGrid>
      <div className="panel p-5">
        <DataTable
          columns={["Portfolio", "Owner", "Theme", "Health", "Progress", "Invested / Envelope"]}
          rows={portfolios.map((portfolio) => {
            const m = portfolioMetrics(portfolio, projects);
            return [
              <div key={portfolio.id}>
                <Link href={`/app/portfolios/view/?id=${portfolio.id}`} className="font-semibold text-[var(--color-navy)]">
                  {portfolio.name}
                </Link>
                <div className="text-xs text-[var(--color-muted)]">{portfolio.description}</div>
              </div>,
              portfolio.owner,
              portfolio.theme,
              <Pill key={`${portfolio.id}-h`} value={m.health} />,
              <ProgressLine key={`${portfolio.id}-p`} value={m.progress} />,
              `${money(m.invested)} / ${money(portfolio.budget)}`,
            ];
          })}
        />
      </div>
    </div>
  );
}
