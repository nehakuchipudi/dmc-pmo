import { initialsFromName } from "./seed";
import { nextProjectNumber } from "./ppm";
import type { Company, Contact, Milestone, Project, Task, TeamMember } from "./types";

export const DMC_CONSULTING_NAME = "Dillon Morgan Consulting";
export const DMC_INTERNAL_PROJECT_NAME = "DMC Internal Project";
export const DMC_INTERNAL_PROJECT_ID = "p-dmc-internal";
export const DMC_CONTACT_NAME = "Mzee Dillon";
export const DMC_MANAGER_NAME = "Akeal Hawkins";

const COMPANY_ID = "c-dmc";
const CONTACT_ID = "ct-mzee";
const MEMBER_ID = "tm-ah";

type Collections = {
  companies: Company[];
  contacts: Contact[];
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  team: TeamMember[];
};

function sameName(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function hasId<T extends { id: string }>(rows: T[], id: string) {
  return rows.some((row) => row.id === id);
}

function durationHours(start: string, due: string) {
  const startAt = new Date(`${start}T12:00:00`).getTime();
  const dueAt = new Date(`${due}T12:00:00`).getTime();
  const days = Math.max(1, Math.round((dueAt - startAt) / 86400000) + 1);
  return days * 8;
}

function task(
  id: string,
  project: Project,
  milestoneId: string,
  name: string,
  start: string,
  due: string,
  sortOrder: number,
): Task {
  return {
    id,
    name,
    projectId: project.id,
    projectName: project.name,
    milestoneId,
    assignee: DMC_MANAGER_NAME,
    assigneeInitials: initialsFromName(DMC_MANAGER_NAME),
    status: "Done",
    priority: "Med",
    progress: 100,
    start,
    due,
    clientEditable: false,
    estimateHours: durationHours(start, due),
    sortOrder,
    links: [],
  };
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

export function withDmcInternalExample(input: Collections): Collections | null {
  const companies = [...input.companies];
  const contacts = [...input.contacts];
  const projects = [...input.projects];
  const milestones = [...input.milestones];
  const tasks = [...input.tasks];
  const team = [...input.team];
  let changed = false;

  if (!team.some((row) => sameName(row.name, DMC_MANAGER_NAME) || row.id === MEMBER_ID)) {
    team.push({
      id: MEMBER_ID,
      name: DMC_MANAGER_NAME,
      firstName: "Akeal",
      lastName: "Hawkins",
      title: "Project Manager",
      email: "akeal.hawkins@dillonmorgan.com",
      initials: "AH",
      role: "pm",
      active: true,
      billRate: 185,
      costRate: 65,
      department: "PMO",
      managerId: "tm-dm",
      username: "ahawkins",
      financialVisibility: "rates_and_budgets",
      timezone: "America/Chicago",
    });
    changed = true;
  }

  let company: Company =
    companies.find((row) => sameName(row.name, DMC_CONSULTING_NAME)) ??
    {
      id: COMPANY_ID,
      name: DMC_CONSULTING_NAME,
      initials: "DM",
      status: "Active",
      companyKind: "Consultant",
      accountManager: "M. Doyle",
      accountManagers: ["M. Doyle"],
      openProjects: 0,
      openTickets: 0,
      lastActivity: "Nov 13, 2026",
      industry: "Professional Services",
      billingTerms: "Net 30",
      portalContacts: 1,
      createdAt: "2025-06-02",
      tags: ["Internal"],
      favorite: false,
    };
  if (!companies.some((row) => row.id === company.id)) {
    companies.push(company);
    changed = true;
  }

  if (!contacts.some((row) => row.id === CONTACT_ID || (row.companyId === company.id && sameName(row.name, DMC_CONTACT_NAME)))) {
    contacts.push({
      id: CONTACT_ID,
      name: DMC_CONTACT_NAME,
      firstName: "Mzee",
      lastName: "Dillon",
      initials: "MD",
      companyId: company.id,
      companyName: company.name,
      title: "Company Contact",
      email: "mzee.dillon@dillonmorgan.com",
      portal: "Enabled",
      lastInteraction: "Jun 2, 2025",
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

  const contact = contacts.find((row) => row.id === CONTACT_ID || (row.companyId === company.id && sameName(row.name, DMC_CONTACT_NAME)));
  let project = projects.find(
    (row) => row.id === DMC_INTERNAL_PROJECT_ID || (row.companyId === company.id && sameName(row.name, DMC_INTERNAL_PROJECT_NAME)),
  );
  if (!project) {
    project = {
      id: DMC_INTERNAL_PROJECT_ID,
      number: nextProjectNumber(projects),
      name: DMC_INTERNAL_PROJECT_NAME,
      companyId: company.id,
      companyName: company.name,
      manager: DMC_MANAGER_NAME,
      progress: 100,
      status: "Active",
      start: "2025-06-03",
      due: "2025-09-05",
      actualStart: "2025-06-02",
      budgetHours: 536,
      loggedHours: 0,
      marginPct: 35,
      portalShared: true,
      portalContacts: 1,
      projectType: "Internal",
      description: "Internal delivery plan covering hiring, AWS setup, UI/UX, and authentication.",
      budgetAmount: 96480,
      materials: [],
      files: [],
      notes: [],
      rates: [],
      statusHistory: [],
      scope: {
        objectives: "Stand up the internal DMC product team, cloud environment, design system, and login.",
        inScope: ["Hiring", "AWS environment", "UI/UX wireframes", "Authentication"],
        outOfScope: [],
        deliverables: ["Project plan", "AWS account", "Wireframes", "Cognito login"],
        assumptions: [],
      },
      contactId: contact?.id,
      contactName: contact?.name,
    };
    projects.unshift(project);
    company = { ...company, openProjects: company.openProjects + 1 };
    const companyIdx = companies.findIndex((row) => row.id === company.id);
    if (companyIdx >= 0) companies[companyIdx] = company;
    changed = true;
  }

  if (contact && !(contact.projectIds ?? []).includes(project.id)) {
    const idx = contacts.findIndex((row) => row.id === contact.id);
    contacts[idx] = { ...contact, projectIds: [...(contact.projectIds ?? []), project.id] };
    changed = true;
  }

  const plan = [
    {
      milestone: phase("ms-dmc-hire", project.id, "Hire Full Stack Developer", "2025-06-03", "2025-06-04", 0),
      tasks: [
        task("tk-dmc-int1", project, "ms-dmc-hire", "Interview - 1", "2025-06-03", "2025-06-03", 0),
        task("tk-dmc-int2", project, "ms-dmc-hire", "Interview - 2", "2025-06-04", "2025-06-04", 1),
      ],
    },
    {
      milestone: phase("ms-dmc-aws", project.id, "AWS Environment Setup", "2025-06-06", "2025-06-12", 1),
      tasks: [
        task("tk-dmc-aws-account", project, "ms-dmc-aws", "Set up AWS account", "2025-06-06", "2025-06-12", 0),
        task("tk-dmc-aws-iam", project, "ms-dmc-aws", "Create IAM roles/policies", "2025-06-06", "2025-06-12", 1),
        task("tk-dmc-aws-services", project, "ms-dmc-aws", "Provision S3, Lambda, DynamoDB, API Gateway", "2025-06-06", "2025-06-12", 2),
      ],
    },
    {
      milestone: phase("ms-dmc-design", project.id, "Design UI/UX + Wireframes", "2025-06-13", "2025-06-23", 2),
      tasks: [
        task("tk-dmc-personas", project, "ms-dmc-design", "Define user personas", "2025-06-13", "2025-06-23", 0),
        task("tk-dmc-wireframes", project, "ms-dmc-design", "Create wireframes for each module", "2025-06-13", "2025-06-23", 1),
        task("tk-dmc-review", project, "ms-dmc-design", "Review and finalize designs", "2025-06-13", "2025-06-23", 2),
      ],
    },
    {
      milestone: phase("ms-dmc-auth", project.id, "Implement Authentication & Login", "2025-06-23", "2025-07-02", 3),
      tasks: [
        task("tk-dmc-cognito", project, "ms-dmc-auth", "Set up Cognito user pool", "2025-06-23", "2025-07-02", 0),
        task("tk-dmc-login", project, "ms-dmc-auth", "Integrate frontend login page", "2025-06-23", "2025-07-02", 1),
        task("tk-dmc-session", project, "ms-dmc-auth", "Implement token-based session manager", "2025-06-23", "2025-07-02", 2),
      ],
    },
  ];

  for (const item of plan) {
    if (!hasId(milestones, item.milestone.id) && !milestones.some((row) => row.projectId === project!.id && sameName(row.name, item.milestone.name))) {
      milestones.push(item.milestone);
      changed = true;
    }
    for (const row of item.tasks) {
      if (!hasId(tasks, row.id) && !tasks.some((existing) => existing.projectId === project!.id && sameName(existing.name, row.name))) {
        tasks.push(row);
        changed = true;
      }
    }
  }

  if (!changed) return null;
  return { companies, contacts, projects, milestones, tasks, team };
}
