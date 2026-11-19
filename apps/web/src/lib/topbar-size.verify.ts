import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(root, "../app/globals.css"), "utf8");
const shell = readFileSync(join(root, "../components/shell/AppShell.tsx"), "utf8");
const portal = readFileSync(join(root, "../components/shell/PortalShell.tsx"), "utf8");

assert.match(css, /--topbar-control:\s*40px/);
assert.match(css, /\.topbar \{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) minmax\(200px, 260px\) auto/);
assert.match(css, /\.search \{[\s\S]*?height:\s*var\(--topbar-control\)/);
assert.match(css, /\.icon-btn \{[\s\S]*?width:\s*var\(--topbar-control\)/);
assert.match(css, /\.icon-btn \{[\s\S]*?height:\s*var\(--topbar-control\)/);
assert.match(css, /\.context-btn, \.profile-btn \{[\s\S]*?height:\s*var\(--topbar-control\)/);
assert.match(css, /\.profile-btn \{[\s\S]*?flex-shrink:\s*0/);
assert.match(css, /\.profile-meta \{/);
assert.match(css, /\.profile-name \{/);
assert.match(css, /\.profile-role \{/);
assert.match(css, /\.profile-btn \.avatar \{[\s\S]*?width:\s*28px/);
assert.doesNotMatch(css, /grid-template-columns:\s*minmax\(380px, 1\.8fr\)/);
assert.doesNotMatch(css, /\.profile-btn \{ max-width: 44px; padding: 4px; \}/);

assert.match(shell, /className="profile-meta"/);
assert.match(shell, /className="profile-name"/);
assert.match(shell, /className="profile-role"/);
assert.match(shell, /size=\{28\}/);
assert.doesNotMatch(shell, /hidden sm:grid/);

assert.match(portal, /className="profile-meta"/);
assert.match(portal, /size=\{28\}/);

console.log("topbar-size.verify ok");
