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
  applyPickedSourceLines,
  billedSourceIds,
  calendarDaysBetween,
  invoiceOwingTip,
  invoiceOwingView,
  invoiceSubject,
  dueFromTerms,
  emptyInvoiceLine,
  INVOICE_TERMS,
  invoiceAttachedDeliverables,
  invoiceDocumentModel,
  invoiceDraftIssueMessage,
  invoiceDraftIssues,
  invoiceForFromTemplate,
  invoiceManagerName,
  invoiceSendDraft,
  invoiceTotals,
  phaseChildIds,
} from "./invoice";
import { buildInvoicePdf, mailAttachmentsForInvoice } from "./pdf";
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
  billedSourceIds([{ id: "a", projectId: "p", lineItems: [{ sourceId: "m1" }] }] as never, "p", "a").has("m1"),
  false,
);
assert.equal(invoiceSubject({ title: "Strategic Planning", number: "INV-144" } as never), "Strategic Planning");
assert.equal(calendarDaysBetween("2026-10-22", "2026-10-24"), 2);
assert.equal(invoiceOwingView({ status: "Paid", amount: 21000, due: "2026-10-22", payments: [{ date: "2026-10-01", amount: 21000 }] } as never, "2026-11-19").kind, "paid");
assert.equal(
  (invoiceOwingView({ status: "Paid", amount: 21000, due: "2026-10-22", payments: [{ date: "2026-10-01", amount: 21000 }] } as never, "2026-11-19") as { daysAfterDue: number }).daysAfterDue,
  -21,
);
assert.equal(invoiceOwingView({ status: "Overdue", amount: 15000, due: "2026-11-17", payments: [] } as never, "2026-11-19").kind, "owing");
assert.equal(
  (invoiceOwingView({ status: "Sent", amount: 21000, due: "2026-11-21", payments: [] } as never, "2026-11-19") as { days: number; overdue: boolean }).days,
  2,
);
assert.equal(
  invoiceOwingTip(invoiceOwingView({ status: "Sent", amount: 21000, due: "2026-11-21", payments: [] } as never, "2026-11-19")),
  "Due in 2 days",
);
assert.equal(
  invoiceOwingTip(invoiceOwingView({ status: "Overdue", amount: 24000, due: "2026-10-14", payments: [] } as never, "2026-11-19")),
  "Overdue by 36 days",
);
assert.equal(
  invoiceTotals([{ id: "1", kind: "purchase", description: "PO", amount: 50 }]).purchase,
  50,
);

