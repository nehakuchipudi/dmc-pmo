import assert from "node:assert/strict";
import { parseHoursInput } from "./timesheet";
import { searchTimesheetWork, timerClock, workFromEntry, workKey, workToLogDefaults } from "./timesheet-work";
import type { Milestone, Task, TimeEntry } from "./types";

const projects = [{ id: "p-warehouse", name: "Q3 Warehouse Rollout" }];

const milestones: Milestone[] = [
  { id: "m2", projectId: "p-warehouse", name: "Phase 2 Execution", due: "2026-08-08", start: "2026-07-20", status: "In Progress", kind: "phase" },
];

const tasks: Task[] = [
  {
    id: "tk4",
    name: "Install racking Zone B",
    projectId: "p-warehouse",
    projectName: "Q3 Warehouse Rollout",
    milestoneId: "m2",
    assignee: "M. Doyle",
    assigneeInitials: "MD",
    status: "In Progress",
    priority: "High",
    progress: 40,
    due: "2026-08-08",
    start: "2026-08-01",
    clientEditable: false,
    estimateHours: 8,
    sortOrder: 0,
    links: [],
  },
  {
    id: "tk4a",
    name: "Level racking bays",
    projectId: "p-warehouse",
    projectName: "Q3 Warehouse Rollout",
    milestoneId: "m2",
    parentTaskId: "tk4",
    assignee: "S. Ahmed",
    assigneeInitials: "SA",
    status: "In Progress",
    priority: "High",
    progress: 40,
    due: "2026-08-06",
    start: "2026-08-01",
    clientEditable: false,
    estimateHours: 6,
    sortOrder: 0,
    links: [],
  },
];

const projectHits = searchTimesheetWork({ query: "warehouse", objectType: "project", projects, tasks, milestones });
assert.equal(projectHits.length, 1);
assert.equal(projectHits[0].kind, "project");
assert.equal(projectHits[0].key, "project:p-warehouse");

const phaseHits = searchTimesheetWork({ query: "execution", objectType: "phase", projects, tasks, milestones });
assert.equal(phaseHits[0]?.kind, "phase");
assert.equal(phaseHits[0]?.milestoneId, "m2");

const taskHits = searchTimesheetWork({ query: "racking", objectType: "task", projects, tasks, milestones });
assert.ok(taskHits.some((hit) => hit.kind === "task" && hit.taskId === "tk4"));
assert.equal(taskHits.some((hit) => hit.kind === "subtask"), false);

const subHits = searchTimesheetWork({ query: "level", objectType: "subtask", projects, tasks, milestones });
assert.equal(subHits[0]?.kind, "subtask");
assert.equal(subHits[0]?.parentTaskName, "Install racking Zone B");

const allHits = searchTimesheetWork({ query: "warehouse", objectType: "All", projects, tasks, milestones });
assert.ok(allHits.some((hit) => hit.kind === "project"));
assert.ok(allHits.some((hit) => hit.kind === "phase"));
assert.ok(allHits.some((hit) => hit.kind === "task"));
assert.ok(allHits.some((hit) => hit.kind === "subtask"));

const milestoneHits = searchTimesheetWork({ query: "milestone", objectType: "All", projects, tasks, milestones });
assert.ok(milestoneHits.some((hit) => hit.kind === "phase"));

const entry: TimeEntry = {
  id: "te1",
  userName: "A. Chen",
  projectId: "p-warehouse",
  projectName: "Q3 Warehouse Rollout",
  milestoneId: "m2",
  milestoneName: "Phase 2 Execution",
  taskId: "tk4a",
  taskName: "Level racking bays",
  workKind: "subtask",
  date: "2026-11-03",
  hours: 1,
  billable: true,
  note: "",
  status: "Draft",
};
const fromEntry = workFromEntry(entry, projects, tasks, milestones);
assert.equal(fromEntry.kind, "subtask");
assert.equal(fromEntry.key, workKey({ kind: "subtask", projectId: "p-warehouse", taskId: "tk4a" }));
assert.equal(workToLogDefaults(fromEntry, { date: "2026-11-04", hours: 2 }).milestoneId, "m2");
assert.equal(timerClock(Date.now() - 90 * 60 * 1000).hours, 1.5);
assert.equal(parseHoursInput("3:00"), 3);
assert.equal(parseHoursInput("1:30"), 1.5);
assert.equal(parseHoursInput("2"), 2);
assert.doesNotMatch(`${fromEntry.label} ${fromEntry.detail}`, /[\u2013\u2014]/);

console.log("timesheet-work.verify ok");
