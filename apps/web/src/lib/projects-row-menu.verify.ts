import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PROJECT_WORKSPACE_TABS, projectWorkspaceHref, resolveProjectTab } from "./project-tabs";

const root = dirname(fileURLToPath(import.meta.url));

assert.equal(resolveProjectTab("Schedule"), "Schedule");
assert.equal(resolveProjectTab("team"), "Team");
assert.equal(resolveProjectTab("missing"), "Overview");
assert.equal(projectWorkspaceHref("p1", "Schedule"), "/app/projects/view/?id=p1&tab=Schedule");
assert.ok(PROJECT_WORKSPACE_TABS.includes("Schedule"));
assert.ok(PROJECT_WORKSPACE_TABS.includes("Team"));

const page = readFileSync(join(root, "../app/app/projects/page.tsx"), "utf8");
assert.match(page, /RowMenu/);
assert.match(page, /Add activity/);
assert.match(page, /Log time/);
assert.match(page, /Add task/);
assert.match(page, /Edit project/);
assert.match(page, /Edit plan/);
assert.match(page, /Assign work/);
assert.match(page, /Approve/);
assert.match(page, /Create invoice/);
assert.doesNotMatch(page, /Create booking/i);
assert.doesNotMatch(page, /onMouseLeave/);
assert.match(page, /setCreateKind\("time"\)/);
assert.match(page, /setCreateKind\("task"\)/);
assert.match(page, /projectWorkspaceHref\(p\.id, "Schedule"\)/);

const menu = readFileSync(join(root, "../components/RowMenu.tsx"), "utf8");
assert.match(menu, /createPortal/);
assert.match(menu, /position: fixed|is-fixed/);

const view = readFileSync(join(root, "../app/app/projects/view/page.tsx"), "utf8");
assert.match(view, /params.get\("tab"\)/);
assert.match(view, /initialTab/);

const css = readFileSync(join(root, "../app/globals.css"), "utf8");
assert.match(css, /\.row-menu\.is-fixed/);

console.log("projects-row-menu.verify ok");
