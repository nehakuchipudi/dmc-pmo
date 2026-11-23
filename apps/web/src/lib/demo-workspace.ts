import {
  DMC_CONSULTING_NAME,
  DMC_INTERNAL_PROJECT_ID,
  DMC_INTERNAL_PROJECT_NAME,
  DMC_MANAGER_NAME,
  withDmcInternalExample,
} from "./dmc-internal-project";
import {
  SAN_ANGELO_COMPANY_ID,
  SAN_ANGELO_COMPANY_NAME,
  SAN_ANGELO_PROJECT_ID,
  SAN_ANGELO_PROJECT_NAME,
  withSanAngeloExample,
} from "./san-angelo";
import { initialsFromName } from "./seed";
import {
  addDaysIso,
  DEFAULT_INSTANCES,
  type FieldClock,
  type RecurringService,
  type ServiceDocument,
  type WorkOrder,
  type WorkspaceInstance,
  type PromotionalTrial,
} from "./service-ops";
import { startOfWeek, todayIso } from "./timesheet";
import type {
  ActivityItem,
  AutomationRule,
  Benefit,
  BillMaterial,
  Company,
  CompanyAsset,
  Contact,
  CrossDependency,
  EmailOutboxItem,
  Expense,
  GovernanceGate,
  Idea,
  Invoice,
  IssueItem,
  Milestone,
  NotificationItem,
  Opportunity,
  Portfolio,
  Project,
  Purchase,
  ResourceAllocation,
  Retainer,
  RetainerPeriod,
  RiskItem,
  StrategicObjective,
  Task,
  TeamMember,
  Ticket,
  TicketMessage,
  TimeEntry,
} from "./types";

export const DEMO_WORKSPACE_GENERATION = "dmc-only-v1";

export type DemoWorkspaceState = {
  demoWorkspaceGeneration?: string;
  companies: Company[];
  companyAssets: CompanyAsset[];
  contacts: Contact[];
  projects: Project[];
  milestones: Milestone[];
  tickets: Ticket[];
  ticketMessages: TicketMessage[];
  tasks: Task[];
  team: TeamMember[];
  invoices: Invoice[];
  timeEntries: TimeEntry[];
  notifications: NotificationItem[];
  activities: ActivityItem[];
  retainers: Retainer[];
  retainerPeriods: RetainerPeriod[];
  automations: AutomationRule[];
  emailOutbox: EmailOutboxItem[];
  expenses: Expense[];
  purchases: Purchase[];
  billMaterials: BillMaterial[];
  opportunities: Opportunity[];
  objectives: StrategicObjective[];
  ideas: Idea[];
  portfolios: Portfolio[];
  risks: RiskItem[];
  issues: IssueItem[];
  dependencies: CrossDependency[];
  benefits: Benefit[];
  gates: GovernanceGate[];
  allocations: ResourceAllocation[];
  workOrders: WorkOrder[];
  recurringServices: RecurringService[];
  serviceDocuments: ServiceDocument[];
  fieldClocks: FieldClock[];
  workspaceInstances: WorkspaceInstance[];
  promotionalTrial: PromotionalTrial;
  recentlyViewed?: { type: string; id: string; label: string }[];
  focusCompanyId?: string | null;
};

