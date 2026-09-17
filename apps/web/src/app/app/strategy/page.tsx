"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Field, Modal, PageHeader, TextInput, TextTextarea } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { objectiveCoverage } from "@/lib/ppm";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export default function StrategyPage() {
  const { user } = useAuth();
  const objectives = useAppStore((s) => s.objectives);
  const portfolios = useAppStore((s) => s.portfolios);
  const projects = useAppStore((s) => s.projects);
  const createObjective = useAppStore((s) => s.createObjective);
  const coverage = objectiveCoverage(objectives, projects, portfolios);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [horizon, setHorizon] = useState("2026 Q4");
  const [description, setDescription] = useState("");

  return (
    <div className="fade-in">
      <PageHeader
        title="Strategy"
        subtitle="Objectives the portfolio must move. Portfolios and projects attach here so leadership can see alignment, not just activity."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> New objective
          </button>
        }
      />
      <MetricGrid>
        <MetricCard label="Objectives" value={objectives.length} hint="Firm-level outcomes" />
        <MetricCard
          label="Covered"
          value={coverage.filter((c) => c.linked.length).length}
          hint="Objectives with at least one portfolio"
        />
        <MetricCard
          label="At risk"
          value={objectives.filter((o) => o.status === "At Risk" || o.status === "Lagging").length}
          hint="Need a portfolio conversation"
          tone="warn"
        />
        <MetricCard
          label="Avg progress"
          value={`${objectives.length ? Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length) : 0}%`}
        />
        <MetricCard label="Portfolios" value={portfolios.length} hint="Investment books" />
      </MetricGrid>
      <div className="panel p-5">
        <DataTable
          columns={["Code", "Objective", "Owner", "Horizon", "Status", "Progress", "Linked work"]}
          rows={coverage.map(({ objective, linked, portfolios: linkedPortfolios }) => [
            objective.code,
            <div key={objective.id}>
              <div className="font-semibold">{objective.name}</div>
              <div className="text-xs text-[var(--color-muted)]">{objective.target}</div>
            </div>,
            objective.owner,
            objective.horizon,
            <Pill key={`${objective.id}-s`} value={objective.status} />,
            <ProgressLine key={`${objective.id}-p`} value={objective.progress} />,
            linkedPortfolios.length
              ? `${linkedPortfolios.map((p) => p.name).join(", ")} (${linked.length} projects)`
              : "No portfolio yet",
          ])}
        />
      </div>
      <Modal open={open} title="New strategic objective" onClose={() => setOpen(false)}>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="What must be true?" />
        </Field>
        <Field label="Target">
          <TextInput value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Measurable outcome" />
        </Field>
        <Field label="Horizon">
          <TextInput value={horizon} onChange={(e) => setHorizon(e.target.value)} />
        </Field>
        <Field label="Description">
          <TextTextarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!name.trim()) return;
            createObjective({
              name: name.trim(),
              owner: user?.name ?? "Dillon Morgan",
              horizon,
              target: target.trim() || "Define target",
              description: description.trim(),
            });
            setOpen(false);
            setName("");
            setTarget("");
            setDescription("");
          }}
        >
          Save objective
        </button>
      </Modal>
    </div>
  );
}
