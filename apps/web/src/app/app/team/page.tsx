"use client";

import { PageHeader, StatusPill } from "@/components/ui";
import { IfCan } from "@/components/auth/IfCan";
import { roleLabel, useAuth } from "@/lib/auth";
import { clockHours } from "@/lib/service-ops";
import { useAppStore } from "@/lib/store";

export default function TeamManagementPage() {
  const { can } = useAuth();
  const team = useAppStore((s) => s.team);
  const fieldClocks = useAppStore((s) => s.fieldClocks);
  const workOrders = useAppStore((s) => s.workOrders);
  const inviteTeamMember = useAppStore((s) => s.inviteTeamMember);
  const rows = team.filter((member) => member.role !== "client");

  return (
    <div className="fade-in">
      <PageHeader
        title="Team Management"
        subtitle="See who is on the crew, who is invited, and who is on a live clock."
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Role</th>
              <th>Open jobs</th>
              <th>Clock</th>
              <th>Hours</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((member) => {
              const open = fieldClocks.find((row) => row.memberName === member.name && !row.stoppedAt);
              const hours = fieldClocks
                .filter((row) => row.memberName === member.name)
                .reduce((sum, row) => sum + (row.hours ?? (row.stoppedAt ? 0 : clockHours(row.startedAt))), 0);
              const jobs = workOrders.filter((row) => row.assignee === member.name && row.status !== "Completed").length;
              return (
                <tr key={member.id}>
                  <td>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-[var(--color-muted)]">{member.email}</div>
                  </td>
                  <td>{roleLabel(member.role)}</td>
                  <td>{jobs}</td>
                  <td>{open ? "On site" : "Off"}</td>
                  <td>{Math.round(hours * 10) / 10}</td>
                  <td>
                    <StatusPill tone={member.active ? "success" : "neutral"}>{member.active ? "Active" : "Inactive"}</StatusPill>
                    {member.invitedAt ? <div className="mt-1 text-xs text-[var(--color-muted)]">Invited {member.invitedAt}</div> : null}
                  </td>
                  <td className="text-right">
                    {can("manage_users") ? (
                      <button type="button" className="btn btn-ghost text-sm" onClick={() => inviteTeamMember(member.id)}>
                        {member.invitedAt ? "Resend invite" : "Send invite"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  No team members yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <IfCan cap="manage_users">
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Add or deactivate people in Settings, Users & roles. Role packs live in Role Management.
        </p>
      </IfCan>
    </div>
  );
}
