"use client";

import { FIRM_LETTERHEAD, invoiceBillToLines, invoiceHeading, invoiceTotals } from "@/lib/invoice";
import { formatLongMonthDay, formatShortDate, moneyExact } from "@/lib/seed";
import type { Invoice } from "@/lib/types";

export function DmcMark({ size = 92 }: { size?: number }) {
  return (
    <div className="dmc-mark" style={{ width: size, height: size }} aria-hidden>
      <span>DMC</span>
    </div>
  );
}

export function InvoiceDocument({
  invoice,
  companyAddress,
  projectName,
}: {
  invoice: Invoice;
  companyAddress?: string;
  projectName?: string;
}) {
  const lines = invoice.lineItems.filter((line) => line.includeInPdf !== false);
  const totals = invoiceTotals(invoice.lineItems);
  const billTo = invoiceBillToLines(invoice, companyAddress);
  const heading = invoiceHeading(invoice);
  const manager = invoice.manager || invoice.owner;
  const payments = invoice.payments ?? [];

  return (
    <article className="invoice-paper">
      <header className="invoice-letterhead">
        <DmcMark />
        <div className="invoice-firm">
          <strong>{FIRM_LETTERHEAD.name}</strong>
          {FIRM_LETTERHEAD.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      </header>

      <div className="invoice-meta-row">
        <div className="invoice-bill-to">
          {billTo.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <div className="invoice-meta-block">
          <strong>INVOICE</strong>
          <span>
            INVOICE DATE: {invoice.raised ? formatShortDate(invoice.raised) : "Not set"}
          </span>
          <span>INVOICE NO: {invoice.number}</span>
          <span>
            BILLING THROUGH: {invoice.billingThrough ? formatLongMonthDay(invoice.billingThrough) : "Not set"}
          </span>
        </div>
      </div>

      <div className="invoice-title-row">
        <p>{heading}</p>
        {manager ? <span>Managed by: {manager}</span> : null}
      </div>

      <section className="invoice-section">
        <h3>Invoice Items</h3>
        <table className="invoice-doc-table">
          <colgroup>
            <col />
            <col className="invoice-amt-col" />
          </colgroup>
          <thead>
            <tr>
              <th>Activity</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id}>
                <td>{line.description}</td>
                <td className="tabular-nums">{moneyExact(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="invoice-totals">
          <div>
            <span>SUBTOTAL</span>
            <strong className="tabular-nums">{moneyExact(totals.subtotal)}</strong>
          </div>
          <div className="is-due">
            <span>AMOUNT DUE THIS INVOICE</span>
            <strong className="tabular-nums">{moneyExact(invoice.amount)}</strong>
          </div>
        </div>
      </section>

      <section className="invoice-section">
        <h3>Payments</h3>
        {payments.length ? (
          <table className="invoice-doc-table">
            <colgroup>
              <col className="invoice-date-col" />
              <col />
              <col className="invoice-amt-col" />
            </colgroup>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatShortDate(payment.date)}</td>
                  <td>{payment.description}</td>
                  <td className="tabular-nums">{moneyExact(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="invoice-empty-pay">No payments recorded.</p>
        )}
        <p className="invoice-due-note">This invoice is due on {formatShortDate(invoice.due)}</p>
      </section>
      {projectName ? <p className="sr-only">Project {projectName}</p> : null}
    </article>
  );
}
