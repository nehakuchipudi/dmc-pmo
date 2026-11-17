import type { BillingRate, CatalogItem, InvoiceLedger, PaymentMethod, TaxCode } from "./types";

export const PRICING_SEED_GENERATION = "pricing-v1";

export const BILLING_RATE_KINDS: BillingRate["kind"][] = ["Billable Rate", "Cost Rate"];
export const CATALOG_ITEM_KINDS: CatalogItem["kind"][] = ["Service", "Material"];

export const PRICING_PANELS = [
  { id: "settings", label: "Settings" },
  { id: "quickbooks", label: "QuickBooks" },
  { id: "payments", label: "Payments" },
  { id: "tax", label: "Tax Codes" },
  { id: "ledgers", label: "Invoice Ledgers" },
  { id: "items", label: "Material & Service Items" },
  { id: "rates", label: "Rates" },
] as const;

export type PricingPanel = (typeof PRICING_PANELS)[number]["id"];

export function isPricingPanel(value: string | null): value is PricingPanel {
  return !!value && PRICING_PANELS.some((row) => row.id === value);
}

export function formatPricingRate(value: number) {
  return (Number(value) || 0).toFixed(2);
}

export function formatTaxRate(value: number) {
  const n = Number(value) || 0;
  if (Number.isInteger(n)) return `${n}%`;
  return `${n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
}

export const seedBillingRates: BillingRate[] = [
  { id: "rate-md-b", title: "Managing Director", rate: 225, kind: "Billable Rate", active: true },
  { id: "rate-pmo-b", title: "PMO Director", rate: 210, kind: "Billable Rate", active: true },
  { id: "rate-dl-b", title: "Delivery Lead", rate: 185, kind: "Billable Rate", active: true },
  { id: "rate-pm-b", title: "Project Manager", rate: 185, kind: "Billable Rate", active: true },
  { id: "rate-po-b", title: "Project Owner", rate: 185, kind: "Billable Rate", active: true },
  { id: "rate-fp-b", title: "Finance Partner", rate: 165, kind: "Billable Rate", active: true },
  { id: "rate-con-b", title: "Consultant", rate: 145, kind: "Billable Rate", active: true },
  { id: "rate-an-b", title: "Analyst", rate: 145, kind: "Billable Rate", active: true },
  { id: "rate-md-c", title: "Managing Director", rate: 80, kind: "Cost Rate", active: true },
  { id: "rate-pmo-c", title: "PMO Director", rate: 75, kind: "Cost Rate", active: true },
  { id: "rate-dl-c", title: "Delivery Lead", rate: 65, kind: "Cost Rate", active: true },
  { id: "rate-pm-c", title: "Project Manager", rate: 65, kind: "Cost Rate", active: true },
  { id: "rate-po-c", title: "Project Owner", rate: 65, kind: "Cost Rate", active: true },
  { id: "rate-fp-c", title: "Finance Partner", rate: 58, kind: "Cost Rate", active: true },
  { id: "rate-con-c", title: "Consultant", rate: 52, kind: "Cost Rate", active: true },
  { id: "rate-an-c", title: "Analyst", rate: 52, kind: "Cost Rate", active: true },
];

export const seedTaxCodes: TaxCode[] = [
  { id: "tax-frisco", title: "TX-Frisco", rate: 8.25, invoices: true, purchases: false, active: true },
  { id: "tax-plano", title: "TX-Plano", rate: 8.25, invoices: true, purchases: false, active: true },
  { id: "tax-oos", title: "Out of scope", rate: 0, invoices: true, purchases: false, active: true },
  { id: "tax-oos-po", title: "Out of scope (purchase)", rate: 0, invoices: false, purchases: true, active: true },
];

export const seedPaymentMethods: PaymentMethod[] = [
  { id: "pay-check", title: "Check", active: true },
  { id: "pay-ach", title: "ACH / Bank transfer", active: true },
  { id: "pay-card", title: "Credit card", active: true },
  { id: "pay-wire", title: "Wire", active: true },
];

export const seedInvoiceLedgers: InvoiceLedger[] = [
  { id: "led-ar", title: "Accounts Receivable", code: "1100", active: true },
  { id: "led-sales", title: "Sales", code: "4000", active: true },
  { id: "led-unearned", title: "Unearned Revenue", code: "2200", active: true },
];

export const seedCatalogItems: CatalogItem[] = [
  { id: "cat-services", title: "Services", kind: "Service", code: "SVC", active: true },
  { id: "cat-managed", title: "Managed support", kind: "Service", code: "MSUP", active: true },
  { id: "cat-oncall", title: "On-call coverage", kind: "Service", code: "ONCL", active: true },
  { id: "cat-advisory", title: "Advisory hours", kind: "Service", code: "ADV", active: true },
  { id: "cat-pm", title: "Project management", kind: "Service", code: "PM", active: true },
  { id: "cat-consult", title: "Consulting", kind: "Service", code: "CONS", active: true },
  { id: "cat-hw", title: "Hardware", kind: "Material", code: "HW", active: true },
  { id: "cat-sw", title: "Software", kind: "Material", code: "SW", active: true },
  { id: "cat-travel", title: "Travel", kind: "Material", code: "TRV", active: true },
];
