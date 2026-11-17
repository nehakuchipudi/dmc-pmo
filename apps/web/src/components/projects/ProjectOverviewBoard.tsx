"use client";

import { Fragment, useMemo, useState } from "react";
import { TonePill } from "@/components/records/RecordChrome";
import { useAuth } from "@/lib/auth";
import { formatShortDate } from "@/lib/seed";
import { tasksForMilestone } from "@/lib/project-plan";
import type { Milestone, Task } from "@/lib/types";

function AssignCell({
  value,
  people,
  canEdit,
  label,
  onChange,
}: {
  value: string;
  people: string[];
  canEdit: boolean;
  label: string;
  onChange: (name: string) => void;
}) {
  return (
    <td className="overview-assign">
      <button type="button" className="overview-assign-trigger" aria-haspopup="listbox" aria-label={label} disabled={!canEdit}>
        {value || "Unassigned"}
      </button>
      {canEdit ? (
        <div className="overview-assign-menu" role="listbox" aria-label={label}>
          <button type="button" className={!value ? "is-active" : undefined} onClick={() => onChange("")}>
            Unassigned
          </button>
          {people.map((name) => (
            <button
              key={name}
              type="button"
              className={name === value ? "is-active" : undefined}
              onClick={() => onChange(name)}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
    </td>
  );
}

export function ProjectOverviewBoard({
  phases,
  milestones,
  tasks,
  team,
  statusFilter,
  assigneeFilter,
  query,
  onStatusFilter,
  onAssigneeFilter,
  onQuery,
  onEditPlan,
  onAddTask,
  onAssignMilestone,
  onAssignTask,
}: {
  phases: Milestone[];
  milestones: Milestone[];
  tasks: Task[];
  team: string[];
  statusFilter: string;
  assigneeFilter: string;
  query: string;
  onStatusFilter: (value: string) => void;
  onAssigneeFilter: (value: string) => void;
  onQuery: (value: string) => void;
  onEditPlan: () => void;
  onAddTask: () => void;
  onAssignMilestone: (id: string, assignee: string) => void;
  onAssignTask: (id: string, assignee: string) => void;
}) {
  const { can } = useAuth();
  const canAssign = can("manage_plan");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const q = query.trim().toLowerCase();

  const rows = useMemo(() => {
    return phases
      .map((phase) => {
        const phaseTasks = tasksForMilestone(phase.id, tasks, milestones).filter((task) => {
          if (statusFilter !== "All" && task.status !== statusFilter) return false;
          if (assigneeFilter !== "All" && task.assignee !== assigneeFilter) return false;
          if (q && !task.name.toLowerCase().includes(q) && !phase.name.toLowerCase().includes(q)) return false;
          return true;
        });
        return { phase, phaseTasks };
      })
      .filter(({ phase, phaseTasks }) => {
        if (assigneeFilter === "All") return true;
        return phase.assignee === assigneeFilter || phaseTasks.length > 0;
      });
  }, [assigneeFilter, milestones, phases, q, statusFilter, tasks]);

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
      <div className="panel overview-plan-table-wrap">
        <table className="table overview-plan-table">
          <thead>
            <tr>
              <th>Milestones and tasks</th>
              <th>Status</th>
              <th>Start</th>
              <th>Due</th>
              <th>Assigned to</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ phase, phaseTasks }) => {
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
                    </td>
                    <td>
                      <TonePill value={phase.status} />
                    </td>
                    <td>{formatShortDate(phase.start)}</td>
                    <td>{formatShortDate(phase.due)}</td>
                    <AssignCell
                      value={phase.assignee ?? ""}
                      people={team}
                      canEdit={canAssign}
                      label={`Assign ${phase.name}`}
                      onChange={(name) => onAssignMilestone(phase.id, name)}
                    />
                  </tr>
                  {open
                    ? phaseTasks.map((task) => (
                        <tr key={task.id}>
                          <td className="overview-plan-task">{task.name}</td>
                          <td>
                            <TonePill value={task.status} />
                          </td>
                          <td>{formatShortDate(task.start)}</td>
                          <td>{formatShortDate(task.due)}</td>
                          <AssignCell
                            value={task.assignee}
                            people={team}
                            canEdit={canAssign}
                            label={`Assign ${task.name}`}
                            onChange={(name) => onAssignTask(task.id, name)}
                          />
                        </tr>
                      ))
                    : null}
                </Fragment>
              );
            })}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="text-[var(--color-muted)]">
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
