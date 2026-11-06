import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  IDEA_STATUS_OPTIONS,
  PROJECT_CREATE_TYPES,
  ideaCanConvert,
  ideaIsOpen,
  ideaObjectiveLabel,
  normalizeIdeaStage,
  resolveIdeaObjective,
} from "./ppm";

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
assert.match(createForm, /Field label="Type"/);
assert.match(createForm, /PROJECT_CREATE_TYPES/);
assert.match(createForm, /projectType/);
assert.match(createForm, /Internal \/ unassigned/);
assert.match(createForm, /Client Work needs a company/);

const store = readFileSync(join(root, "./store.ts"), "utf8");
assert.match(store, /projectType\?: string;/);
assert.match(store, /input\.projectType\?\.trim\(\)/);

const projectEdit = readFileSync(join(root, "../app/app/projects/[id]/project-detail.tsx"), "utf8");
assert.match(projectEdit, /"Internal", "Client Work"/);

console.log("ppm.verify ok");
