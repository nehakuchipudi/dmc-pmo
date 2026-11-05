"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { MetricCard, MetricGrid } from "@/components/ppm/PpmWidgets";
import { Avatar, Field, Modal, PageHeader, StatusPill, Tabs, TextInput, statusTone } from "@/components/ui";
import { roleLabel, useAuth } from "@/lib/auth";
import {
  allocationPct,
  firmAnnouncements,
  isPortalTab,
  loadEmployeeRequests,
  loggedWeekHours,
  memberManager,
  mineTasks,
  mineTickets,
  mineWorkOrders,
  PORTAL_TABS,
  portalAnnouncements,
  portalAssignments,
  portalRequests,
  postedAgo,
  requestLabel,
  saveEmployeeRequest,
  weekHoursByDay,
  weekHoursTotal,
  type PortalTab,
} from "@/lib/employee-portal";
import { clockHours } from "@/lib/service-ops";
import { formatDisplayDate, money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import { formatWeekRange, startOfWeek, todayIso, weekDays } from "@/lib/timesheet";

export function EmployeePortal() {
  const { user, can, canSeeFinancials } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const [tab, setTab] = useState<PortalTab>(isPortalTab(requested) ? requested : "My Overview");
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [timeOffOpen, setTimeOffOpen] = useState(false);
  const [requestTick, setRequestTick] = useState(0);
  const name = user?.name ?? "";

  const workOrders = useAppStore((s) => s.workOrders);
  const projects = useAppStore((s) => s.projects);
  const allocations = useAppStore((s) => s.allocations);
  const tasks = useAppStore((s) => s.tasks);
  const tickets = useAppStore((s) => s.tickets);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const expenses = useAppStore((s) => s.expenses);
  const notifications = useAppStore((s) => s.notifications);
  const team = useAppStore((s) => s.team);
  const fieldClocks = useAppStore((s) => s.fieldClocks);
  const clockInField = useAppStore((s) => s.clockInField);
  const clockOutField = useAppStore((s) => s.clockOutField);
  const pushToast = useAppStore((s) => s.pushToast);

  useEffect(() => {
    if (isPortalTab(requested)) setTab(requested);
  }, [requested]);

  const member = team.find((row) => row.email.toLowerCase() === (user?.email ?? "").toLowerCase()) ?? team.find((row) => row.name === name);
  const openClock = fieldClocks.find((row) => row.memberName === name && !row.stoppedAt);
  const weekStart = startOfWeek(todayIso());
  const assignments = useMemo(
    () => portalAssignments({ user, projects, allocations, workOrders, tasks, tickets }),
    [user, projects, allocations, workOrders, tasks, tickets],
  );
  const planned = useMemo(() => weekHoursByDay(timeEntries, name, weekStart), [timeEntries, name, weekStart]);
  const plannedTotal = weekHoursTotal(planned);
  const logged = loggedWeekHours(timeEntries, name, weekStart);
  const clockHoursWeek = fieldClocks
    .filter((row) => row.memberName === name && row.startedAt.slice(0, 10) >= weekStart)
    .reduce((sum, row) => sum + (row.hours ?? (row.stoppedAt ? 0 : clockHours(row.startedAt))), 0);
  const timesheetHours = logged || Math.round(clockHoursWeek * 10) / 10;
  const myTasks = mineTasks(tasks, user);
  const myTickets = mineTickets(tickets, user);
  const myJobs = mineWorkOrders(workOrders, user);
  const requests = useMemo(() => {
    void requestTick;
    return portalRequests({ name, expenses });
  }, [name, expenses, requestTick]);
  const pendingRequests = requests.filter((row) => row.status === "Pending").length;
  const approvedRequests = requests.filter((row) => row.status === "Approved").length;
  const announcements = portalAnnouncements(notifications).slice(0, 4);
  const alloc = allocationPct(allocations, name);
  const manager = memberManager(team, member);
  const week = weekDays(weekStart).slice(0, 5);

  function openTab(next: PortalTab) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "My Overview") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `/app/employee/?${qs}` : "/app/employee/", { scroll: false });
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Employee Portal"
        subtitle="Your work, schedule, requests, and key information in one place."
        actions={
          openClock ? (
            <button type="button" className="btn btn-primary" onClick={() => clockOutField(name)}>
              Clock out
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => clockInField(name)}>
              Clock in
            </button>
          )
        }
      />

      <Tabs tabs={[...PORTAL_TABS]} active={tab} onChange={(value) => openTab(value as PortalTab)} />

      {tab === "My Overview" ? (
        <>
          <MetricGrid className="metric-grid-fit">
            <MetricCard
              label="My assignments"
              value={assignments.length}
              hint={`${assignments.filter((row) => row.kind === "Project").length} projects · ${assignments.filter((row) => row.kind === "Work order").length} work orders`}
            />
            <MetricCard label="This week's schedule" value={`${plannedTotal}h`} hint="Monday to Friday" />
            <MetricCard
              label="Timesheet"
              value={`${timesheetHours}h`}
              hint="Logged this week"
              tone={timesheetHours >= plannedTotal && plannedTotal ? "good" : "warn"}
            />
            <MetricCard
              label="My requests"
              value={pendingRequests ? `${pendingRequests} pending` : "None pending"}
              hint={`${approvedRequests} approved`}
              tone={pendingRequests ? "warn" : "good"}
            />
          </MetricGrid>
          <MetricGrid className="metric-grid-fit">
            <MetricCard
              label="Clock"
              value={openClock ? "On the clock" : "Off the clock"}
              hint={openClock ? "Clock out when you leave the job" : "Clock in when you start a visit"}
              tone={openClock ? "good" : "default"}
            />
            <MetricCard
              label="Open tasks"
              value={myTasks.length || assignments.filter((row) => row.kind === "Task").length}
              hint="Assigned work still open"
            />
            <MetricCard
              label="Tickets"
              value={myTickets.length || assignments.filter((row) => row.kind === "Ticket").length}
              hint="Support assigned to you"
              tone={myTickets.length ? "warn" : "good"}
            />
            <MetricCard
              label="Allocation"
              value={alloc ? `${alloc}%` : "-"}
              hint="Hours reserved on active projects"
              tone={alloc > 100 ? "bad" : alloc ? "good" : "default"}
            />
          </MetricGrid>

          <div className="split-3">
            <div className="panel p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="section-title" style={{ margin: 0 }}>
                  My assignments
                </h2>
                <button type="button" className="text-sm text-[var(--color-navy)]" onClick={() => openTab("My Work")}>
                  View all
                </button>
              </div>
              {assignments.length ? (
                assignments.slice(0, 5).map((row) => (
                  <Link key={row.id} href={row.href} className="insight-card block">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">{row.title}</div>
                        <div className="mt-1 text-sm text-[var(--color-muted)]">
                          {row.kind} · {row.subtitle}
                        </div>
                      </div>
                      <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[var(--color-muted)]">
                  Nothing assigned yet.{" "}
                  <Link href="/app/work-orders" className="font-medium text-[var(--color-navy)]">
                    Open work orders
                  </Link>
                </p>
              )}
            </div>

            <div className="panel p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="section-title" style={{ margin: 0 }}>
                  My schedule
                </h2>
                <Link href="/app/work-schedule" className="text-sm text-[var(--color-navy)]">
                  View calendar
                </Link>
              </div>
              <p className="mb-3 text-sm text-[var(--color-muted)]">This week ({formatWeekRange(weekStart)})</p>
              <div className="employee-week">
                {week.map((day, index) => (
                  <div key={day} className="journey-step">
                    <div className="journey-step-label">{new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })}</div>
                    <div className="journey-step-value">{new Date(`${day}T12:00:00`).getDate()}</div>
                    <div className="mt-1 text-sm text-[var(--color-muted)]">{planned[index] ? `${planned[index]}h` : "-"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="section-title">Quick actions</h2>
              <Link href="/app/timesheets/?view=Daily" className="insight-card block">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">Log timesheet</span>
                  <span className="text-[var(--color-muted)]">→</span>
                </div>
              </Link>
              <Link href="/app/work-schedule" className="insight-card block">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">View schedule</span>
                  <span className="text-[var(--color-muted)]">→</span>
                </div>
              </Link>
              <button type="button" className="insight-card block w-full text-left" onClick={() => setTimeOffOpen(true)}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">Request time off</span>
                  <span className="text-[var(--color-muted)]">→</span>
                </div>
              </button>
              {can("create_expense") ? (
                <button type="button" className="insight-card block w-full text-left" onClick={() => setCreateKind("expense")}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">Submit expense</span>
                    <span className="text-[var(--color-muted)]">→</span>
                  </div>
                </button>
              ) : null}
              {can("log_time") ? (
                <button type="button" className="insight-card block w-full text-left" onClick={() => setCreateKind("time")}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">Log hours</span>
                    <span className="text-[var(--color-muted)]">→</span>
                  </div>
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 split-2">
            <div className="panel p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="section-title" style={{ margin: 0 }}>
                  My requests
                </h2>
                <button type="button" className="text-sm text-[var(--color-navy)]" onClick={() => openTab("My Requests")}>
                  View all
                </button>
              </div>
              {requests.length ? (
                requests.slice(0, 4).map((row) => (
                  <div key={row.id} className="insight-card">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{row.title}</div>
                        <div className="mt-1 text-sm text-[var(--color-muted)]">{requestLabel(row)}</div>
                      </div>
                      <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--color-muted)]">No time off or expenses on file.</p>
              )}
            </div>
            <div className="panel p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="section-title" style={{ margin: 0 }}>
                  Announcements
                </h2>
                <Link href="/app/documents" className="text-sm text-[var(--color-navy)]">
                  View all
                </Link>
              </div>
              {(announcements.length ? announcements : firmAnnouncements()).map((row) => (
                <Link key={row.id} href={row.href || "/app/employee"} className="insight-card block">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{row.title}</div>
                      <div className="mt-1 text-sm text-[var(--color-muted)]">{row.body}</div>
                    </div>
                    <span className="shrink-0 text-sm text-[var(--color-muted)]">{postedAgo(row.posted)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {tab === "My Work" ? (
        <div className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="p-4 pb-0">
              <h2 className="section-title">Assignments</h2>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Work</th>
                  <th>Type</th>
                  <th>For</th>
                  <th>When</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium">
                      <Link href={row.href} className="text-[var(--color-navy)]">
                        {row.title}
                      </Link>
                    </td>
                    <td>{row.kind}</td>
                    <td className="text-[var(--color-muted)]">{row.subtitle}</td>
                    <td>{row.date ? formatDisplayDate(row.date) : "None"}</td>
                    <td>
                      <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                    </td>
                  </tr>
                ))}
                {!assignments.length ? (
                  <tr>
                    <td colSpan={5} className="empty-row">
                      No open work assigned to you.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="split-2">
            <div className="panel p-5">
              <h2 className="section-title">Jobs today</h2>
              {myJobs.filter((row) => row.scheduled === todayIso()).length ? (
                myJobs
                  .filter((row) => row.scheduled === todayIso())
                  .map((row) => (
                    <div key={row.id} className="insight-card">
                      <div className="font-semibold">{row.title}</div>
                      <div className="mt-1 text-sm text-[var(--color-muted)]">
                        {row.companyName} · {row.priority}
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-[var(--color-muted)]">No field jobs on today's date.</p>
              )}
            </div>
            <div className="panel p-5">
              <h2 className="section-title">Hours this week</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Scheduled</span>
                  <span className="font-semibold">{plannedTotal}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Logged</span>
                  <span className="font-semibold">{timesheetHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Clock</span>
                  <span className="font-semibold">{openClock ? "On site" : "Off"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "My Requests" ? (
        <div className="space-y-4">
          <div className="page-header-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setTimeOffOpen(true)}>
              Request time off
            </button>
            {can("create_expense") ? (
              <button type="button" className="btn btn-primary" onClick={() => setCreateKind("expense")}>
                Submit expense
              </button>
            ) : null}
          </div>
          <div className="panel overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium">{row.title}</td>
                    <td>{row.kind}</td>
                    <td>{formatDisplayDate(row.date)}</td>
                    <td>
                      <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                    </td>
                  </tr>
                ))}
                {!requests.length ? (
                  <tr>
                    <td colSpan={4} className="empty-row">
                      No requests yet. Use Request time off or Submit expense.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "My Profile" ? (
        <div className="split-2">
          <div className="panel p-5">
            <h2 className="section-title">Profile</h2>
            <div className="flex items-center gap-3">
              <Avatar initials={member?.initials || user?.initials || ""} name={name} size={48} />
              <div>
                <div className="font-semibold">{name || "You"}</div>
                <div className="text-sm text-[var(--color-muted)]">{member?.title || (user?.role ? roleLabel(user.role) : "Staff")}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span>Email</span>
                <span className="font-medium">{member?.email || user?.email || "None"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Department</span>
                <span className="font-medium">{member?.department || "None"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Role</span>
                <span className="font-medium">{roleLabel(member?.role || user?.role || "staff")}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Reports to</span>
                <span className="font-medium">{manager || "None"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Timezone</span>
                <span className="font-medium">{member?.timezone || "None"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Finance</span>
                <span className="font-medium">
                  {member?.financialVisibility === "rates_and_budgets" || canSeeFinancials ? "Rates and budgets" : "Hours only"}
                </span>
              </div>
            </div>
          </div>
          <div className="panel p-5">
            <h2 className="section-title">This week</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Assignments</span>
                <span className="font-semibold">{assignments.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Scheduled hours</span>
                <span className="font-semibold">{plannedTotal}h</span>
              </div>
              <div className="flex justify-between">
                <span>Logged hours</span>
                <span className="font-semibold">{timesheetHours}h</span>
              </div>
              {canSeeFinancials && member?.billRate ? (
                <div className="flex justify-between">
                  <span>Bill rate</span>
                  <span className="font-semibold">{money(member.billRate)}/h</span>
                </div>
              ) : null}
            </div>
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              Role and rates are set in{" "}
              <Link href="/app/settings/?section=users" className="font-medium text-[var(--color-navy)]">
                Users & roles
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}

      <CreateForms kind={createKind} onClose={() => setCreateKind(null)} />

      <Modal open={timeOffOpen} title="Request time off" onClose={() => setTimeOffOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const date = String(data.get("date") || "");
            const title = String(data.get("title") || "Time off").trim() || "Time off";
            if (!date || !name) return;
            saveEmployeeRequest({ memberName: name, kind: "Time off", title, date });
            pushToast("Time off request submitted");
            setRequestTick((value) => value + 1);
            setTimeOffOpen(false);
          }}
        >
          <Field label="Date">
            <TextInput name="date" type="date" defaultValue={todayIso()} required />
          </Field>
          <Field label="Note">
            <TextInput name="title" placeholder="Time off" />
          </Field>
          <button type="submit" className="btn btn-primary">
            Submit request
          </button>
        </form>
      </Modal>
    </div>
  );
}
