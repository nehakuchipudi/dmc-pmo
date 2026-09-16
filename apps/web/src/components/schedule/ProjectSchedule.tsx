"use client";

import { startTransition, useMemo, useState, type ReactNode } from "react";
import { GanttBoard } from "@/components/Gantt";
import { formatShortDate } from "@/lib/seed";
import type { Milestone, Task, TaskLink, TaskStatus } from "@/lib/types";

const ASSIGNEES = ["M. Doyle", "J. Kim", "S. Ahmed", "S. Cho", "J. Alvarez"];
const STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Review", "Done"];

function toTime(iso: string) {
  return new Date(`${iso}T12:00:00`).getTime();
}

function durationDays(start: string, due: string) {
  return Math.max(1, Math.round((toTime(due) - toTime(start)) / 86400000) + 1);
}

function rollup(items: { start: string; due: string; progress: number }[]) {
  if (!items.length) {
    const today = new Date().toISOString().slice(0, 10);
    return { start: today, due: today, duration: 1, progress: 0 };
  }
  const start = [...items].map((i) => i.start).sort()[0];
  const due = [...items].map((i) => i.due).sort().slice(-1)[0];
  const progress = Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length);
  return { start, due, duration: durationDays(start, due), progress };
}

function statusClass(status: string) {
  const s = status.toLowerCase().replace(/\s/g, "");
  if (s === "done" || s === "approved") return "wbs-status wbs-status-done";
  if (s === "inprogress" || s === "awaitingsignoff") return "wbs-status wbs-status-progress";
  if (s === "review") return "wbs-status wbs-status-review";
  return "wbs-status wbs-status-todo";
}

