"use client";

import { useMemo, useState } from "react";
import {
  PricingCheckField,
  PricingEmpty,
  PricingField,
  PricingForm,
  PricingInactiveSearch,
  PricingOutlineBtn,
  PricingRemoveBtn,
  PricingSheet,
  PricingTable,
  PricingTitle,
  PricingTitleLink,
  PricingToolbar,
} from "@/components/settings/SettingsPricingChrome";
import { useAuth } from "@/lib/auth";
import { formatTaxRate } from "@/lib/invoice-pricing";
import { useAppStore } from "@/lib/store";
import type { TaxCode } from "@/lib/types";

type Draft = Omit<TaxCode, "id">;

const EMPTY: Draft = { title: "", rate: 0, invoices: true, purchases: false, active: true };

export function SettingsTaxCodes() {
  const { can } = useAuth();
  const canEdit = can("manage_invoice");
  const codes = useAppStore((s) => s.taxCodes);
  const createTaxCode = useAppStore((s) => s.createTaxCode);
  const updateTaxCode = useAppStore((s) => s.updateTaxCode);
  const setTaxCodeActive = useAppStore((s) => s.setTaxCodeActive);
  const deleteTaxCode = useAppStore((s) => s.deleteTaxCode);
  const pushToast = useAppStore((s) => s.pushToast);
  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const rows = useMemo(
    () => codes.filter((row) => showInactive || row.active),
    [codes, showInactive],
  );
  const editing = editingId ? codes.find((row) => row.id === editingId) : undefined;
  const isForm = editingId !== undefined;

  function startAdd() {
    setEditingId(null);
    setDraft({ ...EMPTY });
  }

  function startEdit(row: TaxCode) {
    setEditingId(row.id);
    setDraft({
      title: row.title,
      rate: row.rate,
      invoices: row.invoices,
      purchases: row.purchases,
      active: row.active,
    });
  }

  function save() {
    if (!canEdit) return;
    const payload: Draft = {
      title: draft.title.trim() || "Untitled tax",
      rate: Number(draft.rate) || 0,
      invoices: draft.invoices,
      purchases: draft.purchases,
      active: draft.active,
    };
    if (editing) updateTaxCode(editing.id, payload);
    else createTaxCode(payload);
    setEditingId(undefined);
  }

  if (isForm) {
    return (
      <PricingForm
        title={editing ? `Edit Account Tax: ${editing.title}` : "Add Account Tax"}
        onCancel={() => setEditingId(undefined)}
        onSave={save}
        canEdit={canEdit}
      >
        <PricingField label="Title">
          <input
            className="field-input"
            value={draft.title}
            onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
            required
            disabled={!canEdit}
          />
        </PricingField>
        <PricingField label="Rate (%)">
          <input
            className="field-input pricing-rate-value"
            type="number"
            min={0}
            step="0.01"
            value={draft.rate}
            onChange={(e) => setDraft((current) => ({ ...current, rate: Number(e.target.value) }))}
            disabled={!canEdit}
          />
        </PricingField>
        <PricingCheckField
          label="Purchases"
          hint="Use tax code for Purchases"
          checked={draft.purchases}
          onChange={(purchases) => setDraft((current) => ({ ...current, purchases }))}
          disabled={!canEdit}
        />
        <PricingCheckField
          label="Invoices"
          hint="Use tax code for Invoices"
          checked={draft.invoices}
          onChange={(invoices) => setDraft((current) => ({ ...current, invoices }))}
          disabled={!canEdit}
        />
      </PricingForm>
    );
  }

  return (
    <PricingSheet>
      <PricingTitle>Tax Codes</PricingTitle>
      <PricingToolbar>
        {canEdit ? (
          <>
            <PricingOutlineBtn onClick={() => pushToast("QuickBooks is not connected.", "info")}>
              Import QuickBooks Tax Codes
            </PricingOutlineBtn>
            <PricingOutlineBtn onClick={startAdd}>Add Tax Code</PricingOutlineBtn>
          </>
        ) : null}
        <span className="pricing-toolbar-spacer" />
        <PricingInactiveSearch checked={showInactive} onChange={setShowInactive} />
      </PricingToolbar>
      <PricingTable
        columns={[
          { key: "title", label: "Title" },
          { key: "rate", label: "Rate", width: "140px" },
        ]}
      >
        {rows.map((row) => (
          <tr key={row.id} className={row.active ? undefined : "is-inactive"}>
            <td>
              <PricingTitleLink onClick={() => startEdit(row)} checked={row.active}>
                {row.title}
              </PricingTitleLink>
            </td>
            <td className="pricing-num">{formatTaxRate(row.rate)}</td>
            <td className="pricing-table-action">
              {canEdit ? (
                <PricingRemoveBtn
                  kind="trash"
                  label={row.active ? `Hide ${row.title}` : `Remove ${row.title}`}
                  onClick={() => (row.active ? setTaxCodeActive(row.id, false) : deleteTaxCode(row.id))}
                />
              ) : null}
            </td>
          </tr>
        ))}
      </PricingTable>
      {!rows.length ? <PricingEmpty>No tax codes to show.</PricingEmpty> : null}
    </PricingSheet>
  );
}
