import { uid } from "./seed";
import type { Invoice, InvoiceLineItem, InvoiceLineKind, InvoiceTemplate } from "./types";

export const FIRM_LETTERHEAD = {
  name: "Dillon Morgan Consulting",
  lines: [
    "5 Cowboys Way Suite 300",
    "Frisco, Texas 75034, United States",
    "Tel: 945-900-1797",
    "mzee.dillon@dillonmorgan.com",
    "www.dillonmorgan.com",
  ],
  mark: "DMC",
} as const;

export function invoiceBillToLines(invoice: Invoice, companyAddress?: string) {
  if (invoice.billToLines?.length) return invoice.billToLines;
  const lines = [invoice.billToName || invoice.companyName];
  if (invoice.billToName && invoice.billToName !== invoice.companyName) lines.push(invoice.companyName);
  if (companyAddress) {
    for (const part of companyAddress.split("\n").map((row) => row.trim()).filter(Boolean)) {
      lines.push(part);
    }
  }
  return lines;
}

export function invoicePdfName(invoice: Invoice) {
  return `invoice_${invoice.number}.pdf`;
}

export function invoiceHeading(invoice: Invoice) {
  if (invoice.title) return invoice.title;
  const po = invoice.poNumber ? ` - PO # ${invoice.poNumber}` : "";
  return `${invoice.companyName}${po}`;
}

export function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function dueFromTerms(raised: string, terms: string) {
  const days = Number((terms.match(/\d+/) || ["30"])[0]);
  const date = new Date(`${raised}T12:00:00`);
  if (Number.isNaN(date.getTime())) return raised;
  date.setDate(date.getDate() + (Number.isFinite(days) ? days : 30));
  return date.toISOString().slice(0, 10);
}

export function nextInvoiceNumber(existingCount: number) {
  return `INV-${2302 + existingCount}`;
}

export function emptyInvoiceLine(kind: InvoiceLineKind, extras?: Partial<InvoiceLineItem>): InvoiceLineItem {
  return {
    id: uid("il"),
    kind,
    description: extras?.description ?? "",
    hours: extras?.hours,
    rate: extras?.rate,
    quantity: extras?.quantity,
    amount: extras?.amount ?? 0,
    taxPct: extras?.taxPct ?? 0,
    includeInPdf: extras?.includeInPdf ?? true,
    sourceId: extras?.sourceId,
  };
}

export function computeLineAmount(line: Pick<InvoiceLineItem, "kind" | "hours" | "rate" | "quantity" | "amount">) {
  if (line.kind === "service" && line.hours != null && line.rate != null) {
    return roundMoney(line.hours * line.rate);
  }
  if (line.kind === "material" && line.quantity != null && line.rate != null) {
    return roundMoney(line.quantity * line.rate);
  }
  return roundMoney(line.amount || 0);
}

export function invoiceTotals(lines: InvoiceLineItem[]) {
  const groups = { service: 0, material: 0, expense: 0, purchase: 0 };
  let tax = 0;
  for (const line of lines) {
    const amount = computeLineAmount(line);
    groups[line.kind] += amount;
    tax += amount * ((line.taxPct ?? 0) / 100);
  }
  const subtotal = groups.service + groups.material + groups.expense + groups.purchase;
  return {
    service: roundMoney(groups.service),
    material: roundMoney(groups.material),
    expense: roundMoney(groups.expense),
    purchase: roundMoney(groups.purchase),
    tax: roundMoney(tax),
    subtotal: roundMoney(subtotal),
    total: roundMoney(subtotal + tax),
  };
}

export function fillInvoiceTitle(pattern: string, ctx: { company: string; project?: string }) {
  return pattern
    .replaceAll("{company}", ctx.company)
    .replaceAll("{project}", ctx.project || ctx.company)
    .trim();
}

export function blankTemplateLine(line: Omit<InvoiceLineItem, "id">): Omit<InvoiceLineItem, "id"> {
  return {
    kind: line.kind,
    description: line.description ?? "",
    taxPct: line.taxPct ?? 0,
    includeInPdf: line.includeInPdf !== false,
    amount: 0,
  };
}

export function blankInvoiceTemplate<T extends { summary?: string; defaultLines?: Omit<InvoiceLineItem, "id">[] }>(
  template: T,
): T {
  return {
    ...template,
    summary: "",
    defaultLines: (template.defaultLines ?? []).map((line) => blankTemplateLine(line)),
  };
}

export function linesFromTemplate(template: InvoiceTemplate, taxPct?: number): InvoiceLineItem[] {
  const rate = taxPct ?? template.taxPct;
  return (template.defaultLines ?? []).map((line) =>
    emptyInvoiceLine(line.kind, {
      ...blankTemplateLine(line),
      taxPct: line.taxPct ?? rate,
    }),
  );
}

export function invoiceFromDraft(partial: Invoice): Invoice {
  const totals = invoiceTotals(partial.lineItems);
  return {
    ...partial,
    amount: totals.total,
    taxAmount: totals.tax,
  };
}
