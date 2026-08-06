"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { FilterChips, PageHeader, ProgressBar, SideRail, StatusPill, Tabs, statusTone } from "@/components/ui";
import { formatDisplayDate } from "@/lib/seed";
import { exportCsv } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

const FILTERS = [
  "All Open Projects",
  "Recently Created",
  "Managed By Me",
  "Projects Overdue",
];

export default function ProjectsPage() {
  const projects = useAppStore((s) => s.projects);
  const milestones = useAppStore((s) => s.milestones);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [tab, setTab] = useState("Projects");
  const [createKind, setCreateKind] = useState<CreateKind>(null);

  const rows = useMemo(() => {
    if (filter === "Projects Overdue") return projects.filter((p) => p.status === "Overdue");
    if (filter === "Managed By Me") return projects.filter((p) => p.manager === "M. Doyle");
    return projects;
  }, [filter, projects]);

  const pendingSignoffs = milestones.filter((m) => m.status === "Awaiting Signoff" || m.status === "In Progress");

  return (
    <div className="fade-in">
      <PageHeader
        title="Projects"
        subtitle="Every active and completed engagement."
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                exportCsv(
                  "projects.csv",
                  rows.map((p) => ({
                    name: p.name,
                    company: p.companyName,
                    manager: p.manager,
                    status: p.status,
                    progress: p.progress,
                    due: p.due,
                  })),
                )
              }
            >
              Export CSV
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setCreateKind("project")}>
              <Plus size={16} /> New Project
            </button>
          </>
        }
      />
      <Tabs tabs={["Projects", "Milestones", "Signoffs"]} active={tab} onChange={setTab} />
      {tab === "Projects" ? (
        <>
          <FilterChips items={FILTERS} active={filter} onChange={setFilter} />
          <div className="grid gap-4 lg:grid-cols-[1fr_250px]">
            <div className="panel overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Company</th>
                    <th>Manager</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/app/projects/view/?id=${p.id}`} className="font-medium text-[var(--color-navy)]">
                          {p.name}
                        </Link>
                      </td>
                      <td>{p.companyName}</td>
                      <td>{p.manager}</td>
                      <td>
                        <ProgressBar value={p.progress} />
                      </td>
                      <td>
                        <StatusPill tone={statusTone(p.status)}>{p.status}</StatusPill>
                      </td>
                      <td>{formatDisplayDate(p.due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SideRail title="Shortcuts">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/app/reports" className="hover:underline">
                    Projects dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/app/timesheets" className="hover:underline">
                    Project timesheet overview
                  </Link>
                </li>
                <li>
                  <button type="button" className="hover:underline" onClick={() => setTab("Signoffs")}>
                    Project signoffs ({pendingSignoffs.length})
                  </button>
                </li>
                <li>
                  <button type="button" className="hover:underline" onClick={() => setFilter("Managed By Me")}>
                    Managed by me
                  </button>
                </li>
              </ul>
            </SideRail>
          </div>
        </>
      ) : null}
      {tab === "Milestones" ? (
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Project</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => {
                const project = projects.find((p) => p.id === m.projectId);
                return (
                  <tr key={m.id}>
                    <td className="font-medium">{m.name}</td>
                    <td>{project?.name ?? "-"}</td>
                    <td>{formatDisplayDate(m.due)}</td>
                    <td>
                      <StatusPill tone={statusTone(m.status)}>{m.status}</StatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-4">
            <button type="button" className="btn btn-primary" onClick={() => setCreateKind("milestone")}>
              New milestone
            </button>
          </div>
        </div>
      ) : null}
      {tab === "Signoffs" ? (
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Project</th>
                <th>Due</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pendingSignoffs.map((m) => {
                const project = projects.find((p) => p.id === m.projectId);
                return (
                  <tr key={m.id}>
                    <td className="font-medium">{m.name}</td>
                    <td>{project?.name ?? "-"}</td>
                    <td>{formatDisplayDate(m.due)}</td>
                    <td>
                      <StatusPill tone={statusTone(m.status)}>{m.status}</StatusPill>
                    </td>
                    <td className="text-right">
                      <Link href={`/app/projects/view/?id=${m.projectId}`} className="btn btn-ghost text-sm">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!pendingSignoffs.length ? (
            <p className="p-6 text-sm text-[var(--color-muted)]">No pending signoffs.</p>
          ) : null}
        </div>
      ) : null}
      <CreateForms kind={createKind} onClose={() => setCreateKind(null)} />
    </div>
  );
}
