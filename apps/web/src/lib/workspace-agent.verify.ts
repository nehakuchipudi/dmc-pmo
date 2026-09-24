import assert from "node:assert/strict";
import { DEFAULT_PROJECT_WORKFLOW } from "./project-lifecycle";
import {
  looksLikeWorkspaceAction,
  parseStatus,
  parseWorkspaceIntents,
  resolveProject,
  runWorkspaceAgent,
  type AgentContext,
  type AgentProject,
  type WorkspaceRunner,
} from "./workspace-agent";

const projects: AgentProject[] = [
  { id: "p-warehouse", name: "Q3 Warehouse Rollout", status: "Active", companyId: "c-cascade", companyName: "Cascade Ventures" },
  { id: "p-website", name: "Website Replatform", status: "Active", companyId: "c-cascade", companyName: "Cascade Ventures" },
];

const ctx: AgentContext = {
  role: "admin",
  actorName: "Dillon Morgan",
  projects,
  workflow: DEFAULT_PROJECT_WORKFLOW,
};

function mockRunner() {
  const calls: string[] = [];
  const runner: WorkspaceRunner = {
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
  };
  return { runner, calls };
}

assert.equal(parseStatus("set it to on hold"), "On Hold");
assert.equal(looksLikeWorkspaceAction("How do I update project status?"), false);
assert.equal(looksLikeWorkspaceAction("please update the project status and add a new milestone for me"), true);

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
const first = runWorkspaceAgent("please update the project status and add a new milestone for me", {
  ...ctx,
  routeProjectId: "p-warehouse",
}, ask.runner);
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

console.log("workspace-agent.verify ok");
