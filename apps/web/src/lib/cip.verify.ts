import assert from "node:assert/strict";
import { assignPhaseContractor, companyKindOf, isVendorKind, phaseContractorLabel } from "./cip";
import type { Company, Milestone } from "./types";

const agency: Company = {
  id: "c-rowlett",
  name: "City of Rowlett Public Works",
  initials: "RW",
  status: "Active",
  companyKind: "Agency",
  accountManager: "A. Chen",
  openProjects: 1,
  openTickets: 0,
  lastActivity: "Sep 28, 2026",
  industry: "Public Sector",
  billingTerms: "Net 30",
  portalContacts: 2,
};

const consultant: Company = { ...agency, id: "c-trinity", name: "Trinity Ridge Engineering", companyKind: "Consultant" };
const client: Company = { ...agency, id: "c-x", name: "Acme", companyKind: undefined };

assert.equal(companyKindOf(agency), "Agency");
assert.equal(companyKindOf(client), "Client");
assert.equal(isVendorKind("Consultant"), true);
assert.equal(isVendorKind("Agency"), false);

const phase: Milestone = {
  id: "m-design",
  projectId: "p-sidewalk",
  name: "Design",
  due: "2026-06-30",
  start: "2026-02-16",
  status: "In Progress",
  kind: "phase",
};

const assigned = { ...phase, ...assignPhaseContractor(phase, consultant, { phaseRole: "Design", contractNumber: "PS-4412" }) };
assert.equal(assigned.contractorCompanyId, "c-trinity");
assert.equal(phaseContractorLabel(assigned), "Trinity Ridge Engineering · Design · PS-4412");

console.log("cip.verify ok");
