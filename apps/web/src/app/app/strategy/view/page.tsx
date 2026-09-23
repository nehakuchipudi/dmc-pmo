"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ObjectiveEditForm } from "@/components/ppm/PpmRecordForms";
import { DataTable, MetricCard, MetricGrid, Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { RecordFact } from "@/components/records/RecordChrome";
import { Modal, PageHeader } from "@/components/ui";
import { objectiveCoverage } from "@/lib/ppm";
import { useAppStore } from "@/lib/store";

function StrategyView() {
  const id = useSearchParams().get("id");
  const objective = useAppStore((s) => s.objectives.find((o) => o.id === id));
  const portfolios = useAppStore((s) => s.portfolios);
  const projects = useAppStore((s) => s.projects);
  const updateObjective = useAppStore((s) => s.updateObjective);
  const trackView = useAppStore((s) => s.trackView);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!objective) return;
    trackView("objective", objective.id, objective.name);
  }, [objective, trackView]);

  if (!objective) {
    return (
      <div className="fade-in">
        <PageHeader title="Objective" subtitle="This objective was not found." />
        <Link href="/app/strategy" className="btn btn-ghost">
          Back to strategy
        </Link>
      </div>
    );
  }

  const coverage = objectiveCoverage([objective], projects, portfolios)[0];
  const linkedPortfolios = coverage?.portfolios ?? [];
  const linkedProjects = coverage?.linked ?? [];

  return (
    <div className="fade-in">
      <PageHeader
        title={`${objective.code} ${objective.name}`}
        subtitle={objective.target}
        actions={
          <>
            <button type="button" className="btn btn-primary" onClick={() => setEditOpen(true)}>
              Edit details
            </button>
            <Link href="/app/strategy" className="btn btn-ghost">
              All objectives
            </Link>
          </>
        }
      />
      <MetricGrid>
        <MetricCard label="Status" value={objective.status} tone={objective.status === "On Track" || objective.status === "Achieved" ? "good" : "warn"} />
        <MetricCard label="Progress" value={`${objective.progress}%`} />
        <MetricCard label="Horizon" value={objective.horizon} />
        <MetricCard label="Portfolios" value={linkedPortfolios.length} />
        <MetricCard label="Projects" value={linkedProjects.length} />
      </MetricGrid>
      <div className="split-2">
        <div className="panel p-5">
          <h2 className="section-title">Objective details</h2>
          <dl className="space-y-3">
            <RecordFact label="Owner">{objective.owner}</RecordFact>
            <RecordFact label="Horizon">{objective.horizon}</RecordFact>
            <RecordFact label="Status">
              <Pill value={objective.status} />
            </RecordFact>
            <RecordFact label="Progress">
              <ProgressLine value={objective.progress} />
            </RecordFact>
            <RecordFact label="Target">{objective.target}</RecordFact>
            <RecordFact label="Description">{objective.description || "No description yet."}</RecordFact>
          </dl>
        </div>
        <div className="panel p-5">
          <h2 className="section-title">Portfolios serving this</h2>
          <DataTable
            columns={["Portfolio", "Owner", "Theme"]}
            rows={linkedPortfolios.map((p) => [
              <Link key={p.id} href={`/app/portfolios/view/?id=${p.id}`} className="font-semibold text-[var(--color-navy)]">
                {p.name}
              </Link>,
              p.owner,
              p.theme,
            ])}
            empty="No portfolio is attached yet. Edit a portfolio and check this objective."
          />
        </div>
      </div>
      <div className="mt-4 panel p-5">
        <h2 className="section-title">Linked projects</h2>
        <DataTable
          columns={["Project", "Client", "Status", "Progress"]}
          rows={linkedProjects.map((p) => [
            <Link key={p.id} href={`/app/projects/view/?id=${p.id}`} className="font-semibold text-[var(--color-navy)]">
              {p.name}
            </Link>,
            p.companyName,
            <Pill key={`${p.id}-s`} value={p.status} />,
            <ProgressLine key={`${p.id}-p`} value={p.progress} />,
          ])}
          empty="Projects show here when a linked portfolio contains them."
        />
      </div>
      <Modal open={editOpen} title="Edit objective" onClose={() => setEditOpen(false)} wide>
        <ObjectiveEditForm
          objective={objective}
          onSubmit={(patch) => {
            updateObjective(objective.id, patch);
            setEditOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-[var(--color-muted)]">Loading objective...</p>}>
      <StrategyView />
    </Suspense>
  );
}
