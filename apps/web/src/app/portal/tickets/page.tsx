"use client";

import { tickets } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { PageHeader, StatusPill, statusTone } from "@/components/ui";

export default function PortalTicketsPage() {
  const { user } = useAuth();
  const rows = tickets.filter((t) => t.companyId === user?.companyId);

  return (
    <div className="fade-in">
      <PageHeader
        title="Tickets"
        subtitle="Raise and track support requests for your company only."
        actions={
          <button type="button" className="btn btn-primary">
            + Raise a Ticket
          </button>
        }
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Priority</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="font-medium">#{t.number} {t.subject}</td>
                <td><StatusPill tone={statusTone(t.priority)}>{t.priority}</StatusPill></td>
                <td>{t.submitted}</td>
                <td><StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-[var(--color-muted)]">
        Internal notes, cost rates, and other companies are never shown in the client portal.
      </p>
    </div>
  );
}
