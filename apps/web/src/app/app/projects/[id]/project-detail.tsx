"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { GanttView } from "@/components/Gantt";
import {
  Avatar,
  PageHeader,
  SideRail,
  StatusPill,
  Tabs,
  statusTone,
} from "@/components/ui";
import { formatDisplayDate } from "@/lib/seed";
import { exportProjectPlanPdf } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

export function ProjectDetail({ id }: { id: string }) {
  const projects = useAppStore((s) => s.projects);
  const milestones = useAppStore((s) => s.milestones);
  const tasks = useAppStore((s) => s.tasks);
  const tickets = useAppStore((s) => s.tickets);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const requestSignoff = useAppStore((s) => s.requestSignoff);
  const approveSignoff = useAppStore((s) => s.approveSignoff);
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus);
  const trackView = useAppStore((s) => s.trackView);
  const [tab, setTab] = useState("Overview");
  const [createKind, setCreateKind] = useState<CreateKind>(null);

  const project = projects.find((p) => p.id === id);
  const ms = milestones.filter((m) => m.projectId === project?.id);
  const projectTasks = tasks.filter((t) => t.projectId === project?.id);
  const projectTickets = tickets.filter((t) => t.projectId === project?.id);
  const projectTime = timeEntries.filter((t) => t.projectId === project?.id);
  const remaining = project ? project.budgetHours - project.loggedHours : 0;

  useEffect(() => {
    if (!project) return;
    trackView("project", project.id, project.name);
  }, [project, trackView]);

  if (!project) {
    return (
      <div className="fade-in panel p-6">
        <p className="font-semibold text-[var(--color-navy)]">Project not found</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">This record is not in the current session.</p>
        <Link href="/app/projects" className="btn btn-primary mt-4">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-2 text-sm text-[var(--color-muted)]">
        <Link href="/app/projects">Projects</Link> / {project.name}
      </div>
      <PageHeader
        title={project.name}
        subtitle={`${project.companyName} · Manager: ${project.manager} · Due ${formatDisplayDate(project.due)}`}
        actions={
          <>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-navy)] text-sm font-bold text-white">
              {project.progress}%
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => setCreateKind("milestone")}>+ Milestone</button>
            <button type="button" className="btn btn-ghost" onClick={() => setCreateKind("task")}>+ Task</button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => exportProjectPlanPdf(project, ms, projectTasks)}
            >
              Export plan PDF
            </button>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => requestSignoff(project.id, ms.find((m) => m.status !== "Approved")?.name ?? "Current milestone")}
            >
              Request Signoff
            </button>
          </>
        }
      />
      <Tabs
        tabs={["Overview", "Plan", "Milestones", "Tasks", "Tickets", "Time & Budget", "Files", "Signoffs", "Client Notes"]}
        active={tab}
        onChange={setTab}
      />

      {tab === "Overview" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="panel p-4">
              <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Milestones</h2>
              <table className="table">
                <thead><tr><th>Milestone</th><th>Due</th><th>Status</th></tr></thead>
                <tbody>
                  {ms.map((m) => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>{formatDisplayDate(m.due)}</td>
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
                    <span>{m.n} <span className="text-[var(--color-muted)]">({m.r})</span></span>
                  </div>
                ))}
              </div>
            </SideRail>
          </div>
        </div>
      )}

      {tab === "Plan" && <GanttView project={project} milestones={ms} tasks={projectTasks} />}

      {tab === "Milestones" && (
        <div className="panel overflow-hidden">
          <div className="flex justify-end p-3">
            <button type="button" className="btn btn-primary" onClick={() => setCreateKind("milestone")}>Add milestone</button>
          </div>
          <table className="table">
            <thead><tr><th>Milestone</th><th>Start</th><th>Due</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {ms.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{formatDisplayDate(m.start)}</td>
                  <td>{formatDisplayDate(m.due)}</td>
                  <td><StatusPill tone={statusTone(m.status)}>{m.status}</StatusPill></td>
                  <td>
                    {m.status !== "Approved" ? (
                      <button type="button" className="btn btn-ghost text-sm" onClick={() => approveSignoff(m.id)}>
                        Approve
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Tasks" && (
        <div className="panel overflow-hidden">
          <div className="flex justify-end p-3">
            <button type="button" className="btn btn-primary" onClick={() => setCreateKind("task")}>Add task</button>
          </div>
          <table className="table">
            <thead><tr><th>Task</th><th>Assignee</th><th>Due</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {projectTasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.assignee}</td>
                  <td>{formatDisplayDate(t.due)}</td>
                  <td><StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill></td>
                  <td>
                    <select
                      className="field-input"
                      value={t.status}
                      onChange={(e) => updateTaskStatus(t.id, e.target.value as typeof t.status)}
                    >
                      {["Not Started", "In Progress", "Review", "Done"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Tickets" && (
        <div className="panel overflow-hidden">
          <table className="table">
            <thead><tr><th>Ticket</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {projectTickets.map((t) => (
                <tr key={t.id}>
                  <td><Link href={`/app/tickets/view/?id=${t.id}`} className="font-medium text-[var(--color-navy)]">#{t.number} {t.subject}</Link></td>
                  <td><StatusPill tone={statusTone(t.priority)}>{t.priority}</StatusPill></td>
                  <td><StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill></td>
                </tr>
              ))}
              {!projectTickets.length ? <tr><td colSpan={3} className="text-[var(--color-muted)]">No tickets linked.</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Time & Budget" && (
        <div className="space-y-4">
          <div className="panel p-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Budget" value={`${project.budgetHours} hrs`} />
            <Metric label="Logged" value={`${project.loggedHours} hrs`} />
            <Metric label="Remaining" value={`${remaining} hrs`} />
            <Metric label="Margin" value={`${project.marginPct}%`} accent />
          </div>
          <div className="panel overflow-hidden">
            <div className="flex justify-end p-3">
              <button type="button" className="btn btn-primary" onClick={() => setCreateKind("time")}>Log time</button>
            </div>
            <table className="table">
              <thead><tr><th>Date</th><th>Person</th><th>Task</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>
                {projectTime.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDisplayDate(t.date)}</td>
                    <td>{t.userName}</td>
                    <td>{t.taskName ?? "General"}</td>
                    <td>{t.hours}</td>
                    <td><StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Files" && (
        <div className="panel p-6 text-sm text-[var(--color-muted)]">
          Project files (SOW, designs, signoff packs) will sync to secure storage in the API phase.
        </div>
      )}

      {tab === "Signoffs" && (
        <div className="panel overflow-hidden">
          <table className="table">
            <thead><tr><th>Deliverable</th><th>Due</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {ms.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{formatDisplayDate(m.due)}</td>
                  <td><StatusPill tone={statusTone(m.status)}>{m.status}</StatusPill></td>
                  <td className="space-x-2">
                    <button type="button" className="btn btn-ghost text-sm" onClick={() => requestSignoff(project.id, m.name)}>Request</button>
                    {m.status !== "Approved" ? (
                      <button type="button" className="btn btn-primary text-sm" onClick={() => approveSignoff(m.id)}>Approve</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Client Notes" && (
        <div className="panel p-4 text-sm">
          <p className="text-[var(--color-muted)] mb-3">Client-visible notes only. Internal discussion stays off this tab.</p>
          <p>Homepage review scheduled for Aug 9. Client asked for denser product photography on hero.</p>
        </div>
      )}

      <CreateForms kind={createKind} onClose={() => setCreateKind(null)} defaults={{ projectId: project.id, companyId: project.companyId }} />
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-[var(--color-fog)] p-3">
      <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accent ? "text-[var(--color-success)]" : "text-[var(--color-navy)]"}`}>
        {value}
      </div>
    </div>
  );
}
