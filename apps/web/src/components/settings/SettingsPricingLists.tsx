"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  PricingAddMenu,
  PricingEmpty,
  PricingField,
  PricingForm,
  PricingOutlineBtn,
  PricingRemoveBtn,
  PricingSheet,
  PricingTable,
  PricingTitle,
  PricingTitleLink,
  PricingToggle,
  PricingToolbar,
} from "@/components/settings/SettingsPricingChrome";
import { useAuth } from "@/lib/auth";
import { CATALOG_ITEM_KINDS } from "@/lib/invoice-pricing";
import { useAppStore } from "@/lib/store";
import type { CatalogItem, InvoiceLedger, PaymentMethod } from "@/lib/types";

export function SettingsPayments() {
  const { can } = useAuth();
  const canEdit = can("manage_invoice");
  const rows = useAppStore((s) => s.paymentMethods);
  const createPaymentMethod = useAppStore((s) => s.createPaymentMethod);
  const updatePaymentMethod = useAppStore((s) => s.updatePaymentMethod);
  const setPaymentMethodActive = useAppStore((s) => s.setPaymentMethodActive);
  const deletePaymentMethod = useAppStore((s) => s.deletePaymentMethod);
  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [active, setActive] = useState(true);
  const visible = useMemo(() => rows.filter((row) => showInactive || row.active), [rows, showInactive]);
  const editing = editingId ? rows.find((row) => row.id === editingId) : undefined;

  function startAdd() {
    setEditingId(null);
    setTitle("");
    setActive(true);
  }

  function startEdit(row: PaymentMethod) {
    setEditingId(row.id);
    setTitle(row.title);
    setActive(row.active);
  }

  function save() {
    if (!canEdit) return;
    const payload = { title: title.trim() || "Untitled payment", active };
    if (editing) updatePaymentMethod(editing.id, payload);
    else createPaymentMethod(payload);
    setEditingId(undefined);
  }

  if (editingId !== undefined) {
    return (
      <PricingForm
        title={editing ? `Edit Payment: ${editing.title}` : "Add Payment"}
        onCancel={() => setEditingId(undefined)}
        onSave={save}
        canEdit={canEdit}
      >
        <PricingField label="Title">
          <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={!canEdit} />
        </PricingField>
      </PricingForm>
    );
  }

  return (
    <PricingSheet>
      <PricingTitle>Payments</PricingTitle>
      <PricingToolbar>
        {canEdit ? <PricingOutlineBtn onClick={startAdd}>Add Payment</PricingOutlineBtn> : null}
        <PricingToggle label="Show Inactive" checked={showInactive} onChange={setShowInactive} />
      </PricingToolbar>
      <PricingTable columns={[{ key: "title", label: "Title" }]}>
        {visible.map((row) => (
          <tr key={row.id} className={clsx(!row.active && "is-inactive")}>
            <td>
              <PricingTitleLink onClick={() => startEdit(row)}>{row.title}</PricingTitleLink>
            </td>
            <td className="pricing-table-action">
              {canEdit ? (
                <PricingRemoveBtn
                  label={row.active ? `Hide ${row.title}` : `Remove ${row.title}`}
                  onClick={() => (row.active ? setPaymentMethodActive(row.id, false) : deletePaymentMethod(row.id))}
                />
              ) : null}
            </td>
          </tr>
        ))}
      </PricingTable>
      {!visible.length ? <PricingEmpty>No payment methods to show.</PricingEmpty> : null}
    </PricingSheet>
  );
}

export function SettingsInvoiceLedgers() {
  const { can } = useAuth();
  const canEdit = can("manage_invoice");
  const rows = useAppStore((s) => s.invoiceLedgers);
  const createInvoiceLedger = useAppStore((s) => s.createInvoiceLedger);
  const updateInvoiceLedger = useAppStore((s) => s.updateInvoiceLedger);
  const setInvoiceLedgerActive = useAppStore((s) => s.setInvoiceLedgerActive);
  const deleteInvoiceLedger = useAppStore((s) => s.deleteInvoiceLedger);
  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [active, setActive] = useState(true);
  const visible = useMemo(() => rows.filter((row) => showInactive || row.active), [rows, showInactive]);
  const editing = editingId ? rows.find((row) => row.id === editingId) : undefined;

  function startAdd() {
    setEditingId(null);
    setTitle("");
    setCode("");
    setActive(true);
  }

  function startEdit(row: InvoiceLedger) {
    setEditingId(row.id);
    setTitle(row.title);
    setCode(row.code);
    setActive(row.active);
  }

  function save() {
    if (!canEdit) return;
    const payload = { title: title.trim() || "Untitled ledger", code: code.trim(), active };
    if (editing) updateInvoiceLedger(editing.id, payload);
    else createInvoiceLedger(payload);
    setEditingId(undefined);
  }

  if (editingId !== undefined) {
    return (
      <PricingForm
        title={editing ? `Edit Invoice Ledger: ${editing.title}` : "Add Invoice Ledger"}
        onCancel={() => setEditingId(undefined)}
        onSave={save}
        canEdit={canEdit}
      >
        <PricingField label="Title">
          <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={!canEdit} />
        </PricingField>
        <PricingField label="Code">
          <input className="field-input" value={code} onChange={(e) => setCode(e.target.value)} disabled={!canEdit} />
        </PricingField>
      </PricingForm>
    );
  }

  return (
    <PricingSheet>
      <PricingTitle>Invoice Ledgers</PricingTitle>
      <PricingToolbar>
        {canEdit ? <PricingOutlineBtn onClick={startAdd}>Add Ledger</PricingOutlineBtn> : null}
        <PricingToggle label="Show Inactive" checked={showInactive} onChange={setShowInactive} />
      </PricingToolbar>
      <PricingTable
        columns={[
          { key: "title", label: "Title" },
          { key: "code", label: "Code", width: "140px" },
        ]}
      >
        {visible.map((row) => (
          <tr key={row.id} className={clsx(!row.active && "is-inactive")}>
            <td>
              <PricingTitleLink onClick={() => startEdit(row)}>{row.title}</PricingTitleLink>
            </td>
            <td className="pricing-num">{row.code}</td>
            <td className="pricing-table-action">
              {canEdit ? (
                <PricingRemoveBtn
                  label={row.active ? `Hide ${row.title}` : `Remove ${row.title}`}
                  onClick={() => (row.active ? setInvoiceLedgerActive(row.id, false) : deleteInvoiceLedger(row.id))}
                />
              ) : null}
            </td>
          </tr>
        ))}
      </PricingTable>
      {!visible.length ? <PricingEmpty>No ledgers to show.</PricingEmpty> : null}
    </PricingSheet>
  );
}

