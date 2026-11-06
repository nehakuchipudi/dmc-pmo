import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  IDEA_STATUS_OPTIONS,
  PROJECT_CREATE_TYPES,
  PROJECT_CREATE_STATUSES,
  PROJECT_LIST_FILTERS,
  customFieldsForProjectType,
  filterProjectList,
  ideaCanConvert,
  ideaIsOpen,
  ideaObjectiveLabel,
  lastProjectContactIso,
  nextProjectNumber,
  normalizeIdeaStage,
  projectDisplayId,
  projectEarnedValue,
  projectIsOverdue,
  resolveIdeaObjective,
} from "./ppm";
import type { Project } from "./types";

const objectives = [
  { id: "so-1", code: "SO-1", name: "Grow municipal work" },
  { id: "so-2", code: "SO-2", name: "Cut cycle time" },
];

assert.deepEqual(resolveIdeaObjective("  ", objectives), { objectiveId: undefined, objectiveName: undefined });
assert.deepEqual(resolveIdeaObjective("Grow municipal work", objectives), {
  objectiveId: "so-1",
  objectiveName: undefined,
});
assert.deepEqual(resolveIdeaObjective("so-2", objectives), { objectiveId: "so-2", objectiveName: undefined });
assert.deepEqual(resolveIdeaObjective("SO-1 Grow municipal work", objectives), {
  objectiveId: "so-1",
  objectiveName: undefined,
});
assert.deepEqual(resolveIdeaObjective("Stand up a field portal", objectives), {
  objectiveId: undefined,
  objectiveName: "Stand up a field portal",
});

assert.equal(ideaObjectiveLabel({ objectiveId: "so-2" }, objectives), "SO-2 Cut cycle time");
assert.equal(ideaObjectiveLabel({ objectiveName: "Stand up a field portal" }, objectives), "Stand up a field portal");
assert.equal(ideaObjectiveLabel({}, objectives), "");

const root = dirname(fileURLToPath(import.meta.url));
const ideaForm = readFileSync(join(root, "../app/app/ideas/page.tsx"), "utf8");
const createForm = readFileSync(join(root, "../components/CreateForms.tsx"), "utf8");
const editForm = readFileSync(join(root, "../components/ppm/PpmRecordForms.tsx"), "utf8");

for (const src of [ideaForm, createForm, editForm]) {
  assert.match(src, /Field label="Objective"/);
  assert.match(src, /What outcome does this idea serve\?/);
  assert.equal(src.includes("<TextSelect") && /Field label="Objective"[\s\S]{0,180}<TextSelect/.test(src), false);
}

assert.match(ideaForm, /value=\{objectiveText\}/);
assert.match(createForm, /name="objective"/);

assert.equal(normalizeIdeaStage("Scoring"), "In Progress");
assert.equal(normalizeIdeaStage("Deferred"), "On Hold");
assert.equal(normalizeIdeaStage("Approved"), "Approved");
assert.equal(ideaIsOpen("On Hold"), true);
assert.equal(ideaIsOpen("Rejected"), false);
assert.equal(ideaCanConvert({ stage: "Submitted" }), true);
assert.equal(ideaCanConvert({ stage: "Approved" }), true);
assert.equal(ideaCanConvert({ stage: "Rejected" }), false);
assert.equal(ideaCanConvert({ stage: "Converted", convertedProjectId: "p1" }), false);
assert.ok(IDEA_STATUS_OPTIONS.includes("In Progress"));
assert.ok(IDEA_STATUS_OPTIONS.includes("On Hold"));
assert.equal((IDEA_STATUS_OPTIONS as readonly string[]).includes("Converted"), false);

assert.doesNotMatch(ideaForm, /Fit \/ Value \/ Risk/);
assert.doesNotMatch(ideaForm, /Avg score/);
assert.doesNotMatch(ideaForm, />Advance</);
assert.match(ideaForm, /Convert/);
assert.match(ideaForm, /IDEA_STATUS_OPTIONS/);

const ideaView = readFileSync(join(root, "../app/app/ideas/view/page.tsx"), "utf8");
assert.doesNotMatch(ideaView, /Scoring/);
assert.doesNotMatch(ideaView, /Fit \/ Value \/ Risk/);
assert.match(ideaView, /Convert to project/);
assert.doesNotMatch(editForm, /Strategic fit/);
assert.match(editForm, /Field label="Status"/);

assert.deepEqual([...PROJECT_CREATE_TYPES], ["Internal", "Client Work"]);
assert.deepEqual([...PROJECT_CREATE_STATUSES], ["Draft", "Planning", "Active"]);
assert.equal(customFieldsForProjectType("Internal")[0]?.label, "Department");
assert.equal(customFieldsForProjectType("Client Work")[0]?.label, "Contract number");

