import { roundMoney } from "./invoice";
import type { CatalogItem, Company, Contact, Invoice, InvoiceLedger, InvoiceLineItem, InvoiceStatus, TaxCode } from "./types";

export type QuickBooksStatus = {
  configured: boolean;
  connected: boolean;
  companyName?: string;
  realmId?: string;
  environment?: "sandbox" | "production";
  callbackUrl?: string;
  error?: string;
};

export type QuickBooksLine = {
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
};

export type QuickBooksInvoicePayload = {
  companyName: string;
  billToName?: string;
  billToEmail?: string;
  billToLines?: string[];
  number: string;
  txnDate: string;
  dueDate: string;
  memo?: string;
  privateNote?: string;
  currency?: string;
  poNumber?: string;
  lines: QuickBooksLine[];
};

export type QuickBooksInvoiceResult =
  | { ok: true; id: string; docNumber: string; href: string }
  | { ok: false; error: string };

export type QuickBooksTaxCode = {
  title: string;
  rate: number;
  invoices: boolean;
  purchases: boolean;
  active: boolean;
  quickbooksId?: string;
};

const SETTINGS_HREF = "/app/settings/?section=billing&panel=quickbooks";

export function quickbooksSettingsHref() {
  return SETTINGS_HREF;
}

export function connectQuickBooksHref(returnTo = SETTINGS_HREF) {
  return `/api/quickbooks/connect?returnTo=${encodeURIComponent(returnTo)}`;
}

export function invoiceToQuickBooksPayload(invoice: Invoice, opts?: { email?: string }): QuickBooksInvoicePayload {
  const lines: QuickBooksLine[] = invoice.lineItems
    .filter((line) => line.includeInPdf !== false && roundMoney(line.amount) !== 0)
    .map((line) => ({
      description: line.description.trim() || line.kind,
      amount: roundMoney(line.amount),
      quantity: line.quantity ?? line.hours ?? 1,
      unitPrice: line.rate,
    }));
  if ((invoice.taxAmount || 0) > 0) {
    lines.push({ description: "Sales tax", amount: roundMoney(invoice.taxAmount || 0) });
  }
  return {
    companyName: invoice.companyName,
    billToName: invoice.billToName,
    billToEmail: opts?.email,
    billToLines: invoice.billToLines,
    number: invoice.number,
    txnDate: invoice.raised || invoice.due,
    dueDate: invoice.due,
    memo: invoice.description,
    privateNote: invoice.internalDescription,
    currency: invoice.currency || "USD",
    poNumber: invoice.poNumber,
    lines,
  };
}

export type QuickBooksPartyStatus = "Active" | "Inactive" | "All";

export type QuickBooksPrefs = {
  findAlternativeContact: boolean;
  pullInvoiceAsDefaultBiller: boolean;
  customerStatus: QuickBooksPartyStatus;
  vendorStatus: QuickBooksPartyStatus;
  paymentAccountId: string;
  paymentAccountName: string;
};

export const defaultQuickBooksPrefs: QuickBooksPrefs = {
  findAlternativeContact: false,
  pullInvoiceAsDefaultBiller: false,
  customerStatus: "Active",
  vendorStatus: "Active",
  paymentAccountId: "",
  paymentAccountName: "",
};

export type QuickBooksAccount = {
  quickbooksId: string;
  title: string;
  code: string;
  active: boolean;
  accountType?: string;
};

export type QuickBooksCatalogItem = {
  quickbooksId: string;
  title: string;
  kind: CatalogItem["kind"];
  code: string;
  active: boolean;
};

export type QuickBooksParty = {
  quickbooksId: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  active: boolean;
  contactName?: string;
  kind: "Client" | "Contractor";
};

export type QuickBooksInvoiceImport = {
  quickbooksId: string;
  number: string;
  title: string;
  companyName: string;
  billEmail?: string;
  contactName?: string;
  total: number;
  outstanding: number;
  txnDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lines: { description: string; amount: number }[];
  payments: { date: string; description: string; amount: number }[];
  href: string;
};

export type QuickBooksInvoiceDraft = QuickBooksInvoiceImport & {
  companyId?: string;
  billToName?: string;
  billToContactId?: string;
  ensureCompany?: QuickBooksParty;
};

