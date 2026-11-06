"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { IfCan } from "@/components/auth/IfCan";
import { ExpenseCreateForm } from "@/components/billing/ExpenseCreateForm";
import { MaterialCreateForm } from "@/components/billing/MaterialCreateForm";
import { PurchaseCreateForm } from "@/components/billing/PurchaseCreateForm";
import { InvoiceCreateForm } from "@/components/InvoiceCreateForm";
import { FilterChips, Modal, PageHeader, SideRail, StatusPill, Tabs, statusTone } from "@/components/ui";
import { formatDisplayDate, money } from "@/lib/seed";
import { exportCsv } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

const FILTERS = ["All Invoices", "Draft", "In Terms", "Overdue", "Paid"];

export default function BillingPage() {
  const router = useRouter();
  const invoices = useAppStore((s) => s.invoices);
  const companies = useAppStore((s) => s.companies);
  const expenses = useAppStore((s) => s.expenses);
  const purchases = useAppStore((s) => s.purchases);
  const billMaterials = useAppStore((s) => s.billMaterials);
  const approveExpense = useAppStore((s) => s.approveExpense);
  const createExpense = useAppStore((s) => s.createExpense);
  const createPurchase = useAppStore((s) => s.createPurchase);
  const createBillMaterial = useAppStore((s) => s.createBillMaterial);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [tab, setTab] = useState("Invoices");
  const [newOpen, setNewOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);

  const rows = useMemo(() => {
    if (filter === "Overdue") return invoices.filter((i) => i.status === "Overdue");
    if (filter === "In Terms") return invoices.filter((i) => i.status === "Sent");
    if (filter === "Draft") return invoices.filter((i) => i.status === "Draft");
    if (filter === "Paid") return invoices.filter((i) => i.status === "Paid");
    return invoices;
  }, [filter, invoices]);

  const totals = useMemo(() => {
    const outstanding = invoices.filter((i) => i.status !== "Paid" && i.status !== "Draft").reduce((s, i) => s + i.amount, 0);
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
            {tab === "Invoices" ? (
              <IfCan cap="create_invoice">
                <button type="button" className="btn btn-primary" onClick={() => setNewOpen(true)}>
                  <Plus size={16} /> New Invoice
                </button>
              </IfCan>
            ) : null}
            {tab === "Expenses" ? (
              <IfCan cap="create_expense">
                <button type="button" className="btn btn-primary" onClick={() => setExpenseOpen(true)}>
                  <Plus size={16} /> New Expense
                </button>
              </IfCan>
            ) : null}
            {tab === "Purchases" ? (
              <IfCan cap="create_expense">
                <button type="button" className="btn btn-primary" onClick={() => setPurchaseOpen(true)}>
                  <Plus size={16} /> New Purchase
                </button>
              </IfCan>
            ) : null}
            {tab === "Materials" ? (
              <IfCan cap="create_invoice">
                <button type="button" className="btn btn-primary" onClick={() => setMaterialOpen(true)}>
                  <Plus size={16} /> New Material
                </button>
              </IfCan>
            ) : null}
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
                  <td className="font-medium">{e.title || e.vendor}</td>
                  <td>{e.belongLabel || e.projectName}</td>
                  <td>{formatDisplayDate(e.date)}</td>
                  <td className="tabular-nums">{money(e.amount)}</td>
                  <td>
                    <StatusPill tone={statusTone(e.status)}>{e.status}</StatusPill>
                  </td>
                  <td className="text-right">
                    {e.status === "Pending" ? (
                      <IfCan cap="approve_expense">
                        <button type="button" className="btn btn-primary text-sm" onClick={() => approveExpense(e.id)}>
                          Approve
                        </button>
                      </IfCan>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!expenses.length ? (
            <p className="p-4 text-xs text-[var(--color-muted)]">
              Add an expense from New Expense, or from Create. They land here as Pending for approval.
            </p>
          ) : null}
        </div>
      ) : null}
      {tab === "Purchases" ? (
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Vendor</th>
                <th>Project</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.title}</td>
                  <td>{row.vendor}</td>
                  <td>{row.projectName || row.companyName || "Unassigned"}</td>
                  <td>{formatDisplayDate(row.date)}</td>
                  <td className="tabular-nums">{money(row.amount)}</td>
                  <td>
                    <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!purchases.length ? (
            <p className="p-4 text-xs text-[var(--color-muted)]">Add a purchase to bill vendor spend on an invoice.</p>
          ) : null}
        </div>
      ) : null}
      {tab === "Materials" ? (
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Qty</th>
                <th>Purchase</th>
                <th>Sale</th>
                <th>Project</th>
              </tr>
            </thead>
            <tbody>
              {billMaterials.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.title}</td>
                  <td className="tabular-nums">{row.qty}</td>
                  <td className="tabular-nums">{money(row.purchasePrice)}</td>
                  <td className="tabular-nums">{money(row.salePrice)}</td>
                  <td>{row.projectName || row.companyName || "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!billMaterials.length ? (
            <p className="p-4 text-xs text-[var(--color-muted)]">Add a material here, then select it when you create an invoice.</p>
          ) : null}
        </div>
      ) : null}

      <Modal open={newOpen} title="Create invoice" onClose={() => setNewOpen(false)} xl>
        <InvoiceCreateForm
          defaultCompanyId={companies[0]?.id}
          onCancel={() => setNewOpen(false)}
          onCreated={(id) => {
            setNewOpen(false);
            router.push(`/app/billing/view/?id=${id}`);
          }}
        />
      </Modal>
      <Modal open={expenseOpen} title="New expense" onClose={() => setExpenseOpen(false)} xl>
        <ExpenseCreateForm
          onSubmit={(values, addAnother) => {
            const id = createExpense(values);
            if (!id) return false;
            if (!addAnother) setExpenseOpen(false);
          }}
        />
      </Modal>
      <Modal open={purchaseOpen} title="New purchase" onClose={() => setPurchaseOpen(false)}>
        <PurchaseCreateForm
          defaultCompanyId={companies[0]?.id}
          onSubmit={(values) => {
            const id = createPurchase(values);
            if (id) setPurchaseOpen(false);
          }}
        />
      </Modal>
      <Modal open={materialOpen} title="New material" onClose={() => setMaterialOpen(false)}>
        <MaterialCreateForm
          defaultCompanyId={companies[0]?.id}
          onSubmit={(values) => {
            const id = createBillMaterial(values);
            if (id) setMaterialOpen(false);
          }}
        />
      </Modal>
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
