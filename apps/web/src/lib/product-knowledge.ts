import { can, type Capability } from "./rbac";
import type { Role } from "./types";
import { ROLE_HELP } from "./help-guide";
import { roleLabel } from "./help-labels";

export interface ProductTopic {
  id: string;
  title: string;
  href?: string;
  viewCap?: Capability;
  keywords: string[];
  summary: string;
  howTo: string[];
  canDo: string[];
}

export const PRODUCT_TOPICS: ProductTopic[] = [
  {
    id: "ppm-chain",
    title: "Strategy, Ideas, Portfolios, and Projects",
    href: "/app/strategy",
    keywords: [
      "connection",
      "connected",
      "relationship",
      "align",
      "ppm",
      "funnel",
      "strategy ideas portfolios projects",
      "how they connect",
      "flow",
    ],
    summary:
      "Alignment flows one way: Strategy sets the objective, Ideas capture demand against that objective, Portfolios fund the approved work, and Projects deliver it.",
    howTo: [
      "Create or open a Strategy objective. That is the why.",
      "Submit an Idea and type the objective it serves. Score and advance it to Approved.",
      "Convert an approved idea to create a Project. Optionally land it in a Portfolio book.",
      "Open the Project workspace to plan, staff, log time, and invoice. Home reads this same chain.",
    ],
    canDo: [
      "Create a strategy objective",
      "Create or convert an idea",
      "Create a portfolio",
      "Create a project from an idea or from a company",
    ],
  },
  {
    id: "home",
    title: "Home",
    href: "/app/home",
    viewCap: "view_home",
    keywords: ["home", "dashboard", "cockpit", "kpis", "right work"],
    summary: "Home is the PMO cockpit: right work, people, cost, and risk. It points you to the record that needs a decision.",
    howTo: [
      "Open Home in the left nav.",
      "Read the KPI cards, then follow Needs a decision into a project, gate, or risk.",
      "Use the company selector to scope Home to one client.",
    ],
    canDo: ["Ask what needs a decision", "Open a company or project from Home"],
  },
  {
    id: "companies",
    title: "Companies",
    href: "/app/companies",
    viewCap: "view_companies",
    keywords: ["company", "client", "account", "rowlett", "contacts tab"],
    summary:
      "Companies are client and partner accounts. Each record has Overview, Stream, Contacts, Work, Tasks, Attachments, Assets, and Billing.",
    howTo: [
      "Open Companies, then a company name.",
      "Contacts lists people. Work lists projects. Billing lists invoices.",
      "Use + Contact, New project, or New invoice from the company page.",
    ],
    canDo: ["Create or update a company", "Add a contact", "Create a project on a company", "Draft an invoice"],
  },
  {
    id: "contacts",
    title: "Contacts",
    href: "/app/contacts",
    viewCap: "view_contacts",
    keywords: ["contact", "primary contact", "portal contact", "people"],
    summary: "Contacts are the people at a company. Primary contact is the default sponsor. Portal Enabled lets them use the client portal.",
    howTo: [
      "Open Contacts, or open a company then Contacts.",
      "Add a contact with name, title, email, and company.",
      "Set primary from the company Contacts list.",
    ],
    canDo: ["Create or update a contact", "Email a contact", "Set a company primary contact"],
  },
  {
    id: "projects",
    title: "Projects",
    href: "/app/projects",
    viewCap: "view_projects",
    keywords: ["project", "workspace", "delivery", "engagement", "status"],
    summary:
      "Projects is delivery. Each workspace has Overview, Team, Schedule, Insights, Tasks, Activity, Attachments, Expenses, Rates, Billing, Assets, and Details.",
    howTo: [
      "Open Projects and click a name.",
      "Change lifecycle status from the header if your role is allowed.",
      "On Activity, type @ to mention a teammate such as @A.Chen.",
      "Schedule has a drag handle between the plan table and the Gantt.",
    ],
    canDo: [
      "Create, rename, or delete a project",
      "Set status",
      "Add milestones and tasks",
      "Assign or remove team members",
      "Log time, add notes, generate an invoice",
    ],
  },
  {
    id: "schedule",
    title: "Project plan and schedule",
    href: "/app/projects",
    viewCap: "view_projects",
    keywords: ["plan", "gantt", "schedule", "milestone", "phase", "wbs", "splitter"],
    summary: "Schedule is the project plan: phases, milestones, tasks, dates, and a Gantt. Drag the split arrow to resize the table and chart.",
    howTo: [
      "Open a project, then Schedule.",
      "Add a milestone or task from the plan or ask AI to add them.",
      "Drag the arrow between the table and Gantt to give one side more room.",
    ],
    canDo: ["Add, rename, or delete milestones and tasks", "Request or approve a signoff"],
  },
  {
    id: "work",
    title: "Work and tasks",
    href: "/app/work",
    viewCap: "view_work",
    keywords: ["work", "tasks", "my tasks", "assignee", "board"],
    summary: "Work is the cross-project task board. My tasks in the top bar is the personal slice.",
    howTo: ["Open Work to see every task, or My tasks from the top bar.", "Update status or assignee on the row, or ask AI to do it."],
    canDo: ["Create, assign, update, or delete a task"],
  },
  {
    id: "tickets",
    title: "Tickets",
    href: "/app/tickets",
    viewCap: "view_tickets",
    keywords: ["ticket", "request", "support", "issue ticket"],
    summary: "Tickets are client requests on a company, optionally linked to a project.",
    howTo: ["Open Tickets.", "Create with subject, company, priority, and assignee."],
    canDo: ["Create, assign, or update a ticket"],
  },
  {
    id: "timesheets",
    title: "Timesheets",
    href: "/app/timesheets",
    viewCap: "view_timesheets",
    keywords: ["time", "timesheet", "hours", "log time", "timer", "phase", "subtask", "edit time"],
    summary: "Timesheets hold daily and weekly hours against a project, phase, task, or subtask. Click a day to add or edit activity. Extra tools sit in the three-dot menu.",
    howTo: [
      "Open Timesheets and search Weekly for a project, phase, task, or subtask.",
      "Click a day cell to add hours, or open a logged line to edit or delete it.",
      "Use + on a day to add another activity. Approvers change submitted time.",
    ],
    canDo: ["Log time", "Edit or delete time", "Approve or reject time"],
  },
  {
    id: "billing",
    title: "Billing",
    href: "/app/billing",
    viewCap: "view_billing",
    keywords: ["invoice", "billing", "payment", "draft invoice", "generate invoice"],
    summary: "Billing is invoices: Draft, Sent, Paid, Overdue. PM and Admin can generate a project invoice. Finance records payment.",
    howTo: [
      "Open Billing, or a company or project Billing tab.",
      "Create invoice, or generate from a project.",
      "Send puts it on the client portal. Pay records collection.",
    ],
    canDo: ["Create, send, pay, rename, or generate an invoice"],
  },
  {
    id: "retainers",
    title: "Retainers",
    href: "/app/retainers",
    viewCap: "view_retainers",
    keywords: ["retainer", "pre-paid", "monthly t&m"],
    summary: "Retainers are recurring commercial agreements on a company: Monthly T&M, Pre-paid, or Fixed.",
    howTo: [
      "Open Retainers. Use the row menu to log time, add a note, edit, or add a period.",
      "On a retainer, log time or edit from the header. Extra actions sit in the three-dot menu.",
      "Add a period with start, end, and hours, then invoice or close it from the period row.",
    ],
    canDo: [
      "Create, edit, or delete a retainer",
      "Log time, add a note, or add a period",
      "Invoice or close an open period",
      "Export the retainer list",
    ],
  },
  {
    id: "strategy",
    title: "Strategy",
    href: "/app/strategy",
    viewCap: "view_strategy",
    keywords: ["strategy", "objective", "okr", "goal"],
    summary: "Strategy holds firm-level objectives. Ideas and portfolios attach here so leadership sees alignment.",
    howTo: ["Open Strategy.", "Create an objective with owner, horizon, and target.", "Link it from an idea or portfolio."],
    canDo: ["Create or update an objective"],
  },
  {
    id: "ideas",
    title: "Ideas",
    href: "/app/ideas",
    viewCap: "view_ideas",
    keywords: ["idea", "intake", "convert idea", "demand"],
    summary: "Ideas is demand intake. Score, advance, then convert an approved idea into a project.",
    howTo: ["Open Ideas and submit name, summary, budget, company, and a typed objective.", "Advance to Approved, then Convert."],
    canDo: ["Create, advance, convert, or rename an idea"],
  },
  {
    id: "portfolios",
    title: "Portfolios",
    href: "/app/portfolios",
    viewCap: "view_portfolios",
    keywords: ["portfolio", "investment book", "funding"],
    summary: "Portfolios are investment books, not client accounts. They group funded projects and objectives.",
    howTo: ["Open Portfolios.", "Create a book and link project ids and objective ids."],
    canDo: ["Create or update a portfolio"],
  },
  {
    id: "risks",
    title: "Risks and issues",
    href: "/app/risks",
    viewCap: "view_risks",
    keywords: ["risk", "issue", "raid", "mitigate"],
    summary: "Risks and issues sit on projects or the firm. Close, mitigate, or resolve them as work moves.",
    howTo: ["Open Risks, or ask AI to create or close a named risk.", "Update an issue to In Progress or Resolved."],
    canDo: ["Create a risk", "Close or mitigate a risk", "Update an issue"],
  },
  {
    id: "governance",
    title: "Governance",
    href: "/app/governance",
    viewCap: "view_governance",
    keywords: ["gate", "governance", "approve gate", "signoff"],
    summary: "Governance holds stage gates. Leadership and Admin approve or reject. Projects also have milestone signoff.",
    howTo: ["Open Governance and decide a gate.", "On a project, request or approve a milestone signoff."],
    canDo: ["Approve or reject a gate", "Request or approve a signoff"],
  },
  {
    id: "resources",
    title: "Resources",
    href: "/app/resources",
    viewCap: "view_resources",
    keywords: ["resources", "allocation", "capacity", "team member"],
    summary: "Resources shows who is allocated to which project and at what percent.",
    howTo: ["Open Resources, or assign someone on the project Team tab."],
    canDo: ["Assign or remove a project team member"],
  },
  {
    id: "users",
    title: "Users and roles",
    href: "/app/settings/?section=users",
    viewCap: "view_users",
    keywords: ["user", "role", "invite", "permission", "rbac", "admin", "staff"],
    summary: "Users & roles is the firm roster. Admin adds people, sends an invite, and sets role and rates.",
    howTo: [
      "Open Settings, then Users & roles. You can also open it from your profile.",
      "Add user with Send an invitation email checked.",
      "The invite includes signup and sign-in links. Mail leaves the outbox when Microsoft Mail.Send or a host mail key is connected.",
    ],
    canDo: ["Create a user", "Explain what each role can do"],
  },
  {
    id: "mail",
    title: "Email and invites",
    href: "/app/automations",
    keywords: ["email", "invite", "outbox", "mail.send", "resend"],
    summary:
      "Assignment notices and invites write to the Email outbox. They reach an inbox only when Microsoft Mail.Send or a host mail API key is connected.",
    howTo: [
      "Ask AI to draft or send an email to a teammate or contact.",
      "Check Automations, Email outbox. Sent left the workspace. Failed stayed in the log.",
      "Use Send invite or Resend invite on Users & roles.",
    ],
    canDo: ["Draft or send email", "Add a user with an invite"],
  },
  {
    id: "ask-ai",
    title: "Ask AI",
    keywords: ["ask ai", "workspace ai", "assistant", "what can you do", "help me"],
    summary:
      "Ask AI knows every module and can change live records your role allows. Ask how something works, what a record looks like, or tell it to create, update, assign, email, or delete.",
    howTo: [
      "Open Help & Support, then Ask AI.",
      "Ask a question: How do Ideas become Projects? How do I create a company?",
      "Give a task: Create a company called Northwind, add a project Atlas, or draft an email to a teammate.",
    ],
    canDo: [
      "Answer how any module works",
      "Look up live companies, projects, contacts, tasks, tickets, invoices, ideas, and people",
      "Create, update, delete, assign, approve, invoice, and email when your role allows",
    ],
  },
  {
    id: "capabilities",
    title: "Capabilities",
    href: "/app/settings",
    viewCap: "view_home",
    keywords: [
      "capabilities",
      "packs",
      "modular",
      "enable",
      "disable",
      "project management",
      "project delivery",
      "service operations",
      "uhuru",
      "one tool",
    ],
    summary:
      "DMC PMO is one modular platform. Customers enable only the packs they need: project management, project delivery, or field service operations.",
    howTo: [
      "Open Settings, Capabilities.",
      "Toggle Project management, Project delivery, or Service operations.",
      "The left nav hides modules that are off. Role Management can hide a pack from a role.",
    ],
    canDo: ["Turn a capability pack on or off", "Explain which modules sit in each pack"],
  },
  {
    id: "service-ops",
    title: "Service operations",
    href: "/app/work-orders",
    viewCap: "view_service_ops",
    keywords: [
      "service operations",
      "field service",
      "work order",
      "work journey",
      "recurring services",
      "approval center",
      "employee portal",
      "work schedule",
      "scheduling",
      "instances",
      "promotional trial",
    ],
    summary:
      "Service operations is the field pack inside DMC PMO: work orders, recurring visits, documents, schedule, approvals, crew, instances, and trials.",
    howTo: [
      "Turn on Service operations in Settings, Capabilities.",
      "Create a work order, start it, then submit it for approval.",
      "Generate the next visit from Recurring Services, or clock in from Employee Portal.",
    ],
    canDo: ["Create a work order", "Approve or send back a job", "Start a service operations trial"],
  },
  {
    id: "employee-portal",
    title: "Employee Portal",
    href: "/app/employee",
    viewCap: "view_service_ops",
    keywords: ["employee portal", "clock in", "my schedule", "time off", "timesheet", "my assignments"],
    summary:
      "Employee Portal is the crew view: assignments, this week's hours, requests, announcements, and clock in or out.",
    howTo: [
      "Open Employee Portal from Resource Management.",
      "Use My Overview for assignments, the week grid, and quick actions.",
      "Clock in when you start a visit. Submit time off or an expense from My Requests.",
    ],
    canDo: ["Clock in or out", "Request time off", "Open assigned work"],
  },
  {
    id: "portal",
    title: "Client portal",
    href: "/portal",
    keywords: ["portal", "client portal", "shared project"],
    summary: "The portal is what a client contact sees: shared projects, tickets, billing, and retainers for their company.",
    howTo: ["Enable portal on a contact.", "The client signs in and stays in /portal, not the internal nav."],
    canDo: ["Enable a contact portal", "Create a ticket for a company"],
  },
  {
    id: "signin",
    title: "Sign in",
    href: "/login",
    keywords: ["login", "sign in", "sign up", "entra", "microsoft"],
    summary: "Sign in with Microsoft Entra when it is configured, or use an existing workspace email. Demo users stay available for the sample workspace.",
    howTo: ["Open Sign in.", "Use Microsoft, or Continue with email, or pick a demo user."],
    canDo: ["Explain sign in and invites"],
  },
];