function partyStatus(value: unknown): QuickBooksPartyStatus {
  return value === "Inactive" || value === "All" ? value : "Active";
}

export function readQuickBooksPrefs(value: unknown): QuickBooksPrefs {
  const row = value && typeof value === "object" ? (value as Partial<QuickBooksPrefs>) : {};
  return {
    findAlternativeContact: Boolean(row.findAlternativeContact),
    pullInvoiceAsDefaultBiller: Boolean(row.pullInvoiceAsDefaultBiller),
    customerStatus: partyStatus(row.customerStatus),
    vendorStatus: partyStatus(row.vendorStatus),
    paymentAccountId: typeof row.paymentAccountId === "string" ? row.paymentAccountId : "",
    paymentAccountName: typeof row.paymentAccountName === "string" ? row.paymentAccountName : "",
  };
}

export function quickBooksAccountLabel(row: Pick<QuickBooksAccount, "title" | "code" | "quickbooksId">) {
  if (row.code && row.code !== row.quickbooksId) return `${row.title} (${row.code})`;
  return row.title;
}

export function invoiceOutstanding(invoice: Pick<Invoice, "amount" | "payments">) {
  const paid = (invoice.payments || []).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  return Math.max(0, roundMoney((Number(invoice.amount) || 0) - paid));
}

export function mergeImportedLedgers(existing: InvoiceLedger[], incoming: QuickBooksAccount[]) {
  const create: Omit<InvoiceLedger, "id">[] = [];
  const update: { id: string; patch: Partial<InvoiceLedger> }[] = [];
  for (const row of incoming) {
    const title = row.title.trim();
    const code = row.code.trim();
    if (!title) continue;
    const hit = existing.find(
      (item) => (code && item.code.toLowerCase() === code.toLowerCase()) || item.title.toLowerCase() === title.toLowerCase(),
    );
    const patch = { title, code: code || title.slice(0, 12), active: row.active };
    if (hit) update.push({ id: hit.id, patch });
    else create.push(patch);
  }
  return { create, update };
}

export function mergeImportedCatalog(existing: CatalogItem[], incoming: QuickBooksCatalogItem[]) {
  const create: Omit<CatalogItem, "id">[] = [];
  const update: { id: string; patch: Partial<CatalogItem> }[] = [];
  for (const row of incoming) {
    const title = row.title.trim();
    if (!title) continue;
    const hit = existing.find((item) => item.title.toLowerCase() === title.toLowerCase());
    const patch = { title, kind: row.kind, code: row.code.trim() || title.slice(0, 8).toUpperCase(), active: row.active };
    if (hit) update.push({ id: hit.id, patch });
    else create.push(patch);
  }
  return { create, update };
}

export function planCompanyImport(existing: Company[], incoming: QuickBooksParty[]) {
  const create: QuickBooksParty[] = [];
  const update: { id: string; patch: Partial<Company> }[] = [];
  const seen = new Set<string>();
  for (const row of incoming) {
    const name = row.name.trim();
    if (!name) continue;
    const key = row.quickbooksId || name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const hit = existing.find(
      (company) =>
        (row.quickbooksId && company.quickbooksId === row.quickbooksId) || company.name.toLowerCase() === name.toLowerCase(),
    );
    if (hit) {
      update.push({
        id: hit.id,
        patch: {
          quickbooksId: row.quickbooksId,
          email: hit.email || row.email || "",
          phone: hit.phone || row.phone || "",
          website: hit.website || row.website || "",
          address: hit.address || row.address || "",
        },
      });
    } else {
      create.push({ ...row, name });
    }
  }
  return { create, update };
}

function companyForInvoice(
  row: QuickBooksInvoiceImport,
  companies: Company[],
  contacts: Contact[],
  prefs: QuickBooksPrefs,
) {
  const named = companies.find((company) => company.name.toLowerCase() === row.companyName.trim().toLowerCase());
  if (named) return named;
  if (!prefs.findAlternativeContact || !row.billEmail) return undefined;
  const contact = contacts.find((item) => item.email.toLowerCase() === row.billEmail?.toLowerCase());
  if (!contact) return undefined;
  return companies.find((company) => company.id === contact.companyId);
}