function sameName(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function upsertById<T extends { id: string }>(current: T[], extras: T[]): T[] {
  if (!extras.length) return current;
  const ids = new Set(current.map((row) => row.id));
  const add = extras.filter((row) => row.id && !ids.has(row.id));
  return add.length ? [...current, ...add] : current;
}

function weekDates() {
  const weekStart = startOfWeek(todayIso());
  return {
    today: todayIso(),
    weekStart,
    mon: weekStart,
    tue: addDaysIso(weekStart, 1),
    wed: addDaysIso(weekStart, 2),
    thu: addDaysIso(weekStart, 3),
    fri: addDaysIso(weekStart, 4),
  };
}

function demoServiceOps(company: Company) {
  const { today, tue, wed, fri } = weekDates();
  const dmc = { id: company.id, name: company.name };
  const workOrders: WorkOrder[] = [
    {
      id: "wo-dmc-wifi",
      title: "Office wifi health check",
      companyId: dmc.id,
      companyName: dmc.name,
      assignee: "Dillon Morgan",
      priority: "Medium",
      status: "Scheduled",
      scheduled: fri,
      notes: "Confirm guest and staff SSIDs before Monday standup.",
    },
    {
      id: "wo-dmc-hvac",
      title: "Server room HVAC inspection",
      companyId: dmc.id,
      companyName: dmc.name,
      assignee: DMC_MANAGER_NAME,
      priority: "High",
      status: "In progress",
      scheduled: today,
      notes: "Log temperatures and replace the intake filter.",
    },
    {
      id: "wo-dmc-camera",
      title: "Lobby camera swap",
      companyId: dmc.id,
      companyName: dmc.name,
      assignee: DMC_MANAGER_NAME,
      priority: "Low",
      status: "Completed",
      scheduled: tue,
      notes: "Old unit returned to storage.",
    },
    {
      id: "wo-dmc-access",
      title: "Office access badge reset",
      companyId: dmc.id,
      companyName: dmc.name,
      assignee: DMC_MANAGER_NAME,
      priority: "High",
      status: "Pending approval",
      scheduled: wed,
      notes: "Waiting on Dillon Morgan sign-off after the badge reader swap.",
    },
  ];
  const recurringServices: RecurringService[] = [
    {
      id: "rs-dmc-aws",
      title: "Monthly AWS cost review",
      companyId: dmc.id,
      companyName: dmc.name,
      frequency: "Monthly",
      nextOn: addDaysIso(today, 5),
      assignee: DMC_MANAGER_NAME,
      paused: false,
    },
  ];
  const serviceDocuments: ServiceDocument[] = [
    {
      id: "sd-dmc-runbook",
      name: "DMC field runbook.pdf",
      companyId: dmc.id,
      companyName: dmc.name,
      kind: "PDF",
      added: tue,
    },
  ];
  const fieldClocks: FieldClock[] = [
    {
      id: "fc-live",
      memberName: DMC_MANAGER_NAME,
      startedAt: `${today}T08:15:00`,
    },
  ];
  return { workOrders, recurringServices, serviceDocuments, fieldClocks };
}

function dmcPlayRecords(state: DemoWorkspaceState): DemoWorkspaceState {
  const company = state.companies.find((row) => sameName(row.name, DMC_CONSULTING_NAME));
  const project = state.projects.find(
    (row) => row.id === DMC_INTERNAL_PROJECT_ID || sameName(row.name, DMC_INTERNAL_PROJECT_NAME),
  );
  if (!company || !project) return state;
  const contact = state.contacts.find((row) => row.companyId === company.id);
  const { today, mon, tue, wed, thu, fri } = weekDates();

  const tickets: Ticket[] = [
    {
      id: "t-dmc-login",
      number: 1101,
      subject: "Invite email not arriving",
      companyId: company.id,
      companyName: company.name,
      projectId: project.id,
      priority: "High",
      assignee: DMC_MANAGER_NAME,
      slaDue: "4h",
      status: "In Progress",
      submitted: tue,
    },
    {
      id: "t-dmc-report",
      number: 1102,
      subject: "Weekly brief chart labels",
      companyId: company.id,
      companyName: company.name,
      projectId: project.id,
      priority: "Low",
      assignee: DMC_MANAGER_NAME,
      slaDue: "2d",
      status: "Open",
      submitted: today,
    },
  ];
  const ticketMessages: TicketMessage[] = [
    {
      id: "tm-dmc-1",
      ticketId: "t-dmc-login",
      author: "Mzee Dillon",
      body: "Two new users did not receive the invite after we added them.",
      createdAt: `${tue} 09:40`,
      visibility: "client",
    },
    {
      id: "tm-dmc-2",
      ticketId: "t-dmc-login",
      author: DMC_MANAGER_NAME,
      body: "Checking the mail domain and resending from the Users screen.",
      createdAt: `${tue} 10:15`,
      visibility: "internal",
    },
  ];
  const timeEntries: TimeEntry[] = [
    {
      id: "te-dmc-mon",
      userName: DMC_MANAGER_NAME,
      projectId: project.id,
      projectName: project.name,
      taskId: "tk-dmc-cognito",
      taskName: "Set up Cognito user pool",
      workKind: "task",
      date: mon,
      start: "09:00",
      hours: 6,
      billable: false,
      note: "Cognito pool and app client",
      status: "Approved",
    },
    {
      id: "te-dmc-tue",
      userName: DMC_MANAGER_NAME,
      projectId: project.id,
      projectName: project.name,
      taskId: "tk-dmc-login",
      taskName: "Integrate frontend login page",
      workKind: "task",
      date: tue,
      start: "08:30",
      hours: 5,
      billable: false,
      note: "Login page wiring",
      status: "Submitted",
    },
    {
      id: "te-dmc-wed",
      userName: "Dillon Morgan",
      projectId: project.id,
      projectName: project.name,
      milestoneId: "ms-dmc-design",
      milestoneName: "Design UI/UX + Wireframes",
      workKind: "phase",
      date: wed,
      start: "10:00",
      hours: 3,
      billable: false,
      note: "Wireframe review",
      status: "Draft",
    },
    {
      id: "te-dmc-thu",
      userName: DMC_MANAGER_NAME,
      projectId: project.id,
      projectName: project.name,
      workKind: "project",
      date: thu,
      start: "09:00",
      hours: 4,
      billable: false,
      note: "Internal delivery plan review",
      status: "Submitted",
    },
    {
      id: "te-dmc-fri",
      userName: DMC_MANAGER_NAME,
      projectId: project.id,
      projectName: project.name,
      workKind: "project",
      date: fri,
      start: "08:00",
      hours: 2,
      billable: false,
      note: "Friday standup notes",
      status: "Draft",
    },
  ];
  const invoices: Invoice[] = [
    {
      id: "inv-dmc-1001",
      number: "INV-1001",
      companyId: company.id,
      companyName: company.name,
      amount: 7400,
      terms: "Net 30",
      due: addDaysIso(today, 20),
      status: "Draft",
      projectId: project.id,
      title: "DMC Internal Project (Nov)",
      owner: DMC_MANAGER_NAME,
      billToContactId: contact?.id,
      billToName: contact?.name,
      currency: "USD",
      raised: today,
      templateId: "tpl-progress",
      description: "November progress on DMC Internal Project.",
      lineItems: [
        { id: "il-dmc-1", kind: "service", description: "Internal delivery", amount: 6400, includeInPdf: true },
        { id: "il-dmc-2", kind: "expense", description: "AWS sandbox", amount: 1000, includeInPdf: true },
      ],
    },
    {
      id: "inv-dmc-1002",
      number: "INV-1002",
      companyId: company.id,
      companyName: company.name,
      amount: 21000,
      terms: "Net 30",
      due: addDaysIso(today, 2),
      status: "Sent",
      projectId: project.id,
      title: "Invoice 3: Strategic Planning",
      owner: DMC_MANAGER_NAME,
      billToContactId: contact?.id,
      billToName: contact?.name,
      currency: "USD",
      raised: addDaysIso(today, -28),
      description: "Strategic planning progress billing.",
      lineItems: [{ id: "il-dmc-3", kind: "service", description: "Strategic planning", amount: 21000, includeInPdf: true }],
      attachDeliverables: true,
      deliverableDocs: [
        {
          id: "f-dmc-plan",
          name: "DMC_Project_Plan.pdf",
          kind: "pdf",
          sizeKb: 420,
          folder: "Deliverables",
          source: "project",
          fileId: "f-dmc-plan",
        },
      ],
    },
    {
      id: "inv-dmc-1003",
      number: "INV-1003",
      companyId: company.id,
      companyName: company.name,
      amount: 24000,
      terms: "Net 30",
      due: addDaysIso(today, -36),
      status: "Overdue",
      projectId: project.id,
      title: "Invoice 2: DMC Internal Project",
      owner: DMC_MANAGER_NAME,
      billToContactId: contact?.id,
      billToName: contact?.name,
      currency: "USD",
      raised: addDaysIso(today, -66),
      description: "Earlier internal project billing.",
      lineItems: [{ id: "il-dmc-4", kind: "service", description: "Internal delivery", amount: 24000, includeInPdf: true }],
    },
    {
      id: "inv-dmc-1004",
      number: "INV-1004",
      companyId: company.id,
      companyName: company.name,
      amount: 35000,
      terms: "Net 30",
      due: addDaysIso(today, 0),
      status: "Paid",
      projectId: project.id,
      title: "Invoice: Procurement & Governance",
      owner: DMC_MANAGER_NAME,
      currency: "USD",
      raised: addDaysIso(today, -51),
      payments: [{ id: "pay-dmc-1", date: addDaysIso(today, -21), description: "Payment", amount: 35000 }],
      lineItems: [{ id: "il-dmc-5", kind: "service", description: "Procurement support", amount: 35000, includeInPdf: true }],
    },
  ];
  const retainers: Retainer[] = [
    {
      id: "r-dmc",
      companyId: company.id,
      companyName: company.name,
      name: "DMC Platform Support",
      type: "Monthly T&M",
      manager: DMC_MANAGER_NAME,
      contactId: contact?.id,
      contactName: contact?.name,
      periodLabel: "Nov 1 to Nov 30, 2026",
      usedHours: 18,
      budgetHours: 40,
      status: "Active",
      autoRenew: true,
      started: "2026-06-01",
      nextRenew: "2026-11-30",
      rate: 185,
      expires: "2027-05-31",
      openPeriods: 1,
      files: [],
      notes: [],
      periodDurationKind: "Fixed",
      periodLength: 1,
      periodUnit: "Month",
      periodBilling: "In arrears",
      periodAllowance: "Fixed hours",
    },
  ];
  const retainerPeriods: RetainerPeriod[] = [
    {
      id: "rp-dmc-nov",
      retainerId: "r-dmc",
      start: "2026-11-01",
      end: "2026-11-30",
      status: "Opened",
      usedHours: 18,
      budgetHours: 40,
    },
  ];
  const expenses: Expense[] = [
    {
      id: "ex-dmc-aws",
      vendor: "Amazon Web Services",
      projectId: project.id,
      projectName: project.name,
      amount: 186,
      status: "Pending",
      date: wed,
      note: "Sandbox account",
      userName: DMC_MANAGER_NAME,
      title: "AWS sandbox",
      type: "Other",
      companyId: company.id,
      companyName: company.name,
      owner: DMC_MANAGER_NAME,
    },
  ];
  const purchases: Purchase[] = [
    {
      id: "po-dmc-laptops",
      title: "Developer laptops",
      vendor: "Apple",
      amount: 4298,
      date: mon,
      status: "Open",
      owner: "Dillon Morgan",
      note: "Two 14-inch machines for the new hires.",
      companyId: company.id,
      companyName: company.name,
      projectId: project.id,
      projectName: project.name,
    },
  ];
  const billMaterials: BillMaterial[] = [
    {
      id: "bm-dmc-badge",
      title: "Access badges",
      qty: 12,
      purchasePrice: 8,
      salePrice: 18,
      date: tue,
      sku: "BDG-14",
      companyId: company.id,
      companyName: company.name,
      projectId: project.id,
      projectName: project.name,
    },
  ];
  const opportunities: Opportunity[] = [
    {
      id: "o-dmc-expand",
      name: "DMC PMO expansion",
      companyId: company.id,
      companyName: company.name,
      stage: "Propose",
      amount: 54000,
      close: addDaysIso(today, 21),
    },
  ];
  const ideas: Idea[] = [
    {
      id: "idea-dmc-self-serve",
      name: "Employee self-serve time",
      companyId: company.id,
      companyName: company.name,
      submitter: "Dillon Morgan",
      stage: "In Progress",
      score: 74,
      strategicFit: 8,
      valueScore: 7,
      riskScore: 3,
      objectiveId: "so-ops",
      requestedBudget: 16000,
      summary: "Let staff log and submit time from the employee portal without a PM.",
    },
  ];
  const risks: RiskItem[] = [
    {
      id: "rk-dmc-mail",
      title: "Invite mail domain not verified",
      projectId: project.id,
      owner: DMC_MANAGER_NAME,
      probability: "Medium",
      impact: "High",
      status: "Mitigating",
      due: addDaysIso(today, 7),
      mitigation: "Finish DNS records and resend the two pending invites.",
    },
  ];
  const issues: IssueItem[] = [
    {
      id: "is-dmc-login",
      title: "Login page copy still shows placeholder",
      projectId: project.id,
      owner: "J. Kim",
      severity: "Low",
      status: "Open",
      raised: tue,
    },
  ];
  const allocations: ResourceAllocation[] = [
    {
      id: "al-dmc-ah",
      memberId: "tm-ah",
      memberName: DMC_MANAGER_NAME,
      projectId: project.id,
      projectName: project.name,
      allocationPct: 60,
      hoursPerWeek: 24,
      start: "2026-11-01",
      end: "2026-12-31",
      projectRole: "Project Manager",
      responsibility: "Internal delivery plan",
    },
    {
      id: "al-dmc-md",
      memberId: "tm-ah",
      memberName: DMC_MANAGER_NAME,
      projectId: project.id,
      projectName: project.name,
      allocationPct: 25,
      hoursPerWeek: 10,
      start: "2026-10-01",
      end: "2026-12-15",
      projectRole: "Delivery Lead",
      responsibility: "Weekly brief",
    },
  ];
  const notifications: NotificationItem[] = [
    {
      id: "n-dmc-invite",
      title: "Invite mail still pending",
      body: "Two DMC Internal Project users have not confirmed login.",
      createdAt: `${today} 08:12`,
      read: false,
      href: "/app/tickets/",
    },
    {
      id: "n-dmc-time",
      title: "Draft time this week",
      body: "Dillon Morgan has 3 hours in Draft on DMC Internal Project.",
      createdAt: `${today} 07:40`,
      read: false,
      href: "/app/timesheets/",
    },
  ];
  const activities: ActivityItem[] = [
    {
      id: "a-dmc-1",
      companyId: company.id,
      projectId: project.id,
      when: `${wed} 16:20`,
      text: `${DMC_MANAGER_NAME} marked Implement Authentication & Login as in progress.`,
      type: "status",
      actor: DMC_MANAGER_NAME,
      action: "updated",
      entityType: "milestone",
      entityId: "ms-dmc-auth",
      entityLabel: "Implement Authentication & Login",
      href: `/app/projects/view/?id=${project.id}`,
    },
    {
      id: "a-dmc-2",
      companyId: company.id,
      projectId: project.id,
      when: `${thu} 11:05`,
      text: `${DMC_MANAGER_NAME} added a note on ${project.name}.`,
      type: "comment",
      actor: DMC_MANAGER_NAME,
      action: "commented",
      entityType: "project",
      entityId: project.id,
      entityLabel: project.name,
      href: `/app/projects/view/?id=${project.id}`,
    },
  ];
  const service = demoServiceOps(company);

  const companies = state.companies.map((row) =>
    row.id === company.id
      ? {
          ...row,
          openProjects: Math.max(row.openProjects, 1),
          openTickets: Math.max(row.openTickets, 2),
          lastActivity: "Nov 13, 2026",
          initials: row.initials || initialsFromName(row.name),
        }
      : row,
  );

  return {
    ...state,
    companies,
    tickets: upsertById(state.tickets, tickets),
    ticketMessages: upsertById(state.ticketMessages, ticketMessages),
    timeEntries: upsertById(state.timeEntries, timeEntries),
    invoices: upsertById(state.invoices, invoices),
    retainers: upsertById(state.retainers, retainers),
    retainerPeriods: upsertById(state.retainerPeriods, retainerPeriods),
    expenses: upsertById(state.expenses, expenses),
    purchases: upsertById(state.purchases, purchases),
    billMaterials: upsertById(state.billMaterials, billMaterials),
    opportunities: upsertById(state.opportunities, opportunities),
    ideas: upsertById(state.ideas, ideas),
    risks: upsertById(state.risks, risks),
    issues: upsertById(state.issues, issues),
    allocations: upsertById(state.allocations, allocations),
    notifications: upsertById(state.notifications, notifications),
    activities: upsertById(state.activities, activities),
    workOrders: upsertById(state.workOrders, service.workOrders),
    recurringServices: upsertById(state.recurringServices, service.recurringServices),
    serviceDocuments: upsertById(state.serviceDocuments, service.serviceDocuments),
    fieldClocks: upsertById(state.fieldClocks, service.fieldClocks),
    workspaceInstances: state.workspaceInstances.length ? state.workspaceInstances : DEFAULT_INSTANCES,
    promotionalTrial:
      state.promotionalTrial.active || state.promotionalTrial.used > 0
        ? state.promotionalTrial
        : { days: 30, slots: 3, used: 1, active: true, startedOn: addDaysIso(today, -4) },
  };
}

const REMOVED_COMPANY_IDS = new Set([
  "c-northridge",
  "c-harlow",
  "c-oakton",
  "c-cascade",
  "c-bellweather",
  "c-rowlett",
  "c-trinity",
  "c-roadway",
  "c-melissa",
]);
const REMOVED_PROJECT_IDS = new Set([
  "p-warehouse",
  "p-website",
  "p-vendor",
  "p-fleet",
  "p-pos",
  "p-melissa-dev",
  "p-sidewalk",
  "p-dmc-playbook",
]);

function hrefId(href?: string) {
  if (!href) return;
  const match = href.match(/[?&]id=([^&/#]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function retainLinkedRecords(
  state: DemoWorkspaceState,
  companies: Company[],
  projects: Project[],
  instanceMode: "dmc-only" | "keep-non-rowlett",
): DemoWorkspaceState {
  const companyIds = new Set(companies.map((row) => row.id));
  const projectIds = new Set(projects.map((row) => row.id));
  const contacts = state.contacts
    .filter((row) => companyIds.has(row.companyId))
    .map((row) => ({ ...row, projectIds: row.projectIds?.filter((id) => projectIds.has(id)) }));
  const tickets = state.tickets.filter(
    (row) => companyIds.has(row.companyId) && (!row.projectId || projectIds.has(row.projectId)),
  );
  const ticketIds = new Set(tickets.map((row) => row.id));
  const retainers = state.retainers.filter((row) => companyIds.has(row.companyId));
  const retainerIds = new Set(retainers.map((row) => row.id));
  const invoices = state.invoices.filter(
    (row) => companyIds.has(row.companyId) && (!row.projectId || projectIds.has(row.projectId)),
  );
  const milestones = state.milestones.filter((row) => projectIds.has(row.projectId));
  const tasks = state.tasks.filter((row) => projectIds.has(row.projectId));
  const timeEntries = state.timeEntries.filter((row) => projectIds.has(row.projectId));
  const allocations = state.allocations.filter((row) => projectIds.has(row.projectId));
  const workOrders = state.workOrders.filter((row) => companyIds.has(row.companyId));
  const keepNames = new Set(
    [
      DMC_MANAGER_NAME,
      "Dillon Morgan",
      ...companies.map((row) => row.accountManager),
      ...projects.map((row) => row.manager),
      ...tasks.map((row) => row.assignee),
      ...tickets.map((row) => row.assignee),
      ...allocations.map((row) => row.memberName),
      ...workOrders.map((row) => row.assignee),
      ...timeEntries.map((row) => row.userName),
    ].filter((name): name is string => Boolean(name)),
  );
  const team = state.team.filter((row) => keepNames.has(row.name) || row.id === "tm-ah");
  const teamIds = new Set(team.map((row) => row.id));
  const sourceInstances = state.workspaceInstances.length ? state.workspaceInstances : DEFAULT_INSTANCES;
  const workspaceInstances = sourceInstances.filter((row) => {
    if (row.id === "inst-rowlett") return false;
    if (instanceMode === "dmc-only") return row.id === "inst-dmc" || sameName(row.name, "Dillon Morgan");
    return true;
  });

  return {
    ...state,
    companies,
    projects,
    contacts,
    companyAssets: state.companyAssets.filter(
      (row) => companyIds.has(row.companyId) && (!row.projectId || projectIds.has(row.projectId)),
    ),
    milestones,
    tickets,
    ticketMessages: state.ticketMessages.filter((row) => ticketIds.has(row.ticketId)),
    tasks,
    team,
    invoices,
    timeEntries,
    notifications: state.notifications.filter((row) => {
      const id = hrefId(row.href);
      if (!id) return true;
      const href = row.href ?? "";
      if (href.includes("/companies/")) return companyIds.has(id);
      if (href.includes("/projects/")) return projectIds.has(id);
      return true;
    }),
    activities: state.activities.filter(
      (row) =>
        (!row.companyId || companyIds.has(row.companyId)) && (!row.projectId || projectIds.has(row.projectId)),
    ),
    retainers,
    retainerPeriods: state.retainerPeriods.filter((row) => retainerIds.has(row.retainerId)),
    expenses: state.expenses.filter(
      (row) => projectIds.has(row.projectId) || (!!row.companyId && companyIds.has(row.companyId)),
    ),
    purchases: state.purchases.filter(
      (row) =>
        (!row.companyId || companyIds.has(row.companyId)) && (!row.projectId || projectIds.has(row.projectId)),
    ),
    billMaterials: state.billMaterials.filter(
      (row) =>
        (!row.companyId || companyIds.has(row.companyId)) && (!row.projectId || projectIds.has(row.projectId)),
    ),
    opportunities: state.opportunities.filter((row) => companyIds.has(row.companyId)),
    ideas: state.ideas.filter(
      (row) =>
        (!row.companyId || companyIds.has(row.companyId)) &&
        (!row.convertedProjectId || projectIds.has(row.convertedProjectId)),
    ),
    portfolios: state.portfolios
      .map((row) => ({ ...row, projectIds: row.projectIds.filter((id) => projectIds.has(id)) }))
      .filter((row) => row.projectIds.length > 0),
    risks: state.risks.filter((row) => !row.projectId || projectIds.has(row.projectId)),
    issues: state.issues.filter((row) => projectIds.has(row.projectId)),
    dependencies: state.dependencies.filter(
      (row) => projectIds.has(row.predecessorProjectId) && projectIds.has(row.successorProjectId),
    ),
    benefits: state.benefits.filter((row) => !row.projectId || projectIds.has(row.projectId)),
    gates: state.gates.filter((row) => projectIds.has(row.projectId)),
    allocations: allocations.filter((row) => !row.memberId || teamIds.has(row.memberId) || keepNames.has(row.memberName)),
    workOrders,
    recurringServices: state.recurringServices.filter((row) => companyIds.has(row.companyId)),
    serviceDocuments: state.serviceDocuments.filter((row) => companyIds.has(row.companyId)),
    fieldClocks: state.fieldClocks.filter((row) => keepNames.has(row.memberName)),
    workspaceInstances: workspaceInstances.length ? workspaceInstances : DEFAULT_INSTANCES,
    recentlyViewed: (state.recentlyViewed ?? []).filter((row) => {
      if (row.type === "company") return companyIds.has(row.id);
      if (row.type === "project") return projectIds.has(row.id);
      if (row.type === "contact") return contacts.some((contact) => contact.id === row.id);
      return true;
    }),
    focusCompanyId:
      state.focusCompanyId && companyIds.has(state.focusCompanyId) ? state.focusCompanyId : null,
  };
}

function pruneToDmcInternal(state: DemoWorkspaceState): DemoWorkspaceState {
  const company =
    state.companies.find((row) => sameName(row.name, DMC_CONSULTING_NAME)) ??
    state.companies.find((row) => row.id === "c-dmc");
  const project = state.projects.find(
    (row) => row.id === DMC_INTERNAL_PROJECT_ID || sameName(row.name, DMC_INTERNAL_PROJECT_NAME),
  );
  if (!company || !project) return state;
  const sanCompany =
    state.companies.find((row) => sameName(row.name, SAN_ANGELO_COMPANY_NAME)) ??
    state.companies.find((row) => row.id === SAN_ANGELO_COMPANY_ID);
  const sanProject = state.projects.find(
    (row) => row.id === SAN_ANGELO_PROJECT_ID || sameName(row.name, SAN_ANGELO_PROJECT_NAME),
  );
  const companies = [
    { ...company, openProjects: Math.max(company.openProjects, 1) },
    ...(sanCompany ? [{ ...sanCompany, openProjects: Math.max(sanCompany.openProjects, sanProject ? 1 : 0) }] : []),
  ];
  const projects = [
    { ...project, companyId: company.id, companyName: company.name },
    ...(sanCompany && sanProject
      ? [{ ...sanProject, companyId: sanCompany.id, companyName: sanCompany.name }]
      : []),
  ];
  return retainLinkedRecords(state, companies, projects, "dmc-only");
}

function stripRemovedDemo(state: DemoWorkspaceState): DemoWorkspaceState {
  const companies = state.companies.filter((row) => !REMOVED_COMPANY_IDS.has(row.id));
  const projects = state.projects.filter(
    (row) => !REMOVED_PROJECT_IDS.has(row.id) && !REMOVED_COMPANY_IDS.has(row.companyId),
  );
  const dropRowlett = state.workspaceInstances.some((row) => row.id === "inst-rowlett");
  const dropRecent = (state.recentlyViewed ?? []).some(
    (row) =>
      (row.type === "company" && REMOVED_COMPANY_IDS.has(row.id)) ||
      (row.type === "project" && REMOVED_PROJECT_IDS.has(row.id)),
  );
  const dropFocus = Boolean(state.focusCompanyId && REMOVED_COMPANY_IDS.has(state.focusCompanyId));
  if (
    companies.length === state.companies.length &&
    projects.length === state.projects.length &&
    !dropRowlett &&
    !dropRecent &&
    !dropFocus
  ) {
    return state;
  }
  return retainLinkedRecords(state, companies, projects, "keep-non-rowlett");
}

export function emptyDemoState(): DemoWorkspaceState {
  return {
    companies: [],
    companyAssets: [],
    contacts: [],
    projects: [],
    milestones: [],
    tickets: [],
    ticketMessages: [],
    tasks: [],
    team: [],
    invoices: [],
    timeEntries: [],
    notifications: [],
    activities: [],
    retainers: [],
    retainerPeriods: [],
    automations: [],
    emailOutbox: [],
    expenses: [],
    purchases: [],
    billMaterials: [],
    opportunities: [],
    objectives: [],
    ideas: [],
    portfolios: [],
    risks: [],
    issues: [],
    dependencies: [],
    benefits: [],
    gates: [],
    allocations: [],
    workOrders: [],
    recurringServices: [],
    serviceDocuments: [],
    fieldClocks: [],
    workspaceInstances: [],
    promotionalTrial: { days: 30, slots: 3, used: 0, active: false },
  };
}

export function withDemoWorkspace(input: DemoWorkspaceState): DemoWorkspaceState | null {
  const dmc = withDmcInternalExample({
    companies: input.companies,
    contacts: input.contacts,
    projects: input.projects,
    milestones: input.milestones,
    tasks: input.tasks,
    team: input.team,
  });
  let next: DemoWorkspaceState = dmc ? { ...input, ...dmc } : { ...input };
  let changed = Boolean(dmc);

  const sanAngelo = withSanAngeloExample({
    companies: next.companies,
    contacts: next.contacts,
    projects: next.projects,
    milestones: next.milestones,
    tasks: next.tasks,
    team: next.team,
    allocations: next.allocations,
    timeEntries: next.timeEntries,
  });
  if (sanAngelo) {
    next = { ...next, ...sanAngelo };
    changed = true;
  }

  if (next.demoWorkspaceGeneration !== DEMO_WORKSPACE_GENERATION) {
    next = pruneToDmcInternal(dmcPlayRecords(next));
    next.demoWorkspaceGeneration = DEMO_WORKSPACE_GENERATION;
    changed = true;
  }

  const stripped = stripRemovedDemo(next);
  if (stripped !== next) {
    next = stripped;
    changed = true;
  }

  return changed ? next : null;
}
