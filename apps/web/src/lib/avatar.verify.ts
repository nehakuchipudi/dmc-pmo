import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(root, "../components/primitives.tsx"), "utf8");
assert.match(src, /export function Avatar/);
assert.match(src, /\{initials\}/);
assert.doesNotMatch(src, /<img/);
assert.doesNotMatch(src, /pravatar/);
assert.doesNotMatch(src, /[\u2013\u2014]/);

const seed = readFileSync(join(root, "./seed.ts"), "utf8");
assert.doesNotMatch(seed, /pravatar/);

const store = readFileSync(join(root, "./store.ts"), "utf8");
assert.doesNotMatch(store, /pravatar/);

console.log("avatar.verify ok");