export function planInvoiceImport(
  invoices: Invoice[],
  companies: Company[],
  contacts: Contact[],
  incoming: QuickBooksInvoiceImport[],
  prefs: QuickBooksPrefs,
  syncedAt: string,
) {
  const create: QuickBooksInvoiceDraft[] = [];
  const update: { id: string; patch: Partial<Invoice>; ensureCompany?: QuickBooksParty }[] = [];
  const pendingCompanies = [...companies];
  for (const row of incoming) {
    if (!row.quickbooksId || !row.companyName.trim()) continue;
    let company = companyForInvoice(row, pendingCompanies, contacts, prefs);
    if (!company) {
      const pendingId = `customer:${row.companyName.trim().toLowerCase()}`;
      company = {
        id: `pending:${pendingId}`,
        name: row.companyName.trim(),
        initials: "",
        status: "Active",
        accountManager: "",
        openProjects: 0,
        openTickets: 0,
        lastActivity: "",
        industry: "",
        billingTerms: "Net 30",
        portalContacts: 0,
        email: row.billEmail || "",
      };
      pendingCompanies.push(company);
    }
    const contact =
      (prefs.pullInvoiceAsDefaultBiller &&
        contacts.find(
          (item) =>
            item.companyId === company?.id &&
            (row.contactName ? item.name.toLowerCase() === row.contactName.toLowerCase() : item.email.toLowerCase() === (row.billEmail || "").toLowerCase()),
        )) ||
      undefined;
    const billToName = prefs.pullInvoiceAsDefaultBiller ? contact?.name || row.contactName || company.name : company.name;
    const lines: InvoiceLineItem[] = row.lines.map((line, index) => ({
      id: `qb-line-${row.quickbooksId}-${index}`,
      kind: "service",
      description: line.description,
      amount: roundMoney(line.amount),
      includeInPdf: true,
    }));
    const payments = row.payments
      .filter((payment) => payment.amount > 0)
      .map((payment, index) => ({
        id: `qb-pay-${row.quickbooksId}-${index}`,
        date: payment.date,
        description: payment.description || "QuickBooks payment",
        amount: roundMoney(payment.amount),
      }));
    const ensureCompany = company.id.startsWith("pending:")
      ? {
          quickbooksId: company.id.slice("pending:".length),
          name: company.name,
          email: row.billEmail || "",
          active: true,
          contactName: row.contactName,
          kind: "Client" as const,
        }
      : undefined;
    const patch: Partial<Invoice> = {
      number: row.number,
      title: row.title,
      companyId: ensureCompany ? undefined : company.id,
      companyName: company.name,
      amount: roundMoney(row.total),
      due: row.dueDate,
      raised: row.txnDate,
      status: row.status,
      lineItems: lines,
      payments,
      billToName,
      billToContactId: contact?.id,
      currency: "USD",
      quickbooksId: row.quickbooksId,
      quickbooksDocNumber: row.number,
      quickbooksHref: row.href,
      quickbooksSyncedAt: syncedAt,
      quickbooksError: undefined,
    };
    const hit = invoices.find((invoice) => invoice.quickbooksId === row.quickbooksId || invoice.number === row.number);
    if (hit) update.push({ id: hit.id, patch, ensureCompany });
    else create.push({ ...row, companyId: patch.companyId, billToName, billToContactId: contact?.id, ensureCompany });
  }
  return { create, update };
}

export function mergeImportedTaxCodes(existing: TaxCode[], incoming: QuickBooksTaxCode[]) {
  const create: Omit<TaxCode, "id">[] = [];
  const update: { id: string; patch: Partial<TaxCode> }[] = [];
  for (const row of incoming) {
    const title = row.title.trim();
    if (!title) continue;
    const hit = existing.find((item) => item.title.toLowerCase() === title.toLowerCase());
    const patch = {
      rate: row.rate,
      invoices: row.invoices,
      purchases: row.purchases,
      active: row.active,
    };
    if (hit) update.push({ id: hit.id, patch });
    else create.push({ title, ...patch });
  }
  return { create, update };
}

function readError(data: { error?: string }, fallback: string) {
  return data.error || fallback;
}