export function ProjectSchedule({
  milestones,
  tasks,
  projectFiles,
  projectStart,
  projectDue,
  hoursByTaskId = {},
  onUpdateDates,
  onAddPhase,
  onAddGroup,
  onAddTask,
  onUpdateTask,
  onUpdateMilestone,
  onDeleteTask,
  onAddTaskLink,
  onRemoveTaskLink,
}: {
  milestones: Milestone[];
  tasks: Task[];
  projectFiles: { id: string; name: string }[];
  projectStart?: string;
  projectDue?: string;
  hoursByTaskId?: Record<string, number>;
  onUpdateDates?: (start: string, due: string) => void;
  onAddPhase: () => void;
  onAddGroup: (phaseId: string) => void;
  onAddTask: (groupId: string) => void;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
  onUpdateMilestone: (id: string, patch: Partial<Milestone>) => void;
  onDeleteTask: (id: string) => void;
  onDeleteMilestone: (id: string) => void;
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

  const phases = useMemo(
    () => milestones.filter((m) => m.kind === "phase" || (!m.kind && !m.parentId)),
    [milestones],
  );
  const groups = useMemo(
    () => milestones.filter((m) => m.kind === "group" || !!m.parentId),
    [milestones],
  );

  const tree = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchTask = (t: Task) => !q || t.name.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q);
    return phases.map((phase) => {
      const phaseGroups = groups.filter((g) => g.parentId === phase.id);
      const groupNodes = phaseGroups.map((group) => {
        const groupTasks = tasks.filter((t) => t.milestoneId === group.id && matchTask(t));
        return { group, tasks: groupTasks, roll: rollup(groupTasks) };
      });
      const orphanTasks = tasks.filter((t) => t.milestoneId === phase.id && matchTask(t));
      const allLeaf = [
        ...groupNodes.flatMap((g) => g.tasks),
        ...orphanTasks,
      ].map((t) => ({ start: t.start, due: t.due, progress: t.progress }));
      return { phase, groups: groupNodes, orphanTasks, roll: rollup(allLeaf) };
    });
  }, [phases, groups, tasks, query]);

  const ganttMilestones = useMemo(() => {
    const rows: Milestone[] = [];
    tree.forEach((p) => {
      rows.push({ ...p.phase, start: p.roll.start, due: p.roll.due });
      p.groups.forEach((g) => rows.push({ ...g.group, start: g.roll.start, due: g.roll.due }));
    });
    return rows;
  }, [tree]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Project plan</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Phase, workstream, and task on one schedule</p>
          {projectStart && projectDue && onUpdateDates ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <label className="inline-flex items-center gap-2">
                Planned start
                <input
                  type="date"
                  className="field-input"
                  value={projectStart}
                  onChange={(e) => onUpdateDates(e.target.value, projectDue)}
                />
              </label>
              <label className="inline-flex items-center gap-2">
                Deadline
                <input
                  type="date"
                  className="field-input"
                  value={projectDue}
                  onChange={(e) => onUpdateDates(projectStart, e.target.value)}
                />
              </label>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-white p-1">
            {(["List", "Gantt", "Split"] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                  view === v ? "bg-[var(--color-navy)] text-white" : "text-[var(--color-muted)]"
                }`}
                onClick={() => startTransition(() => setView(v))}
              >
                {v}
              </button>
            ))}
          </div>
          {view !== "Gantt" ? (
            <button type="button" className="btn btn-primary" onClick={onAddPhase}>
              + Add phase
            </button>
          ) : null}
        </div>
      </div>

      {view === "List" || view === "Split" ? (
        <>
          <input
            className="field-input max-w-sm"
            placeholder="Search tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className={view === "Split" ? "plan-split" : undefined}>
          <div className="panel overflow-x-auto">
            <table className="wbs-table">
              <thead>
                <tr>
                  <th className="wbs-name">Milestones and tasks</th>
                  <th className="wbs-num">Dur.</th>
                  <th className="wbs-date">Start</th>
                  <th className="wbs-date">Due</th>
                  <th className="wbs-num">Budget</th>
                  <th className="wbs-num">Time</th>
                  <th>Dep.</th>
                  <th>Assignee</th>
                  <th>Status</th>
                  <th className="wbs-progress-col">Progress</th>
                  <th>Links</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tree.map((p) => {
                  const phaseCollapsed = collapsed[p.phase.id];
                  return (
                    <FragmentRows key={p.phase.id}>
                      <tr className="wbs-l1">
                        <td>
                          <div className="wbs-name-cell">
                            <button
                              type="button"
                              className="wbs-toggle"
                              onClick={() => setCollapsed((c) => ({ ...c, [p.phase.id]: !c[p.phase.id] }))}
                              aria-label="Toggle phase"
                            >
                              {phaseCollapsed ? "▸" : "▾"}
                            </button>
                            <input
                              className="wbs-name-input"
                              value={p.phase.name}
                              onChange={(e) => onUpdateMilestone(p.phase.id, { name: e.target.value })}
                            />
                          </div>
                        </td>
                        <td className="wbs-num tabular-nums">{p.roll.duration}</td>
                        <td className="wbs-date tabular-nums">{formatShortDate(p.roll.start)}</td>
                        <td className="wbs-date tabular-nums">{formatShortDate(p.roll.due)}</td>
                        <td className="wbs-num tabular-nums">
                          {[...p.groups.flatMap((g) => g.tasks), ...p.orphanTasks].reduce((sum, t) => sum + t.estimateHours, 0)}h
                        </td>
                        <td className="wbs-num tabular-nums">
                          {[...p.groups.flatMap((g) => g.tasks), ...p.orphanTasks].reduce((sum, t) => sum + (hoursByTaskId[t.id] ?? 0), 0)}h
                        </td>
                        <td className="text-[var(--color-muted)]">-</td>
                        <td className="text-[var(--color-muted)]">-</td>
                        <td>
                          <span className={statusClass(p.phase.status)}>{p.phase.status}</span>
                        </td>
                        <td>
                          <ProgressCell value={p.roll.progress} />
                        </td>
                        <td />
                        <td className="text-right">
                          <button type="button" className="btn btn-ghost text-sm" onClick={() => onAddGroup(p.phase.id)}>
                            + Workstream
                          </button>
                        </td>
                      </tr>
                      {!phaseCollapsed
                        ? p.groups.map((g) => {
                            const groupCollapsed = collapsed[g.group.id];
                            return (
                              <FragmentRows key={g.group.id}>
                                <tr className="wbs-l2">
                                  <td>
                                    <div className="wbs-name-cell wbs-indent-1">
                                      <button
                                        type="button"
                                        className="wbs-toggle"
                                        onClick={() =>
                                          setCollapsed((c) => ({ ...c, [g.group.id]: !c[g.group.id] }))
                                        }
                                        aria-label="Toggle workstream"
                                      >
                                        {groupCollapsed ? "▸" : "▾"}
                                      </button>
                                      <input
                                        className="wbs-name-input"
                                        value={g.group.name}
                                        onChange={(e) => onUpdateMilestone(g.group.id, { name: e.target.value })}
                                      />
                                    </div>
                                  </td>
                                  <td className="wbs-num tabular-nums">{g.roll.duration}</td>
                                  <td className="wbs-date tabular-nums">{formatShortDate(g.roll.start)}</td>
                                  <td className="wbs-date tabular-nums">{formatShortDate(g.roll.due)}</td>
                                  <td className="wbs-num tabular-nums">
                                    {g.tasks.reduce((sum, t) => sum + t.estimateHours, 0)}h
                                  </td>
                                  <td className="wbs-num tabular-nums">
                                    {g.tasks.reduce((sum, t) => sum + (hoursByTaskId[t.id] ?? 0), 0)}h
                                  </td>
                                  <td className="text-[var(--color-muted)]">-</td>
                                  <td className="text-[var(--color-muted)]">-</td>
                                  <td>
                                    <span className={statusClass(g.group.status)}>{g.group.status}</span>
                                  </td>
                                  <td>
                                    <ProgressCell value={g.roll.progress} />
                                  </td>
                                  <td />
                                  <td className="text-right">
                                    <button
                                      type="button"
                                      className="btn btn-ghost text-sm"
                                      onClick={() => onAddTask(g.group.id)}
                                    >
                                      + Task
                                    </button>
                                  </td>
                                </tr>
                                {!groupCollapsed
                                  ? g.tasks.map((t) => (
                                      <TaskRow
                                        key={t.id}
                                        task={t}
                                        tasks={tasks}
                                        hours={hoursByTaskId[t.id] ?? 0}
                                        indentClass="wbs-indent-2"
                                        onUpdateTask={onUpdateTask}
                                        onDeleteTask={onDeleteTask}
                                        onOpenLinks={() => {
                                          setLinkTaskId(t.id);
                                          setLinkLabel("");
                                          setLinkUrl("https://");
                                          setLinkFileId(projectFiles[0]?.id ?? "");
                                        }}
                                      />
                                    ))
                                  : null}
                              </FragmentRows>
                            );
                          })
                        : null}
                      {!phaseCollapsed
                        ? p.orphanTasks.map((t) => (
                            <TaskRow
                              key={t.id}
                              task={t}
                              tasks={tasks}
                              hours={hoursByTaskId[t.id] ?? 0}
                              indentClass="wbs-indent-1"
                              onUpdateTask={onUpdateTask}
                              onDeleteTask={onDeleteTask}
                              onOpenLinks={() => setLinkTaskId(t.id)}
                            />
                          ))
                        : null}
                    </FragmentRows>
                  );
                })}
                {!tree.length ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-[var(--color-muted)]">
                      No phases yet. Add a phase to start the plan.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {view === "Split" ? (
            <GanttBoard milestones={ganttMilestones} tasks={tasks} onUpdateTask={onUpdateTask} />
          ) : null}
          </div>
        </>
      ) : (
        <GanttBoard milestones={ganttMilestones} tasks={tasks} onUpdateTask={onUpdateTask} />
      )}

      {linkTaskId ? (
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-[var(--color-ink)]">Link to task</h3>
            <button type="button" className="btn btn-ghost text-sm" onClick={() => setLinkTaskId(null)}>
              Close
            </button>
          </div>
          {(() => {
            const linked = tasks.find((t) => t.id === linkTaskId)?.links ?? [];
            if (!linked.length) return null;
            return (
              <div className="mb-3 flex flex-wrap gap-2">
                {linked.map((l) => (
                  <span key={l.id} className="inline-flex items-center gap-1 rounded-md bg-[var(--color-fog)] px-2 py-1 text-xs">
                    {l.label}
                    <button
                      type="button"
                      className="text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                      onClick={() => onRemoveTaskLink(linkTaskId, l.id)}
                      aria-label={`Remove ${l.label}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            );
          })()}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                External URL
              </div>
              <input
                className="field-input mb-2"
                value={linkLabel}
                placeholder="Label"
                onChange={(e) => setLinkLabel(e.target.value)}
              />
              <input className="field-input mb-2" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!linkUrl.trim()) return;
                  onAddTaskLink(linkTaskId, {
                    type: "url",
                    label: linkLabel.trim() || linkUrl,
                    href: linkUrl.trim(),
                  });
                  setLinkTaskId(null);
                }}
              >
                Add URL
              </button>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Project file
              </div>
              <select className="field-input mb-2" value={linkFileId} onChange={(e) => setLinkFileId(e.target.value)}>
                {projectFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!linkFileId}
                onClick={() => {
                  const file = projectFiles.find((f) => f.id === linkFileId);
                  if (!file) return;
                  onAddTaskLink(linkTaskId, {
                    type: "file",
                    label: file.name,
                    href: `#${file.id}`,
                    fileId: file.id,
                  });
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

function FragmentRows({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function ProgressCell({
  value,
  onChange,
}: {
  value: number;
  onChange?: (n: number) => void;
}) {
  return (
    <div className="wbs-progress">
      <div className="wbs-progress-track">
        <span style={{ width: `${value}%` }} />
      </div>
      {onChange ? (
        <input
          type="number"
          min={0}
          max={100}
          step={5}
          className="wbs-pct-input"
          value={value}
          onChange={(e) => onChange(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
          aria-label="Progress percent"
        />
      ) : (
        <span className="wbs-pct-label tabular-nums">{value}%</span>
      )}
    </div>
  );
}

function TaskRow({
  task: t,
  tasks,
  hours,
  indentClass,
  onUpdateTask,
  onDeleteTask,
  onOpenLinks,
}: {
  task: Task;
  tasks: Task[];
  hours: number;
  indentClass: string;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onOpenLinks: () => void;
}) {
  return (
    <tr className="wbs-l3">
      <td>
        <div className={`wbs-name-cell ${indentClass}`}>
          <input
            type="checkbox"
            className="wbs-check"
            checked={t.status === "Done"}
            onChange={(e) =>
              onUpdateTask(t.id, {
                status: e.target.checked ? "Done" : "In Progress",
                progress: e.target.checked ? 100 : Math.min(t.progress, 90),
              })
            }
          />
          <input
            className="wbs-name-input wbs-name-task"
            value={t.name}
            onChange={(e) => onUpdateTask(t.id, { name: e.target.value })}
          />
        </div>
      </td>
      <td className="wbs-num tabular-nums">{durationDays(t.start, t.due)}</td>
      <td className="wbs-date">
        <input
          type="date"
          className="wbs-date-input"
          value={t.start}
          onChange={(e) => onUpdateTask(t.id, { start: e.target.value })}
        />
      </td>
      <td className="wbs-date">
        <input
          type="date"
          className="wbs-date-input"
          value={t.due}
          onChange={(e) => onUpdateTask(t.id, { due: e.target.value })}
        />
      </td>
      <td className="wbs-num">
        <input
          type="number"
          min={0}
          className="wbs-pct-input"
          value={t.estimateHours}
          onChange={(e) => onUpdateTask(t.id, { estimateHours: Number(e.target.value) || 0 })}
          aria-label="Budget hours"
        />
      </td>
      <td className="wbs-num tabular-nums">{hours}h</td>
      <td>
        <select
          className="wbs-select"
          value={t.dependsOn ?? ""}
          onChange={(e) => onUpdateTask(t.id, { dependsOn: e.target.value || undefined })}
          aria-label="Depends on"
        >
          <option value="">None</option>
          {tasks
            .filter((other) => other.id !== t.id)
            .map((other) => (
              <option key={other.id} value={other.id}>
                {other.name}
              </option>
            ))}
        </select>
      </td>
      <td>
        <select
          className="wbs-select"
          value={t.assignee}
          onChange={(e) => onUpdateTask(t.id, { assignee: e.target.value })}
        >
          {ASSIGNEES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          className={statusClass(t.status)}
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
        <ProgressCell
          value={t.progress}
          onChange={(progress) => onUpdateTask(t.id, { progress })}
        />
      </td>
      <td>
        <div className="flex flex-wrap items-center gap-1">
          {t.links.slice(0, 2).map((l) => (
            <span key={l.id} className="wbs-link-chip" title={l.href}>
              {l.label}
            </span>
          ))}
          <button type="button" className="text-xs font-medium text-[var(--color-navy)]" onClick={onOpenLinks}>
            + Link
          </button>
        </div>
      </td>
      <td className="text-right">
        <button type="button" className="btn btn-ghost text-sm" onClick={() => onDeleteTask(t.id)}>
          Delete
        </button>
      </td>
    </tr>
  );
}
