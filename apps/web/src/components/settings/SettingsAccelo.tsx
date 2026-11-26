"use client";

import { useState } from "react";
import { PricingSheet, PricingTitle } from "@/components/settings/SettingsPricingChrome";
import { useAuth } from "@/lib/auth";
import {
  ACCELO_CLIENT_ID,
  ACCELO_DEPLOYMENT,
  ACCELO_RESOURCES,
  connectAccelo,
  countAcceloPage,
  pullAcceloPage,
  type AcceloBatch,
  type AcceloResource,
} from "@/lib/accelo";
import { useAppStore } from "@/lib/store";

const LABELS: Record<AcceloResource, string> = {
  staff: "Staff",
  companies: "Companies",
  contacts: "Contacts",
  affiliations: "Contact links",
  jobs: "Projects",
  issues: "Tickets",
  invoices: "Invoices",
  activities: "Time entries",
};

const BATCH_KEY: Record<AcceloResource, keyof AcceloBatch> = {
  staff: "staff",
  companies: "companies",
  contacts: "contacts",
  affiliations: "affiliations",
  jobs: "jobs",
  invoices: "invoices",
  issues: "issues",
  activities: "activities",
};

export function SettingsAccelo() {
  const { can } = useAuth();
  const canEdit = can("manage_invoice");
  const applyAcceloBatch = useAppStore((s) => s.applyAcceloBatch);
  const pushToast = useAppStore((s) => s.pushToast);
  const [secret, setSecret] = useState("");
  const [connected, setConnected] = useState(false);
  const [counts, setCounts] = useState<Partial<Record<AcceloResource, number>>>({});
  const [status, setStatus] = useState("Enter the client secret, then count Accelo before anything is written here.");
  const [busy, setBusy] = useState<"count" | "import" | null>(null);

  async function walk(resource: AcceloResource, mode: "count" | "import") {
    let page = 0;
    let total = 0;
    for (let guard = 0; guard < 500; guard += 1) {
      if (mode === "count") {
        const result = await countAcceloPage(resource, page);
        if (!result.ok) throw new Error(result.error);
        total += result.count;
        setCounts((current) => ({ ...current, [resource]: total }));
        if (result.done) return total;
      } else {
        const result = await pullAcceloPage(resource, page);
        if (!result.ok) throw new Error(result.error);
        const key = BATCH_KEY[resource];
        applyAcceloBatch({ [key]: result.rows } as AcceloBatch);
        total += result.rows.length;
        setCounts((current) => ({ ...current, [resource]: total }));
        if (result.done) return total;
      }
      page += 1;
    }
    return total;
  }

  async function onCount() {
    if (!canEdit || busy) return;
    setBusy("count");
    setCounts({});
    try {
      const session = await connectAccelo(secret);
      if (!session.ok) {
        pushToast(session.error, "danger");
        setStatus(session.error);
        return;
      }
      setConnected(true);
      setSecret("");
      for (const resource of ACCELO_RESOURCES) {
        setStatus(`Counting ${LABELS[resource]} in Accelo.`);
        await walk(resource, "count");
      }
      setStatus("Count finished. Nothing has been written into DMC PMO yet.");
      pushToast("Accelo count finished.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Accelo could not be counted.";
      setStatus(message);
      pushToast(message, "danger");
    } finally {
      setBusy(null);
    }
  }

  async function onImport() {
    if (!canEdit || busy || !connected) return;
    setBusy("import");
    try {
      for (const resource of ACCELO_RESOURCES) {
        setStatus(`Importing ${LABELS[resource]} from Accelo.`);
        await walk(resource, "import");
      }
      setStatus("Accelo records are in this workspace. Run the count again before a second import if Accelo changed.");
      pushToast("Accelo import finished.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Accelo import stopped.";
      setStatus(message);
      pushToast(message, "danger");
    } finally {
      setBusy(null);
    }
  }

  return (
    <PricingSheet>
      <PricingTitle>Accelo import</PricingTitle>
      <p className="page-sub">
        Read-only pull from {ACCELO_DEPLOYMENT}.accelo.com. The client secret is used once to sign in and is not saved in the workspace.
      </p>
      <div className="qb-card">
        <div>
          <p className="qb-kicker">{connected ? "Accelo connected" : "Accelo not connected"}</p>
          <p>Deployment {ACCELO_DEPLOYMENT}. Client ID {ACCELO_CLIENT_ID}.</p>
        </div>
      </div>
      <label className="qb-account">
        <span>Client secret</span>
        <input
          className="field-input"
          type="password"
          autoComplete="off"
          value={secret}
          disabled={!canEdit || busy !== null}
          onChange={(event) => setSecret(event.target.value)}
        />
      </label>
      <div className="qb-import-row">
        <span>{status}</span>
        <button type="button" className="btn btn-primary" disabled={!canEdit || busy !== null || !secret.trim()} onClick={() => void onCount()}>
          {busy === "count" ? "Counting" : "Count Accelo"}
        </button>
      </div>
      <div className="pricing-table-wrap">
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Record</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {ACCELO_RESOURCES.map((resource) => (
              <tr key={resource}>
                <td>{LABELS[resource]}</td>
                <td>{counts[resource] ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="qb-import-row">
        <span>Import writes companies, people, projects, tickets, invoices, and approved time into this workspace.</span>
        <button type="button" className="btn btn-primary" disabled={!canEdit || busy !== null || !connected} onClick={() => void onImport()}>
          {busy === "import" ? "Importing" : "Import into DMC PMO"}
        </button>
      </div>
    </PricingSheet>
  );
}
