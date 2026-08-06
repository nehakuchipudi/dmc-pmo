"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { FilesNotesPanel } from "@/components/FilesNotesPanel";
import { ProjectSchedule } from "@/components/schedule/ProjectSchedule";
import {
  PageHeader,
  SideRail,
  StatusPill,
  Tabs,
  statusTone,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { formatDisplayDate, money } from "@/lib/seed";
import { exportProjectPlanPdf } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

const TABS = ["Overview", "Schedule", "Files & Notes", "Billing", "Tickets", "Signoffs"];

export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const projects = useAppStore((s) => s.projects);
  const milestones = useAppStore((s) => s.milestones);
  const tasks = useAppStore((s) => s.tasks);
  const tickets = useAppStore((s) => s.tickets);
  const contacts = useAppStore((s) => s.contacts);
  const createMilestone = useAppStore((s) => s.createMilestone);
  const createTask = useAppStore((s) => s.createTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const updateMilestone = useAppStore((s) => s.updateMilestone);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const requestSignoff = useAppStore((s) => s.requestSignoff);
  const approveSignoff = useAppStore((s) => s.approveSignoff);
  const trackView = useAppStore((s) => s.trackView);
  const generateProjectInvoice = useAppStore((s) => s.generateProjectInvoice);
  const queueEmail = useAppStore((s) => s.queueEmail);
  const pushToast = useAppStore((s) => s.pushToast);
  const addProjectFile = useAppStore((s) => s.addProjectFile);
  const deleteProjectFile = useAppStore((s) => s.deleteProjectFile);
  const moveProjectFile = useAppStore((s) => s.moveProjectFile);
  const addProjectNote = useAppStore((s) => s.addProjectNote);
  const addMaterial = useAppStore((s) => s.addMaterial);
  const updateProject = useAppStore((s) => s.updateProject);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const [tab, setTab] = useState("Overview");
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [createDefaults, setCreateDefaults] = useState<{ projectId?: string; companyId?: string }>({});

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);
  const ms = useMemo(
    () => milestones.filter((m) => m.projectId === project?.id),
    [milestones, project?.id],
  );
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === project?.id),
    [tasks, project?.id],
  );
  const projectTickets = useMemo(
    () => tickets.filter((t) => t.projectId === project?.id),
    [tickets, project?.id],
  );
  const companyContact = useMemo(
    () => contacts.find((c) => c.companyId === project?.companyId),
    [contacts, project?.companyId],
  );
  const remaining = project ? project.budgetHours - project.loggedHours : 0;
  const materialsTotal = project?.materials.reduce((s, m) => s + m.salePrice * m.qty, 0) ?? 0;

  useEffect(() => {
    if (!project) return;
    trackView("project", project.id, project.name);
  }, [project, trackView]);

  if (!project) {
    return (
      <div className="fade-in panel p-6">
        <p className="font-semibold text-[var(--color-navy)]">Project not found</p>
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
        subtitle={`${project.companyName} · ${project.manager} · Due ${formatDisplayDate(project.due)}`}
        actions={
          <>
            <StatusPill tone={statusTone(project.status)}>{project.status}</StatusPill>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setCreateDefaults({ projectId: project.id, companyId: project.companyId });
                setCreateKind("time");
              }}
            >
              Log time
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                const inv = generateProjectInvoice(project.id);
                if (inv) router.push(`/app/billing/view/?id=${inv}`);
              }}
            >
              Generate invoice
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                queueEmail(
                  companyContact?.email ?? "client@example.com",
                  `Update on ${project.name}`,
                  `Progress is ${project.progress}%. Next milestone updates are in the portal.`,
                );
                pushToast(`Email queued to ${companyContact?.email ?? "client"}`);
              }}
            >
              Send email
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => exportProjectPlanPdf(project, ms, projectTasks)}
            >
              Export plan PDF
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => startTransition(() => setTab("Schedule"))}
            >
              Open schedule
            </button>
          </>
        }
      />

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={(t) => startTransition(() => setTab(t))}
      />

      {tab === "Overview" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="panel p-4">
              <h2 className="mb-2 font-semibold text-[var(--color-navy)]">Summary</h2>
              <p className="text-sm text-[var(--color-muted)]">{project.description || "No description yet."}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Budget hrs" value={`${project.budgetHours}h`} />
                <Metric label="Logged" value={`${project.loggedHours}h`} />
                <Metric label="Remaining" value={`${remaining}h`} />
                <Metric label="Margin" value={`${project.marginPct}%`} accent />
              </div>
            </div>
            <div className="panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-[var(--color-navy)]">Next milestones</h2>
                <button type="button" className="btn btn-ghost text-sm" onClick={() => setTab("Schedule")}>
                  Edit in schedule
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Milestone</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ms.slice(0, 4).map((m) => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>{formatDisplayDate(m.due)}</td>
                      <td>
                        <StatusPill tone={statusTone(m.status)}>{m.status}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-4">
            <SideRail title="Quick actions">
              <div className="space-y-2">
                <button type="button" className="btn btn-ghost w-full justify-start" onClick={() => setTab("Schedule")}>
                  + Milestone / task
                </button>
                <button
                  type="button"
                  className="btn btn-ghost w-full justify-start"
                  onClick={() =>
                    updateProject(project.id, {
                      status: project.status === "On Track" ? "At Risk" : "On Track",
                    })
                  }
                >
                  Toggle at-risk
                </button>
                <button
                  type="button"
                  className="btn btn-ghost w-full justify-start text-[var(--color-danger)]"
                  onClick={() => {
                    deleteProject(project.id);
                    router.push("/app/projects");
                  }}
                >
                  Delete project
                </button>
              </div>
            </SideRail>
            <SideRail title="Budget">
              <div className="text-2xl font-semibold tabular-nums text-[var(--color-navy)]">
                {money(project.budgetAmount)}
              </div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">Services + materials sale value</p>
            </SideRail>
          </div>
        </div>
      ) : null}

      {tab === "Schedule" ? (
        <ProjectSchedule
          milestones={ms}
          tasks={projectTasks}
          onAddMilestone={() => createMilestone(project.id, "New milestone", project.due)}
          onAddTask={(milestoneId) =>
            createTask({
              name: "New task",
              projectId: project.id,
              assignee: "J. Kim",
              due: project.due,
              milestoneId,
            })
          }
          onUpdateTask={updateTask}
          onUpdateMilestone={updateMilestone}
          onDeleteTask={deleteTask}
        />
      ) : null}

      {tab === "Files & Notes" ? (
        <FilesNotesPanel
          files={project.files}
          notes={project.notes}
          author={user?.name ?? "Staff"}
          onUpload={(file) => addProjectFile(project.id, file)}
          onDeleteFile={(fileId) => deleteProjectFile(project.id, fileId)}
          onMoveFile={(fileId, folder) => moveProjectFile(project.id, fileId, folder)}
          onAddNote={(body, visibility) =>
            addProjectNote(project.id, { author: user?.name ?? "Staff", body, visibility })
          }
        />
      ) : null}

      {tab === "Billing" ? (
        <div className="space-y-4">
          <div className="panel p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-[var(--color-navy)]">2. Materials</h2>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => addMaterial(project.id, "New material", 500)}
              >
                + Add materials
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Title</th>
                  <th>Qty</th>
                  <th>Purchase</th>
                  <th>Sale</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {project.materials.map((m) => (
                  <tr key={m.id}>
                    <td>{m.item}</td>
                    <td>{m.title}</td>
                    <td>{m.qty}</td>
                    <td className="tabular-nums">{money(m.purchasePrice)}</td>
                    <td className="tabular-nums">{money(m.salePrice)}</td>
                    <td className="tabular-nums">
                      {money(m.salePrice - m.purchasePrice)}
                    </td>
                  </tr>
                ))}
                {!project.materials.length ? (
                  <tr>
                    <td colSpan={6} className="text-[var(--color-muted)]">
                      No materials yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="panel p-4">
            <h2 className="mb-3 font-semibold text-[var(--color-navy)]">3. Totals</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Service items</dt>
                <dd className="tabular-nums font-semibold">{money(project.budgetAmount - materialsTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Materials</dt>
                <dd className="tabular-nums font-semibold">{money(materialsTotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-base">
                <dt>Total</dt>
                <dd className="tabular-nums font-bold text-[var(--color-navy)]">{money(project.budgetAmount)}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => {
                const inv = generateProjectInvoice(project.id);
                if (inv) router.push(`/app/billing/view/?id=${inv}`);
              }}
            >
              Generate invoice
            </button>
          </div>
        </div>
      ) : null}

      {tab === "Tickets" ? (
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projectTickets.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/app/tickets/view/?id=${t.id}`} className="font-medium text-[var(--color-navy)]">
                      #{t.number} {t.subject}
                    </Link>
                  </td>
                  <td>
                    <StatusPill tone={statusTone(t.priority)}>{t.priority}</StatusPill>
                  </td>
                  <td>
                    <StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill>
                  </td>
                </tr>
              ))}
              {!projectTickets.length ? (
                <tr>
                  <td colSpan={3} className="text-[var(--color-muted)]">
                    No tickets linked. Use Create (+) Ticket with this company.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "Signoffs" ? (
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Deliverable</th>
                <th>Due</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ms.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{formatDisplayDate(m.due)}</td>
                  <td>
                    <StatusPill tone={statusTone(m.status)}>{m.status}</StatusPill>
                  </td>
                  <td className="space-x-2 text-right">
                    <button
                      type="button"
                      className="btn btn-ghost text-sm"
                      onClick={() => requestSignoff(project.id, m.name)}
                    >
                      Request
                    </button>
                    {m.status !== "Approved" ? (
                      <button type="button" className="btn btn-primary text-sm" onClick={() => approveSignoff(m.id)}>
                        Approve
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <CreateForms
        key={createKind ?? "closed"}
        kind={createKind}
        defaults={createDefaults}
        onClose={() => setCreateKind(null)}
      />
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
