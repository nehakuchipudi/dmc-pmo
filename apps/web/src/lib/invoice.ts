import { uid } from "./seed";
import type {
  Invoice,
  InvoiceLineItem,
  InvoiceLineItemize,
  InvoiceLineKind,
  InvoiceTemplate,
  Milestone,
  TimeEntry,
} from "./types";

export const INVOICE_FOR_OPTIONS = ["Work done", "Milestone", "Retainer period", "Expenses"] as const;
export type InvoiceForOption = (typeof INVOICE_FOR_OPTIONS)[number];
export const INVOICE_DETAIL_OPTIONS = ["Project", "Milestone"] as const;
export type InvoiceDetailOption = (typeof INVOICE_DETAIL_OPTIONS)[number];
export const INVOICE_ITEMIZE_OPTIONS: InvoiceLineItemize[] = ["None", "Staff", "Task"];
export const INVOICE_CURRENCIES = [
  { value: "USD", label: "USD - United States Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
];
export const INVOICE_TERMS = ["Immediately", "Due on receipt", "Net 15", "Net 30", "Net 45", "Net 60"] as const;

function daysFromTerms(terms: string) {
  const key = terms.trim().toLowerCase();
  if (key === "immediately" || key === "due on receipt" || key === "upon receipt") return 0;
  const match = terms.match(/\d+/);
  if (!match) return 30;
  const days = Number(match[0]);
  return Number.isFinite(days) ? days : 30;
}

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

export function invoiceManagerName(invoice: Invoice) {
  const name = (invoice.manager || invoice.owner || "").trim();
  if (!name || name.toLowerCase() === "unassigned") return "";
  return name;
}

export function invoiceDocumentModel(invoice: Invoice, companyAddress?: string) {
  const lines = invoice.lineItems.filter((line) => line.includeInPdf !== false);
  const totals = invoiceTotals(invoice.lineItems);
  return {
    billTo: invoiceBillToLines(invoice, companyAddress),
    heading: invoiceHeading(invoice),
    manager: invoiceManagerName(invoice),
    lines,
    totals,
    amountDue: invoice.amount,
    payments: invoice.payments ?? [],
    due: invoice.due,
    number: invoice.number,
    raised: invoice.raised,
    billingThrough: invoice.billingThrough,
  };
}

export function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function dueFromTerms(raised: string, terms: string) {
  const date = new Date(`${raised}T12:00:00`);
  if (Number.isNaN(date.getTime())) return raised;
  date.setDate(date.getDate() + daysFromTerms(terms));
  return date.toISOString().slice(0, 10);
}

export const INVOICE_DRAFT_ISSUES = ["company", "title", "billingThrough", "number", "lines"] as const;
export type InvoiceDraftIssue = (typeof INVOICE_DRAFT_ISSUES)[number];

export function invoiceDraftIssues(input: {
  companyId?: string;
  title?: string;
  billingThrough?: string;
  number?: string;
  lines?: { description?: string }[];
}): InvoiceDraftIssue[] {
  const issues: InvoiceDraftIssue[] = [];
  if (!input.companyId?.trim()) issues.push("company");
  if (!input.title?.trim()) issues.push("title");
  if (!input.billingThrough?.trim()) issues.push("billingThrough");
  if (!input.number?.trim()) issues.push("number");
  if (!(input.lines ?? []).some((line) => (line.description ?? "").trim())) issues.push("lines");
  return issues;
}

export function invoiceDraftIssueMessage(issues: InvoiceDraftIssue[]) {
  const labels: Record<InvoiceDraftIssue, string> = {
    company: "a company",
    title: "an invoice title",
    billingThrough: "a billing through date",
    number: "an invoice number",
    lines: "at least one line item",
  };
  const parts = issues.map((id) => labels[id]);
  if (!parts.length) return "";
  if (parts.length === 1) return `Add ${parts[0]}.`;
  if (parts.length === 2) return `Add ${parts[0]} and ${parts[1]}.`;
  return `Add ${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}.`;
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
    itemize: extras?.itemize ?? "None",
    milestoneId: extras?.milestoneId,
  };
}

