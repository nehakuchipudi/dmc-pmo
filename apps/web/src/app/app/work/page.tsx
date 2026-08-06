"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { Avatar, FilterChips, PageHeader, StatusPill, statusTone } from "@/components/ui";
import type { TaskStatus } from "@/lib/types";
import { formatDisplayDate } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

const BOARDS = ["Status Board", "Assignee Board", "Deadline Board"];
const STATUS_COLS: TaskStatus[] = ["Not Started", "In Progress", "Review", "Done"];

export default function WorkPage() {
  const tasks = useAppStore((s) => s.tasks);
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus);
  const [board, setBoard] = useState("Status Board");
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const columns = useMemo(() => {
    if (board === "Assignee Board") {
      const assignees = Array.from(new Set(tasks.map((t) => t.assignee)));
      return assignees.map((assignee) => ({
        key: assignee,
        title: assignee,
        items: tasks.filter((t) => t.assignee === assignee),
      }));
    }
    if (board === "Deadline Board") {
      const buckets = [
        { key: "This week", title: "Due this week", test: (d: string) => d <= "2026-08-12" },
        { key: "Next week", title: "Due next week", test: (d: string) => d > "2026-08-12" && d <= "2026-08-19" },
        { key: "Later", title: "Later", test: (d: string) => d > "2026-08-19" },
      ];
      return buckets.map((b) => ({
        key: b.key,
        title: b.title,
        items: tasks.filter((t) => b.test(t.due)),
      }));
    }
    return STATUS_COLS.map((status) => ({
      key: status,
      title: status,
      items: tasks.filter((t) => t.status === status),
    }));
  }, [board, tasks]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Work"
        subtitle="Tasks and activities across every engagement."
        actions={
          <>
            <Link href="/app/timesheets" className="btn btn-ghost">Daily Timesheet</Link>
            <button type="button" className="btn btn-primary" onClick={() => setCreateKind("task")}>
              <Plus size={16} /> New Task
            </button>
          </>
        }
      />
      <FilterChips items={BOARDS} active={board} onChange={setBoard} />
      <div className="kanban" style={{ gridTemplateColumns: `repeat(${Math.min(columns.length, 4)}, minmax(200px, 1fr))` }}>
        {columns.map((col) => (
          <div
            key={col.key}
            className="kanban-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (!dragId || board !== "Status Board") return;
              if (STATUS_COLS.includes(col.key as TaskStatus)) {
                updateTaskStatus(dragId, col.key as TaskStatus);
              }
              setDragId(null);
            }}
          >
            <div className="mb-3 flex items-center justify-between text-sm font-semibold text-[var(--color-navy)]">
              <span>{col.title}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-[var(--color-muted)]">{col.items.length}</span>
            </div>
            {col.items.map((task) => (
              <div
                key={task.id}
                className="kanban-card"
                draggable={board === "Status Board"}
                onDragStart={() => setDragId(task.id)}
              >
                <div className="font-medium">{task.name}</div>
                <div className="mt-1 text-xs text-[var(--color-muted)]">{task.projectName}</div>
                <div className="mt-2"><StatusPill tone={statusTone(task.status)}>{task.status}</StatusPill></div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-[var(--color-muted)]">{formatDisplayDate(task.due)}</span>
                  <Avatar initials={task.assigneeInitials} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {board === "Status Board" ? (
        <p className="mt-3 text-xs text-[var(--color-muted)]">Drag cards between status columns to update task status.</p>
      ) : (
        <p className="mt-3 text-xs text-[var(--color-muted)]">Switch to Status Board to drag and update workflow state.</p>
      )}
      <CreateForms kind={createKind} onClose={() => setCreateKind(null)} />
    </div>
  );
}
