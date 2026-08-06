"use client";

import { invoices, money } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { PageHeader, StatusPill, statusTone } from "@/components/ui";

export default function PortalBillingPage() {
  const { user } = useAuth();
  const rows = invoices.filter((i) => i.companyId === user?.companyId);

  return (
    <div className="fade-in">
      <PageHeader
        title="Billing"
        subtitle="View statements and pay invoices online."
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Amount</th>
              <th>Due</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <tr key={inv.id}>
                <td className="font-medium">{inv.number}</td>
                <td>{money(inv.amount)}</td>
                <td>{inv.due}</td>
                <td><StatusPill tone={statusTone(inv.status)}>{inv.status}</StatusPill></td>
                <td>
                  {inv.status === "Paid" ? null : (
                    <button type="button" className="btn btn-primary text-sm">
                      Pay now
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
