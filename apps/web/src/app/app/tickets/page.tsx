"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { FilterChips, PageHeader, SideRail, StatusPill, statusTone } from "@/components/ui";
import { formatDisplayDate } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

const FILTERS = [
  "All Open Tickets",
  "Recently Created",
  "Assigned To Me",
  "Unassigned",
  "Classic Lists",
];

export default function TicketsPage() {
  const tickets = useAppStore((s) => s.tickets);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const rows = useMemo(() => {
    if (filter === "Unassigned") return tickets.filter((t) => t.assignee === "Unassigned");
    if (filter === "Assigned To Me") return tickets.filter((t) => t.assignee === "J. Kim");
    if (filter === "Recently Created") return [...tickets].sort((a, b) => b.submitted.localeCompare(a.submitted));
    if (filter === "All Open Tickets") return tickets.filter((t) => t.status !== "Resolved");
    return tickets;
  }, [filter, tickets]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Tickets"
        subtitle="Support and service requests across all clients."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setCreateKind("ticket")}>
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
                  <td>
                    <Link href={`/app/tickets/view/?id=${t.id}`} className="font-medium text-[var(--color-navy)]">
                      #{t.number} {t.subject}
                    </Link>
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
            <li><Link href="/app/reports" className="hover:underline">Tickets Dashboard</Link></li>
            <li><Link href="/app/timesheets" className="hover:underline">Ticket Timesheet Overview</Link></li>
            <li><button type="button" className="hover:underline" onClick={() => setFilter("Assigned To Me")}>Managed By Me</button></li>
          </ul>
          <p className="mt-4 text-xs text-[var(--color-muted)]">Submitted {formatDisplayDate("2026-08-05")}</p>
        </SideRail>
      </div>
      <CreateForms kind={createKind} onClose={() => setCreateKind(null)} />
    </div>
  );
}
