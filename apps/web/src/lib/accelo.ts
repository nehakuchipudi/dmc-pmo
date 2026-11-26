import { initialsFromName } from "./seed";
import type {
  Company,
  Contact,
  Invoice,
  InvoiceStatus,
  Project,
  ProjectStatus,
  TeamMember,
  Ticket,
  TicketPriority,
  TicketStatus,
  TimeEntry,
} from "./types";

export const ACCELO_DEPLOYMENT = "dillon-morgan-consulting";
export const ACCELO_CLIENT_ID = "6e410b11e1@dillon-morgan-consulting.accelo.com";

export const ACCELO_RESOURCES = [
  "staff",
  "companies",
  "contacts",
  "affiliations",
  "jobs",
  "issues",
  "invoices",
  "activities",
] as const;

export type AcceloResource = (typeof ACCELO_RESOURCES)[number];

export type AcceloCompanyRow = { id: string; name: string; website?: string; phone?: string; notes?: string; status: Company["status"] };
export type AcceloStaffRow = { id: string; name: string; email?: string; title?: string; active: boolean };
export type AcceloContactRow = { id: string; name: string; email?: string; phone?: string; mobile?: string; title?: string; companyId?: string };
export type AcceloAffiliationRow = { contactId: string; companyId: string; email?: string; phone?: string; title?: string };
export type AcceloJobRow = {
  id: string;
  name: string;
  companyId?: string;
  companyName?: string;
  manager?: string;
  status: ProjectStatus;
  start?: string;
  due?: string;
  description?: string;
};
export type AcceloInvoiceRow = {
  id: string;
  number: string;
  title?: string;
  companyId?: string;
  companyName?: string;
  amount: number;
  outstanding: number;
  raised?: string;
  due?: string;
  status: InvoiceStatus;
};
export type AcceloIssueRow = {
  id: string;
  number: number;
  subject: string;
  companyId?: string;
  companyName?: string;
  priority: TicketPriority;
  assignee: string;
  status: TicketStatus;
  submitted?: string;
};
export type AcceloTimeRow = {
  id: string;
  staffId?: string;
  userName?: string;
  projectId?: string;
  projectName?: string;
  date?: string;
  hours: number;
  billable: boolean;
  note: string;
};

export type AcceloBatch = {
  companies?: AcceloCompanyRow[];
  staff?: AcceloStaffRow[];
  contacts?: AcceloContactRow[];
  affiliations?: AcceloAffiliationRow[];
  jobs?: AcceloJobRow[];
  invoices?: AcceloInvoiceRow[];
  issues?: AcceloIssueRow[];
  activities?: AcceloTimeRow[];
};

export type AcceloWorkspace = {
  companies: Company[];
  contacts: Contact[];
  projects: Project[];
  invoices: Invoice[];
  tickets: Ticket[];
  timeEntries: TimeEntry[];
  team: TeamMember[];
};

function upsert<T extends { id: string }>(rows: T[], incoming: T[]): T[] {
  const map = new Map(rows.map((row) => [row.id, row]));
  for (const row of incoming) map.set(row.id, { ...map.get(row.id), ...row });
  return [...map.values()];
}

function companyStub(id: string, name: string): Company {
  const label = name.trim() || "Accelo company";
  return {
    id,
    name: label,
    initials: initialsFromName(label),
    status: "Active",
    companyKind: "Client",
    accountManager: "Accelo",
    openProjects: 0,
    openTickets: 0,
    lastActivity: "",
    industry: "Accelo",
    billingTerms: "Net 30",
    portalContacts: 0,
    tags: ["Accelo"],
    notes: "",
  };
}

function ensureCompany(companies: Company[], id: string, name?: string) {
  if (!id) return companies;
  if (companies.some((company) => company.id === id)) return companies;
  return [companyStub(id, name || "Accelo company"), ...companies];
}

