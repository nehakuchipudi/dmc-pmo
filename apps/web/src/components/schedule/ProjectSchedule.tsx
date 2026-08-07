"use client";

import { startTransition, useMemo, useState } from "react";
import { GanttBoard } from "@/components/Gantt";
import type { Milestone, Task, TaskLink, TaskPriority, TaskStatus } from "@/lib/types";

const ASSIGNEES = ["M. Doyle", "J. Kim", "S. Ahmed", "S. Cho", "J. Alvarez"];
const PRIORITIES: TaskPriority[] = ["Critical", "High", "Med", "Low"];
const STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Review", "Done"];

function toTime(iso: string) {
  return new Date(`${iso}T12:00:00`).getTime();
}

function durationDays(start: string, due: string) {
  return Math.max(1, Math.round((toTime(due) - toTime(start)) / 86400000) + 1);
}

function rollup(items: { start: string; due: string; progress: number; status: string }[]) {
  if (!items.length) {
    const today = new Date().toISOString().slice(0, 10);
    return { start: today, due: today, duration: 1, progress: 0 };
  }
  const start = [...items].map((i) => i.start).sort()[0];
  const due = [...items].map((i) => i.due).sort().slice(-1)[0];
  const progress = Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length);
  return { start, due, duration: durationDays(start, due), progress };
}

