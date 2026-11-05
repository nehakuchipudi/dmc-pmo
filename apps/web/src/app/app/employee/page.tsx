"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader, StatusPill, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { clockHours } from "@/lib/service-ops";
import { useAppStore } from "@/lib/store";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeekIso() {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date.toISOString().slice(0, 10);
}

export default function EmployeePortalPage() {
  const { user } = useAuth();
  const workOrders = useAppStore((s) => s.workOrders);
  const fieldClocks = useAppStore((s) => s.fieldClocks);
  const clockInField = useAppStore((s) => s.clockInField);
  const clockOutField = useAppStore((s) => s.clockOutField);
  const name = user?.name ?? "";
  const today = todayIso();
  const weekStart = startOfWeekIso();
  const mine = workOrders.filter((row) => row.assignee === name && row.status !== "Completed");
  const todayJobs = mine.filter((row) => row.scheduled === today);
  const openClock = fieldClocks.find((row) => row.memberName === name && !row.stoppedAt);
  const weekHours = useMemo(
    () =>
      fieldClocks
        .filter((row) => row.memberName === name && row.startedAt.slice(0, 10) >= weekStart)
        .reduce((sum, row) => sum + (row.hours ?? (row.stoppedAt ? 0 : clockHours(row.startedAt))), 0),
    [fieldClocks, name, weekStart],
  );

  return (
    <div className="fade-in">
      <PageHeader
        title="Employee Portal"
        subtitle="Clock in, see today's jobs, and check hours for the week."
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
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Status</div>
          <div className="mt-1 text-lg font-semibold">{openClock ? "On the clock" : "Off the clock"}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Jobs today</div>
          <div className="mt-1 text-lg font-semibold">{todayJobs.length}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Hours this week</div>
          <div className="mt-1 text-lg font-semibold">{Math.round(weekHours * 10) / 10}</div>
        </div>
      </div>
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Company</th>
              <th>Scheduled</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mine.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">{row.title}</td>
                <td>{row.companyName}</td>
                <td>{row.scheduled}</td>
                <td>
                  <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                </td>
              </tr>
            ))}
            {!mine.length ? (
              <tr>
                <td colSpan={4} className="empty-row">
                  No open jobs assigned to you.{" "}
                  <Link href="/app/work-orders" className="font-medium text-[var(--color-navy)]">
                    Open work orders
                  </Link>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
