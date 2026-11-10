import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const page = readFileSync(join(root, "../components/marketing/LandingPage.tsx"), "utf8");
const packs = readFileSync(join(root, "../components/marketing/LandingPacks.tsx"), "utf8");
const connected = readFileSync(join(root, "../components/marketing/LandingConnected.tsx"), "utf8");
const css = readFileSync(join(root, "../app/marketing.css"), "utf8");

assert.doesNotMatch(page, /The DMC PMO journey/);
assert.doesNotMatch(page, /mkt-journey-steps/);
assert.doesNotMatch(page, /const JOURNEY/);
assert.match(page, /LandingPacks/);
assert.match(page, /href: "#packs"/);

assert.match(packs, /From companies to outcomes/);
assert.match(packs, /Choose the packs you need/);
assert.match(packs, /Project management/);
assert.match(packs, /Project delivery/);
assert.match(packs, /Service operations/);
assert.match(packs, /This pack turns on/);

assert.match(connected, /Built around the way PMOs work/);
assert.match(connected, /mkt-pmo-console/);
assert.match(connected, /mkt-pmo-rail/);
assert.doesNotMatch(connected, /mkt-connect-card/);
assert.doesNotMatch(connected, /Everything connected\. Nothing hidden/);

assert.match(css, /\.mkt-packs-console/);
assert.match(css, /\.mkt-pmo-console/);
assert.doesNotMatch(css, /\.mkt-journey-steps/);
assert.doesNotMatch(css, /\.mkt-connect-card/);

console.log("landing-packs-pmo.verify ok");
