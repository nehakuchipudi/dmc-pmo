"use client";

import Link from "next/link";
import { PageHeader, StatusPill, statusTone } from "@/components/ui";
import { formatDisplayDate, money } from "@/lib/seed";
import { exportInvoicePdf } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

export function InvoiceDetail({ id }: { id: string }) {
  const invoices = useAppStore((s) => s.invoices);
  const sendInvoice = useAppStore((s) => s.sendInvoice);
  const payInvoice = useAppStore((s) => s.payInvoice);
  const queueEmail = useAppStore((s) => s.queueEmail);
  const pushToast = useAppStore((s) => s.pushToast);
  const invoice = invoices.find((i) => i.id === id) ?? invoices[0];

  return (
    <div className="fade-in">
      <div className="mb-2 text-sm text-[var(--color-muted)]">
        <Link href="/app/billing">Billing</Link> / {invoice.number}
      </div>
      <PageHeader
        title={invoice.number}
        subtitle={`${invoice.companyName} · Due ${formatDisplayDate(invoice.due)} · ${invoice.terms}`}
        actions={
          <>
            <StatusPill tone={statusTone(invoice.status)}>{invoice.status}</StatusPill>
            <button type="button" className="btn btn-ghost" onClick={() => exportInvoicePdf(invoice)}>
              Export PDF
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => sendInvoice(invoice.id)}>
              Send to client
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                queueEmail("billing@client.com", `Reminder: ${invoice.number}`, `This is a reminder that ${invoice.number} is ${invoice.status}.`);
                pushToast("Reminder emailed");
              }}
            >
              Send reminder
            </button>
            {invoice.status !== "Paid" ? (
              <button type="button" className="btn btn-primary" onClick={() => payInvoice(invoice.id)}>
                Record payment
              </button>
            ) : null}
          </>
        }
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((l) => (
              <tr key={l.description}>
                <td>{l.description}</td>
                <td className="tabular-nums">{money(l.amount)}</td>
              </tr>
            ))}
            <tr>
              <td className="font-semibold">Total</td>
              <td className="font-semibold tabular-nums">{money(invoice.amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
