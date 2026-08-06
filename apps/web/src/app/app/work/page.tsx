"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { tasks } from "@/lib/data";
import type { TaskStatus } from "@/lib/types";
import { Avatar, FilterChips, PageHeader } from "@/components/ui";

const BOARDS = ["Assignee Board", "Status Board", "Deadline Board"];
const COLUMNS: TaskStatus[] = ["Not Started", "In Progress", "Review", "Done"];

export default function WorkPage() {
  const [board, setBoard] = useState("Status Board");
  const grouped = useMemo(() => {
    return COLUMNS.map((status) => ({
      status,
      items: tasks.filter((t) => t.status === status),
    }));
  }, []);

  return (
    <div className="fade-in">
      <PageHeader
        title="Work: Status Task Board"
        subtitle="Tasks & Activities · grouped by Status."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost">My Schedule</button>
            <button type="button" className="btn btn-ghost">Daily Timesheet</button>
            <button type="button" className="btn btn-primary">
              <Plus size={16} /> New Task
            </button>
          </div>
        }
      />
      <FilterChips items={BOARDS} active={board} onChange={setBoard} />
      <div className="kanban">
        {grouped.map((col) => (
          <div key={col.status} className="kanban-col">
            <div className="mb-3 flex items-center justify-between text-sm font-semibold text-[var(--color-navy)]">
              <span>{col.status}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-[var(--color-muted)]">
                {col.items.length}
              </span>
            </div>
            {col.items.map((task) => (
              <div key={task.id} className="kanban-card">
                <div className="font-medium text-[var(--color-text)]">{task.name}</div>
                <div className="mt-1 text-xs text-[var(--color-muted)]">{task.projectName}</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs ${task.dueLabel?.includes("Due") ? "text-[var(--color-danger)]" : "text-[var(--color-muted)]"}`}>
                    {task.dueLabel ?? ""}
                  </span>
                  <Avatar initials={task.assigneeInitials} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
