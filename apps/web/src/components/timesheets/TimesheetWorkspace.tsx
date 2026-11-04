"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Clock3, Eye, EyeOff, MoreHorizontal, Plus, Timer } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { TimesheetActivityModal } from "@/components/timesheets/TimesheetActivityModal";
import {
  TimesheetToolbar,
  type ObjectTypeId,
  type WorkTypeId,
} from "@/components/timesheets/TimesheetToolbar";
import { ConfirmModal, PageHeader, StatusPill, Tabs, TextInput, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { exportCsv } from "@/lib/pdf";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import type { TimeEntry, TimesheetWorkKind } from "@/lib/types";
import {
  addDays,
  entryWindow,
  formatClock,
  formatClockHours,
  formatDuration,
  formatLongDay,
  formatWeekRange,
  formatWeekday,
  overviewByCompany,
  startOfWeek,
  todayIso,
  weekDays,
  weekMatrix,
} from "@/lib/timesheet";
import {
  searchTimesheetWork,
  timerClock,
  workFromEntry,
  type TimesheetWork,
} from "@/lib/timesheet-work";

const VIEW_TABS = ["Overview", "Daily", "Weekly"] as const;
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

type ViewTab = (typeof VIEW_TABS)[number];

function isViewTab(value: string | null): value is ViewTab {
  return value === "Overview" || value === "Daily" || value === "Weekly";
}

function kindLabel(kind: TimesheetWorkKind) {
  if (kind === "phase") return "Phase";
  if (kind === "task") return "Task";
  if (kind === "subtask") return "Subtask";
  return "Project";
}

function entryMatchesWorkTypes(entry: TimeEntry, types: Set<WorkTypeId>) {
  if (!types.size) return true;
  if (types.has("logged") && entry.hours > 0) return true;
  if (types.has("client") && entry.billable) return true;
  if (types.has("internal") && !entry.billable) return true;
  if (types.has("scheduled") || types.has("committed")) return true;
  return false;
}

function rowMatchesWorkTypes(
  row: { key: string; total: number },
  work: TimesheetWork | undefined,
  weekEntries: TimeEntry[],
  types: Set<WorkTypeId>,
  tasks: { id: string; status: string }[],
) {
  if (!types.size) return true;
  const related = weekEntries.filter((entry) => {
    if (!work) return false;
    return (
      (work.taskId && entry.taskId === work.taskId) ||
      (!work.taskId && work.milestoneId && entry.milestoneId === work.milestoneId && !entry.taskId) ||
      (!work.taskId && !work.milestoneId && entry.projectId === work.projectId && !entry.taskId && !entry.milestoneId)
    );
  });
  const task = work?.taskId ? tasks.find((item) => item.id === work.taskId) : undefined;
  if (types.has("logged") && row.total > 0) return true;
  if (types.has("no-time") && row.total === 0) return true;
  if (types.has("client") && related.some((entry) => entry.billable)) return true;
  if (types.has("internal") && related.some((entry) => !entry.billable)) return true;
  if (types.has("scheduled") && (work?.kind === "task" || work?.kind === "phase" || work?.kind === "subtask")) return true;
  if (types.has("committed") && (task?.status === "In Progress" || task?.status === "Review")) return true;
  return false;
}

export function TimesheetWorkspace() {
  const { user, can } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const entries = useAppStore((s) => s.timeEntries);
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const milestones = useAppStore((s) => s.milestones);
  const team = useAppStore((s) => s.team);
  const submit = useAppStore((s) => s.submitTimeEntry);
  const approve = useAppStore((s) => s.approveTimeEntry);
  const reject = useAppStore((s) => s.rejectTimeEntry);
  const deleteTimeEntry = useAppStore((s) => s.deleteTimeEntry);
  const timers = useAppStore((s) => s.timeTimers);
  const showTimers = useAppStore((s) => s.showTimeTimers);
  const startTimer = useAppStore((s) => s.startTimeTimer);
  const stopTimer = useAppStore((s) => s.stopTimeTimer);
  const setShowTimers = useAppStore((s) => s.setShowTimeTimers);
  const initialView = searchParams.get("view");
  const [view, setView] = useState<ViewTab>(isViewTab(initialView) ? initialView : "Overview");
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [day, setDay] = useState(todayIso());
  const [weekStart, setWeekStart] = useState(startOfWeek(todayIso()));
  const [reportPerson, setReportPerson] = useState("All");
  const [sheetPerson, setSheetPerson] = useState(user?.name ?? "All");
  const [rangeStart, setRangeStart] = useState(startOfWeek(todayIso()));
  const [rangeEnd, setRangeEnd] = useState(addDays(startOfWeek(todayIso()), 6));
  const [billableOnly, setBillableOnly] = useState(false);
  const [loggedOnly, setLoggedOnly] = useState(true);
  const [openCompanies, setOpenCompanies] = useState<Record<string, boolean>>({});
  const [dailyMode, setDailyMode] = useState<"Timeline" | "Grouped">("Timeline");
  const [workTypes, setWorkTypes] = useState<Set<WorkTypeId>>(new Set());
  const [objectTypes, setObjectTypes] = useState<Set<ObjectTypeId>>(new Set());
  const [search, setSearch] = useState("");
  const [horizon, setHorizon] = useState(7);
  const [logDefaults, setLogDefaults] = useState<{
    projectId?: string;
    milestoneId?: string;
    taskId?: string;
    workKind?: TimesheetWorkKind;
    date?: string;
    hours?: number;
    start?: string;
  }>({});
  const [myWorkFilter, setMyWorkFilter] = useState<"Committed" | "Overdue" | "All">("Committed");
  const [pinnedWork, setPinnedWork] = useState<TimesheetWork[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [activity, setActivity] = useState<{ work: TimesheetWork; date: string; add?: boolean } | null>(null);
  const [now, setNow] = useState(Date.now());

  const canApprove = can("approve_time");
  const staffOnly = user?.role === "staff";
  const people = useMemo(() => {
    const names = new Set(team.filter((m) => m.active).map((m) => m.name));
    entries.forEach((entry) => names.add(entry.userName));
    return ["All", ...[...names].sort()];
  }, [team, entries]);

  useEffect(() => {
    const next = searchParams.get("view");
    if (isViewTab(next)) setView(next);
  }, [searchParams]);

  useEffect(() => {
    if (!timers.length) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timers.length]);

  const scoped = useMemo(() => {
    return entries
      .filter((entry) => (staffOnly ? entry.userName === user?.name || entry.userName === "J. Kim" : true))
      .filter((entry) => {
        const who = view === "Overview" ? reportPerson : sheetPerson;
        return who === "All" ? true : entry.userName === who;
      })
      .filter((entry) => (billableOnly ? entry.billable : true))
      .filter((entry) => entryMatchesWorkTypes(entry, workTypes))
      .sort((a, b) => a.start?.localeCompare(b.start ?? "") || b.date.localeCompare(a.date));
  }, [entries, staffOnly, user?.name, reportPerson, sheetPerson, view, billableOnly, workTypes]);

  const overviewEntries = scoped.filter((entry) => entry.date >= rangeStart && entry.date <= rangeEnd);
  const report = overviewByCompany(overviewEntries, projects, team);
  const reportTotals = report.reduce(
    (sum, row) => ({
      activities: sum.activities + row.activities,
      nonbillable: sum.nonbillable + row.nonbillable,
      billable: sum.billable + row.billable,
      total: sum.total + row.total,
      amount: sum.amount + row.amount,
      cost: sum.cost + row.cost,
    }),
    { activities: 0, nonbillable: 0, billable: 0, total: 0, amount: 0, cost: 0 },
  );

  const dayEntries = scoped.filter((entry) => entry.date === day);
  const dayBillable = dayEntries.filter((entry) => entry.billable).reduce((sum, entry) => sum + entry.hours, 0);
  const dayNonbillable = dayEntries.filter((entry) => !entry.billable).reduce((sum, entry) => sum + entry.hours, 0);
  const dayTotal = dayBillable + dayNonbillable;
  const weekEnd = addDays(weekStart, 6);
  const weekEntries = scoped.filter((entry) => entry.date >= weekStart && entry.date <= weekEnd);
  const workByKey = useMemo(() => {
    const map = new Map<string, TimesheetWork>();
    for (const entry of weekEntries) {
      const work = workFromEntry(entry, projects, tasks, milestones);
      map.set(work.key, work);
    }
    for (const pin of pinnedWork) map.set(pin.key, pin);
    return map;
  }, [weekEntries, projects, tasks, milestones, pinnedWork]);
  const matrix = weekMatrix(weekEntries, weekStart, (entry) => workFromEntry(entry, projects, tasks, milestones).key);
  const weekRows = [
    ...matrix.rows,
    ...pinnedWork
      .filter((work) => !matrix.rows.some((row) => row.key === work.key))
      .map((work) => ({ key: work.key, cells: [0, 0, 0, 0, 0, 0, 0], total: 0 })),
  ];
  const visibleRows = weekRows.filter((row) => {
    const work = workByKey.get(row.key);
    if (objectTypes.size && work && !objectTypes.has(work.kind)) return false;
    return rowMatchesWorkTypes(row, work, weekEntries, workTypes, tasks);
  });
  const workHits = useMemo(
    () =>
      searchTimesheetWork({
        query: search,
        objectType: objectTypes.size ? [...objectTypes] : "All",
        projects,
        tasks,
        milestones,
      }),
    [search, objectTypes, projects, tasks, milestones],
  );

  const selectedPerson = sheetPerson === "All" ? user?.name : sheetPerson;
  const myTasks = tasks.filter((task) => {
    if (selectedPerson && task.assignee !== selectedPerson) return false;
    if (task.status === "Done") return false;
    if (myWorkFilter === "Overdue") return task.due < todayIso();
    if (myWorkFilter === "Committed") return task.status === "In Progress" || task.status === "Review";
    return true;
  });

  function changeView(next: ViewTab) {
    setView(next);
    setMoreOpen(false);
    router.replace(`/app/timesheets/?view=${next}`);
  }

  function openActivity(work: TimesheetWork, date: string, add?: boolean) {
    setActivity({ work, date, add });
    setMoreOpen(false);
  }

  function openLog(next?: {
    projectId?: string;
    milestoneId?: string;
    taskId?: string;
    workKind?: TimesheetWorkKind;
    date?: string;
    hours?: number;
    start?: string;
  }) {
    setLogDefaults(next ?? { date: view === "Weekly" ? weekStart : day });
    setCreateKind("time");
    setMoreOpen(false);
  }

  function pinWork(work: TimesheetWork) {
    setPinnedWork((current) => (current.some((item) => item.key === work.key) ? current : [...current, work]));
    setSearch("");
  }

  function startOnWork(work: TimesheetWork) {
    startTimer({
      projectId: work.projectId,
      projectName: work.projectName,
      milestoneId: work.milestoneId,
      milestoneName: work.milestoneName,
      taskId: work.taskId,
      taskName: work.taskName,
      workKind: work.kind,
      label: work.label,
    });
    pinWork(work);
  }

  function startBlankTimer() {
    const project = projects[0];
    if (!project) return;
    startTimer({
      projectId: project.id,
      projectName: project.name,
      workKind: "project",
      label: project.name,
    });
    setMoreOpen(false);
  }

  function refreshSheet() {
    const today = todayIso();
    setDay(today);
    setWeekStart(startOfWeek(today));
    setRangeStart(startOfWeek(today));
    setRangeEnd(addDays(startOfWeek(today), 6));
    setWorkTypes(new Set());
    setObjectTypes(new Set());
    setReportPerson("All");
    setSheetPerson(user?.name ?? "All");
    setSearch("");
  }

  function toggleWorkType(id: WorkTypeId) {
    setWorkTypes((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleObjectType(id: ObjectTypeId) {
    setObjectTypes((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function finishTimer(id: string) {
    const timer = stopTimer(id);
    if (!timer) return;
    openLog({
      projectId: timer.projectId,
      milestoneId: timer.milestoneId,
      taskId: timer.taskId,
      workKind: timer.workKind,
      date: view === "Weekly" ? weekStart : day,
      hours: timerClock(timer.startedAt).hours,
    });
  }

  if (!user) return null;

  return (
    <div className="fade-in">
      <PageHeader
        title={view === "Overview" ? "Timesheet overview" : view === "Daily" ? "Daily timesheet" : "Weekly timesheet"}
        subtitle="Search work, click a day to log or edit, and keep extra tools in the menu."
        actions={
          <div className="ts-header-actions">
            <div className="ts-more" onMouseEnter={() => setMoreOpen(true)} onMouseLeave={() => setMoreOpen(false)}>
              <button
                type="button"
                className="icon-btn"
                aria-label="More timesheet actions"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((open) => !open)}
              >
                <MoreHorizontal size={18} />
              </button>
              {moreOpen ? (
                <div className="menu-popover ts-more-popover fade-in">
                  <button type="button" className="menu-row" onClick={() => openLog({ date: view === "Weekly" ? weekStart : day })}>
                    Log time
                  </button>
                  <button type="button" className="menu-row" onClick={startBlankTimer}>
                    <Timer size={15} /> Create timer
                  </button>
                  <button type="button" className="menu-row" onClick={() => { setShowTimers(!showTimers); setMoreOpen(false); }}>
                    {showTimers ? <EyeOff size={15} /> : <Eye size={15} />}
                    {showTimers ? "Hide timers" : "Show timers"}
                  </button>
                  <div className="menu-heading">Views</div>
                  {VIEW_TABS.map((tab) => (
                    <button key={tab} type="button" className="menu-row" onClick={() => changeView(tab)}>
                      {tab}
                    </button>
                  ))}
                  {view === "Overview" ? (
                    <>
                      <div className="menu-heading">Report</div>
                      <label className="menu-row">
                        <input type="checkbox" checked={loggedOnly} onChange={(e) => setLoggedOnly(e.target.checked)} />
                        Logged time only
                      </label>
                      <label className="menu-row">
                        <input type="checkbox" checked={billableOnly} onChange={(e) => setBillableOnly(e.target.checked)} />
                        Billable only
                      </label>
                      <button
                        type="button"
                        className="menu-row"
                        onClick={() => {
                          exportCsv(
                            "timesheet-overview.csv",
                            report.flatMap((company) =>
                              company.projects.map((project) => ({
                                company: company.companyName,
                                project: project.projectName,
                                activities: project.activities,
                                nonbillable: project.nonbillable,
                                billable: project.billable,
                                total: project.total,
                                amount: project.amount,
                                cost: project.cost,
                              })),
                            ),
                          );
                          setMoreOpen(false);
                        }}
                      >
                        Export
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        }
      />
      <Tabs tabs={[...VIEW_TABS]} active={view} onChange={(tab) => changeView(tab as ViewTab)} />

      {showTimers && timers.length ? (
        <ul className="ts-timer-strip">
          {timers.map((timer) => (
            <li key={timer.id}>
              <button type="button" className="ts-timer-chip" onClick={() => finishTimer(timer.id)}>
                <Clock3 size={14} />
                <span>{timer.label}</span>
                <strong>{timerClock(timer.startedAt, now).label}</strong>
                Stop and log
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {view === "Overview" ? (
        <section>
          <TimesheetToolbar
            people={people}
            team={team}
            person={reportPerson}
            onPerson={setReportPerson}
            workTypes={workTypes}
            onToggleWorkType={toggleWorkType}
            objectTypes={objectTypes}
            onToggleObjectType={toggleObjectType}
            onRefresh={refreshSheet}
            onAddTime={() => openLog({ date: rangeStart })}
            rangeLabel={`${formatWeekRange(rangeStart)} · ${formatDuration(reportTotals.total)}`}
            onPrev={() => {
              setRangeStart(addDays(rangeStart, -7));
              setRangeEnd(addDays(rangeEnd, -7));
            }}
            onNext={() => {
              setRangeStart(addDays(rangeStart, 7));
              setRangeEnd(addDays(rangeEnd, 7));
            }}
            prevLabel="Previous range"
            nextLabel="Next range"
          />
          <div className="panel overflow-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Work logged against</th>
                  <th># Activities</th>
                  <th>Non-billable</th>
                  <th>Billable</th>
                  <th>Total</th>
                  <th>Amount</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {report
                  .filter((row) => (loggedOnly ? row.total > 0 : true))
                  .map((company) => {
                    const open = openCompanies[company.companyId] ?? true;
                    return (
                      <Fragment key={company.companyId}>
                        <tr>
                          <td>
                            <button
                              type="button"
                              className="ts-expand"
                              onClick={() => setOpenCompanies((current) => ({ ...current, [company.companyId]: !open }))}
                            >
                              <ChevronDown size={14} className={open ? "" : "ts-rotate"} />
                              {company.companyName}
                            </button>
                          </td>
                          <td>{company.activities}</td>
                          <td className="tabular-nums">{formatDuration(company.nonbillable)}</td>
                          <td className="tabular-nums">{formatDuration(company.billable)}</td>
                          <td>
                            <div className="ts-total-cell">
                              <span className="tabular-nums">{formatDuration(company.total)}</span>
                              <span className="ts-overview-bar" aria-hidden>
                                <span style={{ width: `${company.total ? (company.billable / company.total) * 100 : 0}%` }} />
                              </span>
                            </div>
                          </td>
                          <td className="tabular-nums">{money(company.amount)}</td>
                          <td className="tabular-nums">{money(company.cost)}</td>
                        </tr>
                        {open
                          ? company.projects.map((project) => (
                              <tr key={project.projectId} className="ts-child">
                                <td>{project.projectName}</td>
                                <td>{project.activities}</td>
                                <td className="tabular-nums">{formatDuration(project.nonbillable)}</td>
                                <td className="tabular-nums">{formatDuration(project.billable)}</td>
                                <td className="tabular-nums">{formatDuration(project.total)}</td>
                                <td className="tabular-nums">{money(project.amount)}</td>
                                <td className="tabular-nums">{money(project.cost)}</td>
                              </tr>
                            ))
                          : null}
                      </Fragment>
                    );
                  })}
                <tr>
                  <td className="font-semibold">Total</td>
                  <td className="font-semibold">{reportTotals.activities}</td>
                  <td className="font-semibold tabular-nums">{formatDuration(reportTotals.nonbillable)}</td>
                  <td className="font-semibold tabular-nums">{formatDuration(reportTotals.billable)}</td>
                  <td className="font-semibold tabular-nums">{formatDuration(reportTotals.total)}</td>
                  <td className="font-semibold tabular-nums">{money(reportTotals.amount)}</td>
                  <td className="font-semibold tabular-nums">{money(reportTotals.cost)}</td>
                </tr>
              </tbody>
            </table>
            {!report.length ? <p className="p-6 text-sm text-[var(--color-muted)]">No time in this range.</p> : null}
          </div>
        </section>
      ) : null}

      {view === "Daily" ? (
        <section>
          <TimesheetToolbar
            people={people}
            team={team}
            person={sheetPerson}
            onPerson={setSheetPerson}
            workTypes={workTypes}
            onToggleWorkType={toggleWorkType}
            objectTypes={objectTypes}
            onToggleObjectType={toggleObjectType}
            onRefresh={refreshSheet}
            onAddTime={() => openLog({ date: day })}
            rangeLabel={`${formatLongDay(day)} · ${formatDuration(dayTotal)}`}
            onPrev={() => setDay(addDays(day, -1))}
            onNext={() => setDay(addDays(day, 1))}
            prevLabel="Previous day"
            nextLabel="Next day"
            jumpLabel="Weekly timesheet"
            onJump={() => changeView("Weekly")}
          />
          <div className="panel ts-timeline-panel">
            <div className="ts-timeline">
              <button type="button" className="btn btn-ghost" onClick={() => setHorizon((h) => Math.max(5, h - 2))}>
                Earlier
              </button>
              <div>
                <div className="ts-hour-marks">
                  {HOURS.filter((hour) => hour >= horizon && hour <= horizon + 11).map((hour) => (
                    <span key={hour}>{hour > 12 ? `${hour - 12}pm` : hour === 12 ? "12pm" : `${hour}am`}</span>
                  ))}
                </div>
                <div className="ts-timeline-track">
                  {dayEntries.map((entry) => {
                    const window = entryWindow(entry);
                    const startHour = horizon * 60;
                    const span = 11 * 60;
                    const left = ((window.start - startHour) / span) * 100;
                    const width = ((window.end - window.start) / span) * 100;
                    if (window.end < startHour || window.start > startHour + span) return null;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className={entry.billable ? "ts-block" : "ts-block is-internal"}
                        style={{ left: `${Math.max(left, 0)}%`, width: `${Math.max(width, 1.8)}%` }}
                        title={`${entry.note || entry.taskName || entry.milestoneName || entry.projectName} ${formatDuration(entry.hours)}`}
                      />
                    );
                  })}
                </div>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setHorizon((h) => Math.min(10, h + 2))}>
                Later
              </button>
            </div>
          </div>
          <div className="ts-toolbar">
            <div className="ts-toolbar-group">
              <button type="button" className={dailyMode === "Timeline" ? "filter-chip active" : "filter-chip"} onClick={() => setDailyMode("Timeline")}>
                Timeline
              </button>
              <button type="button" className={dailyMode === "Grouped" ? "filter-chip active" : "filter-chip"} onClick={() => setDailyMode("Grouped")}>
                Grouped
              </button>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="panel ts-day-list">
              {dailyMode === "Grouped"
                ? Object.entries(
                    dayEntries.reduce<Record<string, typeof dayEntries>>((acc, entry) => {
                      const work = workFromEntry(entry, projects, tasks, milestones);
                      acc[work.label] = acc[work.label] ?? [];
                      acc[work.label].push(entry);
                      return acc;
                    }, {}),
                  ).map(([label, rows]) => (
                    <div key={label} className="ts-group">
                      <h3>{label}</h3>
                      {rows.map((entry) => (
                        <DailyCard
                          key={entry.id}
                          entry={entry}
                          userName={user.name}
                          staffOnly={staffOnly}
                          canApprove={canApprove}
                          onOpen={() => openActivity(workFromEntry(entry, projects, tasks, milestones), entry.date)}
                          onSubmit={submit}
                          onApprove={approve}
                          onReject={reject}
                          onDelete={deleteTimeEntry}
                        />
                      ))}
                    </div>
                  ))
                : dayEntries.map((entry) => (
                    <DailyCard
                      key={entry.id}
                      entry={entry}
                      userName={user.name}
                      staffOnly={staffOnly}
                      canApprove={canApprove}
                      onOpen={() => openActivity(workFromEntry(entry, projects, tasks, milestones), entry.date)}
                      onSubmit={submit}
                      onApprove={approve}
                      onReject={reject}
                      onDelete={deleteTimeEntry}
                    />
                  ))}
              {!dayEntries.length ? <p className="p-6 text-sm text-[var(--color-muted)]">No time on this day yet.</p> : null}
            </div>
            <aside className="panel p-4">
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-navy)]">My work</h3>
              <div className="mb-3 flex flex-wrap gap-2">
                {(["Committed", "Overdue", "All"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={myWorkFilter === item ? "filter-chip active" : "filter-chip"}
                    onClick={() => setMyWorkFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <ul className="space-y-2 text-sm">
                {myTasks.slice(0, 8).map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      className="ts-work-item"
                      onClick={() =>
                        openActivity(
                          workFromEntry(
                            {
                              id: task.id,
                              userName: user.name,
                              projectId: task.projectId,
                              projectName: task.projectName,
                              milestoneId: task.milestoneId,
                              taskId: task.id,
                              taskName: task.name,
                              workKind: task.parentTaskId ? "subtask" : "task",
                              date: day,
                              hours: 1,
                              billable: true,
                              note: "",
                              status: "Draft",
                            },
                            projects,
                            tasks,
                            milestones,
                          ),
                          day,
                          true,
                        )
                      }
                    >
                      <strong>{task.name}</strong>
                      <span>{task.projectName}</span>
                    </button>
                  </li>
                ))}
                {!myTasks.length ? <li className="text-[var(--color-muted)]">Nothing in this filter.</li> : null}
              </ul>
            </aside>
          </div>
        </section>
      ) : null}

      {view === "Weekly" ? (
        <section>
          <TimesheetToolbar
            people={people}
            team={team}
            person={sheetPerson}
            onPerson={setSheetPerson}
            workTypes={workTypes}
            onToggleWorkType={toggleWorkType}
            objectTypes={objectTypes}
            onToggleObjectType={toggleObjectType}
            onRefresh={refreshSheet}
            onAddTime={() => openLog({ date: weekStart })}
            rangeLabel={formatWeekRange(weekStart)}
            onPrev={() => setWeekStart(addDays(weekStart, -7))}
            onNext={() => setWeekStart(addDays(weekStart, 7))}
            prevLabel="Previous week"
            nextLabel="Next week"
            jumpLabel="Daily timesheet"
            onJump={() => changeView("Daily")}
          />
          <div className="ts-work-search">
            <TextInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find work to add: project, phase, task, or subtask"
              aria-label="Find work to add to your timesheet"
            />
            {workHits.length ? (
              <ul className="ts-work-hits">
                {workHits.map((work) => (
                  <li key={work.key}>
                    <button type="button" className="ts-work-hit" onClick={() => pinWork(work)}>
                      <span className="ts-kind">{kindLabel(work.kind)}</span>
                      <strong>{work.label}</strong>
                      <span>{work.detail}</span>
                    </button>
                    <button type="button" className="btn btn-ghost text-sm" onClick={() => openActivity(work, weekStart, true)}>
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="panel overflow-auto">
            <div className="timesheet-week">
              <div className="timesheet-week-head">
                <div>Work</div>
                {weekDays(weekStart).map((iso) => (
                  <button
                    key={iso}
                    type="button"
                    className="timesheet-cell"
                    onClick={() => {
                      setDay(iso);
                      changeView("Daily");
                    }}
                  >
                    {formatWeekday(iso)}
                    <div className="font-normal normal-case tracking-normal">{iso.slice(5)}</div>
                  </button>
                ))}
                <div>Total</div>
              </div>
              {visibleRows.map((row) => {
                const work = workByKey.get(row.key);
                return (
                  <div key={row.key} className="timesheet-week-row">
                    <div className="ts-week-work">
                      {work ? <span className="ts-kind">{kindLabel(work.kind)}</span> : null}
                      <strong>{work?.label ?? row.key}</strong>
                      {work?.detail ? <span>{work.detail}</span> : null}
                    </div>
                    {row.cells.map((hours, index) => {
                      const date = weekDays(weekStart)[index];
                      return (
                        <div key={`${row.key}-${date}`} className="ts-week-cell">
                          <button
                            type="button"
                            className="timesheet-cell ts-week-hit"
                            onClick={() => work && openActivity(work, date, !hours)}
                          >
                            {hours ? formatClockHours(hours) : ""}
                          </button>
                          <button
                            type="button"
                            className="ts-week-add"
                            aria-label={`Add another entry on ${date}`}
                            onClick={() => work && openActivity(work, date, true)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      );
                    })}
                    <div className="timesheet-cell font-semibold">{formatClockHours(row.total)}</div>
                  </div>
                );
              })}
              <div className="timesheet-week-row">
                <div className="font-semibold">Totals</div>
                {matrix.totals.map((hours, index) => (
                  <div key={`total-${index}`} className="timesheet-cell font-semibold">
                    {hours ? formatClockHours(hours) : "0:00"}
                  </div>
                ))}
                <div className="timesheet-cell font-semibold">{formatClockHours(matrix.grand) || "0:00"}</div>
              </div>
            </div>
            {!visibleRows.length ? <p className="p-6 text-sm text-[var(--color-muted)]">No time in this week. Search a project, phase, task, or subtask to add a row.</p> : null}
          </div>
        </section>
      ) : null}

      {activity ? (
        <TimesheetActivityModal
          work={activity.work}
          date={activity.date}
          startOnAdd={activity.add}
          entries={scoped.filter(
            (entry) =>
              entry.date === activity.date && workFromEntry(entry, projects, tasks, milestones).key === activity.work.key,
          )}
          onClose={() => setActivity(null)}
        />
      ) : null}
      <CreateForms
        key={`${createKind}-${logDefaults.projectId ?? ""}-${logDefaults.milestoneId ?? ""}-${logDefaults.taskId ?? ""}-${logDefaults.date ?? ""}-${logDefaults.hours ?? ""}`}
        kind={createKind}
        onClose={() => setCreateKind(null)}
        defaults={{
          date: logDefaults.date ?? (view === "Daily" ? day : todayIso()),
          projectId: logDefaults.projectId,
          milestoneId: logDefaults.milestoneId,
          taskId: logDefaults.taskId,
          workKind: logDefaults.workKind,
          hours: logDefaults.hours,
          start: logDefaults.start,
        }}
      />
    </div>
  );
}

function DailyCard({
  entry,
  userName,
  staffOnly,
  canApprove,
  onOpen,
  onSubmit,
  onApprove,
  onReject,
  onDelete,
}: {
  entry: TimeEntry;
  userName: string;
  staffOnly: boolean;
  canApprove: boolean;
  onOpen: () => void;
  onSubmit: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const window = entryWindow(entry);
  const trail = [entry.taskName, entry.milestoneName, entry.projectName].filter(Boolean);
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canChange = entry.userName === userName || entry.userName === "J. Kim" || !staffOnly;
  return (
    <article className="ts-entry">
      <button type="button" className="ts-entry-main" onClick={onOpen}>
        <strong>{entry.note || entry.taskName || entry.milestoneName || entry.projectName}</strong>
        <p>
          {trail.join(" / ")}
          {entry.userName !== userName ? ` · ${entry.userName}` : ""}
          {entry.billable ? "" : " · Internal"}
        </p>
      </button>
      <div className="ts-entry-time">
        {formatClock(window.start)} to {formatClock(window.end)}
      </div>
      <StatusPill tone={statusTone(entry.status)}>{entry.status}</StatusPill>
      <div className="ts-entry-actions">
        <span className="tabular-nums font-semibold">{formatDuration(entry.hours)}</span>
        <div className="ts-more" onMouseEnter={() => setMenu(true)} onMouseLeave={() => setMenu(false)}>
          <button type="button" className="icon-btn" aria-label="More activity actions" aria-expanded={menu} onClick={() => setMenu((open) => !open)}>
            <MoreHorizontal size={16} />
          </button>
          {menu ? (
            <div className="menu-popover ts-more-popover fade-in">
              <button type="button" className="menu-row" onClick={() => { setMenu(false); onOpen(); }}>
                Edit
              </button>
              {entry.status === "Draft" && canChange ? (
                <button type="button" className="menu-row" onClick={() => { setMenu(false); onSubmit(entry.id); }}>
                  Submit
                </button>
              ) : null}
              {entry.status === "Submitted" && canApprove ? (
                <>
                  <button type="button" className="menu-row" onClick={() => { setMenu(false); onApprove(entry.id); }}>
                    Approve
                  </button>
                  <button type="button" className="menu-row" onClick={() => { setMenu(false); onReject(entry.id); }}>
                    Reject
                  </button>
                </>
              ) : null}
              {canChange ? (
                <button type="button" className="menu-row is-danger" onClick={() => { setMenu(false); setConfirmDelete(true); }}>
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <ConfirmModal
        open={confirmDelete}
        title="Delete time entry"
        body="This removes the activity from the timesheet."
        confirmLabel="Delete"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          onDelete(entry.id);
          setConfirmDelete(false);
        }}
      />
    </article>
  );
}
