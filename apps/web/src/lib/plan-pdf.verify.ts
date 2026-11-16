import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProjectGanttPdf, buildProjectPlanPdf } from "./pdf";
import { ganttConnectorPath, ganttDependencyLinks, type PlanRow } from "./project-plan";

const rows: PlanRow[] = [
  {
    kind: "project",
    id: "p1",
    name: "DMC Internal Project",
    assignee: "",
    status: "Active",
    start: "2025-06-03",
    due: "2025-09-05",
    duration: 95,
    estimateHours: 16,
    actualHours: 0,
    budget: 1000,
    progress: 100,
    depth: 0,
  },
  {
    kind: "task",
    id: "t1",
    name: "Interview - 1",
    assignee: "Akeal Hawkins",
    status: "Done",
    start: "2025-06-03",
    due: "2025-06-03",
    duration: 1,
    estimateHours: 8,
    actualHours: 0,
    budget: 500,
    progress: 100,
    depth: 2,
  },
  {
    kind: "task",
    id: "t2",
    name: "Interview - 2",
    assignee: "Akeal Hawkins",
    status: "Done",
    start: "2025-06-04",
    due: "2025-06-04",
    duration: 1,
    estimateHours: 8,
    actualHours: 0,
    budget: 500,
    dependsOn: "t1",
    progress: 100,
    depth: 2,
  },
];

assert.equal(ganttDependencyLinks(rows).length, 1);
assert.match(ganttConnectorPath(10, 10, 40, 40, 8), /^M 10 10 H /);

const project = {
  name: "DMC Internal Project",
  companyName: "Dillon Morgan Consulting",
  manager: "Akeal Hawkins",
  start: "2025-06-03",
  due: "2025-09-05",
};
const plan = buildProjectPlanPdf(project, rows);
const gantt = buildProjectGanttPdf(project, rows, "Days");
assert.ok(plan.output("arraybuffer").byteLength > 400);
assert.ok(gantt.output("arraybuffer").byteLength > 400);
assert.equal(gantt.getNumberOfPages(), 1);

const root = dirname(fileURLToPath(import.meta.url));
const schedule = readFileSync(join(root, "../components/schedule/ProjectSchedule.tsx"), "utf8");
assert.match(schedule, /exportProjectPlanPdf/);
assert.match(schedule, /exportProjectGanttPdf/);
assert.match(schedule, /plan-gantt-deps/);

console.log("plan-pdf.verify ok");
