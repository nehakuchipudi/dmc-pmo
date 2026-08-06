"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { billingTotals, invoices, money } from "@/lib/data";
import { FilterChips, PageHeader, SideRail, StatusPill, statusTone } from "@/components/ui";

const FILTERS = ["All Invoices", "In Terms", "Overdue", "Recently Created", "Owned By Me"];

export default function BillingPage() {
  const [filter, setFilter] = useState(FILTERS[0]);
  const rows =
    filter === "Overdue"
      ? invoices.filter((i) => i.status === "Overdue")
      : filter === "In Terms"
        ? invoices.filter((i) => i.status === "Sent")
        : invoices;

  return (
    <div className="fade-in">
      <PageHeader
        title="Billing"
        subtitle="Invoices, expenses, purchases, and materials."
        actions={
          <button type="button" className="btn btn-primary">
            <Plus size={16} /> New Invoice
          </button>
        }
      />
      <div className="mb-3 flex gap-4 text-sm">
        {["Invoices", "Expenses", "Purchases", "Materials"].map((tab, i) => (
          <span key={tab} className={i === 0 ? "font-semibold text-[var(--color-navy)] border-b-2 border-[var(--color-navy)] pb-1" : "text-[var(--color-muted)]"}>
            {tab}
          </span>
        ))}
      </div>
      <div className="panel mb-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <Total label="Outstanding" value={money(billingTotals.outstanding)} />
        <Total label="Overdue" value={money(billingTotals.overdue)} danger />
        <Total label="In Terms" value={money(billingTotals.inTerms)} info />
        <Total label="Paid (MTD)" value={money(billingTotals.paidMtd)} success />
      </div>
      <FilterChips items={FILTERS} active={filter} onChange={setFilter} />
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Company</th>
                <th>Amount</th>
                <th>Terms</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-medium text-[var(--color-navy)]">{inv.number}</td>
                  <td>{inv.companyName}</td>
                  <td>{money(inv.amount)}</td>
                  <td>{inv.terms}</td>
                  <td>{inv.due}</td>
                  <td><StatusPill tone={statusTone(inv.status)}>{inv.status}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SideRail title="Shortcuts & Receipts">
          <ul className="space-y-2 text-sm">
            {[
              "Company Invoice",
              "Reports",
              "Invoice Statements",
              "Timesheet Overview",
              "Recently Received",
            ].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </SideRail>
      </div>
    </div>
  );
}

function Total({
  label,
  value,
  danger,
  info,
  success,
}: {
  label: string;
  value: string;
  danger?: boolean;
  info?: boolean;
  success?: boolean;
}) {
  const color = danger
    ? "text-[var(--color-danger)]"
    : info
      ? "text-[var(--color-info)]"
      : success
        ? "text-[var(--color-success)]"
        : "text-[var(--color-navy)]";
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
