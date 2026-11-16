import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync("npx", ["--yes", "tsx", "src/lib/plan-pdf.verify.ts"], {
  cwd: path.join(root, "apps/web"),
  encoding: "utf8",
});
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
