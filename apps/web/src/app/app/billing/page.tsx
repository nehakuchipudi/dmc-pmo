"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { FilterChips, PageHeader, SideRail, StatusPill, Tabs, statusTone } from "@/components/ui";
import { formatDisplayDate, money } from "@/lib/seed";
import { exportCsv } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

const FILTERS = ["All Invoices", "Draft", "In Terms", "Overdue", "Paid"];

type Expense = { id: string; vendor: string; project: string; amount: number; status: string; date: string };

const SEED_EXPENSES: Expense[] = [
  { id: "ex1", vendor: "Delta Travel", project: "Q3 Warehouse Rollout", amount: 420, status: "Pending", date: "2026-08-04" },
  { id: "ex2", vendor: "Office Depot", project: "Website Replatform", amount: 86, status: "Approved", date: "2026-08-02" },
];

export default function BillingPage() {
  const invoices = useAppStore((s) => s.invoices);
  const companies = useAppStore((s) => s.companies);
  const createInvoiceDraft = useAppStore((s) => s.createInvoiceDraft);
  const pushToast = useAppStore((s) => s.pushToast);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [tab, setTab] = useState("Invoices");
  const [expenses, setExpenses] = useState(SEED_EXPENSES);

  const rows = useMemo(() => {
    if (filter === "Overdue") return invoices.filter((i) => i.status === "Overdue");
    if (filter === "In Terms") return invoices.filter((i) => i.status === "Sent");
    if (filter === "Draft") return invoices.filter((i) => i.status === "Draft");
    if (filter === "Paid") return invoices.filter((i) => i.status === "Paid");
    return invoices;
  }, [filter, invoices]);

  const totals = useMemo(() => {
    const outstanding = invoices.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.amount, 0);
    const overdue = invoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.amount, 0);
    const inTerms = invoices.filter((i) => i.status === "Sent").reduce((s, i) => s + i.amount, 0);
    const paidMtd = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
    return { outstanding, overdue, inTerms, paidMtd };
  }, [invoices]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Billing"
        subtitle="Invoices, expenses, purchases, and materials."
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                exportCsv(
                  "invoices.csv",
                  rows.map((i) => ({
                    number: i.number,
                    company: i.companyName,
                    amount: i.amount,
                    status: i.status,
                    due: i.due,
                  })),
                )
              }
            >
              Export CSV
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const id = createInvoiceDraft(companies[0]?.id ?? "c-cascade");
                if (id) pushToast("Open the draft from the list");
              }}
            >
              <Plus size={16} /> New Invoice
            </button>
          </>
        }
      />
      <Tabs tabs={["Invoices", "Expenses", "Purchases", "Materials"]} active={tab} onChange={setTab} />
      {tab === "Invoices" ? (
        <>
          <div className="panel mb-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            <Total label="Outstanding" value={money(totals.outstanding)} />
            <Total label="Overdue" value={money(totals.overdue)} danger />
            <Total label="In Terms" value={money(totals.inTerms)} info />
            <Total label="Paid (MTD)" value={money(totals.paidMtd)} success />
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
                      <td>
                        <Link href={`/app/billing/view/?id=${inv.id}`} className="font-medium text-[var(--color-navy)]">
                          {inv.number}
                        </Link>
                      </td>
                      <td>{inv.companyName}</td>
                      <td className="tabular-nums">{money(inv.amount)}</td>
                      <td>{inv.terms}</td>
                      <td>{formatDisplayDate(inv.due)}</td>
                      <td>
                        <StatusPill tone={statusTone(inv.status)}>{inv.status}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SideRail title="Shortcuts">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/app/reports/profitability" className="hover:underline">
                    Profitability
                  </Link>
                </li>
                <li>
                  <Link href="/app/timesheets" className="hover:underline">
                    Timesheet overview
                  </Link>
                </li>
                <li>
                  <button type="button" className="hover:underline" onClick={() => setFilter("Overdue")}>
                    Overdue invoices
                  </button>
                </li>
              </ul>
            </SideRail>
          </div>
        </>
      ) : null}
      {tab === "Expenses" ? (
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Project</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="font-medium">{e.vendor}</td>
                  <td>{e.project}</td>
                  <td>{formatDisplayDate(e.date)}</td>
                  <td className="tabular-nums">{money(e.amount)}</td>
                  <td>
                    <StatusPill tone={statusTone(e.status)}>{e.status}</StatusPill>
                  </td>
                  <td className="text-right">
                    {e.status === "Pending" ? (
                      <button
                        type="button"
                        className="btn btn-primary text-sm"
                        onClick={() => {
                          setExpenses((prev) =>
                            prev.map((x) => (x.id === e.id ? { ...x, status: "Approved" } : x)),
                          );
                          pushToast("Expense approved");
                        }}
                      >
                        Approve
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {tab === "Purchases" ? (
        <div className="panel p-6 text-sm text-[var(--color-muted)]">
          Purchase orders for client bill-through will land with finance integrations. Track vendor spend under Expenses for now.
        </div>
      ) : null}
      {tab === "Materials" ? (
        <div className="panel p-6 text-sm text-[var(--color-muted)]">
          Materials (hardware, licenses) can be added to invoice line items from project billing. Sample materials appear on INV-2291.
        </div>
      ) : null}
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
      <div className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
