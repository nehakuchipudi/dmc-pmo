"use client";

import { useMemo, useState } from "react";
import { Field, TextInput, TextSelect, TextTextarea } from "@/components/primitives";
import { useAuth } from "@/lib/auth";
import {
  DEFAULT_MILE_RATE,
  EXPENSE_TYPES,
  belongValue,
  expenseAmountForType,
  extraFieldsForExpenseType,
  parseBelongValue,
  type ExpenseType,
} from "@/lib/billing-items";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import { todayIso } from "@/lib/timesheet";

export type ExpenseCreateValues = {
  title: string;
  type: ExpenseType;
  vendor: string;
  projectId: string;
  companyId?: string;
  retainerId?: string;
  belongLabel: string;
  amount: number;
  note: string;
  date: string;
  owner: string;
  attachmentName?: string;
  miles?: number;
  mileRate?: number;
};

export function ExpenseCreateForm({
  defaultProjectId,
  defaultCompanyId,
  onSubmit,
  submitLabel,
}: {
  defaultProjectId?: string;
  defaultCompanyId?: string;
  onSubmit: (v: ExpenseCreateValues, addAnother: boolean) => boolean | void;
  submitLabel?: string;
}) {
  const { user, can } = useAuth();
  const team = useAppStore((s) => s.team).filter((member) => member.active);
  const projects = useAppStore((s) => s.projects);
  const companies = useAppStore((s) => s.companies);
  const retainers = useAppStore((s) => s.retainers);
  const createCompany = useAppStore((s) => s.createCompany);
  const preferred =
    team.find((member) => member.email.toLowerCase() === user?.email?.toLowerCase()) ??
    team.find((member) => member.name === user?.name) ??
    team[0];
  const defaultBelong = defaultProjectId
    ? belongValue("project", defaultProjectId)
    : defaultCompanyId
      ? belongValue("company", defaultCompanyId)
      : projects[0]
        ? belongValue("project", projects[0].id)
        : companies[0]
          ? belongValue("company", companies[0].id)
          : "";
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ExpenseType | "">("");
  const [belong, setBelong] = useState(defaultBelong);
  const [date, setDate] = useState(todayIso());
  const [ownerId, setOwnerId] = useState(preferred?.id ?? "");
  const [amount, setAmount] = useState("0");
  const [vendor, setVendor] = useState("");
  const [note, setNote] = useState("");
  const [miles, setMiles] = useState("0");
  const [mileRate, setMileRate] = useState(String(DEFAULT_MILE_RATE));
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [attachmentName, setAttachmentName] = useState("");
  const [addAnother, setAddAnother] = useState(false);
  const [newCompanyOpen, setNewCompanyOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const owner = team.find((member) => member.id === ownerId) ?? preferred;
  const extraFields = type ? extraFieldsForExpenseType(type) : [];
  const computed = expenseAmountForType(
    (type || "Other") as ExpenseType,
    Number(amount) || 0,
    Number(miles) || 0,
    Number(mileRate) || DEFAULT_MILE_RATE,
  );

  const belongOptions = useMemo(
    () => [
      ...projects.map((row) => ({ value: belongValue("project", row.id), label: `Project: ${row.name}` })),
      ...companies.map((row) => ({ value: belongValue("company", row.id), label: `Company: ${row.name}` })),
      ...retainers.map((row) => ({ value: belongValue("retainer", row.id), label: `Retainer: ${row.name}` })),
    ],
    [projects, companies, retainers],
  );

  function resetForm() {
    setTitle("");
    setAmount("0");
    setVendor("");
    setNote("");
    setMiles("0");
    setExtras({});
    setAttachmentName("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !type || !belong) return;
        const parsed = parseBelongValue(belong);
        if (!parsed) return;
        const project = parsed.kind === "project" ? projects.find((row) => row.id === parsed.id) : undefined;
        const company =
          parsed.kind === "company"
            ? companies.find((row) => row.id === parsed.id)
            : project
              ? companies.find((row) => row.id === project.companyId)
              : undefined;
        const retainer = parsed.kind === "retainer" ? retainers.find((row) => row.id === parsed.id) : undefined;
        const belongLabel = project?.name ?? company?.name ?? retainer?.name ?? "Unassigned";
        const vendorValue = (extras.vendor ?? vendor).trim() || title.trim();
        const kept = onSubmit(
          {
            title: title.trim(),
            type,
            vendor: vendorValue,
            projectId: project?.id ?? "",
            companyId: company?.id ?? retainer?.companyId,
            retainerId: retainer?.id,
            belongLabel,
            amount: computed,
            note: [note.trim(), extras.route, extras.attendees, extras.nights, extras.item].filter(Boolean).join(" · "),
            date,
            owner: owner?.name ?? user?.name ?? "Unassigned",
            attachmentName: attachmentName || undefined,
            miles: type === "Mileage" ? Number(miles) || 0 : undefined,
            mileRate: type === "Mileage" ? Number(mileRate) || DEFAULT_MILE_RATE : undefined,
          },
          addAnother,
        );
        if (addAnother && kept !== false) resetForm();
      }}
    >
      <Field label="Title" required>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for your expense"
          required
        />
      </Field>
      <Field label="Type" required>
        <TextSelect value={type} onChange={(e) => setType(e.target.value as ExpenseType)} required>
          <option value="">Select type</option>
          {EXPENSE_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Where does this expense belong?" required>
        <TextSelect value={belong} onChange={(e) => setBelong(e.target.value)} required>
          <option value="">{belongOptions.length ? "Search" : "Create a company first"}</option>
          {belongOptions.map((row) => (
            <option key={row.value} value={row.value}>
              {row.label}
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
              setBelong(belongValue("company", id));
              setNewCompanyOpen(false);
              setNewCompanyName("");
            }}
          >
            Add
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date" required>
          <div className="flex items-center gap-2">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <button type="button" className="btn btn-ghost" onClick={() => setDate(todayIso())}>
              Today
            </button>
          </div>
        </Field>
        <Field label="Owner" required>
          <TextSelect value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required>
            <option value="">Select owner</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </TextSelect>
        </Field>
      </div>

      <Field label="Attachment">
        <input
          type="file"
          className="field-input"
          onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? "")}
        />
      </Field>
      {attachmentName ? <p className="mb-3 text-xs text-[var(--color-muted)]">{attachmentName}</p> : null}

      {type ? (
        <>
          <h3 className="section-title">{type} details</h3>
          {type === "Mileage" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Miles">
                <TextInput type="number" min={0} step="0.1" value={miles} onChange={(e) => setMiles(e.target.value)} />
              </Field>
              <Field label="Rate per mile">
                <TextInput
                  type="number"
                  min={0}
                  step="0.01"
                  value={mileRate}
                  onChange={(e) => setMileRate(e.target.value)}
                />
              </Field>
            </div>
          ) : (
            extraFields.map((field) => (
              <Field key={field.id} label={field.label}>
                <TextInput
                  value={field.id === "vendor" ? vendor || (extras[field.id] ?? "") : (extras[field.id] ?? "")}
                  onChange={(e) => {
                    if (field.id === "vendor") setVendor(e.target.value);
                    else setExtras((current) => ({ ...current, [field.id]: e.target.value }));
                  }}
                />
              </Field>
            ))
          )}
          {type !== "Mileage" ? (
            <Field label="Amount" required>
              <TextInput type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
          ) : null}
          <Field label="Note">
            <TextTextarea value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </>
      ) : (
        <p className="mb-4 text-sm text-[var(--color-muted)]">Select a type to adjust more options.</p>
      )}

      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={addAnother} onChange={(e) => setAddAnother(e.target.checked)} />
        Add another
      </label>
      <button type="submit" className="btn btn-primary" disabled={!type}>
        {submitLabel ?? `Submit ${money(computed)}`}
      </button>
    </form>
  );
}
