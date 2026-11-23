import { DMC_MANAGER_NAME } from "./dmc-internal-project";
import { weeklyHoursFromAllocation } from "./project-team";
import { nextProjectNumber } from "./ppm";
import { initialsFromName } from "./seed";
import type { Company, Contact, Milestone, Project, ResourceAllocation, Task, TeamMember, TimeEntry } from "./types";

export const SAN_ANGELO_COMPANY_NAME = "The City of San Angelo, TX";
export const SAN_ANGELO_COMPANY_ID = "c-san-angelo";
export const SAN_ANGELO_PROJECT_NAME = "San Angelo Strategic Planning Services";
export const SAN_ANGELO_PROJECT_ID = "p-san-angelo-plan";
export const SAN_ANGELO_CONTACT_NAME = "Phillip Urrutia";
export const SAN_ANGELO_TEAM_NAME = "Kishore B";

const CONTACT_ID = "ct-phillip-urrutia";
const MEMBER_ID = "tm-kishore";
const ADDRESS_ID = "addr-san-angelo";
const PHASE_MOBILIZE = "ms-sa-mobilize";
const PHASE_COUNCIL = "ms-sa-council";
const PHASE_STRATEGY = "ms-sa-strategy";

type Collections = {
  companies: Company[];
  contacts: Contact[];
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  team: TeamMember[];
  allocations: ResourceAllocation[];
  timeEntries: TimeEntry[];
};

