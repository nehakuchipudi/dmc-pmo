"use client";

import { useState } from "react";
import { IfCan } from "@/components/auth/IfCan";
import { EmailDomainRecords } from "@/components/settings/EmailDomainRecords";
import { PageHeader, SideRail, StatusPill, Tabs } from "@/components/ui";
import { useAppStore } from "@/lib/store";

export default function AutomationsPage() {
  const automations = useAppStore((s) => s.automations);
  const emailOutbox = useAppStore((s) => s.emailOutbox);
  const toggle = useAppStore((s) => s.toggleAutomation);
  const run = useAppStore((s) => s.runAutomation);
  const queueEmail = useAppStore((s) => s.queueEmail);
  const pushToast = useAppStore((s) => s.pushToast);
  const [tab, setTab] = useState("Rules");

  return (
    <div className="fade-in">
      <PageHeader
        title="Automations"
        subtitle="Triggers, conditions, and email notifications for the firm."
        actions={
          <IfCan cap="manage_automations">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                queueEmail(
                  "ops@dillonmorgan.com",
                  "Test notification from DMC PMO",
                  "This is a simulated email from the notification system.",
                );
                pushToast("Test email queued to outbox");
              }}
            >
              Send test email
            </button>
          </IfCan>
        }
      />
      <Tabs tabs={["Rules", "Email outbox", "Email domain", "Templates"]} active={tab} onChange={setTab} />
      {tab === "Rules" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="panel overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Trigger</th>
                  <th>Condition</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {automations.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium text-[var(--color-navy)]">{a.name}</td>
                    <td>{a.trigger}</td>
                    <td className="text-[var(--color-muted)]">{a.condition}</td>
                    <td>{a.action}</td>
                    <td>
                      <StatusPill tone={a.enabled ? "success" : "neutral"}>
                        {a.enabled ? "On" : "Off"}
                      </StatusPill>
                    </td>
                    <td className="text-right">
                      <IfCan cap="manage_automations">
                        <button type="button" className="btn btn-ghost text-sm" onClick={() => toggle(a.id)}>
                          {a.enabled ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary text-sm"
                          disabled={!a.enabled}
                          onClick={() => run(a.id)}
                        >
                          Run now
                        </button>
                      </IfCan>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <SideRail title="How it works">
            <p className="text-sm text-[var(--color-muted)]">
              Rules run against demo data. Run now queues an email and an in-app notification so you can verify the loop end to end.
            </p>
          </SideRail>
        </div>
      ) : null}
      {tab === "Email outbox" ? (
        <div className="panel overflow-hidden">
          <p className="px-4 pt-4 text-sm text-[var(--color-muted)]">
            Outbox is what DMC PMO queued. Sending identity comes from Email domain / DNS records.
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Sent</th>
                <th>To</th>
                <th>Subject</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {emailOutbox.map((e) => (
                <tr key={e.id}>
                  <td>{e.sentAt}</td>
                  <td>{e.to}</td>
                  <td>
                    <div className="font-medium">{e.subject}</div>
                    <div className="text-xs text-[var(--color-muted)]">{e.body}</div>
                  </td>
                  <td>
                    <StatusPill tone={e.status === "Sent" ? "success" : "warning"}>{e.status}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {tab === "Email domain" ? <EmailDomainRecords /> : null}
      {tab === "Templates" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              name: "Invoice reminder",
              body: "Hello, invoice {{number}} for {{amount}} is {{status}}. Pay in the client portal.",
            },
            {
              name: "Timesheet nudge",
              body: "Please submit draft time for the week ending {{friday}}.",
            },
            {
              name: "Signoff request",
              body: "Please review {{milestone}} on {{project}} and approve in the portal.",
            },
            {
              name: "Ticket update",
              body: "Ticket #{{number}} was updated: {{subject}}.",
            },
          ].map((t) => (
            <div key={t.name} className="panel p-4">
              <div className="mb-2 font-semibold text-[var(--color-navy)]">{t.name}</div>
              <p className="text-sm text-[var(--color-muted)]">{t.body}</p>
              <button
                type="button"
                className="btn btn-ghost mt-3 text-sm"
                onClick={() => {
                  queueEmail("preview@dillonmorgan.com", t.name, t.body);
                  pushToast("Template preview emailed to outbox");
                }}
              >
                Preview send
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
