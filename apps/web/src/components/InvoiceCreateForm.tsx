"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText, Plus, Trash2 } from "lucide-react";
import { ExpenseCreateForm } from "@/components/billing/ExpenseCreateForm";
import { MaterialCreateForm } from "@/components/billing/MaterialCreateForm";
import { PurchaseCreateForm } from "@/components/billing/PurchaseCreateForm";
import { Field, TextInput, TextSelect, TextTextarea } from "@/components/primitives";
import {
  billedSourceIds,
  computeLineAmount,
  dueFromTerms,
  emptyInvoiceLine,
  fillInvoiceTitle,
  INVOICE_CURRENCIES,
  INVOICE_DETAIL_OPTIONS,
  INVOICE_FOR_OPTIONS,
  INVOICE_ITEMIZE_OPTIONS,
  invoiceForFromTemplate,
  invoiceFromDraft,
  invoiceTotals,
  linesFromTemplate,
  nextInvoiceNumber,
  phaseChildIds,
  templateInvoiceFor,
  timeMatchesWork,
  type InvoiceDetailOption,
  type InvoiceForOption,
} from "@/lib/invoice";
import { exportInvoicePdf } from "@/lib/pdf";
import { memberRate } from "@/lib/project-workspace";
import { money, moneyExact } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import type { Invoice, InvoiceLineItem, InvoiceLineKind, InvoiceTemplate } from "@/lib/types";

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
  const milestones = useAppStore((s) => s.milestones);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const expenses = useAppStore((s) => s.expenses);
  const purchases = useAppStore((s) => s.purchases);
  const billMaterials = useAppStore((s) => s.billMaterials);
  const createExpense = useAppStore((s) => s.createExpense);
  const createPurchase = useAppStore((s) => s.createPurchase);
  const createBillMaterial = useAppStore((s) => s.createBillMaterial);
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
  const [templateId, setTemplateId] = useState("");
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
  const [tplTax, setTplTax] = useState("0");
  const [pickedExpenses, setPickedExpenses] = useState<string[]>([]);
  const [pickedPurchases, setPickedPurchases] = useState<string[]>([]);
  const [pickedMaterials, setPickedMaterials] = useState<string[]>([]);
  const [addKind, setAddKind] = useState<"expense" | "purchase" | "material" | null>(null);
  const [showCustom, setShowCustom] = useState(true);
  const [invoiceFor, setInvoiceFor] = useState<InvoiceForOption>("Work done");
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetailOption>("Project");
  const [workStatus, setWorkStatus] = useState<"All" | "Approved">("All");
  const [loggedBefore, setLoggedBefore] = useState(todayIso());
  const [includePdfWork, setIncludePdfWork] = useState(true);
  const [groupByStaff, setGroupByStaff] = useState(false);
  const [includeNonBillable, setIncludeNonBillable] = useState(false);
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);
  const [milestonePct, setMilestonePct] = useState("100");
  const [expenseStatus, setExpenseStatus] = useState("All expenses");

  const company = companies.find((c) => c.id === companyId);
  const project = projects.find((p) => p.id === projectId);
  const companyContacts = useMemo(() => contacts.filter((c) => c.companyId === companyId), [contacts, companyId]);
  const companyProjects = useMemo(() => projects.filter((p) => p.companyId === companyId), [projects, companyId]);
  const companyRetainers = useMemo(() => retainers.filter((r) => r.companyId === companyId), [retainers, companyId]);
  const template = templates.find((t) => t.id === templateId);
  const totals = useMemo(() => invoiceTotals(lines), [lines]);
  const projectPhases = useMemo(
    () => milestones.filter((row) => row.projectId === projectId && (row.kind === "phase" || !row.parentId)),
    [milestones, projectId],
  );
  const billed = useMemo(() => billedSourceIds(invoices, projectId), [invoices, projectId]);
  const heading = project?.name || company?.name || "Invoice";

  const invoicedOnProject = useMemo(
    () => invoices.filter((invoice) => invoice.projectId === projectId && invoice.status !== "Draft").reduce((sum, invoice) => sum + invoice.amount, 0),
    [invoices, projectId],
  );
  const remainingBudget = Math.max(0, (project?.budgetAmount ?? 0) - invoicedOnProject);

  function applyTemplate(next: InvoiceTemplate, nextCompany = company, nextProject = project) {
    const nextTerms = next.terms || nextCompany?.billingTerms || "Net 30";
    const nextRaised = raised || todayIso();
    const nextFor = invoiceForFromTemplate(next);
    setTemplateId(next.id);
    setTitle(fillInvoiceTitle(next.titlePattern, { company: nextCompany?.name ?? "Client", project: nextProject?.name }));
    setCurrency(next.currency);
    setTerms(nextTerms);
    setDue(dueFromTerms(nextRaised, nextTerms));
    setDescription(next.description);
    setInternalDescription(next.internalDescription);
    setLines(linesFromTemplate(next));
    setTplName(next.name);
    setTplTax(String(next.taxPct));
    setInvoiceFor(nextFor);
    setInvoiceDetail(nextFor === "Milestone" ? "Milestone" : "Project");
  }

  useEffect(() => {
    if (!company) return;
    const primary = companyContacts.find((c) => c.id === company.primaryContactId) ?? companyContacts[0];
    setBillToContactId(primary?.id ?? "");
    const nextProject = companyProjects.some((p) => p.id === projectId)
      ? companyProjects.find((p) => p.id === projectId)
      : companyProjects[0];
    if (!projectId || !companyProjects.some((p) => p.id === projectId)) {
      setProjectId(nextProject?.id ?? "");
    }
    if (retainerId && !companyRetainers.some((r) => r.id === retainerId)) setRetainerId("");
    setTerms((current) => (current === "Net 30" || !current ? company.billingTerms : current));
    if (template) {
      setTitle(fillInvoiceTitle(template.titlePattern, { company: company.name, project: nextProject?.name }));
    } else if (!title) {
      setTitle(`Invoice for ${nextProject?.name || company.name}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  useEffect(() => {
    setSelectedMilestones([]);
  }, [projectId]);

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
        description:
          kind === "service"
            ? project?.name || "Professional services"
            : kind === "material"
              ? "Material"
              : kind === "purchase"
                ? "Purchase"
                : "Expense",
        hours: undefined,
        rate: undefined,
        quantity: undefined,
        taxPct: Number(tplTax) || 0,
        includeInPdf: includePdfWork,
      }),
    ]);
  }

  function matchingEntries(childIds?: Set<string>) {
    if (!project) return [];
    return timeEntries.filter((entry) =>
      timeMatchesWork({
        entry,
        projectId: project.id,
        childIds,
        workStatus,
        loggedBefore,
        includeNonBillable,
      }),
    );
  }

  function serviceFromEntries(description: string, entries: typeof timeEntries, extras?: Partial<DraftLine>) {
    const taxPct = Number(tplTax) || 0;
    if (groupByStaff) {
      const grouped = new Map<string, typeof entries>();
      entries.forEach((entry) => {
        const list = grouped.get(entry.userName) ?? [];
        list.push(entry);
        grouped.set(entry.userName, list);
      });
      return [...grouped.entries()].map(([name, rows]) => {
        const hours = rows.reduce((sum, row) => sum + row.hours, 0);
        const amount = rows.reduce((sum, row) => sum + row.hours * memberRate(row.userName, project!, team), 0);
        return emptyInvoiceLine("service", {
          description: `${description} · ${name}`,
          hours,
          rate: hours ? amount / hours : memberRate(name, project!, team),
          amount,
          taxPct,
          includeInPdf: includePdfWork,
          itemize: "Staff",
          ...extras,
        });
      });
    }
    const hours = entries.reduce((sum, row) => sum + row.hours, 0);
    const amount = entries.reduce((sum, row) => sum + row.hours * memberRate(row.userName, project!, team), 0);
    const rate = hours ? amount / hours : project?.rates?.[0]?.hourlyRate ?? 180;
    return [
      emptyInvoiceLine("service", {
        description,
        hours: hours || undefined,
        rate: hours ? rate : undefined,
        amount,
        taxPct,
        includeInPdf: includePdfWork,
        itemize: "None",
        ...extras,
      }),
    ];
  }

  function applyWork() {
    if (!project) {
      pushToast("Choose a project to load work", "danger");
      return;
    }
    if (invoiceFor === "Expenses") {
      setLines((current) => current.filter((line) => line.kind !== "service"));
      return;
    }
    const pct = Math.max(0, Math.min(100, Number(milestonePct) || 100)) / 100;
    if (invoiceDetail === "Milestone" || invoiceFor === "Milestone") {
      const selected = projectPhases.filter((phase) => selectedMilestones.includes(phase.id));
      if (!selected.length) {
        pushToast("Select one or more milestones to bill in parts", "info");
        return;
      }
      const next = selected.flatMap((phase) => {
        const childIds = phaseChildIds(milestones, phase.id);
        const entries = matchingEntries(childIds);
        const hours = entries.reduce((sum, row) => sum + row.hours, 0);
        const labor = entries.reduce((sum, row) => sum + row.hours * memberRate(row.userName, project, team), 0);
        const award = (phase.awardAmount ?? 0) * pct;
        const amount = award > 0 ? award : labor;
        const label = pct < 1 ? `${phase.name} (${Math.round(pct * 100)}%)` : phase.name;
        if (invoiceFor === "Milestone" && award > 0) {
          return [
            emptyInvoiceLine("service", {
              description: label,
              amount,
              taxPct: Number(tplTax) || 0,
              includeInPdf: includePdfWork,
              sourceId: phase.id,
              milestoneId: phase.id,
              itemize: "None",
            }),
          ];
        }
        return serviceFromEntries(label, entries, { sourceId: phase.id, milestoneId: phase.id });
      });
      setLines((current) => [...current.filter((line) => line.kind !== "service"), ...next]);
      pushToast(selected.length === 1 ? "Loaded the selected milestone" : `Loaded ${selected.length} milestones`);
      return;
    }
    const entries = matchingEntries();
    const next = serviceFromEntries(project.name, entries);
    setLines((current) => [...current.filter((line) => line.kind !== "service"), ...next]);
    pushToast(entries.length ? "Loaded project work" : "No matching time yet. Add a service line or pick a milestone.");
  }

  const visibleExpenses = expenses.filter((row) => {
    const matchCompany = !companyId || row.companyId === companyId || !row.companyId;
    const matchProject = !projectId || !row.projectId || row.projectId === projectId;
    const matchStatus =
      expenseStatus === "All expenses" ||
      (expenseStatus === "Approved" && row.status === "Approved") ||
      (expenseStatus === "Pending" && row.status === "Pending");
    return matchCompany && matchProject && matchStatus && row.status !== "Rejected";
  });
  const visiblePurchases = purchases.filter(
    (row) => (!companyId || row.companyId === companyId || !row.companyId) && (!projectId || !row.projectId || row.projectId === projectId),
  );
  const visibleMaterials = [
    ...billMaterials.filter(
      (row) => (!companyId || row.companyId === companyId || !row.companyId) && (!projectId || !row.projectId || row.projectId === projectId),
    ),
    ...(project?.materials ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      qty: row.qty,
      salePrice: row.salePrice,
    })),
  ];

  function toggleId(list: string[], id: string) {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  function addSelectedExpenses() {
    const rows = visibleExpenses.filter((row) => pickedExpenses.includes(row.id));
    if (!rows.length) {
      pushToast("Select at least one expense", "info");
      return;
    }
    setLines((current) => [
      ...current,
      ...rows
        .filter((row) => !current.some((line) => line.sourceId === row.id))
        .map((row) =>
          emptyInvoiceLine("expense", {
            description: `${row.title || row.vendor}: ${row.note || row.belongLabel || row.projectName}`,
            amount: row.amount,
            taxPct: Number(tplTax) || 0,
            sourceId: row.id,
          }),
        ),
    ]);
    pushToast("Added selected expenses");
  }

  function addSelectedPurchases() {
    const rows = visiblePurchases.filter((row) => pickedPurchases.includes(row.id));
    if (!rows.length) {
      pushToast("Select at least one purchase", "info");
      return;
    }
    setLines((current) => [
      ...current,
      ...rows
        .filter((row) => !current.some((line) => line.sourceId === row.id))
        .map((row) =>
          emptyInvoiceLine("purchase", {
            description: `${row.title} (${row.vendor})`,
            amount: row.amount,
            taxPct: Number(tplTax) || 0,
            sourceId: row.id,
          }),
        ),
    ]);
    pushToast("Added selected purchases");
  }

  function addSelectedMaterials() {
    const rows = visibleMaterials.filter((row) => pickedMaterials.includes(row.id));
    if (!rows.length) {
      pushToast("Select at least one material", "info");
      return;
    }
    setLines((current) => [
      ...current,
      ...rows
        .filter((row) => !current.some((line) => line.sourceId === row.id))
        .map((row) =>
          emptyInvoiceLine("material", {
            description: row.title,
            quantity: row.qty,
            rate: row.salePrice,
            amount: row.qty * row.salePrice,
            taxPct: Number(tplTax) || 0,
            sourceId: row.id,
          }),
        ),
    ]);
    pushToast("Added selected materials");
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
      milestoneId: selectedMilestones[0],
      invoiceFor: templateInvoiceFor(invoiceFor),
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
      summary: "",
      kind: template?.kind ?? ("progress" as const),
      titlePattern: title.trim() || "Invoice for {company}",
      terms,
      currency,
      taxPct: Number(tplTax) || 0,
      description: asNew ? "" : (template?.description ?? ""),
      internalDescription: asNew ? "" : (template?.internalDescription ?? ""),
      invoiceFor: templateInvoiceFor(invoiceFor),
      defaultLines: [],
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
  const purchaseLines = lines.filter((l) => l.kind === "purchase");

  return (
    <form
      className="invoice-create"
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
    >
      <div className="invoice-create-hero">
        <div>
          <p className="invoice-create-crumb">
            {company?.name ? `Company: ${company.name}` : "Company"}
            {project ? ` · Project: ${project.name}` : ""}
            {" · Create Invoice"}
          </p>
          <h2 className="invoice-create-title">Create Invoice: {heading}</h2>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <div className="invoice-create-layout">
        <div className="invoice-create-main">
          <section className="invoice-create-card">
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
              <Field label="Invoice Template">
                <TextSelect
                  value={templateId}
                  onChange={(e) => {
                    const next = templates.find((t) => t.id === e.target.value);
                    if (next) applyTemplate(next);
                    else setTemplateId("");
                  }}
                >
                  <option value="">Select from existing templates</option>
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
              <Field label="Invoice Title" required>
                <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Invoice for the client" />
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
              <Field label="Bill To">
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
              <Field label="Invoice Currency">
                <TextSelect value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {INVOICE_CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
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
            </div>
            <button type="button" className="invoice-create-toggle" onClick={() => setShowCustom((v) => !v)}>
              {showCustom ? "Hide 3 custom fields" : "Show 3 custom fields"}
            </button>
            {showCustom ? (
              <div className="invoice-create-grid">
                <Field label="Billing Through" required>
                  <TextInput type="date" value={billingThrough} onChange={(e) => setBillingThrough(e.target.value)} />
                </Field>
                <Field label="PO #">
                  <TextInput value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Client purchase order" />
                </Field>
                <Field label="Invoice Number" required>
                  <TextInput value={number} onChange={(e) => setNumber(e.target.value)} required />
                </Field>
              </div>
            ) : null}
            <div className="invoice-create-grid invoice-create-grid-2">
              <Field label="Invoice Description">
                <TextTextarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Shown on the client PDF" />
              </Field>
              <Field label="Internal Description">
                <TextTextarea value={internalDescription} onChange={(e) => setInternalDescription(e.target.value)} placeholder="Finance only, not on the PDF" />
              </Field>
            </div>
          </section>

          <section className="invoice-block">
            <header className="invoice-block-head">
              <h3>Service</h3>
              <div className="invoice-block-stats">
                <span>Budget {money(project?.budgetAmount ?? 0)}</span>
                <span>Invoiced {money(invoicedOnProject)}</span>
                <span>Remaining {money(remainingBudget)}</span>
              </div>
            </header>
            <div className="invoice-filters">
              <label>
                Invoice For
                <TextSelect
                  value={invoiceFor}
                  onChange={(e) => {
                    const next = e.target.value as InvoiceForOption;
                    setInvoiceFor(next);
                    if (next === "Milestone") setInvoiceDetail("Milestone");
                    if (next === "Work done") setInvoiceDetail("Project");
                  }}
                >
                  {INVOICE_FOR_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </TextSelect>
              </label>
              <label>
                Invoice Detail
                <TextSelect value={invoiceDetail} onChange={(e) => setInvoiceDetail(e.target.value as InvoiceDetailOption)}>
                  {INVOICE_DETAIL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </TextSelect>
              </label>
              <label>
                Work Status
                <TextSelect value={workStatus} onChange={(e) => setWorkStatus(e.target.value as "All" | "Approved")}>
                  <option value="All">All</option>
                  <option value="Approved">Approved</option>
                </TextSelect>
              </label>
              <label>
                Logged Before
                <TextInput type="date" value={loggedBefore} onChange={(e) => setLoggedBefore(e.target.value)} />
              </label>
              <label className="invoice-filter-check">
                <input type="checkbox" checked={includePdfWork} onChange={(e) => setIncludePdfWork(e.target.checked)} />
                Include in PDF
              </label>
            </div>
            {invoiceDetail === "Milestone" || invoiceFor === "Milestone" ? (
              <div className="invoice-milestone-box">
                <div className="invoice-milestone-head">
                  <p>Bill selected milestones instead of the whole project.</p>
                  <label>
                    Portion
                    <TextInput
                      type="number"
                      min={1}
                      max={100}
                      value={milestonePct}
                      onChange={(e) => setMilestonePct(e.target.value)}
                    />
                    %
                  </label>
                </div>
                {projectPhases.length ? (
                  <div className="invoice-milestone-list">
                    {projectPhases.map((phase) => {
                      const billedAlready = billed.has(phase.id);
                      return (
                        <label key={phase.id} className={billedAlready ? "is-billed" : undefined}>
                          <input
                            type="checkbox"
                            checked={selectedMilestones.includes(phase.id)}
                            disabled={billedAlready}
                            onChange={() => setSelectedMilestones((current) => toggleId(current, phase.id))}
                          />
                          <span>
                            {phase.name}
                            {phase.awardAmount ? ` · ${money(phase.awardAmount)}` : ""}
                            {billedAlready ? " · already billed" : ` · ${phase.status}`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="invoice-empty-note">This project has no milestones yet.</p>
                )}
              </div>
            ) : null}
            <div className="invoice-filters">
              <button type="button" className="btn btn-primary" onClick={applyWork}>
                Load selected work
              </button>
            </div>
            <div className="invoice-lines-body">
              {serviceLines.length ? (
                serviceLines.map((line) => (
                  <LineRow key={line.id} line={line} onChange={patchLine} onRemove={(id) => setLines((c) => c.filter((l) => l.id !== id))} />
                ))
              ) : (
                <p className="invoice-empty-note">No service lines yet. Load work, pick milestones, or add a line.</p>
              )}
            </div>
            <button type="button" className="invoice-lines-add" onClick={() => addLine("service")}>
              <Plus size={14} /> Add new Service line item
            </button>
            <div className="invoice-work-detail">
              <strong>Work detail</strong>
              <label>
                <input type="checkbox" checked={groupByStaff} onChange={(e) => setGroupByStaff(e.target.checked)} />
                Group by Staff
              </label>
              <label>
                <input type="checkbox" checked={includeNonBillable} onChange={(e) => setIncludeNonBillable(e.target.checked)} />
                Include Non-billable
              </label>
            </div>
          </section>

          <section className="invoice-block">
            <header className="invoice-block-head">
              <h3>Material</h3>
              <div className="invoice-block-stats">
                <span>Budget {money(0)}</span>
                <span>Invoiced {money(0)}</span>
                <span>Remaining {money(0)}</span>
              </div>
            </header>
            {!visibleMaterials.length ? (
              <div className="invoice-alert">
                <AlertTriangle size={16} /> No Materials to invoice.
              </div>
            ) : null}
            <RecordPicker
              title="Materials"
              empty="No materials yet. Add one, then select it."
              items={visibleMaterials.map((row) => ({
                id: row.id,
                label: `${row.title} · ${row.qty} × ${money(row.salePrice)}`,
              }))}
              selected={pickedMaterials}
              onToggle={(id) => setPickedMaterials((current) => toggleId(current, id))}
              onAddSelected={addSelectedMaterials}
              onCreate={() => setAddKind((current) => (current === "material" ? null : "material"))}
              createLabel="Add material"
            />
            {addKind === "material" ? (
              <div className="mb-4 rounded-[12px] border border-[var(--color-border)] p-3">
                <MaterialCreateForm
                  defaultCompanyId={companyId}
                  defaultProjectId={projectId}
                  onSubmit={(values) => {
                    const id = createBillMaterial(values);
                    if (!id) return;
                    setPickedMaterials((current) => [...current, id]);
                    setLines((current) => [
                      ...current,
                      emptyInvoiceLine("material", {
                        description: values.title,
                        quantity: values.qty,
                        rate: values.salePrice,
                        amount: values.qty * values.salePrice,
                        taxPct: Number(tplTax) || 0,
                        sourceId: id,
                      }),
                    ]);
                    setAddKind(null);
                  }}
                />
              </div>
            ) : null}
            {materialLines.map((line) => (
              <LineRow key={line.id} line={line} onChange={patchLine} onRemove={(id) => setLines((c) => c.filter((l) => l.id !== id))} />
            ))}
            <button type="button" className="invoice-lines-add" onClick={() => addLine("material")}>
              <Plus size={14} /> Add new Material line item
            </button>
          </section>

          <section className="invoice-block">
            <header className="invoice-block-head">
              <h3>Expenses</h3>
              <div className="invoice-block-stats">
                <span>Invoiced {money(0)}</span>
              </div>
            </header>
            <label className="invoice-expense-status">
              Expense status
              <TextSelect value={expenseStatus} onChange={(e) => setExpenseStatus(e.target.value)}>
                <option>All expenses</option>
                <option>Approved</option>
                <option>Pending</option>
              </TextSelect>
            </label>
            {!visibleExpenses.length ? (
              <div className="invoice-alert">
                <AlertTriangle size={16} /> No expenses to invoice.
              </div>
            ) : null}
            <RecordPicker
              title="Expenses"
              empty="No expenses yet. Add one, then select it."
              items={visibleExpenses.map((row) => ({
                id: row.id,
                label: `${row.title || row.vendor} · ${money(row.amount)}`,
              }))}
              selected={pickedExpenses}
              onToggle={(id) => setPickedExpenses((current) => toggleId(current, id))}
              onAddSelected={addSelectedExpenses}
              onCreate={() => setAddKind((current) => (current === "expense" ? null : "expense"))}
              createLabel="Add expense"
            />
            {addKind === "expense" ? (
              <div className="mb-4 rounded-[12px] border border-[var(--color-border)] p-3">
                <ExpenseCreateForm
                  defaultCompanyId={companyId}
                  defaultProjectId={projectId}
                  onSubmit={(values, addAnother) => {
                    const id = createExpense(values);
                    if (!id) return false;
                    setPickedExpenses((current) => [...current, id]);
                    setLines((current) => [
                      ...current,
                      emptyInvoiceLine("expense", {
                        description: `${values.title}: ${values.note || values.belongLabel}`,
                        amount: values.amount,
                        taxPct: Number(tplTax) || 0,
                        sourceId: id,
                      }),
                    ]);
                    if (!addAnother) setAddKind(null);
                  }}
                />
              </div>
            ) : null}
            {expenseLines.map((line) => (
              <LineRow key={line.id} line={line} onChange={patchLine} onRemove={(id) => setLines((c) => c.filter((l) => l.id !== id))} />
            ))}
            <RecordPicker
              title="Purchases"
              empty="No purchases yet. Add one, then select it."
              items={visiblePurchases.map((row) => ({
                id: row.id,
                label: `${row.title} · ${money(row.amount)}`,
              }))}
              selected={pickedPurchases}
              onToggle={(id) => setPickedPurchases((current) => toggleId(current, id))}
              onAddSelected={addSelectedPurchases}
              onCreate={() => setAddKind((current) => (current === "purchase" ? null : "purchase"))}
              createLabel="Add purchase"
            />
            {addKind === "purchase" ? (
              <div className="mb-4 rounded-[12px] border border-[var(--color-border)] p-3">
                <PurchaseCreateForm
                  defaultCompanyId={companyId}
                  defaultProjectId={projectId}
                  onSubmit={(values) => {
                    const id = createPurchase(values);
                    if (!id) return;
                    setPickedPurchases((current) => [...current, id]);
                    setLines((current) => [
                      ...current,
                      emptyInvoiceLine("purchase", {
                        description: `${values.title} (${values.vendor})`,
                        amount: values.amount,
                        taxPct: Number(tplTax) || 0,
                        sourceId: id,
                      }),
                    ]);
                    setAddKind(null);
                  }}
                />
              </div>
            ) : null}
            {purchaseLines.map((line) => (
              <LineRow key={line.id} line={line} onChange={patchLine} onRemove={(id) => setLines((c) => c.filter((l) => l.id !== id))} />
            ))}
          </section>
        </div>

        <aside className="invoice-create-rail">
          <div className="invoice-create-totals">
            <dl>
              <div>
                <dt>Service Subtotal</dt>
                <dd>{moneyExact(totals.service)}</dd>
              </div>
              <div>
                <dt>Material Subtotal</dt>
                <dd>{moneyExact(totals.material)}</dd>
              </div>
              <div>
                <dt>Expenses Subtotal</dt>
                <dd>{moneyExact(totals.expense + totals.purchase)}</dd>
              </div>
              <div>
                <dt>Subtotal</dt>
                <dd>{moneyExact(totals.subtotal)}</dd>
              </div>
              <div>
                <dt>Tax</dt>
                <dd>{moneyExact(totals.tax)}</dd>
              </div>
              <div className="is-total">
                <dt>Total</dt>
                <dd>{moneyExact(totals.total)}</dd>
              </div>
            </dl>
          </div>
          <div className="invoice-create-template">
            <h3>Template</h3>
            <p>{template?.name || "Select a template to start from Time and materials, Progress, Fixed fee milestone, or Expense recovery."}</p>
            <div className="invoice-create-template-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditingTemplate((v) => !v)}>
                {editingTemplate ? "Close editor" : "Save as template"}
              </button>
            </div>
            {editingTemplate ? (
              <div className="invoice-create-template-edit">
                <Field label="Template name">
                  <TextInput value={tplName} onChange={(e) => setTplName(e.target.value)} />
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
        <div className="invoice-create-actions-total">{moneyExact(totals.total)}</div>
        <div className="invoice-create-actions-end">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const draft = buildInvoice();
              if (!draft) {
                pushToast("Add a company and at least one line item", "danger");
                return;
              }
              exportInvoicePdf(draft, company?.address);
            }}
          >
            <FileText size={16} /> Preview & Edit PDF
          </button>
          <button type="submit" className="btn btn-ghost">
            Save as Draft
          </button>
          <button type="button" className="btn btn-primary" onClick={() => submit(true)}>
            Save & Send PDF
          </button>
        </div>
      </div>
    </form>
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
  const amount = computeLineAmount(line);
  return (
    <div className="invoice-line">
      <TextInput
        aria-label="Description"
        value={line.description}
        onChange={(e) => onChange(line.id, { description: e.target.value })}
        placeholder="Description"
      />
      {line.kind === "service" ? (
        <TextSelect
          aria-label="Itemize"
          value={line.itemize ?? "None"}
          onChange={(e) => onChange(line.id, { itemize: e.target.value as DraftLine["itemize"] })}
        >
          {INVOICE_ITEMIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </TextSelect>
      ) : (
        <span className="invoice-line-amt">{line.kind}</span>
      )}
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
            step="0.01"
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
            step="0.01"
            value={line.rate ?? ""}
            onChange={(e) => onChange(line.id, { rate: e.target.value === "" ? undefined : Number(e.target.value) })}
            placeholder="Unit"
          />
        </>
      ) : (
        <>
          <span />
          <span />
        </>
      )}
      <TextInput
        aria-label="Amount"
        type="number"
        min={0}
        step="0.01"
        value={amount || ""}
        onChange={(e) =>
          onChange(line.id, {
            hours: line.kind === "service" ? undefined : line.hours,
            rate: line.kind === "service" ? undefined : line.rate,
            quantity: line.kind === "material" ? undefined : line.quantity,
            amount: Number(e.target.value) || 0,
          })
        }
      />
      <TextInput
        aria-label="Tax percent"
        type="number"
        min={0}
        step="0.1"
        value={line.taxPct ?? 0}
        onChange={(e) => onChange(line.id, { taxPct: Number(e.target.value) || 0 })}
        placeholder="Tax %"
      />
      <div className="invoice-line-amt">{moneyExact(lineTotal(line))}</div>
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

function RecordPicker({
  title,
  empty,
  items,
  selected,
  onToggle,
  onAddSelected,
  onCreate,
  createLabel,
}: {
  title: string;
  empty: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  onAddSelected: () => void;
  onCreate: () => void;
  createLabel: string;
}) {
  return (
    <section className="invoice-lines mb-4">
      <header>
        <div>
          <h3>{title}</h3>
          <p>Select created records or add a new one.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onCreate}>
          {createLabel}
        </button>
      </header>
      <div className="invoice-lines-body">
        {items.length ? (
          items.map((item) => (
            <label key={item.id} className="mb-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
              {item.label}
            </label>
          ))
        ) : (
          <p className="text-sm text-[var(--color-muted)]">{empty}</p>
        )}
      </div>
      <button type="button" className="invoice-lines-add" onClick={onAddSelected}>
        <Plus size={14} /> Add selected {title.toLowerCase()}
      </button>
    </section>
  );
}
