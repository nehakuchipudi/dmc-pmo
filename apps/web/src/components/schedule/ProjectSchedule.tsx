"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type UIEvent,
} from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { clampSplitPct } from "@/lib/mentions";
import {
  addDays,
  buildPlanRows,
  ganttDayLabel,
  ganttMonthBands,
  isWeekend,
  moveIdInList,
  phaseMilestones,
  type PlanRow,
} from "@/lib/project-plan";
import { formatShortDate, money } from "@/lib/seed";
import type { Company, Milestone, Task, TaskLink, TaskStatus } from "@/lib/types";

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
  contractorCompanies = [],
  rateFor,
  onUpdateDates,
  onAddPhase,
  onAddTask,
  onAddSubtask,
  onUpdateTask,
  onUpdateMilestone,
  onDeleteTask,
  onDeleteMilestone,
  onReorderTasks,
  onReorderMilestones,
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
  contractorCompanies?: Company[];
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
  onReorderMilestones: (orderedIds: string[]) => void;
  onAddTaskLink: (taskId: string, link: Omit<TaskLink, "id">) => void;
  onRemoveTaskLink: (taskId: string, linkId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [linkTaskId, setLinkTaskId] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkFileId, setLinkFileId] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [scale, setScale] = useState<"Days" | "Weeks">("Days");
  const [paneWidth, setPaneWidth] = useState(0);
  const [splitPct, setSplitPct] = useState(() => {
    if (typeof window === "undefined") return 46;
    const raw = Number(window.localStorage.getItem("dmc-pmo-plan-split"));
    return Number.isFinite(raw) && raw > 0 ? clampSplitPct(raw) : 38;
  });
  const [splitting, setSplitting] = useState(false);
  const zoom = 36;
  const tableRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const splitDrag = useRef<{ startX: number; startPct: number } | null>(null);
  const syncingScroll = useRef(false);
  const dragRef = useRef<{
    id: string;
    mode: "move" | "start" | "end";
    startX: number;
    start: string;
    due: string;
    kind: "task" | "milestone";
  } | null>(null);

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
  const monthBands = ganttMonthBands(ticks);
  const minZoom = scale === "Days" ? 28 : 22;
  const fittedZoom = paneWidth > 0 ? Math.floor((paneWidth - 2) / Math.max(ticks.length, 1)) : 0;
  const cellWidth = Math.max(minZoom, fittedZoom || zoom);
  const timelineWidth = Math.max(ticks.length * cellWidth, paneWidth || 520);
  const span = Math.max(Date.parse(`${bounds.end}T12:00:00`) - Date.parse(`${bounds.start}T12:00:00`), 1);
  const today = new Date().toISOString().slice(0, 10);
  const todayOffset = Date.parse(`${today}T12:00:00`) - Date.parse(`${bounds.start}T12:00:00`);
  const todayPct = todayOffset >= 0 && todayOffset <= span ? (todayOffset / span) * 100 : null;
  const compact = true;
  const phases = phaseMilestones(milestones);

  useLayoutEffect(() => {
    const pane = ganttRef.current;
    if (!pane) return;
    const measure = () => setPaneWidth(pane.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    return () => observer.disconnect();
  }, [scale, visibleRows.length]);

  function pctLeft(iso: string) {
    const left = ((Date.parse(`${iso}T12:00:00`) - Date.parse(`${bounds.start}T12:00:00`)) / span) * 100;
    return Math.max(0, Math.min(100, left));
  }
  function pctWidth(start: string, due: string) {
    const a = Date.parse(`${start}T12:00:00`);
    const b = Date.parse(`${due}T12:00:00`);
    return Math.max(((Math.max(a, b) - Math.min(a, b)) / span) * 100, 1.8);
  }

  function syncScroll(source: "table" | "gantt") {
    return (event: UIEvent<HTMLDivElement>) => {
      if (syncingScroll.current) return;
      const other = source === "table" ? ganttRef.current : tableRef.current;
      if (!other) return;
      syncingScroll.current = true;
      other.scrollTop = event.currentTarget.scrollTop;
      syncingScroll.current = false;
    };
  }

  function toggle(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function siblingIds(row: PlanRow) {
    if (row.kind === "milestone") {
      const parentId = row.milestone?.parentId;
      return visibleRows
        .filter((item) => item.kind === "milestone" && item.milestone?.parentId === parentId)
        .map((item) => item.id);
    }
    if (row.kind === "subtask") {
      return visibleRows
        .filter((item) => item.kind === "subtask" && item.parentTaskId === row.parentTaskId)
        .map((item) => item.id);
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
    if (row.kind === "project") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: row.id,
      mode,
      startX: event.clientX,
      start: row.start,
      due: row.due,
      kind: row.kind === "milestone" ? "milestone" : "task",
    };
  }

  function moveBar(event: ReactPointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dayPx = timelineWidth / dayCount;
    const days = Math.round((event.clientX - drag.startX) / dayPx);
    if (!days) return;
    const patch =
      drag.mode === "move"
        ? { start: addDays(drag.start, days), due: addDays(drag.due, days) }
        : drag.mode === "start"
          ? addDays(drag.start, days) <= drag.due
            ? { start: addDays(drag.start, days) }
            : null
          : addDays(drag.due, days) >= drag.start
            ? { due: addDays(drag.due, days) }
            : null;
    if (!patch) return;
    if (drag.kind === "milestone") onUpdateMilestone(drag.id, patch);
    else onUpdateTask(drag.id, patch);
  }

  function endBarDrag() {
    dragRef.current = null;
  }

  function persistSplit(next: number) {
    const value = clampSplitPct(next);
    setSplitPct(value);
    if (typeof window !== "undefined") window.localStorage.setItem("dmc-pmo-plan-split", String(value));
  }

  function beginSplit(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    splitDrag.current = { startX: event.clientX, startPct: splitPct };
    setSplitting(true);
  }

  function moveSplit(event: ReactPointerEvent<HTMLDivElement>) {
    if (!splitDrag.current || !boardRef.current) return;
    const width = boardRef.current.clientWidth;
    if (!width) return;
    persistSplit(splitDrag.current.startPct + ((event.clientX - splitDrag.current.startX) / width) * 100);
  }

  function endSplit() {
    splitDrag.current = null;
    setSplitting(false);
  }

  const people = assignees.length ? assignees : ["M. Doyle", "J. Kim", "S. Ahmed", "S. Cho", "J. Alvarez"];
  const selected = visibleRows.find((row) => row.id === selectedId);

  function addTaskFromToolbar() {
    if (selected?.kind === "milestone") {
      onAddTask(selected.id);
      return;
    }
    if (selected?.kind === "task") {
      onAddTask(selected.milestoneId ?? phases[0]?.id ?? selected.id);
      return;
    }
    if (selected?.kind === "subtask" && selected.parentTaskId) {
      onAddSubtask(selected.parentTaskId);
      return;
    }
    if (phases[0]) onAddTask(phases[0].id);
    else onAddPhase();
  }

  function deleteSelected() {
    if (!selected) return;
    if (selected.kind === "milestone") onDeleteMilestone(selected.id);
    if (selected.kind === "task" || selected.kind === "subtask") onDeleteTask(selected.id);
    setSelectedId(null);
  }

  function moveSelected(direction: -1 | 1) {
    if (!selected || selected.kind === "project") return;
    const ordered = moveIdInList(siblingIds(selected), selected.id, direction);
    if (!ordered) return;
    if (selected.kind === "milestone") onReorderMilestones(ordered);
    else onReorderTasks(ordered);
  }

  const moveIds = selected && selected.kind !== "project" ? siblingIds(selected) : [];
  const selectedAt = selected ? moveIds.indexOf(selected.id) : -1;
  const canMoveUp = selectedAt > 0;
  const canMoveDown = selectedAt >= 0 && selectedAt < moveIds.length - 1;

  return (
    <div className="plan-workspace">
      <div className="plan-head-line">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">Project plan</h2>
        {projectStart && projectDue && onUpdateDates ? (
          <>
            <label className="inline-flex items-center gap-2 text-sm">
              Planned start
              <input type="date" className="field-input" value={projectStart} onChange={(e) => onUpdateDates(e.target.value, projectDue)} />
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              Deadline
              <input type="date" className="field-input" value={projectDue} onChange={(e) => onUpdateDates(projectStart, e.target.value)} />
            </label>
          </>
        ) : null}
      </div>

      <div className="plan-toolbar">
        <button type="button" className="btn btn-primary" onClick={onAddPhase}>
          Add milestone
        </button>
        <button type="button" className="btn btn-ghost" onClick={addTaskFromToolbar}>
          Add task
        </button>
        <button type="button" className="btn btn-ghost" onClick={deleteSelected} disabled={!selected || selected.kind === "project"}>
          Delete
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => moveSelected(-1)} disabled={!canMoveUp}>
          <ChevronUp size={14} />
          Move up
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => moveSelected(1)} disabled={!canMoveDown}>
          <ChevronDown size={14} />
          Move down
        </button>
        <input
          className="field-input plan-toolbar-search"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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

          <div
            className="plan-board is-split"
            ref={boardRef}
            style={{ ["--plan-split"]: `${splitPct}%` } as CSSProperties}
          >
            <div className="plan-table-wrap panel" ref={tableRef} onScroll={syncScroll("table")}>
              <table className={`wbs-table plan-table ${compact ? "is-compact" : ""}`}>
                <thead>
                  <tr>
                    <th className="wbs-name">Milestones and tasks</th>
                    {compact ? null : <th>Assignee</th>}
                    <th className="wbs-num">Dur.</th>
                    <th className="wbs-date">Start</th>
                    <th className="wbs-date">Due</th>
                    {compact ? null : <th>Status</th>}
                    {compact ? null : <th className="wbs-num">Budget</th>}
                    {compact ? null : <th className="wbs-num">Estimated Hours</th>}
                    {compact ? null : <th className="wbs-num">Actual Hours</th>}
                    {compact ? null : <th>Dependency</th>}
                    {compact ? null : <th />}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const editable = Boolean(row.task);
                    return (
                      <tr
                        key={row.id}
                        className={`plan-row is-${row.kind} ${overId === row.id ? "is-over" : ""} ${draggingId === row.id ? "is-dragging" : ""} ${selectedId === row.id ? "is-selected" : ""}`}
                        onClick={() => setSelectedId(row.id)}
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
                        {compact ? null : (
                        <td>
                          {editable ? (
                            <select className="wbs-select" value={row.assignee} onChange={(e) => onUpdateTask(row.id, { assignee: e.target.value })}>
                              {people.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          ) : row.kind === "milestone" ? (
                            <select
                              className="wbs-select"
                              value={milestones.find((item) => item.id === row.id)?.contractorCompanyId ?? ""}
                              aria-label={`Contractor for ${row.name}`}
                              onChange={(e) => {
                                const company = contractorCompanies.find((item) => item.id === e.target.value);
                                onUpdateMilestone(row.id, {
                                  contractorCompanyId: company?.id,
                                  contractorName: company?.name,
                                  phaseRole: company
                                    ? milestones.find((item) => item.id === row.id)?.phaseRole
                                    : undefined,
                                });
                              }}
                            >
                              <option value="">Unassigned</option>
                              {contractorCompanies.map((company) => (
                                <option key={company.id} value={company.id}>
                                  {company.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[var(--color-muted)]">-</span>
                          )}
                        </td>
                        )}
                        <td className="wbs-num tabular-nums">{row.duration}d</td>
                        <td className="wbs-date">
                          {editable ? (
                            <input type="date" className="wbs-date-input" value={row.start} onChange={(e) => onUpdateTask(row.id, { start: e.target.value })} />
                          ) : row.kind === "milestone" ? (
                            <input type="date" className="wbs-date-input" value={row.start} onChange={(e) => onUpdateMilestone(row.id, { start: e.target.value })} />
                          ) : (
                            <span className="tabular-nums">{formatShortDate(row.start)}</span>
                          )}
                        </td>
                        <td className="wbs-date">
                          {editable ? (
                            <input type="date" className="wbs-date-input" value={row.due} onChange={(e) => onUpdateTask(row.id, { due: e.target.value })} />
                          ) : row.kind === "milestone" ? (
                            <input type="date" className="wbs-date-input" value={row.due} onChange={(e) => onUpdateMilestone(row.id, { due: e.target.value })} />
                          ) : (
                            <span className="tabular-nums">{formatShortDate(row.due)}</span>
                          )}
                        </td>
                        {compact ? null : (
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
                        )}
                        {compact ? null : <td className="wbs-num tabular-nums">{money(row.budget)}</td>}
                        {compact ? null : (
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
                        )}
                        {compact ? null : <td className="wbs-num tabular-nums">{row.actualHours}h</td>}
                        {compact ? null : (
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
                        )}
                        {compact ? null : (
                        <td className="text-right">
                          {row.kind === "milestone" ? (
                            <div className="flex justify-end gap-1">
                              <button type="button" className="btn btn-ghost text-sm" onClick={() => onAddTask(row.id)}>
                                Add task
                              </button>
                              <button type="button" className="btn btn-ghost text-sm" onClick={() => onDeleteMilestone(row.id)}>
                                Delete
                              </button>
                            </div>
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
                        )}
                      </tr>
                    );
                  })}
                  {!visibleRows.length ? (
                    <tr>
                      <td colSpan={compact ? 4 : 11} className="p-8 text-center text-[var(--color-muted)]">
                        No milestones yet. Add a milestone to start the plan.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

              <div
                className={`plan-split-handle ${splitting ? "is-dragging" : ""}`}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize the schedule tables"
                onPointerDown={beginSplit}
                onPointerMove={moveSplit}
                onPointerUp={endSplit}
                onDoubleClick={() => persistSplit(46)}
              >
                <button
                  type="button"
                  className="plan-split-arrow"
                  aria-label="Give more room to the Gantt"
                  onClick={() => persistSplit(splitPct - 8)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="plan-split-grip" aria-hidden />
                <button
                  type="button"
                  className="plan-split-arrow"
                  aria-label="Give more room to the task table"
                  onClick={() => persistSplit(splitPct + 8)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="plan-gantt panel" ref={ganttRef} onScroll={syncScroll("gantt")}>
                <div className="plan-gantt-inner" style={{ width: timelineWidth }}>
                  <div className="plan-gantt-head">
                    <div
                      className="plan-gantt-months"
                      style={{ gridTemplateColumns: monthBands.map((band) => `${band.count * cellWidth}px`).join(" ") }}
                    >
                      {monthBands.map((band) => (
                        <div key={band.key} className="plan-gantt-month">
                          {band.label}
                        </div>
                      ))}
                    </div>
                    <div className="plan-gantt-ticks" style={{ gridTemplateColumns: `repeat(${ticks.length}, ${cellWidth}px)` }}>
                      {ticks.map((tick) => (
                        <div key={tick} className={`plan-gantt-tick ${isWeekend(tick) ? "is-weekend" : ""}`}>
                          {scale === "Days" ? String(Number(tick.slice(8))) : ganttDayLabel(tick)}
                        </div>
                      ))}
                    </div>
                  </div>
                  {visibleRows.map((row) => {
                    const color = rowColor(row, milestoneIndex);
                    return (
                      <div key={`g-${row.id}`} className={`plan-gantt-lane is-${row.kind}`}>
                        {ticks.map((tick) =>
                          isWeekend(tick) ? (
                            <span
                              key={`${row.id}-${tick}`}
                              className="plan-gantt-weekend"
                              style={{
                                left: `${pctLeft(tick)}%`,
                                width: `${Math.max((tickStep / dayCount) * 100, 0.8)}%`,
                              }}
                            />
                          ) : null,
                        )}
                        <div
                          className={`plan-gantt-bar is-${row.kind} ${selectedId === row.id ? "is-selected" : ""}`}
                          style={{
                            left: `${pctLeft(row.start)}%`,
                            width: `${pctWidth(row.start, row.due)}%`,
                            background: color,
                          }}
                          title={`${row.name}: ${formatShortDate(row.start)} to ${formatShortDate(row.due)}`}
                          onClick={() => setSelectedId(row.id)}
                          onPointerDown={(e) => beginBarDrag(e, row, "move")}
                          onPointerMove={moveBar}
                          onPointerUp={endBarDrag}
                        >
                          {row.kind !== "project" ? (
                            <>
                              <span className="plan-gantt-handle is-start" onPointerDown={(e) => { e.stopPropagation(); beginBarDrag(e, row, "start"); }} />
                              {row.task ? <span className="plan-gantt-progress" style={{ width: `${row.progress}%` }} /> : null}
                              <span className="plan-gantt-handle is-end" onPointerDown={(e) => { e.stopPropagation(); beginBarDrag(e, row, "end"); }} />
                            </>
                          ) : null}
                        </div>
                        <span
                          className="plan-gantt-caption"
                          style={{ left: `calc(${pctLeft(row.start)}% + ${pctWidth(row.start, row.due)}% + 8px)` }}
                        >
                          {row.name}
                        </span>
                      </div>
                    );
                  })}
                  {todayPct != null ? <div className="plan-gantt-today" style={{ left: `${todayPct}%` }} aria-hidden /> : null}
                </div>
              </div>
          </div>

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
