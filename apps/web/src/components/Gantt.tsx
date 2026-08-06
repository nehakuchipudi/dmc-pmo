"use client";

import { formatDisplayDate } from "@/lib/seed";
import type { Milestone, Project, Task } from "@/lib/types";

function toTime(iso: string) {
  return new Date(`${iso}T12:00:00`).getTime();
}

export function GanttView({
  project,
  milestones,
  tasks,
}: {
  project: Project;
  milestones: Milestone[];
  tasks: Task[];
}) {
  const start = Math.min(
    toTime(project.start),
    ...milestones.map((m) => toTime(m.start)),
    ...tasks.map((t) => toTime(t.start)),
  );
  const end = Math.max(
    toTime(project.due),
    ...milestones.map((m) => toTime(m.due)),
    ...tasks.map((t) => toTime(t.due)),
  );
  const span = Math.max(end - start, 1);

  function styleFor(a: string, b: string) {
    const left = ((toTime(a) - start) / span) * 100;
    const width = Math.max(((toTime(b) - toTime(a)) / span) * 100, 4);
    return { left: `${left}%`, width: `${width}%` };
  }

  const rows = [
    ...milestones.map((m) => ({
      id: m.id,
      label: m.name,
      meta: `Milestone · ${m.status}`,
      start: m.start,
      due: m.due,
      kind: "milestone" as const,
    })),
    ...tasks.map((t) => ({
      id: t.id,
      label: t.name,
      meta: `${t.assignee} · ${t.status}`,
      start: t.start,
      due: t.due,
      kind: "task" as const,
    })),
  ];

  return (
    <div className="panel p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-semibold text-[var(--color-navy)]">Project plan (Gantt)</h2>
          <p className="text-sm text-[var(--color-muted)]">
            {formatDisplayDate(project.start)} to {formatDisplayDate(project.due)}
          </p>
        </div>
      </div>
      <div className="gantt">
        {rows.map((row) => (
          <div key={row.id} className="gantt-row">
            <div>
              <div className="text-sm font-medium">{row.label}</div>
              <div className="text-xs text-[var(--color-muted)]">{row.meta}</div>
            </div>
            <div className="gantt-track" title={`${formatDisplayDate(row.start)} to ${formatDisplayDate(row.due)}`}>
              <div className={`gantt-bar ${row.kind === "milestone" ? "milestone" : ""}`} style={styleFor(row.start, row.due)} />
            </div>
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-[var(--color-muted)]">Add milestones and tasks to build the plan.</p> : null}
      </div>
    </div>
  );
}
