"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IfCan } from "@/components/auth/IfCan";
import { InvoiceDocument } from "@/components/billing/InvoiceDocument";
import { InvoiceSendCompose } from "@/components/billing/InvoiceSendCompose";
import { MailAttachmentCopies } from "@/components/billing/MailAttachmentCopies";
import { InvoiceEditorModal } from "@/components/billing/InvoiceRowActions";
import { ConfirmModal, StatusPill, statusTone } from "@/components/ui";
import type { MailAttachment } from "@/lib/deliver-mail";
import { formatShortDate, moneyExact } from "@/lib/seed";
import { exportInvoicePdf, mailAttachmentsForInvoice } from "@/lib/pdf";
import { createQuickBooksInvoice, quickbooksInvoicePatch, quickbooksSettingsHref } from "@/lib/quickbooks";
import { safeAppHref } from "@/lib/project-tabs";
import { useAppStore } from "@/lib/store";

export function InvoiceDetail({ id, returnTo }: { id: string; returnTo?: string | null }) {
  const router = useRouter();
  const billingHref = safeAppHref(returnTo) ?? "/app/billing";
  const invoices = useAppStore((s) => s.invoices);
  const companies = useAppStore((s) => s.companies);
  const contacts = useAppStore((s) => s.contacts);
  const projects = useAppStore((s) => s.projects);
  const sendInvoice = useAppStore((s) => s.sendInvoice);
  const payInvoice = useAppStore((s) => s.payInvoice);
  const updateInvoice = useAppStore((s) => s.updateInvoice);
  const deleteInvoice = useAppStore((s) => s.deleteInvoice);
  const pushToast = useAppStore((s) => s.pushToast);
  const [qbBusy, setQbBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [copies, setCopies] = useState<MailAttachment[]>([]);
  const [copiesBusy, setCopiesBusy] = useState(false);
  const invoice = invoices.find((item) => item.id === id);
  const company = companies.find((item) => item.id === invoice?.companyId);

  useEffect(() => {
    if (!invoice) {
      setCopies([]);
      setCopiesBusy(false);
      return;
    }
    let cancelled = false;
    setCopiesBusy(true);
    void mailAttachmentsForInvoice(invoice, company?.address)
      .then((next) => {
        if (!cancelled) setCopies(next);
      })
      .catch(() => {
        if (!cancelled) setCopies([]);
      })
      .finally(() => {
        if (!cancelled) setCopiesBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [invoice?.id, invoice?.attachDeliverables, invoice?.deliverableDocs, company?.address]);

  if (!invoice) {
    return (
      <div className="fade-in panel p-6">
        <p className="font-semibold text-[var(--color-navy)]">Invoice not found</p>
        <Link href={billingHref} className="btn btn-primary mt-4">
          Back to billing
        </Link>
      </div>
    );
  }

  const contact = contacts.find((item) => item.id === invoice.billToContactId);
  const project = projects.find((item) => item.id === invoice.projectId);
  const record = invoice;

  function downloadPdf() {
    exportInvoicePdf(record, company?.address);
  }

  async function sendToQuickBooks() {
    if (qbBusy) return;
    setQbBusy(true);
    const result = await createQuickBooksInvoice(record, { email: contact?.email || company?.email });
    if (result.ok) {
      updateInvoice(record.id, quickbooksInvoicePatch(result));
      pushToast(`${record.number} created in QuickBooks`, "success");
    } else {
      updateInvoice(record.id, { quickbooksError: result.error });
      pushToast(result.error, "danger");
    }
    setQbBusy(false);
  }

  return (
    <div className="fade-in invoice-view">
      <div className="invoice-view-crumb">
        <Link href={billingHref}>Billing</Link> / {invoice.number}
      </div>
      <aside className="invoice-view-rail">
        {project ? (
          <p className="invoice-view-project">
            Project: {project.name}
          </p>
        ) : null}
        <h2>Invoice Details</h2>
        <div className={`invoice-amount-card ${invoice.status === "Paid" ? "is-paid" : ""}`}>
          <StatusPill tone={statusTone(invoice.status)}>{invoice.status}</StatusPill>
          <span>Invoice Amount</span>
          <strong>{moneyExact(invoice.amount)}</strong>
        </div>
        <dl className="invoice-view-fields">
          <div>
            <dt>Raised</dt>
            <dd>{invoice.raised ? formatShortDate(invoice.raised) : "Not set"}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{formatShortDate(invoice.due)}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>{invoice.owner || "Unassigned"}</dd>
          </div>
          <div>
            <dt>Creator</dt>
            <dd>{invoice.creator || invoice.owner || "Unassigned"}</dd>
          </div>
          <div>
            <dt>Reference</dt>
            <dd>{invoice.reference || project?.name || invoice.companyName}</dd>
          </div>
          <div>
            <dt>Modified By</dt>
            <dd>
              {invoice.modifiedBy || invoice.creator || invoice.owner || "Unassigned"}
              {invoice.modifiedAt || invoice.raised ? (
                <>
                  <br />
                  on {formatShortDate(invoice.modifiedAt || invoice.raised || invoice.due)}
                </>
              ) : null}
            </dd>
          </div>
        </dl>
        <div className="invoice-pdf-box">
          <h3>Company PDF Invoice</h3>
          <MailAttachmentCopies files={copies} loading={copiesBusy} />
          <div className="invoice-pdf-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setSendOpen(true)}>
              Email PDF
            </button>
            <IfCan cap="manage_invoice">
              <button type="button" className="btn btn-ghost" onClick={() => sendInvoice(invoice.id)}>
                Send via Activity
              </button>
            </IfCan>
          </div>
        </div>
        <div className="invoice-qb-box">
          <h3>QuickBooks</h3>
          {invoice.quickbooksId ? (
            <>
              <p>
                {invoice.quickbooksDocNumber || invoice.number} is in QuickBooks
                {invoice.quickbooksSyncedAt ? ` as of ${formatShortDate(invoice.quickbooksSyncedAt)}` : ""}.
              </p>
              {invoice.quickbooksHref ? (
                <a className="btn btn-ghost" href={invoice.quickbooksHref} target="_blank" rel="noreferrer">
                  Open in QuickBooks
                </a>
              ) : null}
            </>
          ) : (
            <>
              <p>{invoice.quickbooksError || "Create this invoice in the connected QuickBooks company."}</p>
              <IfCan cap="create_invoice">
                <button type="button" className="btn btn-primary" onClick={() => void sendToQuickBooks()} disabled={qbBusy}>
                  Send to QuickBooks
                </button>
              </IfCan>
              <Link href={quickbooksSettingsHref()} className="invoice-qb-setup">
                Connect in Invoice & Pricing
              </Link>
            </>
          )}
        </div>
        <div className="invoice-rail-actions">
          {invoice.status === "Sent" || invoice.status === "Overdue" ? (
            <IfCan cap="pay_invoice">
              <button type="button" className="btn btn-primary" onClick={() => payInvoice(invoice.id)}>
                Record payment
              </button>
            </IfCan>
          ) : null}
          <IfCan cap="manage_invoice">
            <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(true)}>
              Edit
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setDeleteOpen(true)}>
              Delete
            </button>
          </IfCan>
          <button type="button" className="btn btn-ghost" onClick={downloadPdf}>
            Export PDF
          </button>
        </div>
      </aside>
      <InvoiceDocument invoice={invoice} companyAddress={company?.address} projectName={project?.name} />
      <InvoiceEditorModal invoice={editOpen ? invoice : null} onClose={() => setEditOpen(false)} />
      <InvoiceSendCompose invoice={invoice} open={sendOpen} onClose={() => setSendOpen(false)} />
      <ConfirmModal
        open={deleteOpen}
        title={`Delete ${invoice.number}?`}
        body={`${invoice.number} will be removed from Billing. This cannot be undone.`}
        confirmLabel="Delete invoice"
        danger
        onConfirm={() => {
          deleteInvoice(invoice.id);
          router.push(billingHref);
        }}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
