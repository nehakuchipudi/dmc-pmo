"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/ui";
import { clockHours } from "@/lib/service-ops";
import { useAppStore } from "@/lib/store";

export default function SchedulingPage() {
  const team = useAppStore((s) => s.team);
  const workOrders = useAppStore((s) => s.workOrders);
  const fieldClocks = useAppStore((s) => s.fieldClocks);
  const allocations = useAppStore((s) => s.allocations);

  const rows = useMemo(() => {
    return team
      .filter((member) => member.active && member.role !== "client")
      .map((member) => {
        const jobs = workOrders.filter((row) => row.assignee === member.name && row.status !== "Completed");
        const clocks = fieldClocks.filter((row) => row.memberName === member.name);
        const clocked = clocks.reduce((sum, row) => sum + (row.hours ?? (row.stoppedAt ? 0 : clockHours(row.startedAt))), 0);
        const booked = allocations
          .filter((row) => row.memberName === member.name)
          .reduce((sum, row) => sum + (row.hoursPerWeek ?? 0), 0);
        return {
          id: member.id,
          name: member.name,
          role: member.role,
          jobs: jobs.length,
          hours: jobs.length * 2 + booked,
          clocked: Math.round(clocked * 10) / 10,
          live: clocks.some((row) => !row.stoppedAt),
        };
      });
  }, [team, workOrders, fieldClocks, allocations]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Scheduling"
        subtitle="See who is booked for field work and who is already on the clock."
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Open jobs</th>
              <th>Booked hours</th>
              <th>Clocked hours</th>
              <th>Now</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-[var(--color-muted)]">{row.role}</div>
                </td>
                <td>{row.jobs}</td>
                <td>{row.hours}</td>
                <td>{row.clocked}</td>
                <td>{row.live ? "On site" : "Available"}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="empty-row">
                  Add people in Settings, Users & roles, to schedule a crew.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
