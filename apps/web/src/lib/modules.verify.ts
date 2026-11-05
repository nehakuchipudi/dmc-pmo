import assert from "node:assert/strict";
import { DEFAULT_PACKS, NAV_MODULES, PACKS, hasPack, packForHref, packsOf } from "./modules";
import { canUsePack, DEFAULT_ROLE_PACKS, packsForRole } from "./service-ops";

assert.equal(PACKS.length, 3);
assert.ok(NAV_MODULES.every((item) => PACKS.some((pack) => pack.id === item.pack)));
assert.equal(packForHref("/app/work-orders"), "service_operations");
assert.equal(packForHref("/app/work-orders/view/?id=1"), "service_operations");
assert.equal(packForHref("/app/projects"), "project_delivery");
assert.equal(packForHref("/app/home"), "project_management");
assert.equal(packForHref("/app/settings"), null);
assert.deepEqual(packsOf(undefined), DEFAULT_PACKS);
assert.deepEqual(packsOf([]), []);
assert.equal(hasPack(["service_operations"], "service_operations"), true);
assert.equal(hasPack(["project_management"], "service_operations"), false);
assert.equal(canUsePack("service_operations", DEFAULT_PACKS, "admin", DEFAULT_ROLE_PACKS), true);
assert.equal(canUsePack("service_operations", DEFAULT_PACKS, "finance", DEFAULT_ROLE_PACKS), false);
assert.equal(canUsePack("service_operations", ["project_management"], "admin", DEFAULT_ROLE_PACKS), false);
assert.deepEqual(packsForRole("staff", DEFAULT_ROLE_PACKS), ["project_delivery", "service_operations"]);
assert.deepEqual(packsForRole("client", DEFAULT_ROLE_PACKS), []);
assert.ok(NAV_MODULES.filter((item) => item.pack === "service_operations").length === 12);

console.log("modules.verify ok");
