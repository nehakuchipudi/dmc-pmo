import { can, type Capability } from "./rbac";
import { allowedProjectTransitions, canChangeProjectStatus, normalizeProjectStatus } from "./project-lifecycle";
import { addDays, todayIso } from "./timesheet";
import type {
  EmailOutboxItem,
  ProjectStatus,
  ProjectWorkflow,
  Role,
  TaskStatus,
  TicketPriority,
  TicketStatus,
} from "./types";

export type AgentIntentType =
  | "set_status"
  | "add_milestone"
  | "delete_milestone"
  | "add_task"
  | "update_task"
  | "delete_task"
  | "assign_task"
  | "add_note"
  | "log_time"
  | "create_ticket"
  | "update_ticket"
  | "assign_ticket"
  | "create_company"
  | "update_company"
  | "create_contact"
  | "create_project"
  | "delete_project"
  | "assign_member"
  | "create_expense"
  | "approve_expense"
  | "create_opportunity"
  | "advance_opportunity"
  | "create_retainer"
  | "delete_retainer"
  | "create_invoice"
  | "send_invoice"
  | "pay_invoice"
  | "create_idea"
  | "advance_idea"
  | "convert_idea"
  | "create_portfolio"
  | "create_objective"
  | "create_risk"
  | "create_dependency"
  | "decide_gate"
  | "approve_time"
  | "request_signoff"
  | "approve_signoff"
  | "send_email"
  | "draft_email"
  | "update_contact"
  | "update_project"
  | "update_invoice"
  | "update_retainer"
  | "update_idea"
  | "update_portfolio"
  | "update_objective"
  | "update_risk"
  | "update_issue"
  | "remove_member"
  | "add_user"
  | "reject_time"
  | "generate_invoice"
  | "run_automation";

export interface AgentIntent {
  type: AgentIntentType;
  projectQuery?: string;
  projectId?: string;
  companyQuery?: string;
  companyId?: string;
  status?: ProjectStatus;
  taskStatus?: TaskStatus;
  ticketStatus?: TicketStatus;
  name?: string;
  due?: string;
  body?: string;
  hours?: number;
  assignee?: string;
  priority?: TicketPriority;
  subject?: string;
  amount?: number;
  recordQuery?: string;
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
  memberQuery?: string;
}

export interface AgentNamed {
  id: string;
  name: string;
}

export interface AgentProject {
  id: string;
  name: string;
  status: ProjectStatus;
  companyId: string;
  companyName: string;
}

export interface AgentCompany extends AgentNamed {
  status: string;
}

export interface AgentPerson {
  id: string;
  name: string;
  email: string;
  kind: "team" | "contact";
  companyId?: string;
}

export interface AgentPending {
  intents: AgentIntent[];
}

export interface AgentActionResult {
  ok: boolean;
  label: string;
}

export interface AgentAnswer {
  handled: boolean;
  text: string;
  hrefs: { href: string; label: string }[];
  starters: string[];
  pending?: AgentPending;
  actions?: AgentActionResult[];
}

export interface AgentContext {
  role?: Role | null;
  actorName: string;
  actorEmail?: string;
  projects: AgentProject[];
  companies: AgentCompany[];
  contacts: AgentNamed[];
  tasks: (AgentNamed & { projectId: string; assignee: string; status: TaskStatus })[];
  milestones: (AgentNamed & { projectId: string })[];
  tickets: (AgentNamed & { id: string; subject: string; companyId: string; assignee: string; status: TicketStatus })[];
  invoices: (AgentNamed & { number: string; companyId: string; status: string })[];
  ideas: AgentNamed[];
  objectives: AgentNamed[];
  portfolios: AgentNamed[];
  retainers: (AgentNamed & { companyId: string })[];
  risks: AgentNamed[];
  people: AgentPerson[];
  timeEntries: { id: string; userName: string; status: string }[];
  expenses: { id: string; vendor: string; status: string; projectId: string }[];
  opportunities: AgentNamed[];
  gates: AgentNamed[];
  issues: AgentNamed[];
  allocations: { id: string; memberName: string; projectId: string }[];
  automations: AgentNamed[];
  focusCompanyId?: string | null;
  routeProjectId?: string | null;
  lastProjectId?: string | null;
  pending?: AgentPending;
  workflow: ProjectWorkflow;
}

export interface WorkspaceRunner {
  setProjectStatus: (projectId: string, status: ProjectStatus) => boolean;
  createMilestone: (projectId: string, name: string, due: string) => string;
  deleteMilestone: (id: string) => void;
  createTask: (input: { name: string; projectId: string; assignee: string; due: string }) => string;
  updateTask: (id: string, patch: { status?: TaskStatus; assignee?: string; name?: string }) => void;
  deleteTask: (id: string) => void;
  addProjectNote: (projectId: string, note: { author: string; body: string; visibility: "internal" | "client" }) => void;
  createTimeEntry: (input: {
    userName: string;
    projectId: string;
    date: string;
    hours: number;
    billable: boolean;
    note: string;
  }) => string;
  createTicket: (input: {
    subject: string;
    companyId: string;
    priority: TicketPriority;
    assignee: string;
    projectId?: string;
  }) => string;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  updateTicket: (id: string, patch: { assignee?: string; priority?: TicketPriority; subject?: string }) => void;
  createCompany: (input: {
    name: string;
    status: "Active" | "Prospect" | "Overdue Inv.";
    accountManager: string;
    industry: string;
    billingTerms: string;
  }) => string;
  updateCompany: (id: string, patch: { name?: string; status?: "Active" | "Prospect" | "Overdue Inv." }) => void;
  createContact: (input: {
    name: string;
    companyId: string;
    companyName: string;
    title: string;
    email: string;
    portal: "Enabled" | "Not Invited";
  }) => string;
  createProject: (input: { name: string; companyId: string; manager: string; due: string; budgetHours: number }) => string;
  deleteProject: (id: string) => void;
  addProjectMember: (input: {
    projectId: string;
    memberId: string;
    projectRole: string;
    responsibility: string;
    allocationPct: number;
  }) => string;
  createExpense: (input: { vendor: string; projectId: string; amount: number; note: string }) => string;
  approveExpense: (id: string) => void;
  createOpportunity: (input: { name: string; companyId: string; amount: number; close: string }) => string;
  advanceOpportunity: (id: string) => void;
  createRetainer: (input: {
    name: string;
    companyId: string;
    type: "Monthly T&M" | "Pre-paid" | "Fixed";
    manager: string;
    budgetHours: number;
    expires: string;
  }) => string;
  deleteRetainer: (id: string) => void;
  createInvoiceDraft: (companyId: string, opts?: { projectId?: string; amount?: number; description?: string; send?: boolean }) => string;
  sendInvoice: (id: string) => void;
  payInvoice: (id: string) => void;
  createIdea: (input: { name: string; summary: string; submitter: string; requestedBudget: number; companyId?: string }) => string;
  advanceIdea: (id: string) => void;
  convertIdea: (id: string) => string | undefined;
  createPortfolio: (input: { name: string; owner: string; theme: string; budget: number; description: string }) => string;
  createObjective: (input: { name: string; owner: string; horizon: string; target: string; description: string }) => string;
  createRisk: (input: {
    title: string;
    owner: string;
    projectId?: string;
    probability: "Low" | "Medium" | "High";
    impact: "Low" | "Medium" | "High";
    mitigation: string;
    due: string;
  }) => string;
  createDependency: (input: {
    predecessorProjectId: string;
    successorProjectId: string;
    type: "Finish to Start" | "Shared Resource" | "Data";
    note: string;
  }) => string;
  decideGate: (id: string, status: "Approved" | "Rejected") => void;
  approveTimeEntry: (id: string) => void;
  requestSignoff: (projectId: string, milestoneName: string) => void;
  approveSignoff: (milestoneId: string) => void;
  updateContact: (id: string, patch: { name?: string; title?: string; email?: string }) => void;
  updateProject: (id: string, patch: { name?: string; manager?: string }) => void;
  updateInvoice: (id: string, patch: { title?: string; description?: string }) => void;
  updateRetainer: (id: string, patch: { name?: string }) => void;
  updateIdea: (id: string, patch: { name?: string; summary?: string }) => void;
  updatePortfolio: (id: string, patch: { name?: string; description?: string }) => void;
  updateObjective: (id: string, patch: { name?: string; target?: string }) => void;
  updateRiskStatus: (id: string, status: "Open" | "Mitigating" | "Closed") => void;
  updateIssueStatus: (id: string, status: "Open" | "In Progress" | "Resolved") => void;
  removeProjectMember: (id: string) => void;
  addTeamMember: (input: { name: string; email: string; role: Role; title: string }) => string;
  rejectTimeEntry: (id: string) => void;
  generateProjectInvoice: (projectId: string) => string;
  runAutomation: (id: string) => void;
  queueEmail: (to: string, subject: string, body: string, status?: EmailOutboxItem["status"]) => string;
}

