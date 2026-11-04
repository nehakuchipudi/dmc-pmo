import assert from "node:assert/strict";
import { INDUSTRIES, industryChoices } from "./industries";

assert.ok(INDUSTRIES.includes("Consulting"));
assert.ok(INDUSTRIES.includes("Government"));
assert.ok(INDUSTRIES.includes("Public Sector"));
assert.ok(INDUSTRIES.includes("Education"));
assert.ok(INDUSTRIES.includes("Energy"));
assert.ok(INDUSTRIES.includes("Insurance"));
assert.ok(INDUSTRIES.includes("Nonprofit"));
assert.equal(new Set(INDUSTRIES).size, INDUSTRIES.length);
assert.deepEqual([...INDUSTRIES], [...INDUSTRIES].sort((a, b) => a.localeCompare(b)));
assert.ok(industryChoices(["Custom Trade"]).includes("Custom Trade"));
assert.ok(industryChoices(["Consulting"]).includes("Consulting"));

console.log("industries.verify ok", INDUSTRIES.length, "industries");
