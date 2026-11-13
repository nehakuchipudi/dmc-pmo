import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_MILE_RATE,
  EXPENSE_TYPES,
  belongValue,
  expenseAmountForType,
  extraFieldsForExpenseType,
  parseBelongValue,
} from "./billing-items";
import { invoiceTotals } from "./invoice";

const root = dirname(fileURLToPath(import.meta.url));

assert.deepEqual([...EXPENSE_TYPES], ["Travel", "Mileage", "Meals", "Lodging", "Materials", "Other"]);
assert.equal(belongValue("project", "p1"), "project:p1");
assert.deepEqual(parseBelongValue("company:c1"), { kind: "company", id: "c1" });
assert.equal(expenseAmountForType("Mileage", 0, 100, DEFAULT_MILE_RATE), 67);
assert.equal(extraFieldsForExpenseType("Travel")[0]?.label, "Vendor");
assert.equal(invoiceTotals([]).purchase, 0);
assert.equal(
  invoiceTotals([{ id: "1", kind: "purchase", description: "PO", amount: 50 }]).purchase,
  50,
);

const expenseForm = readFileSync(join(root, "../components/billing/ExpenseCreateForm.tsx"), "utf8");
assert.match(expenseForm, /Field label="Title"/);
assert.match(expenseForm, /Field label="Type"/);
assert.match(expenseForm, /Where does this expense belong/);
assert.match(expenseForm, /Field label="Date"/);
assert.match(expenseForm, /Today/);
assert.match(expenseForm, /Field label="Owner"/);
assert.match(expenseForm, /Field label="Attachment"/);
assert.match(expenseForm, /Add another/);
assert.match(expenseForm, /Select a type to adjust more options/);

const shell = readFileSync(join(root, "../components/shell/AppShell.tsx"), "utf8");
assert.doesNotMatch(shell, /menu-heading">Activities/);
assert.doesNotMatch(shell, /\["portfolio", "Portfolio"\]/);
assert.doesNotMatch(shell, /\["objective", "Objective"\]/);
assert.doesNotMatch(shell, /\["risk", "Risk"\]/);
assert.match(shell, /\["expense", "Expense"\]/);
assert.doesNotMatch(shell, /\["time", "Log time"\]/);

const billing = readFileSync(join(root, "../app/app/billing/page.tsx"), "utf8");
assert.match(billing, /New Expense/);
assert.match(billing, /New Purchase/);
assert.match(billing, /New Material/);
assert.match(billing, /ExpenseCreateForm/);
assert.match(billing, /PurchaseCreateForm/);
assert.match(billing, /MaterialCreateForm/);

const invoice = readFileSync(join(root, "../components/InvoiceCreateForm.tsx"), "utf8");
assert.match(invoice, /title="Expenses"/);
assert.match(invoice, /title="Purchases"/);
assert.match(invoice, /title="Materials"/);
assert.match(invoice, /Add expense/);
assert.match(invoice, /Add purchase/);
assert.match(invoice, /Add material/);
assert.match(invoice, /Add selected/);
assert.match(invoice, /defaultLines: \[\]/);

const seed = readFileSync(join(root, "seed.ts"), "utf8");
assert.match(seed, /id: "tpl-tm"/);
assert.match(seed, /id: "tpl-progress"/);
assert.match(seed, /id: "tpl-retainer"/);
assert.match(seed, /id: "tpl-fixed"/);
assert.match(seed, /id: "tpl-expense"/);
assert.doesNotMatch(seed, /amount: 8500/);
assert.doesNotMatch(seed, /amount: 1800/);
assert.doesNotMatch(seed, /amount: 7000/);
assert.doesNotMatch(seed, /amount: 12000/);
assert.doesNotMatch(seed, /amount: 420/);

const settings = readFileSync(join(root, "../components/settings/SettingsWorkspace.tsx"), "utf8");
assert.match(settings, /id: "billing"/);
assert.match(settings, /SettingsBilling/);

const billingSettings = readFileSync(join(root, "../components/settings/SettingsBilling.tsx"), "utf8");
assert.match(billingSettings, /Invoice templates live here/);
assert.match(billingSettings, /Time and materials/);
assert.match(billingSettings, /Progress billing/);
assert.match(billingSettings, /Amounts stay off the template/);

const snapshot = readFileSync(join(root, "workspace-snapshot.ts"), "utf8");
assert.match(snapshot, /TEMPLATES_BLANK_GENERATION/);
assert.match(snapshot, /sanitizeInvoiceTemplates/);
assert.doesNotMatch(invoice, /Field label="Summary"/);

const letterhead = readFileSync(join(root, "invoice.ts"), "utf8");
assert.match(letterhead, /5 Cowboys Way Suite 300/);
assert.match(letterhead, /mzee.dillon@dillonmorgan.com/);

const detail = readFileSync(join(root, "../app/app/billing/[id]/invoice-detail.tsx"), "utf8");
assert.match(detail, /InvoiceDocument/);
assert.match(detail, /Email PDF/);
assert.match(detail, /Send via Activity/);

const paper = readFileSync(join(root, "../components/billing/InvoiceDocument.tsx"), "utf8");
assert.match(paper, /AMOUNT DUE THIS INVOICE/);
assert.match(paper, /DmcMark/);
assert.match(paper, /INVOICE DATE/);

const pdf = readFileSync(join(root, "pdf.ts"), "utf8");
assert.match(pdf, /FIRM_LETTERHEAD/);
assert.match(pdf, /invoicePdfName/);

const catalog = readFileSync(join(root, "demo-catalog.ts"), "utf8");
assert.match(catalog, /number: "50526"/);
assert.match(catalog, /Weeks 1-3: Discovery & Current State Mapping/);
assert.match(catalog, /QuickBooks:/);

console.log("billing.verify ok");
