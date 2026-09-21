"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Field, TextInput, TextSelect, TextTextarea } from "@/components/primitives";
import {
  computeLineAmount,
  dueFromTerms,
  emptyInvoiceLine,
  fillInvoiceTitle,
  invoiceFromDraft,
  invoiceTotals,
  linesFromTemplate,
  nextInvoiceNumber,
} from "@/lib/invoice";
import { exportInvoicePdf } from "@/lib/pdf";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import type { Invoice, InvoiceLineItem, InvoiceLineKind, InvoiceTemplate } from "@/lib/types";

const CURRENCIES = ["USD", "CAD", "EUR", "GBP"];
const TERMS = ["Due on receipt", "Net 15", "Net 30", "Net 45", "Net 60"];

type DraftLine = InvoiceLineItem;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function lineTotal(line: DraftLine) {
  const amount = computeLineAmount(line);
  return amount + amount * ((line.taxPct ?? 0) / 100);
}

export function InvoiceCreateForm({
  defaultCompanyId,
  defaultProjectId,
  onCancel,
  onCreated,
}: {
  defaultCompanyId?: string;
  defaultProjectId?: string;
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const companies = useAppStore((s) => s.companies);
  const contacts = useAppStore((s) => s.contacts);
  const projects = useAppStore((s) => s.projects);
  const retainers = useAppStore((s) => s.retainers);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const expenses = useAppStore((s) => s.expenses);
  const team = useAppStore((s) => s.team);
  const invoices = useAppStore((s) => s.invoices);
  const templates = useAppStore((s) => s.invoiceTemplates);
  const createInvoiceDraft = useAppStore((s) => s.createInvoiceDraft);
  const createInvoiceTemplate = useAppStore((s) => s.createInvoiceTemplate);
  const updateInvoiceTemplate = useAppStore((s) => s.updateInvoiceTemplate);
  const pushToast = useAppStore((s) => s.pushToast);

  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? "");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [retainerId, setRetainerId] = useState("");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState(team.find((m) => m.role === "finance" || m.role === "pm")?.name ?? team[0]?.name ?? "");
  const [billToContactId, setBillToContactId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [terms, setTerms] = useState("Net 30");
  const [raised, setRaised] = useState(todayIso());
  const [due, setDue] = useState(dueFromTerms(todayIso(), "Net 30"));
  const [billingThrough, setBillingThrough] = useState(todayIso());
  const [poNumber, setPoNumber] = useState("");
  const [number, setNumber] = useState(nextInvoiceNumber(invoices.length));
  const [description, setDescription] = useState("");
  const [internalDescription, setInternalDescription] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplSummary, setTplSummary] = useState("");
  const [tplTax, setTplTax] = useState("0");

  const company = companies.find((c) => c.id === companyId);
  const project = projects.find((p) => p.id === projectId);
  const companyContacts = useMemo(() => contacts.filter((c) => c.companyId === companyId), [contacts, companyId]);
  const companyProjects = useMemo(() => projects.filter((p) => p.companyId === companyId), [projects, companyId]);
  const companyRetainers = useMemo(() => retainers.filter((r) => r.companyId === companyId), [retainers, companyId]);
  const template = templates.find((t) => t.id === templateId);
  const totals = useMemo(() => invoiceTotals(lines), [lines]);

  function applyTemplate(next: InvoiceTemplate, nextCompany = company, nextProject = project) {
    const nextTerms = next.terms || nextCompany?.billingTerms || "Net 30";
    const nextRaised = raised || todayIso();
    setTemplateId(next.id);
    setTitle(fillInvoiceTitle(next.titlePattern, { company: nextCompany?.name ?? "Client", project: nextProject?.name }));
    setCurrency(next.currency);
    setTerms(nextTerms);
    setDue(dueFromTerms(nextRaised, nextTerms));
    setDescription(next.description);
    setInternalDescription(next.internalDescription);
    setLines(linesFromTemplate(next));
    setTplName(next.name);
    setTplSummary(next.summary);
    setTplTax(String(next.taxPct));
  }

  useEffect(() => {
    if (templates[0] && !lines.length) applyTemplate(templates[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!company) return;
    const primary = companyContacts.find((c) => c.id === company.primaryContactId) ?? companyContacts[0];
    setBillToContactId(primary?.id ?? "");
    const nextProject = companyProjects.some((p) => p.id === projectId) ? companyProjects.find((p) => p.id === projectId) : companyProjects[0];
    if (!projectId || !companyProjects.some((p) => p.id === projectId)) {
      setProjectId(nextProject?.id ?? "");
    }
    if (retainerId && !companyRetainers.some((r) => r.id === retainerId)) setRetainerId("");
    setTerms((current) => (current === "Net 30" || !current ? company.billingTerms : current));
    if (template) {
      setTitle(fillInvoiceTitle(template.titlePattern, { company: company.name, project: nextProject?.name }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  function patchLine(id: string, patch: Partial<DraftLine>) {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== id) return line;
        const next = { ...line, ...patch };
        next.amount = computeLineAmount(next);
        return next;
      }),
    );
  }

  function addLine(kind: InvoiceLineKind) {
    setLines((current) => [
      ...current,
      emptyInvoiceLine(kind, {
        description: kind === "service" ? "Professional services" : kind === "material" ? "Material" : "Expense",
        hours: kind === "service" ? 1 : undefined,
        rate: kind === "service" ? 180 : kind === "material" ? 0 : undefined,
        quantity: kind === "material" ? 1 : undefined,
        taxPct: Number(tplTax) || 0,
      }),
    ]);
  }

  function pullTime() {
    if (!project) {
      pushToast("Choose a project to pull time", "danger");
      return;
    }
    const approved = timeEntries.filter((e) => e.projectId === project.id && e.billable && e.status === "Approved");
    if (!approved.length) {
      pushToast("No approved billable time on this project", "info");
      return;
    }
    const rate = project.rates?.[0]?.hourlyRate ?? 180;
    const grouped = new Map<string, number>();
    approved.forEach((entry) => {
      const key = entry.taskName || entry.note || project.name;
      grouped.set(key, (grouped.get(key) ?? 0) + entry.hours);
    });
    setLines((current) => [
      ...current.filter((l) => l.kind !== "service"),
      ...[...grouped.entries()].map(([description, hours]) =>
        emptyInvoiceLine("service", { description, hours, rate, amount: hours * rate, taxPct: Number(tplTax) || 0 }),
      ),
    ]);
    pushToast("Pulled approved time onto service lines");
  }

  function pullMaterials() {
    if (!project?.materials.length) {
      pushToast("This project has no materials", "info");
      return;
    }
    setLines((current) => [
      ...current.filter((l) => l.kind !== "material"),
      ...project.materials.map((m) =>
        emptyInvoiceLine("material", {
          description: m.title,
          quantity: m.qty,
          rate: m.salePrice,
          amount: m.qty * m.salePrice,
          taxPct: Number(tplTax) || 0,
        }),
      ),
    ]);
    pushToast("Pulled project materials");
  }

  function pullExpenses() {
    const rows = expenses.filter((e) => e.status === "Approved" && (!project || e.projectId === project.id));
    if (!rows.length) {
      pushToast("No approved expenses to bill", "info");
      return;
    }
    setLines((current) => [
      ...current.filter((l) => l.kind !== "expense"),
      ...rows.map((e) =>
        emptyInvoiceLine("expense", {
          description: `${e.vendor}: ${e.note || e.projectName}`,
          amount: e.amount,
          taxPct: Number(tplTax) || 0,
        }),
      ),
    ]);
    pushToast("Pulled approved expenses");
  }

  function buildInvoice(): Invoice | null {
    if (!company) return null;
    const contact = companyContacts.find((c) => c.id === billToContactId);
    const prepared = lines
      .filter((line) => line.description.trim())
      .map((line) => ({ ...line, amount: computeLineAmount(line) }));
    if (!prepared.length) return null;
    return invoiceFromDraft({
      id: "preview",
      number: number.trim() || nextInvoiceNumber(invoices.length),
      companyId: company.id,
      companyName: company.name,
      amount: 0,
      terms,
      due,
      status: "Draft",
      lineItems: prepared,
      projectId: project?.id,
      retainerId: retainerId || undefined,
      title: title.trim() || `Invoice for ${company.name}`,
      owner,
      billToContactId: contact?.id,
      billToName: contact?.name,
      currency,
      raised,
      billingThrough,
      poNumber: poNumber.trim() || undefined,
      description: description.trim() || undefined,
      internalDescription: internalDescription.trim() || undefined,
      templateId: templateId || undefined,
    });
  }

  function submit(send: boolean) {
    const draft = buildInvoice();
    if (!company || !draft) {
      pushToast("Add a company and at least one line item", "danger");
      return;
    }
    const id = createInvoiceDraft(company.id, {
      ...draft,
      send,
    });
    if (id) onCreated(id);
  }

  function saveTemplate(asNew: boolean) {
    const payload = {
      name: tplName.trim() || "Custom invoice",
      summary: tplSummary.trim() || "Saved from the create invoice form.",
      kind: template?.kind ?? ("progress" as const),
      titlePattern: title.trim() || "Invoice for {company}",
      terms,
      currency,
      taxPct: Number(tplTax) || 0,
      description,
      internalDescription,
      invoiceFor: template?.invoiceFor ?? "Work completed",
      defaultLines: lines.map(({ id: _id, ...line }) => line),
    };
    if (!asNew && template) {
      updateInvoiceTemplate(template.id, payload);
    } else {
      const id = createInvoiceTemplate(payload);
      setTemplateId(id);
    }
    setEditingTemplate(false);
  }

  const serviceLines = lines.filter((l) => l.kind === "service");
  const materialLines = lines.filter((l) => l.kind === "material");
  const expenseLines = lines.filter((l) => l.kind === "expense");

  return (
    <form
      className="invoice-create"
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
    >
      <div className="invoice-create-layout">
        <div className="invoice-create-main">
          <div className="invoice-create-grid">
            <Field label="Company" required>
              <TextSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label="Project">
              <TextSelect value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">No project</option>
                {companyProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label="Retainer">
              <TextSelect value={retainerId} onChange={(e) => setRetainerId(e.target.value)}>
                <option value="">None</option>
                {companyRetainers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label="Template">
              <TextSelect
                value={templateId}
                onChange={(e) => {
                  const next = templates.find((t) => t.id === e.target.value);
                  if (next) applyTemplate(next);
                }}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label="Raised">
              <TextInput
                type="date"
                value={raised}
                onChange={(e) => {
                  setRaised(e.target.value);
                  setDue(dueFromTerms(e.target.value, terms));
                }}
              />
            </Field>
            <Field label="Due">
              <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
            <Field label="Invoice title" required>
              <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="What the client will see" />
            </Field>
            <Field label="Owner">
              <TextSelect value={owner} onChange={(e) => setOwner(e.target.value)}>
                {team.filter((m) => m.active).map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label="Bill to">
              <TextSelect value={billToContactId} onChange={(e) => setBillToContactId(e.target.value)}>
                <option value="">{company?.name ?? "Company"}</option>
                {companyContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.title ? ` (${c.title})` : ""}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label="Currency">
              <TextSelect value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label="Terms">
              <TextSelect
                value={terms}
                onChange={(e) => {
                  setTerms(e.target.value);
                  setDue(dueFromTerms(raised, e.target.value));
                }}
              >
                {!TERMS.includes(terms) ? <option value={terms}>{terms}</option> : null}
                {TERMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label="Billing through">
              <TextInput type="date" value={billingThrough} onChange={(e) => setBillingThrough(e.target.value)} />
            </Field>
            <Field label="PO number">
              <TextInput value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Client purchase order" />
            </Field>
            <Field label="Invoice number" required>
              <TextInput value={number} onChange={(e) => setNumber(e.target.value)} required />
            </Field>
          </div>
          <div className="invoice-create-grid invoice-create-grid-2">
            <Field label="Invoice description">
              <TextTextarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Shown on the client PDF" />
            </Field>
            <Field label="Internal notes">
              <TextTextarea value={internalDescription} onChange={(e) => setInternalDescription(e.target.value)} placeholder="Finance only, not on the PDF" />
            </Field>
          </div>

          <LineSection
            title="Service"
            hint="Hours and rate, a progress amount, or a milestone fee."
            actionLabel="Pull approved time"
            onAction={pullTime}
            onAdd={() => addLine("service")}
            addLabel="Add service line"
          >
            {serviceLines.map((line) => (
              <LineRow key={line.id} line={line} onChange={patchLine} onRemove={(id) => setLines((c) => c.filter((l) => l.id !== id))} />
            ))}
          </LineSection>
          <LineSection
            title="Materials"
            hint="Billable kits, hardware, or pass-through items."
            actionLabel="Pull project materials"
            onAction={pullMaterials}
            onAdd={() => addLine("material")}
            addLabel="Add material line"
          >
            {materialLines.map((line) => (
              <LineRow key={line.id} line={line} onChange={patchLine} onRemove={(id) => setLines((c) => c.filter((l) => l.id !== id))} />
            ))}
          </LineSection>
          <LineSection
            title="Expenses"
            hint="Approved travel or vendor spend to recover."
            actionLabel="Pull approved expenses"
            onAction={pullExpenses}
            onAdd={() => addLine("expense")}
            addLabel="Add expense line"
          >
            {expenseLines.map((line) => (
              <LineRow key={line.id} line={line} onChange={patchLine} onRemove={(id) => setLines((c) => c.filter((l) => l.id !== id))} />
            ))}
          </LineSection>
        </div>

        <aside className="invoice-create-rail">
          <div className="invoice-create-totals">
            <h3>Totals</h3>
            <dl>
              <div>
                <dt>Service</dt>
                <dd>{money(totals.service)}</dd>
              </div>
              <div>
                <dt>Materials</dt>
                <dd>{money(totals.material)}</dd>
              </div>
              <div>
                <dt>Expenses</dt>
                <dd>{money(totals.expense)}</dd>
              </div>
              <div>
                <dt>Tax</dt>
                <dd>{money(totals.tax)}</dd>
              </div>
              <div className="is-total">
                <dt>Total</dt>
                <dd>{money(totals.total)}</dd>
              </div>
            </dl>
          </div>
          <div className="invoice-create-template">
            <h3>Template</h3>
            <p>{template?.summary ?? "Choose a starting point, then edit the lines."}</p>
            <div className="invoice-create-template-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditingTemplate((v) => !v)}>
                {editingTemplate ? "Close editor" : "Edit template"}
              </button>
            </div>
            {editingTemplate ? (
              <div className="invoice-create-template-edit">
                <Field label="Template name">
                  <TextInput value={tplName} onChange={(e) => setTplName(e.target.value)} />
                </Field>
                <Field label="Summary">
                  <TextTextarea value={tplSummary} onChange={(e) => setTplSummary(e.target.value)} />
                </Field>
                <Field label="Default tax %">
                  <TextInput type="number" min={0} step="0.1" value={tplTax} onChange={(e) => setTplTax(e.target.value)} />
                </Field>
                <div className="invoice-create-template-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => saveTemplate(true)}>
                    Save as new
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => saveTemplate(false)} disabled={!template}>
                    Save changes
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="invoice-create-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            const draft = buildInvoice();
            if (!draft) {
              pushToast("Add a company and at least one line item", "danger");
              return;
            }
            exportInvoicePdf(draft);
          }}
        >
          <FileText size={16} /> Preview PDF
        </button>
        <div className="invoice-create-actions-end">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-ghost">
            Save as draft
          </button>
          <button type="button" className="btn btn-primary" onClick={() => submit(true)}>
            Save and send
          </button>
        </div>
      </div>
    </form>
  );
}

function LineSection({
  title,
  hint,
  children,
  onAdd,
  addLabel,
  onAction,
  actionLabel,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
  onAdd: () => void;
  addLabel: string;
  onAction: () => void;
  actionLabel: string;
}) {
  return (
    <section className="invoice-lines">
      <header>
        <div>
          <h3>{title}</h3>
          <p>{hint}</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onAction}>
          {actionLabel}
        </button>
      </header>
      <div className="invoice-lines-body">{children}</div>
      <button type="button" className="invoice-lines-add" onClick={onAdd}>
        <Plus size={14} /> {addLabel}
      </button>
    </section>
  );
}

function LineRow({
  line,
  onChange,
  onRemove,
}: {
  line: DraftLine;
  onChange: (id: string, patch: Partial<DraftLine>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="invoice-line">
      <TextInput
        aria-label="Description"
        value={line.description}
        onChange={(e) => onChange(line.id, { description: e.target.value })}
        placeholder="Description"
      />
      {line.kind === "service" ? (
        <>
          <TextInput
            aria-label="Hours"
            type="number"
            min={0}
            step="0.25"
            value={line.hours ?? ""}
            onChange={(e) => onChange(line.id, { hours: e.target.value === "" ? undefined : Number(e.target.value) })}
            placeholder="Hours"
          />
          <TextInput
            aria-label="Rate"
            type="number"
            min={0}
            step="1"
            value={line.rate ?? ""}
            onChange={(e) => onChange(line.id, { rate: e.target.value === "" ? undefined : Number(e.target.value) })}
            placeholder="Rate"
          />
        </>
      ) : line.kind === "material" ? (
        <>
          <TextInput
            aria-label="Quantity"
            type="number"
            min={0}
            step="1"
            value={line.quantity ?? ""}
            onChange={(e) => onChange(line.id, { quantity: e.target.value === "" ? undefined : Number(e.target.value) })}
            placeholder="Qty"
          />
          <TextInput
            aria-label="Unit price"
            type="number"
            min={0}
            step="1"
            value={line.rate ?? ""}
            onChange={(e) => onChange(line.id, { rate: e.target.value === "" ? undefined : Number(e.target.value) })}
            placeholder="Unit"
          />
        </>
      ) : (
        <TextInput
          aria-label="Amount"
          type="number"
          min={0}
          step="1"
          value={line.amount || ""}
          onChange={(e) => onChange(line.id, { amount: Number(e.target.value) || 0 })}
          placeholder="Amount"
        />
      )}
      {line.kind !== "expense" ? (
        <div className="invoice-line-amt">{money(computeLineAmount(line))}</div>
      ) : (
        <div className="invoice-line-amt">{money(lineTotal(line))}</div>
      )}
      <TextInput
        aria-label="Tax percent"
        type="number"
        min={0}
        step="0.1"
        value={line.taxPct ?? 0}
        onChange={(e) => onChange(line.id, { taxPct: Number(e.target.value) || 0 })}
        placeholder="Tax %"
      />
      <label className="invoice-line-pdf">
        <input
          type="checkbox"
          checked={line.includeInPdf !== false}
          onChange={(e) => onChange(line.id, { includeInPdf: e.target.checked })}
        />
        PDF
      </label>
      <button type="button" className="icon-btn" aria-label="Remove line" onClick={() => onRemove(line.id)}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}
