import assert from "node:assert/strict";
import { applyTeamRole, bindRoleGrants, bindUserGrants, can, canAccessHref, canCreateKind, canSeeFinancials, defaultRoleGrants, permissionCatalogCaps, roleCapabilities } from "./rbac";

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
assert.equal(canAccessHref("staff", "/app/settings"), true);
assert.equal(canAccessHref("admin", "/app/settings"), true);
assert.equal(canAccessHref("finance", "/app/billing"), true);
assert.equal(canAccessHref("finance", "/app/strategy"), false);
assert.equal(canAccessHref("admin", "/app/automations"), true);
assert.equal(can("admin", "view_service_ops"), true);
assert.equal(can("admin", "manage_service_ops"), true);
assert.equal(can("staff", "view_service_ops"), true);
assert.equal(can("staff", "manage_service_ops"), false);
assert.equal(can("finance", "view_service_ops"), true);
assert.equal(canAccessHref("staff", "/app/work-orders"), true);
assert.equal(canAccessHref("staff", "/app/promotional-trial"), true);
assert.equal(canAccessHref("admin", "/app/quotes"), true);
assert.equal(canAccessHref("admin", "/app/analytics"), true);
assert.equal(canAccessHref("admin", "/app/audit"), true);
assert.equal(canAccessHref("staff", "/app/quotes"), false);
assert.equal(canAccessHref("finance", "/app/work-journey"), true);
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

const catalog = permissionCatalogCaps();
assert.equal(new Set(catalog).size, catalog.length);
assert.deepEqual([...catalog].sort(), [...roleCapabilities("admin")].sort());
const grants = defaultRoleGrants();
grants.staff = [...grants.staff, "view_billing"];
bindRoleGrants(() => grants);
assert.equal(can("staff", "view_billing"), true);
assert.equal(canAccessHref("staff", "/app/billing"), true);
assert.equal(can("admin", "manage_users"), true);
bindRoleGrants(() => null);
assert.equal(can("staff", "view_billing"), false);
assert.equal(canAccessHref("staff", "/app/billing"), false);

const staffCaps = [...defaultRoleGrants().staff, "view_billing" as const];
bindUserGrants(() => ({ "u-staff": staffCaps }));
assert.equal(can("staff", "view_billing", "u-staff"), true);
assert.equal(can("staff", "view_billing"), false);
assert.equal(canAccessHref("staff", "/app/billing", "u-staff"), true);
assert.equal(canAccessHref("staff", "/app/billing", "u-other"), false);
assert.equal(can("admin", "manage_users", "u-admin"), true);
bindUserGrants(() => ({ "u-admin": [] }));
assert.equal(can("admin", "pay_invoice", "u-admin"), true);
const pmWithoutMoney = defaultRoleGrants().pm.filter((cap) => cap !== "see_financials");
bindUserGrants(() => ({ "u-pm": pmWithoutMoney }));
assert.equal(
  canSeeFinancials({ id: "u-pm", name: "A. Patel", initials: "AP", role: "pm", email: "patel@dillonmorgan.com" }, []),
  false,
);
bindUserGrants(() => null);
assert.equal(
  canSeeFinancials({ id: "u-pm", name: "A. Patel", initials: "AP", role: "pm", email: "patel@dillonmorgan.com" }, []),
  true,
);

console.log("rbac matrix ok");
