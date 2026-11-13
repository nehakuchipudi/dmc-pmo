import {
  demoActivities,
  demoAutomations,
  demoCompanies,
  demoCompanyAssets,
  demoContacts,
  demoEmailOutbox,
  demoExpenses,
  demoInvoices,
  demoMilestones,
  demoNotifications,
  demoOpportunities,
  demoProjects,
  demoRetainerPeriods,
  demoRetainers,
  demoTasks,
  demoTicketMessages,
  demoTickets,
  demoTimeEntries,
} from "./demo-catalog";
import {
  demoAllocations,
  demoBenefits,
  demoDependencies,
  demoGates,
  demoIdeas,
  demoIssues,
  demoObjectives,
  demoPortfolios,
  demoRisks,
} from "./demo-ppm";
import {
  DMC_CONSULTING_NAME,
  DMC_INTERNAL_PROJECT_ID,
  DMC_INTERNAL_PROJECT_NAME,
  DMC_MANAGER_NAME,
  withDmcInternalExample,
} from "./dmc-internal-project";
import { DEFAULT_PACKS } from "./modules";
import { nextProjectNumber } from "./ppm";
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

export const DEMO_WORKSPACE_GENERATION = "play-v1";

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

function demoServiceOps(company: Company, cascade?: Company) {
  const { today, tue, wed, thu, fri } = weekDates();
  const dmc = { id: company.id, name: company.name };
  const other = cascade ? { id: cascade.id, name: cascade.name } : dmc;
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
      id: "wo-cascade-dock",
      title: "Dock door sensor reset",
      companyId: other.id,
      companyName: other.name,
      assignee: "S. Ahmed",
      priority: "Critical",
      status: "Pending approval",
      scheduled: wed,
      notes: "Sensor swapped. Waiting on client sign-off.",
    },
    {
      id: "wo-dmc-camera",
      title: "Lobby camera swap",
      companyId: dmc.id,
      companyName: dmc.name,
      assignee: "J. Kim",
      priority: "Low",
      status: "Completed",
      scheduled: tue,
      notes: "Old unit returned to storage.",
    },
    {
      id: "wo-cascade-badge",
      title: "Badge reader firmware",
      companyId: other.id,
      companyName: other.name,
      assignee: "S. Cho",
      priority: "Medium",
      status: "Sent back",
      scheduled: thu,
      notes: "Firmware failed checksum. Reschedule with spare reader.",
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
    {
      id: "rs-cascade-backup",
      title: "Weekly warehouse backup test",
      companyId: other.id,
      companyName: other.name,
      frequency: "Weekly",
      nextOn: addDaysIso(today, 2),
      assignee: "J. Kim",
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
    {
      id: "sd-cascade-layout",
      name: "Dock layout.jpg",
      companyId: other.id,
      companyName: other.name,
      kind: "Image",
      added: wed,
    },
  ];
  const fieldClocks: FieldClock[] = [
    {
      id: "fc-live",
      memberName: DMC_MANAGER_NAME,
      startedAt: `${today}T08:15:00`,
    },
    {
      id: "fc-done",
      memberName: "J. Kim",
      startedAt: `${tue}T09:00:00`,
      stoppedAt: `${tue}T12:30:00`,
      hours: 3.5,
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
  const cascade = state.companies.find((row) => row.id === "c-cascade");

  let projects = [...state.projects];
  if (!projects.some((row) => row.id === "p-dmc-playbook")) {
    projects.push({
      id: "p-dmc-playbook",
      number: nextProjectNumber(projects),
      name: "PMO Operating Picture",
      companyId: company.id,
      companyName: company.name,
      manager: "M. Doyle",
      progress: 42,
      status: "Active",
      start: "2026-10-01",
      due: "2026-12-15",
      budgetHours: 240,
      loggedHours: 86,
      marginPct: 33,
      portalShared: true,
      portalContacts: 1,
      projectType: "Client Work",
      description: "Weekly operating picture, reports, and briefing pack for DMC leadership.",
      budgetAmount: 48000,
      materials: [],
      files: [],
      notes: [
        {
          id: "pn-dmc-1",
          author: "M. Doyle",
          body: "Keep the Friday briefing under two pages.",
          createdAt: "Nov 7, 2026",
          visibility: "internal",
        },
      ],
      rates: [{ memberName: DMC_MANAGER_NAME, hourlyRate: 185 }],
      statusHistory: [],
      scope: {
        objectives: "Give leadership a live view of delivery, time, and invoices.",
        inScope: ["Weekly brief", "Module walkthroughs", "Sample invoices"],
        outOfScope: ["Client portal branding"],
        deliverables: ["Operating picture", "Sample reports"],
        assumptions: ["Team roster stays current"],
      },
      contactId: contact?.id,
      contactName: contact?.name,
    });
  }

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
      projectId: "p-dmc-playbook",
      priority: "Low",
      assignee: "M. Doyle",
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
      userName: "J. Kim",
      projectId: "p-dmc-playbook",
      projectName: "PMO Operating Picture",
      workKind: "project",
      date: thu,
      start: "09:00",
      hours: 4,
      billable: true,
      note: "Report pack draft",
      status: "Submitted",
    },
    {
      id: "te-dmc-fri",
      userName: "M. Doyle",
      projectId: "p-dmc-playbook",
      projectName: "PMO Operating Picture",
      workKind: "project",
      date: fri,
      start: "08:00",
      hours: 2,
      billable: true,
      note: "Friday briefing",
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
      projectId: "p-dmc-playbook",
      title: "PMO Operating Picture (Nov)",
      owner: "J. Alvarez",
      billToContactId: contact?.id,
      billToName: contact?.name,
      currency: "USD",
      raised: today,
      templateId: "tpl-progress",
      description: "November progress on the operating picture.",
      lineItems: [
        { id: "il-dmc-1", kind: "service", description: "PMO operating picture", amount: 6400, includeInPdf: true },
        { id: "il-dmc-2", kind: "expense", description: "AWS sandbox", amount: 1000, includeInPdf: true },
      ],
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
      memberId: "tm-md",
      memberName: "M. Doyle",
      projectId: "p-dmc-playbook",
      projectName: "PMO Operating Picture",
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
      projectId: "p-dmc-playbook",
      when: `${thu} 11:05`,
      text: "M. Doyle added a note on PMO Operating Picture.",
      type: "comment",
      actor: "M. Doyle",
      action: "commented",
      entityType: "project",
      entityId: "p-dmc-playbook",
      entityLabel: "PMO Operating Picture",
      href: "/app/projects/view/?id=p-dmc-playbook",
    },
  ];
  const service = demoServiceOps(company, cascade);
  const extraInstances: WorkspaceInstance[] = [
    {
      id: "inst-rowlett",
      name: "Rowlett Field Ops",
      status: "Trial",
      packs: DEFAULT_PACKS,
      owner: "A. Chen",
    },
  ];

  const companies = state.companies.map((row) =>
    row.id === company.id
      ? {
          ...row,
          openProjects: Math.max(row.openProjects, projects.filter((item) => item.companyId === row.id && item.status !== "Completed" && item.status !== "Cancelled").length),
          openTickets: Math.max(row.openTickets, 2),
          lastActivity: "Nov 13, 2026",
          initials: row.initials || initialsFromName(row.name),
        }
      : row,
  );

  return {
    ...state,
    companies,
    projects,
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
    workspaceInstances: upsertById(state.workspaceInstances.length ? state.workspaceInstances : DEFAULT_INSTANCES, extraInstances),
    promotionalTrial:
      state.promotionalTrial.active || state.promotionalTrial.used > 0
        ? state.promotionalTrial
        : { days: 30, slots: 3, used: 1, active: true, startedOn: addDaysIso(today, -4) },
  };
}

