"use client";

import { useState } from "react";
import { Copy, ShieldCheck } from "lucide-react";
import { Field, StatusPill, TextInput, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";

const EXPLAIN = [
  {
    title: "Email domain",
    body: "The part after @. Invoices, welcome mail, and reminders show as coming from this domain, such as notifications@dillonmorgan.com.",
  },
  {
    title: "DNS records",
    body: "Public notes you add at your domain host (Cloudflare, GoDaddy, or Microsoft 365). Inboxes read them to decide if DMC PMO is allowed to send as you.",
  },
  {
    title: "SPF, DKIM, DMARC",
    body: "SPF lists approved senders. DKIM signs the message. DMARC says what to do if those checks fail. Without them, mail often lands in spam.",
  },
];

export function EmailDomainRecords() {
  const { can } = useAuth();
  const domains = useAppStore((s) => s.emailDomains);
  const addEmailDomain = useAppStore((s) => s.addEmailDomain);
  const removeEmailDomain = useAppStore((s) => s.removeEmailDomain);
  const setPrimaryEmailDomain = useAppStore((s) => s.setPrimaryEmailDomain);
  const checkEmailDomain = useAppStore((s) => s.checkEmailDomain);
  const pushToast = useAppStore((s) => s.pushToast);
  const canEdit = can("manage_automations") || can("manage_users");
  const [domain, setDomain] = useState("");
  const [fromName, setFromName] = useState("DMC PMO");
  const [fromLocal, setFromLocal] = useState("notifications");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onCheck(id: string) {
    setBusyId(id);
    try {
      await checkEmailDomain(id);
    } finally {
      setBusyId(null);
    }
  }

  function copyValue(value: string) {
    void navigator.clipboard.writeText(value);
    pushToast("Copied to clipboard");
  }

  return (
    <div className="email-domain">
      <div className="panel p-5">
        <h2 className="section-title">What this means</h2>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          Email Domain / DNS Records prove that DMC PMO may send mail as your company. You add three records at your
          domain host. We then look them up on the public internet and mark the domain Verified, Partial, or Missing.
        </p>
        <div className="email-domain-explain">
          {EXPLAIN.map((item) => (
            <div key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {canEdit ? (
        <form
          className="panel p-5"
          onSubmit={(event) => {
            event.preventDefault();
            const id = addEmailDomain({
              domain,
              fromName,
              fromEmail: `${fromLocal}@${domain}`,
            });
            if (id) {
              setDomain("");
              void onCheck(id);
            }
          }}
        >
          <h2 className="section-title">Add a sending domain</h2>
          <div className="email-domain-form">
            <Field label="Domain" required>
              <TextInput
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="dillonmorgan.com"
                required
              />
            </Field>
            <Field label="From name">
              <TextInput value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="DMC PMO" />
            </Field>
            <Field label="From address">
              <div className="email-domain-from">
                <TextInput value={fromLocal} onChange={(e) => setFromLocal(e.target.value)} placeholder="notifications" />
                <span>@{domain || "yourdomain.com"}</span>
              </div>
            </Field>
          </div>
          <div className="email-domain-actions">
            <button type="submit" className="btn btn-primary">
              Save domain and show records
            </button>
          </div>
        </form>
      ) : null}

      {domains.map((row) => (
        <div key={row.id} className="panel p-5">
          <div className="email-domain-head">
            <div>
              <div className="email-domain-title">
                <ShieldCheck size={18} />
                <strong>{row.domain}</strong>
                {row.primary ? <StatusPill tone="info">Sending</StatusPill> : null}
                <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
              </div>
              <p className="email-domain-meta">
                From {row.fromName} &lt;{row.fromEmail}&gt;
                {row.lastChecked ? ` · Last check ${row.lastChecked}` : " · Not checked yet"}
              </p>
            </div>
            <div className="email-domain-toolbar">
              <button type="button" className="btn btn-primary text-sm" disabled={busyId === row.id} onClick={() => void onCheck(row.id)}>
                {busyId === row.id ? "Checking DNS..." : "Check records"}
              </button>
              {canEdit ? (
                <>
                  {!row.primary ? (
                    <button type="button" className="btn btn-ghost text-sm" onClick={() => setPrimaryEmailDomain(row.id)}>
                      Use for sending
                    </button>
                  ) : null}
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => removeEmailDomain(row.id)}>
                    Remove
                  </button>
                </>
              ) : null}
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Type</th>
                  <th>Host</th>
                  <th>Value</th>
                  <th>Inbox check</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {row.records.map((record) => (
                  <tr key={record.kind}>
                    <td>
                      <div className="font-medium">{record.kind.toUpperCase()}</div>
                      <div className="text-xs text-[var(--color-muted)]">{record.purpose}</div>
                    </td>
                    <td>{record.type}</td>
                    <td>
                      <code>{record.host}</code>
                    </td>
                    <td>
                      <code className="email-domain-value">{record.value}</code>
                    </td>
                    <td>
                      {record.found === undefined ? (
                        <StatusPill tone="neutral">Not checked</StatusPill>
                      ) : (
                        <StatusPill tone={record.found ? "success" : "danger"}>
                          {record.found ? "Found" : "Missing"}
                        </StatusPill>
                      )}
                    </td>
                    <td className="text-right">
                      <button type="button" className="icon-btn" aria-label={`Copy ${record.kind}`} onClick={() => copyValue(record.value)}>
                        <Copy size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
