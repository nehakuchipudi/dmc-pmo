import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "apps/web/src");
const BAD = /[\u2013\u2014]/;
let failed = false;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path);
    else if (/\.(tsx|ts|jsx|js|css|md)$/.test(name)) {
      const text = readFileSync(path, "utf8");
      if (BAD.test(text)) {
        console.error(`Forbidden dash character found in ${path}`);
        failed = true;
      }
    }
  }
}

walk(ROOT);
if (failed) process.exit(1);
console.log("Copy check passed: no em/en dashes in apps/web/src");
