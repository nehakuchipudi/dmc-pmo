"use client";

import Link from "next/link";
import { IfCan } from "@/components/auth/IfCan";
import { PageHeader, StatusPill, statusTone } from "@/components/ui";
import { invoiceTotals } from "@/lib/invoice";
import { formatDisplayDate, money } from "@/lib/seed";
import { exportInvoicePdf } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

export function InvoiceDetail({ id }: { id: string }) {
  const invoices = useAppStore((s) => s.invoices);
  const sendInvoice = useAppStore((s) => s.sendInvoice);
  const payInvoice = useAppStore((s) => s.payInvoice);
  const queueEmail = useAppStore((s) => s.queueEmail);
  const pushToast = useAppStore((s) => s.pushToast);
  const invoice = invoices.find((i) => i.id === id);

  if (!invoice) {
    return (
      <div className="fade-in panel p-6">
        <p className="font-semibold text-[var(--color-navy)]">Invoice not found</p>
        <Link href="/app/billing" className="btn btn-primary mt-4">
          Back to billing
        </Link>
      </div>
    );
  }

  const totals = invoiceTotals(invoice.lineItems);
  const pdfLines = invoice.lineItems.filter((l) => l.includeInPdf !== false);

  return (
    <div className="fade-in">
      <div className="mb-2 text-sm text-[var(--color-muted)]">
        <Link href="/app/billing">Billing</Link> / {invoice.number}
      </div>
      <PageHeader
        title={invoice.title || invoice.number}
        subtitle={`${invoice.companyName} · Due ${formatDisplayDate(invoice.due)} · ${invoice.terms}`}
        actions={
          <>
            <StatusPill tone={statusTone(invoice.status)}>{invoice.status}</StatusPill>
            <button type="button" className="btn btn-ghost" onClick={() => exportInvoicePdf(invoice)}>
              Export PDF
            </button>
            <IfCan cap="manage_invoice">
              <button type="button" className="btn btn-ghost" onClick={() => sendInvoice(invoice.id)}>
                Send to client
              </button>
            </IfCan>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                queueEmail(
                  "billing@client.com",
                  `Reminder: ${invoice.number}`,
                  `This is a reminder that ${invoice.number} is ${invoice.status}.`,
                );
                pushToast("Reminder emailed");
              }}
            >
              Send reminder
            </button>
            {invoice.status === "Sent" || invoice.status === "Overdue" ? (
              <IfCan cap="pay_invoice">
                <button type="button" className="btn btn-primary" onClick={() => payInvoice(invoice.id)}>
                  Record payment
                </button>
              </IfCan>
            ) : null}
          </>
        }
      />
      <div className="invoice-detail-meta">
        <div>
          <span>Invoice</span>
          <strong>{invoice.number}</strong>
        </div>
        <div>
          <span>Bill to</span>
          <strong>{invoice.billToName || invoice.companyName}</strong>
        </div>
        <div>
          <span>Raised</span>
          <strong>{invoice.raised ? formatDisplayDate(invoice.raised) : "Not set"}</strong>
        </div>
        <div>
          <span>Billing through</span>
          <strong>{invoice.billingThrough ? formatDisplayDate(invoice.billingThrough) : "Not set"}</strong>
        </div>
        <div>
          <span>Owner</span>
          <strong>{invoice.owner || "Unassigned"}</strong>
        </div>
        <div>
          <span>PO</span>
          <strong>{invoice.poNumber || "None"}</strong>
        </div>
        <div>
          <span>Currency</span>
          <strong>{invoice.currency || "USD"}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>{money(invoice.amount)}</strong>
        </div>
      </div>
      {invoice.description ? <p className="mb-4 text-sm text-[var(--color-ink)]">{invoice.description}</p> : null}
      {invoice.internalDescription ? (
        <p className="mb-4 text-sm text-[var(--color-muted)]">Internal: {invoice.internalDescription}</p>
      ) : null}
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Qty / Hrs</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {pdfLines.map((l) => (
              <tr key={l.id}>
                <td className="capitalize">{l.kind}</td>
                <td>{l.description}</td>
                <td className="tabular-nums">{l.hours ?? l.quantity ?? ""}</td>
                <td className="tabular-nums">{l.rate ? money(l.rate) : ""}</td>
                <td className="tabular-nums">{money(l.amount)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4}>Service</td>
              <td className="tabular-nums">{money(totals.service)}</td>
            </tr>
            <tr>
              <td colSpan={4}>Materials</td>
              <td className="tabular-nums">{money(totals.material)}</td>
            </tr>
            <tr>
              <td colSpan={4}>Expenses</td>
              <td className="tabular-nums">{money(totals.expense)}</td>
            </tr>
            <tr>
              <td colSpan={4}>Tax</td>
              <td className="tabular-nums">{money(totals.tax || invoice.taxAmount || 0)}</td>
            </tr>
            <tr>
              <td className="font-semibold" colSpan={4}>
                Total
              </td>
              <td className="font-semibold tabular-nums">{money(invoice.amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
