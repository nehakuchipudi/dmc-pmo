"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Briefcase, Plus } from "lucide-react";
import { IfCan } from "@/components/auth/IfCan";
import { ExpenseCreateForm } from "@/components/billing/ExpenseCreateForm";
import { InvoiceEditorModal, InvoiceRowActions } from "@/components/billing/InvoiceRowActions";
import { MaterialCreateForm } from "@/components/billing/MaterialCreateForm";
import { PurchaseCreateForm } from "@/components/billing/PurchaseCreateForm";
import { InvoiceCreateForm } from "@/components/InvoiceCreateForm";
import type { Invoice } from "@/lib/types";
import { FilterChips, Modal, PageHeader, StatusPill, Tabs, statusTone } from "@/components/ui";
import { invoiceOwingTip, invoiceOwingView, invoiceSubject } from "@/lib/invoice";
import { formatDisplayDate, formatShortDate, money } from "@/lib/seed";
import { exportCsv } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";
import { todayIso } from "@/lib/timesheet";

const FILTERS = ["All Invoices", "Draft", "In Terms", "Overdue", "Paid"];

export default function BillingPage() {
  const router = useRouter();
  const invoices = useAppStore((s) => s.invoices);
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const retainers = useAppStore((s) => s.retainers);
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
  const [editing, setEditing] = useState<Invoice | null>(null);
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
                  rows.map((i) => {
                    const against =
                      projects.find((project) => project.id === i.projectId)?.name ||
                      retainers.find((retainer) => retainer.id === i.retainerId)?.name ||
                      "";
                    const owing = invoiceOwingView(i, todayIso());
                    return {
                      id: i.number,
                      subject: invoiceSubject(i),
                      company: i.companyName,
                      against,
                      owner: i.owner || i.manager || "",
                      raised: i.raised || "",
                      amount: i.amount,
                      owing: owing.kind === "paid" ? "Paid" : owing.amount,
                      status: i.status,
                      due: i.due,
                    };
                  }),
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
          <div className="panel overflow-hidden">
            <div className="table-wrap">
              <table className="table billing-invoice-table">
                <thead>
                  <tr>
                    <th>ID #</th>
                    <th>Invoice Subject</th>
                    <th>Company</th>
                    <th>Against</th>
                    <th>Owner</th>
                    <th>Raised</th>
                    <th>Amount</th>
                    <th>Total owing</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv) => {
                    const againstProject = projects.find((project) => project.id === inv.projectId);
                    const againstRetainer = retainers.find((retainer) => retainer.id === inv.retainerId);
                    const againstHref = againstProject
                      ? `/app/projects/view/?id=${againstProject.id}`
                      : againstRetainer
                        ? `/app/retainers/view/?id=${againstRetainer.id}`
                        : "";
                    const againstLabel = againstProject?.name || againstRetainer?.name || "";
                    return (
                      <tr key={inv.id}>
                        <td>
                          <Link href={`/app/billing/view/?id=${inv.id}`} className="font-medium text-[var(--color-navy)]">
                            {inv.number}
                          </Link>
                        </td>
                        <td>
                          <Link href={`/app/billing/view/?id=${inv.id}`} className="font-medium text-[var(--color-navy)]">
                            {invoiceSubject(inv)}
                          </Link>
                        </td>
                        <td>{inv.companyName}</td>
                        <td>
                          {againstHref ? (
                            <Link href={againstHref} className="billing-against">
                              <Briefcase size={14} />
                              {againstLabel}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{inv.owner || inv.manager || "—"}</td>
                        <td className="whitespace-nowrap">{inv.raised ? formatShortDate(inv.raised) : "—"}</td>
                        <td className="tabular-nums whitespace-nowrap">{money(inv.amount)}</td>
                        <td>
                          <OwingCell invoice={inv} />
                        </td>
                        <InvoiceRowActions invoice={inv} onEdit={setEditing} />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            <Link href="/app/reports/profitability" className="hover:underline">
              Profitability
            </Link>
            {" · "}
            <Link href="/app/timesheets" className="hover:underline">
              Timesheet overview
            </Link>
            {" · "}
            <button type="button" className="hover:underline" onClick={() => setFilter("Overdue")}>
              Overdue invoices
            </button>
          </p>
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

      <InvoiceEditorModal invoice={editing} onClose={() => setEditing(null)} />
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

function OwingDays({ overdue, days, tip }: { overdue: boolean; days: number; tip: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  return (
    <>
      <span
        className={overdue ? "billing-owing-days is-overdue" : "billing-owing-days is-ok"}
        onMouseEnter={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setPos({ top: rect.top, left: rect.left + rect.width / 2 });
        }}
        onMouseLeave={() => setPos(null)}
      >
        ({days} {days === 1 ? "day" : "days"})
      </span>
      {pos
        ? createPortal(
            <div className="billing-owing-tip" role="tooltip" style={{ top: pos.top, left: pos.left }}>
              {tip}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function OwingCell({ invoice }: { invoice: Invoice }) {
  const view = invoiceOwingView(invoice, todayIso());
  if (view.kind === "paid") {
    return (
      <div className="billing-owing">
        <span className="billing-owing-days is-ok">
          {view.daysAfterDue === null ? "Paid" : `Paid after ${view.daysAfterDue} days`}
        </span>
      </div>
    );
  }
  if (view.kind === "draft") {
    return (
      <div className="billing-owing">
        <span className="tabular-nums">{money(view.amount)}</span>{" "}
        <span className="billing-owing-days">Draft</span>
      </div>
    );
  }
  const tip = invoiceOwingTip(view) ?? "";
  return (
    <div className="billing-owing">
      <span className="tabular-nums">{money(view.amount)}</span>{" "}
      <OwingDays overdue={view.overdue} days={view.days} tip={tip} />
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