const serviceLine = emptyInvoiceLine("service", { description: "Work", hours: 1, rate: 400, amount: 400 });
const afterPick = applyPickedSourceLines(
  [serviceLine],
  ["mat-badges", "exp-aws"],
  (id) => {
    if (id === "mat-badges") {
      return emptyInvoiceLine("material", { description: "Access badges", quantity: 12, rate: 18, amount: 216, sourceId: id });
    }
    if (id === "exp-aws") {
      return emptyInvoiceLine("expense", { description: "AWS sandbox", amount: 186, sourceId: id });
    }
    return null;
  },
);
const pickedTotals = invoiceTotals(afterPick);
assert.equal(pickedTotals.service, 400);
assert.equal(pickedTotals.material, 216);
assert.equal(pickedTotals.expense, 186);
assert.equal(pickedTotals.subtotal, 802);
assert.equal(pickedTotals.total, 802);
const afterClear = applyPickedSourceLines(afterPick, [], (id) => (id === "mat-badges" || id === "exp-aws" ? emptyInvoiceLine("expense", { sourceId: id }) : null));
assert.equal(invoiceTotals(afterClear).subtotal, 400);

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
assert.match(billing, /InvoiceRowActions/);
assert.match(billing, /InvoiceEditorModal/);
assert.match(billing, /ID #/);
assert.match(billing, /Invoice Subject/);
assert.match(billing, /Against/);
assert.match(billing, /Owner/);
assert.match(billing, /Raised/);
assert.match(billing, /Total owing/);
assert.match(billing, /billing-invoice-table/);
assert.match(billing, /OwingCell/);

const css = readFileSync(join(root, "../app/globals.css"), "utf8");
assert.match(css, /\.billing-invoice-table/);
assert.match(css, /\.billing-against/);
assert.match(css, /\.billing-owing-days\.is-overdue/);
assert.match(css, /\.billing-owing-tip/);
assert.match(billing, /billing-owing-tip/);
assert.match(billing, /OwingDays/);

const invoice = readFileSync(join(root, "../components/InvoiceCreateForm.tsx"), "utf8");
assert.match(invoice, /title="Expenses"/);
assert.match(invoice, /title="Purchases"/);
assert.match(invoice, /title="Materials"/);
assert.match(invoice, /Add expense/);
assert.match(invoice, /Add purchase/);
assert.match(invoice, /Add material/);
assert.match(invoice, /Add selected/);
assert.match(invoice, /toggleMaterials/);
assert.match(invoice, /toggleExpenses/);
assert.match(invoice, /togglePurchases/);
assert.match(invoice, /applyPickedSourceLines/);
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
assert.match(invoice, /Save changes/);
assert.match(invoice, /invoice\?: Invoice/);
assert.match(invoice, /Save & Send PDF/);
assert.match(invoice, /InvoiceDeliverablePicker/);
assert.match(invoice, /InvoiceSendCompose/);
assert.match(invoice, /setComposeInvoice/);
assert.doesNotMatch(invoice, /sendInvoice\(invoice\.id\)/);
assert.match(readFileSync(join(root, "../components/billing/InvoiceDeliverablePicker.tsx"), "utf8"), /Attach deliverable docs to invoice/);
assert.match(readFileSync(join(root, "../components/billing/InvoiceDeliverablePicker.tsx"), "utf8"), /type="button"/);
assert.match(readFileSync(join(root, "../components/billing/InvoiceDeliverablePicker.tsx"), "utf8"), /Upload deliverable/);
assert.doesNotMatch(readFileSync(join(root, "../components/billing/InvoiceDeliverablePicker.tsx"), "utf8"), /<label className="invoice-deliverable-upload">/);
assert.match(readFileSync(join(root, "../components/billing/InvoiceSendCompose.tsx"), "utf8"), /Where to send/);
assert.match(readFileSync(join(root, "../components/billing/InvoiceSendCompose.tsx"), "utf8"), /Refresh from project/);
assert.match(readFileSync(join(root, "../components/billing/InvoiceSendCompose.tsx"), "utf8"), /invoice-send-backdrop/);
assert.match(readFileSync(join(root, "../components/billing/InvoiceSendCompose.tsx"), "utf8"), /MailAttachmentCopies/);
assert.match(readFileSync(join(root, "../components/billing/MailAttachmentCopies.tsx"), "utf8"), /viewMailAttachment/);
assert.match(readFileSync(join(root, "../components/billing/MailAttachmentCopies.tsx"), "utf8"), /downloadMailAttachment/);
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
assert.match(projectBilling, /InvoiceRowActions/);
assert.match(projectBilling, /InvoiceEditorModal/);

const store = readFileSync(join(root, "store.ts"), "utf8");
assert.match(store, /deleteInvoice: \(id\) =>/);
assert.match(store, /skipMail/);
assert.match(store, /deliverableDocs: opts\?\.deliverableDocs/);
assert.match(store, /invoices: s\.invoices\.filter\(\(row\) => row\.id !== id\)/);

const rowActions = readFileSync(join(root, "../components/billing/InvoiceRowActions.tsx"), "utf8");
assert.match(rowActions, /\bView\b/);
assert.match(rowActions, /\bEdit\b/);
assert.match(rowActions, /Add activity/);
assert.match(rowActions, /Receive payment/);
assert.match(rowActions, /\bDelete\b/);
assert.match(rowActions, /Delete invoice/);
assert.match(rowActions, /manage_invoice/);

const companyBilling = readFileSync(join(root, "../app/app/companies/[id]/company-detail.tsx"), "utf8");
assert.match(companyBilling, /InvoiceRowActions/);
assert.match(companyBilling, /InvoiceEditorModal/);

const invoiceLib = readFileSync(join(root, "invoice.ts"), "utf8");
assert.match(invoiceLib, /invoiceOwingTip/);
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
const withProof: Invoice = {
  ...previewInvoice,
  attachDeliverables: true,
  deliverableDocs: [
    {
      id: "f-dmc-plan",
      name: "DMC_Project_Plan.pdf",
      kind: "pdf",
      sizeKb: 420,
      folder: "Deliverables",
      source: "project",
      fileId: "f-dmc-plan",
    },
  ],
};
assert.equal(invoiceAttachedDeliverables(withProof).length, 1);
assert.equal(invoiceDocumentModel(withProof).deliverables[0]?.name, "DMC_Project_Plan.pdf");
assert.ok(buildInvoicePdf(withProof).getNumberOfPages() >= 2);
const draft = invoiceSendDraft({
  invoice: withProof,
  project: { name: "DMC Internal Project", manager: "Akeal Hawkins" },
  company: { name: "Dillon Morgan Consulting" },
  contact: { name: "Mzee Dillon", firstName: "Mzee" },
  sender: { name: "Akeal Hawkins" },
});
assert.match(draft.subject, /INV-2313/);
assert.match(draft.body, /DMC Internal Project/);
assert.match(draft.body, /DMC_Project_Plan.pdf/);
assert.match(draft.body, /Hi Mzee/);

const detail = readFileSync(join(root, "../app/app/billing/[id]/invoice-detail.tsx"), "utf8");
assert.match(detail, /InvoiceDocument/);
assert.match(detail, /Email PDF/);
assert.match(detail, /InvoiceSendCompose/);
assert.match(detail, /MailAttachmentCopies/);
assert.match(detail, /mailAttachmentsForInvoice/);
assert.match(detail, /Send via Activity/);
assert.match(detail, /Send to QuickBooks/);
assert.match(detail, /Open in QuickBooks/);
assert.match(detail, /InvoiceEditorModal/);
assert.match(detail, /Delete invoice/);
assert.match(detail, /setEditOpen\(true\)/);

const paper = readFileSync(join(root, "../components/billing/InvoiceDocument.tsx"), "utf8");
assert.match(paper, /AMOUNT DUE THIS INVOICE/);
assert.match(paper, /Proof of deliverable/);
assert.match(paper, /invoice-proof-note/);
assert.match(paper, /invoice-payments/);
assert.match(paper, /DmcMark/);
assert.match(paper, /INVOICE DATE/);
assert.match(paper, /data-invoice-paper/);

const pdf = readFileSync(join(root, "pdf.ts"), "utf8");
assert.match(pdf, /FIRM_LETTERHEAD/);
assert.match(pdf, /invoicePdfName/);
assert.match(pdf, /invoiceDocumentModel/);
assert.match(pdf, /AMOUNT DUE THIS INVOICE/);
assert.match(pdf, /Invoice Items/);
assert.match(pdf, /html2canvas/);
assert.match(pdf, /data-invoice-paper/);
assert.match(pdf, /drawPreviewTable/);
assert.match(pdf, /Proof of deliverable/);
assert.match(pdf, /mailAttachmentsForInvoice/);
assert.match(pdf, /deliverableMailAttachment/);
assert.match(paper, /invoiceDocumentModel/);

async function assertMailCopies() {
  const copies = await mailAttachmentsForInvoice(withProof);
  assert.equal(copies.length, 2);
  assert.equal(copies[0].name, "invoice_INV-2313.pdf");
  assert.equal(copies[1].name, "DMC_Project_Plan.pdf");
  assert.ok(copies[1].contentBytes.length > 80);

  const uploaded = await mailAttachmentsForInvoice({
    ...previewInvoice,
    attachDeliverables: true,
    deliverableDocs: [
      {
        id: "up1",
        name: "signed-acceptance.pdf",
        kind: "pdf",
        sizeKb: 12,
        source: "upload",
        dataUrl: "data:application/pdf;base64,QUJD",
      },
    ],
  });
  assert.equal(uploaded[1].contentBytes, "QUJD");
}

const catalog = readFileSync(join(root, "demo-catalog.ts"), "utf8");
assert.match(catalog, /number: "50526"/);
assert.match(catalog, /Weeks 1-3: Discovery & Current State Mapping/);
assert.match(catalog, /QuickBooks:/);

void assertMailCopies()
  .then(() => {
    console.log("billing.verify ok");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
