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
import {
  billedSourceIds,
  dueFromTerms,
  INVOICE_TERMS,
  invoiceDocumentModel,
  invoiceDraftIssueMessage,
  invoiceDraftIssues,
  invoiceForFromTemplate,
  invoiceManagerName,
  invoiceTotals,
  phaseChildIds,
} from "./invoice";
import { buildInvoicePdf } from "./pdf";
import type { Invoice } from "./types";

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
assert.match(invoice, /Preview PDF/);
assert.doesNotMatch(invoice, /Preview & Edit PDF/);
assert.match(invoice, /Invoice preview/);
assert.match(invoice, /InvoiceDocument/);
assert.match(invoice, /setPreview/);
assert.doesNotMatch(invoice, /exportInvoicePdf\(draft/);
assert.match(invoice, /Save as Draft/);
assert.match(invoice, /Save & Send PDF/);
assert.match(invoice, /Add new Service line item/);
assert.match(invoice, /INVOICE_TERMS/);
assert.match(invoice, /invalid=\{issues.includes\("company"\)\}/);
assert.match(invoice, /invalid=\{issues.includes\("title"\)\}/);
assert.match(invoice, /invalid=\{issues.includes\("lines"\)/);
assert.match(invoice, /invoiceDraftIssueMessage/);
assert.doesNotMatch(invoice, /Add a company and at least one line item/);

const projectBilling = readFileSync(join(root, "../app/app/projects/[id]/project-detail.tsx"), "utf8");
assert.match(projectBilling, /New invoice/);
assert.match(projectBilling, /InvoiceCreateForm/);

const invoiceLib = readFileSync(join(root, "invoice.ts"), "utf8");
assert.match(invoiceLib, /INVOICE_FOR_OPTIONS/);
assert.match(invoiceLib, /phaseChildIds/);
assert.match(invoiceLib, /timeMatchesWork/);
assert.deepEqual([...INVOICE_TERMS], ["Immediately", "Due on receipt", "Net 15", "Net 30", "Net 45", "Net 60"]);
assert.equal(dueFromTerms("2026-11-17", "Immediately"), "2026-11-17");
assert.equal(dueFromTerms("2026-11-17", "Due on receipt"), "2026-11-17");
assert.equal(dueFromTerms("2026-11-17", "Net 30"), "2026-12-17");
assert.deepEqual(
  invoiceDraftIssues({
    companyId: "c-dmc",
    title: "Invoice for DMC Internal Project",
    billingThrough: "2026-11-17",
    number: "INV-2306",
    lines: [],
  }),
  ["lines"],
);
assert.equal(invoiceDraftIssueMessage(["lines"]), "Add at least one line item.");
assert.equal(invoiceDraftIssueMessage(["company", "lines"]), "Add a company and at least one line item.");

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
assert.match(pricing, /SettingsQuickBooks/);

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
assert.match(taxUi, /importQuickBooksTaxCodes/);
assert.doesNotMatch(taxUi, /QuickBooks is not connected/);

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
assert.match(letterhead, /invoiceDocumentModel/);

const previewInvoice: Invoice = {
  id: "inv-preview",
  number: "INV-2313",
  companyId: "c-dmc",
  companyName: "Dillon Morgan Consulting",
  amount: 96480,
  terms: "Net 30",
  due: "2026-12-13",
  status: "Draft",
  title: "DMC Internal Project progress billing",
  owner: "Unassigned",
  raised: "2026-11-13",
  billingThrough: "2026-11-13",
  lineItems: [
    {
      id: "il-1",
      kind: "service",
      description: "DMC Internal Project progress billing",
      amount: 96480,
    },
  ],
};
assert.equal(invoiceManagerName(previewInvoice), "");
const previewModel = invoiceDocumentModel(previewInvoice);
assert.equal(previewModel.heading, "DMC Internal Project progress billing");
assert.equal(previewModel.billTo[0], "Dillon Morgan Consulting");
assert.equal(previewModel.manager, "");
assert.equal(previewModel.totals.subtotal, 96480);
assert.equal(previewModel.amountDue, 96480);
assert.equal(previewModel.payments.length, 0);
const pdfDoc = buildInvoicePdf(previewInvoice);
assert.equal(pdfDoc.getNumberOfPages(), 1);

const detail = readFileSync(join(root, "../app/app/billing/[id]/invoice-detail.tsx"), "utf8");
assert.match(detail, /InvoiceDocument/);
assert.match(detail, /Email PDF/);
assert.match(detail, /Send via Activity/);
assert.match(detail, /Send to QuickBooks/);
assert.match(detail, /Open in QuickBooks/);

const paper = readFileSync(join(root, "../components/billing/InvoiceDocument.tsx"), "utf8");
assert.match(paper, /AMOUNT DUE THIS INVOICE/);
assert.match(paper, /DmcMark/);
assert.match(paper, /INVOICE DATE/);

const pdf = readFileSync(join(root, "pdf.ts"), "utf8");
assert.match(pdf, /FIRM_LETTERHEAD/);
assert.match(pdf, /invoicePdfName/);
assert.match(pdf, /invoiceDocumentModel/);
assert.match(pdf, /AMOUNT DUE THIS INVOICE/);
assert.match(pdf, /Invoice Items/);
assert.match(paper, /invoiceDocumentModel/);

const catalog = readFileSync(join(root, "demo-catalog.ts"), "utf8");
assert.match(catalog, /number: "50526"/);
assert.match(catalog, /Weeks 1-3: Discovery & Current State Mapping/);
assert.match(catalog, /QuickBooks:/);

console.log("billing.verify ok");
