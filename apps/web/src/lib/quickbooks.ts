import { roundMoney } from "./invoice";
import type { Invoice, TaxCode } from "./types";

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
