import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DATE_OUTSIDE_TITLE,
  childTasksOutsideMilestone,
  defaultDatesInWindow,
  pickerBounds,
  projectDateConflict,
  projectWindow,
  validateMilestoneDates,
  validateRange,
  validateTaskDates,
  windowForTask,
} from "./plan-timeline";
import type { Milestone, Task } from "./types";

const project = { start: "2025-06-03", due: "2025-09-05" };
const window = projectWindow(project);
const milestone: Milestone = {
  id: "m1",
  projectId: "p1",
  name: "Hire Full Stack Developer",
  start: "2025-06-03",
  due: "2025-06-04",
  status: "In Progress",
  kind: "phase",
};
const task: Task = {
  id: "t1",
  name: "Interview - 1",
  projectId: "p1",
  projectName: "DMC Internal Project",
  milestoneId: "m1",
  assignee: "Akeal Hawkins",
  assigneeInitials: "AH",
  status: "Done",
  priority: "Med",
  progress: 100,
  start: "2025-06-03",
  due: "2025-06-03",
  clientEditable: false,
  estimateHours: 8,
  links: [],
};

assert.equal(validateRange("2025-06-03", "2025-06-04", window, window), null);
assert.equal(validateRange("2025-06-02", "2025-06-04", window, window)?.title, DATE_OUTSIDE_TITLE);
assert.match(
  validateRange("2025-06-03", "2025-09-06", window, window)?.body ?? "",
  /Please select a date between 06\/03\/2025 and 09\/05\/2025/,
);
assert.match(validateRange("2025-06-10", "2025-06-09", window, window)?.body ?? "", /cannot be after the due date/);

assert.equal(validateTaskDates(task, project, [milestone], [task]), null);
assert.equal(
  validateTaskDates({ ...task, start: "2025-06-05", due: "2025-06-05" }, project, [milestone], [task])?.body.includes(
    "Hire Full Stack Developer",
  ),
  true,
);
assert.equal(validateMilestoneDates(milestone, project, [milestone]), null);
assert.equal(validateMilestoneDates({ ...milestone, start: "2025-05-01" }, project, [milestone])?.title, DATE_OUTSIDE_TITLE);

const children = childTasksOutsideMilestone({ ...milestone, due: "2025-06-03" }, [milestone], [
  { ...task, due: "2025-06-04" },
]);
assert.equal(children.length, 1);

const conflict = projectDateConflict("2025-06-10", "2025-09-05", [milestone], [task]);
assert.equal(conflict?.title, DATE_OUTSIDE_TITLE);
assert.match(conflict?.body ?? "", /Hire Full Stack Developer/);
assert.equal(projectDateConflict("2025-06-01", "2025-09-10", [milestone], [task]), null);

const ctx = windowForTask(task, project, [milestone], [task]);
assert.deepEqual(ctx.window, { start: "2025-06-03", end: "2025-06-04" });
assert.deepEqual(defaultDatesInWindow(ctx.window, window), { start: "2025-06-03", due: "2025-06-04" });
assert.deepEqual(pickerBounds(ctx.window, window, "2025-06-03", "2025-06-04"), {
  startMin: "2025-06-03",
  startMax: "2025-06-04",
  dueMin: "2025-06-03",
  dueMax: "2025-06-04",
});

const root = dirname(fileURLToPath(import.meta.url));
const schedule = readFileSync(join(root, "../components/schedule/ProjectSchedule.tsx"), "utf8");
assert.match(schedule, /pickerBounds/);
assert.match(schedule, /min=\{bounds\.startMin\}/);
const store = readFileSync(join(root, "./store.ts"), "utf8");
assert.match(store, /validateTaskDates/);
assert.match(store, /projectDateConflict/);
assert.match(store, /planError/);
const primitives = readFileSync(join(root, "../components/primitives.tsx"), "utf8");
assert.match(primitives, /function AlertModal/);
assert.match(primitives, />\s*OK\s*</);

console.log("plan-timeline.verify ok");
