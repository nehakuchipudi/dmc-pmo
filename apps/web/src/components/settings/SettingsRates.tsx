"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  PricingAddMenu,
  PricingEmpty,
  PricingField,
  PricingForm,
  PricingRemoveBtn,
  PricingSheet,
  PricingTable,
  PricingTitle,
  PricingTitleLink,
  PricingToggle,
  PricingToolbar,
} from "@/components/settings/SettingsPricingChrome";
import { useAuth } from "@/lib/auth";
import { BILLING_RATE_KINDS, formatPricingRate } from "@/lib/invoice-pricing";
import { useAppStore } from "@/lib/store";
import type { BillingRate, BillingRateKind } from "@/lib/types";

type Draft = Omit<BillingRate, "id">;

const EMPTY: Draft = { title: "", rate: 0, kind: "Billable Rate", active: true };

export function SettingsRates() {
  const { can } = useAuth();
  const canEdit = can("manage_invoice");
  const rates = useAppStore((s) => s.billingRates);
  const createBillingRate = useAppStore((s) => s.createBillingRate);
  const updateBillingRate = useAppStore((s) => s.updateBillingRate);
  const setBillingRateActive = useAppStore((s) => s.setBillingRateActive);
  const deleteBillingRate = useAppStore((s) => s.deleteBillingRate);
  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const rows = useMemo(
    () => rates.filter((row) => showInactive || row.active),
    [rates, showInactive],
  );
  const editing = editingId ? rates.find((row) => row.id === editingId) : undefined;
  const isForm = editingId !== undefined;

  function startAdd(kind: BillingRateKind) {
    setEditingId(null);
    setDraft({ ...EMPTY, kind });
  }

  function startEdit(row: BillingRate) {
    setEditingId(row.id);
    setDraft({ title: row.title, rate: row.rate, kind: row.kind, active: row.active });
  }

  function save() {
    if (!canEdit) return;
    const payload: Draft = {
      title: draft.title.trim() || "Untitled rate",
      rate: Number(draft.rate) || 0,
      kind: draft.kind,
      active: draft.active,
    };
    if (editing) updateBillingRate(editing.id, payload);
    else createBillingRate(payload);
    setEditingId(undefined);
  }

  if (isForm) {
    return (
      <PricingForm
        title={editing ? `Edit Account Rate: ${editing.title}` : "Add Account Rate"}
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
        <PricingField label="Rate">
          <input
            className="field-input pricing-rate-input"
            type="number"
            min={0}
            step="0.01"
            value={draft.rate}
            onChange={(e) => setDraft((current) => ({ ...current, rate: Number(e.target.value) }))}
            disabled={!canEdit}
          />
        </PricingField>
        <PricingField label="Type">
          <select
            className="field-input"
            value={draft.kind}
            onChange={(e) => setDraft((current) => ({ ...current, kind: e.target.value as BillingRateKind }))}
            disabled={!canEdit}
          >
            {BILLING_RATE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </PricingField>
      </PricingForm>
    );
  }

  return (
    <PricingSheet>
      <PricingTitle>Rates</PricingTitle>
      <PricingToolbar>
        {canEdit ? (
          <PricingAddMenu
            label="Add Rate"
            items={BILLING_RATE_KINDS.map((kind) => ({
              id: kind,
              label: kind,
              onSelect: () => startAdd(kind),
            }))}
          />
        ) : null}
        <PricingToggle label="Show Inactive Rates" checked={showInactive} onChange={setShowInactive} />
      </PricingToolbar>
      <PricingTable
        columns={[
          { key: "title", label: "Title" },
          { key: "rate", label: "Rate", width: "140px" },
          { key: "type", label: "Type", width: "180px" },
        ]}
      >
        {rows.map((row) => (
          <tr key={row.id} className={clsx(!row.active && "is-inactive")}>
            <td>
              <PricingTitleLink onClick={() => startEdit(row)}>{row.title}</PricingTitleLink>
            </td>
            <td className="pricing-num">{formatPricingRate(row.rate)}</td>
            <td>{row.kind}</td>
            <td className="pricing-table-action">
              {canEdit ? (
                <PricingRemoveBtn
                  label={row.active ? `Hide ${row.title}` : `Remove ${row.title}`}
                  onClick={() => (row.active ? setBillingRateActive(row.id, false) : deleteBillingRate(row.id))}
                />
              ) : null}
            </td>
          </tr>
        ))}
      </PricingTable>
      {!rows.length ? <PricingEmpty>No rates to show.</PricingEmpty> : null}
    </PricingSheet>
  );
}
