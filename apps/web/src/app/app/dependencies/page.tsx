"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Field, Modal, PageHeader, TextSelect, TextTextarea } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, Pill } from "@/components/ppm/PpmWidgets";
import { useAppStore } from "@/lib/store";
import type { CrossDependency } from "@/lib/types";

export default function DependenciesPage() {
  const dependencies = useAppStore((s) => s.dependencies);
  const projects = useAppStore((s) => s.projects);
  const createDependency = useAppStore((s) => s.createDependency);
  const [open, setOpen] = useState(false);
  const [predecessorProjectId, setPred] = useState(projects[0]?.id ?? "");
  const [successorProjectId, setSucc] = useState(projects[1]?.id ?? projects[0]?.id ?? "");
  const [type, setType] = useState<CrossDependency["type"]>("Finish to Start");
  const [note, setNote] = useState("");

  function name(id: string) {
    return projects.find((p) => p.id === id)?.name ?? id;
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Dependencies"
        subtitle="Cross-project holds. Task-level predecessors stay on the project Gantt. This view is for portfolio coordination."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Record dependency
          </button>
        }
      />
      <MetricGrid>
        <MetricCard label="Links" value={dependencies.length} />
        <MetricCard label="On track" value={dependencies.filter((d) => d.status === "On Track").length} tone="good" />
        <MetricCard label="At risk" value={dependencies.filter((d) => d.status === "At Risk").length} tone="warn" />
        <MetricCard label="Blocked" value={dependencies.filter((d) => d.status === "Blocked").length} tone="bad" />
        <MetricCard label="Projects touched" value={new Set(dependencies.flatMap((d) => [d.predecessorProjectId, d.successorProjectId])).size} />
      </MetricGrid>
      <div className="panel p-5">
        <DataTable
          columns={["Predecessor", "Successor", "Type", "Status", "Note"]}
          rows={dependencies.map((d) => [
            <Link key={`${d.id}-p`} href={`/app/projects/view/?id=${d.predecessorProjectId}`} className="font-semibold text-[var(--color-navy)]">
              {name(d.predecessorProjectId)}
            </Link>,
            <Link key={`${d.id}-s`} href={`/app/projects/view/?id=${d.successorProjectId}`} className="font-semibold text-[var(--color-navy)]">
              {name(d.successorProjectId)}
            </Link>,
            d.type,
            <Pill key={`${d.id}-st`} value={d.status} />,
            d.note,
          ])}
        />
      </div>
      <Modal open={open} title="Record a cross-project dependency" onClose={() => setOpen(false)}>
        <Field label="Predecessor">
          <TextSelect value={predecessorProjectId} onChange={(e) => setPred(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Successor">
          <TextSelect value={successorProjectId} onChange={(e) => setSucc(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Type">
          <TextSelect value={type} onChange={(e) => setType(e.target.value as CrossDependency["type"])}>
            <option>Finish to Start</option>
            <option>Shared Resource</option>
            <option>Data</option>
          </TextSelect>
        </Field>
        <Field label="Note">
          <TextTextarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            createDependency({ predecessorProjectId, successorProjectId, type, note: note.trim() });
            setOpen(false);
            setNote("");
          }}
        >
          Save
        </button>
      </Modal>
    </div>
  );
}
