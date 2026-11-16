"use client";

import { useState } from "react";
import { Clock3, Wallet } from "lucide-react";
import { TonePill } from "@/components/records/RecordChrome";
import { formatHours } from "@/lib/plan-allocation";
import { computeProjectInsights, type InsightHealth } from "@/lib/project-insights";
import { formatDisplayDate, money } from "@/lib/seed";
import type { Expense, Milestone, Project, ResourceAllocation, RiskItem, Task, TeamMember, TimeEntry } from "@/lib/types";

type ChartView = "bars" | "rings";

function healthClass(health: InsightHealth) {
  if (health === "Healthy") return "is-healthy";
  if (health === "Watch") return "is-watch";
  return "is-critical";
}

function meterPct(used: number, approved: number) {
  if (approved <= 0) return used > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (used / approved) * 100));
}

function remainingClass(value: number) {
  return value < 0 ? "is-over" : "is-ok";
}

function remainingMoney(value: number) {
  return value < 0 ? `${money(Math.abs(value))} over` : `${money(value)} remaining`;
}

function remainingTime(value: number) {
  return value < 0 ? `${formatHours(Math.abs(value))} over` : `${formatHours(value)} remaining`;
}

function Ring({
  pct,
  tone,
  label,
}: {
  pct: number;
  tone: "budget" | "time" | "over";
  label: string;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const fill = Math.min(100, Math.max(0, pct));
  const dash = (fill / 100) * c;
  return (
    <svg className={`insight-ring is-${tone}`} viewBox="0 0 96 96" role="img" aria-label={label}>
      <circle className="insight-ring-track" cx="48" cy="48" r={r} />
      <circle
        className="insight-ring-fill"
        cx="48"
        cy="48"
        r={r}
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 48 48)"
      />
    </svg>
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
  const [chartView, setChartView] = useState<ChartView>("bars");
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
  const approvedPhases = insights.milestoneRows.filter((row) => row.status === "Approved").length;
  const doneTasks = tasks.filter((task) => task.status === "Done").length;
  const statusItems: { label: string; value: InsightHealth }[] = [
    { label: "Overall", value: insights.overall },
    { label: "Schedule", value: insights.schedule },
    { label: "Budget", value: insights.budget },
    { label: "Resources", value: insights.resource },
    { label: "Risk", value: insights.risk },
  ];
  const budgetOver = insights.remainingBudget < 0;
  const timeOver = insights.remainingHours < 0;

  return (
    <div className="insights-dashboard">
      <div className="insights-status" aria-label="Project health">
        {statusItems.map((item) => (
          <div key={item.label} className={`insights-status-chip ${healthClass(item.value)}`}>
            <span className="insights-status-dot" />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <section className="insight-budget-card">
        <div className="insight-budget-head">
          <h2 className="section-title">Project Budget & Time Summary</h2>
          <div className="insight-chart-toggle" role="group" aria-label="Chart style">
            <button type="button" className={chartView === "bars" ? "is-on" : undefined} onClick={() => setChartView("bars")}>
              Bars
            </button>
            <button type="button" className={chartView === "rings" ? "is-on" : undefined} onClick={() => setChartView("rings")}>
              Rings
            </button>
          </div>
        </div>

        <div className={chartView === "rings" ? "insight-budget-grid is-rings" : "insight-budget-grid"}>
          <div className="insight-budget-col">
            {chartView === "rings" ? (
              <div className="insight-ring-wrap">
                <Ring
                  pct={insights.allocatedBudgetPct}
                  tone={budgetOver ? "over" : "budget"}
                  label={`Allocated ${money(insights.allocatedBudget)} of ${money(insights.plannedCost)}`}
                />
                <div>
                  <div className="insight-budget-label">Approved Budget</div>
                  <div className="insight-budget-value">{money(insights.plannedCost)}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="insight-budget-label">Approved Budget</div>
                <div className="insight-budget-value">{money(insights.plannedCost)}</div>
              </>
            )}
            <div className="insight-budget-used">
              <Wallet size={14} />
              {money(insights.allocatedBudget)} allocated
            </div>
            {chartView === "bars" ? (
              <div className="insight-budget-bar" aria-hidden>
                <span
                  className={budgetOver ? "is-over" : "is-budget"}
                  style={{ width: `${meterPct(insights.allocatedBudget, insights.plannedCost)}%` }}
                />
              </div>
            ) : null}
            <div className={`insight-budget-remain ${remainingClass(insights.remainingBudget)}`}>
              {remainingMoney(insights.remainingBudget)}
            </div>
            <div className="insight-budget-note">Spent {money(insights.actualCost)}</div>
          </div>

          <div className="insight-budget-col">
            {chartView === "rings" ? (
              <div className="insight-ring-wrap">
                <Ring
                  pct={insights.allocatedHoursPct}
                  tone={timeOver ? "over" : "time"}
                  label={`Allocated ${formatHours(insights.allocatedHours)} of ${formatHours(insights.plannedHours)}`}
                />
                <div>
                  <div className="insight-budget-label">Approved Time</div>
                  <div className="insight-budget-value">{formatHours(insights.plannedHours)}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="insight-budget-label">Approved Time</div>
                <div className="insight-budget-value">{formatHours(insights.plannedHours)}</div>
              </>
            )}
            <div className="insight-budget-used">
              <Clock3 size={14} />
              {formatHours(insights.allocatedHours)} allocated
            </div>
            {chartView === "bars" ? (
              <div className="insight-budget-bar" aria-hidden>
                <span
                  className={timeOver ? "is-over" : "is-time"}
                  style={{ width: `${meterPct(insights.allocatedHours, insights.plannedHours)}%` }}
                />
              </div>
            ) : null}
            <div className={`insight-budget-remain ${remainingClass(insights.remainingHours)}`}>
              {remainingTime(insights.remainingHours)}
            </div>
            <div className="insight-budget-note">Logged {formatHours(insights.actualHours)}</div>
          </div>
        </div>
      </section>

      <div className="insights-facts">
        <div>
          <span>Progress</span>
          <strong>{insights.progress}%</strong>
          <em>
            {doneTasks} of {tasks.length} {tasks.length === 1 ? "task" : "tasks"} done
          </em>
        </div>
        <div>
          <span>Milestones</span>
          <strong>{insights.milestonePct}%</strong>
          <em>
            {approvedPhases} of {insights.milestoneRows.length} phases approved
          </em>
        </div>
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