export async function peekQuickBooks(): Promise<QuickBooksStatus> {
  try {
    const res = await fetch("/api/quickbooks/status", { credentials: "include" });
    if (res.status === 404) {
      return { configured: false, connected: false, error: "The QuickBooks API is not on this host." };
    }
    const data = (await res.json().catch(() => ({}))) as QuickBooksStatus & { error?: string };
    if (!res.ok) {
      return { configured: false, connected: false, error: readError(data, "QuickBooks status could not be read.") };
    }
    return {
      configured: Boolean(data.configured),
      connected: Boolean(data.connected),
      companyName: data.companyName,
      realmId: data.realmId,
      environment: data.environment,
      callbackUrl: data.callbackUrl,
    };
  } catch {
    return { configured: false, connected: false, error: "QuickBooks could not be reached from this host." };
  }
}

export async function disconnectQuickBooks() {
  const res = await fetch("/api/quickbooks/disconnect", { method: "POST", credentials: "include" });
  if (!res.ok && res.status !== 404) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(readError(data, "QuickBooks could not disconnect."));
  }
}

export async function createQuickBooksInvoice(invoice: Invoice, opts?: { email?: string }): Promise<QuickBooksInvoiceResult> {
  const payload = invoiceToQuickBooksPayload(invoice, opts);
  if (!payload.lines.length) return { ok: false, error: "Add at least one line before sending to QuickBooks." };
  try {
    const res = await fetch("/api/quickbooks/invoice", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; docNumber?: string; href?: string; error?: string };
    if (res.status === 401 || data.error === "not_connected") {
      return { ok: false, error: "Connect QuickBooks in Settings, Invoice & Pricing." };
    }
    if (res.status === 501) {
      return { ok: false, error: readError(data, "QuickBooks app keys are not set on this host.") };
    }
    if (!res.ok) return { ok: false, error: readError(data, "QuickBooks could not create the invoice.") };
    if (!data.id) return { ok: false, error: "QuickBooks did not return an invoice id." };
    return { ok: true, id: data.id, docNumber: data.docNumber || invoice.number, href: data.href || "" };
  } catch {
    return { ok: false, error: "QuickBooks could not be reached from this host." };
  }
}

export async function pullQuickBooks<T>(
  resource: "accounts" | "ledgers" | "items" | "companies" | "invoices",
  prefs?: Pick<QuickBooksPrefs, "customerStatus" | "vendorStatus">,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const params = new URLSearchParams({ resource });
  if (prefs?.customerStatus) params.set("customerStatus", prefs.customerStatus);
  if (prefs?.vendorStatus) params.set("vendorStatus", prefs.vendorStatus);
  try {
    const res = await fetch(`/api/quickbooks/pull?${params.toString()}`, { credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (res.status === 401 || data.error === "not_connected") {
      return { ok: false, error: "Connect QuickBooks before importing." };
    }
    if (res.status === 501) return { ok: false, error: readError(data, "QuickBooks app keys are not set on this host.") };
    if (!res.ok) return { ok: false, error: readError(data, "QuickBooks could not load that data.") };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "QuickBooks could not be reached from this host." };
  }
}

export async function importQuickBooksTaxCodes(): Promise<{ ok: true; codes: QuickBooksTaxCode[] } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/quickbooks/tax-codes", { credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as { codes?: QuickBooksTaxCode[]; error?: string };
    if (res.status === 401 || data.error === "not_connected") {
      return { ok: false, error: "Connect QuickBooks in Settings, Invoice & Pricing." };
    }
    if (res.status === 501) {
      return { ok: false, error: readError(data, "QuickBooks app keys are not set on this host.") };
    }
    if (!res.ok) return { ok: false, error: readError(data, "QuickBooks could not load tax codes.") };
    return { ok: true, codes: data.codes ?? [] };
  } catch {
    return { ok: false, error: "QuickBooks could not be reached from this host." };
  }
}

export function quickbooksInvoicePatch(result: Extract<QuickBooksInvoiceResult, { ok: true }>) {
  return {
    quickbooksId: result.id,
    quickbooksDocNumber: result.docNumber,
    quickbooksHref: result.href,
    quickbooksSyncedAt: new Date().toISOString(),
    quickbooksError: undefined,
  };
}
