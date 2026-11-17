import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import {
  connectQuickBooksHref,
  invoiceToQuickBooksPayload,
  mergeImportedTaxCodes,
  quickbooksInvoicePatch,
  quickbooksSettingsHref,
} from "./quickbooks";
import { PRICING_PANELS } from "./invoice-pricing";
import type { Invoice, TaxCode } from "./types";

assert.equal(quickbooksSettingsHref(), "/app/settings/?section=billing&panel=quickbooks");
assert.match(connectQuickBooksHref(), /\/api\/quickbooks\/connect/);
assert.ok(PRICING_PANELS.some((row) => row.id === "quickbooks"));

const invoice: Invoice = {
  id: "inv-1",
  number: "INV-2313",
  companyId: "c-dmc",
  companyName: "Dillon Morgan Consulting",
  amount: 96480,
  terms: "Net 30",
  due: "2026-12-13",
  status: "Draft",
  title: "DMC Internal Project progress billing",
  description: "Progress billing",
  internalDescription: "Keep internal",
  poNumber: "PO-9",
  raised: "2026-11-13",
  currency: "USD",
  taxAmount: 0,
  lineItems: [
    { id: "il-1", kind: "service", description: "PMO support", amount: 48000, hours: 160, rate: 300 },
    { id: "il-2", kind: "service", description: "Hidden", amount: 10, includeInPdf: false },
  ],
};

const payload = invoiceToQuickBooksPayload(invoice, { email: "billing@dillonmorgan.com" });
assert.equal(payload.companyName, "Dillon Morgan Consulting");
assert.equal(payload.billToEmail, "billing@dillonmorgan.com");
assert.equal(payload.number, "INV-2313");
assert.equal(payload.lines.length, 1);
assert.equal(payload.lines[0].description, "PMO support");
assert.equal(payload.lines[0].amount, 48000);
assert.equal(payload.poNumber, "PO-9");

const taxed = invoiceToQuickBooksPayload({ ...invoice, taxAmount: 100 });
assert.equal(taxed.lines.at(-1)?.description, "Sales tax");
assert.equal(taxed.lines.at(-1)?.amount, 100);

const existing: TaxCode[] = [{ id: "tax-frisco", title: "TX-Frisco", rate: 8.25, invoices: true, purchases: false, active: true }];
const plan = mergeImportedTaxCodes(existing, [
  { title: "TX-Frisco", rate: 8.25, invoices: true, purchases: false, active: true },
  { title: "TX-Dallas", rate: 8.25, invoices: true, purchases: false, active: true },
]);
assert.equal(plan.update.length, 1);
assert.equal(plan.update[0].id, "tax-frisco");
assert.equal(plan.create.length, 1);
assert.equal(plan.create[0].title, "TX-Dallas");

const patch = quickbooksInvoicePatch({ ok: true, id: "95", docNumber: "INV-2313", href: "https://app.sandbox.qbo.intuit.com/app/invoice?txnId=95" });
assert.equal(patch.quickbooksId, "95");
assert.match(patch.quickbooksHref, /txnId=95/);

const root = dirname(fileURLToPath(import.meta.url));
const taxUi = readFileSync(join(root, "../components/settings/SettingsTaxCodes.tsx"), "utf8");
assert.match(taxUi, /importQuickBooksTaxCodes/);
assert.doesNotMatch(taxUi, /QuickBooks is not connected/);
const qbUi = readFileSync(join(root, "../components/settings/SettingsQuickBooks.tsx"), "utf8");
assert.match(qbUi, /Connect QuickBooks/);
assert.match(qbUi, /QB_CLIENT_ID/);
assert.doesNotMatch(qbUi, /[\u2013\u2014]/);
const detail = readFileSync(join(root, "../app/app/billing/[id]/invoice-detail.tsx"), "utf8");
assert.match(detail, /Send to QuickBooks/);
const form = readFileSync(join(root, "../components/InvoiceCreateForm.tsx"), "utf8");
assert.match(form, /Create in QuickBooks/);

const require = createRequire(import.meta.url);
const lib = require("../../../../api/quickbooks/_lib.js") as {
  escapeQbo: (value: string) => string;
  apiHost: (env: string) => string;
  invoiceHref: (env: string, id: string) => string;
  parseFault: (payload: unknown) => string;
  mapTaxCodes: (codes: unknown[], rates: unknown[]) => { title: string; rate: number }[];
  qboInvoiceBody: (input: {
    customerId: string;
    itemId: string;
    number: string;
    txnDate: string;
    dueDate: string;
    memo?: string;
    privateNote?: string;
    poNumber?: string;
    lines: { description: string; amount: number; quantity?: number }[];
  }) => { DocNumber: string; Line: { Amount: number; SalesItemLineDetail: { Qty: number; UnitPrice: number } }[]; PrivateNote: string };
};
assert.equal(lib.escapeQbo("O'Brien"), "O''Brien");
assert.equal(lib.apiHost("sandbox"), "https://sandbox-quickbooks.api.intuit.com");
assert.equal(lib.apiHost("production"), "https://quickbooks.api.intuit.com");
assert.match(lib.invoiceHref("sandbox", "123"), /sandbox/);
assert.equal(lib.parseFault({ Fault: { Error: [{ Message: "Duplicate", Detail: "DocNumber" }] } }), "Duplicate: DocNumber");
const mapped = lib.mapTaxCodes(
  [{ Id: "1", Name: "TX", Active: true, SalesTaxRateList: { TaxRateDetail: [{ TaxRateRef: { value: "9" } }] } }],
  [{ Id: "9", RateValue: "8.25" }],
);
assert.equal(mapped[0].title, "TX");
assert.equal(mapped[0].rate, 8.25);
const qbo = lib.qboInvoiceBody({
  customerId: "1",
  itemId: "2",
  number: "INV-1",
  txnDate: "2026-11-17",
  dueDate: "2026-12-17",
  memo: "Work",
  privateNote: "Internal",
  poNumber: "PO-9",
  lines: [{ description: "PMO", amount: 100, quantity: 2 }],
});
assert.equal(qbo.DocNumber, "INV-1");
assert.equal(qbo.Line[0].Amount, 100);
assert.equal(qbo.Line[0].SalesItemLineDetail.Qty, 2);
assert.equal(qbo.Line[0].SalesItemLineDetail.UnitPrice, 50);
assert.match(qbo.PrivateNote, /PO-9/);

console.log("quickbooks.verify ok");
