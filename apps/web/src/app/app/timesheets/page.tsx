"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { FilterChips, PageHeader, SideRail, StatusPill, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

const FILTERS = ["All", "Draft", "Submitted", "Approved", "Rejected"];

export default function TimesheetsPage() {
  const { user } = useAuth();
  const entries = useAppStore((s) => s.timeEntries);
  const submit = useAppStore((s) => s.submitTimeEntry);
  const approve = useAppStore((s) => s.approveTimeEntry);
  const reject = useAppStore((s) => s.rejectTimeEntry);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [createKind, setCreateKind] = useState<CreateKind>(null);

  const canApprove = !!user && (user.role === "admin" || user.role === "pm" || user.role === "finance");
  const staffOnly = user?.role === "staff";

  const rows = useMemo(() => {
    return entries
      .filter((e) => (staffOnly ? e.userName === user?.name || e.userName === "J. Kim" : true))
      .filter((e) => (filter === "All" ? true : e.status === filter))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, staffOnly, user?.name, filter]);

  const totalHours = rows.reduce((s, e) => s + e.hours, 0);
  const approvedValue = rows
    .filter((e) => e.status === "Approved")
    .reduce((s, e) => {
      return s + e.hours * 180;
    }, 0);

  if (!user) return null;

  return (
    <div className="fade-in">
      <PageHeader
        title="Timesheets"
        subtitle="Log hours, submit for approval, and keep billing ready."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setCreateKind("time")}>
            <Plus size={16} /> Log time
          </button>
        }
      />
      <FilterChips items={FILTERS} active={filter} onChange={setFilter} />
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Person</th>
                <th>Project</th>
                <th>Note</th>
                <th>Hours</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td>{e.userName}</td>
                  <td>{e.projectName}</td>
                  <td className="text-[var(--color-muted)]">{e.note || e.taskName || "-"}</td>
                  <td className="tabular-nums font-semibold">{e.hours.toFixed(2)}h</td>
                  <td>
                    <StatusPill tone={statusTone(e.status)}>{e.status}</StatusPill>
                  </td>
                  <td className="text-right">
                    {e.status === "Draft" && (e.userName === user.name || e.userName === "J. Kim" || !staffOnly) ? (
                      <button type="button" className="btn btn-ghost text-sm" onClick={() => submit(e.id)}>
                        Submit
                      </button>
                    ) : null}
                    {e.status === "Submitted" && canApprove ? (
                      <span className="inline-flex gap-1">
                        <button type="button" className="btn btn-primary text-sm" onClick={() => approve(e.id)}>
                          Approve
                        </button>
                        <button type="button" className="btn btn-ghost text-sm" onClick={() => reject(e.id)}>
                          Reject
                        </button>
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? (
            <p className="p-6 text-sm text-[var(--color-muted)]">
              No time entries for this filter. Log time here or stop the timer in the top bar.
            </p>
          ) : null}
        </div>
        <div className="space-y-4">
          <SideRail title="This view">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Entries</span>
                <span className="font-semibold">{rows.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Hours</span>
                <span className="font-semibold tabular-nums">{totalHours.toFixed(2)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Approved value</span>
                <span className="font-semibold tabular-nums">{money(approvedValue)}</span>
              </div>
            </div>
          </SideRail>
          <SideRail title="Tips">
            <p className="text-sm text-[var(--color-muted)]">
              Start the timer from the clock icon, then Stop and log to create a draft entry.
            </p>
          </SideRail>
        </div>
      </div>
      <CreateForms kind={createKind} onClose={() => setCreateKind(null)} />
    </div>
  );
}
