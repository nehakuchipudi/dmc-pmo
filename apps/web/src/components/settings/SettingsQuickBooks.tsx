"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PricingSheet, PricingTitle } from "@/components/settings/SettingsPricingChrome";
import { useAuth } from "@/lib/auth";
import {
  connectQuickBooksHref,
  disconnectQuickBooks,
  peekQuickBooks,
  quickbooksSettingsHref,
  type QuickBooksStatus,
} from "@/lib/quickbooks";
import { useAppStore } from "@/lib/store";

export function SettingsQuickBooks() {
  const { can } = useAuth();
  const canEdit = can("manage_invoice");
  const pushToast = useAppStore((s) => s.pushToast);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<QuickBooksStatus | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setStatus(await peekQuickBooks());
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const flag = searchParams.get("qb");
    if (!flag) return;
    if (flag === "connected") pushToast("QuickBooks connected.", "success");
    else if (flag === "denied") pushToast("QuickBooks access was not granted.", "danger");
    else if (flag === "missing-keys") pushToast("Add QB_CLIENT_ID and QB_CLIENT_SECRET on the host first.", "danger");
    else pushToast("QuickBooks could not finish connecting.", "danger");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("qb");
    const qs = params.toString();
    router.replace(qs ? `/app/settings/?${qs}` : "/app/settings/", { scroll: false });
  }, [pushToast, router, searchParams]);

  async function onDisconnect() {
    if (!canEdit) return;
    setBusy(true);
    try {
      await disconnectQuickBooks();
      await refresh();
      pushToast("QuickBooks disconnected.", "info");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "QuickBooks could not disconnect.", "danger");
    } finally {
      setBusy(false);
    }
  }

  const connected = Boolean(status?.connected);
  const configured = Boolean(status?.configured);
  const kicker = connected ? "QuickBooks connected" : configured ? "QuickBooks not connected" : "QuickBooks not configured";
  const label = connected
    ? `Invoices send to ${status?.companyName || "your QuickBooks company"}${status?.environment === "sandbox" ? " (sandbox)" : ""}.`
    : configured
      ? "Connect QuickBooks Online so DMC PMO can create invoices and import tax codes."
      : "Add Intuit app keys on this host, then connect the QuickBooks company you bill from.";

  return (
    <PricingSheet>
      <PricingTitle>QuickBooks</PricingTitle>
      <div className="qb-card">
        <div>
          <p className="qb-kicker">{kicker}</p>
          <p>{status?.error && !configured ? status.error : label}</p>
        </div>
        {canEdit && configured ? (
          connected ? (
            <button type="button" className="btn btn-ghost" onClick={() => void onDisconnect()} disabled={busy}>
              Disconnect
            </button>
          ) : (
            <a className="btn btn-primary" href={connectQuickBooksHref(quickbooksSettingsHref())}>
              Connect QuickBooks
            </a>
          )
        ) : null}
      </div>
      <ol className="email-setup-steps">
        <li>
          <strong>Create an Intuit app</strong>
          <span>In the Intuit Developer portal, create a QuickBooks Online app with the Accounting scope.</span>
        </li>
        <li>
          <strong>Redirect URI</strong>
          <span>Paste this exact callback into the app keys: {status?.callbackUrl || "https://your-host/api/quickbooks/callback"}</span>
        </li>
        <li>
          <strong>Host keys</strong>
          <span>Set QB_CLIENT_ID and QB_CLIENT_SECRET on the Vercel project. Optional: QB_ENVIRONMENT=sandbox or production, and QB_REDIRECT_URI if the callback must be pinned.</span>
        </li>
        <li>
          <strong>Connect and bill</strong>
          <span>Connect the company, then use Send to QuickBooks on an invoice or Create in QuickBooks when you save a draft. Import tax codes from the Tax Codes panel.</span>
        </li>
      </ol>
    </PricingSheet>
  );
}
