"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, ProgressLine } from "@/components/ppm/PpmWidgets";
import { useAppStore } from "@/lib/store";

export default function BenefitsPage() {
  const benefits = useAppStore((s) => s.benefits);
  const objectives = useAppStore((s) => s.objectives);
  const projects = useAppStore((s) => s.projects);
  const avg = benefits.length ? Math.round(benefits.reduce((s, b) => s + b.progress, 0) / benefits.length) : 0;

  return (
    <div className="fade-in">
      <PageHeader
        title="Benefits"
        subtitle="Outcomes the firm promised, not hours billed. Each benefit traces to a strategic objective and, when it can, to a live project."
      />
      <MetricGrid>
        <MetricCard label="Benefits tracked" value={benefits.length} />
        <MetricCard label="Realization" value={`${avg}%`} tone={avg >= 60 ? "good" : "warn"} />
        <MetricCard label="Linked to projects" value={benefits.filter((b) => b.projectId).length} />
        <MetricCard label="Objectives covered" value={new Set(benefits.map((b) => b.objectiveId)).size} />
        <MetricCard label="Owners" value={new Set(benefits.map((b) => b.owner)).size} />
      </MetricGrid>
      <div className="panel p-5">
        <DataTable
          columns={["Benefit", "Objective", "Project", "Baseline", "Current", "Target", "Progress"]}
          rows={benefits.map((b) => [
            <div key={b.id}>
              <div className="font-semibold">{b.name}</div>
              <div className="text-xs text-[var(--color-muted)]">{b.metric} · {b.owner}</div>
            </div>,
            objectives.find((o) => o.id === b.objectiveId)?.code ?? "-",
            b.projectId ? (
              <Link href={`/app/projects/view/?id=${b.projectId}`} className="text-[var(--color-navy)]">
                {projects.find((p) => p.id === b.projectId)?.name ?? b.projectId}
              </Link>
            ) : (
              "Firm-wide"
            ),
            b.baseline,
            b.current,
            b.target,
            <div key={`${b.id}-p`} className="min-w-[120px]">
              <ProgressLine value={b.progress} />
            </div>,
          ])}
        />
      </div>
    </div>
  );
}