export function SettingsCatalogItems() {
  const { can } = useAuth();
  const canEdit = can("manage_invoice");
  const rows = useAppStore((s) => s.catalogItems);
  const createCatalogItem = useAppStore((s) => s.createCatalogItem);
  const updateCatalogItem = useAppStore((s) => s.updateCatalogItem);
  const setCatalogItemActive = useAppStore((s) => s.setCatalogItemActive);
  const deleteCatalogItem = useAppStore((s) => s.deleteCatalogItem);
  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<CatalogItem["kind"]>("Service");
  const [active, setActive] = useState(true);
  const visible = useMemo(() => rows.filter((row) => showInactive || row.active), [rows, showInactive]);
  const editing = editingId ? rows.find((row) => row.id === editingId) : undefined;

  function startAdd(next: CatalogItem["kind"]) {
    setEditingId(null);
    setTitle("");
    setCode("");
    setKind(next);
    setActive(true);
  }

  function startEdit(row: CatalogItem) {
    setEditingId(row.id);
    setTitle(row.title);
    setCode(row.code);
    setKind(row.kind);
    setActive(row.active);
  }

  function save() {
    if (!canEdit) return;
    const payload = { title: title.trim() || "Untitled item", code: code.trim(), kind, active };
    if (editing) updateCatalogItem(editing.id, payload);
    else createCatalogItem(payload);
    setEditingId(undefined);
  }

  if (editingId !== undefined) {
    return (
      <PricingForm
        title={editing ? `Edit Item: ${editing.title}` : "Add Material & Service Item"}
        onCancel={() => setEditingId(undefined)}
        onSave={save}
        canEdit={canEdit}
      >
        <PricingField label="Title">
          <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={!canEdit} />
        </PricingField>
        <PricingField label="Type">
          <select
            className="field-input"
            value={kind}
            onChange={(e) => setKind(e.target.value as CatalogItem["kind"])}
            disabled={!canEdit}
          >
            {CATALOG_ITEM_KINDS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </PricingField>
        <PricingField label="Code">
          <input className="field-input" value={code} onChange={(e) => setCode(e.target.value)} disabled={!canEdit} />
        </PricingField>
      </PricingForm>
    );
  }

  return (
    <PricingSheet>
      <PricingTitle>Material & Service Items</PricingTitle>
      <PricingToolbar>
        {canEdit ? (
          <PricingAddMenu
            label="Add Item"
            items={CATALOG_ITEM_KINDS.map((item) => ({
              id: item,
              label: item,
              onSelect: () => startAdd(item),
            }))}
          />
        ) : null}
        <PricingToggle label="Show Inactive" checked={showInactive} onChange={setShowInactive} />
      </PricingToolbar>
      <PricingTable
        columns={[
          { key: "title", label: "Title" },
          { key: "type", label: "Type", width: "140px" },
          { key: "code", label: "Code", width: "120px" },
        ]}
      >
        {visible.map((row) => (
          <tr key={row.id} className={clsx(!row.active && "is-inactive")}>
            <td>
              <PricingTitleLink onClick={() => startEdit(row)}>{row.title}</PricingTitleLink>
            </td>
            <td>{row.kind}</td>
            <td className="pricing-num">{row.code}</td>
            <td className="pricing-table-action">
              {canEdit ? (
                <PricingRemoveBtn
                  label={row.active ? `Hide ${row.title}` : `Remove ${row.title}`}
                  onClick={() => (row.active ? setCatalogItemActive(row.id, false) : deleteCatalogItem(row.id))}
                />
              ) : null}
            </td>
          </tr>
        ))}
      </PricingTable>
      {!visible.length ? <PricingEmpty>No catalog items to show.</PricingEmpty> : null}
    </PricingSheet>
  );
}
