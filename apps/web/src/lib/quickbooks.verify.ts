import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import {
  connectQuickBooksHref,
  defaultQuickBooksPrefs,
  invoiceOutstanding,
  invoiceToQuickBooksPayload,
  mergeImportedCatalog,
  mergeImportedLedgers,
  mergeImportedTaxCodes,
  planCompanyImport,
  planInvoiceImport,
  quickBooksAccountLabel,
  quickbooksInvoicePatch,
  quickbooksSettingsHref,
  readQuickBooksPrefs,
} from "./quickbooks";
import { PRICING_PANELS } from "./invoice-pricing";
import type { Company, Contact, Invoice, TaxCode } from "./types";

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

assert.equal(quickBooksAccountLabel({ title: "Bank of America Ckg", code: "6016", quickbooksId: "35" }), "Bank of America Ckg (6016)");
assert.equal(readQuickBooksPrefs({ customerStatus: "nope", findAlternativeContact: true }).customerStatus, "Active");
assert.equal(readQuickBooksPrefs({ vendorStatus: "Inactive" }).vendorStatus, "Inactive");
assert.equal(defaultQuickBooksPrefs.customerStatus, "Active");

const ledgerPlan = mergeImportedLedgers(
  [{ id: "led-ar", title: "Accounts Receivable", code: "1100", active: true }],
  [{ quickbooksId: "1", title: "Accounts Receivable", code: "1100", active: true }, { quickbooksId: "2", title: "Bank of America Ckg", code: "6016", active: true }],
);
assert.equal(ledgerPlan.update.length, 1);
assert.equal(ledgerPlan.create[0].code, "6016");

const catalogPlan = mergeImportedCatalog(
  [{ id: "cat-services", title: "Services", kind: "Service", code: "SVC", active: true }],
  [{ quickbooksId: "9", title: "Hardware", kind: "Material", code: "HW", active: true }],
);
assert.equal(catalogPlan.create[0].title, "Hardware");

const company: Company = {
  id: "c-dmc",
  name: "Dillon Morgan Consulting",
  initials: "DM",
  status: "Active",
  accountManager: "Aishwarya",
  openProjects: 0,
  openTickets: 0,
  lastActivity: "",
  industry: "",
  billingTerms: "Net 30",
  portalContacts: 0,
};
const companyPlan = planCompanyImport(
  [company],
  [
    { quickbooksId: "10", name: "Dillon Morgan Consulting", email: "billing@dillonmorgan.com", active: true, kind: "Client" },
    { quickbooksId: "11", name: "North Supply", active: true, kind: "Contractor" },
  ],
);
assert.equal(companyPlan.update[0].id, "c-dmc");
assert.equal(companyPlan.update[0].patch.quickbooksId, "10");
assert.equal(companyPlan.create[0].name, "North Supply");

const contact: Contact = {
  id: "p-1",
  name: "Avery Chen",
  initials: "AC",
  companyId: "c-dmc",
  companyName: "Dillon Morgan Consulting",
  title: "Billing",
  email: "avery@dillonmorgan.com",
  portal: "Enabled",
  lastInteraction: "",
};
const invoicePlan = planInvoiceImport(
  [],
  [company],
  [contact],
  [
    {
      quickbooksId: "95",
      number: "1042",
      title: "November support",
      companyName: "Unknown LLC",
      billEmail: "avery@dillonmorgan.com",
      contactName: "Avery Chen",
      total: 1200,
      outstanding: 200,
      txnDate: "2026-11-01",
      dueDate: "2026-12-01",
      status: "Sent",
      lines: [{ description: "Support", amount: 1200 }],
      payments: [{ date: "2026-11-15", description: "QuickBooks payment", amount: 1000 }],
      href: "https://app.qbo.intuit.com/app/invoice?txnId=95",
    },
  ],
  { ...defaultQuickBooksPrefs, findAlternativeContact: true, pullInvoiceAsDefaultBiller: true },
  "2026-11-23T12:00:00.000Z",
);
assert.equal(invoicePlan.create[0].companyId, "c-dmc");
assert.equal(invoicePlan.create[0].billToName, "Avery Chen");
assert.equal(invoicePlan.create.length, 1);
assert.equal(invoiceOutstanding({ amount: 1200, payments: [{ id: "pay", date: "2026-11-15", description: "Paid", amount: 1000 }] }), 200);

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
assert.match(qbUi, /Find Alternative Contact/);
assert.match(qbUi, /Import Companies from QuickBooks Online/);
assert.match(qbUi, /No invoices currently being synced/);
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
  partyWhere: (status: string) => string;
  mapAccounts: (rows: unknown[]) => { title: string; code: string }[];
  mapParties: (rows: unknown[], kind: string) => { name: string; kind: string }[];
  mapInvoices: (
    invoices: unknown[],
    payments: unknown[],
    customers: unknown[],
    env: string,
  ) => { number: string; status: string; outstanding: number; payments: { amount: number }[]; companyName: string }[];
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
assert.equal(lib.partyWhere("Inactive"), " where Active = false");
assert.equal(lib.partyWhere("All"), "");
assert.equal(lib.partyWhere("Active"), " where Active = true");
const accounts = lib.mapAccounts([{ Id: "35", Name: "Bank of America Ckg", AcctNum: "6016", Active: true, AccountType: "Bank" }]);
assert.equal(accounts[0].code, "6016");
const parties = lib.mapParties([{ Id: "4", DisplayName: "North Supply", CompanyName: "North Supply", Active: true }], "Contractor");
assert.equal(parties[0].kind, "Contractor");
const imported = lib.mapInvoices(
  [{ Id: "95", DocNumber: "1042", TxnDate: "2026-11-01", DueDate: "2026-12-01", TotalAmt: 1200, Balance: 200, CustomerRef: { value: "4", name: "North Supply" }, Line: [{ DetailType: "SalesItemLineDetail", Description: "Support", Amount: 1200 }] }],
  [{ TxnDate: "2026-11-15", PrivateNote: "ACH", Line: [{ Amount: 1000, LinkedTxn: [{ TxnType: "Invoice", TxnId: "95" }] }] }],
  [{ Id: "4", DisplayName: "North Supply", GivenName: "Avery", FamilyName: "Chen" }],
  "production",
);
assert.equal(imported[0].number, "1042");
assert.equal(imported[0].status, "Sent");
assert.equal(imported[0].outstanding, 200);
assert.equal(imported[0].payments[0].amount, 1000);
assert.equal(imported[0].companyName, "North Supply");

console.log("quickbooks.verify ok");
