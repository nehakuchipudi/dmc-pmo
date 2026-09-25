import type { Capability } from "./rbac";
import type { Role } from "./types";

export type HelpAudience = "internal" | "portal" | "both";

export interface HelpArticle {
  id: string;
  title: string;
  group: string;
  href?: string;
  audience: HelpAudience;
  viewCap?: Capability;
  keywords: string[];
  summary: string;
  steps: string[];
  tips: string[];
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "home",
    title: "Home",
    group: "Overview",
    href: "/app/home",
    audience: "internal",
    viewCap: "view_home",
    keywords: ["home", "portfolio home", "dashboard", "overview", "right work", "kpis"],
    summary:
      "Home is the PMO cockpit. It answers whether the firm is on the right work, with the right people, cost, and risk. Use the company selector in the top bar to scope Home to one client.",
    steps: [
      "Open Home from Overview in the left nav.",
      "Read the KPI cards for work mix, resources, cost, and risk.",
      "Use the company selector if you only want one client in focus.",
      "Follow Needs a decision items into the matching project, gate, or risk.",
    ],
    tips: ["Home never replaces module pages. It points you to the record that needs a decision."],
  },
  {
    id: "shell",
    title: "Workspace shell",
    group: "Overview",
    audience: "internal",
    keywords: ["nav", "sidebar", "create", "plus", "search", "command", "timer", "notifications", "company selector"],
    summary:
      "The shell is the frame around every internal page: left nav, search, company focus, Create (+), timer, notifications, and your profile.",
    steps: [
      "Use the left nav to move between modules. Items you cannot access stay hidden.",
      "Press Command-K or click Search to jump to companies, projects, ideas, portfolios, tickets, and contacts.",
      "The company selector scopes Home and defaults new records to that company.",
      "Create (+) adds time, tasks, expenses, companies, contacts, projects, tickets, milestones, ideas, portfolios, objectives, and risks, based on your role.",
      "The timer starts a clock. Stop and log writes a timesheet line.",
    ],
    tips: ["Collapsed nav still shows icons. Hover an icon for the module name."],
  },
  {
    id: "strategy",
    title: "Strategy",
    group: "Align",
    href: "/app/strategy",
    audience: "internal",
    viewCap: "view_strategy",
    keywords: ["strategy", "objective", "okrs", "goals", "alignment", "so-"],
    summary:
      "Strategy holds firm-level objectives. Portfolios and projects attach here so leadership can see alignment, not just activity.",
    steps: [
      "Open Strategy to see every objective, coverage, and progress.",
      "Click an objective to open it and edit name, target, horizon, owner, or progress.",
      "Use New objective if your role can create strategy records.",
      "Link work later from Portfolios by choosing the objective ids on the book.",
    ],
    tips: ["Staff and Finance cannot open Strategy. Leadership, PM, and Admin can."],
  },
  {
    id: "ideas",
    title: "Ideas",
    group: "Align",
    href: "/app/ideas",
    audience: "internal",
    viewCap: "view_ideas",
    keywords: ["ideas", "intake", "demand", "submit idea", "convert", "score", "funnel"],
    summary:
      "Ideas is demand intake before a project exists. Score for strategic fit, value, and risk, then convert the ones that belong in a portfolio.",
    steps: [
      "Open Ideas and submit an idea with name, summary, requested budget, company, and objective.",
      "Advance moves Submitted to Scoring, then Approved.",
      "Convert on an Approved idea creates a project and can land it in the delivery portfolio.",
      "Open any idea to edit scores or details.",
    ],
    tips: ["Staff can submit ideas. Convert needs a PM, Leadership, or Admin role."],
  },
  {
    id: "portfolios",
    title: "Portfolios",
    group: "Align",
    href: "/app/portfolios",
    audience: "internal",
    viewCap: "view_portfolios",
    keywords: ["portfolio", "investment book", "theme", "booked", "funding"],
    summary:
      "Portfolios are investment books, not client accounts. Companies stay in Clients. A portfolio groups the work leadership funds and reviews.",
    steps: [
      "Open Portfolios to see each book, owner, theme, and booked value.",
      "Click a portfolio to edit description, budget, linked projects, and objectives.",
      "Use New portfolio if your role can create books.",
    ],
    tips: ["A company can have work in more than one portfolio."],
  },
  {
    id: "projects",
    title: "Projects",
    group: "Deliver",
    href: "/app/projects",
    audience: "internal",
    viewCap: "view_projects",
    keywords: ["project", "engagement", "workspace", "delivery", "new project", "lifecycle"],
    summary:
      "Projects is the delivery workspace. Each project has overview, team, schedule, insights, tasks, activity, files, expenses, rates, billing, assets, and details.",
    steps: [
      "Open Projects and filter All open, My projects, At risk, or Recently created.",
      "Click a project name to open the workspace.",
      "Use New project from the list, Create (+), or a company page.",
      "Change lifecycle status from the project header if your role is allowed.",
      "Row actions can edit, duplicate, generate an invoice, email an update, or delete, based on role.",
    ],
    tips: ["Staff can open projects but cannot create them or see budget amounts unless granted rates and budgets."],
  },
  {
    id: "project-plan",
    title: "Project plan and schedule",
    group: "Deliver",
    href: "/app/projects",
    audience: "internal",
    viewCap: "view_projects",
    keywords: ["plan", "gantt", "schedule", "wbs", "milestone", "phase", "workstream", "task dates"],
    summary:
      "The Schedule tab is the project plan: phases, workstream groups, tasks, dates, and a Gantt. It is inspired by a modern project plan, not a copy of Accelo.",
    steps: [
      "Open a project and choose Schedule.",
      "Add a phase or group, then add tasks under it.",
      "Drag or edit dates. Dependencies stay on the task.",
      "Signoffs live on phases. Request from the project, approve if you are a PM or Admin.",
    ],
    tips: ["Finance cannot edit the plan. Staff can update assigned tasks only."],
  },
  {
    id: "project-team",
    title: "Project team",
    group: "Deliver",
    href: "/app/projects",
    audience: "internal",
    viewCap: "view_projects",
    keywords: ["project team", "allocation", "add member", "responsibility", "capacity"],
    summary:
      "The Team tab assigns people from Users & roles onto a project with a project role, responsibility, and allocation percent.",
    steps: [
      "Open a project and choose Team.",
      "Add a member from the firm roster.",
      "Set project role, responsibility, and weekly allocation.",
      "Those allocations also appear on Resources.",
    ],
    tips: ["Only Admin and PM can change the project team."],
  },
  {
    id: "work",
    title: "Work",
    group: "Deliver",
    href: "/app/work",
    audience: "internal",
    viewCap: "view_work",
    keywords: ["work", "board", "kanban", "tasks board", "assignee board", "deadline"],
    summary:
      "Work is the cross-project task board. Use Status, Assignee, or Deadline boards to move work without opening each project.",
    steps: [
      "Open Work.",
      "Switch boards with the chips.",
      "Drag a card to change status on the Status board.",
      "New Task opens the create form if your role can create tasks.",
    ],
    tips: ["Daily Timesheet from this page jumps to Timesheets."],
  },
  {
    id: "tickets",
    title: "Tickets",
    group: "Deliver",
    href: "/app/tickets",
    audience: "internal",
    viewCap: "view_tickets",
    keywords: ["ticket", "support", "service request", "sla", "raise"],
    summary:
      "Tickets are support and service requests across clients. Each ticket has priority, assignee, SLA, and a message thread.",
    steps: [
      "Open Tickets and filter open, assigned to you, unassigned, or recently created.",
      "Click a ticket to reply, add an internal note, or change status.",
      "New Ticket from the list or Create (+).",
      "Clients raise tickets from the portal. Those land here on their company.",
    ],
    tips: ["Staff can update tickets assigned to them."],
  },
  {
    id: "timesheets",
    title: "Timesheets",
    group: "Deliver",
    href: "/app/timesheets",
    audience: "internal",
    viewCap: "view_timesheets",
    keywords: ["timesheet", "time", "hours", "log time", "approve time", "daily", "weekly", "overview"],
    summary:
      "Timesheets has Overview, Daily, and Weekly views. Staff see their own lines. PM, Finance, and Admin can approve or reject submitted time.",
    steps: [
      "Open Timesheets.",
      "Overview is hours by company. Daily is a timeline. Weekly is the grid.",
      "Log time from Create (+), the timer, or a project.",
      "Submit a draft line. Approvers change it to Approved or Rejected.",
    ],
    tips: ["Staff cannot approve time or log time for someone else."],
  },
  {
    id: "companies",
    title: "Companies",
    group: "Clients",
    href: "/app/companies",
    audience: "internal",
    viewCap: "view_companies",
    keywords: ["company", "client", "account", "new company", "overview"],
    summary:
      "Companies are client accounts. The company workspace has stream, contacts, work, tasks, files, assets, tickets, retainers, and billing.",
    steps: [
      "Open Companies and filter active, prospects, managed by me, or recently created.",
      "Click a company to open the workspace.",
      "New Company uses the full create form: profile, addresses, managers, tags, and notes.",
      "The company selector in the top bar focuses Home and new records.",
    ],
    tips: ["Staff can view companies. Creating one needs a PM or Admin."],
  },
  {
    id: "contacts",
    title: "Contacts",
    group: "Clients",
    href: "/app/contacts",
    audience: "internal",
    viewCap: "view_contacts",
    keywords: ["contact", "people", "portal invite", "primary contact"],
    summary:
      "Contacts are the people at each company. A contact can be the primary, invited to the portal, and linked to projects.",
    steps: [
      "Open Contacts from a company page or /app/contacts.",
      "Filter primary, portal enabled, or not invited.",
      "Open a contact to edit details, notes, and project links.",
      "New Contact from the list or Create (+).",
    ],
    tips: ["Portal access is the Enabled / Not Invited flag on the contact."],
  },
  {
    id: "sales",
    title: "Sales",
    group: "Clients",
    href: "/app/sales",
    audience: "internal",
    viewCap: "view_sales",
    keywords: ["sales", "opportunity", "pipeline", "deal", "won"],
    summary:
      "Sales is the opportunity pipeline. Advance a deal through Qualify, Propose, Negotiate, Won, or Lost. Won work becomes a project.",
    steps: [
      "Open Sales.",
      "Create an opportunity with company, amount, and close date.",
      "Advance moves the stage forward.",
    ],
    tips: ["Staff cannot open Sales. PM, Finance, Leadership, and Admin can."],
  },
  {
    id: "retainers",
    title: "Retainers",
    group: "Clients",
    href: "/app/retainers",
    audience: "internal",
    viewCap: "view_retainers",
    keywords: ["retainer", "period", "recurring", "pre-paid", "monthly t&m"],
    summary:
      "Retainers are recurring contracts with periods, used hours, invoices, files, and notes.",
    steps: [
      "Open Retainers and click a contract.",
      "Add a period with start, end, and budget hours.",
      "Create an invoice from an open period.",
      "New retainer needs Finance or Admin.",
    ],
    tips: ["Clients see their retainers in the portal."],
  },
  {
    id: "resources",
    title: "Resources",
    group: "Govern",
    href: "/app/resources",
    audience: "internal",
    viewCap: "view_resources",
    keywords: ["resources", "capacity", "overload", "allocation", "utilization"],
    summary:
      "Resources shows capacity against work already assigned. Allocations come from project teams. They do not replace task assignees.",
    steps: [
      "Open Resources.",
      "Read who is over 100% and average load.",
      "Click a project name to adjust the assignment on the project Team tab.",
    ],
    tips: ["Change allocations on the project, not on this page."],
  },
  {
    id: "risks",
    title: "Risks and issues",
    group: "Govern",
    href: "/app/risks",
    audience: "internal",
    viewCap: "view_risks",
    keywords: ["risk", "issue", "likelihood", "impact", "mitigation", "register"],
    summary:
      "This is the formal risk and issue register. Project status pills stay on the project. Log likelihood, impact, owner, and next action here.",
    steps: [
      "Open Risks.",
      "Log a risk with project, probability, impact, mitigation, and due date.",
      "Update status to Mitigating or Closed as work proceeds.",
    ],
    tips: ["PM, Leadership, and Admin can log and update risks."],
  },
  {
    id: "dependencies",
    title: "Dependencies",
    group: "Govern",
    href: "/app/dependencies",
    audience: "internal",
    viewCap: "view_dependencies",
    keywords: ["dependency", "cross-project", "predecessor", "blocked", "finish to start"],
    summary:
      "Dependencies are cross-project holds. Task-level predecessors stay on the project Gantt. Use this page for portfolio coordination.",
    steps: [
      "Open Dependencies.",
      "Record predecessor project, successor project, type, and note.",
      "Watch On Track, At Risk, and Blocked counts.",
    ],
    tips: ["A blocked dependency should show up on Home under Needs a decision."],
  },
  {
    id: "governance",
    title: "Governance",
    group: "Govern",
    href: "/app/governance",
    audience: "internal",
    viewCap: "view_governance",
    keywords: ["governance", "gate", "stage gate", "approve gate", "phase gate"],
    summary:
      "Governance is stage gates on top of project signoffs. Approve or reject when work is ready to change phase.",
    steps: [
      "Open Governance.",
      "Review gates In Review or Upcoming.",
      "Approve or Reject if your role can decide gates.",
    ],
    tips: ["Leadership and Admin decide gates. Project signoffs are still on the project."],
  },
  {
    id: "billing",
    title: "Billing",
    group: "Value",
    href: "/app/billing",
    audience: "internal",
    viewCap: "view_billing",
    keywords: ["billing", "invoice", "new invoice", "expense", "pay", "send invoice", "template"],
    summary:
      "Billing holds invoices, expenses, purchases, and materials. Create an invoice from a template, a project, a retainer period, or New Invoice.",
    steps: [
      "Open Billing.",
      "New Invoice opens the create form: template, company, project, lines, tax, and send.",
      "Open an invoice to export PDF, send, remind, or record payment.",
      "Approve pending expenses on the Expenses tab if you are Finance or Admin.",
    ],
    tips: ["Staff cannot open Billing. PM can create invoices. Only Finance and Admin can record payment."],
  },
  {
    id: "benefits",
    title: "Benefits",
    group: "Value",
    href: "/app/benefits",
    audience: "internal",
    viewCap: "view_benefits",
    keywords: ["benefits", "outcome", "metric", "realization", "value"],
    summary:
      "Benefits tracks outcome metrics tied to objectives and projects: baseline, target, current, and progress.",
    steps: [
      "Open Benefits.",
      "Read each benefit against its objective.",
      "Follow the project link when one is attached.",
    ],
    tips: ["Use Benefits when leadership asks whether funded work is producing the outcome."],
  },
  {
    id: "reports",
    title: "Reports",
    group: "Insights",
    href: "/app/reports",
    audience: "internal",
    viewCap: "view_reports",
    keywords: ["reports", "profitability", "export", "csv"],
    summary:
      "Reports is firm reporting, including profitability. Export CSV from most list pages as well.",
    steps: [
      "Open Reports.",
      "Open Profitability for margin views.",
      "Use Export on Projects, Companies, Contacts, or Billing when you need a file.",
    ],
    tips: ["Staff cannot open Reports."],
  },
  {
    id: "insights",
    title: "Insights",
    group: "Insights",
    href: "/app/ai",
    audience: "internal",
    viewCap: "view_insights",
    keywords: ["insights", "watch", "critical", "intelligence"],
    summary:
      "Insights reads live store data and writes watch items for at-risk projects, overload, risks, blocked dependencies, and gates.",
    steps: [
      "Open Insights.",
      "Filter the list if you are hunting one theme.",
      "Click an item to jump to the record.",
    ],
    tips: ["This page is generated from current workspace data, not a separate model."],
  },
  {
    id: "workspace-ai",
    title: "Workspace AI",
    group: "Insights",
    audience: "internal",
    keywords: ["ai", "assistant", "do this", "update status", "add milestone", "workspace ai", "ask ai", "email", "delete", "assign"],
    summary:
      "Ask AI can create, update, delete, assign, and email across every module: companies, contacts, projects, plan, tasks, tickets, time, billing, retainers, sales, ideas, portfolios, strategy, risks, governance, and the email outbox. It uses your role and the same store as the rest of the workspace.",
    steps: [
      "Open Workspace AI from the sparkle button, or Help & Support then Ask AI.",
      "Create: a company, contact, project, task, milestone, ticket, invoice, idea, portfolio, objective, risk, retainer, opportunity, or user.",
      "Update: project status, task or ticket status, assignments, approvals, payments, signoffs, risks, issues, invoices, and record names.",
      "Delete or remove: a project, task, milestone, retainer, or project teammate when your role allows it.",
      "Email: send or draft a message to a teammate or contact. Drafts land in the automations outbox as Queued. You can also generate a project invoice or run an automation.",
    ],
    tips: [
      "Say the exact record name: Create a company Acme and a project Atlas, or Create a project called Test234.",
      "If a name is missing, AI asks and waits. It will not save New company or New project. Staff still cannot change status or add milestones.",
    ],
  },
  {
    id: "automations",
    title: "Automations",
    group: "Insights",
    href: "/app/automations",
    audience: "internal",
    viewCap: "view_automations",
    keywords: ["automation", "rules", "email", "outbox", "trigger"],
    summary:
      "Automations are triggers, conditions, and email notifications. The Email outbox shows what the workspace queued, including welcome mail.",
    steps: [
      "Open Automations.",
      "Enable or run a rule if you are an Admin.",
      "Check Email outbox for sent notifications.",
    ],
    tips: ["Only Admin can toggle or run automations."],
  },
  {
    id: "email-domain",
    title: "Email Domain / DNS Records",
    group: "Admin",
    href: "/app/settings",
    audience: "internal",
    viewCap: "view_users",
    keywords: ["email domain", "dns", "spf", "dkim", "dmarc", "sending domain", "spam"],
    summary:
      "An email domain is the part after @. DNS records are public notes at your domain host that prove DMC PMO may send invoices, welcome mail, and reminders as your company.",
    steps: [
      "Open Settings, then Email domain, or Automations then Email domain.",
      "Add the domain you send from, such as dillonmorgan.com.",
      "Copy the SPF, DKIM, and DMARC values into your DNS host (Cloudflare, GoDaddy, or Microsoft 365).",
      "Click Check records. Verified means inboxes can see all three. Partial means some are live. Missing means none were found.",
    ],
    tips: [
      "SPF lists approved senders. DKIM signs the message. DMARC says what to do if those checks fail.",
      "Without these records, Gmail and Outlook often put DMC PMO mail in spam.",
    ],
  },
  {
    id: "users",
    title: "Users and roles",
    group: "Admin",
    href: "/app/settings",
    audience: "internal",
    viewCap: "view_users",
    keywords: ["users", "roles", "permissions", "add user", "rbac", "access", "rates"],
    summary:
      "Users & roles is the firm roster. Admin adds people, assigns a role, sets bill and cost rates, and chooses hours-only versus rates and budgets.",
    steps: [
      "Open Users and roles from your profile or Settings.",
      "Admin: Add user, fill Profile, Organization, Rates, and Access, then save.",
      "Admin: Edit to change role. That role applies on the next page they open.",
      "PM, Finance, and Leadership can view the roster but cannot edit it.",
    ],
    tips: [
      "Admin has every right.",
      "Leadership runs strategy and governance.",
      "PM owns delivery and can invoice.",
      "Finance owns billing, retainers, and payment.",
      "Staff logs time and works assigned tasks.",
      "Client uses the portal only.",
    ],
  },
  {
    id: "lifecycle",
    title: "Project lifecycle",
    group: "Admin",
    href: "/app/settings",
    audience: "internal",
    viewCap: "view_users",
    keywords: ["lifecycle", "status", "transition", "draft", "active", "on hold"],
    summary:
      "The Lifecycle tab defines who can change project status and which from-to moves are allowed. Admin always keeps the right to change status.",
    steps: [
      "Open Settings, then Lifecycle.",
      "Check the roles allowed to change status. Admin cannot be removed.",
      "Check the matrix cells to allow a transition.",
      "Project headers use this workflow when someone moves status.",
    ],
    tips: ["Only Admin can edit the matrix. Everyone with Users access can view it."],
  },
  {
    id: "signin",
    title: "Sign in and sign up",
    group: "Admin",
    href: "/login",
    audience: "both",
    keywords: ["login", "sign in", "sign up", "entra", "microsoft", "email", "demo user"],
    summary:
      "People sign in with Microsoft Entra ID using their real email, or continue with email when Entra is not configured. Demo workspace users stay on the login page.",
    steps: [
      "Open Sign in and enter the email on your user record.",
      "If Entra is configured, Microsoft verifies the address.",
      "If Entra is not configured, Continue with email uses an existing workspace account.",
      "Create an account from Sign up. New accounts default to Staff unless they pick PM, Finance, Leadership, or Client.",
      "Demo users: Dillon Morgan (Admin), M. Doyle (PM), J. Kim (Staff), J. Alvarez (Finance), P. Rivera (Leadership), Dana Kessler (Client).",
    ],
    tips: ["Nobody can self-assign Admin on sign up. An Admin grants that role in Users & roles."],
  },
  {
    id: "portal",
    title: "Client portal",
    group: "Portal",
    href: "/portal",
    audience: "both",
    keywords: ["portal", "client", "signoff", "raise ticket", "my projects"],
    summary:
      "The client portal is for company contacts. They see shared projects, tickets, billing, and retainers for their company only.",
    steps: [
      "Sign in as a Client contact, such as Dana Kessler.",
      "Projects shows shared work and pending signoffs.",
      "Raise a Ticket from the portal home.",
      "Billing and Retainers show that company's commercial records.",
    ],
    tips: ["Internal users cannot stay in the portal. Clients cannot enter /app."],
  },
  {
    id: "portal-projects",
    title: "Portal projects",
    group: "Portal",
    href: "/portal",
    audience: "portal",
    keywords: ["my projects", "signoff", "shared project", "status", "approve work"],
    summary:
      "Portal Projects shows only the work your company is invited to see. Pending signoffs sit on this page so you can approve or request changes.",
    steps: [
      "Open Projects in the portal nav.",
      "Read status, next date, and any pending signoff.",
      "Approve a signoff when the phase is ready, or send a note back to the team.",
      "Use Search to jump to a named project.",
    ],
    tips: ["If a project is missing, ask your account manager to mark it portal shared."],
  },
  {
    id: "portal-tickets",
    title: "Portal tickets",
    group: "Portal",
    href: "/portal/tickets",
    audience: "portal",
    keywords: ["raise ticket", "support", "service request", "reply"],
    summary:
      "Portal Tickets is how your company asks for help. New tickets land on the internal Tickets list for the delivery team.",
    steps: [
      "Open Tickets in the portal.",
      "Raise a ticket with subject, priority, and detail.",
      "Reply on the thread when the team asks a question.",
      "Watch status as the team works the request.",
    ],
    tips: ["Keep one ticket per request so SLA and replies stay easy to follow."],
  },
  {
    id: "portal-billing",
    title: "Portal billing",
    group: "Portal",
    href: "/portal/billing",
    audience: "portal",
    keywords: ["invoice", "amount due", "pay", "statement"],
    summary:
      "Portal Billing lists invoices for your company. You can open an invoice and see amount, status, and the work it covers.",
    steps: [
      "Open Billing in the portal.",
      "Click an invoice to read lines and status.",
      "Follow up with Finance if a payment status looks wrong.",
    ],
    tips: ["Internal Staff cannot see Billing. Your portal login is the client view of the same invoices."],
  },
  {
    id: "portal-retainers",
    title: "Portal retainers",
    group: "Portal",
    href: "/portal/retainers",
    audience: "portal",
    keywords: ["retainer", "hours used", "period", "prepaid"],
    summary:
      "Portal Retainers shows your recurring contracts, remaining hours, and open periods.",
    steps: [
      "Open Retainers in the portal.",
      "Read used versus budget hours on the current period.",
      "Open Billing if a period produced an invoice.",
    ],
    tips: ["Hours come from approved timesheets on that retainer."],
  },
];

