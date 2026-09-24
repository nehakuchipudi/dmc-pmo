import { can, type Capability } from "./rbac";
import { allowedProjectTransitions, canChangeProjectStatus, normalizeProjectStatus } from "./project-lifecycle";
import { addDays, todayIso } from "./timesheet";
import type { ProjectStatus, ProjectWorkflow, Role, TicketPriority } from "./types";

export type AgentIntentType = "set_status" | "add_milestone" | "add_task" | "add_note" | "log_time" | "create_ticket";

export interface AgentIntent {
  type: AgentIntentType;
  projectQuery?: string;
  projectId?: string;
  status?: ProjectStatus;
  name?: string;
  due?: string;
  body?: string;
  hours?: number;
  assignee?: string;
  priority?: TicketPriority;
  subject?: string;
}

export interface AgentProject {
  id: string;
  name: string;
  status: ProjectStatus;
  companyId: string;
  companyName: string;
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
  projects: AgentProject[];
  focusCompanyId?: string | null;
  routeProjectId?: string | null;
  lastProjectId?: string | null;
  pending?: AgentPending;
  workflow: ProjectWorkflow;
}

export interface WorkspaceRunner {
  setProjectStatus: (projectId: string, status: ProjectStatus) => boolean;
  createMilestone: (projectId: string, name: string, due: string) => string;
  createTask: (input: { name: string; projectId: string; assignee: string; due: string }) => string;
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
}

const ACTION_HINT =
  /\b(update|change|set|move|mark|make|add|create|log|raise|open|put|please|can you|could you)\b/;
const QUESTION_HINT = /^(how|what|where|why|explain|tell me|who)\b/;

const STATUS_ALIASES: { match: RegExp; status: ProjectStatus }[] = [
  { match: /\bat\s+risk\b|\brisk\b|\boverdue\b/, status: "At Risk" },
  { match: /\bon\s+hold\b|\bhold\b|\bpaused?\b|\bpause\b/, status: "On Hold" },
  { match: /\bcomplet(?:e|ed)\b|\bdone\b|\bfinished\b|\bclosed\b/, status: "Completed" },
  { match: /\bcancel(?:led|ed)?\b/, status: "Cancelled" },
  { match: /\bplanning\b|\bplanned\b/, status: "Planning" },
  { match: /\bdraft\b/, status: "Draft" },
  { match: /\bactive\b|\bon\s+track\b/, status: "Active" },
];

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

const PROJECT_STOP = new Set([
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
]);

export function scoreProjectName(name: string, query: string) {
  const hay = name.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  if (hay === q) return 100;
  if (q.length > 3 && hay.includes(q)) return 70 + Math.min(q.length, 20);
  const words = q.split(/\s+/).filter((word) => word.length > 3 && !PROJECT_STOP.has(word));
  let score = 0;
  for (const word of words) {
    if (new RegExp(`\\b${word}\\b`).test(hay) || hay.includes(word)) score += 16;
  }
  return score;
}

export function resolveProject(query: string | undefined, ctx: AgentContext): AgentProject | undefined {
  if (query) {
    const ranked = ctx.projects
      .map((project) => ({ project, score: scoreProjectName(project.name, query) }))
      .sort((a, b) => b.score - a.score);
    if (ranked[0] && ranked[0].score >= 12) return ranked[0].project;
  }
  if (ctx.routeProjectId) {
    const route = ctx.projects.find((project) => project.id === ctx.routeProjectId);
    if (route) return route;
  }
  if (ctx.lastProjectId) {
    const last = ctx.projects.find((project) => project.id === ctx.lastProjectId);
    if (last) return last;
  }
  if (ctx.focusCompanyId) {
    const scoped = ctx.projects.filter((project) => project.companyId === ctx.focusCompanyId);
    if (scoped.length === 1) return scoped[0];
  }
  if (ctx.projects.length === 1) return ctx.projects[0];
  return undefined;
}

function extractProjectQuery(raw: string, projects: AgentProject[]): string | undefined {
  const ranked = projects
    .map((project) => ({ project, score: scoreProjectName(project.name, raw) }))
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
    if (value.length > 2 && !PROJECT_STOP.has(value.toLowerCase()) && !/^(me|us|it|them)$/i.test(value)) return value;
  }
  return undefined;
}

function extractMilestoneName(raw: string): string | undefined {
  const named = raw.match(
    /(?:milestone|phase|workstream)\s+(?:called|named|titled)\s+["']?([^"'.]+?)["']?(?=\s+due|\s+on\b|\s+for\b|\s+and\b|[.,]|$)/i,
  );
  if (named) return clean(named[1]);
  const ahead = raw.match(
    /(?:add|create)\s+(?:a\s+)?(?:new\s+)?["']?([^"']+?)["']?\s+(?:milestone|phase)\b/i,
  );
  if (ahead) {
    const name = clean(ahead[1]).replace(/^(a|an|the|new)\s+/i, "");
    if (name && !/^(milestone|phase|workstream|new)$/i.test(name)) return name;
  }
  return undefined;
}

