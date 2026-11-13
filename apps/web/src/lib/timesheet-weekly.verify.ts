import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { clockOrZero, formatHms, parseDurationInput } from "./timesheet";
import { searchTimesheetWork } from "./timesheet-work";

const root = dirname(fileURLToPath(import.meta.url));

assert.equal(clockOrZero(0), "0:00");
assert.equal(clockOrZero(1.5), "1:30");
assert.equal(formatHms(0.05), "00:03:00");
assert.equal(parseDurationInput("00:03:00"), 0.05);
assert.equal(parseDurationInput("1:30"), 1.5);
assert.equal(parseDurationInput("8"), 8);
assert.equal(parseDurationInput("2.5"), 2.5);
assert.equal(parseDurationInput("2h"), 2);
assert.equal(parseDurationInput("90m"), 1.5);
assert.equal(parseDurationInput("2h 30m"), 2.5);
assert.equal(parseDurationInput("8 hours"), 8);

const hits = searchTimesheetWork({
  query: "internal",
  objectType: "All",
  projects: [{ id: "p1", name: "DMC Internal Project", companyName: "Dillon Morgan Consulting" }],
  tasks: [],
  milestones: [{ id: "m1", projectId: "p1", name: "Hire Full Stack Developer", kind: "phase" }],
});
assert.ok(hits.some((hit) => hit.kind === "project"));
assert.ok(hits.some((hit) => hit.kind === "phase"));

const page = readFileSync(join(root, "../components/timesheets/TimesheetWorkspace.tsx"), "utf8");
assert.match(page, /Find work to add to your timesheet/);
assert.match(page, /ts-week-add/);
assert.match(page, /openActivity\(work, date, true\)/);

const modal = readFileSync(join(root, "../components/timesheets/TimesheetActivityModal.tsx"), "utf8");
assert.match(modal, /Add new activity/);
assert.match(modal, /Save Log/);
assert.match(modal, /More worklog details/);
assert.match(modal, /Rounded time/);
assert.match(modal, /Hours worked/);
assert.match(modal, /ts-hours-input/);
assert.match(modal, /Choose hours/);
assert.match(modal, /updateTimeEntry/);

const css = readFileSync(join(root, "../app/globals.css"), "utf8");
assert.match(css, /\.ts-week-cell:hover \.ts-week-add/);
assert.match(css, /#2563eb/);
assert.match(css, /\.ts-hours-input/);

console.log("timesheet-weekly.verify ok");
