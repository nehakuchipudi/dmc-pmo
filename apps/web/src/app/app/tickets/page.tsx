"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { tickets } from "@/lib/data";
import { FilterChips, PageHeader, SideRail, StatusPill, statusTone } from "@/components/ui";

const FILTERS = [
  "All Open Tickets",
  "Recently Created",
  "Assigned To Me",
  "Reported By Me",
  "Unassigned",
  "Classic Lists",
];

export default function TicketsPage() {
  const [filter, setFilter] = useState(FILTERS[0]);
  const rows = useMemo(() => {
    if (filter === "Unassigned") return tickets.filter((t) => t.assignee === "Unassigned");
    if (filter === "Assigned To Me") return tickets.filter((t) => t.assignee === "J. Kim");
    return tickets;
  }, [filter]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Tickets"
        subtitle="Support and service requests across all clients."
        actions={
          <button type="button" className="btn btn-primary">
            <Plus size={16} /> New Ticket
          </button>
        }
      />
      <FilterChips items={FILTERS} active={filter} onChange={setFilter} />
      <div className="grid gap-4 lg:grid-cols-[1fr_250px]">
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Company</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>SLA Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium text-[var(--color-navy)]">
                    #{t.number} {t.subject}
                  </td>
                  <td>{t.companyName}</td>
                  <td><StatusPill tone={statusTone(t.priority)}>{t.priority}</StatusPill></td>
                  <td>{t.assignee}</td>
                  <td>{t.slaDue}</td>
                  <td><StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SideRail title="Shortcuts & Signoffs">
          <ul className="space-y-2 text-sm">
            {[
              "Tickets Dashboard",
              "Ticket Stream",
              "Ticket Timesheet Overview",
              "Reports",
              "Ticket Signoffs",
              "Managed By Me",
            ].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </SideRail>
      </div>
    </div>
  );
}