const ACTION_HINT =
  /\b(update|change|set|move|mark|make|add|create|log|raise|open|put|please|can you|could you|delete|remove|assign|email|mail|draft|send|approve|reject|pay|convert|advance|link|unlink|deactivate|record|generate|rename|close|submit|run)\b/;
const QUESTION_HINT = /^(how|what|where|why|explain|tell me|who)\b/;
const MODULE_HINT =
  /\b(compan(?:y|ies)|contacts?|projects?|tickets?|tasks?|milestones?|phases?|invoices?|expenses?|retainers?|ideas?|portfolios?|objectives?|risks?|issues?|dependencies|gates?|users?|members?|emails?|notes?|timesheets?|hours?|opportunit(?:y|ies)|signoffs?|status|automations?)\b/;

const STATUS_ALIASES: { match: RegExp; status: ProjectStatus }[] = [
  { match: /\bat\s+risk\b|\brisk\b|\boverdue\b/, status: "At Risk" },
  { match: /\bon\s+hold\b|\bhold\b|\bpaused?\b|\bpause\b/, status: "On Hold" },
  { match: /\bcomplet(?:e|ed)\b|\bdone\b|\bfinished\b|\bclosed\b/, status: "Completed" },
  { match: /\bcancel(?:led|ed)?\b/, status: "Cancelled" },
  { match: /\bplanning\b|\bplanned\b/, status: "Planning" },
  { match: /\bdraft\b/, status: "Draft" },
  { match: /\bactive\b|\bon\s+track\b/, status: "Active" },
];

const PROJECT_REQUIRED = new Set<AgentIntentType>([
  "set_status",
  "add_milestone",
  "add_task",
  "add_note",
  "log_time",
  "create_expense",
  "delete_project",
  "assign_member",
  "request_signoff",
  "remove_member",
  "generate_invoice",
]);

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripPunct(value: string) {
  return value.replace(/[?!.,;:]+$/g, "").trim();
}

