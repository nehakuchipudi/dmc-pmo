import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  availableProjectPeople,
  directoryPeople,
  listedPeople,
  ownerChoices,
  peopleNotNamed,
} from "./people-picker";
import type { Contact, ResourceAllocation, TeamMember } from "./types";

assert.deepEqual(listedPeople(["", " Akeal Hawkins ", null, "Akeal Hawkins", "Kishore B"]), [
  "Akeal Hawkins",
  "Kishore B",
]);
assert.deepEqual(listedPeople([""], ""), []);
assert.deepEqual(listedPeople(["  "], [undefined, ""]), []);

const team = [
  { id: "tm-a", name: "Akeal Hawkins", email: "akeal@dillonmorgan.com", active: true, initials: "AH", role: "pm" },
  { id: "tm-k", name: "Kishore B", email: "kishore@dillonmorgan.com", active: true, initials: "KB", role: "staff" },
] as TeamMember[];
const contacts = [
  { id: "ct-p", name: "Phillip Urrutia", email: "phillip@sanangelo.gov", companyId: "c1", companyName: "City", initials: "PU", title: "IT", portal: "Enabled", lastInteraction: "2026-08-20" },
  { id: "ct-dup", name: "Akeal Hawkins", email: "akeal.city@example.com", companyId: "c1", companyName: "City", initials: "AH", title: "Manager", portal: "Enabled", lastInteraction: "2026-08-20" },
] as Contact[];

const directory = directoryPeople(team, contacts);
assert.equal(directory.filter((row) => row.name === "Akeal Hawkins").length, 1);
assert.ok(directory.some((row) => row.name === "Phillip Urrutia" && row.kind === "contact"));
assert.deepEqual(
  peopleNotNamed(directory, ["Akeal Hawkins"]).map((row) => row.name).sort(),
  ["Kishore B", "Phillip Urrutia"],
);

const owners = ownerChoices(team, contacts, "Custom Owner");
assert.equal(owners[0]?.name, "Custom Owner");
assert.ok(owners.some((row) => row.name === "Phillip Urrutia"));

const available = availableProjectPeople(
  team,
  contacts,
  [
    {
      id: "al-1",
      memberId: "tm-k",
      memberName: "Kishore B",
      projectId: "p1",
      projectName: "P",
      allocationPct: 10,
      hoursPerWeek: 4,
      start: "2026-01-01",
      end: "2026-02-01",
    } satisfies ResourceAllocation,
  ],
  "p1",
);
assert.ok(!available.some((row) => row.name === "Kishore B"));
assert.ok(available.some((row) => row.name === "Phillip Urrutia"));

const root = dirname(fileURLToPath(import.meta.url));
const company = readFileSync(join(root, "../app/app/companies/[id]/company-detail.tsx"), "utf8");
assert.match(company, /AddPersonSelect/);
assert.match(company, /directoryPeople\(team, contacts\)/);
assert.match(company, /resetKey=\{`team-\$\{companyTeam.join\("\|"\)\}`\}/);
assert.match(company, /None assigned/);

const project = readFileSync(join(root, "../app/app/projects/[id]/project-detail.tsx"), "utf8");
assert.match(project, /Field label="Owner"[\s\S]*ownerChoices\(teamMembers, contacts/);
assert.match(project, /contacts\.forEach\(\(row\) => names\.add\(row\.name\)\)/);

const teamPanel = readFileSync(join(root, "../components/records/ProjectTeamPanel.tsx"), "utf8");
assert.match(teamPanel, /availableProjectPeople\(team, contacts/);

const assign = readFileSync(join(root, "../components/projects/ProjectRowModals.tsx"), "utf8");
assert.match(assign, /availableProjectPeople\(team, contacts/);

const store = readFileSync(join(root, "store.ts"), "utf8");
assert.match(store, /contacts\.find\(\(c\) => c\.id === input\.memberId\)/);

console.log("people-picker.verify ok");
