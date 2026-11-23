"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PricingSheet, PricingTitle } from "@/components/settings/SettingsPricingChrome";
import { useAuth } from "@/lib/auth";
import { formatShortDate, moneyExact } from "@/lib/seed";
import {
  connectQuickBooksHref,
  disconnectQuickBooks,
  invoiceOutstanding,
  pullQuickBooks,
  quickBooksAccountLabel,
  quickbooksSettingsHref,
  readQuickBooksPrefs,
  type QuickBooksAccount,
  type QuickBooksCatalogItem,
  type QuickBooksInvoiceImport,
  type QuickBooksParty,
  type QuickBooksPartyStatus,
  type QuickBooksPrefs,
  type QuickBooksTaxCode,
  type QuickBooksStatus,
  peekQuickBooks,
} from "@/lib/quickbooks";
import { useAppStore } from "@/lib/store";

const PARTY_STATUSES: QuickBooksPartyStatus[] = ["Active", "Inactive", "All"];

function Choice({
  value,
  disabled,
  onChange,
  label,
}: {
  value: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <div className="qb-choice" role="group" aria-label={label}>
      <button type="button" className={value ? "is-selected" : ""} aria-pressed={value} disabled={disabled} onClick={() => onChange(true)}>
        On
      </button>
      <button type="button" className={!value ? "is-selected" : ""} aria-pressed={!value} disabled={disabled} onClick={() => onChange(false)}>
        Off
      </button>
    </div>
  );
}

