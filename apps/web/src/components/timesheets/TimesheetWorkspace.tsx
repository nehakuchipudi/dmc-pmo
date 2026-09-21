"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { PageHeader, StatusPill, Tabs, TextInput, TextSelect, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { exportCsv } from "@/lib/pdf";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import type { TimeEntry } from "@/lib/types";
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

const VIEW_TABS = ["Overview", "Daily", "Weekly"];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export function TimesheetWorkspace() {
  const { user } = useAuth();
  const entries = useAppStore((s) => s.timeEntries);
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const team = useAppStore((s) => s.team);
  const submit = useAppStore((s) => s.submitTimeEntry);
  const approve = useAppStore((s) => s.approveTimeEntry);
  const reject = useAppStore((s) => s.rejectTimeEntry);
  const [view, setView] = useState(VIEW_TABS[0]);
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
  const [workFilter, setWorkFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [horizon, setHorizon] = useState(7);
  const [logDefaults, setLogDefaults] = useState<{ projectId?: string; date?: string; hours?: number; start?: string }>({});
  const [myWorkFilter, setMyWorkFilter] = useState<"Committed" | "Overdue" | "All">("Committed");

  const canApprove = !!user && (user.role === "admin" || user.role === "pm" || user.role === "finance");
  const staffOnly = user?.role === "staff";
  const people = useMemo(() => {
    const names = new Set(team.filter((m) => m.active).map((m) => m.name));
    entries.forEach((entry) => names.add(entry.userName));
    return ["All", ...[...names].sort()];
  }, [team, entries]);

  const scoped = useMemo(() => {
    return entries
      .filter((entry) => (staffOnly ? entry.userName === user?.name || entry.userName === "J. Kim" : true))
      .filter((entry) => {
        const who = view === "Overview" ? reportPerson : sheetPerson;
        return who === "All" ? true : entry.userName === who;
      })
      .filter((entry) => (billableOnly ? entry.billable : true))
      .filter((entry) => (workFilter === "Billable" ? entry.billable : workFilter === "Non-billable" ? !entry.billable : true))
      .sort((a, b) => a.start?.localeCompare(b.start ?? "") || b.date.localeCompare(a.date));
  }, [entries, staffOnly, user?.name, reportPerson, sheetPerson, view, billableOnly, workFilter]);

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
  const matrix = weekMatrix(weekEntries, weekStart, (entry) => entry.projectName);
  const visibleRows = matrix.rows.filter((row) => !search || row.key.toLowerCase().includes(search.toLowerCase()));
  const addableProjects = projects.filter(
    (project) =>
      search &&
      project.name.toLowerCase().includes(search.toLowerCase()) &&
      !matrix.rows.some((row) => row.key === project.name),
  );

  const selectedPerson = sheetPerson === "All" ? user?.name : sheetPerson;
  const myTasks = tasks.filter((task) => {
    if (selectedPerson && task.assignee !== selectedPerson) return false;
    if (task.status === "Done") return false;
    if (myWorkFilter === "Overdue") return task.due < todayIso();
    if (myWorkFilter === "Committed") return task.status === "In Progress" || task.status === "Review";
    return true;
  });

  function openLog(next?: { projectId?: string; date?: string; hours?: number; start?: string }) {
    setLogDefaults(next ?? { date: view === "Weekly" ? weekStart : day });
    setCreateKind("time");
  }

  if (!user) return null;

  return (
    <div className="fade-in">
      <PageHeader
        title={view === "Overview" ? "Timesheet overview" : view === "Daily" ? "Daily timesheet" : "Weekly timesheet"}
        subtitle="Review logged work, fill a day on the timeline, or close the week."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => openLog({ date: view === "Weekly" ? weekStart : day })}>
            <Plus size={16} /> Log time
          </button>
        }
      />
      <Tabs tabs={VIEW_TABS} active={view} onChange={setView} />

      {view === "Overview" ? (
        <section>
          <div className="ts-toolbar">
            <div className="ts-toolbar-group">
              <label className="ts-inline">
                <span>People</span>
                <TextSelect value={reportPerson} onChange={(e) => setReportPerson(e.target.value)}>
                  {people.map((name) => (
                    <option key={name} value={name}>
                      {name === "All" ? "Users and groups" : name}
                    </option>
                  ))}
                </TextSelect>
              </label>
              <label className="ts-inline">
                <span>Rate type</span>
                <TextSelect value={workFilter} onChange={(e) => setWorkFilter(e.target.value)}>
                  <option>All</option>
                  <option>Billable</option>
                  <option>Non-billable</option>
                </TextSelect>
              </label>
              <label className="ts-inline">
                <span>From</span>
                <TextInput type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
              </label>
              <label className="ts-inline">
                <span>To</span>
                <TextInput type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
              </label>
            </div>
            <div className="ts-toolbar-group ts-toolbar-toggles">
              <label>
                <input type="checkbox" checked={loggedOnly} onChange={(e) => setLoggedOnly(e.target.checked)} />
                Show only logged time
              </label>
              <label>
                <input type="checkbox" checked={billableOnly} onChange={(e) => setBillableOnly(e.target.checked)} />
                Show only billable time
              </label>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
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
                  )
                }
              >
                Export
              </button>
            </div>
          </div>
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
          <div className="ts-toolbar">
            <div className="ts-toolbar-group">
              <button type="button" className="icon-btn" aria-label="Previous day" onClick={() => setDay(addDays(day, -1))}>
                <ChevronLeft size={16} />
              </button>
              <strong className="ts-date-label">{formatLongDay(day)}</strong>
              <button type="button" className="icon-btn" aria-label="Next day" onClick={() => setDay(addDays(day, 1))}>
                <ChevronRight size={16} />
              </button>
              <div className="ts-day-total">
                Total: {formatDuration(dayTotal)}
                <span>
                  ({formatDuration(dayBillable)} - {formatDuration(dayNonbillable)})
                </span>
              </div>
            </div>
            <div className="ts-toolbar-group">
              <button type="button" className="btn btn-ghost" onClick={() => setDay(todayIso())}>
                Today
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setWeekStart(startOfWeek(day));
                  setView("Weekly");
                }}
              >
                Weekly view
              </button>
              <TextSelect value={sheetPerson} onChange={(e) => setSheetPerson(e.target.value)} aria-label="Person">
                {people.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </TextSelect>
            </div>
          </div>
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
                        title={`${entry.note || entry.taskName || entry.projectName} ${formatDuration(entry.hours)}`}
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
            <button type="button" className="btn btn-primary" onClick={() => openLog({ date: day, start: "09:00" })}>
              Log time
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="panel ts-day-list">
              {dailyMode === "Grouped"
                ? Object.entries(
                    dayEntries.reduce<Record<string, typeof dayEntries>>((acc, entry) => {
                      acc[entry.projectName] = acc[entry.projectName] ?? [];
                      acc[entry.projectName].push(entry);
                      return acc;
                    }, {}),
                  ).map(([projectName, rows]) => (
                    <div key={projectName} className="ts-group">
                      <h3>{projectName}</h3>
                      {rows.map((entry) => (
                        <DailyCard
                          key={entry.id}
                          entry={entry}
                          userName={user.name}
                          staffOnly={staffOnly}
                          canApprove={canApprove}
                          onSubmit={submit}
                          onApprove={approve}
                          onReject={reject}
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
                      onSubmit={submit}
                      onApprove={approve}
                      onReject={reject}
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
                      onClick={() => openLog({ projectId: task.projectId, date: day, hours: 1, start: "09:00" })}
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
          <div className="ts-toolbar">
            <div className="ts-toolbar-group">
              <TextSelect value={sheetPerson} onChange={(e) => setSheetPerson(e.target.value)} aria-label="Person">
                {people.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </TextSelect>
              <TextSelect value={workFilter} onChange={(e) => setWorkFilter(e.target.value)}>
                <option>All</option>
                <option>Billable</option>
                <option>Non-billable</option>
              </TextSelect>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setDay(weekStart);
                  setView("Daily");
                }}
              >
                Daily timesheet
              </button>
            </div>
            <div className="ts-toolbar-group">
              <button type="button" className="icon-btn" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                <ChevronLeft size={16} />
              </button>
              <strong className="ts-date-label">{formatWeekRange(weekStart)}</strong>
              <button type="button" className="icon-btn" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="mb-3">
            <TextInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find work to add to your timesheet"
            />
          </div>
          {addableProjects.length ? (
            <ul className="ts-add-work">
              {addableProjects.slice(0, 4).map((project) => (
                <li key={project.id}>
                  <button type="button" className="btn btn-ghost" onClick={() => openLog({ projectId: project.id, date: weekStart })}>
                    Add {project.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
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
                      setView("Daily");
                    }}
                  >
                    {formatWeekday(iso)}
                    <div className="font-normal normal-case tracking-normal">{iso.slice(5)}</div>
                  </button>
                ))}
                <div>Total</div>
              </div>
              {visibleRows.map((row) => {
                const project = projects.find((item) => item.name === row.key);
                return (
                  <div key={row.key} className="timesheet-week-row">
                    <div className="font-medium text-[var(--color-navy)]">{row.key}</div>
                    {row.cells.map((hours, index) => (
                      <button
                        key={`${row.key}-${index}`}
                        type="button"
                        className="timesheet-cell ts-week-hit"
                        onClick={() =>
                          openLog({
                            projectId: project?.id,
                            date: weekDays(weekStart)[index],
                            hours: hours || 1,
                          })
                        }
                      >
                        {hours ? formatClockHours(hours) : ""}
                      </button>
                    ))}
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
            {!visibleRows.length ? <p className="p-6 text-sm text-[var(--color-muted)]">No time in this week. Search to add work.</p> : null}
          </div>
        </section>
      ) : null}

      <CreateForms
        kind={createKind}
        onClose={() => setCreateKind(null)}
        defaults={{
          date: logDefaults.date ?? (view === "Daily" ? day : todayIso()),
          projectId: logDefaults.projectId,
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
  onSubmit,
  onApprove,
  onReject,
}: {
  entry: TimeEntry;
  userName: string;
  staffOnly: boolean;
  canApprove: boolean;
  onSubmit: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const window = entryWindow(entry);
  return (
    <article className="ts-entry">
      <div>
        <strong>{entry.note || entry.taskName || entry.projectName}</strong>
        <p>
          {entry.projectName}
          {entry.userName !== userName ? ` · ${entry.userName}` : ""}
          {entry.billable ? "" : " · Non-billable"}
        </p>
      </div>
      <div className="ts-entry-time">
        {formatClock(window.start)} to {formatClock(window.end)}
      </div>
      <StatusPill tone={statusTone(entry.status)}>{entry.status}</StatusPill>
      <div className="ts-entry-actions">
        <span className="tabular-nums font-semibold">{formatDuration(entry.hours)}</span>
        {entry.status === "Draft" && (entry.userName === userName || entry.userName === "J. Kim" || !staffOnly) ? (
          <button type="button" className="btn btn-ghost text-sm" onClick={() => onSubmit(entry.id)}>
            Submit
          </button>
        ) : null}
        {entry.status === "Submitted" && canApprove ? (
          <>
            <button type="button" className="btn btn-primary text-sm" onClick={() => onApprove(entry.id)}>
              Approve
            </button>
            <button type="button" className="btn btn-ghost text-sm" onClick={() => onReject(entry.id)}>
              Reject
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}