function sameName(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function hasId<T extends { id: string }>(rows: T[], id: string) {
  return rows.some((row) => row.id === id);
}

function phase(id: string, projectId: string, name: string, start: string, due: string, sortOrder: number): Milestone {
  return {
    id,
    projectId,
    name,
    start,
    due,
    status: "In Progress",
    kind: "phase",
    sortOrder,
  };
}

function timeEntry(
  id: string,
  project: Project,
  userName: string,
  hours: number,
  date: string,
  milestoneId: string | undefined,
  milestoneName: string | undefined,
  note: string,
): TimeEntry {
  return {
    id,
    userName,
    projectId: project.id,
    projectName: project.name,
    milestoneId,
    milestoneName,
    workKind: milestoneId ? "phase" : "project",
    date,
    start: "09:00",
    hours,
    billable: true,
    note,
    status: "Approved",
  };
}

export function withSanAngeloExample(input: Collections): Collections | null {
  const companies = [...input.companies];
  const contacts = [...input.contacts];
  const projects = [...input.projects];
  const milestones = [...input.milestones];
  const tasks = [...input.tasks];
  const team = [...input.team];
  const allocations = [...input.allocations];
  const timeEntries = [...input.timeEntries];
  let changed = false;

  if (!team.some((row) => sameName(row.name, SAN_ANGELO_TEAM_NAME) || row.id === MEMBER_ID)) {
    team.push({
      id: MEMBER_ID,
      name: SAN_ANGELO_TEAM_NAME,
      firstName: "Kishore",
      lastName: "B",
      title: "Consultant",
      email: "kishore.b@dillonmorgan.com",
      initials: "KB",
      role: "staff",
      active: true,
      billRate: 185,
      costRate: 65,
      department: "Delivery",
      managerId: "tm-ah",
      username: "kishoreb",
      financialVisibility: "hours",
      timezone: "America/Chicago",
    });
    changed = true;
  }

  const addressLine = "72 W College Ave, San Angelo, 76903, TX, United States";
  let company: Company =
    companies.find((row) => sameName(row.name, SAN_ANGELO_COMPANY_NAME) || row.id === SAN_ANGELO_COMPANY_ID) ??
    {
      id: SAN_ANGELO_COMPANY_ID,
      name: SAN_ANGELO_COMPANY_NAME,
      initials: "SA",
      status: "Active",
      companyKind: "Client",
      accountManager: DMC_MANAGER_NAME,
      accountManagers: [DMC_MANAGER_NAME],
      openProjects: 0,
      openTickets: 0,
      lastActivity: "Aug 24, 2026",
      industry: "Government",
      billingTerms: "Net 30",
      portalContacts: 1,
      createdAt: "2026-08-20",
      website: "http://sanangelo.gov",
      notes: "Municipal client for San Angelo strategic planning services.",
      address: addressLine,
      addresses: [
        {
          id: ADDRESS_ID,
          line1: "72 W College Ave",
          city: "San Angelo",
          region: "TX",
          postal: "76903",
          country: "United States",
        },
      ],
      tags: ["Government"],
      privacy: "Standard",
      customFields: [
        { id: "cf-sa-sale-won", label: "Has a Sale been Won?", value: "" },
        { id: "cf-sa-parent", label: "Parent Company", value: "" },
      ],
    };
  if (!companies.some((row) => row.id === company.id)) {
    companies.push(company);
    changed = true;
  }

  if (
    !contacts.some(
      (row) => row.id === CONTACT_ID || (row.companyId === company.id && sameName(row.name, SAN_ANGELO_CONTACT_NAME)),
    )
  ) {
    contacts.push({
      id: CONTACT_ID,
      name: SAN_ANGELO_CONTACT_NAME,
      firstName: "Phillip",
      lastName: "Urrutia",
      initials: initialsFromName(SAN_ANGELO_CONTACT_NAME),
      companyId: company.id,
      companyName: company.name,
      title: "Primary Contact",
      email: "phillip.urrutia@sanangelo.gov",
      portal: "Enabled",
      lastInteraction: "Aug 24, 2026",
      category: "Primary",
      projectIds: [],
    });
    if (!company.primaryContactId) {
      company = { ...company, primaryContactId: CONTACT_ID, portalContacts: Math.max(company.portalContacts, 1) };
      const idx = companies.findIndex((row) => row.id === company.id);
      if (idx >= 0) companies[idx] = company;
    }
    changed = true;
  }

  const contact = contacts.find(
    (row) => row.id === CONTACT_ID || (row.companyId === company.id && sameName(row.name, SAN_ANGELO_CONTACT_NAME)),
  );
  let project = projects.find(
    (row) =>
      row.id === SAN_ANGELO_PROJECT_ID || (row.companyId === company.id && sameName(row.name, SAN_ANGELO_PROJECT_NAME)),
  );
  if (!project) {
    project = {
      id: SAN_ANGELO_PROJECT_ID,
      number: projects.some((row) => row.number === 67) ? nextProjectNumber(projects) : 67,
      name: SAN_ANGELO_PROJECT_NAME,
      companyId: company.id,
      companyName: company.name,
      manager: DMC_MANAGER_NAME,
      progress: 25,
      status: "Active",
      start: "2026-08-24",
      due: "2026-10-16",
      budgetHours: 240,
      loggedHours: 76,
      marginPct: 35,
      portalShared: true,
      portalContacts: 1,
      projectType: "Client Work",
      description:
        "Strategic planning services for The City of San Angelo, covering mobilization, council preparation, and plan development.",
      budgetAmount: 60000,
      materials: [],
      files: [],
      notes: [],
      rates: [
        { memberName: DMC_MANAGER_NAME, hourlyRate: 250 },
        { memberName: SAN_ANGELO_TEAM_NAME, hourlyRate: 185 },
      ],
      statusHistory: [],
      location: "San Angelo, TX",
      scope: {
        objectives:
          "Mobilize the engagement, prepare council, and deliver the City of San Angelo strategic plan.",
        inScope: ["Project mobilization and launch", "Council preparation", "Strategic plan development"],
        outOfScope: [],
        deliverables: ["Strategic plan", "Council briefing"],
        assumptions: [],
      },
      contactId: contact?.id,
      contactName: contact?.name,
    };
    projects.push(project);
    company = { ...company, openProjects: Math.max(company.openProjects, 1) };
    const companyIdx = companies.findIndex((row) => row.id === company.id);
    if (companyIdx >= 0) companies[companyIdx] = company;
    changed = true;
  }

  if (contact && !(contact.projectIds ?? []).includes(project.id)) {
    const idx = contacts.findIndex((row) => row.id === contact.id);
    contacts[idx] = { ...contact, projectIds: [...(contact.projectIds ?? []), project.id] };
    changed = true;
  }

  const plan: Milestone[] = [
    phase(PHASE_MOBILIZE, project.id, "Project Mobilization & Launch", "2026-08-24", "2026-09-04", 0),
    phase(PHASE_COUNCIL, project.id, "Council Preparation Complete", "2026-09-07", "2026-09-25", 1),
    phase(PHASE_STRATEGY, project.id, "Strategic Plan Development", "2026-09-25", "2026-10-16", 2),
  ];
  for (const item of plan) {
    if (!hasId(milestones, item.id) && !milestones.some((row) => row.projectId === project.id && sameName(row.name, item.name))) {
      milestones.push(item);
      changed = true;
    }
  }

  const kishoreMember = team.find((row) => sameName(row.name, SAN_ANGELO_TEAM_NAME) || row.id === MEMBER_ID);
  const roster: ResourceAllocation[] = [
    {
      id: "al-sa-kb",
      memberId: kishoreMember?.id ?? MEMBER_ID,
      memberName: SAN_ANGELO_TEAM_NAME,
      projectId: project.id,
      projectName: project.name,
      allocationPct: 30,
      hoursPerWeek: weeklyHoursFromAllocation(30),
      start: project.start,
      end: project.due,
      projectRole: "Specialist",
      responsibility: "Council preparation and plan support",
    },
  ];
  for (const row of roster) {
    if (
      !hasId(allocations, row.id) &&
      !allocations.some((existing) => existing.projectId === project.id && existing.memberId === row.memberId)
    ) {
      allocations.push(row);
      changed = true;
    }
  }

  const logged: TimeEntry[] = [
    timeEntry("te-sa-mob", project, DMC_MANAGER_NAME, 5, "2026-09-04", PHASE_MOBILIZE, "Project Mobilization & Launch", "Mobilization closeout"),
    timeEntry("te-sa-council-1", project, SAN_ANGELO_TEAM_NAME, 8, "2026-09-10", PHASE_COUNCIL, "Council Preparation Complete", "Council briefing draft"),
    timeEntry("te-sa-council-2", project, SAN_ANGELO_TEAM_NAME, 10, "2026-09-18", PHASE_COUNCIL, "Council Preparation Complete", "Council session prep"),
    timeEntry("te-sa-plan-1", project, DMC_MANAGER_NAME, 8, "2026-08-24", undefined, undefined, "Kickoff and discovery"),
    timeEntry("te-sa-plan-2", project, DMC_MANAGER_NAME, 8, "2026-08-25", undefined, undefined, "Stakeholder mapping"),
    timeEntry("te-sa-plan-3", project, DMC_MANAGER_NAME, 8, "2026-08-26", undefined, undefined, "Workplan and rate card"),
    timeEntry("te-sa-plan-4", project, SAN_ANGELO_TEAM_NAME, 8, "2026-09-08", undefined, undefined, "Research pack"),
    timeEntry("te-sa-plan-5", project, SAN_ANGELO_TEAM_NAME, 8, "2026-09-15", undefined, undefined, "Working session notes"),
    timeEntry("te-sa-plan-6", project, DMC_MANAGER_NAME, 8, "2026-09-22", undefined, undefined, "Plan outline"),
    timeEntry("te-sa-plan-7", project, DMC_MANAGER_NAME, 5, "2026-09-29", undefined, undefined, "Status and next steps"),
  ];
  for (const row of logged) {
    if (!hasId(timeEntries, row.id)) {
      timeEntries.push(row);
      changed = true;
    }
  }

  if (!changed) return null;
  return { companies, contacts, projects, milestones, tasks, team, allocations, timeEntries };
}
