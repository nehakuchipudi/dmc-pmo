import type { Contact, ResourceAllocation, TeamMember } from "./types";

export type PickerPerson = {
  id: string;
  name: string;
  email: string;
  kind: "team" | "contact";
};

export function listedPeople(
  ...groups: Array<string | undefined | null | Array<string | undefined | null>>
): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    const items = Array.isArray(group) ? group : [group];
    for (const item of items) {
      const name = item?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(name);
    }
  }
  return names;
}

export function directoryPeople(team: TeamMember[], contacts: Contact[]): PickerPerson[] {
  const out: PickerPerson[] = [];
  const seen = new Set<string>();
  for (const row of team) {
    if (row.active === false) continue;
    const name = row.name?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: row.id, name, email: row.email ?? "", kind: "team" });
  }
  for (const row of contacts) {
    const name = row.name?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: row.id, name, email: row.email ?? "", kind: "contact" });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function peopleNotNamed(people: PickerPerson[], names: string[]) {
  const skip = new Set(listedPeople(names).map((name) => name.toLowerCase()));
  return people.filter((person) => !skip.has(person.name.toLowerCase()));
}

export function ownerChoices(team: TeamMember[], contacts: Contact[], current?: string) {
  const people = directoryPeople(team, contacts);
  const currentName = current?.trim();
  if (currentName && !people.some((person) => person.name.toLowerCase() === currentName.toLowerCase())) {
    return [{ id: "current-owner", name: currentName, email: "", kind: "team" as const }, ...people];
  }
  return people;
}

export function availableProjectPeople(
  team: TeamMember[],
  contacts: Contact[],
  allocations: ResourceAllocation[],
  projectId: string,
) {
  const takenIds = new Set<string>();
  const takenNames = new Set<string>();
  for (const row of allocations) {
    if (row.projectId !== projectId) continue;
    if (row.memberId) takenIds.add(row.memberId);
    if (row.memberName) takenNames.add(row.memberName.trim().toLowerCase());
  }
  return directoryPeople(team, contacts).filter(
    (person) => !takenIds.has(person.id) && !takenNames.has(person.name.toLowerCase()),
  );
}
