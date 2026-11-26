"use client";

import { useRef, useState } from "react";
import { PricingSheet, PricingTitle } from "@/components/settings/SettingsPricingChrome";
import { useAuth } from "@/lib/auth";
import {
  ACCELO_CLIENT_ID,
  ACCELO_DEPLOYMENT,
  ACCELO_RESOURCES,
  acceloImportEnabled,
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
  const run = useRef(0);

  async function walk(resource: AcceloResource, mode: "count" | "import", runId: number) {
    let total = 0;
    const passes = resource === "activities" ? ["billable", "nonbillable"] : [""];
    for (const pass of passes) {
      for (let page = 0; page < 500; page += 1) {
        if (run.current !== runId) return total;
        if (resource === "activities") {
          setStatus(
            mode === "count"
              ? `Counting time entries, page ${page + 1}. Import into DMC PMO can run now.`
              : `Importing time entries, page ${page + 1}.`,
          );
        }
        if (mode === "count") {
          const result = await countAcceloPage(resource, page, pass);
          if (!result.ok) throw new Error(result.error);
          total += result.count;
          setCounts((current) => ({ ...current, [resource]: total }));
          if (result.done) break;
        } else {
          const result = await pullAcceloPage(resource, page, pass);
          if (!result.ok) throw new Error(result.error);
          const key = BATCH_KEY[resource];
          if (result.rows.length) applyAcceloBatch({ [key]: result.rows } as AcceloBatch);
          total += result.rows.length;
          setCounts((current) => ({ ...current, [resource]: total }));
          if (result.done) break;
        }
      }
    }
    return total;
  }

  async function onCount() {
    if (!canEdit || busy) return;
    const runId = run.current + 1;
    run.current = runId;
    setBusy("count");
    setCounts({});
    try {
      const session = await connectAccelo(secret);
      if (run.current !== runId) return;
      if (!session.ok) {
        pushToast(session.error, "danger");
        setStatus(session.error);
        return;
      }
      setConnected(true);
      setSecret("");
      for (const resource of ACCELO_RESOURCES) {
        if (run.current !== runId) return;
        setStatus(
          resource === "activities"
            ? "Counting time entries. Import into DMC PMO can run now."
            : `Counting ${LABELS[resource]} in Accelo.`,
        );
        await walk(resource, "count", runId);
      }
      if (run.current !== runId) return;
      setStatus("Count finished. Nothing has been written into DMC PMO yet.");
      pushToast("Accelo count finished.", "success");
    } catch (err) {
      if (run.current !== runId) return;
      const message = err instanceof Error ? err.message : "Accelo could not be counted.";
      setStatus(message);
      pushToast(message, "danger");
    } finally {
      if (run.current === runId) setBusy(null);
    }
  }

  async function onImport() {
    if (!canEdit || !connected || busy === "import") return;
    const runId = run.current + 1;
    run.current = runId;
    setBusy("import");
    try {
      const written: Partial<Record<AcceloResource, number>> = {};
      for (const resource of ACCELO_RESOURCES) {
        if (run.current !== runId) return;
        setStatus(`Importing ${LABELS[resource]} into DMC PMO.`);
        written[resource] = await walk(resource, "import", runId);
      }
      if (run.current !== runId) return;
      setCounts(written);
      setStatus(
        `Import finished. ${written.companies ?? 0} companies, ${written.jobs ?? 0} projects, ${written.invoices ?? 0} invoices, and ${written.activities ?? 0} time entries are in this workspace.`,
      );
      pushToast("Accelo import finished. Open Companies or Projects to see the records.", "success");
    } catch (err) {
      if (run.current !== runId) return;
      const message = err instanceof Error ? err.message : "Accelo import stopped.";
      setStatus(message);
      pushToast(message, "danger");
    } finally {
      if (run.current === runId) setBusy(null);
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
        <button type="button" className="btn btn-primary" disabled={!canEdit || !acceloImportEnabled(connected, busy)} onClick={() => void onImport()}>
          {busy === "import" ? "Importing" : "Import into DMC PMO"}
        </button>
      </div>
    </PricingSheet>
  );
}
