import assert from "node:assert/strict";
import {
  firmAnnouncements,
  isPortalTab,
  loggedWeekHours,
  portalAssignments,
  portalRequests,
  postedAgo,
  weekHoursTotal,
} from "./employee-portal";
import type { Expense, Project, Task, Ticket, TimeEntry, User } from "./types";
import type { WorkOrder } from "./service-ops";

assert.equal(isPortalTab("My Overview"), true);
assert.equal(isPortalTab("Billing"), false);
assert.ok(firmAnnouncements().length >= 3);
assert.equal(weekHoursTotal([8, 8, 6, 8, 8]), 38);

const user: User = { id: "u-admin", name: "Dillon Morgan", initials: "DM", role: "admin", email: "dillon@dillonmorgan.com" };
const empty = portalAssignments({
  user,
  projects: [] as Project[],
  allocations: [],
  workOrders: [] as WorkOrder[],
  tasks: [] as Task[],
  tickets: [] as Ticket[],
});
assert.ok(empty.some((row) => row.title === "HVAC Maintenance"));
assert.ok(empty.some((row) => row.kind === "Project"));

const live = portalAssignments({
  user,
  projects: [{ id: "p1", name: "Warehouse", companyName: "Acme", manager: "Dillon Morgan", status: "Active", projectType: "CM" } as Project],
  allocations: [],
  workOrders: [{ id: "wo1", title: "Pump check", companyName: "Acme", assignee: "Dillon Morgan", status: "Scheduled", scheduled: "2026-11-06" } as WorkOrder],
  tasks: [],
  tickets: [{ id: "t1", subject: "Badge access", companyName: "Acme", assignee: "Dillon Morgan", status: "Open" } as Ticket],
});
assert.equal(live.some((row) => row.title === "HVAC Maintenance"), false);
assert.ok(live.some((row) => row.title === "Warehouse"));
assert.ok(live.some((row) => row.title === "Pump check"));

assert.equal(loggedWeekHours([{ userName: "Dillon Morgan", date: "2099-01-01", hours: 2 } as TimeEntry], "Dillon Morgan", "2099-01-01"), 2);
assert.equal(
  portalRequests({
    name: "Dillon Morgan",
    expenses: [{ id: "ex1", vendor: "Fuel", date: "2026-11-04", status: "Pending", userName: "Dillon Morgan" } as Expense],
  }).some((row) => row.title === "Fuel"),
  true,
);
assert.equal(postedAgo(new Date().toISOString().slice(0, 10)), "Today");

console.log("employee-portal.verify ok");
