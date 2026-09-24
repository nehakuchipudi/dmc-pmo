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
  let milestoneSeq = 0;
  const runner = stubRunner({
    setProjectStatus: (id, status) => {
      calls.push(`status:${id}:${status}`);
      return true;
    },
    createMilestone: (projectId, name, due) => {
      const id = `m-${++milestoneSeq}`;
      calls.push(`milestone:${projectId}:${name}:${due}`);
      return id;
    },
    createTask: (input) => {
      calls.push(`task:${input.projectId}:${input.name}:${input.milestoneId ?? ""}`);
      return "tk-new";
    },
    createProject: (input) => {
      calls.push(`project:${input.name}`);
      return "p-new";
    },
    updateProject: (id, patch) => {
      calls.push(`rename-project:${id}:${patch.name ?? ""}`);
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

const cho = mockRunner();
runWorkspaceAgent("Assign S. Cho to the warehouse project team", {
  ...ctx,
  people: [...ctx.people, { id: "tm-sc", name: "S. Cho", email: "scho@dillonmorgan.com", kind: "team" }],
}, cho.runner);
assert.ok(cho.calls.some((row) => row.startsWith("member:p-warehouse:tm-sc")));

const removed = mockRunner();
runWorkspaceAgent("Delete the Review signoff task", ctx, removed.runner);
assert.ok(removed.calls.includes("delete-task:tk1"));
assert.equal(removed.calls.some((row) => row.startsWith("status:") || row.includes("update")), false);

const wrongTask = mockRunner();
runWorkspaceAgent(
  "Delete the Review signoff task",
  {
    ...ctx,
    tasks: [{ id: "tk6", name: "Client review homepage design", projectId: "p-website", assignee: "J. Kim", status: "Review" }],
  },
  wrongTask.runner,
);
assert.equal(wrongTask.calls.includes("delete-task:tk6"), false);

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

assert.equal(looksLikeWorkspaceAction("can you name the project to Test234"), true);
const named = parseWorkspaceIntents(
  "for project Test234, can you add 3 milestone/phase and add 2 tasks under 1st milestone and 3 tasks under 3rd phase, just give any random phase and task names",
  ctx,
);
assert.equal(named.filter((intent) => intent.type === "create_project" && intent.name === "Test234").length, 1);
assert.equal(named.filter((intent) => intent.type === "add_milestone").length, 3);
assert.equal(named.filter((intent) => intent.type === "add_task").length, 5);
assert.equal(named.some((intent) => intent.type === "add_milestone" && intent.name === "3"), false);
assert.equal(named.some((intent) => intent.type === "create_project" && intent.name === "New project"), false);

const built = mockRunner();
const plan = runWorkspaceAgent(
  "for project Test234, can you add 3 milestone/phase and add 2 tasks under 1st milestone and 3 tasks under 3rd phase, just give any random phase and task names",
  ctx,
  built.runner,
);
assert.ok(built.calls.includes("project:Test234"));
assert.equal(built.calls.filter((row) => row.startsWith("milestone:p-new:")).length, 3);
assert.equal(built.calls.filter((row) => row.startsWith("task:p-new:") && row.endsWith(":m-1")).length, 2);
assert.equal(built.calls.filter((row) => row.startsWith("task:p-new:") && row.endsWith(":m-3")).length, 3);
assert.match(plan.text, /Test234/);
assert.equal(plan.pending?.lastProjectId, "p-new");

const renamed = mockRunner();
const rename = runWorkspaceAgent(
  "can you name the project to Test234",
  { ...ctx, lastProjectId: "p-warehouse", pending: { intents: [], lastProjectId: "p-warehouse" } },
  renamed.runner,
);
assert.ok(renamed.calls.includes("rename-project:p-warehouse:Test234"));
assert.match(rename.text, /Test234/);

console.log("workspace-agent.verify ok");
