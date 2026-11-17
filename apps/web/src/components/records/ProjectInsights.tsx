"use client";

import { useState } from "react";
import { Clock3, Wallet } from "lucide-react";
import { TonePill } from "@/components/records/RecordChrome";
import { formatHours } from "@/lib/plan-allocation";
import { computeProjectInsights, type InsightTrendPoint } from "@/lib/project-insights";
import { formatDisplayDate, money } from "@/lib/seed";
import type { Expense, Milestone, Project, ResourceAllocation, RiskItem, Task, TeamMember, TimeEntry } from "@/lib/types";

type ChartView = "bars" | "rings";

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

function polyline(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
}

function BudgetTimeLine({
  points,
  approvedBudget,
  approvedHours,
}: {
  points: InsightTrendPoint[];
  approvedBudget: number;
  approvedHours: number;
}) {
  const width = 640;
  const height = 220;
  const pad = { l: 36, r: 16, t: 16, b: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const maxPct = Math.max(100, ...points.map((point) => Math.max(point.hoursPct, point.spendPct)), 1);
  const gap = points.length ? innerW / Math.max(points.length - 1, 1) : innerW;
  const coords = (pct: number, index: number) => ({
    x: pad.l + (points.length === 1 ? innerW / 2 : gap * index),
    y: pad.t + innerH - (pct / maxPct) * innerH,
  });
  const spend = points.map((point, index) => coords(point.spendPct, index));
  const hours = points.map((point, index) => coords(point.hoursPct, index));
  const capY = coords(100, 0).y;
  const ticks = [0, 50, 100].filter((tick) => tick <= maxPct);
  if (maxPct > 100) ticks.push(Math.round(maxPct));

  return (
    <svg className="insight-line" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Budget and time over months">
      {ticks.map((tick) => {
        const y = coords(tick, 0).y;
        return (
          <g key={tick}>
            <line className="insight-line-grid" x1={pad.l} y1={y} x2={width - pad.r} y2={y} />
            <text className="spark-label" x={pad.l - 8} y={y + 3} textAnchor="end">
              {tick}%
            </text>
          </g>
        );
      })}
      <line className="insight-line-cap" x1={pad.l} y1={capY} x2={width - pad.r} y2={capY} />
      <path d={polyline(spend)} className="insight-line-spend" />
      <path d={polyline(hours)} className="insight-line-hours" />
      {spend.map((point, index) => (
        <circle
          key={`s-${points[index].key}`}
          className="insight-line-spend-dot"
          cx={point.x}
          cy={point.y}
          r="3.5"
        >
          <title>
            {points[index].label}: spent {money(points[index].spend)} of {money(approvedBudget)}
          </title>
        </circle>
      ))}
      {hours.map((point, index) => (
        <circle
          key={`h-${points[index].key}`}
          className="insight-line-hours-dot"
          cx={point.x}
          cy={point.y}
          r="3.5"
        >
          <title>
            {points[index].label}: logged {formatHours(points[index].hours)} of {formatHours(approvedHours)}
          </title>
        </circle>
      ))}
      {points.map((point, index) => (
        <text key={point.key} className="spark-label" x={coords(0, index).x} y={height - 6} textAnchor="middle">
          {point.label}
        </text>
      ))}
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
  const budgetOver = insights.remainingBudget < 0;
  const timeOver = insights.remainingHours < 0;
  const overdueMax = Math.max(1, ...insights.overdueTasks.map((row) => row.daysLate));

  return (
    <div className="insights-dashboard">
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

      <section className="insight-budget-card">
        <div className="insight-budget-head">
          <h2 className="section-title">Budget and time over time</h2>
          <div className="insight-line-legend">
            <span className="is-spend">Spend</span>
            <span className="is-hours">Hours</span>
            <span className="is-cap">Approved cap</span>
          </div>
        </div>
        <BudgetTimeLine points={insights.trend} approvedBudget={insights.plannedCost} approvedHours={insights.plannedHours} />
        <p className="insight-budget-note">
          Cumulative spend and logged hours as a percent of the approved project budget and hours.
        </p>
      </section>

      <div className="insights-widgets">
        <section className="insight-budget-card insight-overdue-card">
          <div className="insight-budget-head">
            <h2 className="section-title">
              Overdue Tasks
              {insights.overdueTasks.length ? (
                <span className="insight-overdue-count">{insights.overdueTasks.length}</span>
              ) : null}
            </h2>
            <button type="button" className="text-sm font-semibold text-[var(--color-navy)]" onClick={onOpenSchedule}>
              Open schedule
            </button>
          </div>
          {insights.overdueTasks.length ? (
            <div className="table-wrap insight-overdue-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Late</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.overdueTasks.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.assignee || "Unassigned"}</td>
                      <td>
                        <TonePill value={row.status} />
                      </td>
                      <td className="is-due">{formatDisplayDate(row.due)}</td>
                      <td>
                        <div className="insight-late">
                          <span className="insight-late-days">{row.daysLate}d</span>
                          <span className="insight-late-bar" aria-hidden>
                            <span style={{ width: `${Math.min(100, (row.daysLate / overdueMax) * 100)}%` }} />
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="insight-overdue-empty">No overdue tasks</p>
          )}
        </section>

        <section className="insight-budget-card">
          <div className="insight-budget-head">
            <h2 className="section-title">Team load</h2>
          </div>
          <div className="insight-budget-value">{insights.avgUtilization}%</div>
          <div className="insight-budget-used">
            {insights.rosterCount
              ? `Avg utilization across ${insights.rosterCount} ${insights.rosterCount === 1 ? "person" : "people"}`
              : "No allocations yet"}
          </div>
          {insights.teamLoad.length ? (
            <div className="insight-load-list">
              {insights.teamLoad.map((row) => (
                <div key={row.name} className="insight-load-row">
                  <span>{row.name}</span>
                  <div className="insight-budget-bar">
                    <span className={row.pct > 100 ? "is-over" : "is-time"} style={{ width: `${Math.min(100, row.pct)}%` }} />
                  </div>
                  <strong className={row.pct > 100 ? "is-over" : undefined}>{row.pct}%</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="insight-budget-note">Assign people on Team to see load.</p>
          )}
          {insights.overloaded ? (
            <div className="insight-budget-remain is-over">{insights.overloaded} over capacity</div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