const projectCreate = readFileSync(join(root, "../components/ProjectCreateForm.tsx"), "utf8");
assert.match(createForm, /ProjectCreateForm/);
assert.match(projectCreate, /Field label="Type"/);
assert.match(projectCreate, /PROJECT_CREATE_TYPES/);
assert.match(projectCreate, /projectType/);
assert.match(projectCreate, /Internal \/ unassigned/);
assert.match(projectCreate, /Client Work needs a company/);
assert.match(projectCreate, /Field label="Company contact"/);
assert.match(projectCreate, /Field label="Status"/);
assert.match(projectCreate, /Field label="Project manager"/);
assert.match(projectCreate, /Field label="Planned start"/);
assert.match(projectCreate, /Field label="Planned due"/);
assert.match(projectCreate, /Field label="Project template"/);
assert.match(projectCreate, /Custom fields/);
assert.match(projectCreate, /More advanced date settings/);
assert.match(projectCreate, /Create a company/);
assert.match(projectCreate, /Add a contact/);

const store = readFileSync(join(root, "./store.ts"), "utf8");
assert.match(store, /projectType\?: string;/);
assert.match(store, /contactId\?: string;/);
assert.match(store, /templateId\?: string;/);
assert.match(store, /input\.projectType\?\.trim\(\)/);
assert.match(store, /normalizeProjectStatus\(input\.status \|\| "Draft"\)/);

const projectEdit = readFileSync(join(root, "../app/app/projects/[id]/project-detail.tsx"), "utf8");
assert.match(projectEdit, /"Internal", "Client Work"/);

assert.deepEqual([...PROJECT_LIST_FILTERS], [
  "All Open Projects",
  "Recently Created",
  "Managed By Me",
  "Projects Overdue",
]);
assert.equal(nextProjectNumber([]), 1);
assert.equal(nextProjectNumber([{ number: 54 }]), 55);
assert.equal(projectDisplayId({ id: "p-abc", number: 67 }), "67");
assert.equal(projectEarnedValue({ progress: 50, budgetAmount: 21600 }), 10800);
assert.equal(projectIsOverdue({ due: "2026-09-30", status: "Draft" }, "2026-11-06"), true);
assert.equal(projectIsOverdue({ due: "2026-11-06", status: "Active" }, "2026-11-06"), false);
assert.equal(projectIsOverdue({ due: "2026-09-30", status: "Completed" }, "2026-11-06"), false);
assert.equal(
  lastProjectContactIso("p1", {
    activities: [{ projectId: "p1", at: "2026-10-01T12:00:00Z" }],
    timeEntries: [{ projectId: "p1", date: "2026-11-01" }],
  }),
  "2026-11-01",
);

const listSample = [
  {
    id: "p1",
    name: "HQ Ops",
    companyId: "",
    companyName: "Internal",
    manager: "Dillon Morgan",
    progress: 0,
    status: "Draft",
    due: "2026-09-30",
    start: "2026-11-01",
    budgetHours: 120,
    loggedHours: 0,
    marginPct: 35,
    portalShared: true,
    portalContacts: 0,
    projectType: "Internal",
    description: "",
    budgetAmount: 21600,
    materials: [],
    files: [],
    notes: [],
    scope: { objectives: "", inScope: [], outOfScope: [], deliverables: [], assumptions: [] },
  },
  {
    id: "p2",
    name: "Done Work",
    companyId: "",
    companyName: "Internal",
    manager: "J. Kim",
    progress: 100,
    status: "Completed",
    due: "2026-08-01",
    start: "2026-07-01",
    budgetHours: 40,
    loggedHours: 40,
    marginPct: 35,
    portalShared: true,
    portalContacts: 0,
    projectType: "Internal",
    description: "",
    budgetAmount: 8000,
    materials: [],
    files: [],
    notes: [],
    scope: { objectives: "", inScope: [], outOfScope: [], deliverables: [], assumptions: [] },
  },
] as Project[];
assert.equal(filterProjectList(listSample, "All Open Projects", { today: "2026-11-06" }).length, 1);
assert.equal(filterProjectList(listSample, "Managed By Me", { userName: "Dillon Morgan", today: "2026-11-06" })[0]?.id, "p1");
assert.equal(filterProjectList(listSample, "Projects Overdue", { today: "2026-11-06" })[0]?.id, "p1");
assert.equal(filterProjectList(listSample, "Recently Created", { today: "2026-11-06" })[0]?.id, "p1");

const projectsPage = readFileSync(join(root, "../app/app/projects/page.tsx"), "utf8");
assert.match(projectsPage, /PROJECT_LIST_FILTERS/);
assert.match(projectsPage, />Id</);
assert.match(projectsPage, />Type</);
assert.match(projectsPage, />Earned</);
assert.match(projectsPage, />Last contact</);
assert.match(projectsPage, /table-wrap/);
assert.match(store, /nextProjectNumber\(get\(\)\.projects\)/);

console.log("ppm.verify ok");
