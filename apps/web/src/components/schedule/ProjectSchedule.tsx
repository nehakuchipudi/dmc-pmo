"use client";

import { startTransition, useMemo, useState } from "react";
import { GanttBoard } from "@/components/Gantt";
import type { Milestone, Task, TaskPriority, TaskStatus } from "@/lib/types";
import { initialsFromName } from "@/lib/seed";

const ASSIGNEES = ["M. Doyle", "J. Kim", "S. Ahmed", "S. Cho", "J. Alvarez"];
const PRIORITIES: TaskPriority[] = ["Critical", "High", "Med", "Low"];
const STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Review", "Done"];

export function ProjectSchedule({
  milestones,
  tasks,
  onAddMilestone,
  onAddTask,
  onUpdateTask,
  onUpdateMilestone,
  onDeleteTask,
}: {
  milestones: Milestone[];
  tasks: Task[];
  onAddMilestone: () => void;
  onAddTask: (milestoneId?: string) => void;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
  onUpdateMilestone: (id: string, patch: Partial<Milestone>) => void;
  onDeleteTask: (id: string) => void;
}) {
  const [view, setView] = useState<"List" | "Gantt">("List");
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (t: Task) => !q || t.name.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q);
    const byMs = milestones.map((m) => ({
      milestone: m,
      tasks: tasks.filter((t) => t.milestoneId === m.id && match(t)),
    }));
    const ungrouped = {
      milestone: null as Milestone | null,
      tasks: tasks.filter((t) => !t.milestoneId && match(t)),
    };
    return [...byMs, ungrouped];
  }, [milestones, tasks, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Project schedule</h2>
          <p className="text-sm text-[var(--color-muted)]">Manage milestones, tasks, and timeline.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onAddMilestone}>
          + Add milestone
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="field-input max-w-md flex-1"
          placeholder="Search tasks and milestones..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-white p-1">
          {(["List", "Gantt"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                view === v ? "bg-[var(--color-navy)] text-white" : "text-[var(--color-muted)]"
              }`}
              onClick={() => startTransition(() => setView(v))}
            >
              {v} view
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-fog)] px-3 py-2 text-sm text-[var(--color-ink)]">
        Click any field to edit. Switch to Gantt for the timeline view (soft flat colors, no gradients).
      </div>

      {view === "List" ? (
        <div className="space-y-4">
          {groups.map((g) => {
            const key = g.milestone?.id ?? "ungrouped";
            const isCollapsed = collapsed[key];
            const done = g.tasks.filter((t) => t.status === "Done").length;
            const pct = g.tasks.length ? Math.round((done / g.tasks.length) * 100) : 0;
            return (
              <section key={key} className="schedule-group">
                <header className="schedule-group-head">
                  <button
                    type="button"
                    className="schedule-collapse"
                    onClick={() => setCollapsed((c) => ({ ...c, [key]: !c[key] }))}
                    aria-label="Toggle group"
                  >
                    {isCollapsed ? "▸" : "▾"}
                  </button>
                  <span className="schedule-diamond" />
                  {g.milestone ? (
                    <input
                      className="schedule-title-input"
                      value={g.milestone.name}
                      onChange={(e) => onUpdateMilestone(g.milestone!.id, { name: e.target.value })}
                    />
                  ) : (
                    <span className="font-semibold">Ungrouped tasks</span>
                  )}
                  <div className="ml-auto flex items-center gap-3">
                    <div className="schedule-progress">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm tabular-nums text-[var(--color-muted)]">
                      {pct}% · {done}/{g.tasks.length} tasks
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost text-sm"
                      onClick={() => onAddTask(g.milestone?.id)}
                    >
                      + Add task
                    </button>
                  </div>
                </header>
                {!isCollapsed ? (
                  <div className="overflow-x-auto">
                    <table className="schedule-table">
                      <thead>
                        <tr>
                          <th>Task name</th>
                          <th>Assignee</th>
                          <th>Start</th>
                          <th>Due</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Progress</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {g.tasks.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={t.status === "Done"}
                                  onChange={(e) =>
                                    onUpdateTask(t.id, {
                                      status: e.target.checked ? "Done" : "In Progress",
                                      progress: e.target.checked ? 100 : Math.min(t.progress, 90),
                                    })
                                  }
                                />
                                <input
                                  className="schedule-cell-input font-medium"
                                  value={t.name}
                                  onChange={(e) => onUpdateTask(t.id, { name: e.target.value })}
                                />
                              </label>
                            </td>
                            <td>
                              <select
                                className="schedule-select"
                                value={t.assignee}
                                onChange={(e) =>
                                  onUpdateTask(t.id, {
                                    assignee: e.target.value,
                                    assigneeInitials: initialsFromName(e.target.value),
                                  })
                                }
                              >
                                {ASSIGNEES.map((a) => (
                                  <option key={a} value={a}>
                                    {a}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="date"
                                className="schedule-select"
                                value={t.start}
                                onChange={(e) => onUpdateTask(t.id, { start: e.target.value })}
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                className="schedule-select"
                                value={t.due}
                                onChange={(e) => onUpdateTask(t.id, { due: e.target.value })}
                              />
                            </td>
                            <td>
                              <select
                                className={`schedule-select prio-${t.priority.toLowerCase()}`}
                                value={t.priority}
                                onChange={(e) => onUpdateTask(t.id, { priority: e.target.value as TaskPriority })}
                              >
                                {PRIORITIES.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                className={`status-chip status-${t.status.replace(/\s/g, "").toLowerCase()}`}
                                value={t.status}
                                onChange={(e) => onUpdateTask(t.id, { status: e.target.value as TaskStatus })}
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={5}
                                  value={t.progress}
                                  onChange={(e) => onUpdateTask(t.id, { progress: Number(e.target.value) })}
                                />
                                <span className="w-10 text-xs tabular-nums">{t.progress}%</span>
                              </div>
                            </td>
                            <td>
                              <button type="button" className="btn btn-ghost text-sm" onClick={() => onDeleteTask(t.id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!g.tasks.length ? (
                          <tr>
                            <td colSpan={8} className="text-[var(--color-muted)]">
                              No tasks in this group.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : (
        <GanttBoard milestones={milestones} tasks={tasks} onUpdateTask={onUpdateTask} />
      )}
    </div>
  );
}
