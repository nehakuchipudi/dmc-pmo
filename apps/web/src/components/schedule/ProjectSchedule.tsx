"use client";

import { startTransition, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { GanttBoard } from "@/components/Gantt";
import {
  addDays,
  buildPlanRows,
  durationDays,
  type PlanRow,
} from "@/lib/project-plan";
import { formatShortDate, money } from "@/lib/seed";
import type { Milestone, Task, TaskLink, TaskStatus } from "@/lib/types";

const STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Review", "Done"];
const PHASE_COLORS = ["#8FA8BF", "#C4A574", "#7BA891", "#9AA0C4", "#9AA6B5"];

function statusClass(status: string) {
  const key = status.toLowerCase().replace(/\s/g, "");
  if (key === "done" || key === "approved" || key === "completed") return "wbs-status wbs-status-done";
  if (key === "inprogress" || key === "awaitingsignoff" || key === "active") return "wbs-status wbs-status-progress";
  if (key === "review" || key === "atrisk") return "wbs-status wbs-status-review";
  return "wbs-status wbs-status-todo";
}

function rowColor(row: PlanRow, milestoneIndex: Record<string, number>) {
  if (row.kind === "project") return "#3d5a73";
  const idx = milestoneIndex[row.milestoneId ?? row.id] ?? 0;
  return PHASE_COLORS[idx % PHASE_COLORS.length];
}

export function ProjectSchedule({
  projectId,
  projectName,
  projectStatus,
  milestones,
  tasks,
  projectFiles,
  projectStart,
  projectDue,
  hoursByTaskId = {},
  assignees,
  rateFor,
  onUpdateDates,
  onAddPhase,
  onAddTask,
  onAddSubtask,
  onUpdateTask,
  onUpdateMilestone,
  onDeleteTask,
  onReorderTasks,
  onAddTaskLink,
  onRemoveTaskLink,
}: {
  projectId: string;
  projectName: string;
  projectStatus: string;
  milestones: Milestone[];
  tasks: Task[];
  projectFiles: { id: string; name: string }[];
  projectStart?: string;
  projectDue?: string;
  hoursByTaskId?: Record<string, number>;
  assignees: string[];
  rateFor: (assignee: string) => number;
  onUpdateDates?: (start: string, due: string) => void;
  onAddPhase: () => void;
  onAddGroup: (phaseId: string) => void;
  onAddTask: (milestoneId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
  onUpdateMilestone: (id: string, patch: Partial<Milestone>) => void;
  onDeleteTask: (id: string) => void;
  onDeleteMilestone: (id: string) => void;
  onReorderTasks: (orderedIds: string[]) => void;
  onAddTaskLink: (taskId: string, link: Omit<TaskLink, "id">) => void;
  onRemoveTaskLink: (taskId: string, linkId: string) => void;
}) {
  const [view, setView] = useState<"List" | "Gantt" | "Split">("Split");
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [linkTaskId, setLinkTaskId] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkFileId, setLinkFileId] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [scale, setScale] = useState<"Days" | "Weeks">("Days");
  const [zoom, setZoom] = useState(36);
  const dragRef = useRef<{ id: string; mode: "move" | "start" | "end"; startX: number; start: string; due: string } | null>(
    null,
  );

  const rows = useMemo(
    () =>
      buildPlanRows({
        project: {
          id: projectId,
          name: projectName,
          status: projectStatus as never,
          start: projectStart ?? new Date().toISOString().slice(0, 10),
          due: projectDue ?? new Date().toISOString().slice(0, 10),
        },
        milestones,
        tasks,
        hoursByTaskId,
        rateFor,
        collapsed: collapsed[projectId] ? { ...Object.fromEntries(milestones.map((m) => [m.id, true])), [projectId]: true } : collapsed,
        query,
      }),
    [collapsed, hoursByTaskId, milestones, projectDue, projectId, projectName, projectStart, projectStatus, query, rateFor, tasks],
  );

  const visibleRows = collapsed[projectId] ? rows.filter((row) => row.kind === "project") : rows;
  const milestoneIndex = useMemo(() => {
    const map: Record<string, number> = {};
    milestones.filter((row) => row.kind === "phase" || !row.parentId).forEach((row, index) => {
      map[row.id] = index;
    });
    return map;
  }, [milestones]);

  const bounds = useMemo(() => {
    const starts = visibleRows.map((row) => row.start);
    const dues = visibleRows.map((row) => row.due);
    if (!starts.length) {
      const today = new Date().toISOString().slice(0, 10);
      return { start: addDays(today, -3), end: addDays(today, 21) };
    }
    return { start: addDays([...starts].sort()[0], -2), end: addDays([...dues].sort().slice(-1)[0], 4) };
  }, [visibleRows]);
  const dayCount = Math.max(Math.ceil((Date.parse(`${bounds.end}T12:00:00`) - Date.parse(`${bounds.start}T12:00:00`)) / 86400000) + 1, 14);
  const tickStep = scale === "Days" ? 1 : 7;
  const ticks = Array.from({ length: Math.ceil(dayCount / tickStep) }, (_, i) => addDays(bounds.start, i * tickStep));
  const timelineWidth = Math.max(ticks.length * zoom, 520);
  const span = Math.max(Date.parse(`${bounds.end}T12:00:00`) - Date.parse(`${bounds.start}T12:00:00`), 1);

  function pctLeft(iso: string) {
    return ((Date.parse(`${iso}T12:00:00`) - Date.parse(`${bounds.start}T12:00:00`)) / span) * 100;
  }
  function pctWidth(start: string, due: string) {
    return Math.max(((Date.parse(`${due}T12:00:00`) - Date.parse(`${start}T12:00:00`)) / span) * 100, 1.6);
  }

  function toggle(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function siblingIds(row: PlanRow) {
    if (row.kind === "subtask") {
      return tasks.filter((item) => item.parentTaskId === row.parentTaskId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((item) => item.id);
    }
    if (row.kind === "task") {
      return visibleRows.filter((item) => item.kind === "task" && item.milestoneId === row.milestoneId).map((item) => item.id);
    }
    return [];
  }

  function dropOn(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const source = visibleRows.find((row) => row.id === draggingId);
    const target = visibleRows.find((row) => row.id === targetId);
    if (!source?.task || !target?.task) return;
    if (source.kind !== target.kind || source.parentTaskId !== target.parentTaskId || source.milestoneId !== target.milestoneId) {
      if (target.kind === "task" && source.kind === "task") {
        onUpdateTask(source.id, { milestoneId: target.task.milestoneId, parentTaskId: undefined });
      }
      if (target.kind === "milestone" && source.task) {
        onUpdateTask(source.id, { milestoneId: target.milestoneId, parentTaskId: undefined });
      }
      setDraggingId(null);
      setOverId(null);
      return;
    }
    const ids = siblingIds(source).filter((id) => id !== source.id);
    const at = ids.indexOf(target.id);
    ids.splice(at < 0 ? ids.length : at, 0, source.id);
    onReorderTasks(ids);
    setDraggingId(null);
    setOverId(null);
  }

  function beginBarDrag(event: ReactPointerEvent, row: PlanRow, mode: "move" | "start" | "end") {
    if (!row.task) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: row.task.id, mode, startX: event.clientX, start: row.task.start, due: row.task.due };
  }

  function moveBar(event: ReactPointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dayPx = timelineWidth / dayCount;
    const days = Math.round((event.clientX - drag.startX) / dayPx);
    if (!days) return;
    if (drag.mode === "move") {
      onUpdateTask(drag.id, { start: addDays(drag.start, days), due: addDays(drag.due, days) });
    } else if (drag.mode === "start") {
      const next = addDays(drag.start, days);
      if (next <= drag.due) onUpdateTask(drag.id, { start: next });
    } else {
      const next = addDays(drag.due, days);
      if (next >= drag.start) onUpdateTask(drag.id, { due: next });
    }
  }

  function endBarDrag() {
    dragRef.current = null;
  }

  const people = assignees.length ? assignees : ["M. Doyle", "J. Kim", "S. Ahmed", "S. Cho", "J. Alvarez"];

  return (
    <div className="plan-workspace">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Project plan</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Project, milestone, task, and subtask on one schedule
          </p>
          {projectStart && projectDue && onUpdateDates ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <label className="inline-flex items-center gap-2">
                Planned start
                <input type="date" className="field-input" value={projectStart} onChange={(e) => onUpdateDates(e.target.value, projectDue)} />
              </label>
              <label className="inline-flex items-center gap-2">
                Deadline
                <input type="date" className="field-input" value={projectDue} onChange={(e) => onUpdateDates(projectStart, e.target.value)} />
              </label>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-white p-1">
            {(["List", "Gantt", "Split"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                  view === item ? "bg-[var(--color-navy)] text-white" : "text-[var(--color-muted)]"
                }`}
                onClick={() => startTransition(() => setView(item))}
              >
                {item}
              </button>
            ))}
          </div>
          {view !== "Gantt" ? (
            <button type="button" className="btn btn-primary" onClick={onAddPhase}>
              Add milestone
            </button>
          ) : null}
        </div>
      </div>

      {view === "Gantt" ? (
        <GanttBoard milestones={milestones} tasks={tasks} onUpdateTask={onUpdateTask} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              className="field-input max-w-sm"
              placeholder="Search tasks"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {view === "Split" ? (
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-white p-1">
                  {(["Days", "Weeks"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`rounded-md px-2.5 py-1 text-sm font-semibold ${
                        scale === item ? "bg-[var(--color-navy)] text-white" : "text-[var(--color-muted)]"
                      }`}
                      onClick={() => setScale(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className={`plan-board ${view === "Split" ? "is-split" : ""}`}>
            <div className="plan-table-wrap panel">
              <table className="wbs-table plan-table">
                <thead>
                  <tr>
                    <th className="wbs-name">Task</th>
                    <th>Assignee</th>
                    <th className="wbs-num">Duration</th>
                    <th className="wbs-date">Start</th>
                    <th className="wbs-date">Due</th>
                    <th>Status</th>
                    <th className="wbs-num">Budget</th>
                    <th className="wbs-num">Estimated Hours</th>
                    <th className="wbs-num">Actual Hours</th>
                    <th>Dependency</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const editable = Boolean(row.task);
                    return (
                      <tr
                        key={row.id}
                        className={`plan-row is-${row.kind} ${overId === row.id ? "is-over" : ""} ${draggingId === row.id ? "is-dragging" : ""}`}
                        draggable={row.kind === "task" || row.kind === "subtask"}
                        onDragStart={() => setDraggingId(row.id)}
                        onDragOver={(e) => {
                          if (!draggingId) return;
                          e.preventDefault();
                          setOverId(row.id);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          dropOn(row.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverId(null);
                        }}
                      >
                        <td>
                          <div className={`wbs-name-cell plan-indent-${row.depth}`}>
                            {row.canExpand ? (
                              <button type="button" className="wbs-toggle" onClick={() => toggle(row.id)} aria-label={`Toggle ${row.name}`}>
                                {collapsed[row.id] ? "▸" : "▾"}
                              </button>
                            ) : (
                              <span className="wbs-toggle-spacer" />
                            )}
                            {editable ? (
                              <input
                                className={`wbs-name-input ${row.kind === "subtask" ? "wbs-name-task" : "wbs-name-task"}`}
                                value={row.name}
                                onChange={(e) => onUpdateTask(row.id, { name: e.target.value })}
                              />
                            ) : row.kind === "milestone" ? (
                              <input
                                className="wbs-name-input"
                                value={row.name}
                                onChange={(e) => onUpdateMilestone(row.id, { name: e.target.value })}
                              />
                            ) : (
                              <span className="font-semibold text-[var(--color-navy)]">{row.name}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {editable ? (
                            <select className="wbs-select" value={row.assignee} onChange={(e) => onUpdateTask(row.id, { assignee: e.target.value })}>
                              {people.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[var(--color-muted)]">-</span>
                          )}
                        </td>
                        <td className="wbs-num tabular-nums">{row.duration}d</td>
                        <td className="wbs-date">
                          {editable ? (
                            <input type="date" className="wbs-date-input" value={row.start} onChange={(e) => onUpdateTask(row.id, { start: e.target.value })} />
                          ) : (
                            <span className="tabular-nums">{formatShortDate(row.start)}</span>
                          )}
                        </td>
                        <td className="wbs-date">
                          {editable ? (
                            <input type="date" className="wbs-date-input" value={row.due} onChange={(e) => onUpdateTask(row.id, { due: e.target.value })} />
                          ) : (
                            <span className="tabular-nums">{formatShortDate(row.due)}</span>
                          )}
                        </td>
                        <td>
                          {editable ? (
                            <select
                              className={statusClass(row.status)}
                              value={row.status}
                              onChange={(e) => onUpdateTask(row.id, { status: e.target.value as TaskStatus })}
                            >
                              {STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={statusClass(row.status)}>{row.status}</span>
                          )}
                        </td>
                        <td className="wbs-num tabular-nums">{money(row.budget)}</td>
                        <td className="wbs-num">
                          {editable ? (
                            <input
                              type="number"
                              min={0}
                              className="wbs-pct-input"
                              value={row.task?.estimateHours ?? row.estimateHours}
                              aria-label="Estimated hours"
                              onChange={(e) => onUpdateTask(row.id, { estimateHours: Number(e.target.value) || 0 })}
                            />
                          ) : (
                            <span className="tabular-nums">{row.estimateHours}h</span>
                          )}
                        </td>
                        <td className="wbs-num tabular-nums">{row.actualHours}h</td>
                        <td>
                          {editable ? (
                            <select
                              className="wbs-select"
                              value={row.dependsOn ?? ""}
                              aria-label="Dependency"
                              onChange={(e) => onUpdateTask(row.id, { dependsOn: e.target.value || undefined })}
                            >
                              <option value="">None</option>
                              {tasks
                                .filter((item) => item.id !== row.id)
                                .map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <span className="text-[var(--color-muted)]">-</span>
                          )}
                        </td>
                        <td className="text-right">
                          {row.kind === "milestone" ? (
                            <button type="button" className="btn btn-ghost text-sm" onClick={() => onAddTask(row.id)}>
                              Add task
                            </button>
                          ) : null}
                          {row.kind === "task" ? (
                            <div className="flex justify-end gap-1">
                              <button type="button" className="btn btn-ghost text-sm" onClick={() => onAddSubtask(row.id)}>
                                Add subtask
                              </button>
                              <button type="button" className="btn btn-ghost text-sm" onClick={() => setLinkTaskId(row.id)}>
                                Link
                              </button>
                              <button type="button" className="btn btn-ghost text-sm" onClick={() => onDeleteTask(row.id)}>
                                Delete
                              </button>
                            </div>
                          ) : null}
                          {row.kind === "subtask" ? (
                            <button type="button" className="btn btn-ghost text-sm" onClick={() => onDeleteTask(row.id)}>
                              Delete
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                  {!visibleRows.length ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-[var(--color-muted)]">
                        No milestones yet. Add a milestone to start the plan.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {view === "Split" ? (
              <div className="plan-gantt panel">
                <div className="plan-gantt-inner" style={{ width: timelineWidth }}>
                  <div className="plan-gantt-ticks" style={{ gridTemplateColumns: `repeat(${ticks.length}, minmax(${zoom}px, 1fr))` }}>
                    {ticks.map((tick) => (
                      <div key={tick} className="plan-gantt-tick">
                        {tick.slice(5).replace("-", "/")}
                      </div>
                    ))}
                  </div>
                  {visibleRows.map((row) => {
                    const color = rowColor(row, milestoneIndex);
                    return (
                      <div key={`g-${row.id}`} className={`plan-gantt-lane is-${row.kind}`}>
                        <div
                          className={`plan-gantt-bar is-${row.kind}`}
                          style={{
                            left: `${pctLeft(row.start)}%`,
                            width: `${pctWidth(row.start, row.due)}%`,
                            background: color,
                          }}
                          title={`${row.name}: ${formatShortDate(row.start)} to ${formatShortDate(row.due)}`}
                          onPointerDown={(e) => row.task && beginBarDrag(e, row, "move")}
                          onPointerMove={moveBar}
                          onPointerUp={endBarDrag}
                        >
                          {row.task ? (
                            <>
                              <span className="plan-gantt-handle is-start" onPointerDown={(e) => { e.stopPropagation(); beginBarDrag(e, row, "start"); }} />
                              <span className="plan-gantt-progress" style={{ width: `${row.progress}%` }} />
                              <span className="plan-gantt-handle is-end" onPointerDown={(e) => { e.stopPropagation(); beginBarDrag(e, row, "end"); }} />
                            </>
                          ) : null}
                          <span className="plan-gantt-label">
                            {row.name} · {durationDays(row.start, row.due)}d
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}

      {linkTaskId ? (
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-[var(--color-ink)]">Link to task</h3>
            <button type="button" className="btn btn-ghost text-sm" onClick={() => setLinkTaskId(null)}>
              Close
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">External URL</div>
              <input className="field-input mb-2" value={linkLabel} placeholder="Label" onChange={(e) => setLinkLabel(e.target.value)} />
              <input className="field-input mb-2" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!linkUrl.trim()) return;
                  onAddTaskLink(linkTaskId, { type: "url", label: linkLabel.trim() || linkUrl, href: linkUrl.trim() });
                  setLinkTaskId(null);
                }}
              >
                Add URL
              </button>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Project file</div>
              <select className="field-input mb-2" value={linkFileId} onChange={(e) => setLinkFileId(e.target.value)}>
                {projectFiles.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!linkFileId}
                onClick={() => {
                  const file = projectFiles.find((item) => item.id === linkFileId);
                  if (!file) return;
                  onAddTaskLink(linkTaskId, { type: "file", label: file.name, href: `#${file.id}`, fileId: file.id });
                  setLinkTaskId(null);
                }}
              >
                Link file
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
