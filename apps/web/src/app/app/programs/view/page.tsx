"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { PageHeader } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { money } from "@/lib/seed";
import { programMetrics } from "@/lib/ppm";
import { useAppStore } from "@/lib/store";

function ProgramView() {
  const id = useSearchParams().get("id");
  const program = useAppStore((s) => s.programs.find((p) => p.id === id));
  const projects = useAppStore((s) => s.projects);
  const portfolio = useAppStore((s) => s.portfolios.find((p) => p.id === program?.portfolioId));
  const objective = useAppStore((s) => s.objectives.find((o) => o.id === program?.objectiveId));
  const allRisks = useAppStore((s) => s.risks);
  const risks = useMemo(
    () =>
      allRisks.filter(
        (r) => r.programId === id || (program && r.projectId && program.projectIds.includes(r.projectId)),
      ),
    [allRisks, id, program],
  );

  if (!program) {
    return (
      <div className="fade-in">
        <PageHeader title="Program" subtitle="This program was not found." />
        <Link href="/app/programs" className="btn btn-ghost">
          Back to programs
        </Link>
      </div>
    );
  }

  const m = programMetrics(program, projects);

  return (
    <div className="fade-in">
      <PageHeader
        title={program.name}
        subtitle={program.description}
        actions={
          <Link href="/app/programs" className="btn btn-ghost">
            All programs
          </Link>
        }
      />
      <MetricGrid>
        <MetricCard label="Status" value={program.status} tone={program.status === "On Track" ? "good" : "warn"} />
        <MetricCard label="Progress" value={`${m.progress}%`} />
        <MetricCard label="Portfolio" value={portfolio?.name ?? "Unplaced"} />
        <MetricCard label="Objective" value={objective?.code ?? "-"} hint={objective?.name} />
        <MetricCard label="Open risks" value={risks.filter((r) => r.status !== "Closed").length} />
      </MetricGrid>
      <div className="split-2">
        <div className="panel p-5">
          <h2 className="section-title">Projects</h2>
          <DataTable
            columns={["Project", "Client", "Manager", "Status", "Progress", "Budget"]}
            rows={m.items.map((p) => [
              <Link key={p.id} href={`/app/projects/view/?id=${p.id}`} className="font-semibold text-[var(--color-navy)]">
                {p.name}
              </Link>,
              p.companyName,
              p.manager,
              <Pill key={`${p.id}-s`} value={p.status} />,
              <ProgressLine key={`${p.id}-p`} value={p.progress} />,
              money(p.budgetAmount),
            ])}
          />
        </div>
        <div className="panel p-5">
          <h2 className="section-title">Program risks</h2>
          {risks.map((risk) => (
            <div key={risk.id} className="insight-card">
              <div className="flex justify-between gap-3">
                <span className="font-semibold">{risk.title}</span>
                <Pill value={risk.status} />
              </div>
              <div className="mt-1 text-sm text-[var(--color-muted)]">
                {risk.owner} · {risk.impact} impact
              </div>
            </div>
          ))}
          {!risks.length ? <p className="text-sm text-[var(--color-muted)]">No risks tagged to this program.</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-[var(--color-muted)]">Loading program…</p>}>
      <ProgramView />
    </Suspense>
  );
}
