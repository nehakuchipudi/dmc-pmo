import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const ui = readFileSync(join(root, "../components/records/ProjectInsights.tsx"), "utf8");
const css = readFileSync(join(root, "../app/globals.css"), "utf8");
const lib = readFileSync(join(root, "./project-insights.ts"), "utf8");

assert.match(ui, /Project Budget & Time Summary/);
assert.match(ui, /Approved Budget/);
assert.match(ui, /Approved Time/);
assert.match(ui, /allocatedBudget/);
assert.match(ui, /allocatedHours/);
assert.match(ui, /setChartView\("bars"\)/);
assert.match(ui, /setChartView\("rings"\)/);
assert.doesNotMatch(ui, /insights-health/);
assert.doesNotMatch(ui, /insights-kpis/);
assert.match(css, /\.insight-budget-card/);
assert.match(css, /\.insight-budget-bar/);
assert.match(css, /\.insight-ring/);
assert.match(lib, /allocationSummary/);
assert.match(lib, /allocatedBudget:/);

console.log("project-insights.verify ok");
