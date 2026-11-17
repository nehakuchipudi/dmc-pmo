import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatPricingRate,
  formatTaxRate,
  isPricingPanel,
  PRICING_PANELS,
  PRICING_SEED_GENERATION,
  seedBillingRates,
  seedCatalogItems,
  seedInvoiceLedgers,
  seedPaymentMethods,
  seedTaxCodes,
} from "./invoice-pricing";
import { emptyWorkspaceData, workspacePatch } from "./workspace-snapshot";

assert.equal(formatPricingRate(185), "185.00");
assert.equal(formatTaxRate(8.25), "8.25%");
assert.equal(formatTaxRate(0), "0%");
assert.equal(PRICING_SEED_GENERATION, "pricing-v1");
assert.deepEqual(
  PRICING_PANELS.map((row) => row.id),
  ["settings", "quickbooks", "payments", "tax", "ledgers", "items", "rates"],
);
assert.equal(isPricingPanel("rates"), true);
assert.equal(isPricingPanel("billing"), false);
assert.ok(seedBillingRates.some((row) => row.kind === "Billable Rate"));
assert.ok(seedBillingRates.some((row) => row.kind === "Cost Rate"));
assert.ok(seedTaxCodes.some((row) => row.title === "TX-Frisco" && row.rate === 8.25 && row.invoices));
assert.ok(seedTaxCodes.some((row) => row.title === "Out of scope (purchase)" && row.purchases));
assert.ok(seedPaymentMethods.length >= 3);
assert.ok(seedInvoiceLedgers.some((row) => row.code === "1100"));
assert.ok(seedCatalogItems.some((row) => row.kind === "Service"));
assert.ok(seedCatalogItems.some((row) => row.kind === "Material"));

const empty = emptyWorkspaceData();
assert.equal((empty.billingRates as unknown[]).length, seedBillingRates.length);
assert.equal((empty.taxCodes as unknown[]).length, seedTaxCodes.length);

const hydrated = workspacePatch({ version: 1, data: { companies: [] } });
assert.equal((hydrated.billingRates as unknown[]).length, seedBillingRates.length);
assert.equal(hydrated.pricingSeedGeneration, "pricing-v1");

const root = dirname(fileURLToPath(import.meta.url));
const settings = readFileSync(join(root, "../components/settings/SettingsWorkspace.tsx"), "utf8");
assert.match(settings, /Invoice & Pricing/);
assert.doesNotMatch(settings, /label: "Billing"/);
assert.doesNotMatch(settings, /Brogan/);
assert.doesNotMatch(settings, /TX-Plano-3057994/);

const src = [
  readFileSync(join(root, "invoice-pricing.ts"), "utf8"),
  readFileSync(join(root, "../components/settings/SettingsRates.tsx"), "utf8"),
  readFileSync(join(root, "../components/settings/SettingsTaxCodes.tsx"), "utf8"),
  readFileSync(join(root, "../components/settings/SettingsQuickBooks.tsx"), "utf8"),
].join("\n");
assert.doesNotMatch(src, /Brogan/);
assert.doesNotMatch(src, /TX-Plano-3057994/);
assert.doesNotMatch(src, /[\u2013\u2014]/);

console.log("invoice-pricing.verify ok");
