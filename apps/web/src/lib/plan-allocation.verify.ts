import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUDGET_EXCEEDS_TITLE,
  TIME_EXCEEDS_TITLE,
  allocatedBudget,
  allocatedHours,
  allocationSummary,
  leafTasks,
  validateProjectCaps,
  validateTaskAllocation,
} from "./plan-allocation";
import type { Task } from "./types";

const rate = () => 100;
const project = { budgetAmount: 10000, budgetHours: 40 };
const parent: Task = {
  id: "t1",
  name: "Parent",
  projectId: "p1",
  projectName: "Demo",
  assignee: "A",
  assigneeInitials: "A",
  status: "Not Started",
  priority: "Med",
  progress: 0,
  start: "2025-06-03",
  due: "2025-06-10",
  clientEditable: false,
  estimateHours: 8,
  budgetAmount: 800,
  links: [],
};
const child: Task = {
  ...parent,
  id: "t2",
  name: "Child",
  parentTaskId: "t1",
  estimateHours: 5,
  budgetAmount: 500,
};
const other: Task = { ...parent, id: "t3", name: "Other", estimateHours: 10, budgetAmount: 1000 };

assert.deepEqual(leafTasks([parent, child, other]).map((row) => row.id).sort(), ["t2", "t3"]);
assert.equal(allocatedHours([parent, child, other]), 15);
assert.equal(allocatedBudget([parent, child, other], rate), 1500);

const summary = allocationSummary(project, [parent, child, other], rate);
assert.equal(summary.usedBudget, 1500);
assert.equal(summary.remainingBudget, 8500);
assert.equal(summary.usedHours, 15);
assert.equal(summary.remainingHours, 25);

assert.equal(validateTaskAllocation({ ...child, budgetAmount: 20000 }, project, [parent, child, other], rate)?.title, BUDGET_EXCEEDS_TITLE);
assert.equal(validateTaskAllocation({ ...child, estimateHours: 80 }, project, [parent, child, other], rate)?.title, TIME_EXCEEDS_TITLE);
assert.equal(validateTaskAllocation(child, project, [parent, child, other], rate), null);
assert.equal(validateProjectCaps(1000, 40, [parent, child, other], rate)?.title, BUDGET_EXCEEDS_TITLE);
assert.equal(validateProjectCaps(10000, 10, [parent, child, other], rate)?.title, TIME_EXCEEDS_TITLE);
assert.equal(validateProjectCaps(10000, 40, [parent, child, other], rate), null);

const root = dirname(fileURLToPath(import.meta.url));
const schedule = readFileSync(join(root, "../components/schedule/ProjectSchedule.tsx"), "utf8");
assert.match(schedule, /plan-alloc-summary/);
assert.match(schedule, /Total project budget/);
assert.match(schedule, /ScheduleAllocationModal/);
assert.match(schedule, />Budget</);
assert.match(schedule, />Time</);
assert.match(schedule, /PDF/);
assert.match(schedule, /Project plan/);
assert.match(schedule, /Gantt chart/);
const store = readFileSync(join(root, "./store.ts"), "utf8");
assert.match(store, /validateTaskAllocation/);
assert.match(store, /validateProjectCaps/);

console.log("plan-allocation.verify ok");
