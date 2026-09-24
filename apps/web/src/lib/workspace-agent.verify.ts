import assert from "node:assert/strict";
import { DEFAULT_PROJECT_WORKFLOW } from "./project-lifecycle";
import {
  looksLikeWorkspaceAction,
  parseStatus,
  parseWorkspaceIntents,
  resolveProject,
  runWorkspaceAgent,
  stubRunner,
  type AgentContext,
  type AgentProject,
} from "./workspace-agent";

const projects: AgentProject[] = [
  { id: "p-warehouse", name: "Q3 Warehouse Rollout", status: "Active", companyId: "c-cascade", companyName: "Cascade Ventures" },
  { id: "p-website", name: "Website Replatform", status: "Active", companyId: "c-cascade", companyName: "Cascade Ventures" },
];

const ctx: AgentContext = {
  role: "admin",
  actorName: "Dillon Morgan",
  actorEmail: "admin@dillonmorgan.com",
  projects,
  companies: [{ id: "c-cascade", name: "Cascade Ventures", status: "Active" }],
  contacts: [{ id: "ct-dana", name: "Dana Kessler" }],
  tasks: [{ id: "tk1", name: "Review signoff", projectId: "p-warehouse", assignee: "J. Kim", status: "In Progress" }],
  milestones: [{ id: "m1", name: "Phase 1 Discovery", projectId: "p-warehouse" }],
  tickets: [],
  invoices: [{ id: "inv1", name: "INV-2291", number: "INV-2291", companyId: "c-cascade", status: "Sent" }],
  ideas: [{ id: "idea1", name: "Store rollout" }],
  objectives: [],
  portfolios: [],
  retainers: [],
  risks: [],
  people: [
    { id: "tm-jk", name: "J. Kim", email: "jkim@dillonmorgan.com", kind: "team" },
    { id: "ct-dana", name: "Dana Kessler", email: "dana@cascade.com", kind: "contact", companyId: "c-cascade" },
  ],
  timeEntries: [],
  expenses: [],
  opportunities: [],
  gates: [],
  issues: [{ id: "is1", name: "Blocked vendor" }],
  allocations: [{ id: "al1", memberName: "J. Kim", projectId: "p-warehouse" }],
  automations: [{ id: "au1", name: "Welcome email" }],
  workflow: DEFAULT_PROJECT_WORKFLOW,
};

function mockRunner() {
  const calls: string[] = [];
  const runner = stubRunner({
    setProjectStatus: (id, status) => {
      calls.push(`status:${id}:${status}`);
      return true;
    },
    createMilestone: (projectId, name, due) => {
      calls.push(`milestone:${projectId}:${name}:${due}`);
      return "m-new";
    },
    createTask: (input) => {
      calls.push(`task:${input.projectId}:${input.name}`);
      return "tk-new";
    },
    addProjectNote: (projectId, note) => {
      calls.push(`note:${projectId}:${note.body}`);
    },
    createTimeEntry: (input) => {
      calls.push(`time:${input.projectId}:${input.hours}`);
      return "te-new";
    },
    createTicket: (input) => {
      calls.push(`ticket:${input.projectId}:${input.subject}`);
      return "t-new";
    },
    createCompany: (input) => {
      calls.push(`company:${input.name}`);
      return "c-new";
    },
    createContact: (input) => {
      calls.push(`contact:${input.name}:${input.companyId}`);
      return "ct-new";
    },
    addProjectMember: (input) => {
      calls.push(`member:${input.projectId}:${input.memberId}`);
      return "al-new";
    },
    queueEmail: (to, subject, _body, status) => {
      calls.push(`email:${status}:${to}:${subject}`);
      return "e-new";
    },
    deleteTask: (id) => {
      calls.push(`delete-task:${id}`);
    },
    createInvoiceDraft: (companyId) => {
      calls.push(`invoice:${companyId}`);
      return "inv-new";
    },
    generateProjectInvoice: (projectId) => {
      calls.push(`gen-invoice:${projectId}`);
      return "inv-gen";
    },
    addTeamMember: (input) => {
      calls.push(`user:${input.name}:${input.role}`);
      return "tm-new";
    },
    updateRiskStatus: (id, status) => {
      calls.push(`risk:${id}:${status}`);
    },
    removeProjectMember: (id) => {
      calls.push(`remove-member:${id}`);
    },
  });
  return { runner, calls };
}

