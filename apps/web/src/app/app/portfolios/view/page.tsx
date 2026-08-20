"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { money } from "@/lib/seed";
import { portfolioMetrics } from "@/lib/ppm";
import { useAppStore } from "@/lib/store";

function PortfolioView() {
  const id = useSearchParams().get("id");
  const portfolio = useAppStore((s) => s.portfolios.find((p) => p.id === id));
  const projects = useAppStore((s) => s.projects);
  const programs = useAppStore((s) => s.programs.filter((p) => p.portfolioId === id));
  const objectives = useAppStore((s) => s.objectives);

  if (!portfolio) {
    return (
      <div className="fade-in">
        <PageHeader title="Portfolio" subtitle="This book was not found." />
        <Link href="/app/portfolios" className="btn btn-ghost">
          Back to portfolios
        </Link>
      </div>
    );
  }

  const m = portfolioMetrics(portfolio, projects);
  const linkedObjectives = objectives.filter((o) => portfolio.objectiveIds.includes(o.id));

  return (
    <div className="fade-in">
      <PageHeader
        title={portfolio.name}
        subtitle={portfolio.description}
        actions={
          <Link href="/app/portfolios" className="btn btn-ghost">
            All portfolios
          </Link>
        }
      />
      <MetricGrid>
        <MetricCard label="Health" value={m.health} tone={m.health === "Healthy" ? "good" : m.health === "Watch" ? "warn" : "bad"} />
        <MetricCard label="Progress" value={`${m.progress}%`} />
        <MetricCard label="Margin" value={`${m.margin}%`} hint={`${m.hoursUsed}/${m.hoursBudget} hours`} />
        <MetricCard label="Invested" value={money(m.invested)} hint={`Envelope ${money(portfolio.budget)}`} />
        <MetricCard label="At risk" value={m.atRisk} tone={m.atRisk ? "warn" : "good"} />
      </MetricGrid>
      <div className="split-2">
        <div className="panel p-5">
          <h2 className="section-title">Projects in this book</h2>
          <DataTable
            columns={["Project", "Client", "Status", "Progress", "Budget"]}
            rows={m.items.map((p) => [
              <Link key={p.id} href={`/app/projects/view/?id=${p.id}`} className="font-semibold text-[var(--color-navy)]">
                {p.name}
              </Link>,
              p.companyName,
              <Pill key={`${p.id}-s`} value={p.status} />,
              <ProgressLine key={`${p.id}-p`} value={p.progress} />,
              money(p.budgetAmount),
            ])}
            empty="No projects placed yet. Convert an approved idea or attach an existing project."
          />
        </div>
        <div className="space-y-4">
          <div className="panel p-5">
            <h2 className="section-title">Programs</h2>
            {programs.map((program) => (
              <Link key={program.id} href={`/app/programs/view/?id=${program.id}`} className="insight-card block">
                <div className="font-semibold">{program.name}</div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">
                  {program.owner} · {program.projectIds.length} projects
                </div>
              </Link>
            ))}
            {!programs.length ? <p className="text-sm text-[var(--color-muted)]">No programs in this portfolio.</p> : null}
          </div>
          <div className="panel p-5">
            <h2 className="section-title">Objectives served</h2>
            {linkedObjectives.map((o) => (
              <div key={o.id} className="insight-card">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">{o.code} {o.name}</span>
                  <Pill value={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-[var(--color-muted)]">Loading portfolio…</p>}>
      <PortfolioView />
    </Suspense>
  );
}
