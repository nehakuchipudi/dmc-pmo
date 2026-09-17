"use client";

import { clsx } from "clsx";
import { TonePill } from "@/components/records/RecordChrome";
import {
  PROJECT_LIFECYCLE_STATUSES,
  allowedProjectTransitions,
  canChangeProjectStatus,
} from "@/lib/project-lifecycle";
import type { ProjectStatus, ProjectStatusChange, ProjectWorkflow, Role } from "@/lib/types";

export function ProjectLifecycleBar({
  status,
  workflow,
  role,
  onChange,
}: {
  status: ProjectStatus;
  workflow: ProjectWorkflow;
  role?: Role;
  onChange: (next: ProjectStatus) => void;
}) {
  const allowed = new Set(allowedProjectTransitions(status, workflow));
  const canChange = canChangeProjectStatus(role, workflow);

  return (
    <div className="lifecycle-bar" aria-label="Project lifecycle">
      <div className="lifecycle-current">
        <span className="lifecycle-kicker">Lifecycle</span>
        <TonePill value={status} />
      </div>
      <div className="lifecycle-steps" role="list">
        {PROJECT_LIFECYCLE_STATUSES.map((step) => {
          const current = step === status;
          const valid = allowed.has(step);
          const clickable = canChange && valid && !current;
          return (
            <button
              key={step}
              type="button"
              role="listitem"
              className={clsx(
                "lifecycle-step",
                current && "is-current",
                valid && !current && "is-allowed",
                !valid && !current && "is-blocked",
              )}
              disabled={!clickable}
              title={
                current
                  ? "Current status"
                  : !canChange
                    ? "Only authorized roles can change status"
                    : valid
                      ? `Move to ${step}`
                      : `Cannot move from ${status} to ${step}`
              }
              onClick={() => onChange(step)}
            >
              {step}
            </button>
          );
        })}
      </div>
      {!canChange ? (
        <p className="lifecycle-hint">Status changes are limited to PMs, admins, and leadership.</p>
      ) : (
        <p className="lifecycle-hint">Only allowed transitions can be selected.</p>
      )}
    </div>
  );
}

export function ProjectStatusHistory({ items }: { items: ProjectStatusChange[] }) {
  const rows = [...items].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <ol className="status-history">
      {rows.map((row) => (
        <li key={row.id} className="status-history-item">
          <div className="status-history-path">
            <TonePill value={row.from} />
            <span aria-hidden="true">to</span>
            <TonePill value={row.to} />
          </div>
          <div className="status-history-meta">
            {row.actor} · {row.when}
          </div>
        </li>
      ))}
      {!rows.length ? <li className="text-sm text-[var(--color-muted)]">No status changes yet.</li> : null}
    </ol>
  );
}