export const HELP_GROUPS = ["Overview", "Align", "Deliver", "Clients", "Govern", "Value", "Insights", "Admin", "Portal"];

export function articlesForAudience(audience: HelpAudience) {
  return HELP_ARTICLES.filter((article) => article.audience === audience || article.audience === "both");
}

export function findArticle(id: string) {
  return HELP_ARTICLES.find((article) => article.id === id);
}

export const ROLE_HELP: Record<Role, string> = {
  admin:
    "Admin has every right: every module, user management, lifecycle, invoices, payments, and automations.",
  leadership:
    "Leadership can see almost the whole workspace, edit strategy, ideas, portfolios, risks, dependencies, and gates, and see financials. Leadership cannot manage users, run automations, or record invoice payment.",
  pm: "Project Managers own delivery: projects, plan, team, files, invoices, time approval, and ideas. They can view Users & roles but cannot add or edit people. They cannot configure lifecycle or automations.",
  finance:
    "Finance owns companies commercially: billing, retainers, expenses, payments, and time approval. Finance cannot open Strategy, Ideas, Portfolios, Work, Tickets, Risks, or Automations, and cannot edit a project plan.",
  staff:
    "Staff works assigned tasks, tickets, and their own timesheets. They can submit ideas and expenses. They cannot create projects or companies, open Billing or Reports, or manage users. Budgets stay Hidden unless an Admin grants rates and budgets.",
  client:
    "Client contacts use the portal only: shared projects, tickets, billing, and retainers for their company.",
};
