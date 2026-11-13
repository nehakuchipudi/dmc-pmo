import assert from "node:assert/strict";
import {
  seedActivities,
  seedCompanies,
  seedContacts,
  seedInvoices,
  seedProjects,
  seedRetainers,
  seedTasks,
  seedTickets,
  seedTimeEntries,
  staticRecordIds,
} from "./seed";
import { seedAllocations, seedObjectives, seedPortfolios } from "./ppm-seed";
import { EMPTY_WORKSPACE_GENERATION, emptyWorkspaceData, workspacePatch } from "./workspace-snapshot";

assert.equal(seedCompanies.length, 0);
assert.equal(seedContacts.length, 0);
assert.equal(seedProjects.length, 0);
assert.equal(seedTickets.length, 0);
assert.equal(seedTasks.length, 0);
assert.equal(seedInvoices.length, 0);
assert.equal(seedTimeEntries.length, 0);
assert.equal(seedActivities.length, 0);
assert.equal(seedRetainers.length, 0);
assert.equal(seedObjectives.length, 0);
assert.equal(seedPortfolios.length, 0);
assert.equal(seedAllocations.length, 0);
assert.deepEqual(staticRecordIds([]), [{ id: "_" }]);

const stale = workspacePatch({
  version: 1,
  data: {
    companies: [{ id: "c-new", name: "Acme" }],
    team: [{ id: "tm-dm" }],
    enabledPacks: ["service_operations"],
    workOrders: [{ id: "wo-keep" }],
  },
});
assert.equal(stale.seedGeneration, EMPTY_WORKSPACE_GENERATION);
assert.deepEqual(stale.companies, [{ id: "c-new", name: "Acme" }]);
assert.deepEqual(stale.team, [{ id: "tm-dm" }]);
assert.deepEqual(stale.enabledPacks, ["service_operations"]);
assert.deepEqual(stale.workOrders, [{ id: "wo-keep" }]);

const fresh = workspacePatch({
  version: 1,
  data: { seedGeneration: EMPTY_WORKSPACE_GENERATION, companies: [{ id: "c-new", name: "Acme" }] },
});
assert.deepEqual(fresh.companies, [{ id: "c-new", name: "Acme" }]);
assert.equal(emptyWorkspaceData().seedGeneration, EMPTY_WORKSPACE_GENERATION);

console.log("empty-workspace.verify ok");
