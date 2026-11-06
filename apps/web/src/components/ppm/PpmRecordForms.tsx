"use client";

import { useState } from "react";
import { Field, TextInput, TextSelect, TextTextarea } from "@/components/ui";
import { IDEA_STATUS_OPTIONS, ideaObjectiveLabel, normalizeIdeaStage, resolveIdeaObjective } from "@/lib/ppm";
import type { Idea, IdeaStage, ObjectiveStatus, Portfolio, StrategicObjective } from "@/lib/types";

const OBJECTIVE_STATUSES: ObjectiveStatus[] = ["On Track", "At Risk", "Lagging", "Achieved"];

function CheckList({
  label,
  items,
  selected,
  onToggle,
  empty,
}: {
  label: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  empty?: string;
}) {
  return (
    <div className="mb-3 text-sm">
      <div className="mb-1 text-[var(--color-muted)]">{label}</div>
      <div className="max-h-44 space-y-1 overflow-auto rounded-lg border border-[var(--color-border)] p-2">
        {items.map((item) => (
          <label key={item.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={selected.includes(item.id)}
              onChange={() => onToggle(item.id)}
            />
            <span>{item.label}</span>
          </label>
        ))}
        {!items.length ? <p className="text-[var(--color-muted)]">{empty ?? "Nothing to attach yet."}</p> : null}
      </div>
    </div>
  );
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export function IdeaEditForm({
  idea,
  companies,
  objectives,
  onSubmit,
}: {
  idea: Idea;
  companies: { id: string; name: string }[];
  objectives: { id: string; code: string; name: string }[];
  onSubmit: (patch: Partial<Idea>) => void;
}) {
  const [name, setName] = useState(idea.name);
  const [summary, setSummary] = useState(idea.summary);
  const [companyId, setCompanyId] = useState(idea.companyId ?? "");
  const [objectiveText, setObjectiveText] = useState(ideaObjectiveLabel(idea, objectives));
  const [submitter, setSubmitter] = useState(idea.submitter);
  const [stage, setStage] = useState<IdeaStage>(normalizeIdeaStage(idea.stage));
  const [budget, setBudget] = useState(String(idea.requestedBudget));

  return (
    <form
      className="space-y-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
          name: name.trim(),
          summary: summary.trim(),
          companyId: companyId || "",
          ...(() => {
            const next = resolveIdeaObjective(objectiveText, objectives);
            return { objectiveId: next.objectiveId ?? "", objectiveName: next.objectiveName ?? "" };
          })(),
          submitter: submitter.trim() || idea.submitter,
          stage,
          requestedBudget: Number(budget) || 0,
        });
      }}
    >
      <Field label="Name" required>
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
        <TextInput
          value={objectiveText}
          onChange={(e) => setObjectiveText(e.target.value)}
          placeholder="What outcome does this idea serve?"
        />
      </Field>
      <Field label="Submitter">
        <TextInput value={submitter} onChange={(e) => setSubmitter(e.target.value)} />
      </Field>
      <Field label="Status">
        <TextSelect
          value={stage}
          onChange={(e) => setStage(e.target.value as IdeaStage)}
          disabled={stage === "Converted"}
        >
          {(stage === "Converted" ? (["Converted"] as const) : IDEA_STATUS_OPTIONS).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Requested budget">
        <TextInput type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} />
      </Field>
      <Field label="Summary">
        <TextTextarea value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <button type="submit" className="btn btn-primary">
        Save idea
      </button>
    </form>
  );
}

export function ObjectiveEditForm({
  objective,
  onSubmit,
}: {
  objective: StrategicObjective;
  onSubmit: (patch: Partial<StrategicObjective>) => void;
}) {
  const [name, setName] = useState(objective.name);
  const [owner, setOwner] = useState(objective.owner);
  const [horizon, setHorizon] = useState(objective.horizon);
  const [status, setStatus] = useState<ObjectiveStatus>(objective.status);
  const [target, setTarget] = useState(objective.target);
  const [progress, setProgress] = useState(String(objective.progress));
  const [description, setDescription] = useState(objective.description);

  return (
    <form
      className="space-y-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
          name: name.trim(),
          owner: owner.trim() || objective.owner,
          horizon: horizon.trim() || objective.horizon,
          status,
          target: target.trim() || objective.target,
          progress: Number(progress) || 0,
          description: description.trim(),
        });
      }}
    >
      <Field label="Name" required>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Owner">
        <TextInput value={owner} onChange={(e) => setOwner(e.target.value)} />
      </Field>
      <Field label="Horizon">
        <TextInput value={horizon} onChange={(e) => setHorizon(e.target.value)} />
      </Field>
      <Field label="Status">
        <TextSelect value={status} onChange={(e) => setStatus(e.target.value as ObjectiveStatus)}>
          {OBJECTIVE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Target">
        <TextInput value={target} onChange={(e) => setTarget(e.target.value)} />
      </Field>
      <Field label="Progress (%)">
        <TextInput type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(e.target.value)} />
      </Field>
      <Field label="Description">
        <TextTextarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <button type="submit" className="btn btn-primary">
        Save objective
      </button>
    </form>
  );
}

export function PortfolioEditForm({
  portfolio,
  projects,
  objectives,
  onSubmit,
}: {
  portfolio?: Portfolio;
  projects: { id: string; name: string; companyName: string }[];
  objectives: { id: string; code: string; name: string }[];
  onSubmit: (values: {
    name: string;
    owner: string;
    theme: string;
    budget: number;
    description: string;
    projectIds: string[];
    objectiveIds: string[];
  }) => void;
}) {
  const [name, setName] = useState(portfolio?.name ?? "");
  const [owner, setOwner] = useState(portfolio?.owner ?? "");
  const [theme, setTheme] = useState(portfolio?.theme ?? "External value");
  const [budget, setBudget] = useState(String(portfolio?.budget ?? 50000));
  const [description, setDescription] = useState(portfolio?.description ?? "");
  const [projectIds, setProjectIds] = useState<string[]>(portfolio?.projectIds ?? []);
  const [objectiveIds, setObjectiveIds] = useState<string[]>(portfolio?.objectiveIds ?? []);

  return (
    <form
      className="space-y-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
          name: name.trim(),
          owner: owner.trim() || "PMO",
          theme: theme.trim() || "External value",
          budget: Number(budget) || 0,
          description: description.trim(),
          projectIds,
          objectiveIds,
        });
      }}
    >
      <Field label="Name" required>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Owner">
        <TextInput value={owner} onChange={(e) => setOwner(e.target.value)} />
      </Field>
      <Field label="Theme">
        <TextInput value={theme} onChange={(e) => setTheme(e.target.value)} />
      </Field>
      <Field label="Approved envelope">
        <TextInput type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} />
      </Field>
      <Field label="Description">
        <TextTextarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <CheckList
        label="Projects in this book"
        items={projects.map((p) => ({ id: p.id, label: `${p.name} (${p.companyName})` }))}
        selected={projectIds}
        onToggle={(id) => setProjectIds((cur) => toggleId(cur, id))}
        empty="No projects to attach yet."
      />
      <CheckList
        label="Objectives served"
        items={objectives.map((o) => ({ id: o.id, label: `${o.code} ${o.name}` }))}
        selected={objectiveIds}
        onToggle={(id) => setObjectiveIds((cur) => toggleId(cur, id))}
        empty="Add a strategic objective first."
      />
      <button type="submit" className="btn btn-primary">
        {portfolio ? "Save portfolio" : "Create portfolio"}
      </button>
    </form>
  );
}