export function SettingsQuickBooks() {
  const { can } = useAuth();
  const canEdit = can("manage_invoice");
  const pushToast = useAppStore((s) => s.pushToast);
  const storedPrefs = useAppStore((s) => s.quickbooksPrefs);
  const prefs = useMemo(() => readQuickBooksPrefs(storedPrefs), [storedPrefs]);
  const setQuickbooksPrefs = useAppStore((s) => s.setQuickbooksPrefs);
  const invoices = useAppStore((s) => s.invoices);
  const importLedgers = useAppStore((s) => s.importQuickBooksLedgers);
  const importCatalog = useAppStore((s) => s.importQuickBooksCatalog);
  const importCompanies = useAppStore((s) => s.importQuickBooksCompanies);
  const importInvoices = useAppStore((s) => s.importQuickBooksInvoices);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<QuickBooksStatus | null>(null);
  const [accounts, setAccounts] = useState<QuickBooksAccount[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    const next = await peekQuickBooks();
    setStatus(next);
    if (!next.connected) {
      setAccounts([]);
      return;
    }
    const result = await pullQuickBooks<{ accounts: QuickBooksAccount[] }>("accounts");
    if (result.ok) setAccounts(result.data.accounts || []);
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

  function savePrefs(patch: Partial<QuickBooksPrefs>) {
    if (!canEdit) return;
    setQuickbooksPrefs(patch);
  }

  async function onDisconnect() {
    if (!canEdit) return;
    setBusy("disconnect");
    try {
      await disconnectQuickBooks();
      await refresh();
      pushToast("QuickBooks disconnected.", "info");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "QuickBooks could not disconnect.", "danger");
    } finally {
      setBusy(null);
    }
  }

  async function runImport(kind: "ledgers" | "items" | "companies" | "invoices") {
    if (!canEdit || busy) return;
    if (!status?.connected) {
      pushToast(status?.configured ? "Connect QuickBooks before importing." : "Add QuickBooks app keys on this host first.", "danger");
      return;
    }
    setBusy(kind);
    try {
      if (kind === "ledgers") {
        const result = await pullQuickBooks<{ ledgers: QuickBooksAccount[]; codes: QuickBooksTaxCode[] }>("ledgers");
        if (!result.ok) {
          pushToast(result.error, "danger");
          return;
        }
        importLedgers(result.data.ledgers || [], result.data.codes || []);
      } else if (kind === "items") {
        const result = await pullQuickBooks<{ items: QuickBooksCatalogItem[] }>("items");
        if (!result.ok) {
          pushToast(result.error, "danger");
          return;
        }
        importCatalog(result.data.items || []);
      } else if (kind === "companies") {
        const result = await pullQuickBooks<{ customers: QuickBooksParty[]; vendors: QuickBooksParty[] }>("companies", prefs);
        if (!result.ok) {
          pushToast(result.error, "danger");
          return;
        }
        importCompanies([...(result.data.customers || []), ...(result.data.vendors || [])]);
      } else {
        const result = await pullQuickBooks<{ invoices: QuickBooksInvoiceImport[] }>("invoices");
        if (!result.ok) {
          pushToast(result.error, "danger");
          return;
        }
        importInvoices(result.data.invoices || [], prefs);
      }
    } finally {
      setBusy(null);
    }
  }

  const connected = Boolean(status?.connected);
  const configured = Boolean(status?.configured);
  const kicker = connected ? "QuickBooks connected" : configured ? "QuickBooks not connected" : "QuickBooks not configured";
  const label = connected
    ? `Invoices send to ${status?.companyName || "your QuickBooks company"}${status?.environment === "sandbox" ? " (sandbox)" : ""}.`
    : configured
      ? "Connect QuickBooks Online so DMC PMO can create invoices and import companies, items, and payments."
      : "Add Intuit app keys on this host, then connect the QuickBooks company you bill from.";
  const synced = invoices
    .filter((invoice) => invoice.quickbooksId || invoice.quickbooksError)
    .slice()
    .sort((a, b) => (b.quickbooksSyncedAt || "").localeCompare(a.quickbooksSyncedAt || ""));
  const accountOptions = accounts.filter((row) => row.active);
  const selectedMissing =
    prefs.paymentAccountId && !accountOptions.some((row) => row.quickbooksId === prefs.paymentAccountId)
      ? { quickbooksId: prefs.paymentAccountId, title: prefs.paymentAccountName || "Saved account", code: "", active: true }
      : null;

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
            <button type="button" className="btn btn-ghost" onClick={() => void onDisconnect()} disabled={busy !== null}>
              Disconnect
            </button>
          ) : (
            <a className="btn btn-primary" href={connectQuickBooksHref(quickbooksSettingsHref())}>
              Connect QuickBooks
            </a>
          )
        ) : null}
      </div>

      <div className="qb-block">
        <div className="qb-setting">
          <div>
            <strong>Find Alternative Contact</strong>
            <p>When an invoice contact is not linked to a QuickBooks customer, search the company contacts for one that is.</p>
          </div>
          <Choice label="Find Alternative Contact" value={prefs.findAlternativeContact} disabled={!canEdit} onChange={(findAlternativeContact) => savePrefs({ findAlternativeContact })} />
        </div>
        <div className="qb-setting">
          <div>
            <strong>Pull Invoice as Default Biller</strong>
            <p>Import an invoice using the company&apos;s QuickBooks billing contact.</p>
          </div>
          <Choice
            label="Pull Invoice as Default Biller"
            value={prefs.pullInvoiceAsDefaultBiller}
            disabled={!canEdit}
            onChange={(pullInvoiceAsDefaultBiller) => savePrefs({ pullInvoiceAsDefaultBiller })}
          />
        </div>
        <div className="qb-setting">
          <div>
            <strong>Status to import Customers with</strong>
            <p>Customers imported from QuickBooks Online become client companies.</p>
          </div>
          <select
            className="field-input"
            aria-label="Status to import Customers with"
            value={prefs.customerStatus}
            disabled={!canEdit}
            onChange={(event) => savePrefs({ customerStatus: event.target.value as QuickBooksPartyStatus })}
          >
            {PARTY_STATUSES.map((statusName) => (
              <option key={statusName}>{statusName}</option>
            ))}
          </select>
        </div>
        <div className="qb-setting">
          <div>
            <strong>Status to import Vendors with</strong>
            <p>Vendors imported from QuickBooks Online become contractor companies.</p>
          </div>
          <select
            className="field-input"
            aria-label="Status to import Vendors with"
            value={prefs.vendorStatus}
            disabled={!canEdit}
            onChange={(event) => savePrefs({ vendorStatus: event.target.value as QuickBooksPartyStatus })}
          >
            {PARTY_STATUSES.map((statusName) => (
              <option key={statusName}>{statusName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="qb-block">
        <h2>Push Payment options</h2>
        <div className="qb-setting">
          <div>
            <strong>Default payment account</strong>
            <p>Bank account used when a QuickBooks payment is pushed back to this company.</p>
          </div>
          <label className="qb-account">
            <span>Default payment account</span>
            <select
              className="field-input"
              aria-label="Default payment account"
              value={prefs.paymentAccountId}
              disabled={!canEdit || !connected}
              onChange={(event) => {
                const account = accountOptions.find((row) => row.quickbooksId === event.target.value);
                savePrefs({
                  paymentAccountId: event.target.value,
                  paymentAccountName: account ? quickBooksAccountLabel(account) : "",
                });
              }}
            >
              <option value="">{connected ? "Select an account" : "Connect QuickBooks to load accounts"}</option>
              {selectedMissing ? <option value={selectedMissing.quickbooksId}>{selectedMissing.title}</option> : null}
              {accountOptions.map((account) => (
                <option key={account.quickbooksId} value={account.quickbooksId}>
                  {quickBooksAccountLabel(account)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="qb-block">
        <h2>Import</h2>
        {(
          [
            ["ledgers", "Import Account Ledgers and Tax Codes from QuickBooks Online"],
            ["items", "Import Products and Services from QuickBooks Online"],
            ["companies", "Import Companies from QuickBooks Online"],
            ["invoices", "Import Invoices and Payments from QuickBooks Online"],
          ] as const
        ).map(([kind, text]) => (
          <div className="qb-import-row" key={kind}>
            <span>{text}</span>
            <button type="button" className="btn btn-primary" disabled={!canEdit || busy !== null} onClick={() => void runImport(kind)}>
              {busy === kind ? "Importing" : "Import"}
            </button>
          </div>
        ))}
      </div>

      <div className="qb-block">
        <h2>Sync Status</h2>
        {synced.length ? (
          <div className="pricing-table-wrap">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Invoice Title</th>
                  <th>Invoice Total</th>
                  <th>Outstanding Amount</th>
                  <th>Sync Start</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {synced.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.quickbooksId || invoice.number}</td>
                    <td>{invoice.title || invoice.number}</td>
                    <td>{moneyExact(invoice.amount)}</td>
                    <td>{moneyExact(invoiceOutstanding(invoice))}</td>
                    <td>{invoice.quickbooksSyncedAt ? formatShortDate(invoice.quickbooksSyncedAt.slice(0, 10)) : ""}</td>
                    <td>{invoice.quickbooksError ? "Failed" : "Synced"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="qb-sync-empty">No invoices currently being synced</p>
        )}
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
          <span>Connect the company, import ledgers, items, companies, and invoices, then use Send to QuickBooks on an invoice.</span>
        </li>
      </ol>
    </PricingSheet>
  );
}
