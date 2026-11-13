import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DMC_CONSULTING_NAME,
  DMC_CONTACT_NAME,
  DMC_INTERNAL_PROJECT_NAME,
  DMC_MANAGER_NAME,
  withDmcInternalExample,
} from "./dmc-internal-project";

const empty = withDmcInternalExample({
  companies: [],
  contacts: [],
  projects: [],
  milestones: [],
  tasks: [],
  team: [],
});
assert.ok(empty);
assert.equal(empty.companies[0]?.name, DMC_CONSULTING_NAME);
assert.equal(empty.contacts[0]?.name, DMC_CONTACT_NAME);
assert.equal(empty.projects[0]?.name, DMC_INTERNAL_PROJECT_NAME);
assert.equal(empty.projects[0]?.projectType, "Internal");
assert.equal(empty.projects[0]?.manager, DMC_MANAGER_NAME);
assert.equal(empty.projects[0]?.companyId, empty.companies[0]?.id);
assert.equal(empty.milestones.length, 4);
assert.ok(empty.milestones.some((row) => row.name === "Hire Full Stack Developer"));
assert.ok(empty.milestones.some((row) => row.name === "AWS Environment Setup"));
assert.ok(empty.milestones.some((row) => row.name === "Design UI/UX + Wireframes"));
assert.ok(empty.milestones.some((row) => row.name === "Implement Authentication & Login"));
assert.ok(empty.tasks.some((row) => row.name === "Interview - 1"));
assert.ok(empty.tasks.some((row) => row.name === "Provision S3, Lambda, DynamoDB, API Gateway"));
assert.ok(empty.tasks.some((row) => row.name === "Set up Cognito user pool"));
assert.equal(empty.tasks.length, 11);
assert.equal(withDmcInternalExample(empty), null);

const existing = withDmcInternalExample({
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
  contacts: [],
  projects: [],
  milestones: [],
  tasks: [],
  team: [],
});
assert.ok(existing);
assert.equal(existing.companies.length, 1);
assert.equal(existing.projects[0]?.companyId, "c-yoa5boy");
assert.equal(existing.companies[0]?.openProjects, 1);

const root = dirname(fileURLToPath(import.meta.url));
const company = readFileSync(join(root, "../app/app/companies/[id]/company-detail.tsx"), "utf8");
const project = readFileSync(join(root, "../app/app/projects/[id]/project-detail.tsx"), "utf8");
const css = readFileSync(join(root, "../app/globals.css"), "utf8");
assert.match(company, /RecordActionButtons/);
assert.match(project, /RecordActionButtons/);
assert.match(project, /Add activity|onActivity/);
assert.match(css, /align-self: start/);
assert.match(css, /\.record-actions \.btn/);
assert.match(css, /min-height: 30px/);

console.log("dmc-internal-project.verify ok");
