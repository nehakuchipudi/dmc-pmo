import assert from "node:assert/strict";
import { DEFAULT_PACKS, NAV_GROUPS, NAV_MODULES, PACKS, hasPack, packForHref, packsOf } from "./modules";
import { canUsePack, DEFAULT_ROLE_PACKS, packsForRole } from "./service-ops";

assert.equal(PACKS.length, 3);
assert.equal(NAV_GROUPS.length, 7);
assert.ok(NAV_MODULES.every((item) => !item.pack || PACKS.some((pack) => pack.id === item.pack)));
assert.ok(NAV_MODULES.every((item) => NAV_GROUPS.some((group) => group.id === item.group)));
assert.equal(packForHref("/app/work-orders"), "service_operations");
assert.equal(packForHref("/app/projects"), "project_delivery");
assert.equal(packForHref("/app/companies"), "project_management");
assert.equal(packForHref("/app/quotes"), "project_delivery");
assert.equal(packForHref("/app/automations"), "project_management");
assert.equal(packForHref("/app/home"), null);
assert.equal(packForHref("/app/settings"), null);
assert.deepEqual(packsOf(undefined), DEFAULT_PACKS);
assert.deepEqual(packsOf([]), []);
assert.equal(hasPack(["service_operations"], "service_operations"), true);
assert.equal(canUsePack("service_operations", DEFAULT_PACKS, "admin", DEFAULT_ROLE_PACKS), true);
assert.equal(canUsePack("service_operations", DEFAULT_PACKS, "finance", DEFAULT_ROLE_PACKS), false);
assert.deepEqual(packsForRole("staff", DEFAULT_ROLE_PACKS), ["project_delivery", "service_operations"]);
assert.equal(NAV_MODULES.filter((item) => item.group === "service_operations").length, 7);
assert.equal(NAV_MODULES.filter((item) => item.group === "business_management").length, 5);
assert.ok(NAV_MODULES.some((item) => item.href === "/app/contacts"));
assert.ok(NAV_MODULES.some((item) => item.href === "/app/quotes"));
assert.ok(NAV_MODULES.some((item) => item.href === "/app/analytics"));
assert.ok(NAV_MODULES.some((item) => item.href === "/app/audit"));
assert.equal(NAV_MODULES.find((item) => item.group === "project_management")?.href, "/app/ideas");
assert.ok(NAV_MODULES.some((item) => item.href === "/app/automations" && item.group === "settings"));
assert.deepEqual(
  NAV_GROUPS.map((group) => group.id),
  [
    "project_management",
    "resource_management",
    "service_operations",
    "business_management",
    "intelligence",
    "administration",
    "settings",
  ],
);

console.log("modules.verify ok");
