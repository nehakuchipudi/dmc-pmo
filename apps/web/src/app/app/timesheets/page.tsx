"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { FilterChips, PageHeader, SideRail, StatusPill, Tabs, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { formatDisplayDate, money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import {
  addDays,
  formatDayLabel,
  formatWeekRange,
  formatWeekday,
  groupHours,
  hoursInRange,
  startOfWeek,
  todayIso,
  weekDays,
  weekMatrix,
} from "@/lib/timesheet";

const STATUS_FILTERS = ["All", "Draft", "Submitted", "Approved", "Rejected"];
const VIEW_TABS = ["Overview", "Daily", "Weekly"];

export default function TimesheetsPage() {
  const { user } = useAuth();
  const entries = useAppStore((s) => s.timeEntries);
  const submit = useAppStore((s) => s.submitTimeEntry);
  const approve = useAppStore((s) => s.approveTimeEntry);
  const reject = useAppStore((s) => s.rejectTimeEntry);
  const [view, setView] = useState(VIEW_TABS[0]);
  const [filter, setFilter] = useState(STATUS_FILTERS[0]);
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [day, setDay] = useState(todayIso());
  const [weekStart, setWeekStart] = useState(startOfWeek(todayIso()));
  const [weekGroup, setWeekGroup] = useState<"Person" | "Project">("Person");

  const canApprove = !!user && (user.role === "admin" || user.role === "pm" || user.role === "finance");
  const staffOnly = user?.role === "staff";

  const scoped = useMemo(() => {
    return entries
      .filter((e) => (staffOnly ? e.userName === user?.name || e.userName === "J. Kim" : true))
      .sort((a, b) => b.date.localeCompare(a.date) || a.userName.localeCompare(b.userName));
  }, [entries, staffOnly, user?.name]);

  const filtered = useMemo(
    () => scoped.filter((e) => (filter === "All" ? true : e.status === filter)),
    [scoped, filter],
  );

  const weekEnd = addDays(weekStart, 6);
  const thisWeekStart = startOfWeek(todayIso());
  const thisWeekEntries = scoped.filter((e) => e.date >= thisWeekStart && e.date <= addDays(thisWeekStart, 6));
  const weekHours = hoursInRange(thisWeekEntries, thisWeekStart, addDays(thisWeekStart, 6));
  const billableHours = thisWeekEntries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0);
  const pending = scoped.filter((e) => e.status === "Submitted");
  const approvedValue = scoped.filter((e) => e.status === "Approved").reduce((s, e) => s + e.hours * 180, 0);
  const dayEntries = filtered.filter((e) => e.date === day);
  const dayHours = dayEntries.reduce((s, e) => s + e.hours, 0);
  const weekEntries = scoped.filter((e) => e.date >= weekStart && e.date <= weekEnd);
  const matrix = weekMatrix(weekEntries, weekStart, (e) => (weekGroup === "Person" ? e.userName : e.projectName));
  const people = groupHours(thisWeekEntries, (e) => e.userName);
  const projects = groupHours(thisWeekEntries, (e) => e.projectName);

  if (!user) return null;

  return (
    <div className="fade-in">
      <PageHeader
        title="Timesheets"
        subtitle="Overview of the week, a daily log, and a weekly grid for approval."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setCreateKind("time")}>
            <Plus size={16} /> Log time
          </button>
        }
      />
      <Tabs tabs={VIEW_TABS} active={view} onChange={setView} />

      {view === "Overview" ? (
        <>
          <div className="panel mb-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            <Metric label="This week" value={`${weekHours.toFixed(1)}h`} />
            <Metric label="Billable" value={`${billableHours.toFixed(1)}h`} />
            <Metric label="Pending approval" value={`${pending.length}`} />
            <Metric label="Approved value" value={money(approvedValue)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_240px]">
            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-navy)]">Hours by person</h2>
              <Breakdown rows={people} />
            </div>
            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-navy)]">Hours by project</h2>
              <Breakdown rows={projects} />
            </div>
            <SideRail title="This week">
              <p className="text-sm text-[var(--color-muted)]">{formatWeekRange(thisWeekStart)}</p>
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                {pending.length} {pending.length === 1 ? "entry" : "entries"} waiting on a reviewer.
              </p>
            </SideRail>
          </div>
          <div className="mt-4 panel overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4">
              <h2 className="text-sm font-semibold text-[var(--color-navy)]">Needs review</h2>
            </div>
            <EntryTable
              rows={pending}
              userName={user.name}
              staffOnly={staffOnly}
              canApprove={canApprove}
              onSubmit={submit}
              onApprove={approve}
              onReject={reject}
              empty="Nothing waiting for approval."
            />
          </div>
        </>
      ) : null}

      {view === "Daily" ? (
        <>
          <DayNav
            label={formatDayLabel(day)}
            onPrev={() => setDay(addDays(day, -1))}
            onNext={() => setDay(addDays(day, 1))}
            onReset={() => setDay(todayIso())}
            resetLabel="Today"
          />
          <FilterChips items={STATUS_FILTERS} active={filter} onChange={setFilter} />
          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
            <div className="panel overflow-hidden">
              <EntryTable
                rows={dayEntries}
                userName={user.name}
                staffOnly={staffOnly}
                canApprove={canApprove}
                onSubmit={submit}
                onApprove={approve}
                onReject={reject}
                empty="No time logged for this day."
              />
            </div>
            <SideRail title="Day total">
              <div className="text-2xl font-semibold tabular-nums text-[var(--color-navy)]">{dayHours.toFixed(2)}h</div>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{dayEntries.length} entries</p>
              <button type="button" className="btn btn-primary mt-4 w-full justify-center" onClick={() => setCreateKind("time")}>
                Log time for this day
              </button>
            </SideRail>
          </div>
        </>
      ) : null}

      {view === "Weekly" ? (
        <>
          <DayNav
            label={formatWeekRange(weekStart)}
            onPrev={() => setWeekStart(addDays(weekStart, -7))}
            onNext={() => setWeekStart(addDays(weekStart, 7))}
            onReset={() => setWeekStart(startOfWeek(todayIso()))}
            resetLabel="This week"
          />
          <FilterChips items={["Person", "Project"]} active={weekGroup} onChange={(v) => setWeekGroup(v as "Person" | "Project")} />
          <div className="panel overflow-auto">
            <div className="timesheet-week">
              <div className="timesheet-week-head">
                <div>{weekGroup}</div>
                {weekDays(weekStart).map((iso) => (
                  <button
                    key={iso}
                    type="button"
                    className="timesheet-cell text-left"
                    onClick={() => {
                      setDay(iso);
                      setView("Daily");
                    }}
                  >
                    {formatWeekday(iso)}
                    <div className="font-normal normal-case tracking-normal">{iso.slice(8)}</div>
                  </button>
                ))}
                <div>Total</div>
              </div>
              {matrix.rows.map((row) => (
                <div key={row.key} className="timesheet-week-row">
                  <div className="font-medium text-[var(--color-navy)]">{row.key}</div>
                  {row.cells.map((hours, index) => (
                    <div key={`${row.key}-${index}`} className="timesheet-cell">
                      {hours ? hours.toFixed(1) : ""}
                    </div>
                  ))}
                  <div className="timesheet-cell font-semibold">{row.total.toFixed(1)}</div>
                </div>
              ))}
              <div className="timesheet-week-row">
                <div className="font-semibold">Total</div>
                {matrix.totals.map((hours, index) => (
                  <div key={`total-${index}`} className="timesheet-cell font-semibold">
                    {hours ? hours.toFixed(1) : ""}
                  </div>
                ))}
                <div className="timesheet-cell font-semibold">{matrix.grand.toFixed(1)}</div>
              </div>
              {!matrix.rows.length ? (
                <div className="timesheet-week-row">
                  <div className="p-4 text-sm text-[var(--color-muted)]">No time in this week yet.</div>
                  <div /><div /><div /><div /><div /><div /><div /><div />
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      <CreateForms
        kind={createKind}
        onClose={() => setCreateKind(null)}
        defaults={{ date: view === "Daily" ? day : todayIso() }}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-[var(--color-navy)]">{value}</div>
    </div>
  );
}

function Breakdown({ rows }: { rows: { key: string; hours: number; billable: number }[] }) {
  if (!rows.length) return <p className="text-sm text-[var(--color-muted)]">No hours logged this week.</p>;
  return (
    <ul className="space-y-2 text-sm">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-3">
          <span>{row.key}</span>
          <span className="tabular-nums font-semibold">
            {row.hours.toFixed(1)}h
            <span className="ml-2 font-normal text-[var(--color-muted)]">{row.billable.toFixed(1)} billable</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function DayNav({
  label,
  onPrev,
  onNext,
  onReset,
  resetLabel,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  resetLabel: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button type="button" className="icon-btn" aria-label="Previous" onClick={onPrev}>
          <ChevronLeft size={16} />
        </button>
        <div className="min-w-48 text-sm font-semibold text-[var(--color-navy)]">{label}</div>
        <button type="button" className="icon-btn" aria-label="Next" onClick={onNext}>
          <ChevronRight size={16} />
        </button>
      </div>
      <button type="button" className="btn btn-ghost" onClick={onReset}>
        {resetLabel}
      </button>
    </div>
  );
}

function EntryTable({
  rows,
  userName,
  staffOnly,
  canApprove,
  onSubmit,
  onApprove,
  onReject,
  empty,
}: {
  rows: {
    id: string;
    date: string;
    userName: string;
    projectName: string;
    note: string;
    taskName?: string;
    hours: number;
    status: string;
    billable: boolean;
  }[];
  userName: string;
  staffOnly: boolean;
  canApprove: boolean;
  onSubmit: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  empty: string;
}) {
  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Person</th>
            <th>Project</th>
            <th>Note</th>
            <th>Hours</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id}>
              <td>{formatDisplayDate(e.date)}</td>
              <td>{e.userName}</td>
              <td>{e.projectName}</td>
              <td className="text-[var(--color-muted)]">
                {e.note || e.taskName || "-"}
                {!e.billable ? <span className="ml-2 text-xs uppercase">Non-billable</span> : null}
              </td>
              <td className="tabular-nums font-semibold">{e.hours.toFixed(2)}h</td>
              <td>
                <StatusPill tone={statusTone(e.status)}>{e.status}</StatusPill>
              </td>
              <td className="text-right">
                {e.status === "Draft" && (e.userName === userName || e.userName === "J. Kim" || !staffOnly) ? (
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => onSubmit(e.id)}>
                    Submit
                  </button>
                ) : null}
                {e.status === "Submitted" && canApprove ? (
                  <span className="inline-flex gap-1">
                    <button type="button" className="btn btn-primary text-sm" onClick={() => onApprove(e.id)}>
                      Approve
                    </button>
                    <button type="button" className="btn btn-ghost text-sm" onClick={() => onReject(e.id)}>
                      Reject
                    </button>
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length ? <p className="p-6 text-sm text-[var(--color-muted)]">{empty}</p> : null}
    </>
  );
}