export function parseRelativeDate(raw: string, from = todayIso()): string | undefined {
  const text = raw.toLowerCase();
  if (/\btoday\b/.test(text)) return from;
  if (/\btomorrow\b/.test(text)) return addDays(from, 1);
  if (/\bnext\s+week\b/.test(text)) return addDays(from, 7);
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayHit = text.match(/\b(?:next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (dayHit) {
    const target = weekdays.indexOf(dayHit[1]);
    const base = new Date(`${from}T12:00:00`);
    const current = base.getDay();
    let delta = (target - current + 7) % 7;
    if (delta === 0 || /\bnext\s+/.test(dayHit[0])) delta = delta === 0 ? 7 : delta;
    return addDays(from, delta);
  }
  return undefined;
}

export function parseStatus(raw: string): ProjectStatus | undefined {
  const text = raw.toLowerCase();
  const explicit = text.match(
    /(?:status\s+(?:to|as)\s+|set\s+(?:it|this|the project|the status)?\s*(?:to|as)\s+|mark(?:ed)?\s+(?:it|this|the project)?\s+(?:as\s+)?|make\s+(?:it|this|the project)\s+)([a-z][a-z\s-]{2,20})/,
  );
  const blob = explicit ? explicit[1] : text;
  for (const row of STATUS_ALIASES) {
    if (row.match.test(blob)) return row.status;
  }
  return undefined;
}

export function parseTaskStatus(raw: string): TaskStatus | undefined {
  const text = raw.toLowerCase();
  if (/\bnot started\b/.test(text)) return "Not Started";
  if (/\bin progress\b|\bworking\b/.test(text)) return "In Progress";
  if (/\breview\b/.test(text)) return "Review";
  if (/\bdone\b|\bcomplete/.test(text)) return "Done";
  return undefined;
}

export function parseTicketStatus(raw: string): TicketStatus | undefined {
  const text = raw.toLowerCase();
  if (/\bresolved\b|\bclosed\b/.test(text)) return "Resolved";
  if (/\bin progress\b/.test(text)) return "In Progress";
  if (/\bopen\b/.test(text)) return "Open";
  return undefined;
}

const NAME_STOP = new Set([
  "the",
  "and",
  "for",
  "you",
  "please",
  "update",
  "change",
  "status",
  "add",
  "new",
  "create",
  "delete",
  "remove",
  "assign",
  "email",
  "draft",
  "send",
  "milestone",
  "phase",
  "project",
  "task",
  "note",
  "ticket",
  "time",
  "hours",
  "with",
  "from",
  "this",
  "that",
  "into",
  "company",
  "contact",
  "invoice",
  "called",
  "named",
]);

export function scoreName(name: string, query: string) {
  const hay = name.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  if (hay === q) return 100;
  if (q.length > 3 && hay.includes(q)) return 70 + Math.min(q.length, 20);
  const words = q.split(/\s+/).filter((word) => word.length > 3 && !NAME_STOP.has(word));
  let score = 0;
  for (const word of words) {
    if (new RegExp(`\\b${word}\\b`).test(hay)) score += 16;
  }
  return score;
}

export const scoreProjectName = scoreName;

export function resolveNamed<T extends { id: string; name: string }>(query: string | undefined, items: T[]): T | undefined {
  if (!query) return undefined;
  const ranked = items
    .map((item) => ({ item, score: scoreName(item.name, query) }))
    .sort((a, b) => b.score - a.score);
  const words = query.split(/\s+/).filter((word) => word.length > 3 && !NAME_STOP.has(word.toLowerCase()));
  const min = words.length >= 2 ? 32 : 12;
  if (ranked[0] && ranked[0].score >= min) return ranked[0].item;
  return undefined;
}

export function resolveProject(query: string | undefined, ctx: AgentContext): AgentProject | undefined {
  const named = resolveNamed(query, ctx.projects);
  if (named) return named;
  if (ctx.routeProjectId) return ctx.projects.find((project) => project.id === ctx.routeProjectId);
  if (ctx.lastProjectId) return ctx.projects.find((project) => project.id === ctx.lastProjectId);
  if (ctx.focusCompanyId) {
    const scoped = ctx.projects.filter((project) => project.companyId === ctx.focusCompanyId);
    if (scoped.length === 1) return scoped[0];
  }
  if (ctx.projects.length === 1) return ctx.projects[0];
  return undefined;
}

function extractQuoted(raw: string) {
  const hit = raw.match(/["']([^"']{2,80})["']/);
  return hit ? clean(hit[1]) : undefined;
}

function usableRecordName(name: string, noun: string) {
  const cleaned = clean(name).replace(/^(a|an|the|new)\s+/i, "");
  if (!cleaned || cleaned.toLowerCase() === "new") return undefined;
  if (new RegExp(`^(?:${noun})s?$`, "i").test(cleaned)) return undefined;
  if (/\b(status|and|add|create|update|please|project|for me)\b/i.test(cleaned)) return undefined;
  return cleaned;
}

function extractCalled(raw: string, noun: string) {
  const hit = raw.match(new RegExp(`(?:${noun})\\s+(?:called|named|titled)\\s+["']?([^"'.]+?)["']?(?=\\s+due|\\s+on\\b|\\s+for\\b|\\s+and\\b|\\s+as\\b|[.,]|$)`, "i"));
  if (hit) {
    const named = usableRecordName(hit[1], noun);
    if (named) return named;
  }
  const ahead = raw.match(new RegExp(`(?:add|create|new|delete|remove|close|update|rename|approve|reject|resolve|generate|run)\\s+(?:the\\s+)?(?:a\\s+)?(?:new\\s+)?["']?([^"']+?)["']?\\s+(?:${noun})\\b`, "i"));
  if (ahead) {
    const name = usableRecordName(ahead[1], noun);
    if (name) return name;
  }
  return extractQuoted(raw);
}

function extractProjectQuery(raw: string, projects: AgentProject[]): string | undefined {
  const ranked = projects
    .map((project) => ({ project, score: scoreName(project.name, raw) }))
    .filter((row) => row.score >= 12)
    .sort((a, b) => b.score - a.score);
  if (ranked[0]) {
    const words = ranked[0].project.name.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
    const hit = words.find((word) => raw.toLowerCase().includes(word));
    return hit ?? ranked[0].project.name;
  }
  const on = raw.match(/\b(?:on|for|in)\s+(?:the\s+)?([a-z0-9][a-z0-9\s&/-]{1,40}?)(?:\s+(?:status|milestone|task|note|ticket|hours?|to|and)|$)/i);
  if (on) {
    const value = stripPunct(on[1]);
    if (value.length > 2 && !NAME_STOP.has(value.toLowerCase()) && !/^(me|us|it|them)$/i.test(value)) return value;
  }
  return undefined;
}

function extractCompanyQuery(raw: string, companies: AgentCompany[]): string | undefined {
  return resolveNamed(raw, companies)?.name ?? extractCalled(raw, "compan(?:y|ies)");
}

function extractPerson(raw: string, people: AgentPerson[]): AgentPerson | undefined {
  const ranked = people
    .map((person) => ({ person, score: Math.max(scoreName(person.name, raw), scoreName(person.email, raw)) }))
    .sort((a, b) => b.score - a.score);
  if (ranked[0] && ranked[0].score >= 16) return ranked[0].person;
  const to = raw.match(/\b(?:to|assign(?:ed)?)\s+([a-z][a-z.\s-]{1,40}?)(?:\s+to\b|\s+on\b|$)/i);
  if (to) return resolveNamed(to[1], people);
  return undefined;
}

function extractAmount(raw: string): number | undefined {
  const hit = raw.match(/\$\s*([0-9][0-9,]*(?:\.\d+)?)|\b([0-9][0-9,]*)\s+(?:dollars?|usd)\b/i);
  if (hit) return Number((hit[1] || hit[2]).replace(/,/g, ""));
  return undefined;
}

function extractHours(raw: string): number | undefined {
  const hit = raw.match(/\b(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b/i);
  if (hit) return Number(hit[1]);
  return undefined;
}

function extractNote(raw: string): string | undefined {
  const hit = raw.match(/(?:note|comment)\s*(?:that|:|-)?\s+["']?(.+?)["']?$/i);
  if (hit) return clean(hit[1].replace(/^(saying|that)\s+/i, ""));
  return undefined;
}

function extractEmail(raw: string, people: AgentPerson[]): { to?: string; subject?: string; body?: string } {
  const person = extractPerson(raw, people);
  const subject = raw.match(/(?:about|subject|re)\s+["']?([^"'.]+?)["']?(?=[.,]|$)/i)?.[1];
  const body = raw.match(/(?:saying|body|that says)\s+["'](.+?)["']/i)?.[1];
  const address = raw.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0];
  return {
    to: address ?? person?.email,
    subject: subject ? clean(subject) : undefined,
    body: body ? clean(body) : undefined,
  };
}

export function looksLikeWorkspaceAction(raw: string, pending?: AgentPending): boolean {
  const text = raw.trim().toLowerCase();
  if (!text) return false;
  if (pending?.intents.length) return true;
  if (QUESTION_HINT.test(text) && !/\bplease\b/.test(text)) return false;
  if (ACTION_HINT.test(text) && parseStatus(text)) return true;
  return ACTION_HINT.test(text) && MODULE_HINT.test(text);
}

function extractMilestoneName(raw: string) {
  return extractCalled(raw, "milestone|phase|workstream");
}

function extractTaskName(raw: string) {
  return extractCalled(raw, "tasks?");
}

function extractTicketSubject(raw: string) {
  return extractCalled(raw, "tickets?|requests?") ?? raw.match(/(?:ticket|request)\s+(?:for|about)\s+["']?([^"'.]+?)["']?$/i)?.[1];
}

export function parseWorkspaceIntents(raw: string, ctx: AgentContext): AgentIntent[] {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const projectQuery = extractProjectQuery(lower, ctx.projects);
  const companyQuery = extractCompanyQuery(lower, ctx.companies ?? []);
  const person = extractPerson(lower, ctx.people ?? []);
  const intents: AgentIntent[] = [];
  const isDelete = /\b(delete|remove)\b/.test(lower);
  const isCreate = /\b(add|create|new|raise|log|record)\b/.test(lower);
  const isAssign = /\bassign\b/.test(lower);
  const isEmail = /\b(email|mail|e-mail)\b/.test(lower);
  const isDraft = /\bdraft\b/.test(lower);

  const wantsStatus =
    !isEmail &&
    (/\bstatus\b/.test(lower) || /\b(set|move|mark|make)\b.+\b(active|hold|risk|draft|planning|complete|cancel)/.test(lower));
  if (wantsStatus && !/\btask\b/.test(lower) && !/\bticket\b/.test(lower) && !/\binvoice\b/.test(lower)) {
    intents.push({ type: "set_status", projectQuery, status: parseStatus(lower) });
  }
  if (/\b(milestone|phase|workstream)\b/.test(lower) && isCreate && !isDelete) {
    intents.push({ type: "add_milestone", projectQuery, name: extractMilestoneName(text), due: parseRelativeDate(lower) });
  }
  if (/\b(milestone|phase)\b/.test(lower) && isDelete) {
    intents.push({ type: "delete_milestone", projectQuery, recordQuery: extractMilestoneName(text) ?? projectQuery });
  }
  if (/\btasks?\b/.test(lower) && isCreate && !isDelete && !isAssign) {
    intents.push({
      type: "add_task",
      projectQuery,
      name: extractTaskName(text),
      due: parseRelativeDate(lower),
      assignee: person?.name ?? ctx.actorName,
    });
  }
  if (/\btasks?\b/.test(lower) && isDelete) {
    intents.push({ type: "delete_task", projectQuery, recordQuery: extractTaskName(text) });
  }
  if (/\btasks?\b/.test(lower) && !isDelete && (isAssign || parseTaskStatus(lower))) {
    intents.push({
      type: isAssign ? "assign_task" : "update_task",
      projectQuery,
      recordQuery: extractTaskName(text),
      assignee: person?.name,
      taskStatus: parseTaskStatus(lower),
    });
  }
  if (/\b(note|comment)\b/.test(lower) && isCreate) {
    intents.push({ type: "add_note", projectQuery, body: extractNote(text) });
  }
  if ((/\b(log|record)\b.+\b(time|hours?)\b/.test(lower) || /\b\d+(?:\.\d+)?\s*(?:h|hrs?|hours?)\b/.test(lower)) && !wantsStatus) {
    intents.push({ type: "log_time", projectQuery, hours: extractHours(lower) });
  }
  if (/\b(ticket|request)\b/.test(lower) && isCreate && !isDelete) {
    intents.push({
      type: "create_ticket",
      projectQuery,
      companyQuery,
      subject: extractTicketSubject(text) ?? "Support request",
      priority: /\burgent\b/.test(lower) ? "Urgent" : /\bhigh\b/.test(lower) ? "High" : "Medium",
      assignee: person?.name ?? ctx.actorName,
    });
  }
  if (/\btickets?\b/.test(lower) && (isAssign || parseTicketStatus(lower))) {
    intents.push({
      type: isAssign ? "assign_ticket" : "update_ticket",
      recordQuery: extractTicketSubject(text),
      assignee: person?.name,
      ticketStatus: parseTicketStatus(lower),
      projectQuery,
    });
  }
  if (/\bcompan(?:y|ies)\b/.test(lower) && isCreate && !isDelete) {
    intents.push({ type: "create_company", name: extractCalled(text, "compan(?:y|ies)") ?? extractQuoted(text) });
  }
  if (/\bcompan(?:y|ies)\b/.test(lower) && /\b(update|rename|set)\b/.test(lower)) {
    intents.push({ type: "update_company", companyQuery, name: extractQuoted(text) });
  }
  if (/\bcontacts?\b/.test(lower) && isCreate) {
    intents.push({
      type: "create_contact",
      name: extractCalled(text, "contacts?") ?? person?.name,
      companyQuery,
    });
  }
  if (/\bcontacts?\b/.test(lower) && /\b(update|rename)\b/.test(lower) && !isCreate) {
    intents.push({
      type: "update_contact",
      recordQuery: person?.name ?? extractCalled(text, "contacts?"),
      name: extractQuoted(text),
      subject: text.match(/\btitle\s+(?:to\s+)?["']?([^"'.]+?)["']?$/i)?.[1],
    });
  }
  if (/\bprojects?\b/.test(lower) && isCreate && !wantsStatus && !/\bstatus\b/.test(lower)) {
    intents.push({
      type: "create_project",
      name: extractCalled(text, "projects?"),
      companyQuery,
      due: parseRelativeDate(lower),
    });
  }
  if (/\bprojects?\b/.test(lower) && isDelete && !/\b(team|member|task|ticket|milestone|contact|user)\b/.test(lower)) {
    intents.push({ type: "delete_project", projectQuery });
  }
  if (/\bprojects?\b/.test(lower) && /\b(update|rename)\b/.test(lower) && !isCreate && !isDelete && !wantsStatus) {
    intents.push({
      type: "update_project",
      projectQuery,
      name: extractQuoted(text) ?? text.match(/\bto\s+["']?([^"'.]+?)["']?$/i)?.[1],
      assignee: person?.name,
    });
  }
  if (isAssign && /\b(team|member|project)\b/.test(lower) && !/\btask\b/.test(lower) && !/\bticket\b/.test(lower)) {
    intents.push({ type: "assign_member", projectQuery, memberQuery: person?.name, assignee: person?.name });
  }
  if (/\b(remove|unassign)\b/.test(lower) && /\b(team|member)\b/.test(lower) && !/\btask\b/.test(lower)) {
    intents.push({ type: "remove_member", projectQuery, memberQuery: person?.name, assignee: person?.name });
  }
  if (/\bexpenses?\b/.test(lower) && isCreate) {
    intents.push({ type: "create_expense", projectQuery, name: extractCalled(text, "expenses?"), amount: extractAmount(lower) });
  }
  if (/\bexpenses?\b/.test(lower) && /\bapprove\b/.test(lower)) {
    intents.push({ type: "approve_expense", recordQuery: extractCalled(text, "expenses?") });
  }
  if (/\b(opportunit(?:y|ies)|deals?|sales)\b/.test(lower) && isCreate) {
    intents.push({
      type: "create_opportunity",
      name: extractCalled(text, "opportunit(?:y|ies)|deals?"),
      companyQuery,
      amount: extractAmount(lower),
      due: parseRelativeDate(lower),
    });
  }
  if (/\b(opportunit(?:y|ies)|deals?)\b/.test(lower) && /\badvance\b/.test(lower)) {
    intents.push({ type: "advance_opportunity", recordQuery: extractCalled(text, "opportunit(?:y|ies)|deals?") });
  }
  if (/\bretainers?\b/.test(lower) && isCreate) {
    intents.push({ type: "create_retainer", name: extractCalled(text, "retainers?"), companyQuery });
  }
  if (/\bretainers?\b/.test(lower) && isDelete) {
    intents.push({ type: "delete_retainer", recordQuery: extractCalled(text, "retainers?") ?? companyQuery });
  }
  if (/\bretainers?\b/.test(lower) && /\b(update|rename)\b/.test(lower) && !isCreate && !isDelete) {
    intents.push({ type: "update_retainer", recordQuery: extractCalled(text, "retainers?"), name: extractQuoted(text) });
  }
  if (/\binvoices?\b/.test(lower) && /\bgenerate\b/.test(lower) && !isEmail) {
    intents.push({ type: "generate_invoice", projectQuery, companyQuery });
  } else if (/\binvoices?\b/.test(lower) && (isCreate || /\bdraft\b/.test(lower)) && !isEmail) {
    intents.push({
      type: "create_invoice",
      companyQuery,
      projectQuery,
      amount: extractAmount(lower),
      name: extractCalled(text, "invoices?"),
    });
  }
  if (/\binvoices?\b/.test(lower) && /\b(update|rename)\b/.test(lower)) {
    intents.push({
      type: "update_invoice",
      recordQuery: extractCalled(text, "invoices?") ?? projectQuery ?? companyQuery,
      name: extractQuoted(text),
    });
  }
  if (/\binvoices?\b/.test(lower) && /\bsend\b/.test(lower)) {
    intents.push({ type: "send_invoice", recordQuery: extractCalled(text, "invoices?") ?? projectQuery ?? companyQuery });
  }
  if (/\binvoices?\b/.test(lower) && /\bpay\b|\bpayment\b/.test(lower)) {
    intents.push({ type: "pay_invoice", recordQuery: extractCalled(text, "invoices?") ?? companyQuery });
  }
  if (/\bideas?\b/.test(lower) && isCreate) {
    intents.push({ type: "create_idea", name: extractCalled(text, "ideas?"), companyQuery, body: extractNote(text) });
  }
  if (/\bideas?\b/.test(lower) && /\badvance\b/.test(lower)) {
    intents.push({ type: "advance_idea", recordQuery: extractCalled(text, "ideas?") });
  }
  if (/\bideas?\b/.test(lower) && /\bconvert\b/.test(lower)) {
    intents.push({ type: "convert_idea", recordQuery: extractCalled(text, "ideas?") });
  }
  if (/\bideas?\b/.test(lower) && /\b(update|rename)\b/.test(lower) && !isCreate) {
    intents.push({ type: "update_idea", recordQuery: extractCalled(text, "ideas?"), name: extractQuoted(text), body: extractNote(text) });
  }
  if (/\bportfolios?\b/.test(lower) && isCreate) {
    intents.push({ type: "create_portfolio", name: extractCalled(text, "portfolios?") });
  }
  if (/\bportfolios?\b/.test(lower) && /\b(update|rename)\b/.test(lower) && !isCreate) {
    intents.push({ type: "update_portfolio", recordQuery: extractCalled(text, "portfolios?"), name: extractQuoted(text) });
  }
  if (/\bobjectives?\b/.test(lower) && isCreate) {
    intents.push({ type: "create_objective", name: extractCalled(text, "objectives?") });
  }
  if (/\bobjectives?\b/.test(lower) && /\b(update|rename)\b/.test(lower) && !isCreate) {
    intents.push({ type: "update_objective", recordQuery: extractCalled(text, "objectives?"), name: extractQuoted(text) });
  }
  if (/\brisks?\b/.test(lower) && isCreate) {
    intents.push({ type: "create_risk", name: extractCalled(text, "risks?"), projectQuery, due: parseRelativeDate(lower) });
  }
  if (/\brisks?\b/.test(lower) && /\b(close|mitigate|reopen|update)\b/.test(lower) && !isCreate) {
    intents.push({
      type: "update_risk",
      recordQuery: extractCalled(text, "risks?"),
      name: /\bclose/.test(lower) ? "Closed" : /\bmitigate/.test(lower) ? "Mitigating" : "Open",
    });
  }
  if (/\bissues?\b/.test(lower) && /\b(resolve|close|update|progress)\b/.test(lower)) {
    intents.push({
      type: "update_issue",
      recordQuery: extractCalled(text, "issues?"),
      name: /\bresolv|\bclose/.test(lower) ? "Resolved" : /\bprogress/.test(lower) ? "In Progress" : "Open",
    });
  }
  if (/\bdependenc/.test(lower) && isCreate) {
    intents.push({ type: "create_dependency", body: text, projectQuery });
  }
  if (/\bgates?\b/.test(lower) && /\b(approve|reject)\b/.test(lower)) {
    intents.push({ type: "decide_gate", recordQuery: extractCalled(text, "gates?"), name: /\breject\b/.test(lower) ? "Rejected" : "Approved" });
  }
  if (/\b(time|timesheet)\b/.test(lower) && /\bapprove\b/.test(lower)) {
    intents.push({ type: "approve_time", assignee: person?.name });
  }
  if (/\b(time|timesheet)\b/.test(lower) && /\breject\b/.test(lower)) {
    intents.push({ type: "reject_time", assignee: person?.name });
  }
  if (/\bsignoff\b/.test(lower) && /\b(request|ask)\b/.test(lower)) {
    intents.push({ type: "request_signoff", projectQuery, name: extractMilestoneName(text) });
  }
  if (/\bsignoff\b/.test(lower) && /\bapprove\b/.test(lower)) {
    intents.push({ type: "approve_signoff", projectQuery, name: extractMilestoneName(text) });
  }
  if (/\b(user|teammate|staff member)\b/.test(lower) && isCreate) {
    const roleWord = lower.match(/\b(admin|pm|staff|finance|leadership|client)\b/)?.[1] as Role | undefined;
    intents.push({
      type: "add_user",
      name: extractCalled(text, "users?|teammates?") ?? person?.name,
      emailTo: extractEmail(text, ctx.people ?? []).to,
      assignee: roleWord ?? "staff",
    });
  }
  if (/\bautomations?\b/.test(lower) && /\brun\b/.test(lower)) {
    intents.push({ type: "run_automation", recordQuery: extractCalled(text, "automations?") ?? extractQuoted(text) });
  }
  if (isEmail) {
    const mail = extractEmail(text, ctx.people ?? []);
    intents.push({
      type: isDraft && !/\bsend\b/.test(lower) ? "draft_email" : "send_email",
      emailTo: mail.to,
      emailSubject: mail.subject,
      emailBody: mail.body,
      projectQuery,
      companyQuery,
      assignee: person?.name,
    });
  }

  return intents;
}

function mergePending(pending: AgentPending | undefined, incoming: AgentIntent[], raw: string, ctx: AgentContext): AgentIntent[] {
  if (!pending?.intents.length) return incoming;
  if (incoming.length) {
    const sameFamily = incoming.every((intent) => pending.intents.some((row) => row.type === intent.type));
    if (!sameFamily) return incoming;
  }
  const fill = incoming[0];
  const mail = extractEmail(raw, ctx.people ?? []);
  const person = extractPerson(raw, ctx.people ?? []);
  return pending.intents.map((intent) => ({
    ...intent,
    ...fill,
    projectQuery: extractProjectQuery(raw, ctx.projects) ?? fill?.projectQuery ?? intent.projectQuery,
    companyQuery: extractCompanyQuery(raw, ctx.companies ?? []) ?? fill?.companyQuery ?? intent.companyQuery,
    status: intent.type === "set_status" ? parseStatus(raw) ?? fill?.status ?? intent.status : intent.status,
    name: fill?.name ?? extractQuoted(raw) ?? intent.name,
    body: fill?.body ?? extractNote(raw) ?? intent.body,
    hours: fill?.hours ?? extractHours(raw) ?? intent.hours,
    assignee: person?.name ?? fill?.assignee ?? intent.assignee,
    emailTo: mail.to ?? fill?.emailTo ?? intent.emailTo,
    emailSubject: mail.subject ?? fill?.emailSubject ?? intent.emailSubject,
    emailBody: mail.body ?? fill?.emailBody ?? intent.emailBody,
    recordQuery: fill?.recordQuery ?? extractQuoted(raw) ?? intent.recordQuery,
  }));
}

function capFor(type: AgentIntentType): Capability | undefined {
  const map: Partial<Record<AgentIntentType, Capability>> = {
    add_milestone: "manage_plan",
    delete_milestone: "manage_plan",
    add_task: "create_task",
    update_task: "edit_assigned_task",
    delete_task: "manage_plan",
    assign_task: "edit_assigned_task",
    add_note: "add_note",
    log_time: "log_time",
    create_ticket: "create_ticket",
    update_ticket: "update_ticket",
    assign_ticket: "update_ticket",
    create_company: "create_company",
    update_company: "edit_company",
    create_contact: "create_contact",
    create_project: "create_project",
    delete_project: "delete_project",
    assign_member: "manage_project_team",
    create_expense: "create_expense",
    approve_expense: "approve_expense",
    create_opportunity: "create_opportunity",
    advance_opportunity: "advance_opportunity",
    create_retainer: "create_retainer",
    delete_retainer: "manage_retainer",
    create_invoice: "create_invoice",
    send_invoice: "manage_invoice",
    pay_invoice: "pay_invoice",
    create_idea: "create_idea",
    advance_idea: "edit_idea",
    convert_idea: "convert_idea",
    create_portfolio: "create_portfolio",
    create_objective: "create_objective",
    create_risk: "create_risk",
    create_dependency: "create_dependency",
    decide_gate: "decide_governance",
    approve_time: "approve_time",
    request_signoff: "approve_signoff",
    approve_signoff: "approve_signoff",
    send_email: "add_note",
    draft_email: "add_note",
    update_contact: "edit_contact",
    update_project: "edit_project",
    update_invoice: "manage_invoice",
    update_retainer: "manage_retainer",
    update_idea: "edit_idea",
    update_portfolio: "edit_portfolio",
    update_objective: "edit_objective",
    update_risk: "update_risk",
    update_issue: "update_risk",
    remove_member: "manage_project_team",
    add_user: "manage_users",
    reject_time: "approve_time",
    generate_invoice: "create_invoice",
    run_automation: "manage_automations",
  };
  return map[type];
}

function projectHref(id: string) {
  return `/app/projects/view/?id=${id}`;
}

function emptyLists(ctx: AgentContext): AgentContext {
  return {
    ...ctx,
    companies: ctx.companies ?? [],
    contacts: ctx.contacts ?? [],
    tasks: ctx.tasks ?? [],
    milestones: ctx.milestones ?? [],
    tickets: ctx.tickets ?? [],
    invoices: ctx.invoices ?? [],
    ideas: ctx.ideas ?? [],
    objectives: ctx.objectives ?? [],
    portfolios: ctx.portfolios ?? [],
    retainers: ctx.retainers ?? [],
    risks: ctx.risks ?? [],
    people: ctx.people ?? [],
    timeEntries: ctx.timeEntries ?? [],
    expenses: ctx.expenses ?? [],
    opportunities: ctx.opportunities ?? [],
    gates: ctx.gates ?? [],
    issues: ctx.issues ?? [],
    allocations: ctx.allocations ?? [],
    automations: ctx.automations ?? [],
  };
}

export function runWorkspaceAgent(raw: string, rawCtx: AgentContext, runner: WorkspaceRunner): AgentAnswer {
  const ctx = emptyLists(rawCtx);
  const incoming = parseWorkspaceIntents(raw, ctx);
  const intents = mergePending(ctx.pending, incoming, raw, ctx);
  if (!intents.length) {
    return { handled: false, text: "", hrefs: [], starters: [] };
  }

  const blocked = intents.find((intent) => {
    if (intent.type === "set_status") return !canChangeProjectStatus(ctx.role ?? undefined, ctx.workflow);
    const cap = capFor(intent.type);
    return cap ? !can(ctx.role, cap) : false;
  });
  if (blocked) {
    return {
      handled: true,
      text: `Your role cannot do that. Ask an Admin if you need the right to ${blocked.type.replace(/_/g, " ")}.`,
      hrefs: [],
      starters: workspaceStarters(ctx.role),
    };
  }

  const needsProject = intents.filter((intent) => PROJECT_REQUIRED.has(intent.type));
  const unresolved = needsProject.filter((intent) => !resolveProject(intent.projectQuery, ctx));
  if (unresolved.length) {
    return {
      handled: true,
      text: `Which project should I use? ${ctx.projects.slice(0, 5).map((project) => project.name).join(", ") || "Open a project first."}`,
      hrefs: ctx.projects.slice(0, 3).map((project) => ({ href: projectHref(project.id), label: project.name })),
      starters: ctx.projects.slice(0, 4).map((project) => project.name),
      pending: { intents },
    };
  }

  const missingStatus = intents.find((intent) => intent.type === "set_status" && !intent.status);
  const statusProject = missingStatus ? resolveProject(missingStatus.projectQuery, ctx) : undefined;
  const ready = intents.filter((intent) => !(intent.type === "set_status" && !intent.status));

  const actions: AgentActionResult[] = [];
  const hrefs: { href: string; label: string }[] = [];
  const lines: string[] = [];
  let lastProject: AgentProject | undefined;
  let createdCompany: AgentCompany | undefined;

  const pushHref = (href: string, label: string) => {
    if (!hrefs.some((item) => item.href === href)) hrefs.push({ href, label });
  };

  const done = (ok: boolean, label: string, line: string) => {
    actions.push({ ok, label });
    lines.push(line);
  };

  for (const intent of ready) {
    const project = resolveProject(intent.projectQuery, ctx);
    if (project) {
      lastProject = project;
      pushHref(projectHref(project.id), `Open ${project.name}`);
    }
    const company =
      resolveNamed(intent.companyQuery, createdCompany ? [createdCompany, ...ctx.companies] : ctx.companies) ??
      createdCompany ??
      (project ? ctx.companies.find((row) => row.id === project.companyId) : undefined);

    if (intent.type === "set_status" && intent.status && project) {
      const next = normalizeProjectStatus(intent.status);
      if (project.status === next) {
        done(true, `${project.name} is already ${next}`, `${project.name} is already ${next}.`);
        continue;
      }
      const ok = runner.setProjectStatus(project.id, next);
      done(ok, ok ? `Status set to ${next}` : `Could not move ${project.name}`, ok ? `I set ${project.name} from ${project.status} to ${next}.` : `I could not move ${project.name} to ${next}.`);
    }

    if (intent.type === "add_milestone" && project) {
      const name = intent.name?.trim() || "New milestone";
      const due = intent.due ?? addDays(todayIso(), 14);
      const id = runner.createMilestone(project.id, name, due);
      done(Boolean(id), id ? `Added ${name}` : "Could not add the milestone", id ? `I added milestone ${name} on ${project.name}, due ${due}.` : "I could not add that milestone.");
    }

    if (intent.type === "delete_milestone") {
      const milestone = resolveNamed(
        intent.recordQuery ?? intent.name,
        ctx.milestones.filter((row) => !project || row.projectId === project.id),
      );
      if (!milestone) {
        done(false, "Which milestone?", "Which milestone should I delete?");
        continue;
      }
      runner.deleteMilestone(milestone.id);
      done(true, `Deleted ${milestone.name}`, `I deleted milestone ${milestone.name}.`);
    }

    if (intent.type === "add_task" && project) {
      const name = intent.name?.trim() || "New task";
      const due = intent.due ?? addDays(todayIso(), 7);
      const id = runner.createTask({ name, projectId: project.id, assignee: intent.assignee ?? ctx.actorName, due });
      done(Boolean(id), id ? `Added task ${name}` : "Could not add the task", id ? `I added task ${name} on ${project.name}, due ${due}.` : "I could not add that task.");
    }

    if (intent.type === "update_task" || intent.type === "assign_task" || intent.type === "delete_task") {
      const task = resolveNamed(intent.recordQuery ?? intent.name, ctx.tasks.filter((row) => !project || row.projectId === project.id));
      if (!task) {
        done(false, "Which task?", "Which task should I use? Name it in your next message.");
        continue;
      }
      if (intent.type === "delete_task") {
        runner.deleteTask(task.id);
        done(true, `Deleted ${task.name}`, `I deleted task ${task.name}.`);
      } else {
        runner.updateTask(task.id, { status: intent.taskStatus, assignee: intent.assignee });
        done(true, intent.assignee ? `Assigned ${task.name}` : `Updated ${task.name}`, intent.assignee ? `I assigned ${task.name} to ${intent.assignee}.` : `I updated task ${task.name}.`);
      }
    }

    if (intent.type === "add_note" && project) {
      const body = intent.body?.trim() || raw.trim();
      runner.addProjectNote(project.id, { author: ctx.actorName, body, visibility: "internal" });
      done(true, "Note added", `I added a note on ${project.name}.`);
    }

    if (intent.type === "log_time" && project) {
      const hours = intent.hours ?? 1;
      const id = runner.createTimeEntry({
        userName: ctx.actorName,
        projectId: project.id,
        date: todayIso(),
        hours,
        billable: true,
        note: "Logged from workspace AI",
      });
      done(Boolean(id), id ? `Logged ${hours}h` : "Could not log time", id ? `I logged ${hours}h on ${project.name}.` : "I could not log that time.");
      pushHref("/app/timesheets", "Open Timesheets");
    }

    if (intent.type === "create_ticket") {
      const host = company ?? (project ? { id: project.companyId, name: project.companyName, status: "Active" } : undefined);
      if (!host) {
        done(false, "Which company?", "Which company should this ticket sit on?");
        continue;
      }
      const id = runner.createTicket({
        subject: intent.subject ?? "Support request",
        companyId: host.id,
        priority: intent.priority ?? "Medium",
        assignee: intent.assignee ?? ctx.actorName,
        projectId: project?.id,
      });
      done(Boolean(id), id ? "Ticket created" : "Could not create the ticket", id ? `I raised a ticket on ${host.name}.` : "I could not create that ticket.");
      if (id) pushHref(`/app/tickets/view/?id=${id}`, "Open ticket");
    }

    if (intent.type === "update_ticket" || intent.type === "assign_ticket") {
      const ticket = resolveNamed(intent.recordQuery ?? intent.subject, ctx.tickets.map((row) => ({ id: row.id, name: row.subject })));
      if (!ticket) {
        done(false, "Which ticket?", "Which ticket should I update?");
        continue;
      }
      if (intent.ticketStatus) runner.updateTicketStatus(ticket.id, intent.ticketStatus);
      if (intent.assignee) runner.updateTicket(ticket.id, { assignee: intent.assignee });
      done(true, "Ticket updated", `I updated ticket ${ticket.name}.`);
      pushHref(`/app/tickets/view/?id=${ticket.id}`, "Open ticket");
    }

    if (intent.type === "create_company") {
      const name = intent.name?.trim() || "New company";
      const id = runner.createCompany({
        name,
        status: "Active",
        accountManager: ctx.actorName,
        industry: "Services",
        billingTerms: "Net 30",
      });
      done(Boolean(id), id ? `Created ${name}` : "Could not create the company", id ? `I created company ${name}.` : "I could not create that company.");
      if (id) {
        createdCompany = { id, name, status: "Active" };
        pushHref(`/app/companies/view/?id=${id}`, `Open ${name}`);
      }
    }

    if (intent.type === "update_company") {
      const target = resolveNamed(intent.companyQuery ?? intent.name, ctx.companies);
      if (!target) {
        done(false, "Which company?", "Which company should I update?");
        continue;
      }
      runner.updateCompany(target.id, { name: intent.name });
      done(true, `Updated ${target.name}`, `I updated ${target.name}.`);
    }

    if (intent.type === "create_contact") {
      const host = company ?? ctx.companies.find((row) => row.id === ctx.focusCompanyId);
      if (!host) {
        done(false, "Which company?", "Which company should this contact belong to?");
        continue;
      }
      const name = intent.name?.trim() || "New contact";
      const email = `${name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@${host.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
      const id = runner.createContact({
        name,
        companyId: host.id,
        companyName: host.name,
        title: "Contact",
        email,
        portal: "Not Invited",
      });
      done(Boolean(id), id ? `Created ${name}` : "Could not create the contact", id ? `I added contact ${name} at ${host.name}.` : "I could not add that contact.");
      pushHref("/app/contacts", "Open Contacts");
    }

    if (intent.type === "create_project") {
      const host = company ?? ctx.companies.find((row) => row.id === ctx.focusCompanyId) ?? ctx.companies[0];
      if (!host) {
        done(false, "Which company?", "Which company should own the project?");
        continue;
      }
      const name = intent.name?.trim() || "New project";
      const id = runner.createProject({
        name,
        companyId: host.id,
        manager: ctx.actorName,
        due: intent.due ?? addDays(todayIso(), 30),
        budgetHours: 80,
      });
      done(Boolean(id), id ? `Created ${name}` : "Could not create the project", id ? `I created project ${name} for ${host.name}.` : "I could not create that project.");
      if (id) pushHref(projectHref(id), `Open ${name}`);
    }

    if (intent.type === "delete_project" && project) {
      runner.deleteProject(project.id);
      done(true, `Deleted ${project.name}`, `I deleted project ${project.name}.`);
    }

    if (intent.type === "assign_member" && project) {
      const member = (ctx.people ?? []).find((person) => person.kind === "team" && person.name === (intent.assignee ?? intent.memberQuery))
        ?? extractPerson(intent.assignee ?? intent.memberQuery ?? raw, ctx.people);
      if (!member || member.kind !== "team") {
        done(false, "Which person?", "Which teammate should I assign?");
        continue;
      }
      const id = runner.addProjectMember({
        projectId: project.id,
        memberId: member.id,
        projectRole: "Consultant",
        responsibility: "Assigned by workspace AI",
        allocationPct: 25,
      });
      done(Boolean(id), id ? `Assigned ${member.name}` : "Could not assign", id ? `I added ${member.name} to ${project.name}.` : `${member.name} may already be on that team.`);
    }

    if (intent.type === "create_expense" && project) {
      const id = runner.createExpense({
        vendor: intent.name ?? "Vendor",
        projectId: project.id,
        amount: intent.amount ?? 250,
        note: intent.body ?? "Added by workspace AI",
      });
      done(Boolean(id), id ? "Expense added" : "Could not add the expense", id ? `I logged an expense on ${project.name}.` : "I could not add that expense.");
      pushHref("/app/billing", "Open Billing");
    }

    if (intent.type === "approve_expense") {
      const expense = ctx.expenses.find((row) => scoreName(row.vendor, intent.recordQuery ?? raw) >= 12) ?? ctx.expenses.find((row) => row.status === "Pending");
      if (!expense) {
        done(false, "No expense", "I could not find a pending expense.");
        continue;
      }
      runner.approveExpense(expense.id);
      done(true, "Expense approved", `I approved the expense from ${expense.vendor}.`);
    }

    if (intent.type === "create_opportunity") {
      const host = company ?? ctx.companies[0];
      if (!host) {
        done(false, "Which company?", "Which company is this opportunity for?");
        continue;
      }
      const name = intent.name ?? "New opportunity";
      const id = runner.createOpportunity({
        name,
        companyId: host.id,
        amount: intent.amount ?? 10000,
        close: intent.due ?? addDays(todayIso(), 30),
      });
      done(Boolean(id), id ? `Created ${name}` : "Could not create the opportunity", id ? `I created opportunity ${name}.` : "I could not create that opportunity.");
      pushHref("/app/sales", "Open Sales");
    }

    if (intent.type === "advance_opportunity") {
      const deal = resolveNamed(intent.recordQuery ?? intent.name, ctx.opportunities);
      if (!deal) {
        done(false, "Which opportunity?", "Which opportunity should I advance?");
        continue;
      }
      runner.advanceOpportunity(deal.id);
      done(true, `Advanced ${deal.name}`, `I advanced ${deal.name}.`);
    }

    if (intent.type === "create_retainer") {
      const host = company ?? ctx.companies[0];
      if (!host) {
        done(false, "Which company?", "Which company is this retainer for?");
        continue;
      }
      const name = intent.name ?? `${host.name} retainer`;
      const id = runner.createRetainer({
        name,
        companyId: host.id,
        type: "Monthly T&M",
        manager: ctx.actorName,
        budgetHours: 20,
        expires: addDays(todayIso(), 90),
      });
      done(Boolean(id), id ? `Created ${name}` : "Could not create the retainer", id ? `I created retainer ${name}.` : "I could not create that retainer.");
      pushHref("/app/retainers", "Open Retainers");
    }

    if (intent.type === "delete_retainer") {
      const retainer = resolveNamed(intent.recordQuery ?? intent.name, ctx.retainers);
      if (!retainer) {
        done(false, "Which retainer?", "Which retainer should I delete?");
        continue;
      }
      runner.deleteRetainer(retainer.id);
      done(true, `Deleted ${retainer.name}`, `I deleted retainer ${retainer.name}.`);
    }

    if (intent.type === "create_invoice") {
      const host = company ?? (project ? { id: project.companyId, name: project.companyName, status: "Active" } : undefined);
      if (!host) {
        done(false, "Which company?", "Which company should I invoice?");
        continue;
      }
      const id = runner.createInvoiceDraft(host.id, {
        projectId: project?.id,
        amount: intent.amount,
        description: intent.name ?? intent.body,
      });
      done(Boolean(id), id ? "Invoice drafted" : "Could not draft the invoice", id ? `I drafted an invoice for ${host.name}.` : "I could not draft that invoice.");
      if (id) pushHref(`/app/billing/view/?id=${id}`, "Open invoice");
    }

    if (intent.type === "send_invoice" || intent.type === "pay_invoice") {
      const invoice = ctx.invoices.find((row) => scoreName(`${row.number} ${row.name}`, intent.recordQuery ?? raw) >= 12) ?? ctx.invoices[0];
      if (!invoice) {
        done(false, "Which invoice?", "Which invoice should I use?");
        continue;
      }
      if (intent.type === "send_invoice") runner.sendInvoice(invoice.id);
      else runner.payInvoice(invoice.id);
      done(true, intent.type === "send_invoice" ? "Invoice sent" : "Payment recorded", intent.type === "send_invoice" ? `I sent ${invoice.number}.` : `I recorded payment on ${invoice.number}.`);
      pushHref(`/app/billing/view/?id=${invoice.id}`, "Open invoice");
    }

    if (intent.type === "create_idea") {
      const name = intent.name ?? "New idea";
      const id = runner.createIdea({
        name,
        summary: intent.body ?? name,
        submitter: ctx.actorName,
        requestedBudget: intent.amount ?? 15000,
        companyId: company?.id,
      });
      done(Boolean(id), id ? `Created ${name}` : "Could not create the idea", id ? `I submitted idea ${name}.` : "I could not submit that idea.");
      pushHref("/app/ideas", "Open Ideas");
    }

    if (intent.type === "advance_idea" || intent.type === "convert_idea") {
      const idea = resolveNamed(intent.recordQuery ?? intent.name, ctx.ideas);
      if (!idea) {
        done(false, "Which idea?", "Which idea should I use?");
        continue;
      }
      if (intent.type === "advance_idea") runner.advanceIdea(idea.id);
      else runner.convertIdea(idea.id);
      done(true, intent.type === "convert_idea" ? `Converted ${idea.name}` : `Advanced ${idea.name}`, `I ${intent.type === "convert_idea" ? "converted" : "advanced"} ${idea.name}.`);
    }

    if (intent.type === "create_portfolio") {
      const name = intent.name ?? "New portfolio";
      const id = runner.createPortfolio({
        name,
        owner: ctx.actorName,
        theme: "Delivery",
        budget: intent.amount ?? 100000,
        description: intent.body ?? name,
      });
      done(Boolean(id), id ? `Created ${name}` : "Could not create the portfolio", id ? `I created portfolio ${name}.` : "I could not create that portfolio.");
      pushHref("/app/portfolios", "Open Portfolios");
    }

    if (intent.type === "create_objective") {
      const name = intent.name ?? "New objective";
      const id = runner.createObjective({
        name,
        owner: ctx.actorName,
        horizon: "2026",
        target: "Defined in workspace AI",
        description: intent.body ?? name,
      });
      done(Boolean(id), id ? `Created ${name}` : "Could not create the objective", id ? `I created objective ${name}.` : "I could not create that objective.");
      pushHref("/app/strategy", "Open Strategy");
    }

    if (intent.type === "create_risk") {
      const name = intent.name ?? "New risk";
      const id = runner.createRisk({
        title: name,
        owner: ctx.actorName,
        projectId: project?.id,
        probability: "Medium",
        impact: "Medium",
        mitigation: intent.body ?? "Mitigation to be detailed",
        due: intent.due ?? addDays(todayIso(), 14),
      });
      done(Boolean(id), id ? `Logged ${name}` : "Could not log the risk", id ? `I logged risk ${name}.` : "I could not log that risk.");
      pushHref("/app/risks", "Open Risks");
    }

    if (intent.type === "create_dependency") {
      if (ctx.projects.length < 2) {
        done(false, "Need two projects", "I need two projects to record a dependency.");
        continue;
      }
      const id = runner.createDependency({
        predecessorProjectId: ctx.projects[0].id,
        successorProjectId: (project ?? ctx.projects[1]).id,
        type: "Finish to Start",
        note: intent.body ?? "Added by workspace AI",
      });
      done(Boolean(id), id ? "Dependency added" : "Could not add the dependency", id ? "I recorded a cross-project dependency." : "I could not record that dependency.");
      pushHref("/app/dependencies", "Open Dependencies");
    }

    if (intent.type === "decide_gate") {
      const gate = resolveNamed(intent.recordQuery, ctx.gates) ?? ctx.gates[0];
      if (!gate) {
        done(false, "Which gate?", "Which gate should I decide?");
        continue;
      }
      runner.decideGate(gate.id, intent.name === "Rejected" ? "Rejected" : "Approved");
      done(true, `Gate ${intent.name ?? "Approved"}`, `I ${intent.name === "Rejected" ? "rejected" : "approved"} ${gate.name}.`);
      pushHref("/app/governance", "Open Governance");
    }

    if (intent.type === "approve_time") {
      const entry = ctx.timeEntries.find((row) => row.status === "Submitted") ?? ctx.timeEntries[0];
      if (!entry) {
        done(false, "No time", "I could not find a timesheet line to approve.");
        continue;
      }
      runner.approveTimeEntry(entry.id);
      done(true, "Time approved", `I approved time for ${entry.userName}.`);
      pushHref("/app/timesheets", "Open Timesheets");
    }

    if (intent.type === "request_signoff" && project) {
      runner.requestSignoff(project.id, intent.name ?? "Phase");
      done(true, "Signoff requested", `I requested signoff on ${project.name}.`);
    }

    if (intent.type === "approve_signoff") {
      const milestone = resolveNamed(
        intent.name,
        ctx.milestones.filter((row) => !project || row.projectId === project.id),
      ) ?? ctx.milestones.find((row) => (!project || row.projectId === project.id));
      if (!milestone) {
        done(false, "Which milestone?", "Which milestone signoff should I approve?");
        continue;
      }
      runner.approveSignoff(milestone.id);
      done(true, `Approved ${milestone.name}`, `I approved signoff on ${milestone.name}.`);
    }

    if (intent.type === "update_contact") {
      const contact = resolveNamed(intent.recordQuery ?? intent.name, ctx.contacts);
      if (!contact) {
        done(false, "Which contact?", "Which contact should I update?");
        continue;
      }
      runner.updateContact(contact.id, { name: intent.name, title: intent.subject });
      done(true, `Updated ${contact.name}`, `I updated ${contact.name}.`);
      pushHref("/app/contacts", "Open Contacts");
    }

    if (intent.type === "update_project" && project) {
      runner.updateProject(project.id, { name: intent.name, manager: intent.assignee });
      done(true, `Updated ${project.name}`, `I updated ${intent.name ?? project.name}.`);
    }

    if (intent.type === "update_invoice") {
      const invoice = ctx.invoices.find((row) => scoreName(`${row.number} ${row.name}`, intent.recordQuery ?? raw) >= 12) ?? ctx.invoices[0];
      if (!invoice) {
        done(false, "Which invoice?", "Which invoice should I update?");
        continue;
      }
      runner.updateInvoice(invoice.id, { title: intent.name, description: intent.body });
      done(true, `Updated ${invoice.number}`, `I updated ${invoice.number}.`);
      pushHref(`/app/billing/view/?id=${invoice.id}`, "Open invoice");
    }

    if (intent.type === "update_retainer") {
      const retainer = resolveNamed(intent.recordQuery ?? intent.name, ctx.retainers);
      if (!retainer) {
        done(false, "Which retainer?", "Which retainer should I update?");
        continue;
      }
      runner.updateRetainer(retainer.id, { name: intent.name });
      done(true, `Updated ${retainer.name}`, `I updated ${intent.name ?? retainer.name}.`);
    }

    if (intent.type === "update_idea") {
      const idea = resolveNamed(intent.recordQuery ?? intent.name, ctx.ideas);
      if (!idea) {
        done(false, "Which idea?", "Which idea should I update?");
        continue;
      }
      runner.updateIdea(idea.id, { name: intent.name, summary: intent.body });
      done(true, `Updated ${idea.name}`, `I updated ${intent.name ?? idea.name}.`);
    }

    if (intent.type === "update_portfolio") {
      const portfolio = resolveNamed(intent.recordQuery ?? intent.name, ctx.portfolios);
      if (!portfolio) {
        done(false, "Which portfolio?", "Which portfolio should I update?");
        continue;
      }
      runner.updatePortfolio(portfolio.id, { name: intent.name, description: intent.body });
      done(true, `Updated ${portfolio.name}`, `I updated ${intent.name ?? portfolio.name}.`);
    }

    if (intent.type === "update_objective") {
      const objective = resolveNamed(intent.recordQuery ?? intent.name, ctx.objectives);
      if (!objective) {
        done(false, "Which objective?", "Which objective should I update?");
        continue;
      }
      runner.updateObjective(objective.id, { name: intent.name, target: intent.body });
      done(true, `Updated ${objective.name}`, `I updated ${intent.name ?? objective.name}.`);
    }

    if (intent.type === "update_risk") {
      const risk = resolveNamed(intent.recordQuery ?? intent.name, ctx.risks);
      if (!risk) {
        done(false, "Which risk?", "Which risk should I update?");
        continue;
      }
      const status = intent.name === "Closed" || intent.name === "Mitigating" || intent.name === "Open" ? intent.name : "Closed";
      runner.updateRiskStatus(risk.id, status);
      done(true, `Risk ${status}`, `I marked ${risk.name} as ${status}.`);
    }

    if (intent.type === "update_issue") {
      const issue = resolveNamed(intent.recordQuery ?? intent.name, ctx.issues);
      if (!issue) {
        done(false, "Which issue?", "Which issue should I update?");
        continue;
      }
      const status = intent.name === "Resolved" || intent.name === "In Progress" || intent.name === "Open" ? intent.name : "Resolved";
      runner.updateIssueStatus(issue.id, status);
      done(true, `Issue ${status}`, `I marked ${issue.name} as ${status}.`);
    }

    if (intent.type === "remove_member" && project) {
      const member = extractPerson(intent.assignee ?? intent.memberQuery ?? raw, ctx.people);
      const allocation = ctx.allocations.find(
        (row) => row.projectId === project.id && (!member || row.memberName === member.name),
      );
      if (!allocation) {
        done(false, "Which teammate?", "Which teammate should I remove from the project?");
        continue;
      }
      runner.removeProjectMember(allocation.id);
      done(true, `Removed ${allocation.memberName}`, `I removed ${allocation.memberName} from ${project.name}.`);
    }

    if (intent.type === "add_user") {
      const name = intent.name?.trim() || "New teammate";
      const email = intent.emailTo ?? `${name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@dillonmorgan.com`;
      const role = (["admin", "pm", "staff", "finance", "leadership", "client"].includes(intent.assignee ?? "")
        ? intent.assignee
        : "staff") as Role;
      const id = runner.addTeamMember({ name, email, role, title: "Teammate" });
      done(Boolean(id), id ? `Added ${name}` : "Could not add the user", id ? `I added user ${name} as ${role}.` : "I could not add that user.");
      pushHref("/app/users", "Open Users");
    }

    if (intent.type === "reject_time") {
      const entry =
        ctx.timeEntries.find((row) => intent.assignee && row.userName === intent.assignee) ??
        ctx.timeEntries.find((row) => row.status === "Submitted") ??
        ctx.timeEntries[0];
      if (!entry) {
        done(false, "No time", "I could not find a timesheet line to reject.");
        continue;
      }
      runner.rejectTimeEntry(entry.id);
      done(true, "Time rejected", `I rejected time for ${entry.userName}.`);
      pushHref("/app/timesheets", "Open Timesheets");
    }

    if (intent.type === "generate_invoice" && project) {
      const id = runner.generateProjectInvoice(project.id);
      done(Boolean(id), id ? "Invoice generated" : "Could not generate the invoice", id ? `I generated an invoice from ${project.name}.` : "I could not generate that invoice.");
      if (id) pushHref(`/app/billing/view/?id=${id}`, "Open invoice");
    }

    if (intent.type === "run_automation") {
      const rule = resolveNamed(intent.recordQuery ?? intent.name, ctx.automations) ?? ctx.automations[0];
      if (!rule) {
        done(false, "Which automation?", "Which automation should I run?");
        continue;
      }
      runner.runAutomation(rule.id);
      done(true, `Ran ${rule.name}`, `I ran automation ${rule.name}.`);
      pushHref("/app/automations", "Open Automations");
    }

    if (intent.type === "send_email" || intent.type === "draft_email") {
      const to = intent.emailTo ?? ctx.people[0]?.email ?? ctx.actorEmail ?? "ops@dillonmorgan.com";
      const subject = intent.emailSubject ?? (project ? `Update on ${project.name}` : "DMC PMO update");
      const body = intent.emailBody ?? (project ? `${ctx.actorName} asked me to write about ${project.name}.` : raw);
      const id = runner.queueEmail(to, subject, body, intent.type === "draft_email" ? "Queued" : "Sent");
      done(Boolean(id), intent.type === "draft_email" ? "Email drafted" : "Email sent", intent.type === "draft_email" ? `I drafted an email to ${to} in the outbox.` : `I sent an email to ${to}.`);
      pushHref("/app/automations", "Open email outbox");
    }
  }

  if (missingStatus && statusProject && ready.filter((intent) => intent.type === "set_status").length === 0) {
    const options = allowedProjectTransitions(statusProject.status, ctx.workflow);
    lines.push(`${statusProject.name} is ${statusProject.status}. Which status should I set? ${options.join(", ") || "No allowed moves."}`);
    return {
      handled: true,
      text: lines.join("\n\n"),
      hrefs,
      starters: options.slice(0, 4),
      actions,
      pending: {
        intents: [{ type: "set_status", projectId: statusProject.id, projectQuery: statusProject.name }],
      },
    };
  }

  if (!lines.length) {
    return {
      handled: true,
      text: "I understood the request but still need a record name, company, or project. Try: Create a company called Northwind, Draft an email to Dana about warehouse, or Delete the Review signoff task.",
      hrefs: [],
      starters: workspaceStarters(ctx.role),
      pending: { intents },
    };
  }

  return {
    handled: true,
    text: lines.join("\n\n"),
    hrefs,
    starters: workspaceStarters(ctx.role),
    actions,
  };
}

export function workspaceStarters(role?: Role | null): string[] {
  if (role === "staff") return ["Log 1 hour on warehouse", "Add a note on warehouse: blockers for Friday", "Draft an email to M. Doyle about my task"];
  if (role === "finance") return ["Draft an invoice for Cascade", "Approve the pending expense", "Email billing@client.com about INV-2291"];
  if (role === "client") return ["How do I raise a ticket?", "Where are my invoices?"];
  return [
    "Set warehouse to On Hold and add a Go-live milestone",
    "Create a company called Northwind and add a contact Dana",
    "Draft an email to Dana Kessler about warehouse status",
    "Assign S. Cho to the warehouse project team",
  ];
}

export function stubRunner(overrides: Partial<WorkspaceRunner> = {}): WorkspaceRunner {
  const noop = () => undefined as never;
  return {
    setProjectStatus: () => false,
    createMilestone: () => "",
    deleteMilestone: noop,
    createTask: () => "",
    updateTask: noop,
    deleteTask: noop,
    addProjectNote: noop,
    createTimeEntry: () => "",
    createTicket: () => "",
    updateTicketStatus: noop,
    updateTicket: noop,
    createCompany: () => "",
    updateCompany: noop,
    createContact: () => "",
    createProject: () => "",
    deleteProject: noop,
    addProjectMember: () => "",
    createExpense: () => "",
    approveExpense: noop,
    createOpportunity: () => "",
    advanceOpportunity: noop,
    createRetainer: () => "",
    deleteRetainer: noop,
    createInvoiceDraft: () => "",
    sendInvoice: noop,
    payInvoice: noop,
    createIdea: () => "",
    advanceIdea: noop,
    convertIdea: noop,
    createPortfolio: () => "",
    createObjective: () => "",
    createRisk: () => "",
    createDependency: () => "",
    decideGate: noop,
    approveTimeEntry: noop,
    requestSignoff: noop,
    approveSignoff: noop,
    updateContact: noop,
    updateProject: noop,
    updateInvoice: noop,
    updateRetainer: noop,
    updateIdea: noop,
    updatePortfolio: noop,
    updateObjective: noop,
    updateRiskStatus: noop,
    updateIssueStatus: noop,
    removeProjectMember: noop,
    addTeamMember: () => "",
    rejectTimeEntry: noop,
    generateProjectInvoice: () => "",
    runAutomation: noop,
    queueEmail: () => "",
    ...overrides,
  };
}
