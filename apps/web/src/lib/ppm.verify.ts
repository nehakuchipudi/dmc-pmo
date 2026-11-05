import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ideaObjectiveLabel, resolveIdeaObjective } from "./ppm";

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

console.log("ppm.verify ok");
