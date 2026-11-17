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
assert.equal(empty.companies.length, 1);
assert.equal(empty.companies[0].name, DMC_CONSULTING_NAME);
assert.equal(empty.projects.length, 1);
assert.equal(empty.projects[0].name, DMC_INTERNAL_PROJECT_NAME);
assert.ok(!empty.companies.some((row) => row.id === "c-cascade"));
assert.ok(!empty.companies.some((row) => row.id === "c-rowlett"));
assert.ok(!empty.companies.some((row) => row.id === "c-melissa"));
assert.ok(!empty.projects.some((row) => row.id === "p-warehouse"));
assert.ok(!empty.projects.some((row) => row.id === "p-dmc-playbook"));
assert.ok(empty.tasks.length > 10);
assert.ok(empty.tickets.every((row) => row.companyId === empty.companies[0].id));
assert.ok(empty.invoices.every((row) => row.companyId === empty.companies[0].id));
assert.ok(empty.timeEntries.every((row) => row.projectId === empty.projects[0].id));
assert.ok(empty.retainers.every((row) => row.companyId === empty.companies[0].id));
assert.ok(empty.workOrders.every((row) => row.companyId === empty.companies[0].id));
assert.ok(empty.workOrders.some((row) => row.status === "Pending approval"));
assert.ok(empty.workOrders.some((row) => row.status === "Scheduled"));
assert.equal(empty.workspaceInstances.length, 1);
assert.equal(empty.workspaceInstances[0].id, "inst-dmc");
assert.equal(withDemoWorkspace(empty), null);

const revived = withDemoWorkspace({
  ...empty,
  companies: [
    ...empty.companies,
    {
      id: "c-cascade",
      name: "Cascade Ventures",
      initials: "CV",
      status: "Active",
      accountManager: "J. Alvarez",
      openProjects: 1,
      openTickets: 0,
      lastActivity: "Sep 12, 2026",
      industry: "Logistics",
      billingTerms: "Net 30",
      portalContacts: 1,
    },
  ],
  projects: [
    ...empty.projects,
    {
      id: "p-warehouse",
      number: "P-900",
      name: "Q3 Warehouse Rollout",
      companyId: "c-cascade",
      companyName: "Cascade Ventures",
      manager: "J. Kim",
      progress: 40,
      status: "Active",
      start: "2026-07-01",
      due: "2026-09-30",
      budgetHours: 400,
      loggedHours: 120,
      marginPct: 28,
      portalShared: true,
      portalContacts: 1,
      projectType: "Client Work",
      description: "Warehouse rollout",
      budgetAmount: 80000,
      materials: [],
      files: [],
      notes: [],
      scope: { objectives: "", inScope: [], outOfScope: [], deliverables: [], assumptions: [] },
    },
  ],
});
assert.ok(revived);
assert.equal(revived.companies.length, 1);
assert.equal(revived.companies[0].name, DMC_CONSULTING_NAME);
assert.equal(revived.projects.length, 1);
assert.equal(revived.projects[0].name, DMC_INTERNAL_PROJECT_NAME);

const leftoverNav = withDemoWorkspace({
  ...empty,
  recentlyViewed: [
    { type: "company", id: "c-cascade", label: "Cascade Ventures" },
    { type: "project", id: empty.projects[0].id, label: DMC_INTERNAL_PROJECT_NAME },
  ],
  focusCompanyId: "c-cascade",
});
assert.ok(leftoverNav);
assert.deepEqual(
  leftoverNav.recentlyViewed,
  [{ type: "project", id: empty.projects[0].id, label: DMC_INTERNAL_PROJECT_NAME }],
);
assert.equal(leftoverNav.focusCompanyId, null);

const stale = withDemoWorkspace({
  ...empty,
  demoWorkspaceGeneration: "play-v2",
  companies: [
    ...empty.companies,
    {
      id: "c-cascade",
      name: "Cascade Ventures",
      initials: "CV",
      status: "Active",
      accountManager: "J. Alvarez",
      openProjects: 1,
      openTickets: 0,
      lastActivity: "Sep 12, 2026",
      industry: "Logistics",
      billingTerms: "Net 30",
      portalContacts: 1,
    },
  ],
  projects: [
    ...empty.projects,
    {
      id: "p-warehouse",
      number: "P-900",
      name: "Q3 Warehouse Rollout",
      companyId: "c-cascade",
      companyName: "Cascade Ventures",
      manager: "J. Kim",
      progress: 40,
      status: "Active",
      start: "2026-07-01",
      due: "2026-09-30",
      budgetHours: 400,
      loggedHours: 120,
      marginPct: 28,
      portalShared: true,
      portalContacts: 1,
      projectType: "Client Work",
      description: "Warehouse rollout",
      budgetAmount: 80000,
      materials: [],
      files: [],
      notes: [],
      scope: { objectives: "", inScope: [], outOfScope: [], deliverables: [], assumptions: [] },
    },
  ],
});
assert.ok(stale);
assert.equal(stale.companies.length, 1);
assert.equal(stale.companies[0].name, DMC_CONSULTING_NAME);
assert.equal(stale.projects.length, 1);
assert.equal(stale.projects[0].name, DMC_INTERNAL_PROJECT_NAME);

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
assert.equal(existing.companies.length, 1);
assert.equal(existing.projects.find((row) => row.name === DMC_INTERNAL_PROJECT_NAME)?.companyId, "c-yoa5boy");
assert.equal(existing.projects.length, 1);
assert.ok(existing.tickets.some((row) => row.companyId === "c-yoa5boy"));
assert.ok(existing.retainers.some((row) => row.companyId === "c-yoa5boy"));
assert.ok(existing.workOrders.some((row) => row.companyId === "c-yoa5boy"));

console.log("demo-workspace.verify ok");
