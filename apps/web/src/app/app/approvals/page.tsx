"use client";

import { PageHeader, StatusPill, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";

export default function ApprovalCenterPage() {
  const { can } = useAuth();
  const workOrders = useAppStore((s) => s.workOrders);
  const updateWorkOrder = useAppStore((s) => s.updateWorkOrder);
  const pending = workOrders.filter((row) => row.status === "Pending approval");
  const canDecide = can("manage_service_ops");

  return (
    <div className="fade-in">
      <PageHeader
        title="Approval Center"
        subtitle="Review completed field work before it closes."
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Work order</th>
              <th>Company</th>
              <th>Assignee</th>
              <th>Scheduled</th>
              <th>Priority</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pending.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">{row.title}</td>
                <td>{row.companyName}</td>
                <td>{row.assignee || "Unassigned"}</td>
                <td>{row.scheduled}</td>
                <td>
                  <StatusPill tone={statusTone(row.priority)}>{row.priority}</StatusPill>
                </td>
                <td className="text-right space-x-2">
                  {canDecide ? (
                    <>
                      <button type="button" className="btn btn-primary text-sm" onClick={() => updateWorkOrder(row.id, { status: "Completed" })}>
                        Approve
                      </button>
                      <button type="button" className="btn btn-ghost text-sm" onClick={() => updateWorkOrder(row.id, { status: "Sent back" })}>
                        Send back
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-[var(--color-muted)]">Waiting on a manager</span>
                  )}
                </td>
              </tr>
            ))}
            {!pending.length ? (
              <tr>
                <td colSpan={6} className="empty-row">
                  Nothing waiting for approval.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
