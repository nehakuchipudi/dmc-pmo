"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Minus, Plus, Search } from "lucide-react";
import { formatDisplayDate } from "@/lib/seed";
import type { Milestone, Task, TaskStatus } from "@/lib/types";

const PHASE_COLORS = ["#A66B6B", "#C4845A", "#6F8F75", "#6B8AAB", "#8B8FB8"];

function toTime(iso: string) {
  return new Date(`${iso}T12:00:00`).getTime();
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function durationDays(start: string, due: string) {
  return Math.max(1, Math.round((toTime(due) - toTime(start)) / 86400000) + 1);
}

function statusColor(status: TaskStatus | Milestone["status"], phaseColor: string) {
  switch (status) {
    case "Done":
    case "Approved":
      return "#6F8F75";
    case "In Progress":
    case "Awaiting Signoff":
      return phaseColor;
    case "Review":
      return "#8B8FB8";
    case "Not Started":
    default:
      return phaseColor;
  }
}

type Row =
  | { type: "phase"; id: string; phase: Milestone; color: string; start: string; due: string; tasks: Task[] }
  | { type: "group"; id: string; group: Milestone; color: string; start: string; due: string; tasks: Task[] }
  | { type: "task"; id: string; task: Task; color: string; phaseId: string };

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
  const [zoom, setZoom] = useState(42);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const phases = useMemo(
    () => milestones.filter((m) => m.kind === "phase" || (!m.kind && !m.parentId)),
    [milestones],
  );
  const groups = useMemo(
    () => milestones.filter((m) => m.kind === "group" || !!m.parentId),
    [milestones],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: Row[] = [];
    phases.forEach((phase, idx) => {
      const color = PHASE_COLORS[idx % PHASE_COLORS.length];
      const phaseGroups = groups.filter((g) => g.parentId === phase.id);
      const groupTaskLists = phaseGroups.map((g) => ({
        group: g,
        tasks: tasks.filter(
          (t) =>
            t.milestoneId === g.id &&
            (!q || t.name.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q)),
        ),
      }));
      const directTasks = tasks.filter(
        (t) =>
          t.milestoneId === phase.id &&
          (!q || t.name.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q)),
      );
      const allTasks = [...groupTaskLists.flatMap((g) => g.tasks), ...directTasks];
      const starts = allTasks.map((t) => t.start);
      const dues = allTasks.map((t) => t.due);
      const start = starts.length ? [...starts].sort()[0] : phase.start;
      const due = dues.length ? [...dues].sort().slice(-1)[0] : phase.due;
      out.push({ type: "phase", id: phase.id, phase, color, start, due, tasks: allTasks });
      if (collapsed[phase.id]) return;
      groupTaskLists.forEach(({ group, tasks: gTasks }) => {
        const gStart = gTasks.length ? [...gTasks.map((t) => t.start)].sort()[0] : group.start;
        const gDue = gTasks.length ? [...gTasks.map((t) => t.due)].sort().slice(-1)[0] : group.due;
        out.push({ type: "group", id: group.id, group, color, start: gStart, due: gDue, tasks: gTasks });
        if (collapsed[group.id]) return;
        gTasks.forEach((task) => out.push({ type: "task", id: task.id, task, color, phaseId: phase.id }));
      });
      directTasks.forEach((task) => out.push({ type: "task", id: task.id, task, color, phaseId: phase.id }));
    });
    // Ungrouped tasks
    const ungrouped = tasks.filter(
      (t) =>
        !t.milestoneId &&
        (!q || t.name.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q)),
    );
    ungrouped.forEach((task) =>
      out.push({ type: "task", id: task.id, task, color: PHASE_COLORS[4], phaseId: "none" }),
    );
    return out;
  }, [phases, groups, tasks, query, collapsed]);

  const bounds = useMemo(() => {
    const starts = rows.flatMap((r) => {
      if (r.type === "task") return [r.task.start];
      return [r.start];
    });
    const ends = rows.flatMap((r) => {
      if (r.type === "task") return [r.task.due];
      return [r.due];
    });
    if (!starts.length) {
      const today = new Date().toISOString().slice(0, 10);
      return { start: addDays(today, -3), end: addDays(today, 21) };
    }
    const start = addDays([...starts].sort()[0], -2);
    const end = addDays([...ends].sort().slice(-1)[0], 3);
    return { start, end };
  }, [rows]);

  const span = Math.max(toTime(bounds.end) - toTime(bounds.start), 1);
  const dayCount = Math.max(Math.ceil(span / 86400000) + 1, 14);
  const tickStep = scale === "Days" ? 1 : 7;
  const ticks = Array.from({ length: Math.ceil(dayCount / tickStep) }, (_, i) =>
    addDays(bounds.start, i * tickStep),
  );
  const timelineWidth = Math.max(ticks.length * zoom, 640);
  const today = new Date().toISOString().slice(0, 10);
  const todayLeft = ((toTime(today) - toTime(bounds.start)) / span) * 100;

  function pctLeft(iso: string) {
    return ((toTime(iso) - toTime(bounds.start)) / span) * 100;
  }
  function pctWidth(a: string, b: string) {
    return Math.max(((toTime(b) - toTime(a)) / span) * 100, 1.8);
  }

  const deps = useMemo(() => {
    const taskRows = rows.filter((r): r is Extract<Row, { type: "task" }> => r.type === "task");
    const index = new Map(taskRows.map((r, i) => [r.task.id, i]));
    const links: { from: number; to: number; fromTask: Task; toTask: Task }[] = [];
    taskRows.forEach((row) => {
      const dep = row.task.dependsOn;
      if (!dep || !index.has(dep)) return;
      links.push({
        from: index.get(dep)!,
        to: index.get(row.task.id)!,
        fromTask: taskRows[index.get(dep)!].task,
        toTask: row.task,
      });
    });
    return { taskRows, links };
  }, [rows]);

  const selectedTask = tasks.find((t) => t.id === selected);
  const laneH = 44;

  return (
    <div className="gantt-board gantt-board-pro">
      <div className="gantt-toolbar">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              className="field-input w-48 pl-8 text-sm"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <span className="text-sm text-[var(--color-muted)]">
            {formatDisplayDate(bounds.start)} to {formatDisplayDate(bounds.end)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-white p-1">
            {(["Days", "Weeks"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`rounded-md px-3 py-1 text-sm font-semibold ${
                  scale === s ? "bg-[var(--color-navy)] text-white" : "text-[var(--color-muted)]"
                }`}
                onClick={() => setScale(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(28, z - 6))}
          >
            <Minus size={15} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(72, z + 6))}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="gantt-grid gantt-grid-pro">
        <div className="gantt-sidebar">
          <div className="gantt-side-head">Item</div>
          {rows.map((row) => {
            if (row.type === "phase") {
              const open = !collapsed[row.phase.id];
              return (
                <button
                  key={row.id}
                  type="button"
                  className="gantt-side-row gantt-side-phase"
                  onClick={() => setCollapsed((c) => ({ ...c, [row.phase.id]: !c[row.phase.id] }))}
                >
                  <span className="inline-flex items-center gap-2">
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="gantt-dot" style={{ background: row.color }} />
                    <span className="truncate font-semibold">{row.phase.name}</span>
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {row.tasks.length} tasks · {durationDays(row.start, row.due)}d
                  </span>
                </button>
              );
            }
            if (row.type === "group") {
              const open = !collapsed[row.group.id];
              return (
                <button
                  key={row.id}
                  type="button"
                  className="gantt-side-row gantt-side-group"
                  onClick={() => setCollapsed((c) => ({ ...c, [row.group.id]: !c[row.group.id] }))}
                >
                  <span className="inline-flex items-center gap-2 pl-3">
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="truncate font-medium">{row.group.name}</span>
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {formatDisplayDate(row.start).replace(/,.*/, "")} to{" "}
                    {formatDisplayDate(row.due).replace(/,.*/, "")}
                  </span>
                </button>
              );
            }
            return (
              <button
                key={row.id}
                type="button"
                className={`gantt-side-row gantt-side-task ${selected === row.task.id ? "active" : ""}`}
                onClick={() => setSelected(row.task.id)}
              >
                <div className="truncate pl-8 font-medium">{row.task.name}</div>
                <div className="pl-8 text-xs text-[var(--color-muted)]">
                  {formatDisplayDate(row.task.start).replace(/,.*/, "")} to{" "}
                  {formatDisplayDate(row.task.due).replace(/,.*/, "")}
                </div>
              </button>
            );
          })}
        </div>

        <div className="gantt-timeline">
          <div className="gantt-timeline-inner" style={{ width: timelineWidth }}>
            <div
              className="gantt-ticks"
              style={{ gridTemplateColumns: `repeat(${ticks.length}, minmax(${zoom}px, 1fr))` }}
            >
              {ticks.map((d) => (
                <div key={d} className="gantt-tick">
                  {scale === "Days" ? d.slice(5) : `W ${d.slice(5)}`}
                </div>
              ))}
            </div>

            <div className="gantt-lanes" style={{ position: "relative" }}>
              {todayLeft >= 0 && todayLeft <= 100 ? (
                <div className="gantt-today" style={{ left: `${todayLeft}%` }}>
                  <span>{today.slice(8)}</span>
                </div>
              ) : null}

              <svg
                className="gantt-deps"
                width={timelineWidth}
                height={rows.length * laneH}
                viewBox={`0 0 ${timelineWidth} ${rows.length * laneH}`}
              >
                {deps.links.map((link, i) => {
                  const fromRowIdx = rows.findIndex((r) => r.type === "task" && r.task.id === link.fromTask.id);
                  const toRowIdx = rows.findIndex((r) => r.type === "task" && r.task.id === link.toTask.id);
                  if (fromRowIdx < 0 || toRowIdx < 0) return null;
                  const x1 = (pctLeft(link.fromTask.due) / 100) * timelineWidth;
                  const x2 = (pctLeft(link.toTask.start) / 100) * timelineWidth;
                  const y1 = fromRowIdx * laneH + laneH / 2;
                  const y2 = toRowIdx * laneH + laneH / 2;
                  const midX = (x1 + x2) / 2;
                  return (
                    <path
                      key={`${link.fromTask.id}-${link.toTask.id}-${i}`}
                      d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke="#9AA6B5"
                      strokeWidth="1.5"
                      markerEnd="url(#gantt-arrow)"
                    />
                  );
                })}
                <defs>
                  <marker id="gantt-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#9AA6B5" />
                  </marker>
                </defs>
              </svg>

              {rows.map((row) => {
                if (row.type === "phase") {
                  return (
                    <div key={row.id} className="gantt-lane gantt-lane-phase">
                      <div
                        className="gantt-summary-bar"
                        style={{
                          left: `${pctLeft(row.start)}%`,
                          width: `${pctWidth(row.start, row.due)}%`,
                          background: row.color,
                        }}
                        title={`${row.phase.name} · ${durationDays(row.start, row.due)} days`}
                      >
                        <span>
                          {row.phase.name} · {durationDays(row.start, row.due)} days
                        </span>
                      </div>
                      <div
                        className="gantt-diamond"
                        style={{
                          left: `${pctLeft(row.due)}%`,
                          borderColor: row.color,
                          background: "#fff",
                        }}
                        title={`Milestone · ${formatDisplayDate(row.due)}`}
                      />
                    </div>
                  );
                }
                if (row.type === "group") {
                  return (
                    <div key={row.id} className="gantt-lane">
                      <div
                        className="gantt-summary-bar gantt-summary-group"
                        style={{
                          left: `${pctLeft(row.start)}%`,
                          width: `${pctWidth(row.start, row.due)}%`,
                          background: row.color,
                        }}
                      />
                    </div>
                  );
                }
                return (
                  <div key={row.id} className={`gantt-lane ${selected === row.task.id ? "active" : ""}`}>
                    <button
                      type="button"
                      className="gantt-bar-flat"
                      style={{
                        left: `${pctLeft(row.task.start)}%`,
                        width: `${pctWidth(row.task.start, row.task.due)}%`,
                        background: statusColor(row.task.status, row.color),
                      }}
                      onClick={() => setSelected(row.task.id)}
                      title={`${row.task.name}: ${formatDisplayDate(row.task.start)} to ${formatDisplayDate(row.task.due)}`}
                    >
                      <span>{row.task.name}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
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
      ) : (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Click a task bar to edit dates and status. Dependency arrows show from predecessor tasks.
        </p>
      )}
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
