"use client";

import { useMemo, useState } from "react";
import { IfCan } from "@/components/auth/IfCan";
import { Field, TextInput, TextSelect, TextTextarea } from "@/components/primitives";
import { useAuth } from "@/lib/auth";
import { blankTemplateLine } from "@/lib/invoice";
import { useAppStore } from "@/lib/store";
import type { InvoiceTemplate, InvoiceTemplateKind } from "@/lib/types";

const KINDS: { id: InvoiceTemplateKind; label: string }[] = [
  { id: "time_materials", label: "Time and materials" },
  { id: "progress", label: "Progress billing" },
  { id: "retainer", label: "Retainer period" },
  { id: "fixed_fee", label: "Fixed fee milestone" },
  { id: "expense", label: "Expense recovery" },
];

const TERMS = ["Due on receipt", "Net 15", "Net 30", "Net 45", "Net 60"];
const CURRENCIES = ["USD", "CAD", "EUR", "GBP"];
const INVOICE_FOR: InvoiceTemplate["invoiceFor"][] = ["Work completed", "Retainer period", "Milestone", "Expenses"];

const EMPTY: Omit<InvoiceTemplate, "id"> = {
  name: "New template",
  summary: "",
  kind: "progress",
  titlePattern: "Invoice for {company}",
  terms: "Net 30",
  currency: "USD",
  taxPct: 0,
  description: "",
  internalDescription: "",
  invoiceFor: "Work completed",
  defaultLines: [],
};

function kindLabel(kind: InvoiceTemplateKind) {
  return KINDS.find((item) => item.id === kind)?.label ?? kind;
}

export function SettingsBilling() {
  const { can } = useAuth();
  const canEdit = can("manage_invoice");
  const templates = useAppStore((s) => s.invoiceTemplates);
  const createInvoiceTemplate = useAppStore((s) => s.createInvoiceTemplate);
  const updateInvoiceTemplate = useAppStore((s) => s.updateInvoiceTemplate);
  const deleteInvoiceTemplate = useAppStore((s) => s.deleteInvoiceTemplate);
  const [activeId, setActiveId] = useState(templates[0]?.id ?? "");
  const [draft, setDraft] = useState<Omit<InvoiceTemplate, "id"> | null>(templates[0] ? withoutId(templates[0]) : { ...EMPTY });

  const active = useMemo(() => templates.find((row) => row.id === activeId), [activeId, templates]);

  function withoutId(template: InvoiceTemplate): Omit<InvoiceTemplate, "id"> {
    const { id: _id, ...rest } = template;
    return {
      ...rest,
      summary: rest.summary ?? "",
      description: rest.description ?? "",
      internalDescription: rest.internalDescription ?? "",
      defaultLines: (rest.defaultLines ?? []).map((line) => blankTemplateLine(line)),
    };
  }

  function select(id: string) {
    const template = templates.find((row) => row.id === id);
    setActiveId(id);
    setDraft(template ? withoutId(template) : { ...EMPTY });
  }

  function patch(next: Partial<Omit<InvoiceTemplate, "id">>) {
    setDraft((current) => ({ ...(current ?? EMPTY), ...next }));
  }

  function save() {
    if (!draft || !canEdit) return;
    const payload = {
      ...draft,
      name: draft.name.trim() || "Untitled template",
      summary: "",
      description: draft.description.trim(),
      internalDescription: draft.internalDescription.trim(),
      defaultLines: (draft.defaultLines ?? []).map((line) => blankTemplateLine(line)),
    };
    if (active) updateInvoiceTemplate(active.id, payload);
    else {
      const id = createInvoiceTemplate(payload);
      setActiveId(id);
    }
    setDraft(payload);
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Billing</h1>
          <p className="page-sub">
            Invoice templates live here. They hold names, terms, and title patterns only. Amounts stay off the template
            and are entered on each invoice.
          </p>
        </div>
        <IfCan cap="manage_invoice">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setActiveId("");
              setDraft({ ...EMPTY });
            }}
          >
            New template
          </button>
        </IfCan>
      </header>

      <div className="settings-billing">
        <div className="panel settings-template-list">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className={`settings-template-card ${template.id === activeId ? "is-active" : ""}`}
              onClick={() => select(template.id)}
            >
              <strong>{template.name}</strong>
              <span>{kindLabel(template.kind)}</span>
            </button>
          ))}
          {!templates.length ? <p className="text-sm text-[var(--color-muted)]">No templates yet.</p> : null}
        </div>

        <form
          className="panel p-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {draft ? (
            <>
              <div className="invoice-create-grid">
                <Field label="Template name" required>
                  <TextInput
                    value={draft.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    required
                    disabled={!canEdit}
                  />
                </Field>
                <Field label="Kind">
                  <TextSelect
                    value={draft.kind}
                    onChange={(e) => patch({ kind: e.target.value as InvoiceTemplateKind })}
                    disabled={!canEdit}
                  >
                    {KINDS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </TextSelect>
                </Field>
                <Field label="Title pattern">
                  <TextInput
                    value={draft.titlePattern}
                    onChange={(e) => patch({ titlePattern: e.target.value })}
                    placeholder="Invoice for {company}"
                    disabled={!canEdit}
                  />
                </Field>
                <Field label="Invoice for">
                  <TextSelect
                    value={draft.invoiceFor}
                    onChange={(e) => patch({ invoiceFor: e.target.value as InvoiceTemplate["invoiceFor"] })}
                    disabled={!canEdit}
                  >
                    {INVOICE_FOR.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </TextSelect>
                </Field>
                <Field label="Terms">
                  <TextSelect value={draft.terms} onChange={(e) => patch({ terms: e.target.value })} disabled={!canEdit}>
                    {!TERMS.includes(draft.terms) ? <option value={draft.terms}>{draft.terms}</option> : null}
                    {TERMS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </TextSelect>
                </Field>
                <Field label="Currency">
                  <TextSelect value={draft.currency} onChange={(e) => patch({ currency: e.target.value })} disabled={!canEdit}>
                    {CURRENCIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </TextSelect>
                </Field>
                <Field label="Default tax %">
                  <TextInput
                    type="number"
                    min={0}
                    step="0.1"
                    value={draft.taxPct}
                    onChange={(e) => patch({ taxPct: Number(e.target.value) || 0 })}
                    disabled={!canEdit}
                  />
                </Field>
              </div>
              <div className="mt-4 grid gap-3">
                <Field label="Invoice description">
                  <TextTextarea
                    value={draft.description}
                    onChange={(e) => patch({ description: e.target.value })}
                    rows={3}
                    disabled={!canEdit}
                  />
                </Field>
                <Field label="Internal notes">
                  <TextTextarea
                    value={draft.internalDescription}
                    onChange={(e) => patch({ internalDescription: e.target.value })}
                    rows={3}
                    disabled={!canEdit}
                  />
                </Field>
              </div>
              {canEdit ? (
                <div className="invoice-create-template-actions mt-4">
                  {active ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        deleteInvoiceTemplate(active.id);
                        const next = templates.find((row) => row.id !== active.id);
                        if (next) select(next.id);
                        else {
                          setActiveId("");
                          setDraft({ ...EMPTY });
                        }
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                  <button type="submit" className="btn btn-primary">
                    {active ? "Save template" : "Create template"}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">Select a template.</p>
          )}
        </form>
      </div>
    </>
  );
}
