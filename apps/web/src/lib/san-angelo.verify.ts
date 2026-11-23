import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DMC_MANAGER_NAME } from "./dmc-internal-project";
import { emptyDemoState, withDemoWorkspace } from "./demo-workspace";
import {
  SAN_ANGELO_COMPANY_NAME,
  SAN_ANGELO_CONTACT_NAME,
  SAN_ANGELO_PROJECT_NAME,
  SAN_ANGELO_TEAM_NAME,
  withSanAngeloExample,
} from "./san-angelo";

const empty = withSanAngeloExample({
  companies: [],
  contacts: [],
  projects: [],
  milestones: [],
  tasks: [],
  team: [],
  allocations: [],
  timeEntries: [],
});
assert.ok(empty);
assert.equal(empty.companies[0]?.name, SAN_ANGELO_COMPANY_NAME);
assert.equal(empty.companies[0]?.industry, "Government");
assert.equal(empty.companies[0]?.website, "http://sanangelo.gov");
assert.equal(empty.companies[0]?.status, "Active");
assert.equal(empty.companies[0]?.accountManager, DMC_MANAGER_NAME);
assert.deepEqual(empty.companies[0]?.teamMembers, [SAN_ANGELO_TEAM_NAME]);
assert.equal(empty.contacts[0]?.name, SAN_ANGELO_CONTACT_NAME);
assert.equal(empty.projects[0]?.name, SAN_ANGELO_PROJECT_NAME);
assert.equal(empty.projects[0]?.projectType, "Client Work");
assert.equal(empty.projects[0]?.manager, DMC_MANAGER_NAME);
assert.equal(empty.projects[0]?.budgetAmount, 60000);
assert.equal(empty.projects[0]?.budgetHours, 240);
assert.equal(empty.projects[0]?.loggedHours, 76);
assert.equal(empty.projects[0]?.progress, 25);
assert.equal(empty.projects[0]?.start, "2026-08-24");
assert.equal(empty.projects[0]?.due, "2026-10-16");
assert.equal(empty.projects[0]?.companyId, empty.companies[0]?.id);
assert.equal(empty.projects[0]?.contactName, SAN_ANGELO_CONTACT_NAME);
assert.equal(empty.milestones.length, 3);
assert.ok(empty.milestones.some((row) => row.name === "Project Mobilization & Launch"));
assert.ok(empty.milestones.some((row) => row.name === "Council Preparation Complete"));
assert.ok(empty.milestones.some((row) => row.name === "Strategic Plan Development"));
assert.equal(empty.milestones.find((row) => row.name === "Project Mobilization & Launch")?.start, "2026-08-24");
assert.equal(empty.milestones.find((row) => row.name === "Project Mobilization & Launch")?.due, "2026-09-04");
assert.equal(empty.milestones.find((row) => row.name === "Council Preparation Complete")?.start, "2026-09-07");
assert.equal(empty.milestones.find((row) => row.name === "Council Preparation Complete")?.due, "2026-09-25");
assert.equal(empty.milestones.find((row) => row.name === "Strategic Plan Development")?.start, "2026-09-25");
assert.equal(empty.milestones.find((row) => row.name === "Strategic Plan Development")?.due, "2026-10-16");
assert.ok(empty.team.some((row) => row.name === SAN_ANGELO_TEAM_NAME));
assert.ok(empty.allocations.every((row) => row.memberName === SAN_ANGELO_TEAM_NAME));
assert.ok(empty.allocations.some((row) => row.memberName === SAN_ANGELO_TEAM_NAME));
assert.equal(
  empty.timeEntries.reduce((sum, row) => sum + row.hours, 0),
  76,
);
assert.equal(empty.companies[0]?.addresses?.[0]?.line1, "72 W College Ave");
assert.equal(withSanAngeloExample(empty), null);

const workspace = withDemoWorkspace(emptyDemoState());
assert.ok(workspace);
assert.ok(workspace.companies.some((row) => row.name === SAN_ANGELO_COMPANY_NAME));
assert.ok(workspace.projects.some((row) => row.name === SAN_ANGELO_PROJECT_NAME));
assert.ok(workspace.contacts.some((row) => row.name === SAN_ANGELO_CONTACT_NAME));
assert.equal(withDemoWorkspace(workspace), null);

const revived = withSanAngeloExample({
  companies: empty.companies.map((row) => ({ ...row, teamMembers: [] })),
  contacts: empty.contacts,
  projects: empty.projects,
  milestones: empty.milestones,
  tasks: empty.tasks,
  team: empty.team,
  allocations: empty.allocations,
  timeEntries: empty.timeEntries,
});
assert.ok(revived);
assert.deepEqual(revived.companies[0]?.teamMembers, [SAN_ANGELO_TEAM_NAME]);

const root = dirname(fileURLToPath(import.meta.url));
const company = readFileSync(join(root, "../app/app/companies/[id]/company-detail.tsx"), "utf8");
assert.match(company, /Add manager[\s\S]*Add team/);
assert.match(company, /RecordFact label="Team"/);

console.log("san-angelo.verify ok");
