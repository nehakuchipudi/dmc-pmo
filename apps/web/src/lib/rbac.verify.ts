import assert from "node:assert/strict";
import { applyTeamRole, can, canAccessHref, canCreateKind, canSeeFinancials } from "./rbac";

assert.equal(can("admin", "manage_users"), true);
assert.equal(can("admin", "pay_invoice"), true);
assert.equal(can("admin", "configure_lifecycle"), true);
assert.equal(can("staff", "manage_users"), false);
assert.equal(can("staff", "create_invoice"), false);
assert.equal(can("staff", "log_time"), true);
assert.equal(can("staff", "create_project"), false);
assert.equal(can("finance", "create_invoice"), true);
assert.equal(can("finance", "manage_plan"), false);
assert.equal(can("finance", "pay_invoice"), true);
assert.equal(can("pm", "create_project"), true);
assert.equal(can("pm", "manage_users"), false);
assert.equal(can("pm", "create_invoice"), true);
assert.equal(can("leadership", "create_objective"), true);
assert.equal(can("leadership", "manage_users"), false);
assert.equal(can("client", "view_home"), false);
assert.equal(canAccessHref("staff", "/app/billing"), false);
assert.equal(canAccessHref("staff", "/app/timesheets"), true);
assert.equal(canAccessHref("finance", "/app/billing"), true);
assert.equal(canAccessHref("finance", "/app/strategy"), false);
assert.equal(canAccessHref("admin", "/app/automations"), true);
assert.equal(canCreateKind("staff", "company"), false);
assert.equal(canCreateKind("staff", "time"), true);
assert.equal(canCreateKind("pm", "project"), true);
assert.equal(
  canSeeFinancials({ id: "1", name: "J. Kim", initials: "JK", role: "staff", email: "jkim@dillonmorgan.com" }, [
    {
      id: "tm-jk",
      name: "J. Kim",
      email: "jkim@dillonmorgan.com",
      initials: "JK",
      role: "staff",
      active: true,
      financialVisibility: "hours",
    },
  ]),
  false,
);
assert.equal(
  applyTeamRole(
    { id: "u-staff", name: "J. Kim", initials: "JK", role: "staff", email: "jkim@dillonmorgan.com" },
    [{ id: "tm-jk", name: "J. Kim", email: "jkim@dillonmorgan.com", initials: "JK", role: "pm", active: true }],
  )?.role,
  "pm",
);

console.log("rbac matrix ok");
