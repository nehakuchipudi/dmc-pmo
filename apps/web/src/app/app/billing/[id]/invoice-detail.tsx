"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { IfCan } from "@/components/auth/IfCan";
import { InvoiceDocument } from "@/components/billing/InvoiceDocument";
import { StatusPill, statusTone } from "@/components/ui";
import { invoicePdfName } from "@/lib/invoice";
import { formatShortDate, moneyExact } from "@/lib/seed";
import { exportInvoicePdf } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

export function InvoiceDetail({ id }: { id: string }) {
  const invoices = useAppStore((s) => s.invoices);
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const sendInvoice = useAppStore((s) => s.sendInvoice);
  const payInvoice = useAppStore((s) => s.payInvoice);
  const queueEmail = useAppStore((s) => s.queueEmail);
  const pushToast = useAppStore((s) => s.pushToast);
  const invoice = invoices.find((item) => item.id === id);

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

  const company = companies.find((item) => item.id === invoice.companyId);
  const project = projects.find((item) => item.id === invoice.projectId);
  const pdfName = invoicePdfName(invoice);
  const record = invoice;

  function downloadPdf() {
    exportInvoicePdf(record, company?.address);
  }

  return (
    <div className="fade-in invoice-view">
      <div className="invoice-view-crumb">
        <Link href="/app/billing">Billing</Link> / {invoice.number}
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
          <button type="button" className="invoice-pdf-file" onClick={downloadPdf}>
            <FileText size={16} />
            {pdfName}
          </button>
          <div className="invoice-pdf-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                downloadPdf();
                queueEmail(
                  "billing@client.com",
                  `${invoice.number} PDF`,
                  `Please find ${pdfName} attached.`,
                );
                pushToast("PDF emailed");
              }}
            >
              Email PDF
            </button>
            <IfCan cap="manage_invoice">
              <button type="button" className="btn btn-ghost" onClick={() => sendInvoice(invoice.id)}>
                Send via Activity
              </button>
            </IfCan>
          </div>
        </div>
        <div className="invoice-rail-actions">
          {invoice.status === "Sent" || invoice.status === "Overdue" ? (
            <IfCan cap="pay_invoice">
              <button type="button" className="btn btn-primary" onClick={() => payInvoice(invoice.id)}>
                Record payment
              </button>
            </IfCan>
          ) : null}
          <button type="button" className="btn btn-ghost" onClick={downloadPdf}>
            Export PDF
          </button>
        </div>
      </aside>
      <InvoiceDocument invoice={invoice} companyAddress={company?.address} projectName={project?.name} />
    </div>
  );
}
