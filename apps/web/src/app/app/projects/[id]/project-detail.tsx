"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState, type ReactNode } from "react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { FilesNotesPanel } from "@/components/FilesNotesPanel";
import { ActivityHoursChart, monthSeries } from "@/components/records/ActivityHoursChart";
import { ActivityList, ActivityStream } from "@/components/records/ActivityStream";
import { composeActivityFeed } from "@/lib/activity";
import { ProjectSchedule } from "@/components/schedule/ProjectSchedule";
import { ProjectLifecycleBar, ProjectStatusHistory } from "@/components/records/ProjectLifecycle";
import {
  RecordFact,
  RecordMetric,
  RecordRailBlock,
  RecordShell,
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
import { computeProjectMetrics, memberRate } from "@/lib/project-workspace";
import { formatDisplayDate, money } from "@/lib/seed";
import { exportProjectPlanPdf } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";
import type { CompanyAssetKind, CompanyAssetStatus, ProjectHealth } from "@/lib/types";

const TABS = [
  "Overview",
  "Schedule",
  "Insights",
  "Tasks",
  "Activity",
  "Attachments",
  "Expenses",
  "Rates",
  "Billing",
  "Assets",
  "Details",
];
const PROJECT_TYPES = ["Client Work", "Internal", "Retainer", "Fixed Fee"];

function activityDate(when: string) {
  if (/today|yesterday/i.test(when)) return "2026-08-05";
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const idx = months.findIndex((m) => when.toLowerCase().includes(m));
  if (idx >= 0) return `2026-${String(idx + 1).padStart(2, "0")}-15`;
  return "2026-08-01";
}

function SectionHead({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="section-title">{title}</h2>
      {action && onAction ? (
        <button type="button" className="text-sm font-semibold text-[var(--color-navy)]" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

function HealthCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: ProjectHealth;
}) {
  const toneClass =
    tone === "Healthy" ? "is-healthy" : tone === "Watch" ? "is-watch" : tone === "Critical" ? "is-critical" : "";
  return (
    <div className={`project-health-card ${toneClass}`}>
      <div className="project-health-value">{value}</div>
      <div className="project-health-label">{label}</div>
      {hint ? <div className="project-health-hint">{hint}</div> : null}
    </div>
  );
}

export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const projects = useAppStore((s) => s.projects);
  const companies = useAppStore((s) => s.companies);
  const companyAssets = useAppStore((s) => s.companyAssets);
  const invoices = useAppStore((s) => s.invoices);
  const milestones = useAppStore((s) => s.milestones);
  const tasks = useAppStore((s) => s.tasks);
  const tickets = useAppStore((s) => s.tickets);
  const contacts = useAppStore((s) => s.contacts);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const expenses = useAppStore((s) => s.expenses);
  const activities = useAppStore((s) => s.activities);
  const allocations = useAppStore((s) => s.allocations);
  const teamMembers = useAppStore((s) => s.team);
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
  const setProjectRate = useAppStore((s) => s.setProjectRate);
  const setProjectStatus = useAppStore((s) => s.setProjectStatus);
  const projectWorkflow = useAppStore((s) => s.projectWorkflow);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const addTaskLink = useAppStore((s) => s.addTaskLink);
  const removeTaskLink = useAppStore((s) => s.removeTaskLink);
  const createExpense = useAppStore((s) => s.createExpense);
  const approveExpense = useAppStore((s) => s.approveExpense);
  const createCompanyAsset = useAppStore((s) => s.createCompanyAsset);
  const deleteCompanyAsset = useAppStore((s) => s.deleteCompanyAsset);
  const [tab, setTab] = useState("Overview");
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [createDefaults, setCreateDefaults] = useState<{ projectId?: string; companyId?: string }>({});
  const [editOpen, setEditOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [rateName, setRateName] = useState("");
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
  const projectInvoices = useMemo(
    () => invoices.filter((i) => i.projectId === project?.id),
    [invoices, project?.id],
  );
  const projectAssets = useMemo(
    () => companyAssets.filter((a) => a.projectId === project?.id),
    [companyAssets, project?.id],
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
    projectTime.forEach((t) => names.add(t.userName));
    project?.rates?.forEach((r) => names.add(r.memberName));
    if (project?.manager) names.add(project.manager);
    return [...names];
  }, [projectTasks, allocations, project?.id, project?.manager, project?.rates, projectTime]);
  const hoursByTask = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of projectTime) {
      if (!row.taskId) continue;
      map[row.taskId] = (map[row.taskId] ?? 0) + row.hours;
    }
    return map;
  }, [projectTime]);
  const hoursByMember = useMemo(() => {
    const map = new Map<string, number>();
    projectTime.forEach((row) => map.set(row.userName, (map.get(row.userName) ?? 0) + row.hours));
    return map;
  }, [projectTime]);
  const metrics = useMemo(
    () =>
      project
        ? computeProjectMetrics({
            project,
            team: teamMembers,
            timeEntries: projectTime,
            expenses: projectExpenses,
            memberNames: team,
          })
        : null,
    [project, teamMembers, projectTime, projectExpenses, team],
  );
  const filteredTasks = useMemo(
    () =>
      projectTasks.filter((t) => {
        if (statusFilter !== "All" && t.status !== statusFilter) return false;
        if (assigneeFilter !== "All" && t.assignee !== assigneeFilter) return false;
        return true;
      }),
    [projectTasks, statusFilter, assigneeFilter],
  );
  const chartPoints = useMemo(
    () =>
      monthSeries([
        ...projectTime.map((t) => ({ date: t.date, hours: t.hours })),
        ...projectActivity.map((a) => ({ date: a.at ? a.at.slice(0, 10) : activityDate(a.when), activity: true })),
      ]),
    [projectTime, projectActivity],
  );
  const openTasks = projectTasks.filter((t) => t.status !== "Done");
  const availableRateNames = teamMembers.filter((m) => m.active && !team.includes(m.name)).map((m) => m.name);

  useEffect(() => {
    if (!project) return;
    trackView("project", project.id, project.name);
  }, [project, trackView]);

  if (!project || !metrics) {
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
  const { remainingHours, earned, actualCost, health, hoursPct, expenseTotal, materialsSale, laborCost, blend } =
    metrics;
  const billed = projectInvoices.reduce((sum, row) => sum + row.amount, 0);

  function goTab(next: string) {
    startTransition(() => setTab(next));
  }

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
            <TonePill value={health} />
            <span>PM {project.manager}</span>
            <span>{project.companyName}</span>
            <span>{project.projectType}</span>
            <span>
              {formatDisplayDate(project.start)} to {formatDisplayDate(project.due)}
            </span>
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
            <button type="button" className="btn btn-primary" onClick={() => goTab("Schedule")}>
              Edit schedule
            </button>
          </>
        }
        stepper={
          <ProjectLifecycleBar
            status={project.status}
            workflow={projectWorkflow}
            role={user?.role}
            onChange={(next) => setProjectStatus(project.id, next)}
          />
        }
        banner={
          <div className="project-health-strip" aria-label="Project health">
            <HealthCard label="Project health" value={<TonePill value={health} />} tone={health} hint={project.status} />
            <HealthCard label="Progress" value={`${project.progress}%`} hint={`${projectTasks.filter((t) => t.status === "Done").length} of ${projectTasks.length} tasks done`} />
            <HealthCard label="Budget" value={money(project.budgetAmount)} hint={`${project.marginPct}% margin`} />
            <HealthCard label="Actual cost" value={money(actualCost)} hint={`${money(laborCost)} labor`} />
            <HealthCard label="Earned value" value={money(earned)} hint={`${project.progress}% of budget`} />
            <HealthCard label="Hours used" value={`${project.loggedHours}h`} hint={`${hoursPct}% of ${project.budgetHours}h`} />
            <HealthCard
              label="Hours remaining"
              value={`${Math.abs(remainingHours)}h`}
              hint={remainingHours >= 0 ? "Left in budget" : "Over hour budget"}
              tone={remainingHours < 0 ? "Critical" : health}
            />
          </div>
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
          </>
        }
      >
        <Tabs tabs={TABS} active={tab} onChange={(t) => goTab(t)} />

        {tab === "Overview" ? (
          <div className="project-overview">
            <div className="panel p-4">
              <SectionHead title="Project summary" action="Edit details" onAction={() => setEditOpen(true)} />
              <p className="text-sm text-[var(--color-muted)]">{project.description || "No description yet."}</p>
              <div className="project-facts mt-3">
                <div>
                  <div className="metric-label">Client</div>
                  <div className="text-sm font-medium">{project.companyName}</div>
                </div>
                <div>
                  <div className="metric-label">Project manager</div>
                  <div className="text-sm font-medium">{project.manager}</div>
                </div>
                <div>
                  <div className="metric-label">Type</div>
                  <div className="text-sm font-medium">{project.projectType}</div>
                </div>
                <div>
                  <div className="metric-label">Window</div>
                  <div className="text-sm font-medium">
                    {formatDisplayDate(project.start)} to {formatDisplayDate(project.due)}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-[var(--color-muted)]">
                    <span>Delivery progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-[var(--color-muted)]">
                    <span>Hours used</span>
                    <span>
                      {project.loggedHours}h / {project.budgetHours}h
                    </span>
                  </div>
                  <ProgressBar value={hoursPct} />
                </div>
              </div>
            </div>

            <div className="company-overview-hero">
              <div className="panel p-4">
                <SectionHead title="Activity vs hours" />
                <ActivityHoursChart points={chartPoints} />
              </div>
              <div className="company-stat-grid">
                <RecordMetric label="Earned value" value={money(earned)} hint={`${project.progress}% complete`} />
                <RecordMetric label="Actual cost" value={money(actualCost)} hint={`${money(metrics.variance)} remaining`} />
                <RecordMetric label="Hours remaining" value={`${remainingHours}h`} hint={`${money(blend)} / hour blended`} />
                <RecordMetric label="Billed" value={money(billed)} hint={`${projectInvoices.length} invoices`} />
              </div>
            </div>

            <div className="company-split">
              <div className="panel p-4">
                <SectionHead title="Schedule" action="Open schedule" onAction={() => goTab("Schedule")} />
                <table className="table">
                  <thead>
                    <tr>
                      <th>Phase</th>
                      <th>Status</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phases.slice(0, 4).map((phase) => (
                      <tr key={phase.id}>
                        <td className="font-medium">{phase.name}</td>
                        <td>
                          <TonePill value={phase.status} />
                        </td>
                        <td>{formatDisplayDate(phase.due)}</td>
                      </tr>
                    ))}
                    {!phases.length ? (
                      <tr>
                        <td colSpan={3} className="text-[var(--color-muted)]">
                          No phases yet. Add them on Schedule.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="panel p-4">
                <SectionHead title="Open tasks" action="See all tasks" onAction={() => goTab("Tasks")} />
                <table className="table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Owner</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openTasks.slice(0, 5).map((t) => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td>{t.assignee}</td>
                        <td>
                          <TonePill value={t.status} />
                        </td>
                      </tr>
                    ))}
                    {!openTasks.length ? (
                      <tr>
                        <td colSpan={3} className="text-[var(--color-muted)]">
                          No open tasks.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="company-split">
              <div className="panel p-4">
                <SectionHead title="Status history" action="Open activity" onAction={() => goTab("Activity")} />
                <ProjectStatusHistory items={project.statusHistory ?? []} />
              </div>
              <div className="panel p-4">
                <SectionHead title="Recent activity" action="Open activity" onAction={() => goTab("Activity")} />
                <ActivityList items={projectActivity.slice(0, 5)} compact />
              </div>
            </div>
            <div className="panel p-4">
              <SectionHead title="Billing snapshot" action="Open billing" onAction={() => goTab("Billing")} />
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt>Budget</dt>
                    <dd className="tabular-nums">{money(project.budgetAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Actual cost</dt>
                    <dd className="tabular-nums">{money(actualCost)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Expenses</dt>
                    <dd className="tabular-nums">{money(expenseTotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Materials</dt>
                    <dd className="tabular-nums">{money(materialsSale)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-[var(--color-border)] pt-2">
                    <dt>Invoiced</dt>
                    <dd className="tabular-nums font-semibold">{money(billed)}</dd>
                  </div>
                </dl>
            </div>
          </div>
        ) : null}

        {tab === "Schedule" ? (
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
                assignee: project.manager,
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
                  <dt>Health</dt>
                  <dd>
                    <TonePill value={health} />
                  </dd>
                </div>
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
                <div className="flex justify-between">
                  <dt>Hours remaining</dt>
                  <dd>{remainingHours}h</dd>
                </div>
              </dl>
            </div>
            <div className="panel p-4">
              <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Financials</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Budget</dt>
                  <dd>{money(project.budgetAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Actual cost</dt>
                  <dd>{money(actualCost)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Earned value</dt>
                  <dd>{money(earned)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Expenses</dt>
                  <dd>{money(expenseTotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Margin</dt>
                  <dd>{project.marginPct}%</dd>
                </div>
              </dl>
            </div>
            <div className="panel p-4 md:col-span-2">
              <SectionHead title="Activity vs hours" />
              <ActivityHoursChart points={chartPoints} />
            </div>
          </div>
        ) : null}

        {tab === "Tasks" ? (
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
              <button type="button" className="btn btn-ghost" onClick={() => goTab("Schedule")}>
                Edit schedule
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
          </div>
        ) : null}

        {tab === "Activity" ? (
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

        {tab === "Attachments" ? (
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

        {tab === "Rates" ? (
          <div className="space-y-4">
            <div className="panel overflow-hidden">
              <div className="flex flex-wrap items-end justify-between gap-2 p-3">
                <p className="text-sm text-[var(--color-muted)]">
                  Blended rate {money(blend)} / hour. Changing a rate updates billable value and actual cost.
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <Field label="Add team rate">
                    <TextSelect name="rateName" value={rateName} onChange={(e) => setRateName(e.target.value)}>
                      <option value="">Select person</option>
                      {availableRateNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </TextSelect>
                  </Field>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!rateName}
                    onClick={() => {
                      const member = teamMembers.find((m) => m.name === rateName);
                      setProjectRate(project.id, rateName, member?.billRate ?? 180);
                      setRateName("");
                    }}
                  >
                    Add rate
                  </button>
                </div>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Role</th>
                    <th>Hours used</th>
                    <th>Hourly rate</th>
                    <th>Billable</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((name) => {
                    const member = teamMembers.find((m) => m.name === name);
                    const rate = memberRate(name, project, teamMembers);
                    const hours = hoursByMember.get(name) ?? 0;
                    return (
                      <tr key={name}>
                        <td className="font-medium">{name}</td>
                        <td>{member?.role ?? "staff"}</td>
                        <td className="tabular-nums">{hours}h</td>
                        <td>
                          <input
                            className="field-input rate-input"
                            type="number"
                            min={0}
                            defaultValue={rate}
                            aria-label={`${name} hourly rate`}
                            onBlur={(e) => {
                              const next = Number(e.target.value);
                              if (!Number.isFinite(next) || next === rate) return;
                              setProjectRate(project.id, name, next);
                            }}
                          />
                        </td>
                        <td className="tabular-nums">{money(Math.round(hours * rate))}</td>
                      </tr>
                    );
                  })}
                  {!team.length ? (
                    <tr>
                      <td colSpan={5} className="text-[var(--color-muted)]">
                        No team rates yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
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
            <div className="panel overflow-hidden">
              <div className="p-4 pb-0">
                <h2 className="font-semibold text-[var(--color-navy)]">Invoices</h2>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projectInvoices.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <Link href={`/app/billing/view/?id=${i.id}`} className="font-medium text-[var(--color-navy)]">
                          {i.number}
                        </Link>
                      </td>
                      <td className="tabular-nums">{money(i.amount)}</td>
                      <td>{formatDisplayDate(i.due)}</td>
                      <td>
                        <TonePill value={i.status} />
                      </td>
                    </tr>
                  ))}
                  {!projectInvoices.length ? (
                    <tr>
                      <td colSpan={4} className="text-[var(--color-muted)]">
                        No invoices on this project yet.
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
                  <dd className="tabular-nums font-semibold">{money(project.budgetAmount - materialsSale)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Materials</dt>
                  <dd className="tabular-nums font-semibold">{money(materialsSale)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Actual cost</dt>
                  <dd className="tabular-nums font-semibold">{money(actualCost)}</dd>
                </div>
                <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-base">
                  <dt>Budget total</dt>
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

        {tab === "Assets" ? (
          <div className="panel overflow-hidden">
            <div className="flex justify-end p-3">
              <button type="button" className="btn btn-primary" onClick={() => setAssetOpen(true)}>
                Add asset
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {projectAssets.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="font-medium">{a.name}</div>
                      {a.note ? <div className="text-xs text-[var(--color-muted)]">{a.note}</div> : null}
                    </td>
                    <td>{a.kind}</td>
                    <td>{a.owner}</td>
                    <td>
                      <TonePill value={a.status} />
                    </td>
                    <td className="text-right">
                      <button type="button" className="btn btn-ghost text-sm" onClick={() => deleteCompanyAsset(a.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {!projectAssets.length ? (
                  <tr>
                    <td colSpan={5} className="text-[var(--color-muted)]">
                      No assets linked to this project.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === "Details" ? (
          <div className="space-y-4">
            <div className="panel p-5">
              <SectionHead title="Description" action="Edit project" onAction={() => setEditOpen(true)} />
              <p className="text-sm text-[var(--color-muted)]">{project.description || "No description yet."}</p>
              <div className="project-facts mt-4">
                <div>
                  <div className="metric-label">Lifecycle</div>
                  <div className="text-sm font-medium">{project.status}</div>
                </div>
                <div>
                  <div className="metric-label">Type</div>
                  <div className="text-sm font-medium">{project.projectType}</div>
                </div>
                <div>
                  <div className="metric-label">Manager</div>
                  <div className="text-sm font-medium">{project.manager}</div>
                </div>
                <div>
                  <div className="metric-label">Start</div>
                  <div className="text-sm font-medium">{formatDisplayDate(project.start)}</div>
                </div>
                <div>
                  <div className="metric-label">Deadline</div>
                  <div className="text-sm font-medium">{formatDisplayDate(project.due)}</div>
                </div>
              </div>
            </div>
            <div className="panel p-5">
              <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Scope</h2>
              <Field label="Objectives">
                <textarea
                  className="field-input min-h-20"
                  value={scope.objectives}
                  onChange={(e) => updateProjectScope(project.id, { ...scope, objectives: e.target.value })}
                />
              </Field>
              <Field label="In scope">
                <textarea
                  className="field-input min-h-20"
                  value={scope.inScope.join("\n")}
                  onChange={(e) => updateProjectScope(project.id, { ...scope, inScope: e.target.value.split("\n") })}
                />
              </Field>
              <Field label="Out of scope">
                <textarea
                  className="field-input min-h-20"
                  value={scope.outOfScope.join("\n")}
                  onChange={(e) => updateProjectScope(project.id, { ...scope, outOfScope: e.target.value.split("\n") })}
                />
              </Field>
              <Field label="Deliverables">
                <textarea
                  className="field-input min-h-20"
                  value={scope.deliverables.join("\n")}
                  onChange={(e) =>
                    updateProjectScope(project.id, { ...scope, deliverables: e.target.value.split("\n") })
                  }
                />
              </Field>
              <Field label="Assumptions">
                <textarea
                  className="field-input min-h-20"
                  value={scope.assumptions.join("\n")}
                  onChange={(e) =>
                    updateProjectScope(project.id, { ...scope, assumptions: e.target.value.split("\n") })
                  }
                />
              </Field>
            </div>
            <div className="panel p-5">
              <SectionHead title="Status history" />
              <ProjectStatusHistory items={project.statusHistory ?? []} />
            </div>
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
              due: String(fd.get("due") || project.due),
              start: String(fd.get("start") || project.start),
              description: String(fd.get("description") || ""),
              projectType: String(fd.get("projectType") || project.projectType),
              budgetHours: Number(fd.get("budgetHours") || project.budgetHours),
              budgetAmount: Number(fd.get("budgetAmount") || project.budgetAmount),
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
          <Field label="Type">
            <TextSelect name="projectType" defaultValue={project.projectType}>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Status">
            <p className="text-sm">
              {project.status}. Change it from the lifecycle control in the header.
            </p>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <TextInput type="date" name="start" defaultValue={project.start} />
            </Field>
            <Field label="Due">
              <TextInput type="date" name="due" defaultValue={project.due} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget hours">
              <TextInput type="number" name="budgetHours" defaultValue={project.budgetHours} />
            </Field>
            <Field label="Budget amount">
              <TextInput type="number" name="budgetAmount" defaultValue={project.budgetAmount} />
            </Field>
          </div>
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

      <Modal open={assetOpen} title="Add asset" onClose={() => setAssetOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("name") || "").trim();
            if (!name) return;
            createCompanyAsset({
              companyId: project.companyId,
              name,
              kind: String(fd.get("kind") || "License") as CompanyAssetKind,
              status: String(fd.get("status") || "Active") as CompanyAssetStatus,
              owner: String(fd.get("owner") || project.manager),
              projectId: project.id,
              note: String(fd.get("note") || ""),
            });
            setAssetOpen(false);
          }}
        >
          <Field label="Name">
            <TextInput name="name" placeholder="Production license" required />
          </Field>
          <Field label="Type">
            <TextSelect name="kind" defaultValue="License">
              {["License", "Hardware", "Subscription", "Environment"].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Status">
            <TextSelect name="status" defaultValue="Active">
              {["Active", "Expiring", "Retired"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Owner">
            <TextInput name="owner" defaultValue={project.manager} />
          </Field>
          <Field label="Note">
            <TextInput name="note" placeholder="Renewal or environment note" />
          </Field>
          <button type="submit" className="btn btn-primary">
            Add asset
          </button>
        </form>
      </Modal>
    </>
  );
}

function PhaseRows({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
