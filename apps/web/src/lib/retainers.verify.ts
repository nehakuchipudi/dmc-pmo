import assert from "node:assert/strict";
import { todayIso } from "./timesheet";
import {
  companyProjectId,
  daysUntil,
  earnedValue,
  nextPeriodRange,
  pickCurrentPeriod,
  retainerRate,
} from "./retainers";

assert.equal(retainerRate(), 175);
assert.equal(retainerRate(250), 250);
assert.equal(earnedValue(10), 1750);
assert.equal(earnedValue(2, 200), 400);
assert.equal(companyProjectId([{ id: "p1", companyId: "c1" }], "c1"), "p1");
assert.equal(companyProjectId([{ id: "p1", companyId: "c1" }], "c2"), undefined);

const future = nextPeriodRange([{ end: "2027-01-31" }]);
assert.equal(future.start, "2027-02-01");
assert.equal(future.end, "2027-03-02");

const fromToday = nextPeriodRange([{ end: "2026-08-31" }]);
assert.equal(fromToday.start, todayIso());

const current = pickCurrentPeriod(
  [
    { start: "2026-09-01", end: "2026-09-30", status: "Opened" },
    { start: "2026-08-01", end: "2026-08-31", status: "Opened" },
    { start: "2026-07-01", end: "2026-07-31", status: "Closed" },
  ],
  "2026-11-04",
);
assert.equal(current.start, "2026-09-01");

const covering = pickCurrentPeriod(
  [
    { start: "2026-11-01", end: "2026-11-30", status: "Opened" },
    { start: "2026-10-01", end: "2026-10-31", status: "Opened" },
  ],
  "2026-11-04",
);
assert.equal(covering.start, "2026-11-01");

const past = daysUntil("2020-01-01");
assert.ok(past !== null && past < 0);

console.log("retainers.verify ok");
