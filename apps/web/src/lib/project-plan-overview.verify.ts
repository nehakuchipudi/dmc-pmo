import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PROJECT_WORKSPACE_TABS, resolveProjectTab } from "./project-tabs";
import { moveIdInList, scheduleWindow, sortPlanItems } from "./project-plan";

const root = dirname(fileURLToPath(import.meta.url));

assert.deepEqual([...PROJECT_WORKSPACE_TABS], [
  "Overview",
  "Team",
  "Schedule",
  "Insights",
  "Activity",
  "Attachments",
  "Expenses",
  "Billing",
]);
assert.equal(resolveProjectTab("Tasks"), "Schedule");
assert.equal(resolveProjectTab("plan"), "Schedule");
assert.equal(resolveProjectTab("Rates"), "Team");
assert.equal(resolveProjectTab("Assets"), "Attachments");
assert.equal(resolveProjectTab("Details"), "Overview");
const droppedTabs = ["Tasks", "Rates", "Assets", "Details"];
for (const tab of droppedTabs) {
  assert.equal((PROJECT_WORKSPACE_TABS as readonly string[]).includes(tab), false);
}

assert.deepEqual(scheduleWindow("2026-06-03", "2026-11-10", "2026-08-10"), {
  elapsed: 68,
  remaining: 92,
  over: 0,
});
assert.equal(scheduleWindow("2026-06-03", "2026-11-09", "2026-11-10").over, 1);
assert.deepEqual(
  sortPlanItems([
    { name: "New milestone", sortOrder: 2 },
    { name: "Milestone 1", sortOrder: 0 },
    { name: "Milestone 2", sortOrder: 1 },
  ]).map((row) => row.name),
  ["Milestone 1", "Milestone 2", "New milestone"],
);
assert.deepEqual(moveIdInList(["a", "b", "c"], "b", -1), ["b", "a", "c"]);
assert.deepEqual(moveIdInList(["a", "b", "c"], "b", 1), ["a", "c", "b"]);
assert.equal(moveIdInList(["a", "b"], "a", -1), null);
assert.equal(moveIdInList(["a", "b"], "b", 1), null);
assert.equal(moveIdInList(["a"], "a", 1), null);

const detail = readFileSync(join(root, "../app/app/projects/[id]/project-detail.tsx"), "utf8");
assert.match(detail, /ProjectOverviewBoard/);
assert.match(detail, /onEditPlan/);
assert.match(detail, /createMilestone/);
assert.doesNotMatch(detail, /project-health-strip/);
assert.doesNotMatch(detail, /tab === "Tasks"/);
assert.doesNotMatch(detail, /tab === "Rates"/);
assert.doesNotMatch(detail, /tab === "Assets"/);
assert.doesNotMatch(detail, /tab === "Details"/);
assert.match(detail, /className="record-tabs"/);

const schedule = readFileSync(join(root, "../components/schedule/ProjectSchedule.tsx"), "utf8");
assert.match(schedule, /Add milestone/);
assert.match(schedule, /Add task/);
assert.match(schedule, /Move up/);
assert.match(schedule, /Move down/);
assert.match(schedule, /onReorderMilestones/);
assert.match(schedule, /onReorderTasks\(ordered\)/);
assert.match(schedule, /selected\.kind === "milestone"/);
assert.match(schedule, /plan-gantt-caption/);
assert.match(schedule, /plan-board is-split/);
assert.doesNotMatch(schedule, /GanttBoard/);
assert.doesNotMatch(schedule, /setView/);

const overview = readFileSync(join(root, "../components/projects/ProjectOverviewBoard.tsx"), "utf8");
assert.match(overview, /overview-plan-toolbar/);
assert.match(overview, /Edit plan/);
assert.match(overview, /Add task/);

const css = readFileSync(join(root, "../app/globals.css"), "utf8");
assert.match(css, /\.overview-plan \{[^}]*gap:\s*14px/);
assert.match(css, /\.plan-toolbar/);
assert.match(css, /\.plan-toolbar \.btn/);
assert.match(css, /\.plan-gantt-caption/);
assert.match(css, /\.record-tabs/);
assert.match(css, /\.crumb-link \{[^}]*white-space: nowrap/);
assert.doesNotMatch(css, /\.crumb-link \{[^}]*max-width/);
assert.doesNotMatch(css, /\.crumb-current \{[^}]*max-width/);

console.log("project-plan-overview.verify ok");
