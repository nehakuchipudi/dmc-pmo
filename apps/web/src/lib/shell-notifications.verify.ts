import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const shell = readFileSync(join(root, "../components/shell/AppShell.tsx"), "utf8");
const store = readFileSync(join(root, "./store.ts"), "utf8");
const css = readFileSync(join(root, "../app/globals.css"), "utf8");
const users = readFileSync(join(root, "../components/settings/SettingsWorkspace.tsx"), "utf8");

assert.match(shell, /aria-label="Notifications"/);
assert.match(shell, /setNotesOpen\(\(open\) => !open\)/);
assert.match(shell, /title="Notifications"/);
assert.doesNotMatch(shell, /aria-label="Schedule"/);
assert.match(shell, /Mark all read/);
assert.match(shell, /notifications\.map\(\(n\) =>/);
assert.doesNotMatch(shell, /notifications\.slice\(0, 8\)/);

assert.match(store, /markAllNotificationsRead: \(\) => \{/);
assert.match(store, /persistOutbox\(get\)/);
assert.match(store, /notes: get\(\)\.notifications/);

assert.match(css, /\.settings-users \.table th:nth-child\(6\),\n\.settings-users \.table td:nth-child\(6\) \{ width: 16%; \}/);
assert.match(css, /\.settings-users \.table th:last-child,\n\.settings-users \.table td:last-child \{\n  width: 8%;/);
assert.match(users, /whitespace-nowrap/);
assert.match(users, /Invited \{m\.invitedAt\}/);
assert.match(users, /RowMenu/);
assert.match(users, /icon-btn/);

console.log("shell-notifications.verify ok");
