"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { FilesNotesPanel } from "@/components/FilesNotesPanel";
import { ProjectOverviewBoard } from "@/components/projects/ProjectOverviewBoard";
import { ActivityHoursChart, monthSeries } from "@/components/records/ActivityHoursChart";
import { ActivityStream } from "@/components/records/ActivityStream";
import { composeActivityFeed } from "@/lib/activity";
import { ProjectSchedule } from "@/components/schedule/ProjectSchedule";
import { ProjectLifecycleBar } from "@/components/records/ProjectLifecycle";
import { ProjectInsights } from "@/components/records/ProjectInsights";
import { ProjectTeamPanel, ProjectTeamRail } from "@/components/records/ProjectTeamPanel";
import {
  RecordActionButtons,
  RecordFact,
  RecordRailBlock,
  RecordShell,
  TonePill,
} from "@/components/records/RecordChrome";
import {
  Field,
  Modal,
  ProgressBar,
  Tabs,
  TextInput,
  TextSelect,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { computeProjectMetrics, memberRate } from "@/lib/project-workspace";
import { vendorCompanies } from "@/lib/company-kinds";
import { scheduleWindow, sortPlanItems } from "@/lib/project-plan";
import { formatDisplayDate, formatShortDate, money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import { PROJECT_WORKSPACE_TABS, resolveProjectTab } from "@/lib/project-tabs";

const TABS = [...PROJECT_WORKSPACE_TABS];
const PROJECT_TYPES = ["Internal", "Client Work", "Retainer", "Fixed Fee", "Capital / PMO"];

function activityDate(when: string) {
  if (/today|yesterday/i.test(when)) return "2026-08-05";
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const idx = months.findIndex((m) => when.toLowerCase().includes(m));
  if (idx >= 0) return `2026-${String(idx + 1).padStart(2, "0")}-15`;
  return "2026-08-01";
}

export function ProjectDetail({ id, initialTab }: { id: string; initialTab?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const projects = useAppStore((s) => s.projects);
  const companies = useAppStore((s) => s.companies);
  const invoices = useAppStore((s) => s.invoices);
  const milestones = useAppStore((s) => s.milestones);
  const tasks = useAppStore((s) => s.tasks);
  const contacts = useAppStore((s) => s.contacts);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const expenses = useAppStore((s) => s.expenses);
  const activities = useAppStore((s) => s.activities);
  const allocations = useAppStore((s) => s.allocations);
  const teamMembers = useAppStore((s) => s.team);
  const risks = useAppStore((s) => s.risks);
  const createMilestone = useAppStore((s) => s.createMilestone);
  const createTask = useAppStore((s) => s.createTask);
  const reorderTasks = useAppStore((s) => s.reorderTasks);
  const reorderMilestones = useAppStore((s) => s.reorderMilestones);
  const updateTask = useAppStore((s) => s.updateTask);
  const updateMilestone = useAppStore((s) => s.updateMilestone);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const deleteMilestone = useAppStore((s) => s.deleteMilestone);
  const trackView = useAppStore((s) => s.trackView);
  const generateProjectInvoice = useAppStore((s) => s.generateProjectInvoice);
  const pushToast = useAppStore((s) => s.pushToast);
  const addProjectFile = useAppStore((s) => s.addProjectFile);
  const deleteProjectFile = useAppStore((s) => s.deleteProjectFile);
  const moveProjectFile = useAppStore((s) => s.moveProjectFile);
  const linkFileToTask = useAppStore((s) => s.linkFileToTask);
  const addProjectNote = useAppStore((s) => s.addProjectNote);
  const addMaterial = useAppStore((s) => s.addMaterial);
  const updateProject = useAppStore((s) => s.updateProject);
  const setProjectStatus = useAppStore((s) => s.setProjectStatus);
  const projectWorkflow = useAppStore((s) => s.projectWorkflow);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const addTaskLink = useAppStore((s) => s.addTaskLink);
  const removeTaskLink = useAppStore((s) => s.removeTaskLink);
  const createExpense = useAppStore((s) => s.createExpense);
  const approveExpense = useAppStore((s) => s.approveExpense);
  const [tab, setTab] = useState(() => resolveProjectTab(initialTab));
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [createDefaults, setCreateDefaults] = useState<{ projectId?: string; companyId?: string }>({});
  const [editOpen, setEditOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [planQuery, setPlanQuery] = useState("");

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);
  const ms = useMemo(
    () => milestones.filter((m) => m.projectId === project?.id),
    [milestones, project?.id],
  );
  const phases = useMemo(
    () => sortPlanItems(ms.filter((m) => m.kind === "phase" || !m.parentId)),
    [ms],
  );
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === project?.id),
    [tasks, project?.id],
  );
  const companyContact = useMemo(() => {
    const company = companies.find((c) => c.id === project?.companyId);
    return (
      contacts.find((c) => c.id === project?.contactId) ??
      contacts.find((c) => c.id === company?.primaryContactId) ??
      contacts.find((c) => c.companyId === project?.companyId)
    );
  }, [companies, contacts, project?.companyId, project?.contactId]);
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
  const chartPoints = useMemo(
    () =>
      monthSeries([
        ...projectTime.map((t) => ({ date: t.date, hours: t.hours })),
        ...projectActivity.map((a) => ({ date: a.at ? a.at.slice(0, 10) : activityDate(a.when), activity: true })),
      ]),
    [projectTime, projectActivity],
  );
  useEffect(() => {
    setTab(resolveProjectTab(initialTab));
  }, [initialTab]);

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

  const { remainingHours, earned, actualCost, health, hoursPct, expenseTotal, materialsSale } =
    metrics;
  const billed = projectInvoices.reduce((sum, row) => sum + row.amount, 0);
  const windowStats = scheduleWindow(project.start, project.due, new Date().toISOString().slice(0, 10));

  function goTab(next: string) {
    startTransition(() => setTab(resolveProjectTab(next)));
  }

  return (
    <>
      <RecordShell
        wide={tab === "Schedule"}
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
            <span>Owner {project.manager}</span>
            <span>{project.companyName}</span>
            <span>{project.projectType}</span>
            <span>
              {formatDisplayDate(project.start)} to {formatDisplayDate(project.due)}
            </span>
          </>
        }
        actions={
          <RecordActionButtons
            favorite={!!project.favorite}
            onActivity={() => {
              setCreateDefaults({ projectId: project.id, companyId: project.companyId });
              setCreateKind("time");
            }}
            onEdit={() => setEditOpen(true)}
            onPortal={() => {
              pushToast("Portal access is managed on contacts for this company.");
            }}
            onFavorite={() => updateProject(project.id, { favorite: !project.favorite })}
            onNewProject={() => {
              setCreateDefaults({ companyId: project.companyId });
              setCreateKind("project");
            }}
          />
        }
        stepper={
          <ProjectLifecycleBar
            status={project.status}
            workflow={projectWorkflow}
            role={user?.role}
            onChange={(next) => setProjectStatus(project.id, next)}
          />
        }
        rail={
          tab === "Overview" ? (
            <>
              <RecordRailBlock title="Project details">
                <dl className="space-y-2">
                  <RecordFact label="Manager">{project.manager || "Unassigned"}</RecordFact>
                  <RecordFact label="Type">{project.projectType}</RecordFact>
                </dl>
              </RecordRailBlock>
              <RecordRailBlock
                title="Team"
                action={
                  <button type="button" className="text-sm font-semibold text-[var(--color-navy)]" onClick={() => goTab("Team")}>
                    Add
                  </button>
                }
              >
                <ProjectTeamRail projectId={project.id} onManage={() => goTab("Team")} compact />
              </RecordRailBlock>
              <RecordRailBlock title="Comments">
                <textarea
                  className="field-input min-h-20"
                  value={comment}
                  placeholder="Edit here"
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
                <div className="overview-rail-metric">
                  <div className="overview-rail-value">
                    {money(earned)} / {money(project.budgetAmount)}
                  </div>
                  <ProgressBar value={project.progress} />
                  <div className="text-xs text-[var(--color-muted)]">{project.progress}%</div>
                </div>
              </RecordRailBlock>
              <RecordRailBlock title="Progress">
                <div className="overview-rail-metric">
                  <div className="overview-rail-value">
                    {project.loggedHours}h / {project.budgetHours}h
                  </div>
                  <ProgressBar value={hoursPct} />
                  <div className="text-xs text-[var(--color-muted)]">
                    {remainingHours >= 0 ? `${remainingHours}h remaining` : `${Math.abs(remainingHours)}h over`}
                  </div>
                </div>
              </RecordRailBlock>
              <RecordRailBlock title="Schedule">
                <div className="overview-rail-schedule">
                  <div className="flex justify-between gap-2 text-sm font-medium">
                    <span>{formatShortDate(project.start)}</span>
                    <span>{formatShortDate(project.due)}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="overview-rail-stat">{windowStats.elapsed}</div>
                      <div className="text-xs text-[var(--color-muted)]">days elapsed</div>
                    </div>
                    <div>
                      <div className="overview-rail-stat">{windowStats.remaining}</div>
                      <div className="text-xs text-[var(--color-muted)]">days remaining</div>
                    </div>
                    <div>
                      <div className={`overview-rail-stat ${windowStats.over ? "is-over" : ""}`}>{windowStats.over}</div>
                      <div className="text-xs text-[var(--color-muted)]">days over</div>
                    </div>
                  </div>
                </div>
              </RecordRailBlock>
            </>
          ) : (
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
                  {project.requestId ? <RecordFact label="Request">{project.requestId}</RecordFact> : null}
                  {project.location ? <RecordFact label="Location">{project.location}</RecordFact> : null}
                  {project.sponsor ? <RecordFact label="Sponsor">{project.sponsor}</RecordFact> : null}
                  <RecordFact label="Start">{formatDisplayDate(project.start)}</RecordFact>
                  <RecordFact label="Deadline">{formatDisplayDate(project.due)}</RecordFact>
                </dl>
              </RecordRailBlock>
              <RecordRailBlock title="Team">
                <ProjectTeamRail projectId={project.id} onManage={() => goTab("Team")} />
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
          )
        }
      >
        <Tabs tabs={TABS} active={tab} onChange={(t) => goTab(t)} className="record-tabs" />

        {tab === "Overview" ? (
          <ProjectOverviewBoard
            phases={phases}
            milestones={ms}
            tasks={projectTasks}
            hoursByTaskId={hoursByTask}
            team={team}
            statusFilter={statusFilter}
            assigneeFilter={assigneeFilter}
            query={planQuery}
            onStatusFilter={setStatusFilter}
            onAssigneeFilter={setAssigneeFilter}
            onQuery={setPlanQuery}
            onEditPlan={() => goTab("Schedule")}
            onAddTask={() => {
              setCreateDefaults({ projectId: project.id, companyId: project.companyId });
              setCreateKind("task");
            }}
          />
        ) : null}

        {tab === "Team" ? (
          <ProjectTeamPanel projectId={project.id} managerName={project.manager} />
        ) : null}

        {tab === "Schedule" ? (
          <ProjectSchedule
            projectId={project.id}
            projectName={project.name}
            projectStatus={project.status}
            milestones={ms}
            tasks={projectTasks}
            projectFiles={project.files.map((f) => ({ id: f.id, name: f.name }))}
            projectStart={project.start}
            projectDue={project.due}
            hoursByTaskId={hoursByTask}
            assignees={team}
            contractorCompanies={vendorCompanies(companies)}
            rateFor={(name) => memberRate(name, project, teamMembers)}
            onUpdateDates={(start, due) => updateProject(project.id, { start, due })}
            onAddPhase={() => createMilestone(project.id, "New milestone", project.due, { kind: "phase" })}
            onAddGroup={(phaseId) =>
              createMilestone(project.id, "New workstream", project.due, { kind: "group", parentId: phaseId })
            }
            onAddTask={(milestoneId) => {
              const group = ms.find((row) => row.parentId === milestoneId);
              createTask({
                name: "New task",
                projectId: project.id,
                assignee: project.manager,
                due: project.due,
                start: project.start,
                milestoneId: group?.id ?? milestoneId,
              });
            }}
            onAddSubtask={(taskId) => {
              const parent = projectTasks.find((task) => task.id === taskId);
              createTask({
                name: "New subtask",
                projectId: project.id,
                assignee: parent?.assignee ?? project.manager,
                due: parent?.due ?? project.due,
                start: parent?.start ?? project.start,
                milestoneId: parent?.milestoneId,
                parentTaskId: taskId,
                estimateHours: 2,
              });
            }}
            onUpdateTask={updateTask}
            onUpdateMilestone={updateMilestone}
            onDeleteTask={deleteTask}
            onDeleteMilestone={deleteMilestone}
            onReorderTasks={reorderTasks}
            onReorderMilestones={reorderMilestones}
            onAddTaskLink={addTaskLink}
            onRemoveTaskLink={removeTaskLink}
          />
        ) : null}

        {tab === "Insights" ? (
          <div className="space-y-4">
            <ProjectInsights
              project={project}
              tasks={projectTasks}
              milestones={ms}
              timeEntries={projectTime}
              expenses={projectExpenses}
              allocations={allocations}
              team={teamMembers}
              risks={risks}
              memberNames={team}
              onOpenTasks={() => goTab("Schedule")}
              onOpenSchedule={() => goTab("Schedule")}
            />
            <div className="panel p-4">
              <h2 className="section-title">Activity vs hours</h2>
              <ActivityHoursChart points={chartPoints} />
            </div>
          </div>
        ) : null}

        {tab === "Activity" ? (
          <div className="panel p-4">
            <ActivityStream
              items={projectActivity}
              placeholder="Comment on this project"
              mentionPeople={teamMembers.filter((member) => member.active)}
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
              requestId: String(fd.get("requestId") || ""),
              location: String(fd.get("location") || ""),
              deliveryMethod: String(fd.get("deliveryMethod") || ""),
              fundingSource: String(fd.get("fundingSource") || ""),
              sponsor: String(fd.get("sponsor") || ""),
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
          <Field label="Owner">
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
          <Field label="Request ID">
            <TextInput name="requestId" defaultValue={project.requestId ?? ""} />
          </Field>
          <Field label="Location">
            <TextInput name="location" defaultValue={project.location ?? ""} />
          </Field>
          <Field label="Delivery method">
            <TextInput name="deliveryMethod" defaultValue={project.deliveryMethod ?? ""} />
          </Field>
          <Field label="Funding source">
            <TextInput name="fundingSource" defaultValue={project.fundingSource ?? ""} />
          </Field>
          <Field label="Sponsor">
            <TextInput name="sponsor" defaultValue={project.sponsor ?? ""} />
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
