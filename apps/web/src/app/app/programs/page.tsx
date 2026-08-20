"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { programMetrics } from "@/lib/ppm";
import { useAppStore } from "@/lib/store";

export default function ProgramsPage() {
  const programs = useAppStore((s) => s.programs);
  const portfolios = useAppStore((s) => s.portfolios);
  const projects = useAppStore((s) => s.projects);
  const objectives = useAppStore((s) => s.objectives);

  return (
    <div className="fade-in">
      <PageHeader
        title="Programs"
        subtitle="Related projects that share an outcome. Programs sit under a portfolio and above the delivery work you already run."
      />
      <MetricGrid>
        <MetricCard label="Programs" value={programs.length} />
        <MetricCard
          label="On track"
          value={programs.filter((p) => p.status === "On Track").length}
          tone="good"
        />
        <MetricCard
          label="Need attention"
          value={programs.filter((p) => p.status !== "On Track" && p.status !== "Completed").length}
          tone="warn"
        />
        <MetricCard label="Projects grouped" value={new Set(programs.flatMap((p) => p.projectIds)).size} />
        <MetricCard label="Ungrouped" value={projects.filter((p) => !programs.some((g) => g.projectIds.includes(p.id))).length} />
      </MetricGrid>
      <div className="panel p-5">
        <DataTable
          columns={["Program", "Portfolio", "Objective", "Owner", "Status", "Progress"]}
          rows={programs.map((program) => {
            const m = programMetrics(program, projects);
            return [
              <Link key={program.id} href={`/app/programs/view/?id=${program.id}`} className="font-semibold text-[var(--color-navy)]">
                {program.name}
              </Link>,
              portfolios.find((p) => p.id === program.portfolioId)?.name ?? "-",
              objectives.find((o) => o.id === program.objectiveId)?.code ?? "-",
              program.owner,
              <Pill key={`${program.id}-s`} value={program.status} />,
              <ProgressLine key={`${program.id}-p`} value={m.progress} />,
            ];
          })}
        />
      </div>
    </div>
  );
}
