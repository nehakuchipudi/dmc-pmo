"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { IfCan } from "@/components/auth/IfCan";
import { InvoiceCreateForm } from "@/components/InvoiceCreateForm";
import { RowMenu } from "@/components/RowMenu";
import { ConfirmModal, Modal } from "@/components/ui";
import { useAppStore } from "@/lib/store";
import type { Invoice } from "@/lib/types";

export function InvoiceRowActions({
  invoice,
  onEdit,
}: {
  invoice: Invoice;
  onEdit: (invoice: Invoice) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [confirm, setConfirm] = useState(false);
  const deleteInvoice = useAppStore((s) => s.deleteInvoice);

  return (
    <td className="row-actions text-right">
      <IfCan cap="manage_invoice">
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
              onEdit(invoice);
              setAnchor(null);
            }}
          >
            Edit
          </button>
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
      </IfCan>
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
