import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(root, "../app/globals.css"), "utf8");
const marketing = readFileSync(join(root, "../app/marketing.css"), "utf8");
const auth = readFileSync(join(root, "../components/auth/AuthCard.tsx"), "utf8");

assert.match(css, /--text:\s*0\.88rem/);
assert.match(css, /--text-title:\s*1\.12rem/);
assert.match(css, /--text-display:\s*1\.12rem/);
assert.match(css, /body \{[\s\S]*?font-size:\s*var\(--text\)/);
assert.match(css, /\.nav-link \{[\s\S]*?font-size:\s*var\(--text\)/);
assert.match(css, /\.app-shell \{[\s\S]*?font-size:\s*var\(--text\)/);
assert.match(css, /\.tab \{[\s\S]*?font-size:\s*var\(--text\)/);
assert.match(css, /\.table td \{[\s\S]*?font-size:\s*var\(--text\)/);
assert.match(css, /\.field-input \{[\s\S]*?font-size:\s*var\(--text\)/);
assert.match(css, /\.page-title \{[^}]*font-size:\s*var\(--text-title\)/);
assert.match(css, /\.overview-plan-toggle \{[^}]*font-size:\s*var\(--text\)/);
assert.match(css, /\.wbs-table \{[^}]*font-size:\s*var\(--text\)/);
assert.match(css, /\.schedule-table \{[^}]*font-size:\s*var\(--text\)/);
assert.doesNotMatch(css, /\.page-title \{[^}]*clamp\(1\.4rem/);
assert.doesNotMatch(css, /\.wbs-table \{[^}]*font-size:\s*13px/);
assert.doesNotMatch(css, /\.nav-link \{[^}]*font-size:\s*0\.88rem/);
assert.match(marketing, /\.mkt \{[^}]*font-size:\s*1rem/);
assert.doesNotMatch(auth, /text-\[1\.7rem\]/);

console.log("type-scale.verify ok");
