import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NAV_GROUPS } from "./modules";

const root = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(root, "../app/globals.css"), "utf8");
const shell = readFileSync(join(root, "../components/shell/AppShell.tsx"), "utf8");
const help = readFileSync(join(root, "../components/help/HelpSupport.tsx"), "utf8");

assert.match(css, /--sidebar-width:\s*220px/);
assert.match(css, /--sidebar-collapsed:\s*64px/);
assert.match(css, /\.app-shell \{[\s\S]*?grid-template-columns:\s*var\(--sidebar-width\) 1fr/);
assert.match(css, /\.app-shell\.collapsed \{ grid-template-columns: var\(--sidebar-collapsed\) 1fr; \}/);
assert.match(css, /\.sidebar \{[\s\S]*?width:\s*var\(--sidebar-width\)/);
assert.match(css, /\.app-shell\.collapsed \.sidebar \{ width: var\(--sidebar-collapsed\); \}/);
assert.match(css, /\.sidebar \{[\s\S]*?padding:\s*12px 8px/);
assert.match(css, /\.nav-link \{[\s\S]*?gap:\s*9px/);
assert.match(css, /\.nav-link \{[\s\S]*?padding:\s*7px 10px/);
assert.match(css, /\.nav-category \{[\s\S]*?gap:\s*9px/);
assert.match(css, /width:\s*min\(var\(--sidebar-width\), 86vw\)/);
assert.doesNotMatch(css, /grid-template-columns:\s*256px/);
assert.doesNotMatch(css, /grid-template-columns:\s*76px/);

assert.match(shell, /shortLabel: meta\?\.shortLabel/);
assert.match(shell, /\{group\.shortLabel\}/);
assert.match(shell, /title=\{group\.label\}/);
assert.match(shell, /title="Feedback"/);
assert.match(shell, /title="Home"/);
assert.match(shell, /<span>Home<\/span>/);
assert.match(shell, /<span>Feedback<\/span>/);
assert.match(help, /title="Help & Support"/);
assert.match(help, /\{!collapsed \? <span>Help<\/span> : null\}/);
assert.doesNotMatch(help, /<span>Help & Support<\/span>/);

assert.equal(NAV_GROUPS.find((group) => group.id === "project_management")?.shortLabel, "Projects");
assert.equal(NAV_GROUPS.find((group) => group.id === "resource_management")?.shortLabel, "Resources");
assert.equal(NAV_GROUPS.find((group) => group.id === "service_operations")?.shortLabel, "Services");
assert.equal(NAV_GROUPS.find((group) => group.id === "business_management")?.shortLabel, "Business");
assert.equal(NAV_GROUPS.find((group) => group.id === "intelligence")?.shortLabel, "Analytics");
assert.equal(NAV_GROUPS.find((group) => group.id === "administration")?.shortLabel, "Admin");
assert.equal(NAV_GROUPS.find((group) => group.id === "settings")?.shortLabel, "Settings");

console.log("compact-nav.verify ok");