function withCatalog(state: DemoWorkspaceState): DemoWorkspaceState {
  return {
    ...state,
    companies: upsertById(state.companies, demoCompanies),
    companyAssets: upsertById(state.companyAssets, demoCompanyAssets),
    contacts: upsertById(state.contacts, demoContacts),
    projects: upsertById(state.projects, demoProjects),
    milestones: upsertById(state.milestones, demoMilestones),
    tickets: upsertById(state.tickets, demoTickets),
    ticketMessages: upsertById(state.ticketMessages, demoTicketMessages),
    tasks: upsertById(state.tasks, demoTasks),
    invoices: upsertById(state.invoices, demoInvoices),
    timeEntries: upsertById(state.timeEntries, demoTimeEntries),
    notifications: upsertById(state.notifications, demoNotifications),
    activities: upsertById(state.activities, demoActivities),
    retainers: upsertById(state.retainers, demoRetainers),
    retainerPeriods: upsertById(state.retainerPeriods, demoRetainerPeriods),
    automations: upsertById(state.automations, demoAutomations),
    emailOutbox: upsertById(state.emailOutbox, demoEmailOutbox),
    expenses: upsertById(state.expenses, demoExpenses),
    opportunities: upsertById(state.opportunities, demoOpportunities),
    objectives: upsertById(state.objectives, demoObjectives),
    ideas: upsertById(state.ideas, demoIdeas),
    portfolios: upsertById(state.portfolios, demoPortfolios),
    risks: upsertById(state.risks, demoRisks),
    issues: upsertById(state.issues, demoIssues),
    dependencies: upsertById(state.dependencies, demoDependencies),
    benefits: upsertById(state.benefits, demoBenefits),
    gates: upsertById(state.gates, demoGates),
    allocations: upsertById(state.allocations, demoAllocations),
  };
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

  if (next.demoWorkspaceGeneration !== DEMO_WORKSPACE_GENERATION) {
    next = dmcPlayRecords(withCatalog(next));
    next.demoWorkspaceGeneration = DEMO_WORKSPACE_GENERATION;
    changed = true;
  }

  return changed ? next : null;
}
