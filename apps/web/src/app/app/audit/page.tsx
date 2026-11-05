"use client";

import { useMemo } from "react";
import { PageHeader, StatusPill, statusTone } from "@/components/ui";
import { useAppStore } from "@/lib/store";

export default function AuditTrailPage() {
  const activities = useAppStore((s) => s.activities);
  const emailOutbox = useAppStore((s) => s.emailOutbox);
  const notifications = useAppStore((s) => s.notifications);
  const rows = useMemo(
    () =>
      [
        ...activities.map((row) => ({
          id: `act-${row.id}`,
          when: row.when,
          kind: "Activity",
          title: row.text,
          status: row.type ?? row.action ?? "Note",
        })),
        ...emailOutbox.map((row) => ({
          id: `mail-${row.id}`,
          when: row.sentAt,
          kind: "Email",
          title: `${row.subject} · ${row.to}`,
          status: row.status,
        })),
        ...notifications.map((row) => ({
          id: `note-${row.id}`,
          when: row.createdAt,
          kind: "Notice",
          title: row.title,
          status: row.read ? "Read" : "Unread",
        })),
      ]
        .sort((a, b) => String(b.when).localeCompare(String(a.when)))
        .slice(0, 80),
    [activities, emailOutbox, notifications],
  );

  return (
    <div className="fade-in">
      <PageHeader title="Audit Trail" subtitle="Activity, outbound mail, and workspace notices in one log." />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Kind</th>
              <th>Detail</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.when}</td>
                <td>{row.kind}</td>
                <td className="font-medium">{row.title}</td>
                <td>
                  <StatusPill tone={statusTone(String(row.status))}>{row.status}</StatusPill>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={4} className="empty-row">
                  No audit rows yet. Create a company, send an invite, or post a note.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
