"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { WorkOrderEditor } from "@/components/service-ops/WorkOrderEditor";
import { PageHeader, StatusPill, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { WORK_ORDER_STATUSES, workOrderActions } from "@/lib/service-ops";
import { useAppStore } from "@/lib/store";

export default function WorkJourneyPage() {
  const { can } = useAuth();
  const workOrders = useAppStore((s) => s.workOrders);
  const updateWorkOrder = useAppStore((s) => s.updateWorkOrder);
  const [open, setOpen] = useState(false);

  return (
    <div className="fade-in">
      <PageHeader
        title="Work Journey"
        subtitle="Move field jobs from scheduled to approved without leaving the board."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> New work order
          </button>
        }
      />
      <div className="kanban" style={{ gridTemplateColumns: `repeat(${WORK_ORDER_STATUSES.length}, minmax(180px, 1fr))` }}>
        {WORK_ORDER_STATUSES.map((status) => {
          const items = workOrders.filter((row) => row.status === status);
          return (
            <div key={status} className="kanban-col">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-semibold">{status}</div>
                <span className="text-xs text-[var(--color-muted)]">{items.length}</span>
              </div>
              {items.map((row) => (
                <div key={row.id} className="panel panel-hover mb-2 p-3">
                  <div className="font-medium">{row.title}</div>
                  <div className="mt-1 text-xs text-[var(--color-muted)]">
                    {row.companyName} · {row.assignee || "Unassigned"} · {row.scheduled}
                  </div>
                  <div className="mt-2">
                    <StatusPill tone={statusTone(row.priority)}>{row.priority}</StatusPill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
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
                  </div>
                </div>
              ))}
              {!items.length ? <p className="text-sm text-[var(--color-muted)]">None.</p> : null}
            </div>
          );
        })}
      </div>
      <WorkOrderEditor open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
