"use client";

import { useMemo, useState } from "react";
import { Field, TextInput, TextSelect, TextTextarea } from "@/components/primitives";
import { useAuth } from "@/lib/auth";
import {
  PROJECT_CREATE_STATUSES,
  PROJECT_CREATE_TYPES,
  customFieldsForProjectType,
  projectTemplateById,
  templatesForProjectType,
} from "@/lib/ppm";
import { useAppStore } from "@/lib/store";
import { addDays, todayIso } from "@/lib/timesheet";

export type ProjectCreateValues = {
  name: string;
  companyId?: string;
  manager: string;
  ownerEmail?: string;
  due: string;
  start?: string;
  budgetHours: number;
  projectType: string;
  status?: (typeof PROJECT_CREATE_STATUSES)[number];
  contactId?: string;
  templateId?: string;
  customFields?: { id: string; label: string; value: string }[];
  description?: string;
  location?: string;
  fundingSource?: string;
  actualStart?: string;
  actualDue?: string;
};

export function ProjectCreateForm({
  companies,
  defaultCompanyId,
  onSubmit,
}: {
  companies: { id: string; name: string }[];
  defaultCompanyId?: string;
  onSubmit: (v: ProjectCreateValues) => void;
}) {
  const { user, can } = useAuth();
  const team = useAppStore((s) => s.team).filter((member) => member.active);
  const contacts = useAppStore((s) => s.contacts);
  const storeCompanies = useAppStore((s) => s.companies);
  const createCompany = useAppStore((s) => s.createCompany);
  const createContact = useAppStore((s) => s.createContact);
  const preferred =
    team.find((member) => member.email.toLowerCase() === user?.email?.toLowerCase()) ??
    team.find((member) => member.name === user?.name) ??
    team[0];
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? "");
  const [projectType, setProjectType] = useState(
    defaultCompanyId || companies.length ? "Client Work" : "Internal",
  );
  const [status, setStatus] = useState<(typeof PROJECT_CREATE_STATUSES)[number]>("Draft");
  const [contactId, setContactId] = useState("");
  const [ownerId, setOwnerId] = useState(preferred?.id ?? "");
  const [start, setStart] = useState(todayIso());
  const [due, setDue] = useState(addDays(todayIso(), 30));
  const [showMore, setShowMore] = useState(false);
  const [showAdvancedDates, setShowAdvancedDates] = useState(false);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [fundingSource, setFundingSource] = useState("");
  const [actualStart, setActualStart] = useState("");
  const [actualDue, setActualDue] = useState("");
  const [templateId, setTemplateId] = useState("blank");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
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
  const typeFields = customFieldsForProjectType(projectType);
  const templates = templatesForProjectType(projectType);

  function applyCompany(nextId: string) {
    setCompanyId(nextId);
    const company = storeCompanies.find((row) => row.id === nextId);
    const primary = company?.primaryContactId
      ? contacts.find((row) => row.id === company.primaryContactId)
      : contacts.find((row) => row.companyId === nextId);
    setContactId(primary?.id ?? "");
  }

  function applyType(next: string) {
    setProjectType(next);
    setCustomValues({});
    const template = projectTemplateById(templateId);
    if (template && "projectType" in template && template.projectType && template.projectType !== next) {
      setTemplateId("blank");
    }
    if (next === "Client Work" && !companyId && companyOptions[0]) applyCompany(companyOptions[0].id);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (!projectType) return;
        if (projectType === "Client Work" && !companyId) return;
        if (projectType === "Client Work" && companyId && !contactId) return;
        const template = projectTemplateById(templateId);
        onSubmit({
          name: name.trim(),
          companyId: companyId || undefined,
          manager: owner?.name ?? user?.name ?? "Unassigned",
          ownerEmail: owner?.email,
          due,
          start,
          budgetHours: template?.budgetHours ?? 120,
          projectType,
          status,
          contactId: contactId || undefined,
          templateId,
          customFields: typeFields.map((field) => ({
            id: field.id,
            label: field.label,
            value: customValues[field.id]?.trim() ?? "",
          })),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          fundingSource: fundingSource.trim() || undefined,
          actualStart: actualStart || undefined,
          actualDue: actualDue || undefined,
        });
      }}
    >
      <Field label="Project name" required>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>

      <h3 className="section-title">Project details</h3>
      <Field label="Company" required={projectType === "Client Work"}>
        <TextSelect
          value={companyId}
          onChange={(e) => applyCompany(e.target.value)}
          required={projectType === "Client Work"}
        >
          {projectType === "Internal" ? <option value="">Internal / unassigned</option> : null}
          {projectType === "Client Work" && !companyOptions.length ? <option value="">Select a company</option> : null}
          {companyOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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
      {projectType === "Client Work" && !companyOptions.length ? (
        <p className="mb-3 text-xs text-[var(--color-muted)]">
          Client Work needs a company. Create a company first, or choose Internal.
        </p>
      ) : null}

      <Field label="Company contact" required={projectType === "Client Work" && Boolean(companyId)}>
        <TextSelect
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          required={projectType === "Client Work" && Boolean(companyId)}
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
          Add a contact
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
              setContactId(id);
              setNewContactOpen(false);
              setNewContactName("");
              setNewContactEmail("");
            }}
          >
            Add
          </button>
        </div>
      ) : null}

      <Field label="Type" required>
        <TextSelect value={projectType} onChange={(e) => applyType(e.target.value)} required>
          {PROJECT_CREATE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </TextSelect>
      </Field>
      <p className="mb-3 text-xs text-[var(--color-muted)]">What type of project is this?</p>

      <Field label="Status" required>
        <TextSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof PROJECT_CREATE_STATUSES)[number])}
          required
        >
          {PROJECT_CREATE_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </TextSelect>
      </Field>
      <p className="mb-3 text-xs text-[var(--color-muted)]">At what point should this project start?</p>

      <Field label="Project manager" required>
        <TextSelect value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required>
          <option value="">Select manager</option>
          {team.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.email})
            </option>
          ))}
        </TextSelect>
      </Field>
      <p className="mb-3 text-xs text-[var(--color-muted)]">
        We email the project manager at {owner?.email || "their address"} as soon as the project is created.
      </p>
      <button
        type="button"
        className="mb-3 text-sm font-semibold text-[var(--color-navy)]"
        onClick={() => setShowMore((open) => !open)}
      >
        {showMore ? "Hide more" : "More"}
      </button>
      {showMore ? (
        <>
          <Field label="Description">
            <TextTextarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Location">
            <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Funding source">
            <TextInput value={fundingSource} onChange={(e) => setFundingSource(e.target.value)} />
          </Field>
        </>
      ) : null}

      <h3 className="section-title">Dates</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Planned start">
          <TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Planned due">
          <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
      </div>
      <button
        type="button"
        className="mb-3 text-sm font-semibold text-[var(--color-navy)]"
        onClick={() => setShowAdvancedDates((open) => !open)}
      >
        {showAdvancedDates ? "Hide advanced date settings" : "More advanced date settings"}
      </button>
      {showAdvancedDates ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Actual start">
            <TextInput type="date" value={actualStart} onChange={(e) => setActualStart(e.target.value)} />
          </Field>
          <Field label="Actual due">
            <TextInput type="date" value={actualDue} onChange={(e) => setActualDue(e.target.value)} />
          </Field>
        </div>
      ) : null}

      <h3 className="section-title">Budget settings</h3>
      <Field label="Project template">
        <TextSelect
          value={templateId}
          onChange={(e) => {
            const next = e.target.value;
            setTemplateId(next);
            const template = projectTemplateById(next);
            if (template && "projectType" in template && template.projectType) applyType(template.projectType);
          }}
        >
          {templates.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </TextSelect>
      </Field>

      <h3 className="section-title">Custom fields</h3>
      {typeFields.length ? (
        typeFields.map((field) => (
          <Field key={field.id} label={field.label}>
            <TextInput
              value={customValues[field.id] ?? ""}
              onChange={(e) => setCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
            />
          </Field>
        ))
      ) : (
        <p className="mb-3 text-xs text-[var(--color-muted)]">Select a type to see its custom fields.</p>
      )}

      <button type="submit" className="btn btn-primary">
        Create project
      </button>
    </form>
  );
}
