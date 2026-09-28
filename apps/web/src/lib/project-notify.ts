export const OWNER_ROLE = "Owner";

export type NotifyPerson = {
  name: string;
  email: string;
  notifyEmail?: boolean;
};

export function projectAssignmentSubject(projectName: string) {
  return `You are the Owner of ${projectName}`;
}

export function projectAssignmentBody(input: {
  ownerName: string;
  projectName: string;
  companyName: string;
  requestId?: string;
  href: string;
  created: boolean;
}) {
  const first = input.ownerName.split(" ")[0] || "there";
  const request = input.requestId ? ` Request ${input.requestId}.` : "";
  const lead = input.created
    ? `${input.projectName} was created and assigned to you as Owner.`
    : `You were assigned as Owner of ${input.projectName}.`;
  return `Hi ${first},\n\n${lead}${request}\nCompany: ${input.companyName}\n\nOpen the project: ${input.href}\n`;
}

export function memberAssignmentSubject(projectName: string, role: string) {
  return `You were added to ${projectName} as ${role}`;
}

export function memberAssignmentBody(input: {
  memberName: string;
  projectName: string;
  companyName: string;
  role: string;
  href: string;
}) {
  const first = input.memberName.split(" ")[0] || "there";
  return `Hi ${first},\n\nYou were added to ${input.projectName} as ${input.role}.\nCompany: ${input.companyName}\n\nOpen the project: ${input.href}\n`;
}

export function workspaceOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "https://dmc-pmo.vercel.app";
}

export function projectHref(projectId: string, origin = workspaceOrigin()) {
  return `${origin}/app/projects/view/?id=${projectId}`;
}

export function resolveNotifyEmail(input: {
  name?: string;
  email?: string;
  people: NotifyPerson[];
}): { name: string; email: string } | undefined {
  const email = input.email?.trim().toLowerCase();
  if (email) {
    const person = input.people.find((row) => row.email.toLowerCase() === email);
    if (person?.notifyEmail === false) return undefined;
    return { name: person?.name ?? input.name ?? email, email };
  }
  const name = input.name?.trim();
  if (!name) return undefined;
  const person = input.people.find((row) => row.name === name);
  if (!person?.email || person.notifyEmail === false) return undefined;
  return { name: person.name, email: person.email.toLowerCase() };
}

export function wantsOwnerRole(text: string) {
  return /\bowner\b/i.test(text);
}
