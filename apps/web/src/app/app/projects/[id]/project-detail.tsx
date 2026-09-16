"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState, type ReactNode } from "react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { FilesNotesPanel } from "@/components/FilesNotesPanel";
import { ActivityStream } from "@/components/records/ActivityStream";
import { composeActivityFeed } from "@/lib/activity";
import { ProjectSchedule } from "@/components/schedule/ProjectSchedule";
import {
  RecordFact,
  RecordMetric,
  RecordRailBlock,
  RecordShell,
  StatusStepper,
  TonePill,
} from "@/components/records/RecordChrome";
import {
  Avatar,
  Field,
  Modal,
  ProgressBar,
  Tabs,
  TextInput,
  TextSelect,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { formatDisplayDate, money } from "@/lib/seed";
import { exportProjectPlanPdf } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";
import type { ProjectStatus } from "@/lib/types";

const TABS = ["Overview", "Plan", "Insights", "Stream", "Files", "Materials", "Expenses", "Billing"];
const STATUS_STEPS: ProjectStatus[] = ["Planned", "On Track", "At Risk", "Completed"];

export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const projects = useAppStore((s) => s.projects);
  const companies = useAppStore((s) => s.companies);
  const milestones = useAppStore((s) => s.milestones);
  const tasks = useAppStore((s) => s.tasks);
  const tickets = useAppStore((s) => s.tickets);
  const contacts = useAppStore((s) => s.contacts);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const expenses = useAppStore((s) => s.expenses);
  const activities = useAppStore((s) => s.activities);
  const allocations = useAppStore((s) => s.allocations);
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
  const createExpense = useAppStore((s) => s.createExpense);
  const approveExpense = useAppStore((s) => s.approveExpense);
  const [tab, setTab] = useState("Overview");
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [createDefaults, setCreateDefaults] = useState<{ projectId?: string; companyId?: string }>({});
  const [editOpen, setEditOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");

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
  const companyContact = useMemo(() => {
    const company = companies.find((c) => c.id === project?.companyId);
    return (
      contacts.find((c) => c.id === company?.primaryContactId) ??
      contacts.find((c) => c.companyId === project?.companyId)
    );
  }, [companies, contacts, project?.companyId]);
  const projectTime = useMemo(
    () => timeEntries.filter((t) => t.projectId === project?.id),
    [timeEntries, project?.id],
  );
  const projectExpenses = useMemo(
    () => expenses.filter((e) => e.projectId === project?.id),
    [expenses, project?.id],
  );
  const projectActivity = useMemo(
    () =>
      project
        ? composeActivityFeed({
            companyId: project.companyId,
            projectId: project.id,
            activities,
            projects,
            tasks,
            timeEntries,
            milestones,
          })
        : [],
    [activities, milestones, project, projects, tasks, timeEntries],
  );
  const team = useMemo(() => {
    const names = new Set<string>();
    projectTasks.forEach((t) => names.add(t.assignee));
    allocations.filter((a) => a.projectId === project?.id).forEach((a) => names.add(a.memberName));
    if (project?.manager) names.add(project.manager);
    return [...names];
  }, [projectTasks, allocations, project?.id, project?.manager]);
  const hoursByTask = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of projectTime) {
      if (!row.taskId) continue;
      map[row.taskId] = (map[row.taskId] ?? 0) + row.hours;
    }
    return map;
  }, [projectTime]);
  const remaining = project ? project.budgetHours - project.loggedHours : 0;
  const materialsTotal = project?.materials.reduce((s, m) => s + m.salePrice * m.qty, 0) ?? 0;
  const earned = project ? Math.round((project.progress / 100) * project.budgetAmount) : 0;
  const filteredTasks = useMemo(
    () =>
      projectTasks.filter((t) => {
        if (statusFilter !== "All" && t.status !== statusFilter) return false;
        if (assigneeFilter !== "All" && t.assignee !== assigneeFilter) return false;
        return true;
      }),
    [projectTasks, statusFilter, assigneeFilter],
  );

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
  const stepValue = STATUS_STEPS.includes(project.status) ? project.status : "On Track";

  return (
    <>
      <RecordShell
        breadcrumb={
          <>
            <Link href="/app/companies">Companies</Link> /{" "}
            <Link href={`/app/companies/view/?id=${project.companyId}`}>{project.companyName}</Link> / {project.name}
          </>
        }
        title={project.name}
        subtitle={
          <>
            <TonePill value={project.status} />
            <span>Due {formatDisplayDate(project.due)}</span>
            <span>{project.projectType}</span>
          </>
        }
        actions={
          <>
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
            <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(true)}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => exportProjectPlanPdf(project, ms, projectTasks)}
            >
              Export
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                queueEmail(
                  companyContact?.email ?? "client@example.com",
                  `Update on ${project.name}`,
                  `Progress is ${project.progress}%.`,
                );
                pushToast(`Email queued to ${companyContact?.email ?? "client"}`);
              }}
            >
              Portal update
            </button>
            <button type="button" className="btn btn-primary" onClick={() => startTransition(() => setTab("Plan"))}>
              Edit plan
            </button>
          </>
        }
        stepper={
          <StatusStepper
            steps={STATUS_STEPS}
            value={stepValue}
            onChange={(next) => updateProject(project.id, { status: next })}
          />
        }
        rail={
          <>
            <RecordRailBlock title="Project details">
              <dl className="space-y-2">
                <RecordFact label="Company">
                  <Link href={`/app/companies/view/?id=${project.companyId}`} className="font-semibold text-[var(--color-navy)]">
                    {project.companyName}
                  </Link>
                </RecordFact>
                {companyContact ? (
                  <RecordFact label="Primary contact">
                    <Link href={`/app/contacts/view/?id=${companyContact.id}`} className="font-semibold text-[var(--color-navy)]">
                      {companyContact.name}
                    </Link>
                  </RecordFact>
                ) : null}
                <RecordFact label="Manager">{project.manager}</RecordFact>
                <RecordFact label="Type">{project.projectType}</RecordFact>
                <RecordFact label="Start">{formatDisplayDate(project.start)}</RecordFact>
                <RecordFact label="Deadline">{formatDisplayDate(project.due)}</RecordFact>
              </dl>
            </RecordRailBlock>
            <RecordRailBlock title="Team">
              <div className="flex flex-wrap gap-2">
                {team.map((name) => (
                  <span key={name} className="inline-flex items-center gap-1 text-sm">
                    <Avatar initials={name.split(" ").map((p) => p[0]).join("").slice(0, 2)} name={name} size={26} />
                    {name}
                  </span>
                ))}
              </div>
            </RecordRailBlock>
            <RecordRailBlock title="Comments">
              <textarea
                className="field-input min-h-20"
                value={comment}
                placeholder="Comment on this project"
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary mt-2 w-full"
                disabled={!comment.trim()}
                onClick={() => {
                  addProjectNote(project.id, { author: user?.name ?? "Staff", body: comment.trim(), visibility: "internal" });
                  setComment("");
                }}
              >
                Save comment
              </button>
            </RecordRailBlock>
            <RecordRailBlock title="Earned value">
              <RecordMetric label="Earned / budget" value={`${money(earned)} / ${money(project.budgetAmount)}`} hint={`${project.progress}% complete`} />
              <ProgressBar value={project.progress} />
            </RecordRailBlock>
            <RecordRailBlock title="Progress">
              <RecordMetric
                label="Hours used"
                value={`${project.loggedHours}h / ${project.budgetHours}h`}
                hint={`${remaining}h remaining · ${project.marginPct}% margin`}
              />
              <ProgressBar value={project.budgetHours ? Math.round((project.loggedHours / project.budgetHours) * 100) : 0} />
            </RecordRailBlock>
          </>
        }
      >
        <Tabs tabs={TABS} active={tab} onChange={(t) => startTransition(() => setTab(t))} />

        {tab === "Overview" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <select className="field-input max-w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {["All", "Not Started", "In Progress", "Review", "Done"].map((s) => (
                  <option key={s} value={s}>
                    Status: {s}
                  </option>
                ))}
              </select>
              <select className="field-input max-w-48" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
                {["All", ...team].map((s) => (
                  <option key={s} value={s}>
                    Assignee: {s}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-ghost" onClick={() => setTab("Plan")}>
                Edit plan
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  createTask({
                    name: "New task",
                    projectId: project.id,
                    assignee: project.manager,
                    due: project.due,
                    milestoneId: phases[0]?.id,
                  })
                }
              >
                Add task
              </button>
            </div>
            <div className="panel overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Milestones and tasks</th>
                    <th>Status</th>
                    <th>Earned value</th>
                    <th>Usage / budget</th>
                    <th>Start</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map((phase) => {
                    const phaseTasks = filteredTasks.filter(
                      (t) => t.milestoneId === phase.id || ms.some((g) => g.parentId === phase.id && g.id === t.milestoneId),
                    );
                    const used = phaseTasks.reduce((sum, t) => sum + (hoursByTask[t.id] ?? 0), 0);
                    const budget = phaseTasks.reduce((sum, t) => sum + t.estimateHours, 0);
                    const progress = phaseTasks.length
                      ? Math.round(phaseTasks.reduce((sum, t) => sum + t.progress, 0) / phaseTasks.length)
                      : 0;
                    return (
                      <PhaseRows key={phase.id}>
                        <tr>
                          <td className="font-semibold">{phase.name}</td>
                          <td>
                            <TonePill value={phase.status} />
                          </td>
                          <td>{progress}%</td>
                          <td className="tabular-nums">
                            {used}h / {budget || 0}h
                          </td>
                          <td>{formatDisplayDate(phase.start)}</td>
                          <td>{formatDisplayDate(phase.due)}</td>
                        </tr>
                        {phaseTasks.map((t) => (
                          <tr key={t.id}>
                            <td className="pl-6">{t.name}</td>
                            <td>
                              <TonePill value={t.status} />
                            </td>
                            <td>{t.progress}%</td>
                            <td className="tabular-nums">
                              {hoursByTask[t.id] ?? 0}h / {t.estimateHours}h
                            </td>
                            <td>{formatDisplayDate(t.start)}</td>
                            <td>{formatDisplayDate(t.due)}</td>
                          </tr>
                        ))}
                      </PhaseRows>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="panel p-5">
              <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Signoffs</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Phase</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {phases.map((m) => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>
                        <TonePill value={m.status} />
                      </td>
                      <td className="space-x-2 text-right">
                        <button type="button" className="btn btn-ghost text-sm" onClick={() => requestSignoff(project.id, m.name)}>
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
            <div className="panel p-5">
              <h2 className="mb-2 font-semibold text-[var(--color-navy)]">Scope</h2>
              <p className="text-sm text-[var(--color-muted)]">{project.description || "No description yet."}</p>
              <Field label="Objectives">
                <textarea
                  className="field-input min-h-20"
                  value={scope.objectives}
                  onChange={(e) => updateProjectScope(project.id, { ...scope, objectives: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {tab === "Plan" ? (
          <ProjectSchedule
            milestones={ms}
            tasks={projectTasks}
            projectFiles={project.files.map((f) => ({ id: f.id, name: f.name }))}
            projectStart={project.start}
            projectDue={project.due}
            hoursByTaskId={hoursByTask}
            onUpdateDates={(start, due) => updateProject(project.id, { start, due })}
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

        {tab === "Insights" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel p-4">
              <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Delivery</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Progress</dt>
                  <dd>{project.progress}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Open tickets</dt>
                  <dd>{projectTickets.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Tasks done</dt>
                  <dd>
                    {projectTasks.filter((t) => t.status === "Done").length} / {projectTasks.length}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="panel p-4">
              <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Financials</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Earned value</dt>
                  <dd>{money(earned)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Expenses</dt>
                  <dd>{money(projectExpenses.reduce((sum, e) => sum + e.amount, 0))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Margin</dt>
                  <dd>{project.marginPct}%</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}

        {tab === "Stream" ? (
          <div className="panel p-4">
            <ActivityStream
              items={projectActivity}
              placeholder="Comment on this project"
              onPost={(text) =>
                addProjectNote(project.id, { author: user?.name ?? "Staff", body: text, visibility: "internal" })
              }
            />
          </div>
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

        {tab === "Materials" || tab === "Billing" ? (
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
            {tab === "Billing" ? (
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
            ) : null}
          </div>
        ) : null}

        {tab === "Expenses" ? (
          <div className="panel overflow-hidden">
            <div className="flex justify-end p-3">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => createExpense({ vendor: "New vendor", projectId: project.id, amount: 100, note: "Project expense" })}
              >
                + Expense
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {projectExpenses.map((e) => (
                  <tr key={e.id}>
                    <td>{e.vendor}</td>
                    <td>{money(e.amount)}</td>
                    <td>{formatDisplayDate(e.date)}</td>
                    <td>
                      <TonePill value={e.status} />
                    </td>
                    <td>
                      {e.status === "Pending" ? (
                        <button type="button" className="btn btn-ghost text-sm" onClick={() => approveExpense(e.id)}>
                          Approve
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!projectExpenses.length ? (
                  <tr>
                    <td colSpan={5} className="text-[var(--color-muted)]">
                      No expenses on this project.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </RecordShell>

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
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              Save changes
            </button>
            <button
              type="button"
              className="btn btn-ghost text-[var(--color-danger)]"
              onClick={() => {
                deleteProject(project.id);
                router.push("/app/projects");
              }}
            >
              Delete
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function PhaseRows({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
