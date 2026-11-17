import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { budgetTimeTrend, computeProjectInsights } from "./project-insights";

const root = dirname(fileURLToPath(import.meta.url));
const ui = readFileSync(join(root, "../components/records/ProjectInsights.tsx"), "utf8");
const css = readFileSync(join(root, "../app/globals.css"), "utf8");
const detail = readFileSync(join(root, "../app/app/projects/[id]/project-detail.tsx"), "utf8");

assert.match(ui, /Project Budget & Time Summary/);
assert.match(ui, /Budget and time over time/);
assert.match(ui, /Overdue Tasks/);
assert.match(ui, /insight-overdue-wrap/);
assert.match(ui, /Team load/);
assert.match(ui, /BudgetTimeLine/);
assert.doesNotMatch(ui, /Schedule runway/);
assert.doesNotMatch(ui, /insights-status/);
assert.doesNotMatch(ui, /insights-facts/);
assert.doesNotMatch(ui, /Milestone progress/);
assert.doesNotMatch(ui, /Open risks/);
assert.doesNotMatch(detail, /Activity vs hours/);
assert.match(css, /\.insight-line-spend/);
assert.match(css, /\.insights-widgets/);
assert.match(css, /\.insight-overdue-wrap/);
assert.match(css, /\.insight-late-bar/);

const trend = budgetTimeTrend({
  start: "2026-06-01",
  due: "2026-08-31",
  asOf: "2026-08-15",
  approvedHours: 40,
  approvedBudget: 4000,
  timeEntries: [
    { id: "a", userName: "A", projectId: "p", projectName: "P", date: "2026-06-10", hours: 10, billable: true, note: "", status: "Approved" },
    { id: "b", userName: "A", projectId: "p", projectName: "P", date: "2026-07-10", hours: 10, billable: true, note: "", status: "Approved" },
  ],
  expenses: [{ id: "e", vendor: "V", projectId: "p", projectName: "P", amount: 200, status: "Approved", date: "2026-07-12", note: "" }],
  rateFor: () => 100,
});
assert.equal(trend.length, 3);
assert.equal(trend[0].hours, 10);
assert.equal(trend[1].hours, 20);
assert.equal(trend[1].spend, 10 * 100 + 10 * 100 + 200);
assert.equal(trend[2].hoursPct, 50);

const withExtra = budgetTimeTrend({
  start: "2026-06-01",
  due: "2026-08-31",
  asOf: "2026-08-15",
  approvedHours: 40,
  approvedBudget: 4000,
  timeEntries: [
    { id: "a", userName: "A", projectId: "p", projectName: "P", date: "2026-06-10", hours: 10, billable: true, note: "", status: "Approved" },
  ],
  expenses: [],
  rateFor: () => 100,
  extraHours: 10,
  extraSpend: 500,
});
assert.equal(withExtra[2].hours, 20);
assert.equal(withExtra[2].spend, 10 * 100 + 500);

const overdue = computeProjectInsights({
  project: {
    id: "p",
    name: "P",
    companyId: "c",
    companyName: "C",
    manager: "M",
    progress: 10,
    status: "Active",
    due: "2026-12-01",
    start: "2026-01-01",
    budgetHours: 40,
    loggedHours: 0,
    marginPct: 0,
    portalShared: false,
    portalContacts: 0,
    projectType: "Client",
    description: "",
    budgetAmount: 4000,
    materials: [],
    files: [],
    notes: [],
    scope: { objectives: "", inScope: [], outOfScope: [], deliverables: [], assumptions: [] },
  },
  tasks: [
    {
      id: "t1",
      name: "Late task",
      projectId: "p",
      projectName: "P",
      assignee: "Ada",
      assigneeInitials: "A",
      status: "In Progress",
      priority: "Med",
      progress: 10,
      due: "2026-08-01",
      start: "2026-07-01",
      clientEditable: false,
      estimateHours: 8,
      links: [],
    },
    {
      id: "t2",
      name: "Done late",
      projectId: "p",
      projectName: "P",
      assignee: "Ada",
      assigneeInitials: "A",
      status: "Done",
      priority: "Med",
      progress: 100,
      due: "2026-08-01",
      start: "2026-07-01",
      clientEditable: false,
      estimateHours: 8,
      links: [],
    },
    {
      id: "t3",
      name: "Open future",
      projectId: "p",
      projectName: "P",
      assignee: "Ada",
      assigneeInitials: "A",
      status: "Not Started",
      priority: "Med",
      progress: 0,
      due: "2026-12-01",
      start: "2026-11-01",
      clientEditable: false,
      estimateHours: 8,
      links: [],
    },
  ],
  milestones: [],
  timeEntries: [],
  expenses: [],
  allocations: [],
  team: [],
  risks: [],
  memberNames: [],
  asOf: "2026-11-17",
});
assert.equal(overdue.overdueTasks.length, 1);
assert.equal(overdue.overdueTasks[0].name, "Late task");
assert.equal(overdue.overdueTasks[0].daysLate, 108);

console.log("project-insights.verify ok");