export function applyAcceloBatch(state: AcceloWorkspace, batch: AcceloBatch): AcceloWorkspace {
  let companies = state.companies;
  let contacts = state.contacts;
  let projects = state.projects;
  let invoices = state.invoices;
  let tickets = state.tickets;
  let timeEntries = state.timeEntries;
  let team = state.team;

  if (batch.companies?.length) {
    companies = upsert(
      companies,
      batch.companies.filter((row) => row.name.trim()).map((row) => ({
        ...(companies.find((company) => company.id === row.id) || companyStub(row.id, row.name)),
        id: row.id,
        name: row.name.trim(),
        initials: initialsFromName(row.name),
        status: row.status,
        website: row.website || "",
        phone: row.phone || "",
        notes: row.notes || "",
        industry: "Accelo",
        tags: ["Accelo"],
      })),
    );
  }

  if (batch.staff?.length) {
    const incoming: TeamMember[] = batch.staff
      .filter((row) => row.name.trim())
      .map((row) => {
        const existing = team.find((member) => member.id === row.id || (row.email && member.email.toLowerCase() === row.email.toLowerCase()));
        return {
          id: existing?.id || row.id,
          name: row.name.trim(),
          email: row.email || existing?.email || "",
          title: row.title || existing?.title || "",
          initials: initialsFromName(row.name),
          role: existing?.role || "staff",
          active: row.active,
        };
      });
    team = upsert(team, incoming);
  }

  if (batch.contacts?.length) {
    for (const row of batch.contacts) {
      if (row.companyId) companies = ensureCompany(companies, row.companyId);
    }
    contacts = upsert(
      contacts,
      batch.contacts.filter((row) => row.name.trim()).map((row) => {
        const company = companies.find((item) => item.id === row.companyId);
        const prior = contacts.find((item) => item.id === row.id);
        return {
          id: row.id,
          name: row.name.trim(),
          initials: initialsFromName(row.name),
          companyId: company?.id || prior?.companyId || "",
          companyName: company?.name || prior?.companyName || "",
          title: row.title || prior?.title || "",
          email: row.email || prior?.email || "",
          phone: row.phone || prior?.phone,
          mobile: row.mobile || prior?.mobile,
          portal: prior?.portal || "Not Invited",
          lastInteraction: prior?.lastInteraction || "",
        };
      }),
    );
  }

  if (batch.affiliations?.length) {
    for (const row of batch.affiliations) companies = ensureCompany(companies, row.companyId);
    contacts = contacts.map((contact) => {
      const link = batch.affiliations?.find((row) => row.contactId === contact.id);
      if (!link) return contact;
      const company = companies.find((item) => item.id === link.companyId);
      return {
        ...contact,
        companyId: company?.id || contact.companyId,
        companyName: company?.name || contact.companyName,
        email: contact.email || link.email || "",
        phone: contact.phone || link.phone,
        title: contact.title || link.title || "",
      };
    });
  }

  if (batch.jobs?.length) {
    for (const row of batch.jobs) {
      if (row.companyId) companies = ensureCompany(companies, row.companyId, row.companyName);
    }
    projects = upsert(
      projects,
      batch.jobs.filter((row) => row.name.trim()).map((row) => {
        const company = companies.find((item) => item.id === row.companyId) || companies.find((item) => item.name.toLowerCase() === (row.companyName || "").toLowerCase());
        const prior = projects.find((item) => item.id === row.id);
        const next: Project = {
          id: row.id,
          name: row.name.trim(),
          companyId: company?.id || prior?.companyId || "",
          companyName: company?.name || row.companyName || prior?.companyName || "",
          manager: row.manager || prior?.manager || "Accelo",
          progress: prior?.progress || 0,
          status: row.status,
          due: row.due || prior?.due || "",
          start: row.start || prior?.start || "",
          budgetHours: prior?.budgetHours || 0,
          loggedHours: prior?.loggedHours || 0,
          marginPct: prior?.marginPct || 0,
          portalShared: prior?.portalShared || false,
          portalContacts: prior?.portalContacts || 0,
          projectType: prior?.projectType || "Accelo",
          description: row.description || prior?.description || "",
          budgetAmount: prior?.budgetAmount || 0,
          materials: prior?.materials || [],
          files: prior?.files || [],
          notes: prior?.notes || [],
          scope: prior?.scope || { objectives: "", inScope: [], outOfScope: [], deliverables: [], assumptions: [] },
        };
        return next;
      }),
    );
  }

  if (batch.invoices?.length) {
    for (const row of batch.invoices) {
      if (row.companyId) companies = ensureCompany(companies, row.companyId, row.companyName);
    }
    invoices = upsert(
      invoices,
      batch.invoices.map((row) => {
        const company = companies.find((item) => item.id === row.companyId);
        const paid = Math.max(0, row.amount - row.outstanding);
        const prior = invoices.find((item) => item.id === row.id);
        return {
          id: row.id,
          number: row.number,
          companyId: company?.id || prior?.companyId || "",
          companyName: company?.name || row.companyName || prior?.companyName || "",
          amount: row.amount,
          terms: "Imported",
          due: row.due || prior?.due || "",
          status: row.status,
          title: row.title || prior?.title,
          raised: row.raised || prior?.raised,
          currency: "USD",
          lineItems: prior?.lineItems?.length
            ? prior.lineItems
            : [{ id: `${row.id}-line`, kind: "service" as const, description: row.title || "Accelo invoice", amount: row.amount, includeInPdf: true }],
          payments: paid > 0 ? [{ id: `${row.id}-pay`, date: row.raised || row.due || "", description: "Accelo payment", amount: paid }] : prior?.payments || [],
          quickbooksError: undefined,
        };
      }),
    );
  }

  if (batch.issues?.length) {
    for (const row of batch.issues) {
      if (row.companyId) companies = ensureCompany(companies, row.companyId, row.companyName);
    }
    tickets = upsert(
      tickets,
      batch.issues.map((row) => {
        const company = companies.find((item) => item.id === row.companyId);
        return {
          id: row.id,
          number: row.number,
          subject: row.subject,
          companyId: company?.id || "",
          companyName: company?.name || row.companyName || "",
          priority: row.priority,
          assignee: row.assignee || "Unassigned",
          slaDue: row.submitted || "",
          status: row.status,
          submitted: row.submitted || "",
        };
      }),
    );
  }

  if (batch.activities?.length) {
    timeEntries = upsert(
      timeEntries,
      batch.activities
        .filter((row) => row.hours > 0)
        .map((row) => {
          const staff = team.find((member) => member.id === `accelo-staff-${row.staffId}` || (row.userName && member.name === row.userName));
          const project = projects.find((item) => item.id === row.projectId);
          return {
            id: row.id,
            userName: staff?.name || row.userName || "Accelo",
            projectId: project?.id || row.projectId || "",
            projectName: project?.name || row.projectName || "Accelo",
            date: row.date || "",
            hours: row.hours,
            billable: row.billable,
            note: row.note,
            status: "Approved" as const,
          };
        }),
    );
  }

  return { companies, contacts, projects, invoices, tickets, timeEntries, team };
}

export async function connectAccelo(secret: string) {
  const res = await fetch("/api/accelo/connect", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; connected?: boolean };
  if (res.status === 404) return { ok: false as const, error: "The Accelo API is not on this host." };
  if (!res.ok) return { ok: false as const, error: data.error || "Accelo did not accept the client secret." };
  return { ok: true as const };
}

export async function countAcceloPage(resource: AcceloResource, page: number) {
  const res = await fetch(`/api/accelo/count?resource=${resource}&page=${page}`, { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as { count?: number; done?: boolean; error?: string };
  if (!res.ok) return { ok: false as const, error: data.error || "Accelo could not be counted." };
  return { ok: true as const, count: data.count || 0, done: Boolean(data.done) };
}

export async function pullAcceloPage(resource: AcceloResource, page: number) {
  const res = await fetch(`/api/accelo/pull?resource=${resource}&page=${page}`, { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as { rows?: AcceloBatch[keyof AcceloBatch]; done?: boolean; error?: string };
  if (!res.ok) return { ok: false as const, error: data.error || "Accelo could not be read." };
  return { ok: true as const, rows: data.rows || [], done: Boolean(data.done) };
}
