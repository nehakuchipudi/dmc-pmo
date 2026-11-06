import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { todayIso } from "./timesheet";
import {
  DEFAULT_RETAINER_INVOICE_LINE,
  RETAINER_CREATE_STATUSES,
  RETAINER_TYPES,
  companyProjectId,
  customFieldsForRetainerType,
  daysUntil,
  defaultPeriodBilling,
  earnedValue,
  formatRetainerInvoiceLine,
  nextPeriodRange,
  parseRetainerTags,
  periodEndFromStart,
  pickCurrentPeriod,
  retainerRate,
} from "./retainers";

const root = dirname(fileURLToPath(import.meta.url));

assert.equal(retainerRate(), 175);
assert.equal(retainerRate(250), 250);
assert.equal(earnedValue(10), 1750);
assert.equal(earnedValue(2, 200), 400);
assert.equal(companyProjectId([{ id: "p1", companyId: "c1" }], "c1"), "p1");
assert.equal(companyProjectId([{ id: "p1", companyId: "c1" }], "c2"), undefined);

const future = nextPeriodRange([{ end: "2027-01-31" }]);
assert.equal(future.start, "2027-02-01");
assert.equal(future.end, "2027-03-02");

const fromToday = nextPeriodRange([{ end: "2026-08-31" }]);
assert.equal(fromToday.start, todayIso());

const current = pickCurrentPeriod(
  [
    { start: "2026-09-01", end: "2026-09-30", status: "Opened" },
    { start: "2026-08-01", end: "2026-08-31", status: "Opened" },
    { start: "2026-07-01", end: "2026-07-31", status: "Closed" },
  ],
  "2026-11-04",
);
assert.equal(current.start, "2026-09-01");

const covering = pickCurrentPeriod(
  [
    { start: "2026-11-01", end: "2026-11-30", status: "Opened" },
    { start: "2026-10-01", end: "2026-10-31", status: "Opened" },
  ],
  "2026-11-04",
);
assert.equal(covering.start, "2026-11-01");

const past = daysUntil("2020-01-01");
assert.ok(past !== null && past < 0);

assert.deepEqual([...RETAINER_TYPES], ["Monthly T&M", "Pre-paid", "Fixed"]);
assert.deepEqual([...RETAINER_CREATE_STATUSES], ["Active", "Expired", "Cancelled"]);
assert.equal(defaultPeriodBilling("Monthly T&M"), "Time and materials");
assert.equal(defaultPeriodBilling("Pre-paid"), "Pre-paid");
assert.equal(periodEndFromStart("2026-11-06", 1, "Week"), "2026-11-13");
assert.equal(periodEndFromStart("2026-11-06", 1, "Month"), "2026-12-06");
assert.equal(customFieldsForRetainerType("Monthly T&M")[0]?.label, "Coverage window");
assert.equal(customFieldsForRetainerType("Pre-paid")[0]?.label, "Hours bank");
assert.equal(customFieldsForRetainerType("Fixed")[0]?.label, "Scope summary");
assert.deepEqual(parseRetainerTags("ops, support, ops"), ["ops", "support"]);
assert.equal(
  formatRetainerInvoiceLine(DEFAULT_RETAINER_INVOICE_LINE, "2026-11-06", "2026-12-06"),
  "Retainer for the period 2026-11-06 - 2026-12-06",
);

const form = readFileSync(join(root, "../components/retainers/RetainerCreateForm.tsx"), "utf8");
assert.match(form, /Field label="Title"/);
assert.match(form, /Field label="Company"/);
assert.match(form, /Create a company/);
assert.match(form, /Field label="Contact"/);
assert.match(form, /Create a contact/);
assert.match(form, /Field label="Manager"/);
assert.match(form, /Field label="Type"/);
assert.match(form, /Field label="Status"/);
assert.match(form, /Field label="Commenced"/);
assert.match(form, /Field label="Expiry"/);
assert.match(form, /Field label="Tags"/);
assert.match(form, /Period duration/);
assert.match(form, /Field label="Period billing"/);
assert.match(form, /Field label="Pre-paid price"/);
assert.match(form, /Field label="Period allowance"/);
assert.match(form, /Renew periods/);
assert.match(form, /Field label="Retainer rate"/);
assert.match(form, /Apply retainer rate for tickets and projects linked to this period/);
assert.match(form, /Field label="Billable contact"/);
assert.match(form, /Field label="Invoice template"/);
assert.match(form, /Field label="Service item"/);
assert.match(form, /Field label="Description on invoice line item"/);
assert.match(form, /Field label="Task template"/);
assert.match(form, /Field label="Material template"/);
assert.match(form, /Custom fields/);

const page = readFileSync(join(root, "../app/app/retainers/page.tsx"), "utf8");
assert.match(page, /RetainerCreateForm/);
assert.match(page, /title="New retainer"/);
assert.match(page, /onClose=\{\(\) => setOpen\(false\)\} xl/);

const store = readFileSync(join(root, "./store.ts"), "utf8");
assert.match(store, /invoiceTemplateId\?: string;/);
assert.match(store, /billableContactId\?: string;/);
assert.match(store, /periodBilling: input\.periodBilling/);
assert.match(store, /formatRetainerInvoiceLine/);

console.log("retainers.verify ok");
