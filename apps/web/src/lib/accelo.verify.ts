import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { acceloImportEnabled, applyAcceloBatch, type AcceloCompanyRow, type AcceloJobRow, type AcceloWorkspace } from "./accelo";

const require = createRequire(import.meta.url);
const lib = require("../../../../api/accelo/_lib.js") as {
  acceloDate: (value: unknown) => string;
  hoursFromActivity: (row: { billable?: number; nonbillable?: number }) => number;
  mapCompany: (row: unknown) => { id: string; status: string; name: string };
  mapJob: (row: unknown) => { id: string; status: string; companyId: string; name: string };
  mapInvoice: (row: unknown) => { status: string; amount: number; outstanding: number; number: string };
  mapActivity: (row: unknown) => { hours: number; billable: boolean; projectId: string } | null;
  RESOURCES: { has: (value: string) => boolean };
  activityScanDone: (rows: Array<{ billable?: number; nonbillable?: number }>, field: string) => boolean;
};

assert.equal(lib.acceloDate(1700000000), "2023-11-14");
assert.equal(lib.acceloDate("2026-11-01"), "2026-11-01");
assert.equal(lib.hoursFromActivity({ billable: 3600, nonbillable: 1800 }), 1.5);
assert.equal(lib.mapActivity({ id: "9", billable: 0, nonbillable: 0, subject: "Email" }), null);
const time = lib.mapActivity({ id: "8", billable: 7200, nonbillable: 0, subject: "Design", against_type: "job", against_id: "4", staff: { id: "2", firstname: "Avery", surname: "Chen" } });
assert.equal(time?.hours, 2);
assert.equal(time?.projectId, "accelo-job-4");
assert.equal(time?.billable, true);

const company = lib.mapCompany({ id: "3", name: "North Supply", standing: "prospect", website: "https://north.example" }) as AcceloCompanyRow;
assert.equal(company.id, "accelo-co-3");
assert.equal(company.status, "Prospect");
const job = lib.mapJob({ id: "4", title: "Bridge rehab", against_type: "company", against_id: "3", against: "North Supply", status: { title: "Active" }, date_started: "2026-01-15" }) as AcceloJobRow;
assert.equal(job.companyId, "accelo-co-3");
assert.equal(job.status, "Active");
assert.equal(job.name, "Bridge rehab");
const invoice = lib.mapInvoice({ id: "15", invoice_number: "1042", amount: 1200, outstanding: 0, against_id: "3", subject: "November", date_raised: "2026-11-01", standing: "sent" });
assert.equal(invoice.number, "1042");
assert.equal(invoice.status, "Paid");
assert.equal(invoice.amount, 1200);
assert.ok(lib.RESOURCES.has("companies"));
assert.equal(lib.RESOURCES.has("secrets"), false);

const empty: AcceloWorkspace = { companies: [], contacts: [], projects: [], invoices: [], tickets: [], timeEntries: [], team: [] };
const next = applyAcceloBatch(empty, {
  companies: [company],
  jobs: [{ ...job, start: "2026-01-15", due: "2026-06-01", description: "Rehab", manager: "Avery Chen" }],
});
assert.equal(next.companies[0].name, "North Supply");
assert.equal(next.projects[0].companyId, "accelo-co-3");
assert.equal(next.projects[0].companyName, "North Supply");
const again = applyAcceloBatch(next, { companies: [{ ...company, name: "North Supply LLC" }] });
assert.equal(again.companies.length, 1);
assert.equal(again.companies[0].name, "North Supply LLC");

const root = dirname(fileURLToPath(import.meta.url));
const ui = readFileSync(join(root, "../components/settings/SettingsAccelo.tsx"), "utf8");
assert.match(ui, /ACCELO_DEPLOYMENT/);
assert.match(ui, /Count Accelo/);
assert.match(ui, /Import into DMC PMO/);
assert.equal(acceloImportEnabled(true, "count"), true);
assert.equal(acceloImportEnabled(true, null), true);
assert.equal(acceloImportEnabled(true, "import"), false);
assert.equal(acceloImportEnabled(false, null), false);
const timed = Array.from({ length: 100 }, (_, index) => ({ billable: 1000 - index, nonbillable: 0 }));
const emails = Array.from({ length: 100 }, () => ({ billable: 0, nonbillable: 0 }));
const unsorted = Array.from({ length: 100 }, (_, index) => ({ billable: index, nonbillable: 0 }));
assert.equal(lib.activityScanDone(timed, "billable"), false);
assert.equal(lib.activityScanDone(emails, "billable"), true);
assert.equal(lib.activityScanDone(unsorted, "billable"), false);
assert.equal(lib.activityScanDone([{ billable: 30, nonbillable: 0 }], "billable"), true);
assert.doesNotMatch(ui, /[\u2013\u2014]/);

console.log("accelo.verify ok");
