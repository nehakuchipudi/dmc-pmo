"use client";

import { TonePill } from "@/components/records/RecordChrome";
import { computeProjectInsights, type InsightHealth } from "@/lib/project-insights";
import { formatDisplayDate, money } from "@/lib/seed";
import type { Expense, Milestone, Project, ResourceAllocation, RiskItem, Task, TeamMember, TimeEntry } from "@/lib/types";

function healthClass(health: InsightHealth) {
  if (health === "Healthy") return "is-healthy";
  if (health === "Watch") return "is-watch";
  return "is-critical";
}

function HealthCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: InsightHealth;
  hint: string;
}) {
  return (
    <div className={`insight-kpi ${healthClass(value)}`}>
      <div className="insight-kpi-label">{label}</div>
      <div className="insight-kpi-value">
        <TonePill value={value} />
      </div>
      <div className="insight-kpi-hint">{hint}</div>
    </div>
  );
}

function CompareChart({
  title,
  plannedLabel,
  actualLabel,
  extraLabel,
  planned,
  actual,
  extra,
  plannedText,
  actualText,
  extraText,
}: {
  title: string;
  plannedLabel: string;
  actualLabel: string;
  extraLabel?: string;
  planned: number;
  actual: number;
  extra?: number;
  plannedText: string;
  actualText: string;
  extraText?: string;
}) {
  const max = Math.max(planned, actual, extra ?? 0, 1);
  return (
    <div className="panel p-4">
      <h2 className="section-title">{title}</h2>
      <div className="insight-compare" role="img" aria-label={title}>
        <div className="insight-compare-row">
          <span>{plannedLabel}</span>
          <div className="insight-compare-track">
            <span className="is-planned" style={{ width: `${Math.min(100, (planned / max) * 100)}%` }} />
          </div>
          <strong>{plannedText}</strong>
        </div>
        <div className="insight-compare-row">
          <span>{actualLabel}</span>
          <div className="insight-compare-track">
            <span className="is-actual" style={{ width: `${Math.min(100, (actual / max) * 100)}%` }} />
          </div>
          <strong>{actualText}</strong>
        </div>
        {extraLabel && extraText !== undefined ? (
          <div className="insight-compare-row">
            <span>{extraLabel}</span>
            <div className="insight-compare-track">
              <span className="is-extra" style={{ width: `${Math.min(100, ((extra ?? 0) / max) * 100)}%` }} />
            </div>
            <strong>{extraText}</strong>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ProjectInsights({
  project,
  tasks,
  milestones,
  timeEntries,
  expenses,
  allocations,
  team,
  risks,
  memberNames,
  onOpenTasks,
  onOpenSchedule,
}: {
  project: Project;
  tasks: Task[];
  milestones: Milestone[];
  timeEntries: TimeEntry[];
  expenses: Expense[];
  allocations: ResourceAllocation[];
  team: TeamMember[];
  risks: RiskItem[];
  memberNames: string[];
  onOpenTasks: () => void;
  onOpenSchedule: () => void;
}) {
  const insights = computeProjectInsights({
    project,
    tasks,
    milestones,
    timeEntries,
    expenses,
    allocations,
    team,
    risks,
    memberNames,
  });

  return (
    <div className="insights-dashboard">
      <div className="insights-health">
        <HealthCard
          label="Overall"
          value={insights.overall}
          hint={`${insights.overdueTasks.length} overdue ${insights.overdueTasks.length === 1 ? "task" : "tasks"}, ${insights.openRisks.length} open ${insights.openRisks.length === 1 ? "risk" : "risks"}`}
        />
        <HealthCard
          label="Schedule"
          value={insights.schedule}
          hint={
            insights.overdueTasks.length
              ? `${insights.overdueTasks.length} overdue, deadline ${formatDisplayDate(project.due)}`
              : `Deadline ${formatDisplayDate(project.due)}`
          }
        />
        <HealthCard
          label="Budget"
          value={insights.budget}
          hint={`${insights.costPct}% of ${money(insights.plannedCost)} spent`}
        />
        <HealthCard
          label="Resources"
          value={insights.resource}
          hint={
            insights.rosterCount
              ? `Avg load ${insights.avgUtilization}% across ${insights.rosterCount} people`
              : "No allocations yet"
          }
        />
        <HealthCard
          label="Risk"
          value={insights.risk}
          hint={insights.openRisks.length ? `${insights.openRisks.length} open or mitigating` : "No open risks"}
        />
      </div>

      <div className="insights-kpis">
        <div className="insight-kpi">
          <div className="insight-kpi-label">Progress</div>
          <div className="insight-kpi-value">{insights.progress}%</div>
          <div className="insight-kpi-hint">
            {tasks.filter((task) => task.status === "Done").length} of {tasks.length} {tasks.length === 1 ? "task" : "tasks"} done
          </div>
          <div className="insight-meter">
            <span style={{ width: `${Math.min(100, insights.progress)}%` }} />
          </div>
        </div>
        <div className="insight-kpi">
          <div className="insight-kpi-label">Hours</div>
          <div className="insight-kpi-value">
            {insights.actualHours}h / {insights.plannedHours}h
          </div>
          <div className="insight-kpi-hint">
            {insights.hoursVariance >= 0 ? `${insights.hoursVariance}h remaining` : `${Math.abs(insights.hoursVariance)}h over plan`}
          </div>
          <div className="insight-meter">
            <span style={{ width: `${Math.min(100, insights.hoursPct)}%` }} />
          </div>
        </div>
        <div className="insight-kpi">
          <div className="insight-kpi-label">Spend</div>
          <div className="insight-kpi-value">{money(insights.actualCost)}</div>
          <div className="insight-kpi-hint">
            {insights.costVariance >= 0
              ? `${money(insights.costVariance)} under budget`
              : `${money(Math.abs(insights.costVariance))} over budget`}
          </div>
          <div className="insight-meter">
            <span style={{ width: `${Math.min(100, insights.costPct)}%` }} />
          </div>
        </div>
        <div className="insight-kpi">
          <div className="insight-kpi-label">Milestones</div>
          <div className="insight-kpi-value">{insights.milestonePct}%</div>
          <div className="insight-kpi-hint">
            {insights.milestoneRows.filter((row) => row.status === "Approved").length} of {insights.milestoneRows.length} phases approved
          </div>
          <div className="insight-meter">
            <span style={{ width: `${Math.min(100, insights.milestonePct)}%` }} />
          </div>
        </div>
      </div>

      <div className="insights-split">
        <CompareChart
          title="Planned vs actual hours"
          plannedLabel="Planned"
          actualLabel="Actual"
          extraLabel="Task estimates"
          planned={insights.plannedHours}
          actual={insights.actualHours}
          extra={insights.estimateHours}
          plannedText={`${insights.plannedHours}h`}
          actualText={`${insights.actualHours}h`}
          extraText={`${insights.estimateHours}h`}
        />
        <CompareChart
          title="Budget vs actual"
          plannedLabel="Budget"
          actualLabel="Actual"
          extraLabel="Earned"
          planned={insights.plannedCost}
          actual={insights.actualCost}
          extra={insights.earned}
          plannedText={money(insights.plannedCost)}
          actualText={money(insights.actualCost)}
          extraText={money(insights.earned)}
        />
      </div>

      <div className="insights-split">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="section-title">Milestone progress</h2>
            <button type="button" className="text-sm font-semibold text-[var(--color-navy)]" onClick={onOpenSchedule}>
              Open schedule
            </button>
          </div>
          <div className="insight-milestones">
            {insights.milestoneRows.map((row) => (
              <div key={row.id} className="insight-milestone">
                <div className="insight-milestone-head">
                  <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      Due {formatDisplayDate(row.due)} · {row.taskCount} {row.taskCount === 1 ? "task" : "tasks"}
                    </div>
                  </div>
                  <TonePill value={row.status} />
                </div>
                <div className="insight-meter">
                  <span style={{ width: `${Math.min(100, row.progress)}%` }} />
                </div>
                <div className="insight-milestone-meta">
                  {row.progress}% complete{row.overdue ? " · overdue" : ""}
                </div>
              </div>
            ))}
            {!insights.milestoneRows.length ? (
              <p className="text-sm text-[var(--color-muted)]">No milestones on this project.</p>
            ) : null}
          </div>
        </div>

        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="section-title">Overdue tasks</h2>
            <button type="button" className="text-sm font-semibold text-[var(--color-navy)]" onClick={onOpenTasks}>
              Open tasks
            </button>
          </div>
          {insights.overdueTasks.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Owner</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {insights.overdueTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="font-medium">{task.name}</td>
                    <td>{task.assignee}</td>
                    <td>{formatDisplayDate(task.due)}</td>
                    <td>
                      <TonePill value={task.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">No overdue tasks as of {formatDisplayDate(insights.asOf)}.</p>
          )}
        </div>
      </div>

      <div className="insights-split">
        <div className="panel p-4">
          <h2 className="section-title">Upcoming deadlines</h2>
          {insights.upcoming.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {insights.upcoming.map((row) => (
                  <tr key={`${row.kind}-${row.id}`}>
                    <td className="font-medium">{row.name}</td>
                    <td className="capitalize">{row.kind}</td>
                    <td>{formatDisplayDate(row.due)}</td>
                    <td>
                      <TonePill value={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">No upcoming deadlines after {formatDisplayDate(insights.asOf)}.</p>
          )}
        </div>
        <div className="panel p-4">
          <h2 className="section-title">Open risks</h2>
          {insights.openRisks.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Risk</th>
                  <th>Impact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {insights.openRisks.map((risk) => (
                  <tr key={risk.id}>
                    <td className="font-medium">{risk.title}</td>
                    <td>{risk.impact}</td>
                    <td>
                      <TonePill value={risk.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">No open risks on this project.</p>
          )}
        </div>
      </div>
    </div>
  );
}
