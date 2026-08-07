"use client";

import { useMemo, useState } from "react";
import { formatDisplayDate } from "@/lib/seed";
import type { Milestone, Task, TaskStatus } from "@/lib/types";

function toTime(iso: string) {
  return new Date(`${iso}T12:00:00`).getTime();
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function statusColor(status: TaskStatus | Milestone["status"]) {
  switch (status) {
    case "Done":
    case "Approved":
      return "#7BA891";
    case "In Progress":
    case "Awaiting Signoff":
      return "#D4A574";
    case "Review":
      return "#8B8FB8";
    case "Not Started":
    default:
      return "#6B8FB5";
  }
}

export function GanttBoard({
  milestones,
  tasks,
  onUpdateTask,
}: {
  milestones: Milestone[];
  tasks: Task[];
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [scale, setScale] = useState<"Days" | "Weeks">("Days");

  const bounds = useMemo(() => {
    const starts = [...milestones.map((m) => m.start), ...tasks.map((t) => t.start)];
    const ends = [...milestones.map((m) => m.due), ...tasks.map((t) => t.due)];
    if (!starts.length) {
      const today = new Date().toISOString().slice(0, 10);
      return { start: today, end: addDays(today, 21) };
    }
    const start = starts.sort()[0];
    const end = ends.sort().slice(-1)[0];
    return { start, end };
  }, [milestones, tasks]);

  const span = Math.max(toTime(bounds.end) - toTime(bounds.start), 1);
  const dayCount = Math.max(Math.ceil(span / 86400000) + 1, 14);
  const ticks = Array.from({ length: Math.min(dayCount, scale === "Days" ? 21 : 10) }, (_, i) => {
    const step = scale === "Days" ? i : i * 7;
    return addDays(bounds.start, step);
  });

  function styleFor(a: string, b: string) {
    const left = ((toTime(a) - toTime(bounds.start)) / span) * 100;
    const width = Math.max(((toTime(b) - toTime(a)) / span) * 100, 2.5);
    return { left: `${Math.max(0, left)}%`, width: `${width}%` };
  }

  const selectedTask = tasks.find((t) => t.id === selected);

  return (
    <div className="gantt-board">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-[var(--color-muted)]">
          {formatDisplayDate(bounds.start)} to {formatDisplayDate(bounds.end)}
        </div>
        <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-white p-1">
          {(["Days", "Weeks"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`rounded-md px-3 py-1 text-sm font-semibold ${scale === s ? "bg-[var(--color-navy)] text-white" : "text-[var(--color-muted)]"}`}
              onClick={() => setScale(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="gantt-grid">
        <div className="gantt-sidebar">
          <div className="gantt-side-head">Item</div>
          {milestones.map((m) => (
            <div key={m.id} className="gantt-side-row gantt-side-ms">
              ◆ {m.name}
            </div>
          ))}
          {tasks.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`gantt-side-row ${selected === t.id ? "active" : ""}`}
              onClick={() => setSelected(t.id)}
            >
              <div className="truncate font-medium">{t.name}</div>
              <div className="text-xs text-[var(--color-muted)]">
                {formatDisplayDate(t.start)} to {formatDisplayDate(t.due)}
              </div>
            </button>
          ))}
        </div>
        <div className="gantt-timeline">
          <div className="gantt-ticks" style={{ gridTemplateColumns: `repeat(${ticks.length}, minmax(42px, 1fr))` }}>
            {ticks.map((d) => (
              <div key={d} className="gantt-tick">
                {d.slice(5)}
              </div>
            ))}
          </div>
          {milestones.map((m) => (
            <div key={m.id} className="gantt-lane">
              <div
                className="gantt-diamond"
                style={{ left: styleFor(m.due, m.due).left, background: statusColor(m.status) }}
                title={`${m.name} · ${formatDisplayDate(m.due)}`}
              />
            </div>
          ))}
          {tasks.map((t) => (
            <div key={t.id} className="gantt-lane">
              <button
                type="button"
                className="gantt-bar-flat"
                style={{ ...styleFor(t.start, t.due), background: statusColor(t.status) }}
                onClick={() => setSelected(t.id)}
                title={`${t.name}: ${formatDisplayDate(t.start)} to ${formatDisplayDate(t.due)}`}
              >
                <span>{t.name}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedTask ? (
        <div className="gantt-editor">
          <div className="font-semibold">{selectedTask.name}</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-[var(--color-muted)]">Start</span>
              <input
                type="date"
                className="field-input"
                value={selectedTask.start}
                onChange={(e) => onUpdateTask(selectedTask.id, { start: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-[var(--color-muted)]">Due</span>
              <input
                type="date"
                className="field-input"
                value={selectedTask.due}
                onChange={(e) => onUpdateTask(selectedTask.id, { due: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-[var(--color-muted)]">Status</span>
              <select
                className="field-input"
                value={selectedTask.status}
                onChange={(e) => onUpdateTask(selectedTask.id, { status: e.target.value as TaskStatus })}
              >
                {["Not Started", "In Progress", "Review", "Done"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" className="btn btn-ghost mt-2 text-sm" onClick={() => setSelected(null)}>
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated use GanttBoard */
export function GanttView({
  milestones,
  tasks,
}: {
  project?: unknown;
  milestones: Milestone[];
  tasks: Task[];
}) {
  return <GanttBoard milestones={milestones} tasks={tasks} onUpdateTask={() => undefined} />;
}
