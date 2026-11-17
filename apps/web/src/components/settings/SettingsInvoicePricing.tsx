"use client";

import { SettingsBilling } from "@/components/settings/SettingsBilling";
import { SettingsCatalogItems, SettingsInvoiceLedgers, SettingsPayments } from "@/components/settings/SettingsPricingLists";
import { SettingsQuickBooks } from "@/components/settings/SettingsQuickBooks";
import { SettingsRates } from "@/components/settings/SettingsRates";
import { SettingsTaxCodes } from "@/components/settings/SettingsTaxCodes";
import type { PricingPanel } from "@/lib/invoice-pricing";

export function SettingsInvoicePricing({ panel }: { panel: PricingPanel }) {
  if (panel === "quickbooks") return <SettingsQuickBooks />;
  if (panel === "payments") return <SettingsPayments />;
  if (panel === "tax") return <SettingsTaxCodes />;
  if (panel === "ledgers") return <SettingsInvoiceLedgers />;
  if (panel === "items") return <SettingsCatalogItems />;
  if (panel === "rates") return <SettingsRates />;
  return <SettingsBilling />;
}
