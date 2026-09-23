"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { IdeaEditForm } from "@/components/ppm/PpmRecordForms";
import { DataTable, MetricCard, MetricGrid, Pill } from "@/components/ppm/PpmWidgets";
import { RecordFact } from "@/components/records/RecordChrome";
import { Modal, PageHeader } from "@/components/ui";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

function IdeaView() {
  const id = useSearchParams().get("id");
  const idea = useAppStore((s) => s.ideas.find((i) => i.id === id));
  const companies = useAppStore((s) => s.companies);
  const objectives = useAppStore((s) => s.objectives);
  const projects = useAppStore((s) => s.projects);
  const advanceIdea = useAppStore((s) => s.advanceIdea);
  const convertIdea = useAppStore((s) => s.convertIdea);
  const updateIdea = useAppStore((s) => s.updateIdea);
  const trackView = useAppStore((s) => s.trackView);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!idea) return;
    trackView("idea", idea.id, idea.name);
  }, [idea, trackView]);

  if (!idea) {
    return (
      <div className="fade-in">
        <PageHeader title="Idea" subtitle="This idea was not found." />
        <Link href="/app/ideas" className="btn btn-ghost">
          Back to ideas
        </Link>
      </div>
    );
  }

  const objective = objectives.find((o) => o.id === idea.objectiveId);
  const company = companies.find((c) => c.id === idea.companyId);
  const converted = idea.convertedProjectId
    ? projects.find((p) => p.id === idea.convertedProjectId)
    : undefined;
  const canAdvance = idea.stage !== "Converted" && idea.stage !== "Deferred";

  return (
    <div className="fade-in">
      <PageHeader
        title={idea.name}
        subtitle={idea.summary || "Demand intake before a project exists."}
        actions={
          <>
            {canAdvance ? (
              <button type="button" className="btn btn-ghost" onClick={() => advanceIdea(idea.id)}>
                Advance
              </button>
            ) : null}
            {idea.stage === "Approved" ? (
              <button type="button" className="btn btn-ghost" onClick={() => convertIdea(idea.id)}>
                Convert
              </button>
            ) : null}
            <button type="button" className="btn btn-primary" onClick={() => setEditOpen(true)}>
              Edit details
            </button>
            <Link href="/app/ideas" className="btn btn-ghost">
              All ideas
            </Link>
          </>
        }
      />
      <MetricGrid>
        <MetricCard label="Stage" value={idea.stage} />
        <MetricCard label="Score" value={idea.score} hint="Composite of fit, value, and risk" />
        <MetricCard label="Fit / Value / Risk" value={`${idea.strategicFit} / ${idea.valueScore} / ${idea.riskScore}`} />
        <MetricCard label="Ask" value={money(idea.requestedBudget)} />
        <MetricCard label="Submitter" value={idea.submitter} />
      </MetricGrid>
      <div className="split-2">
        <div className="panel p-5">
          <h2 className="section-title">Idea details</h2>
          <dl className="space-y-3">
            <RecordFact label="Company">
              {company ? (
                <Link href={`/app/companies/view/?id=${company.id}`} className="font-semibold text-[var(--color-navy)]">
                  {company.name}
                </Link>
              ) : (
                idea.companyName ?? "Internal"
              )}
            </RecordFact>
            <RecordFact label="Objective">
              {objective ? (
                <Link href={`/app/strategy/view/?id=${objective.id}`} className="font-semibold text-[var(--color-navy)]">
                  {objective.code} {objective.name}
                </Link>
              ) : (
                "None yet"
              )}
            </RecordFact>
            <RecordFact label="Stage">
              <Pill value={idea.stage} />
            </RecordFact>
            <RecordFact label="Converted project">
              {converted ? (
                <Link href={`/app/projects/view/?id=${converted.id}`} className="font-semibold text-[var(--color-navy)]">
                  {converted.name}
                </Link>
              ) : idea.convertedProjectId ? (
                idea.convertedProjectId
              ) : (
                "Not converted"
              )}
            </RecordFact>
          </dl>
        </div>
        <div className="panel p-5">
          <h2 className="section-title">Scoring</h2>
          <DataTable
            columns={["Dimension", "Score"]}
            rows={[
              ["Strategic fit", String(idea.strategicFit)],
              ["Value", String(idea.valueScore)],
              ["Risk", String(idea.riskScore)],
              ["Composite", String(idea.score)],
            ]}
          />
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Composite score recalculates when you edit fit, value, or risk.
          </p>
        </div>
      </div>
      <Modal open={editOpen} title="Edit idea" onClose={() => setEditOpen(false)} wide>
        <IdeaEditForm
          idea={idea}
          companies={companies}
          objectives={objectives}
          onSubmit={(patch) => {
            updateIdea(idea.id, patch);
            setEditOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-[var(--color-muted)]">Loading idea...</p>}>
      <IdeaView />
    </Suspense>
  );
}
