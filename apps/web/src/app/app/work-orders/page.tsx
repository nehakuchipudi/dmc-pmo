"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { WorkOrderEditor } from "@/components/service-ops/WorkOrderEditor";
import { FilterChips, PageHeader, StatusPill, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { WORK_ORDER_PRIORITIES, WORK_ORDER_STATUSES, workOrderActions } from "@/lib/service-ops";
import { useAppStore } from "@/lib/store";

export default function WorkOrdersPage() {
  const { can } = useAuth();
  const workOrders = useAppStore((s) => s.workOrders);
  const updateWorkOrder = useAppStore((s) => s.updateWorkOrder);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const rows = useMemo(
    () =>
      workOrders.filter(
        (row) => (status === "All" || row.status === status) && (priority === "All" || row.priority === priority),
      ),
    [workOrders, status, priority],
  );

  return (
    <div className="fade-in">
      <PageHeader
        title="Work Orders"
        subtitle="Create, filter, and progress every field job."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> New work order
          </button>
        }
      />
      <FilterChips items={["All", ...WORK_ORDER_STATUSES]} active={status} onChange={setStatus} />
      <FilterChips items={["All", ...WORK_ORDER_PRIORITIES]} active={priority} onChange={setPriority} />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Work order</th>
              <th>Company</th>
              <th>Assignee</th>
              <th>Scheduled</th>
              <th>Priority</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">{row.title}</td>
                <td>{row.companyName}</td>
                <td>{row.assignee || "Unassigned"}</td>
                <td>{row.scheduled}</td>
                <td>
                  <StatusPill tone={statusTone(row.priority)}>{row.priority}</StatusPill>
                </td>
                <td>
                  <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                </td>
                <td className="text-right space-x-2">
                  {workOrderActions(row.status)
                    .filter((action) => !action.manage || can("manage_service_ops"))
                    .map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        className="btn btn-ghost text-sm"
                        onClick={() => updateWorkOrder(row.id, { status: action.next })}
                      >
                        {action.label}
                      </button>
                    ))}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  No work orders match those filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <WorkOrderEditor open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
