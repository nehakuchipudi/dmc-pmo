"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Field, Modal, PageHeader, TextInput, TextSelect, TextTextarea } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, Pill } from "@/components/ppm/PpmWidgets";
import { IDEA_STATUS_OPTIONS, ideaCanConvert, normalizeIdeaStage, resolveIdeaObjective } from "@/lib/ppm";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import { IfCan } from "@/components/auth/IfCan";
import { useAuth } from "@/lib/auth";
import type { IdeaStage } from "@/lib/types";

export default function IdeasPage() {
  const { user, can } = useAuth();
  const router = useRouter();
  const ideas = useAppStore((s) => s.ideas);
  const companies = useAppStore((s) => s.companies);
  const objectives = useAppStore((s) => s.objectives);
  const createIdea = useAppStore((s) => s.createIdea);
  const updateIdea = useAppStore((s) => s.updateIdea);
  const convertIdea = useAppStore((s) => s.convertIdea);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [budget, setBudget] = useState("25000");
  const [companyId, setCompanyId] = useState("");
  const [objectiveText, setObjectiveText] = useState("");

  const convert = (id: string) => {
    const projectId = convertIdea(id);
    if (projectId) router.push(`/app/projects/view/?id=${projectId}`);
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Ideas"
        subtitle="Demand intake before a project exists. Set a status, then convert the ones that should become projects."
        actions={
          <IfCan cap="create_idea">
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              <Plus size={16} /> Submit idea
            </button>
          </IfCan>
        }
      />
      <MetricGrid>
        <MetricCard label="In funnel" value={ideas.filter((i) => ideaCanConvert(i)).length} />
        <MetricCard label="In progress" value={ideas.filter((i) => normalizeIdeaStage(i.stage) === "In Progress").length} />
        <MetricCard label="Approved" value={ideas.filter((i) => normalizeIdeaStage(i.stage) === "Approved").length} tone="good" />
        <MetricCard label="On hold" value={ideas.filter((i) => normalizeIdeaStage(i.stage) === "On Hold").length} />
        <MetricCard label="Converted" value={ideas.filter((i) => normalizeIdeaStage(i.stage) === "Converted").length} />
      </MetricGrid>
      <div className="panel p-5">
        <DataTable
          columns={["Idea", "Company", "Status", "Ask", "Action"]}
          rows={ideas.map((idea) => {
            const stage = normalizeIdeaStage(idea.stage);
            return [
              <div key={idea.id}>
                <Link href={`/app/ideas/view/?id=${idea.id}`} className="font-semibold text-[var(--color-navy)]">
                  {idea.name}
                </Link>
                <div className="text-xs text-[var(--color-muted)]">{idea.summary}</div>
              </div>,
              idea.companyName ?? "Internal",
              stage === "Converted" || !can("edit_idea") ? (
                <Pill key={`${idea.id}-s`} value={stage} />
              ) : (
                <TextSelect
                  key={`${idea.id}-s`}
                  aria-label={`Status for ${idea.name}`}
                  value={stage}
                  onChange={(e) => updateIdea(idea.id, { stage: e.target.value as IdeaStage })}
                >
                  {IDEA_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </TextSelect>
              ),
              money(idea.requestedBudget),
              <div key={`${idea.id}-a`} className="flex gap-2">
                <Link href={`/app/ideas/view/?id=${idea.id}`} className="btn btn-ghost text-sm">
                  Open
                </Link>
                {ideaCanConvert(idea) ? (
                  <IfCan cap="convert_idea">
                    <button type="button" className="btn btn-primary text-sm" onClick={() => convert(idea.id)}>
                      Convert
                    </button>
                  </IfCan>
                ) : idea.convertedProjectId ? (
                  <Link href={`/app/projects/view/?id=${idea.convertedProjectId}`} className="btn btn-ghost text-sm">
                    Project
                  </Link>
                ) : null}
              </div>,
            ];
          })}
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
          <TextInput
            value={objectiveText}
            onChange={(e) => setObjectiveText(e.target.value)}
            placeholder="What outcome does this idea serve?"
          />
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
              ...resolveIdeaObjective(objectiveText, objectives),
            });
            setOpen(false);
            setName("");
            setSummary("");
            setObjectiveText("");
            router.push(`/app/ideas/view/?id=${id}`);
          }}
        >
          Submit
        </button>
      </Modal>
    </div>
  );
}
