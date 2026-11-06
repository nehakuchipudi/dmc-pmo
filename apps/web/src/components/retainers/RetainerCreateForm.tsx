"use client";

import { useMemo, useState } from "react";
import { Field, TextInput, TextSelect, TextTextarea } from "@/components/primitives";
import { useAuth } from "@/lib/auth";
import {
  DEFAULT_RETAINER_INVOICE_LINE,
  DEFAULT_RETAINER_RATE,
  PERIOD_ALLOWANCES,
  PERIOD_BILLING,
  PERIOD_DURATION_KINDS,
  PERIOD_UNITS,
  RETAINER_CREATE_STATUSES,
  RETAINER_MATERIAL_TEMPLATES,
  RETAINER_RATE_MODES,
  RETAINER_SERVICE_ITEMS,
  RETAINER_TASK_TEMPLATES,
  RETAINER_TYPES,
  customFieldsForRetainerType,
  defaultPeriodBilling,
  parseRetainerTags,
  periodEndFromStart,
} from "@/lib/retainers";
import { useAppStore } from "@/lib/store";
import { todayIso } from "@/lib/timesheet";
import type { RetainerStatus, RetainerType } from "@/lib/types";

export type RetainerCreateValues = {
  name: string;
  companyId: string;
  type: RetainerType;
  manager: string;
  contactId: string;
  budgetHours: number;
  expires: string;
  status: RetainerStatus;
  started: string;
  autoRenew: boolean;
  rate?: number;
  tags: string[];
  periodDurationKind: (typeof PERIOD_DURATION_KINDS)[number];
  periodLength: number;
  periodUnit: (typeof PERIOD_UNITS)[number];
  periodBilling: (typeof PERIOD_BILLING)[number];
  prepaidPrice?: number;
  periodAllowance: (typeof PERIOD_ALLOWANCES)[number];
  renewDaysBefore: number;
  rateMode: (typeof RETAINER_RATE_MODES)[number];
  applyRateToLinkedWork: boolean;
  billableContactId: string;
  invoiceTemplateId: string;
  serviceItem?: string;
  invoiceLineDescription: string;
  customFields: { id: string; label: string; value: string }[];
  taskTemplate?: string;
  materialTemplate?: string;
};