export function ProjectSchedule({
  milestones,
  tasks,
  projectFiles,
  onAddPhase,
  onAddGroup,
  onAddTask,
  onUpdateTask,
  onUpdateMilestone,
  onDeleteTask,
  onDeleteMilestone,
  onAddTaskLink,
  onRemoveTaskLink,
}: {
  milestones: Milestone[];
  tasks: Task[];
  projectFiles: { id: string; name: string }[];
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
  const [view, setView] = useState<"List" | "Gantt">("List");
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
        const roll = rollup(groupTasks);
        return { group, tasks: groupTasks, roll };
      });
      const orphanTasks = tasks.filter(
        (t) => t.milestoneId === phase.id && matchTask(t),
      );
      const allLeaf = [
        ...groupNodes.flatMap((g) => g.tasks.map((t) => ({ start: t.start, due: t.due, progress: t.progress, status: t.status }))),
        ...orphanTasks.map((t) => ({ start: t.start, due: t.due, progress: t.progress, status: t.status })),
      ];
      return { phase, groups: groupNodes, orphanTasks, roll: rollup(allLeaf) };
    });
  }, [phases, groups, tasks, query]);

  const ganttMilestones = useMemo(() => {
    const rows: Milestone[] = [];
    tree.forEach((p) => {
      rows.push({ ...p.phase, start: p.roll.start, due: p.roll.due });
      p.groups.forEach((g) => {
        rows.push({ ...g.group, start: g.roll.start, due: g.roll.due });
      });
    });
    return rows;
  }, [tree]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Project schedule</h2>
          <p className="text-sm text-[var(--color-muted)]">
            3-level plan: Phase → Workstream → Task. Summary rows roll up dates and progress.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onAddPhase}>
          + Add phase
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="field-input max-w-md flex-1"
          placeholder="Search tasks..."
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

      {view === "List" ? (
        <div className="panel overflow-hidden">
          <table className="wbs-table">
            <thead>
              <tr>
                <th className="wbs-name">Name</th>
                <th>Dur.</th>
                <th>Start</th>
                <th>End</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Progress</th>
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
                        <div className="flex items-center gap-2" style={{ paddingLeft: 0 }}>
                          <button
                            type="button"
                            className="schedule-collapse"
                            onClick={() => setCollapsed((c) => ({ ...c, [p.phase.id]: !c[p.phase.id] }))}
                          >
                            {phaseCollapsed ? "▸" : "▾"}
                          </button>
                          <input
                            className="schedule-title-input"
                            value={p.phase.name}
                            onChange={(e) => onUpdateMilestone(p.phase.id, { name: e.target.value })}
                          />
                        </div>
                      </td>
                      <td className="tabular-nums">{p.roll.duration}</td>
                      <td className="tabular-nums text-sm">{p.roll.start.slice(5)}</td>
                      <td className="tabular-nums text-sm">{p.roll.due.slice(5)}</td>
                      <td className="text-[var(--color-muted)]">-</td>
                      <td>
                        <span className="pill pill-neutral">{p.phase.status}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="schedule-progress">
                            <span style={{ width: `${p.roll.progress}%` }} />
                          </div>
                          <span className="text-xs tabular-nums">{p.roll.progress}%</span>
                        </div>
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
                                  <div className="flex items-center gap-2" style={{ paddingLeft: 22 }}>
                                    <button
                                      type="button"
                                      className="schedule-collapse"
                                      onClick={() =>
                                        setCollapsed((c) => ({ ...c, [g.group.id]: !c[g.group.id] }))
                                      }
                                    >
                                      {groupCollapsed ? "▸" : "▾"}
                                    </button>
                                    <input
                                      className="schedule-title-input"
                                      value={g.group.name}
                                      onChange={(e) => onUpdateMilestone(g.group.id, { name: e.target.value })}
                                    />
                                  </div>
                                </td>
                                <td className="tabular-nums">{g.roll.duration}</td>
                                <td className="tabular-nums text-sm">{g.roll.start.slice(5)}</td>
                                <td className="tabular-nums text-sm">{g.roll.due.slice(5)}</td>
                                <td className="text-[var(--color-muted)]">-</td>
                                <td>
                                  <span className="pill pill-info">{g.group.status}</span>
                                </td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    <div className="schedule-progress">
                                      <span style={{ width: `${g.roll.progress}%` }} />
                                    </div>
                                    <span className="text-xs tabular-nums">{g.roll.progress}%</span>
                                  </div>
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
                                      indent={44}
                                      onUpdateTask={onUpdateTask}
                                      onDeleteTask={onDeleteTask}
                                      onOpenLinks={() => {
                                        setLinkTaskId(t.id);
                                        setLinkLabel("");
                                        setLinkUrl("https://");
                                        setLinkFileId(projectFiles[0]?.id ?? "");
                                      }}
                                      onRemoveLink={onRemoveTaskLink}
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
                            indent={22}
                            onUpdateTask={onUpdateTask}
                            onDeleteTask={onDeleteTask}
                            onOpenLinks={() => setLinkTaskId(t.id)}
                            onRemoveLink={onRemoveTaskLink}
                          />
                        ))
                      : null}
                  </FragmentRows>
                );
              })}
              {!tree.length ? (
                <tr>
                  <td colSpan={9} className="p-6 text-[var(--color-muted)]">
                    No phases yet. Add a phase to start the plan.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                External URL
              </div>
              <input className="field-input mb-2" value={linkLabel} placeholder="Label" onChange={(e) => setLinkLabel(e.target.value)} />
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

function FragmentRows({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function TaskRow({
  task: t,
  indent,
  onUpdateTask,
  onDeleteTask,
  onOpenLinks,
  onRemoveLink,
}: {
  task: Task;
  indent: number;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onOpenLinks: () => void;
  onRemoveLink: (taskId: string, linkId: string) => void;
}) {
  return (
    <tr className="wbs-l3">
      <td>
        <div className="flex items-center gap-2" style={{ paddingLeft: indent }}>
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
        </div>
      </td>
      <td className="tabular-nums">{durationDays(t.start, t.due)}</td>
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
          className="schedule-select"
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
        <div className="flex flex-wrap gap-1">
          {t.links.slice(0, 2).map((l) => (
            <a
              key={l.id}
              href={l.href.startsWith("#") ? undefined : l.href}
              target="_blank"
              rel="noreferrer"
              className="rounded bg-[var(--color-fog)] px-1.5 py-0.5 text-[11px] text-[var(--color-navy)]"
              title={l.href}
              onClick={(e) => {
                if (l.href.startsWith("#")) e.preventDefault();
              }}
            >
              {l.label}
            </a>
          ))}
          <button type="button" className="text-xs text-[var(--color-navy)] underline" onClick={onOpenLinks}>
            + Link
          </button>
          {t.links[0] ? (
            <button
              type="button"
              className="text-[11px] text-[var(--color-muted)]"
              onClick={() => onRemoveLink(t.id, t.links[0].id)}
            >
              ×
            </button>
          ) : null}
        </div>
      </td>
      <td>
        <button type="button" className="btn btn-ghost text-sm" onClick={() => onDeleteTask(t.id)}>
          Delete
        </button>
      </td>
    </tr>
  );
}