assert.equal(parseStatus("set it to on hold"), "On Hold");
assert.equal(looksLikeWorkspaceAction("How do I update project status?"), false);
assert.equal(looksLikeWorkspaceAction("Set warehouse to Active"), true);
assert.equal(looksLikeWorkspaceAction("please update the project status and add a new milestone for me"), true);
assert.equal(looksLikeWorkspaceAction("Draft an email to Dana Kessler about warehouse"), true);
assert.equal(looksLikeWorkspaceAction("Create a company called Northwind"), true);
assert.equal(looksLikeWorkspaceAction("Delete the Review signoff task"), true);

const parsed = parseWorkspaceIntents("please update the project status and add a new milestone for me", ctx);
assert.equal(parsed.some((intent) => intent.type === "set_status"), true);
assert.equal(parsed.some((intent) => intent.type === "add_milestone"), true);

const warehouse = resolveProject("warehouse", ctx);
assert.equal(warehouse?.id, "p-warehouse");

const both = mockRunner();
const done = runWorkspaceAgent("Set warehouse to On Hold and add a Go-live milestone", ctx, both.runner);
assert.equal(done.handled, true);
assert.match(done.text, /On Hold/);
assert.match(done.text, /Go-live/);
assert.ok(both.calls.some((row) => row.startsWith("status:p-warehouse:On Hold")));
assert.ok(both.calls.some((row) => row.includes("milestone:p-warehouse:Go-live")));

const ask = mockRunner();
const first = runWorkspaceAgent(
  "please update the project status and add a new milestone for me",
  { ...ctx, routeProjectId: "p-warehouse" },
  ask.runner,
);
assert.equal(first.handled, true);
assert.ok(first.pending);
assert.ok(ask.calls.some((row) => row.includes("milestone:p-warehouse:New milestone")));
assert.equal(ask.calls.some((row) => row.startsWith("status:")), false);

const second = mockRunner();
const follow = runWorkspaceAgent("On Hold", { ...ctx, pending: first.pending, routeProjectId: "p-warehouse" }, second.runner);
assert.ok(second.calls.some((row) => row.startsWith("status:p-warehouse:On Hold")));
assert.match(follow.text, /On Hold/);

const staff = runWorkspaceAgent("Set warehouse to On Hold", { ...ctx, role: "staff" }, mockRunner().runner);
assert.match(staff.text, /cannot/i);

const company = mockRunner();
const created = runWorkspaceAgent("Create a company called Northwind", ctx, company.runner);
assert.ok(company.calls.includes("company:Northwind"));
assert.match(created.text, /Northwind/);

const mail = mockRunner();
const drafted = runWorkspaceAgent("Draft an email to Dana Kessler about warehouse status", ctx, mail.runner);
assert.ok(mail.calls.some((row) => row.startsWith("email:Queued:dana@cascade.com")));
assert.equal(mail.calls.some((row) => row.startsWith("status:")), false);
assert.match(drafted.text, /drafted/i);

const sent = mockRunner();
runWorkspaceAgent("Email dana@cascade.com about the warehouse go-live", ctx, sent.runner);
assert.ok(sent.calls.some((row) => row.startsWith("email:Sent:dana@cascade.com")));

const assigned = mockRunner();
runWorkspaceAgent("Assign J. Kim to the warehouse project team", ctx, assigned.runner);
assert.ok(assigned.calls.some((row) => row.startsWith("member:p-warehouse:tm-jk")));

const removed = mockRunner();
runWorkspaceAgent("Delete the Review signoff task", ctx, removed.runner);
assert.ok(removed.calls.includes("delete-task:tk1"));

const billed = mockRunner();
runWorkspaceAgent("Generate an invoice for the warehouse project", ctx, billed.runner);
assert.ok(billed.calls.includes("gen-invoice:p-warehouse"));

const user = mockRunner();
runWorkspaceAgent("Create a user named Sam Lee as staff", ctx, user.runner);
assert.ok(user.calls.includes("user:Sam Lee:staff"));

const risk = mockRunner();
runWorkspaceAgent("Close the vendor delay risk", { ...ctx, risks: [{ id: "rk1", name: "Vendor delay" }] }, risk.runner);
assert.ok(risk.calls.includes("risk:rk1:Closed"));

const unassign = mockRunner();
runWorkspaceAgent("Remove J. Kim from the warehouse project team", ctx, unassign.runner);
assert.ok(unassign.calls.includes("remove-member:al1"));
assert.equal(unassign.calls.some((row) => row.startsWith("status:") || row.includes("delete")), false);

console.log("workspace-agent.verify ok");
