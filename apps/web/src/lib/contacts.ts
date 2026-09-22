import type { Company, Contact, Project } from "./types";

export function isPrimaryContact(contact: Contact, company?: Company) {
  return company?.primaryContactId === contact.id;
}

export function contactProjects(contact: Contact, projects: Project[]) {
  const companyProjects = projects.filter((p) => p.companyId === contact.companyId);
  if (!contact.projectIds?.length) return companyProjects;
  const linked = new Set(contact.projectIds);
  return companyProjects.filter((p) => linked.has(p.id));
}

export function contactMatches(contact: Contact, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [contact.name, contact.email, contact.companyName, contact.title, contact.phone, contact.notes]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}
