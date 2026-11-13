import assert from "node:assert/strict";
import { DMC_CONSULTING_NAME, DMC_INTERNAL_PROJECT_NAME } from "./dmc-internal-project";
import { emptyDemoState, DEMO_WORKSPACE_GENERATION, withDemoWorkspace } from "./demo-workspace";
import { seedCompanies, seedInvoices, seedProjects, seedTickets } from "./seed";
import { seedIdeas, seedObjectives } from "./ppm-seed";

assert.equal(seedCompanies.length, 0);
assert.equal(seedProjects.length, 0);
assert.equal(seedTickets.length, 0);
assert.equal(seedInvoices.length, 0);
assert.equal(seedIdeas.length, 0);
assert.equal(seedObjectives.length, 0);

const empty = withDemoWorkspace(emptyDemoState());
assert.ok(empty);
assert.equal(empty.demoWorkspaceGeneration, DEMO_WORKSPACE_GENERATION);
assert.ok(empty.companies.some((row) => row.name === DMC_CONSULTING_NAME));
assert.ok(empty.companies.some((row) => row.id === "c-cascade"));
assert.ok(empty.companies.some((row) => row.id === "c-rowlett"));
assert.ok(empty.projects.some((row) => row.name === DMC_INTERNAL_PROJECT_NAME));
assert.ok(empty.projects.some((row) => row.id === "p-warehouse"));
assert.ok(empty.projects.some((row) => row.id === "p-dmc-playbook"));
assert.ok(empty.tasks.length > 10);
assert.ok(empty.tickets.length >= 3);
assert.ok(empty.invoices.length >= 4);
assert.ok(empty.invoices.some((row) => row.number === "50526"));
assert.ok(empty.companies.some((row) => row.id === "c-melissa"));
assert.ok(empty.timeEntries.length >= 5);
assert.ok(empty.retainers.length >= 3);
assert.ok(empty.ideas.length >= 3);
assert.ok(empty.objectives.length >= 3);
assert.ok(empty.allocations.length >= 8);
assert.ok(empty.workOrders.some((row) => row.status === "Pending approval"));
assert.ok(empty.workOrders.some((row) => row.status === "Scheduled"));
assert.ok(empty.recurringServices.length >= 2);
assert.ok(empty.serviceDocuments.length >= 2);
assert.ok(empty.fieldClocks.some((row) => !row.stoppedAt));
assert.ok(empty.automations.length >= 3);
assert.ok(empty.expenses.length >= 2);
assert.ok(empty.purchases.length >= 1);
assert.ok(empty.billMaterials.length >= 1);
assert.ok(empty.opportunities.length >= 3);
assert.ok(empty.workspaceInstances.length >= 2);
assert.equal(empty.promotionalTrial.active, true);
assert.equal(withDemoWorkspace(empty), null);

const existing = withDemoWorkspace({
  ...emptyDemoState(),
  companies: [
    {
      id: "c-yoa5boy",
      name: DMC_CONSULTING_NAME,
      initials: "DM",
      status: "Active",
      accountManager: "M. Doyle",
      openProjects: 0,
      openTickets: 0,
      lastActivity: "Nov 13, 2026",
      industry: "Professional Services",
      billingTerms: "Net 30",
      portalContacts: 0,
    },
  ],
});
assert.ok(existing);
assert.equal(existing.companies.filter((row) => row.name === DMC_CONSULTING_NAME).length, 1);
assert.equal(existing.projects.find((row) => row.name === DMC_INTERNAL_PROJECT_NAME)?.companyId, "c-yoa5boy");
assert.ok(existing.tickets.some((row) => row.companyId === "c-yoa5boy"));
assert.ok(existing.retainers.some((row) => row.companyId === "c-yoa5boy"));
assert.ok(existing.workOrders.some((row) => row.companyId === "c-yoa5boy"));

console.log("demo-workspace.verify ok");
