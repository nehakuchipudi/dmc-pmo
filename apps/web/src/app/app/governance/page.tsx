"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { DataTable, MetricCard, MetricGrid, Pill } from "@/components/ppm/PpmWidgets";
import { IfCan } from "@/components/auth/IfCan";
import { useAppStore } from "@/lib/store";

export default function GovernancePage() {
  const gates = useAppStore((s) => s.gates);
  const projects = useAppStore((s) => s.projects);
  const decideGate = useAppStore((s) => s.decideGate);

  return (
    <div className="fade-in">
      <PageHeader
        title="Governance"
        subtitle="Stage gates on top of the signoffs you already run inside a project. Approve or reject here when the work is ready to change phase."
      />
      <MetricGrid>
        <MetricCard label="Gates" value={gates.length} />
        <MetricCard label="In review" value={gates.filter((g) => g.status === "In Review").length} tone="warn" />
        <MetricCard label="Upcoming" value={gates.filter((g) => g.status === "Upcoming").length} />
        <MetricCard label="Approved" value={gates.filter((g) => g.status === "Approved").length} tone="good" />
        <MetricCard label="Rejected" value={gates.filter((g) => g.status === "Rejected").length} />
      </MetricGrid>
      <div className="panel p-5">
        <DataTable
          columns={["Gate", "Project", "Stage", "Owner", "Due", "Status", "Decision"]}
          rows={gates.map((gate) => [
            <div key={gate.id}>
              <div className="font-semibold">{gate.name}</div>
              <div className="text-xs text-[var(--color-muted)]">{gate.criteria}</div>
            </div>,
            <Link key={`${gate.id}-p`} href={`/app/projects/view/?id=${gate.projectId}`} className="text-[var(--color-navy)]">
              {projects.find((p) => p.id === gate.projectId)?.name ?? gate.projectId}
            </Link>,
            gate.stage,
            gate.owner,
            gate.due,
            <Pill key={`${gate.id}-s`} value={gate.status} />,
            gate.status === "Approved" || gate.status === "Rejected" ? (
              "Decided"
            ) : (
              <IfCan cap="decide_governance">
                <div className="flex gap-2">
                  <button type="button" className="btn btn-primary text-sm" onClick={() => decideGate(gate.id, "Approved")}>
                    Approve
                  </button>
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => decideGate(gate.id, "Rejected")}>
                    Reject
                  </button>
                </div>
              </IfCan>
            ),
          ])}
        />
      </div>
    </div>
  );
}
