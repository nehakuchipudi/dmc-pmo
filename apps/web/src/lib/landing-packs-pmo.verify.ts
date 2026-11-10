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
assert.doesNotMatch(packs, /mkt-pack-spine/);
assert.doesNotMatch(packs, /const SPINE/);
assert.doesNotMatch(packs, /Weekly brief/);
assert.doesNotMatch(css, /\.mkt-pack-spine/);

assert.match(connected, /Built around the way PMOs work/);
assert.match(connected, /mkt-pmo-console/);
assert.match(connected, /mkt-pmo-rail/);
assert.match(connected, /shot-plan\.jpg/);
assert.match(connected, /shot-insights\.jpg/);
assert.match(connected, /shot-overview\.jpg/);
assert.doesNotMatch(connected, /card-plan/);
assert.doesNotMatch(connected, /card-insights/);
assert.doesNotMatch(connected, /card-overview/);
assert.doesNotMatch(connected, /mkt-connect-card/);
assert.doesNotMatch(connected, /Everything connected\. Nothing hidden/);

assert.match(page, /shot-plan\.jpg/);
assert.match(page, /shot-insights\.jpg/);
assert.match(page, /shot-overview\.jpg/);
assert.doesNotMatch(page, /card-plan/);
assert.doesNotMatch(page, /card-insights/);
assert.doesNotMatch(page, /card-overview/);

assert.match(css, /\.mkt-packs-console/);
assert.match(css, /\.mkt-pmo-console/);
const pmoShot = css.match(/\.mkt-pmo-stage \.mkt-shot img \{[^}]+\}/)?.[0] ?? "";
assert.match(pmoShot, /object-fit: contain/);
assert.doesNotMatch(pmoShot, /object-fit: cover/);
assert.doesNotMatch(css, /\.mkt-journey-steps/);
assert.doesNotMatch(css, /\.mkt-connect-card/);

console.log("landing-packs-pmo.verify ok");
