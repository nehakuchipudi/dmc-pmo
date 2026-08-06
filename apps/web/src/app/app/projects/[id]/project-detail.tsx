"use client";

import Link from "next/link";
import { milestones, projects } from "@/lib/data";
import { Avatar, PageHeader, SideRail, StatusPill, statusTone } from "@/components/ui";

export function ProjectDetail({ id }: { id: string }) {
  const project = projects.find((p) => p.id === id) ?? projects[0];
  const ms = milestones.filter((m) => m.projectId === project.id);
  const remaining = project.budgetHours - project.loggedHours;

  return (
    <div className="fade-in">
      <div className="mb-2 text-sm text-[var(--color-muted)]">
        <Link href="/app/projects">Projects</Link> / {project.name}
      </div>
      <PageHeader
        title={project.name}
        subtitle={`${project.companyName} · Manager: ${project.manager} · Due ${project.due}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-navy)] text-sm font-bold text-white">
              {project.progress}%
            </div>
            <button type="button" className="btn btn-ghost">+ New Milestone</button>
            <button type="button" className="btn btn-ghost">+ New Task</button>
            <button type="button" className="btn btn-gold">Request Signoff</button>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        {["Overview", "Milestones", "Tasks", "Tickets", "Time & Budget", "Files", "Signoffs", "Client Notes"].map(
          (tab, i) => (
            <span key={tab} className={i === 0 ? "font-semibold text-[var(--color-navy)] border-b-2 border-[var(--color-navy)] pb-1" : "text-[var(--color-muted)]"}>
              {tab}
            </span>
          ),
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="panel p-4">
            <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Milestones</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ms.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.due}</td>
                    <td><StatusPill tone={statusTone(m.status)}>{m.status}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel p-4">
            <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Budget vs Actual</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Budget" value={`${project.budgetHours} hrs`} />
              <Metric label="Logged" value={`${project.loggedHours} hrs`} />
              <Metric label="Remaining" value={`${remaining} hrs`} />
              <Metric label="Margin" value={`${project.marginPct}%`} accent />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <SideRail title="Client Portal Visibility">
            <p className="text-sm text-[var(--color-muted)]">
              This project is <strong>shared</strong> with {project.portalContacts} client contacts, who can view milestones/tasks and comment on progress.
            </p>
          </SideRail>
          <SideRail title="Team">
            <div className="space-y-2 text-sm">
              {[
                { i: "MD", n: "M. Doyle", r: "PM" },
                { i: "JK", n: "J. Kim", r: "Consultant" },
                { i: "SA", n: "S. Ahmed", r: "Consultant" },
              ].map((m) => (
                <div key={m.n} className="flex items-center gap-2">
                  <Avatar initials={m.i} />
                  <span>
                    {m.n} <span className="text-[var(--color-muted)]">({m.r})</span>
                  </span>
                </div>
              ))}
            </div>
          </SideRail>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-[var(--color-bg)] p-3">
      <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accent ? "text-[var(--color-success)]" : "text-[var(--color-navy)]"}`}>
        {value}
      </div>
    </div>
  );
}
