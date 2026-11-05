import assert from "node:assert/strict";
import { addDaysIso, clockHours, nextFromFrequency, workOrderActions } from "./service-ops";

assert.equal(addDaysIso("2026-11-05", 7), "2026-11-12");
assert.equal(nextFromFrequency("2026-11-05", "Weekly"), "2026-11-12");
assert.equal(nextFromFrequency("2026-11-05", "Monthly"), "2026-12-05");
assert.ok(clockHours(new Date(Date.now() - 36e5).toISOString()) >= 1);
assert.deepEqual(
  workOrderActions("Scheduled").map((item) => item.next),
  ["In progress"],
);
assert.ok(workOrderActions("Pending approval").some((item) => item.label === "Approve" && item.manage));
assert.deepEqual(workOrderActions("Completed"), []);

console.log("service-ops.verify ok");
