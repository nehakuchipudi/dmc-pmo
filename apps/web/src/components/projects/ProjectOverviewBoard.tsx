"use client";

import { Fragment, useMemo, useState } from "react";
import { TonePill } from "@/components/records/RecordChrome";
import { formatShortDate, money } from "@/lib/seed";
import { tasksForMilestone } from "@/lib/project-plan";
import type { Milestone, Task } from "@/lib/types";

function taskBudget(task: Task) {
  return task.budgetAmount ?? (task.estimateHours || 0) * 180;
}

export function ProjectOverviewBoard({
  phases,
  milestones,
  tasks,
  hoursByTaskId,
  team,
  statusFilter,
  assigneeFilter,
  query,
  onStatusFilter,
  onAssigneeFilter,
  onQuery,
  onEditPlan,
  onAddTask,
}: {
  phases: Milestone[];
  milestones: Milestone[];
  tasks: Task[];
  hoursByTaskId: Record<string, number>;
  team: string[];
  statusFilter: string;
  assigneeFilter: string;
  query: string;
  onStatusFilter: (value: string) => void;
  onAssigneeFilter: (value: string) => void;
  onQuery: (value: string) => void;
  onEditPlan: () => void;
  onAddTask: () => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const q = query.trim().toLowerCase();

  const rows = useMemo(() => {
    return phases.map((phase) => {
      const phaseTasks = tasksForMilestone(phase.id, tasks, milestones).filter((task) => {
        if (statusFilter !== "All" && task.status !== statusFilter) return false;
        if (assigneeFilter !== "All" && task.assignee !== assigneeFilter) return false;
        if (q && !task.name.toLowerCase().includes(q) && !phase.name.toLowerCase().includes(q)) return false;
        return true;
      });
      const used = phaseTasks.reduce((sum, task) => sum + (hoursByTaskId[task.id] ?? 0), 0);
      const budgetHours = phaseTasks.reduce((sum, task) => sum + (task.estimateHours || 0), 0);
      const progress = phaseTasks.length
        ? Math.round(phaseTasks.reduce((sum, task) => sum + task.progress, 0) / phaseTasks.length)
        : 0;
      const budget = phaseTasks.reduce((sum, task) => sum + taskBudget(task), 0);
      return {
        phase,
        phaseTasks,
        used,
        budgetHours,
        progress,
        earned: Math.round((progress / 100) * budget),
        budget,
      };
    });
  }, [assigneeFilter, hoursByTaskId, milestones, phases, q, statusFilter, tasks]);

  return (
    <div className="overview-plan">
      <div className="overview-plan-toolbar">
        <select className="field-input" value={statusFilter} onChange={(e) => onStatusFilter(e.target.value)}>
          {["All", "Not Started", "In Progress", "Review", "Done"].map((status) => (
            <option key={status} value={status}>
              Status: {status}
            </option>
          ))}
        </select>
        <select className="field-input" value={assigneeFilter} onChange={(e) => onAssigneeFilter(e.target.value)}>
          {["All", ...team].map((name) => (
            <option key={name} value={name}>
              {name === "All" ? "Milestone manager / task assignee: All" : name}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost" onClick={onEditPlan}>
          Edit plan
        </button>
        <button type="button" className="btn btn-ghost" onClick={onAddTask}>
          Add task
        </button>
        <input
          className="field-input overview-plan-search"
          placeholder="Search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>
      <div className="panel overflow-hidden">
        <table className="table overview-plan-table">
          <thead>
            <tr>
              <th>Milestones and tasks</th>
              <th>Status</th>
              <th>Earned value</th>
              <th>Usage / budget</th>
              <th>Start</th>
              <th>Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ phase, phaseTasks, used, budgetHours, progress, earned, budget }) => {
              const open = !collapsed[phase.id];
              return (
                <Fragment key={phase.id}>
                  <tr>
                    <td>
                      <button
                        type="button"
                        className="overview-plan-toggle"
                        onClick={() => setCollapsed((prev) => ({ ...prev, [phase.id]: !prev[phase.id] }))}
                        aria-expanded={open}
                      >
                        {open ? "▾" : "▸"} {phase.name}
                      </button>
                      <div className="text-xs text-[var(--color-muted)]">
                        {phase.contractorName || "Unassigned"}
                      </div>
                    </td>
                    <td>
                      <TonePill value={phase.status} />
                    </td>
                    <td className="tabular-nums">
                      {money(earned)} / {money(budget)}
                      <div className="text-xs text-[var(--color-muted)]">{progress}%</div>
                    </td>
                    <td className="tabular-nums">
                      {used}h / {budgetHours}h
                    </td>
                    <td>{formatShortDate(phase.start)}</td>
                    <td>{formatShortDate(phase.due)}</td>
                    <td className="text-[var(--color-muted)]">{phase.contractorName || "Unassigned"}</td>
                  </tr>
                  {open
                    ? phaseTasks.map((task) => (
                        <tr key={task.id}>
                          <td className="overview-plan-task">{task.name}</td>
                          <td>
                            <TonePill value={task.status} />
                          </td>
                          <td className="tabular-nums">
                            {money(Math.round((task.progress / 100) * taskBudget(task)))} / {money(taskBudget(task))}
                          </td>
                          <td className="tabular-nums">
                            {hoursByTaskId[task.id] ?? 0}h / {task.estimateHours || 0}h
                          </td>
                          <td>{formatShortDate(task.start)}</td>
                          <td>{formatShortDate(task.due)}</td>
                          <td className="text-[var(--color-muted)]">{task.assignee || "Unassigned"}</td>
                        </tr>
                      ))
                    : null}
                </Fragment>
              );
            })}
            {!rows.length ? (
              <tr>
                <td colSpan={7} className="text-[var(--color-muted)]">
                  No milestones yet. Open Edit plan to add one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