export function RetainerCreateForm({
  companies,
  defaultCompanyId,
  onSubmit,
}: {
  companies: { id: string; name: string }[];
  defaultCompanyId?: string;
  onSubmit: (v: RetainerCreateValues) => void;
}) {
  const { user, can } = useAuth();
  const team = useAppStore((s) => s.team).filter((member) => member.active);
  const contacts = useAppStore((s) => s.contacts);
  const storeCompanies = useAppStore((s) => s.companies);
  const templates = useAppStore((s) => s.invoiceTemplates);
  const createCompany = useAppStore((s) => s.createCompany);
  const createContact = useAppStore((s) => s.createContact);
  const preferred =
    team.find((member) => member.email.toLowerCase() === user?.email?.toLowerCase()) ??
    team.find((member) => member.name === user?.name) ??
    team[0];
  const defaultTemplateId = templates.find((row) => row.kind === "retainer")?.id ?? templates[0]?.id ?? "";
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? "");
  const [type, setType] = useState<RetainerType>("Monthly T&M");
  const [status, setStatus] = useState<RetainerStatus>("Active");
  const [contactId, setContactId] = useState("");
  const [billableContactId, setBillableContactId] = useState("");
  const [ownerId, setOwnerId] = useState(preferred?.id ?? "");
  const [commenced, setCommenced] = useState(todayIso());
  const [periodLength, setPeriodLength] = useState(1);
  const [periodUnit, setPeriodUnit] = useState<(typeof PERIOD_UNITS)[number]>("Month");
  const [periodDurationKind, setPeriodDurationKind] = useState<(typeof PERIOD_DURATION_KINDS)[number]>("Fixed");
  const [expiry, setExpiry] = useState(periodEndFromStart(todayIso(), 1, "Month"));
  const [expiryDirty, setExpiryDirty] = useState(false);
  const [periodBilling, setPeriodBilling] = useState<(typeof PERIOD_BILLING)[number]>(
    defaultPeriodBilling("Monthly T&M"),
  );
  const [prepaidPrice, setPrepaidPrice] = useState("0");
  const [periodAllowance, setPeriodAllowance] = useState<(typeof PERIOD_ALLOWANCES)[number]>("Fixed hours");
  const [periodHours, setPeriodHours] = useState(20);
  const [autoRenew, setAutoRenew] = useState(true);
  const [renewDays, setRenewDays] = useState(0);
  const [rateMode, setRateMode] = useState<(typeof RETAINER_RATE_MODES)[number]>("Use staff rates");
  const [rate, setRate] = useState(DEFAULT_RETAINER_RATE);
  const [applyRateToLinkedWork, setApplyRateToLinkedWork] = useState(false);
  const [invoiceTemplateId, setInvoiceTemplateId] = useState(defaultTemplateId);
  const [serviceItem, setServiceItem] = useState("");
  const [invoiceLine, setInvoiceLine] = useState(DEFAULT_RETAINER_INVOICE_LINE);
  const [taskTemplate, setTaskTemplate] = useState("None");
  const [materialTemplate, setMaterialTemplate] = useState("None");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [newCompanyOpen, setNewCompanyOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const owner = team.find((member) => member.id === ownerId) ?? preferred;
  const companyOptions = storeCompanies.length ? storeCompanies : companies;
  const companyContacts = useMemo(
    () => contacts.filter((row) => row.companyId === companyId),
    [contacts, companyId],
  );
  const typeFields = customFieldsForRetainerType(type);

  function applyExpiry(start: string, length: number, unit: (typeof PERIOD_UNITS)[number], dirty: boolean) {
    if (dirty) return;
    setExpiry(periodEndFromStart(start, length, unit));
  }

  function applyCompany(nextId: string) {
    setCompanyId(nextId);
    const company = storeCompanies.find((row) => row.id === nextId);
    const primary = company?.primaryContactId
      ? contacts.find((row) => row.id === company.primaryContactId)
      : contacts.find((row) => row.companyId === nextId);
    applyContact(primary?.id ?? "");
  }

  function applyContact(nextId: string) {
    setContactId(nextId);
    if (!billableContactId || billableContactId === contactId) setBillableContactId(nextId);
  }

  function applyType(next: RetainerType) {
    setType(next);
    setCustomValues({});
    setPeriodBilling(defaultPeriodBilling(next));
  }

  function addTag(raw: string) {
    const next = parseRetainerTags(raw);
    if (!next.length) return;
    setTags((current) => [...new Set([...current, ...next])]);
    setTagDraft("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !companyId || !contactId || !billableContactId || !invoiceTemplateId) return;
        if (!invoiceLine.trim()) return;
        const allowance = periodAllowance;
        onSubmit({
          name: name.trim(),
          companyId,
          type,
          manager: owner?.name ?? user?.name ?? "Unassigned",
          contactId,
          budgetHours: allowance === "Unlimited hours" ? 0 : Math.max(0, Number(periodHours) || 0),
          expires: expiry,
          status,
          started: commenced,
          autoRenew,
          rate: rateMode === "Retainer rate" ? Number(rate) || DEFAULT_RETAINER_RATE : undefined,
          tags,
          periodDurationKind,
          periodLength: Math.max(1, Number(periodLength) || 1),
          periodUnit,
          periodBilling,
          prepaidPrice: periodBilling === "Pre-paid" ? Number(prepaidPrice) || 0 : undefined,
          periodAllowance: allowance,
          renewDaysBefore: autoRenew ? Math.max(0, Number(renewDays) || 0) : 0,
          rateMode,
          applyRateToLinkedWork,
          billableContactId,
          invoiceTemplateId,
          serviceItem: serviceItem || undefined,
          invoiceLineDescription: invoiceLine.trim(),
          customFields: typeFields.map((field) => ({
            id: field.id,
            label: field.label,
            value: customValues[field.id]?.trim() ?? "",
          })),
          taskTemplate: taskTemplate === "None" ? undefined : taskTemplate,
          materialTemplate: materialTemplate === "None" ? undefined : materialTemplate,
        });
      }}
    >
      <Field label="Title" required>
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter title of retainer"
          required
        />
      </Field>

      <h3 className="section-title">Retainer information</h3>
      <Field label="Company" required>
        <TextSelect value={companyId} onChange={(e) => applyCompany(e.target.value)} required>
          {!companyOptions.length ? <option value="">Select a company</option> : null}
          {companyOptions.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      {can("create_company") ? (
        <button
          type="button"
          className="mb-3 text-sm font-semibold text-[var(--color-navy)]"
          onClick={() => setNewCompanyOpen((open) => !open)}
        >
          Create a company
        </button>
      ) : null}
      {newCompanyOpen ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <TextInput
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            placeholder="Company name"
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const typed = newCompanyName.trim();
              if (!typed) return;
              const id = createCompany({
                name: typed,
                status: "Active",
                accountManager: user?.name ?? "Unassigned",
                industry: "Professional Services",
                billingTerms: "Net 30",
              });
              if (!id) return;
              applyCompany(id);
              setNewCompanyOpen(false);
              setNewCompanyName("");
            }}
          >
            Add
          </button>
        </div>
      ) : null}
      {!companyOptions.length ? (
        <p className="mb-3 text-xs text-[var(--color-muted)]">A retainer needs a company. Create a company first.</p>
      ) : null}

      <Field label="Contact" required>
        <TextSelect
          value={contactId}
          onChange={(e) => applyContact(e.target.value)}
          required
          disabled={!companyId}
        >
          <option value="">{companyId ? "Select a contact" : "Select a company first"}</option>
          {companyContacts.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      {companyId && can("create_contact") ? (
        <button
          type="button"
          className="mb-3 text-sm font-semibold text-[var(--color-navy)]"
          onClick={() => setNewContactOpen((open) => !open)}
        >
          Create a contact
        </button>
      ) : null}
      {newContactOpen && companyId ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <TextInput
            value={newContactName}
            onChange={(e) => setNewContactName(e.target.value)}
            placeholder="Contact name"
          />
          <TextInput
            type="email"
            value={newContactEmail}
            onChange={(e) => setNewContactEmail(e.target.value)}
            placeholder="Email"
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const typed = newContactName.trim();
              if (!typed) return;
              const company = companyOptions.find((row) => row.id === companyId);
              const id = createContact({
                name: typed,
                companyId,
                companyName: company?.name ?? "",
                title: "",
                email: newContactEmail.trim(),
                portal: "Not Invited",
                primary: companyContacts.length === 0,
              });
              if (!id) return;
              applyContact(id);
              setNewContactOpen(false);
              setNewContactName("");
              setNewContactEmail("");
            }}
          >
            Add
          </button>
        </div>
      ) : null}

      <Field label="Manager">
        <TextSelect value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          <option value="">Select a manager</option>
          {team.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </TextSelect>
      </Field>

      <Field label="Type" required>
        <TextSelect value={type} onChange={(e) => applyType(e.target.value as RetainerType)} required>
          {RETAINER_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Status" required>
        <TextSelect value={status} onChange={(e) => setStatus(e.target.value as RetainerStatus)} required>
          {RETAINER_CREATE_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </TextSelect>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Commenced">
          <TextInput
            type="date"
            value={commenced}
            onChange={(e) => {
              const next = e.target.value;
              setCommenced(next);
              applyExpiry(next, periodLength, periodUnit, expiryDirty);
            }}
          />
        </Field>
        <Field label="Expiry">
          <TextInput
            type="date"
            value={expiry}
            onChange={(e) => {
              setExpiry(e.target.value);
              setExpiryDirty(true);
            }}
            required
          />
        </Field>
      </div>

      <Field label="Tags">
        <TextInput
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          placeholder="Add a tag"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(tagDraft);
            }
          }}
          onBlur={() => addTag(tagDraft)}
        />
      </Field>
      {tags.length ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="filter-chip"
              onClick={() => setTags((current) => current.filter((item) => item !== tag))}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      {typeFields.length ? (
        <>
          <h3 className="section-title">Custom fields</h3>
          {typeFields.map((field) => (
            <Field key={field.id} label={field.label}>
              <TextInput
                value={customValues[field.id] ?? ""}
                onChange={(e) => setCustomValues((current) => ({ ...current, [field.id]: e.target.value }))}
              />
            </Field>
          ))}
        </>
      ) : (
        <p className="mb-3 text-xs text-[var(--color-muted)]">Select a type to see its custom fields.</p>
      )}

      <h3 className="section-title">Period and allowances</h3>
      <div className="mb-3">
        <div className="mb-1 text-sm text-[var(--color-muted)]">Period duration</div>
        <div className="grid gap-2 sm:grid-cols-[1fr_5rem_8rem]">
          <TextSelect
            value={periodDurationKind}
            aria-label="Period duration"
            onChange={(e) => setPeriodDurationKind(e.target.value as (typeof PERIOD_DURATION_KINDS)[number])}
          >
            {PERIOD_DURATION_KINDS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </TextSelect>
          <TextInput
            type="number"
            min={1}
            value={periodLength}
            aria-label="Length per period"
            onChange={(e) => {
              const next = Math.max(1, Number(e.target.value) || 1);
              setPeriodLength(next);
              applyExpiry(commenced, next, periodUnit, expiryDirty);
            }}
          />
          <TextSelect
            value={periodUnit}
            aria-label="Period unit"
            onChange={(e) => {
              const next = e.target.value as (typeof PERIOD_UNITS)[number];
              setPeriodUnit(next);
              applyExpiry(commenced, periodLength, next, expiryDirty);
            }}
          >
            {PERIOD_UNITS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </TextSelect>
        </div>
      </div>
      <p className="mb-3 text-xs text-[var(--color-muted)]">Length per period, then day, week, month, or year.</p>

      <Field label="Period billing">
        <TextSelect
          value={periodBilling}
          onChange={(e) => setPeriodBilling(e.target.value as (typeof PERIOD_BILLING)[number])}
        >
          {PERIOD_BILLING.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </TextSelect>
      </Field>
      {periodBilling === "Pre-paid" ? (
        <Field label="Pre-paid price">
          <TextInput
            type="number"
            min={0}
            step="0.01"
            value={prepaidPrice}
            onChange={(e) => setPrepaidPrice(e.target.value)}
          />
        </Field>
      ) : null}

      <Field label="Period allowance">
        <TextSelect
          value={periodAllowance}
          onChange={(e) => setPeriodAllowance(e.target.value as (typeof PERIOD_ALLOWANCES)[number])}
        >
          {PERIOD_ALLOWANCES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </TextSelect>
      </Field>
      {periodAllowance === "Fixed hours" ? (
        <Field label="Period hours">
          <TextInput
            type="number"
            min={0}
            value={periodHours}
            onChange={(e) => setPeriodHours(Number(e.target.value) || 0)}
          />
        </Field>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} />
          Renew periods
        </label>
        <TextInput
          type="number"
          min={0}
          value={renewDays}
          disabled={!autoRenew}
          aria-label="Days before latest period expires"
          onChange={(e) => setRenewDays(Math.max(0, Number(e.target.value) || 0))}
          style={{ width: "4.5rem" }}
        />
        days before the latest period expires
      </div>

      <h3 className="section-title">Rates and invoicing</h3>
      <Field label="Retainer rate">
        <TextSelect
          aria-label="Retainer rate"
          value={rateMode}
          onChange={(e) => setRateMode(e.target.value as (typeof RETAINER_RATE_MODES)[number])}
        >
          {RETAINER_RATE_MODES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </TextSelect>
      </Field>
      {rateMode === "Retainer rate" ? (
        <Field label="Hourly rate">
          <TextInput type="number" min={0} value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} />
        </Field>
      ) : null}
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={applyRateToLinkedWork}
          onChange={(e) => setApplyRateToLinkedWork(e.target.checked)}
        />
        Apply retainer rate for tickets and projects linked to this period
      </label>

      <Field label="Billable contact" required>
        <TextSelect
          value={billableContactId}
          onChange={(e) => setBillableContactId(e.target.value)}
          required
          disabled={!companyId}
        >
          <option value="">{companyId ? "Select a billable contact" : "Select a company first"}</option>
          {companyContacts.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Invoice template" required>
        <TextSelect value={invoiceTemplateId} onChange={(e) => setInvoiceTemplateId(e.target.value)} required>
          <option value="">Select an invoice template</option>
          {templates.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Service item">
        <TextSelect value={serviceItem} onChange={(e) => setServiceItem(e.target.value)}>
          <option value="">Select a service item</option>
          {RETAINER_SERVICE_ITEMS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Description on invoice line item" required>
        <TextTextarea value={invoiceLine} onChange={(e) => setInvoiceLine(e.target.value)} rows={3} required />
      </Field>
      <p className="mb-3 text-xs text-[var(--color-muted)]">
        Use {"{period.commence}"} and {"{period.expiry}"} for the current period dates.
      </p>

      <h3 className="section-title">Tasks</h3>
      <Field label="Task template">
        <TextSelect value={taskTemplate} onChange={(e) => setTaskTemplate(e.target.value)}>
          {RETAINER_TASK_TEMPLATES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </TextSelect>
      </Field>

      <h3 className="section-title">Materials</h3>
      <Field label="Material template">
        <TextSelect value={materialTemplate} onChange={(e) => setMaterialTemplate(e.target.value)}>
          {RETAINER_MATERIAL_TEMPLATES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </TextSelect>
      </Field>

      <button type="submit" className="btn btn-primary">
        Create retainer
      </button>
    </form>
  );
}
