"use client";

import { useMemo, useState } from "react";
import { FilterChips, PageHeader, StatusPill, statusTone } from "@/components/ui";
import { addDaysIso } from "@/lib/service-ops";
import { useAppStore } from "@/lib/store";

const VIEWS = ["Day", "Week", "Month"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function WorkSchedulePage() {
  const workOrders = useAppStore((s) => s.workOrders);
  const recurringServices = useAppStore((s) => s.recurringServices);
  const tasks = useAppStore((s) => s.tasks);
  const [view, setView] = useState("Week");
  const start = todayIso();
  const end = view === "Day" ? start : view === "Week" ? addDaysIso(start, 6) : addDaysIso(start, 30);

  const items = useMemo(() => {
    const jobs = workOrders
      .filter((row) => row.scheduled >= start && row.scheduled <= end)
      .map((row) => ({
        id: row.id,
        when: row.scheduled,
        title: row.title,
        detail: `${row.companyName} · ${row.assignee || "Unassigned"}`,
        kind: "Work order",
        status: row.status,
      }));
    const recurring = recurringServices
      .filter((row) => !row.paused && row.nextOn >= start && row.nextOn <= end)
      .map((row) => ({
        id: row.id,
        when: row.nextOn,
        title: row.title,
        detail: `${row.companyName} · ${row.frequency}`,
        kind: "Recurring",
        status: "Scheduled",
      }));
    const work = tasks
      .filter((row) => row.status !== "Done" && row.due >= start && row.due <= end)
      .map((row) => ({
        id: row.id,
        when: row.due,
        title: row.name,
        detail: row.projectName,
        kind: "Task",
        status: row.status,
      }));
    return [...jobs, ...recurring, ...work].sort((a, b) => a.when.localeCompare(b.when) || a.title.localeCompare(b.title));
  }, [workOrders, recurringServices, tasks, start, end]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Work Schedule"
        subtitle={`Jobs, recurring visits, and tasks from ${start} through ${end}.`}
      />
      <FilterChips items={VIEWS} active={view} onChange={setView} />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Item</th>
              <th>Detail</th>
              <th>Kind</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={`${row.kind}-${row.id}`}>
                <td>{row.when}</td>
                <td className="font-medium">{row.title}</td>
                <td>{row.detail}</td>
                <td>{row.kind}</td>
                <td>
                  <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={5} className="empty-row">
                  Nothing scheduled in this window.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
