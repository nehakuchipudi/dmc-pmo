"use client";

import { PageHeader, StatusPill, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { formatDisplayDate, money } from "@/lib/seed";
import { exportInvoicePdf } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

export default function PortalBillingPage() {
  const { user } = useAuth();
  const invoices = useAppStore((s) => s.invoices);
  const payInvoice = useAppStore((s) => s.payInvoice);
  const rows = invoices.filter((i) => i.companyId === user?.companyId);

  return (
    <div className="fade-in">
      <PageHeader title="Billing" subtitle="View statements and pay invoices online." />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Amount</th>
              <th>Due</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <tr key={inv.id}>
                <td className="font-medium">{inv.number}</td>
                <td className="tabular-nums">{money(inv.amount)}</td>
                <td>{formatDisplayDate(inv.due)}</td>
                <td>
                  <StatusPill tone={statusTone(inv.status)}>{inv.status}</StatusPill>
                </td>
                <td className="text-right">
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => exportInvoicePdf(inv)}>
                    PDF
                  </button>
                  {inv.status !== "Paid" ? (
                    <button type="button" className="btn btn-primary text-sm" onClick={() => payInvoice(inv.id)}>
                      Pay now
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-[var(--color-muted)]">
        Payments are simulated in this preview. Stripe Checkout lands with the API phase.
      </p>
    </div>
  );
}
