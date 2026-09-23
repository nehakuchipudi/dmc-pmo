"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Field, Modal, PageHeader, TextInput, TextSelect, TextTextarea } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, Pill } from "@/components/ppm/PpmWidgets";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export default function IdeasPage() {
  const { user } = useAuth();
  const router = useRouter();
  const ideas = useAppStore((s) => s.ideas);
  const companies = useAppStore((s) => s.companies);
  const objectives = useAppStore((s) => s.objectives);
  const createIdea = useAppStore((s) => s.createIdea);
  const advanceIdea = useAppStore((s) => s.advanceIdea);
  const convertIdea = useAppStore((s) => s.convertIdea);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [budget, setBudget] = useState("25000");
  const [companyId, setCompanyId] = useState("");
  const [objectiveId, setObjectiveId] = useState("");

  return (
    <div className="fade-in">
      <PageHeader
        title="Ideas"
        subtitle="Demand intake before a project exists. Score for strategic fit, value, and risk, then convert the ones that belong in a portfolio."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Submit idea
          </button>
        }
      />
      <MetricGrid>
        <MetricCard label="In funnel" value={ideas.filter((i) => i.stage !== "Converted" && i.stage !== "Deferred").length} />
        <MetricCard label="Approved" value={ideas.filter((i) => i.stage === "Approved").length} tone="good" />
        <MetricCard label="Converted" value={ideas.filter((i) => i.stage === "Converted").length} />
        <MetricCard
          label="Asked"
          value={money(ideas.reduce((s, i) => s + i.requestedBudget, 0))}
          hint="Requested budget still in the funnel"
        />
        <MetricCard label="Avg score" value={ideas.length ? Math.round(ideas.reduce((s, i) => s + i.score, 0) / ideas.length) : 0} />
      </MetricGrid>
      <div className="panel p-5">
        <DataTable
          columns={["Idea", "Company", "Score", "Fit / Value / Risk", "Stage", "Ask", "Action"]}
          rows={ideas.map((idea) => [
            <div key={idea.id}>
              <Link href={`/app/ideas/view/?id=${idea.id}`} className="font-semibold text-[var(--color-navy)]">
                {idea.name}
              </Link>
              <div className="text-xs text-[var(--color-muted)]">{idea.summary}</div>
            </div>,
            idea.companyName ?? "Internal",
            String(idea.score),
            `${idea.strategicFit} / ${idea.valueScore} / ${idea.riskScore}`,
            <Pill key={`${idea.id}-s`} value={idea.stage} />,
            money(idea.requestedBudget),
            <div key={`${idea.id}-a`} className="flex gap-2">
              <Link href={`/app/ideas/view/?id=${idea.id}`} className="btn btn-ghost text-sm">
                Open
              </Link>
              {idea.stage !== "Converted" && idea.stage !== "Deferred" ? (
                <button type="button" className="btn btn-ghost text-sm" onClick={() => advanceIdea(idea.id)}>
                  Advance
                </button>
              ) : null}
              {idea.stage === "Approved" ? (
                <button type="button" className="btn btn-primary text-sm" onClick={() => convertIdea(idea.id)}>
                  Convert
                </button>
              ) : null}
            </div>,
          ])}
        />
      </div>
      <Modal open={open} title="Submit an idea" onClose={() => setOpen(false)}>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Company">
          <TextSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">Internal / unassigned</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Objective">
          <TextSelect value={objectiveId} onChange={(e) => setObjectiveId(e.target.value)}>
            <option value="">None yet</option>
            {objectives.map((o) => (
              <option key={o.id} value={o.id}>
                {o.code} {o.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Requested budget">
          <TextInput value={budget} onChange={(e) => setBudget(e.target.value)} />
        </Field>
        <Field label="Summary">
          <TextTextarea value={summary} onChange={(e) => setSummary(e.target.value)} />
        </Field>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!name.trim()) return;
            const id = createIdea({
              name: name.trim(),
              summary: summary.trim(),
              submitter: user?.name ?? "Staff",
              requestedBudget: Number(budget) || 0,
              companyId: companyId || undefined,
              objectiveId: objectiveId || undefined,
            });
            setOpen(false);
            setName("");
            setSummary("");
            router.push(`/app/ideas/view/?id=${id}`);
          }}
        >
          Submit
        </button>
      </Modal>
    </div>
  );
}
