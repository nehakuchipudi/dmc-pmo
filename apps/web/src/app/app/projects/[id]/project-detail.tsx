"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { FilesNotesPanel } from "@/components/FilesNotesPanel";
import { ProjectSchedule } from "@/components/schedule/ProjectSchedule";
import {
  Field,
  Modal,
  PageHeader,
  SideRail,
  StatusPill,
  Tabs,
  TextInput,
  TextSelect,
  statusTone,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { formatDisplayDate, money } from "@/lib/seed";
import { exportProjectPlanPdf } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";
import type { ProjectStatus } from "@/lib/types";

const TABS = ["Overview", "Scope", "Schedule", "Files", "Billing", "Tickets", "Signoffs"];

export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const projects = useAppStore((s) => s.projects);
  const companies = useAppStore((s) => s.companies);
  const milestones = useAppStore((s) => s.milestones);
  const tasks = useAppStore((s) => s.tasks);
  const tickets = useAppStore((s) => s.tickets);
  const contacts = useAppStore((s) => s.contacts);
  const createMilestone = useAppStore((s) => s.createMilestone);
  const createTask = useAppStore((s) => s.createTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const updateMilestone = useAppStore((s) => s.updateMilestone);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const deleteMilestone = useAppStore((s) => s.deleteMilestone);
  const requestSignoff = useAppStore((s) => s.requestSignoff);
  const approveSignoff = useAppStore((s) => s.approveSignoff);
  const trackView = useAppStore((s) => s.trackView);
  const generateProjectInvoice = useAppStore((s) => s.generateProjectInvoice);
  const queueEmail = useAppStore((s) => s.queueEmail);
  const pushToast = useAppStore((s) => s.pushToast);
  const addProjectFile = useAppStore((s) => s.addProjectFile);
  const deleteProjectFile = useAppStore((s) => s.deleteProjectFile);
  const moveProjectFile = useAppStore((s) => s.moveProjectFile);
  const linkFileToTask = useAppStore((s) => s.linkFileToTask);
  const addProjectNote = useAppStore((s) => s.addProjectNote);
  const addMaterial = useAppStore((s) => s.addMaterial);
  const updateProject = useAppStore((s) => s.updateProject);
  const updateProjectScope = useAppStore((s) => s.updateProjectScope);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const addTaskLink = useAppStore((s) => s.addTaskLink);
  const removeTaskLink = useAppStore((s) => s.removeTaskLink);
  const [tab, setTab] = useState("Overview");
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [createDefaults, setCreateDefaults] = useState<{ projectId?: string; companyId?: string }>({});
  const [editOpen, setEditOpen] = useState(false);

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);
  const ms = useMemo(
    () => milestones.filter((m) => m.projectId === project?.id),
    [milestones, project?.id],
  );
  const phases = useMemo(() => ms.filter((m) => m.kind === "phase" || !m.parentId), [ms]);
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

  const scope = project.scope;

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
            <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(true)}>
              Edit project
            </button>
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

      <Tabs tabs={TABS} active={tab} onChange={(t) => startTransition(() => setTab(t))} />

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
                <h2 className="font-semibold text-[var(--color-navy)]">Phases</h2>
                <button type="button" className="btn btn-ghost text-sm" onClick={() => setTab("Schedule")}>
                  Edit in schedule
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Phase</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.slice(0, 6).map((m) => (
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
                <button type="button" className="btn btn-ghost w-full justify-start" onClick={() => setEditOpen(true)}>
                  Edit project
                </button>
                <button type="button" className="btn btn-ghost w-full justify-start" onClick={() => setTab("Scope")}>
                  Edit scope
                </button>
                <button type="button" className="btn btn-ghost w-full justify-start" onClick={() => setTab("Schedule")}>
                  + Phase / workstream / task
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

      {tab === "Scope" ? (
        <div className="panel p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-[var(--color-navy)]">Project scope</h2>
              <p className="text-sm text-[var(--color-muted)]">Objectives, boundaries, and deliverables.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                updateProjectScope(project.id, scope);
                pushToast("Scope saved");
              }}
            >
              Save scope
            </button>
          </div>
          <Field label="Objectives">
            <textarea
              className="field-input min-h-24"
              value={scope.objectives}
              onChange={(e) => updateProjectScope(project.id, { ...scope, objectives: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <ScopeList
              title="In scope"
              items={scope.inScope}
              onChange={(items) => updateProjectScope(project.id, { ...scope, inScope: items })}
            />
            <ScopeList
              title="Out of scope"
              items={scope.outOfScope}
              onChange={(items) => updateProjectScope(project.id, { ...scope, outOfScope: items })}
            />
            <ScopeList
              title="Deliverables"
              items={scope.deliverables}
              onChange={(items) => updateProjectScope(project.id, { ...scope, deliverables: items })}
            />
            <ScopeList
              title="Assumptions"
              items={scope.assumptions}
              onChange={(items) => updateProjectScope(project.id, { ...scope, assumptions: items })}
            />
          </div>
        </div>
      ) : null}

      {tab === "Schedule" ? (
        <ProjectSchedule
          milestones={ms}
          tasks={projectTasks}
          projectFiles={project.files.map((f) => ({ id: f.id, name: f.name }))}
          onAddPhase={() => createMilestone(project.id, "New phase", project.due, { kind: "phase" })}
          onAddGroup={(phaseId) =>
            createMilestone(project.id, "New workstream", project.due, { kind: "group", parentId: phaseId })
          }
          onAddTask={(groupId) =>
            createTask({
              name: "New task",
              projectId: project.id,
              assignee: "J. Kim",
              due: project.due,
              milestoneId: groupId,
            })
          }
          onUpdateTask={updateTask}
          onUpdateMilestone={updateMilestone}
          onDeleteTask={deleteTask}
          onDeleteMilestone={deleteMilestone}
          onAddTaskLink={addTaskLink}
          onRemoveTaskLink={removeTaskLink}
        />
      ) : null}

      {tab === "Files" ? (
        <FilesNotesPanel
          files={project.files}
          notes={project.notes}
          tasks={projectTasks}
          author={user?.name ?? "Staff"}
          onUpload={(file) => addProjectFile(project.id, file)}
          onDeleteFile={(fileId) => deleteProjectFile(project.id, fileId)}
          onMoveFile={(fileId, folder) => moveProjectFile(project.id, fileId, folder)}
          onLinkFileToTask={(fileId, taskId) => linkFileToTask(project.id, fileId, taskId)}
          onAddNote={(body, visibility) =>
            addProjectNote(project.id, { author: user?.name ?? "Staff", body, visibility })
          }
        />
      ) : null}

      {tab === "Billing" ? (
        <div className="space-y-4">
          <div className="panel p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-[var(--color-navy)]">Materials</h2>
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
                    <td className="tabular-nums">{money(m.salePrice - m.purchasePrice)}</td>
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
            <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Totals</h2>
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
          <div className="flex justify-end p-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setCreateDefaults({ projectId: project.id, companyId: project.companyId });
                setCreateKind("ticket");
              }}
            >
              + Ticket
            </button>
          </div>
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
                    No tickets linked.
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
                <th>Phase / workstream</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ms
                .filter((m) => m.kind === "phase" || !m.parentId)
                .map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>
                      <StatusPill tone={statusTone(m.status)}>{m.status}</StatusPill>
                    </td>
                    <td className="space-x-2">
                      <button
                        type="button"
                        className="btn btn-ghost text-sm"
                        onClick={() => requestSignoff(project.id, m.name)}
                      >
                        Request
                      </button>
                      {user?.role === "admin" || user?.role === "pm" ? (
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
        kind={createKind}
        defaults={createDefaults}
        onClose={() => {
          setCreateKind(null);
          setCreateDefaults({});
        }}
      />

      <Modal open={editOpen} title="Edit project" onClose={() => setEditOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const companyId = String(fd.get("companyId") || project.companyId);
            updateProject(project.id, {
              name: String(fd.get("name") || project.name),
              manager: String(fd.get("manager") || project.manager),
              status: String(fd.get("status") || project.status) as ProjectStatus,
              due: String(fd.get("due") || project.due),
              start: String(fd.get("start") || project.start),
              description: String(fd.get("description") || ""),
              budgetHours: Number(fd.get("budgetHours") || project.budgetHours),
              companyId,
              companyName: companies.find((c) => c.id === companyId)?.name ?? project.companyName,
            });
            setEditOpen(false);
          }}
        >
          <Field label="Name">
            <TextInput name="name" defaultValue={project.name} />
          </Field>
          <Field label="Company">
            <TextSelect name="companyId" defaultValue={project.companyId}>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Manager">
            <TextInput name="manager" defaultValue={project.manager} />
          </Field>
          <Field label="Status">
            <TextSelect name="status" defaultValue={project.status}>
              {["Planned", "On Track", "At Risk", "Overdue", "Completed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </TextSelect>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <TextInput type="date" name="start" defaultValue={project.start} />
            </Field>
            <Field label="Due">
              <TextInput type="date" name="due" defaultValue={project.due} />
            </Field>
          </div>
          <Field label="Budget hours">
            <TextInput type="number" name="budgetHours" defaultValue={project.budgetHours} />
          </Field>
          <Field label="Description">
            <TextInput name="description" defaultValue={project.description} />
          </Field>
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
        </form>
      </Modal>
    </div>
  );
}

function ScopeList({
  title,
  items,
  onChange,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <Field label={title}>
      <textarea
        className="field-input min-h-28"
        value={items.join("\n")}
        placeholder="One item per line"
        onChange={(e) => onChange(splitLines(e.target.value))}
      />
    </Field>
  );
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
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