const STOP = new Set([
  "the",
  "and",
  "for",
  "you",
  "your",
  "how",
  "what",
  "where",
  "when",
  "why",
  "can",
  "do",
  "i",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "is",
  "it",
  "this",
  "that",
  "with",
  "from",
  "please",
  "tell",
  "me",
  "about",
]);

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP.has(word));
}

export function scoreProductTopic(topic: ProductTopic, raw: string) {
  const query = raw.toLowerCase();
  const queryTokens = tokens(raw);
  let score = 0;
  if (query.includes(topic.title.toLowerCase())) score += 14;
  if (topic.id === "ppm-chain" && /strateg|idea|portfolio|project/.test(query) && /connect|relation|between|flow|align|chain/.test(query)) {
    score += 24;
  }
  if (topic.id === "ask-ai" && /what can you do|ask ai|workspace ai|assistant/.test(query)) score += 20;
  for (const word of queryTokens) {
    if (topic.keywords.some((key) => key === word || key.includes(word) || word.includes(key))) score += 6;
    if (`${topic.title} ${topic.summary} ${topic.canDo.join(" ")}`.toLowerCase().includes(word)) score += 2;
  }
  return score;
}

export function answerProductKnowledge(
  rawQuestion: string,
  options: { role?: Role | null },
): { text: string; hrefs: { href: string; label: string }[]; starters: string[]; topicId?: string } | null {
  const raw = rawQuestion.trim().toLowerCase();
  if (!raw) return null;

  const ranked = PRODUCT_TOPICS.map((topic) => ({ topic, score: scoreProductTopic(topic, rawQuestion) })).sort(
    (a, b) => b.score - a.score,
  );
  const best = ranked[0];
  if (!best || best.score < 6) return null;

  const topic = best.topic;
  const locked = Boolean(options.role && topic.viewCap && !can(options.role, topic.viewCap));
  const lines = [
    `${topic.title}: ${topic.summary}`,
    topic.howTo.length ? `How to use it:\n${topic.howTo.map((step, i) => `${i + 1}. ${step}`).join("\n")}` : "",
    topic.canDo.length ? `I can do this for you when your role allows: ${topic.canDo.join("; ")}.` : "",
    locked && options.role ? `Your ${roleLabel(options.role)} role cannot open this module. Ask an Admin if you need access.` : "",
    options.role && /role|permission|access|what can/.test(raw) ? ROLE_HELP[options.role] : "",
  ].filter(Boolean);

  return {
    text: lines.join("\n\n"),
    hrefs: topic.href && !locked ? [{ href: topic.href, label: `Open ${topic.title}` }] : [],
    starters: topic.canDo.slice(0, 3),
    topicId: topic.id,
  };
}

export function askAiCapabilityText(role?: Role | null) {
  const who = role ? ` You are signed in as ${roleLabel(role)}.` : "";
  return [
    `I am the DMC PMO assistant. I know every module and I can change live records your role allows.${who}`,
    "Ask how a module works, how Strategy, Ideas, Portfolios, and Projects connect, or what a live record looks like.",
    "Or tell me to create, update, assign, email, invoice, approve, or delete. I use the same workspace as the rest of the tool.",
  ].join(" ");
}

export function fallbackProductAnswer(role?: Role | null) {
  return {
    text: `${askAiCapabilityText(role)} I stay inside DMC PMO, so I cannot answer unrelated questions. Try a module name, a record name, or a task such as Create a project called Atlas.`,
    hrefs: [{ href: "/app/home", label: "Open Home" }],
    starters: [
      "How do Strategy, Ideas, Portfolios, and Projects connect?",
      "What can you do?",
      "How do I create a company?",
    ],
  };
}