export function applyPickedSourceLines(
  lines: InvoiceLineItem[],
  selectedIds: string[],
  makeLine: (id: string) => InvoiceLineItem | null,
): InvoiceLineItem[] {
  const selected = new Set(selectedIds);
  const kept = lines.filter((line) => {
    if (!line.sourceId) return true;
    if (!makeLine(line.sourceId)) return true;
    return selected.has(line.sourceId);
  });
  const have = new Set(kept.map((line) => line.sourceId).filter(Boolean) as string[]);
  const added = selectedIds
    .filter((id) => !have.has(id))
    .map((id) => makeLine(id))
    .filter((line): line is InvoiceLineItem => Boolean(line));
  return [...kept, ...added];
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

export function invoiceForFromTemplate(template?: InvoiceTemplate): InvoiceForOption {
  if (!template) return "Work done";
  if (template.invoiceFor === "Work completed") return "Work done";
  return template.invoiceFor;
}

export function templateInvoiceFor(value: InvoiceForOption): InvoiceTemplate["invoiceFor"] {
  if (value === "Work done") return "Work completed";
  return value;
}

export function invoiceSubject(invoice: Invoice) {
  return invoice.title?.trim() || invoice.description?.trim() || `Invoice ${invoice.number}`;
}

export function invoicePaidTotal(invoice: Invoice) {
  return (invoice.payments ?? []).reduce((sum, payment) => sum + payment.amount, 0);
}

export function calendarDaysBetween(fromIso: string, toIso: string) {
  if (!fromIso || !toIso) return 0;
  const from = new Date(`${fromIso}T12:00:00`).getTime();
  const to = new Date(`${toIso}T12:00:00`).getTime();
  return Math.round((to - from) / 86_400_000);
}

export type InvoiceOwingView =
  | { kind: "draft"; amount: number }
  | { kind: "paid"; daysAfterDue: number | null }
  | { kind: "owing"; amount: number; days: number; overdue: boolean };

export function invoiceOwingView(invoice: Invoice, today: string): InvoiceOwingView {
  const paid = invoicePaidTotal(invoice);
  if (invoice.status === "Paid" || paid >= invoice.amount) {
    const paidOn = invoice.payments?.at(-1)?.date;
    return { kind: "paid", daysAfterDue: paidOn ? calendarDaysBetween(invoice.due, paidOn) : null };
  }
  if (invoice.status === "Draft") return { kind: "draft", amount: invoice.amount };
  const daysToDue = calendarDaysBetween(today, invoice.due);
  return {
    kind: "owing",
    amount: Math.max(0, invoice.amount - paid),
    days: Math.abs(daysToDue),
    overdue: daysToDue < 0,
  };
}

export function invoiceOwingTip(view: InvoiceOwingView): string | undefined {
  if (view.kind !== "owing") return undefined;
  const unit = view.days === 1 ? "day" : "days";
  if (view.overdue) return `Overdue by ${view.days} ${unit}`;
  if (view.days === 0) return "Due today";
  return `Due in ${view.days} ${unit}`;
}

export function billedSourceIds(invoices: Invoice[], projectId?: string, exceptInvoiceId?: string) {
  return new Set(
    invoices
      .filter((invoice) => !exceptInvoiceId || invoice.id !== exceptInvoiceId)
      .filter((invoice) => !projectId || invoice.projectId === projectId)
      .flatMap((invoice) => invoice.lineItems.map((line) => line.sourceId).filter(Boolean) as string[]),
  );
}

export function phaseChildIds(milestones: Milestone[], phaseId: string) {
  return new Set([phaseId, ...milestones.filter((row) => row.parentId === phaseId).map((row) => row.id)]);
}

export function timeMatchesWork(input: {
  entry: TimeEntry;
  projectId?: string;
  childIds?: Set<string>;
  workStatus: "All" | "Approved";
  loggedBefore: string;
  includeNonBillable: boolean;
}) {
  if (input.projectId && input.entry.projectId !== input.projectId) return false;
  if (!input.includeNonBillable && !input.entry.billable) return false;
  if (input.workStatus === "Approved" && input.entry.status !== "Approved") return false;
  if (input.entry.status === "Rejected") return false;
  if (input.loggedBefore && input.entry.date > input.loggedBefore) return false;
  if (input.childIds && input.entry.milestoneId && !input.childIds.has(input.entry.milestoneId)) return false;
  if (input.childIds && !input.entry.milestoneId) return false;
  return true;
}
