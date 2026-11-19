"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { IfCan } from "@/components/auth/IfCan";
import { InvoiceCreateForm } from "@/components/InvoiceCreateForm";
import { RowMenu } from "@/components/RowMenu";
import { ConfirmModal, Field, Modal, TextTextarea } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { invoiceSubject } from "@/lib/invoice";
import { useAppStore } from "@/lib/store";
import type { Invoice } from "@/lib/types";

export function InvoiceRowActions({
  invoice,
  onEdit,
}: {
  invoice: Invoice;
  onEdit: (invoice: Invoice) => void;
}) {
  const router = useRouter();
  const { user, can } = useAuth();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const deleteInvoice = useAppStore((s) => s.deleteInvoice);
  const payInvoice = useAppStore((s) => s.payInvoice);
  const logActivity = useAppStore((s) => s.logActivity);
  const pushToast = useAppStore((s) => s.pushToast);
  const canPay = can("pay_invoice") && (invoice.status === "Sent" || invoice.status === "Overdue");

  return (
    <td className="row-actions text-right">
      <button
        type="button"
        className="btn btn-ghost"
        aria-label={`Actions for ${invoice.number}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => {
          const el = event.currentTarget;
          setAnchor((current) => (current ? null : el));
        }}
      >
        <MoreVertical size={16} />
      </button>
      <RowMenu open={Boolean(anchor)} anchor={anchor} onClose={() => setAnchor(null)}>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setAnchor(null);
            router.push(`/app/billing/view/?id=${invoice.id}`);
          }}
        >
          View
        </button>
        <IfCan cap="manage_invoice">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onEdit(invoice);
              setAnchor(null);
            }}
          >
            Edit
          </button>
        </IfCan>
        <IfCan cap="add_note">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setActivityOpen(true);
              setAnchor(null);
            }}
          >
            Add activity
          </button>
        </IfCan>
        {canPay ? (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              payInvoice(invoice.id);
              setAnchor(null);
            }}
          >
            Receive payment
          </button>
        ) : null}
        <IfCan cap="manage_invoice">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setConfirm(true);
              setAnchor(null);
            }}
          >
            Delete
          </button>
        </IfCan>
      </RowMenu>
      <ConfirmModal
        open={confirm}
        title={`Delete ${invoice.number}?`}
        body={`${invoice.number} will be removed from Billing. This cannot be undone.`}
        confirmLabel="Delete invoice"
        danger
        onConfirm={() => {
          deleteInvoice(invoice.id);
          setConfirm(false);
        }}
        onClose={() => setConfirm(false)}
      />
      <Modal open={activityOpen} title={`Add activity · ${invoice.number}`} onClose={() => setActivityOpen(false)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const body = String(new FormData(event.currentTarget).get("body") || "").trim();
            if (!body) return;
            logActivity({
              type: "comment",
              action: body,
              companyId: invoice.companyId,
              projectId: invoice.projectId,
              entityType: "invoice",
              entityId: invoice.id,
              entityLabel: invoiceSubject(invoice),
              href: `/app/billing/view/?id=${invoice.id}`,
              actor: user?.name,
            });
            pushToast("Note saved to activity");
            setActivityOpen(false);
          }}
        >
          <Field label="Note">
            <TextTextarea name="body" rows={4} placeholder={`What happened on ${invoiceSubject(invoice)}?`} required />
          </Field>
          <button type="submit" className="btn btn-primary">
            Save note
          </button>
        </form>
      </Modal>
    </td>
  );
}

export function InvoiceEditorModal({
  invoice,
  onClose,
}: {
  invoice: Invoice | null;
  onClose: () => void;
}) {
  return (
    <Modal open={Boolean(invoice)} title={invoice ? `Edit ${invoice.number}` : "Edit invoice"} onClose={onClose} xl>
      {invoice ? (
        <InvoiceCreateForm
          key={invoice.id}
          invoice={invoice}
          defaultCompanyId={invoice.companyId}
          defaultProjectId={invoice.projectId}
          onCancel={onClose}
          onCreated={() => onClose()}
        />
      ) : null}
    </Modal>
  );
}