function extractTaskName(raw: string): string | undefined {
  const named = raw.match(/(?:task|to-?do)\s+(?:called|named)\s+["']?([^"'.]+?)["']?(?=\s+due|\s+on\b|\s+and\b|[.,]|$)/i);
  if (named) return clean(named[1]);
  const ahead = raw.match(/(?:add|create|new)\s+(?:a\s+)?(?:new\s+)?["']?([^"']+?)["']?\s+task\b/i);
  if (ahead) {
    const name = clean(ahead[1]).replace(/^(a|an|the|new)\s+/i, "");
    if (name && !/^task$/i.test(name)) return name;
  }
  return undefined;
}

function extractNote(raw: string): string | undefined {
  const hit = raw.match(/(?:note|comment)\s*(?:that|:|-)?\s+["']?(.+?)["']?$/i);
  if (hit) return clean(hit[1].replace(/^(saying|that)\s+/i, ""));
  return undefined;
}

function extractHours(raw: string): number | undefined {
  const hit = raw.match(/\b(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b/i);
  if (hit) return Number(hit[1]);
  return undefined;
}

function extractTicketSubject(raw: string): string | undefined {
  const hit = raw.match(/(?:ticket|request)\s+(?:for|about|called)?\s*["']?([^"'.]+?)["']?$/i);
  if (hit) return clean(hit[1]);
  return undefined;
}

export function looksLikeWorkspaceAction(raw: string, pending?: AgentPending): boolean {
  const text = raw.trim().toLowerCase();
  if (!text) return false;
  if (pending?.intents.length) return true;
  if (QUESTION_HINT.test(text) && !/\bplease\b/.test(text)) return false;
  const wantsWrite =
    /\b(status|milestone|phase|workstream|task|note|comment|ticket|time|hours?|invoice)\b/.test(text) && ACTION_HINT.test(text);
  return wantsWrite;
}

export function parseWorkspaceIntents(raw: string, ctx: AgentContext): AgentIntent[] {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const projectQuery = extractProjectQuery(lower, ctx.projects);
  const intents: AgentIntent[] = [];

  const wantsStatus = /\bstatus\b/.test(lower) || /\b(set|move|mark|make)\b.+\b(active|hold|risk|draft|planning|complete|cancel)/.test(lower);
  const wantsMilestone = /\b(milestone|phase|workstream)\b/.test(lower) && /\b(add|create|new)\b/.test(lower);
  const wantsTask = /\btasks?\b/.test(lower) && /\b(add|create|new)\b/.test(lower);
  const wantsNote = /\b(note|comment)\b/.test(lower) && /\b(add|create|leave|post)\b/.test(lower);
  const wantsTime = /\b(log|record)\b.+\b(time|hours?)\b/.test(lower) || /\b\d+(?:\.\d+)?\s*(?:h|hrs?|hours?)\b/.test(lower);
  const wantsTicket = /\b(ticket|request)\b/.test(lower) && /\b(add|create|raise|open|new)\b/.test(lower);

  if (wantsStatus) {
    intents.push({
      type: "set_status",
      projectQuery,
      status: parseStatus(lower),
    });
  }
  if (wantsMilestone) {
    intents.push({
      type: "add_milestone",
      projectQuery,
      name: extractMilestoneName(text),
      due: parseRelativeDate(lower),
    });
  }
  if (wantsTask) {
    intents.push({
      type: "add_task",
      projectQuery,
      name: extractTaskName(text),
      due: parseRelativeDate(lower),
      assignee: ctx.actorName,
    });
  }
  if (wantsNote) {
    intents.push({
      type: "add_note",
      projectQuery,
      body: extractNote(text),
    });
  }
  if (wantsTime && !wantsStatus) {
    intents.push({
      type: "log_time",
      projectQuery,
      hours: extractHours(lower),
    });
  }
  if (wantsTicket) {
    intents.push({
      type: "create_ticket",
      projectQuery,
      subject: extractTicketSubject(text) ?? "Support request",
      priority: /\burgent\b/.test(lower) ? "Urgent" : /\bhigh\b/.test(lower) ? "High" : "Medium",
    });
  }

  return intents;
}

function mergePending(pending: AgentPending | undefined, incoming: AgentIntent[], raw: string, ctx: AgentContext): AgentIntent[] {
  if (!pending?.intents.length) return incoming;
  if (incoming.length && incoming.some((intent) => intent.type !== pending.intents[0]?.type)) {
    const sameFamily = incoming.every((intent) => pending.intents.some((row) => row.type === intent.type));
    if (!sameFamily && incoming.length) return incoming;
  }
  const fill = incoming[0];
  const status = parseStatus(raw) ?? fill?.status;
  const projectQuery = extractProjectQuery(raw, ctx.projects) ?? fill?.projectQuery;
  const milestoneName = extractMilestoneName(raw) ?? fill?.name;
  const due = parseRelativeDate(raw) ?? fill?.due;
  const note = extractNote(raw) ?? fill?.body;
  const hours = extractHours(raw) ?? fill?.hours;
  return pending.intents.map((intent) => ({
    ...intent,
    projectQuery: projectQuery ?? intent.projectQuery,
    status: intent.type === "set_status" ? status ?? intent.status : intent.status,
    name: intent.type === "add_milestone" || intent.type === "add_task" ? milestoneName ?? intent.name : intent.name,
    due: due ?? intent.due,
    body: intent.type === "add_note" ? note ?? intent.body : intent.body,
    hours: intent.type === "log_time" ? hours ?? intent.hours : intent.hours,
    subject: intent.type === "create_ticket" ? extractTicketSubject(raw) ?? intent.subject : intent.subject,
  }));
}

function capFor(type: AgentIntentType): Capability | undefined {
  if (type === "set_status") return undefined;
  if (type === "add_milestone") return "manage_plan";
  if (type === "add_task") return "create_task";
  if (type === "add_note") return "add_note";
  if (type === "log_time") return "log_time";
  if (type === "create_ticket") return "create_ticket";
  return undefined;
}

function projectHref(id: string) {
  return `/app/projects/view/?id=${id}`;
}

export function runWorkspaceAgent(raw: string, ctx: AgentContext, runner: WorkspaceRunner): AgentAnswer {
  const incoming = parseWorkspaceIntents(raw, ctx);
  const intents = mergePending(ctx.pending, incoming, raw, ctx);
  if (!intents.length) {
    return { handled: false, text: "", hrefs: [], starters: [] };
  }

  const blocked = intents.find((intent) => {
    const cap = capFor(intent.type);
    if (intent.type === "set_status") return !canChangeProjectStatus(ctx.role ?? undefined, ctx.workflow);
    return cap ? !can(ctx.role, cap) : false;
  });
  if (blocked) {
    return {
      handled: true,
      text: `Your role cannot do that. Ask an Admin if you need the right to ${blocked.type === "set_status" ? "change project status" : blocked.type.replace("_", " ")}.`,
      hrefs: [],
      starters: ["What can my role do?", "Set warehouse to On Hold", "Add a Go-live milestone on warehouse"],
    };
  }

  const resolved = intents.map((intent) => {
    const project = resolveProject(intent.projectQuery, ctx);
    return { intent, project };
  });

  const missingProject = resolved.find((row) => !row.project);
  if (missingProject) {
    const choices = ctx.projects.slice(0, 5).map((project) => project.name);
    return {
      handled: true,
      text: `Which project should I use? ${choices.join(", ") || "Open a project first."}`,
      hrefs: ctx.projects.slice(0, 3).map((project) => ({ href: projectHref(project.id), label: project.name })),
      starters: ctx.projects.slice(0, 4).map((project) => project.name),
      pending: { intents },
    };
  }

  const missingStatus = resolved.find((row) => row.intent.type === "set_status" && !row.intent.status);
  const ready = resolved.filter((row) => !(row.intent.type === "set_status" && !row.intent.status));
  if (missingStatus?.project && ready.length === 0) {
    const options = allowedProjectTransitions(missingStatus.project.status, ctx.workflow);
    return {
      handled: true,
      text: `${missingStatus.project.name} is ${missingStatus.project.status}. Which status should I set? ${options.join(", ") || "No allowed moves."}`,
      hrefs: [{ href: projectHref(missingStatus.project.id), label: `Open ${missingStatus.project.name}` }],
      starters: options.slice(0, 4),
      pending: { intents: intents.map((intent) => ({ ...intent, projectId: missingStatus.project?.id, projectQuery: missingStatus.project?.name })) },
    };
  }

  const actions: AgentActionResult[] = [];
  const hrefs: { href: string; label: string }[] = [];
  const lines: string[] = [];
  let lastProject: AgentProject | undefined;

  for (const row of resolved) {
    const project = row.project!;
    lastProject = project;
    const href = { href: projectHref(project.id), label: `Open ${project.name}` };
    if (!hrefs.some((item) => item.href === href.href)) hrefs.push(href);

    if (row.intent.type === "set_status" && row.intent.status) {
      const next = normalizeProjectStatus(row.intent.status);
      if (project.status === next) {
        actions.push({ ok: true, label: `${project.name} is already ${next}` });
        lines.push(`${project.name} is already ${next}.`);
        continue;
      }
      const ok = runner.setProjectStatus(project.id, next);
      actions.push({ ok, label: ok ? `Status set to ${next}` : `Could not move ${project.name} to ${next}` });
      lines.push(ok ? `I set ${project.name} from ${project.status} to ${next}.` : `I could not move ${project.name} to ${next}. Check the lifecycle rules.`);
    }

    if (row.intent.type === "add_milestone") {
      const name = row.intent.name?.trim() || "New milestone";
      const due = row.intent.due ?? addDays(todayIso(), 14);
      const id = runner.createMilestone(project.id, name, due);
      const ok = Boolean(id);
      actions.push({ ok, label: ok ? `Added ${name}` : "Could not add the milestone" });
      lines.push(ok ? `I added milestone ${name} on ${project.name}, due ${due}.` : "I could not add that milestone.");
    }

    if (row.intent.type === "add_task") {
      const name = row.intent.name?.trim() || "New task";
      const due = row.intent.due ?? addDays(todayIso(), 7);
      const id = runner.createTask({
        name,
        projectId: project.id,
        assignee: row.intent.assignee ?? ctx.actorName,
        due,
      });
      const ok = Boolean(id);
      actions.push({ ok, label: ok ? `Added task ${name}` : "Could not add the task" });
      lines.push(ok ? `I added task ${name} on ${project.name}, due ${due}.` : "I could not add that task.");
    }

    if (row.intent.type === "add_note") {
      const body = row.intent.body?.trim() || raw.trim();
      runner.addProjectNote(project.id, { author: ctx.actorName, body, visibility: "internal" });
      actions.push({ ok: true, label: "Note added" });
      lines.push(`I added a note on ${project.name}.`);
    }

    if (row.intent.type === "log_time") {
      const hours = row.intent.hours ?? 1;
      const id = runner.createTimeEntry({
        userName: ctx.actorName,
        projectId: project.id,
        date: todayIso(),
        hours,
        billable: true,
        note: "Logged from workspace AI",
      });
      const ok = Boolean(id);
      actions.push({ ok, label: ok ? `Logged ${hours}h` : "Could not log time" });
      lines.push(ok ? `I logged ${hours}h on ${project.name}.` : "I could not log that time.");
      hrefs.push({ href: "/app/timesheets", label: "Open Timesheets" });
    }

    if (row.intent.type === "create_ticket") {
      const id = runner.createTicket({
        subject: row.intent.subject ?? "Support request",
        companyId: project.companyId,
        priority: row.intent.priority ?? "Medium",
        assignee: ctx.actorName,
        projectId: project.id,
      });
      const ok = Boolean(id);
      actions.push({ ok, label: ok ? "Ticket created" : "Could not create the ticket" });
      lines.push(ok ? `I raised a ticket on ${project.companyName} for ${project.name}.` : "I could not create that ticket.");
      if (ok) hrefs.push({ href: `/app/tickets/view/?id=${id}`, label: "Open ticket" });
    }
  }

  if (missingStatus?.project) {
    const options = allowedProjectTransitions(missingStatus.project.status, ctx.workflow);
    lines.push(
      `${missingStatus.project.name} is ${missingStatus.project.status}. Which status should I set? ${options.join(", ") || "No allowed moves."}`,
    );
    return {
      handled: true,
      text: lines.join("\n\n"),
      hrefs,
      starters: options.slice(0, 4),
      actions,
      pending: {
        intents: [
          {
            type: "set_status",
            projectId: missingStatus.project.id,
            projectQuery: missingStatus.project.name,
          },
        ],
      },
    };
  }

  return {
    handled: true,
    text: lines.join("\n\n") || "Done.",
    hrefs,
    starters: lastProject
      ? [
          `Add a Go-live milestone on ${lastProject.name}`,
          `Set ${lastProject.name} to On Hold`,
          `Log 1 hour on ${lastProject.name}`,
        ]
      : ["Set warehouse to On Hold and add a Go-live milestone"],
    actions,
  };
}

export function workspaceStarters(role?: Role | null): string[] {
  if (role === "staff") return ["Log 1 hour on warehouse", "Add a note on warehouse: blockers for Friday", "How do I log time?"];
  if (role === "finance") return ["Log 2 hours on warehouse", "How do I create an invoice?", "What can Finance do?"];
  if (role === "client") return ["How do I raise a ticket?", "Where are my invoices?"];
  return [
    "Set warehouse to On Hold and add a Go-live milestone",
    "Add a Cutover milestone on website due next Friday",
    "Update the project status to Active",
    "Add a task called Review signoff on warehouse",
  ];
}
