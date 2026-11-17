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
import { billedSourceIds, invoiceForFromTemplate, invoiceTotals, phaseChildIds } from "./invoice";

const root = dirname(fileURLToPath(import.meta.url));

assert.deepEqual([...EXPENSE_TYPES], ["Travel", "Mileage", "Meals", "Lodging", "Materials", "Other"]);
assert.equal(belongValue("project", "p1"), "project:p1");
assert.deepEqual(parseBelongValue("company:c1"), { kind: "company", id: "c1" });
assert.equal(expenseAmountForType("Mileage", 0, 100, DEFAULT_MILE_RATE), 67);
assert.equal(extraFieldsForExpenseType("Travel")[0]?.label, "Vendor");
assert.equal(invoiceTotals([]).purchase, 0);
assert.equal(invoiceForFromTemplate({ invoiceFor: "Work completed" } as never), "Work done");
assert.equal(invoiceForFromTemplate({ invoiceFor: "Milestone" } as never), "Milestone");
assert.deepEqual([...phaseChildIds([{ id: "p", projectId: "x", name: "P", due: "", start: "", status: "In Progress", kind: "phase" }, { id: "g", projectId: "x", name: "G", due: "", start: "", status: "In Progress", kind: "group", parentId: "p" }], "p")].sort(), ["g", "p"]);
assert.equal(billedSourceIds([{ projectId: "p", lineItems: [{ sourceId: "m1" }] }] as never, "p").has("m1"), true);
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
assert.match(invoice, /Select from existing templates/);
assert.match(invoice, /Invoice Template/);
assert.match(invoice, /Invoice For/);
assert.match(invoice, /Invoice Detail/);
assert.match(invoice, /Load selected work/);
assert.match(invoice, /Bill selected milestones instead of the whole project/);
assert.match(invoice, /Preview & Edit PDF/);
assert.match(invoice, /Save as Draft/);
assert.match(invoice, /Save & Send PDF/);
assert.match(invoice, /Add new Service line item/);

const projectBilling = readFileSync(join(root, "../app/app/projects/[id]/project-detail.tsx"), "utf8");
assert.match(projectBilling, /New invoice/);
assert.match(projectBilling, /InvoiceCreateForm/);

const invoiceLib = readFileSync(join(root, "invoice.ts"), "utf8");
assert.match(invoiceLib, /INVOICE_FOR_OPTIONS/);
assert.match(invoiceLib, /phaseChildIds/);
assert.match(invoiceLib, /timeMatchesWork/);

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
assert.match(settings, /Invoice & Pricing/);
assert.match(settings, /SettingsInvoicePricing/);
assert.match(settings, /PRICING_PANELS/);

const pricing = readFileSync(join(root, "../components/settings/SettingsInvoicePricing.tsx"), "utf8");
assert.match(pricing, /SettingsRates/);
assert.match(pricing, /SettingsTaxCodes/);
assert.match(pricing, /SettingsPayments/);
assert.match(pricing, /SettingsInvoiceLedgers/);
assert.match(pricing, /SettingsCatalogItems/);

const ratesUi = readFileSync(join(root, "../components/settings/SettingsRates.tsx"), "utf8");
assert.match(ratesUi, /Add Rate/);
assert.match(ratesUi, /Show Inactive Rates/);
assert.match(ratesUi, /Billable Rate/);
assert.match(ratesUi, /BILLING_RATE_KINDS/);
assert.match(ratesUi, /Edit Account Rate/);
assert.match(readFileSync(join(root, "invoice-pricing.ts"), "utf8"), /Cost Rate/);

const taxUi = readFileSync(join(root, "../components/settings/SettingsTaxCodes.tsx"), "utf8");
assert.match(taxUi, /Import QuickBooks Tax Codes/);
assert.match(taxUi, /Edit Account Tax/);
assert.match(taxUi, /Use tax code for Purchases/);
assert.match(taxUi, /Use tax code for Invoices/);
assert.match(taxUi, /QuickBooks is not connected/);

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
