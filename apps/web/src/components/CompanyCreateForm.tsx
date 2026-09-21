"use client";

import { useMemo, useState } from "react";
import { Building2, Link2, MapPin, Plus, Shield, UserPlus, Users, X } from "lucide-react";
import { Field, TextInput, TextSelect } from "@/components/primitives";
import { useAppStore } from "@/lib/store";
import type { CompanyAddress, CompanyCustomField, CompanyPrivacy, CompanyStatus } from "@/lib/types";

const STATUSES: CompanyStatus[] = ["Active", "Prospect", "Overdue Inv."];
const INDUSTRIES = [
  "Manufacturing & Distribution",
  "Professional Services",
  "Technology",
  "Retail",
  "Legal",
  "Logistics",
  "Healthcare",
  "Finance",
  "Public Sector",
];
const SALUTATIONS = ["", "Mr", "Ms", "Mx", "Dr", "Prof"];
const PRONOUNS = ["", "she/her", "he/him", "they/them", "prefer not to say"];
const CONTACT_CATEGORIES = ["", "Primary", "Billing", "Technical", "Executive"];
const PRIVACY: CompanyPrivacy[] = ["Standard", "Confidential"];

export type NewCompanyPayload = {
  company: {
    name: string;
    status: CompanyStatus;
    accountManager: string;
    accountManagers: string[];
    industry: string;
    billingTerms: string;
    website?: string;
    phone?: string;
    fax?: string;
    email?: string;
    address?: string;
    addresses?: CompanyAddress[];
    tags?: string[];
    privacy?: CompanyPrivacy;
    customFields?: CompanyCustomField[];
  };
  newContacts: {
    name: string;
    title: string;
    email: string;
    phone?: string;
    mobile?: string;
    salutation?: string;
    firstName?: string;
    lastName?: string;
    category?: string;
    pronouns?: string;
    portal: "Enabled" | "Not Invited";
    primary?: boolean;
  }[];
  linkedContactIds: string[];
};

type ContactDraft = {
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  position: string;
  category: string;
  pronouns: string;
};

const emptyDraft = (): ContactDraft => ({
  salutation: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  mobile: "",
  position: "",
  category: "",
  pronouns: "",
});

function formatAddress(item: Omit<CompanyAddress, "id">) {
  return [item.line1, [item.city, item.region].filter(Boolean).join(", "), item.postal, item.country]
    .filter(Boolean)
    .join(", ");
}

export function CompanyCreateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: NewCompanyPayload) => void;
  onCancel: () => void;
}) {
  const companies = useAppStore((s) => s.companies);
  const contacts = useAppStore((s) => s.contacts);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<CompanyStatus>("Prospect");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [fax, setFax] = useState("");
  const [email, setEmail] = useState("");
  const [industry, setIndustry] = useState("");
  const [billingTerms, setBillingTerms] = useState("Net 30");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [customFields, setCustomFields] = useState<CompanyCustomField[]>([]);
  const [contactMode, setContactMode] = useState<"hidden" | "new" | "link">("hidden");
  const [draft, setDraft] = useState<ContactDraft>(emptyDraft());
  const [linkId, setLinkId] = useState("");
  const [stagedNew, setStagedNew] = useState<NewCompanyPayload["newContacts"]>([]);
  const [linkedIds, setLinkedIds] = useState<string[]>([]);
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressDraft, setAddressDraft] = useState({ line1: "", city: "", region: "", postal: "", country: "United States" });
  const [addresses, setAddresses] = useState<Omit<CompanyAddress, "id">[]>([]);
  const [managerQuery, setManagerQuery] = useState("");
  const [managers, setManagers] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<CompanyPrivacy>("Standard");

  const managerChoices = useMemo(() => {
    const names = new Set<string>();
    companies.forEach((company) => {
      names.add(company.accountManager);
      company.accountManagers?.forEach((item) => names.add(item));
    });
    ["Dillon Morgan", "M. Doyle", "J. Kim", "S. Cho", "J. Alvarez"].forEach((item) => names.add(item));
    const q = managerQuery.trim().toLowerCase();
    return [...names]
      .filter((item) => !managers.includes(item))
      .filter((item) => !q || item.toLowerCase().includes(q))
      .sort();
  }, [companies, managerQuery, managers]);

  const industryChoices = useMemo(() => {
    const names = new Set(INDUSTRIES);
    companies.forEach((company) => {
      if (company.industry) names.add(company.industry);
    });
    return [...names].sort();
  }, [companies]);

  function addCategory() {
    const next = categoryDraft.trim();
    if (!next || categories.includes(next)) return;
    setCategories((prev) => [...prev, next]);
    setCategoryDraft("");
  }

  function addCustomField() {
    if (!customLabel.trim()) return;
    setCustomFields((prev) => [
      ...prev,
      { id: `cf-${prev.length + 1}`, label: customLabel.trim(), value: customValue.trim() },
    ]);
    setCustomLabel("");
    setCustomValue("");
  }

  function addNewContact() {
    if (!draft.firstName.trim() || !draft.lastName.trim()) return;
    const fullName = `${draft.firstName.trim()} ${draft.lastName.trim()}`;
    setStagedNew((prev) => [
      ...prev,
      {
        name: fullName,
        title: draft.position.trim() || "Stakeholder",
        email: draft.email.trim() || `${draft.firstName.trim()}.${draft.lastName.trim()}@example.com`.toLowerCase(),
        phone: draft.phone.trim(),
        mobile: draft.mobile.trim(),
        salutation: draft.salutation,
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        category: draft.category,
        pronouns: draft.pronouns,
        portal: "Not Invited",
        primary: prev.length === 0 && linkedIds.length === 0,
      },
    ]);
    setDraft(emptyDraft());
    setContactMode("hidden");
  }

  function addLinkedContact() {
    if (!linkId || linkedIds.includes(linkId)) return;
    setLinkedIds((prev) => [...prev, linkId]);
    setLinkId("");
    setContactMode("hidden");
  }

  function addAddress() {
    if (!addressDraft.line1.trim()) return;
    setAddresses((prev) => [...prev, { ...addressDraft, line1: addressDraft.line1.trim() }]);
    setAddressDraft({ line1: "", city: "", region: "", postal: "", country: "United States" });
    setAddressOpen(false);
  }

  const stagedContacts = [
    ...stagedNew.map((item) => item.name),
    ...linkedIds.map((id) => contacts.find((item) => item.id === id)?.name ?? "Contact"),
  ];

  return (
    <form
      className="company-create"
      onSubmit={(e) => {
        e.preventDefault();
        const typedName = name.trim() || String(new FormData(e.currentTarget).get("companyName") || "").trim();
        if (!typedName) return;
        const storedAddresses: CompanyAddress[] = addresses.map((item, index) => ({
          id: `addr-${index + 1}`,
          ...item,
        }));
        onSubmit({
          company: {
            name: typedName,
            status,
            accountManager: managers[0] ?? "M. Doyle",
            accountManagers: managers.length ? managers : ["M. Doyle"],
            industry: industry.trim() || "Professional Services",
            billingTerms: billingTerms.trim() || "Net 30",
            website: website.trim(),
            phone: phone.trim(),
            fax: fax.trim(),
            email: email.trim(),
            address: storedAddresses[0] ? formatAddress(storedAddresses[0]) : "",
            addresses: storedAddresses,
            tags: categories.length ? categories : industry.trim() ? [industry.trim()] : [],
            privacy,
            customFields,
          },
          newContacts: stagedNew,
          linkedContactIds: linkedIds,
        });
      }}
    >
      <div className="company-create-top">
        <Field label="Name of company" required>
          <TextInput
            name="companyName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name of company"
            required
            autoFocus
          />
        </Field>
      </div>

      <div className="company-create-grid">
        <section className="company-create-col">
          <header>
            <Building2 size={16} />
            <h3>Company details</h3>
          </header>
          <div className="company-create-row">
            <Field label="Status" required>
              <TextSelect value={status} onChange={(e) => setStatus(e.target.value as CompanyStatus)}>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label="Website">
              <TextInput value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </Field>
          </div>
          <div className="company-create-row">
            <Field label="Phone">
              <TextInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Number" />
            </Field>
            <Field label="Fax">
              <TextInput type="tel" value={fax} onChange={(e) => setFax(e.target.value)} placeholder="Number" />
            </Field>
          </div>
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
          </Field>
          <Field label="Industry">
            <TextInput
              list="company-industry-options"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Search industry"
            />
            <datalist id="company-industry-options">
              {industryChoices.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </Field>
          <Field label="Billing terms">
            <TextSelect value={billingTerms} onChange={(e) => setBillingTerms(e.target.value)}>
              <option>Net 15</option>
              <option>Net 30</option>
              <option>Net 45</option>
              <option>Due on receipt</option>
            </TextSelect>
          </Field>
          <div className="company-create-block">
            <p>Categories</p>
            <span>Group companies for reporting and filters.</span>
            <div className="company-create-chips">
              {categories.map((item) => (
                <button key={item} type="button" className="pill pill-neutral" onClick={() => setCategories((prev) => prev.filter((tag) => tag !== item))}>
                  {item} <X size={12} />
                </button>
              ))}
            </div>
            <div className="company-create-inline">
              <TextInput value={categoryDraft} onChange={(e) => setCategoryDraft(e.target.value)} placeholder="Add a category" />
              <button type="button" className="btn btn-ghost" onClick={addCategory}>
                Add
              </button>
            </div>
          </div>
          <div className="company-create-block">
            <p>Custom fields</p>
            <span>Add extra details that belong on this company record.</span>
            {customFields.length ? (
              <ul className="company-create-list">
                {customFields.map((field) => (
                  <li key={field.id}>
                    <strong>{field.label}</strong>
                    <span>{field.value || "Empty"}</span>
                    <button type="button" aria-label={`Remove ${field.label}`} onClick={() => setCustomFields((prev) => prev.filter((item) => item.id !== field.id))}>
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="company-create-empty">No company custom fields</div>
            )}
            <div className="company-create-row">
              <TextInput value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Field name" />
              <TextInput value={customValue} onChange={(e) => setCustomValue(e.target.value)} placeholder="Value" />
            </div>
            <button type="button" className="btn btn-ghost" onClick={addCustomField}>
              Add field
            </button>
          </div>
        </section>

        <section className="company-create-col">
          <header>
            <Users size={16} />
            <h3>Contacts</h3>
            <div className="company-create-head-actions">
              <button type="button" onClick={() => setContactMode("link")}>
                <Link2 size={14} /> Link existing
              </button>
              <button type="button" onClick={() => setContactMode("new")}>
                <UserPlus size={14} /> Add new
              </button>
            </div>
          </header>
          {stagedContacts.length ? (
            <ul className="company-create-list">
              {stagedNew.map((item) => (
                <li key={item.email}>
                  <strong>{item.name}</strong>
                  <span>{item.title}</span>
                  <button type="button" aria-label={`Remove ${item.name}`} onClick={() => setStagedNew((prev) => prev.filter((row) => row.email !== item.email))}>
                    <X size={14} />
                  </button>
                </li>
              ))}
              {linkedIds.map((id) => {
                const contact = contacts.find((item) => item.id === id);
                return (
                  <li key={id}>
                    <strong>{contact?.name ?? "Contact"}</strong>
                    <span>{contact?.title ?? "Linked"}</span>
                    <button type="button" aria-label={`Remove ${contact?.name ?? "contact"}`} onClick={() => setLinkedIds((prev) => prev.filter((item) => item !== id))}>
                      <X size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : contactMode === "hidden" ? (
            <div className="company-create-empty">No contacts yet</div>
          ) : null}

          {contactMode === "link" ? (
            <div className="company-create-block">
              <Field label="Existing contact">
                <TextSelect value={linkId} onChange={(e) => setLinkId(e.target.value)}>
                  <option value="">Select a contact</option>
                  {contacts
                    .filter((item) => !linkedIds.includes(item.id))
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.companyName})
                      </option>
                    ))}
                </TextSelect>
              </Field>
              <div className="company-create-inline end">
                <button type="button" className="btn btn-ghost" onClick={() => setContactMode("hidden")}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={addLinkedContact} disabled={!linkId}>
                  Add
                </button>
              </div>
            </div>
          ) : null}

          {contactMode === "new" ? (
            <div className="company-create-block">
              <div className="company-create-row company-create-row-3">
                <Field label="Title">
                  <TextSelect value={draft.salutation} onChange={(e) => setDraft((prev) => ({ ...prev, salutation: e.target.value }))}>
                    {SALUTATIONS.map((item) => (
                      <option key={item || "none"} value={item}>
                        {item || "Select"}
                      </option>
                    ))}
                  </TextSelect>
                </Field>
                <Field label="First name" required>
                  <TextInput value={draft.firstName} onChange={(e) => setDraft((prev) => ({ ...prev, firstName: e.target.value }))} />
                </Field>
                <Field label="Last name" required>
                  <TextInput value={draft.lastName} onChange={(e) => setDraft((prev) => ({ ...prev, lastName: e.target.value }))} />
                </Field>
              </div>
              <Field label="Email address">
                <TextInput type="email" value={draft.email} onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))} />
              </Field>
              <div className="company-create-row">
                <Field label="Phone">
                  <TextInput type="tel" value={draft.phone} onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))} />
                </Field>
                <Field label="Mobile / cell">
                  <TextInput type="tel" value={draft.mobile} onChange={(e) => setDraft((prev) => ({ ...prev, mobile: e.target.value }))} />
                </Field>
              </div>
              <Field label="Position">
                <TextInput value={draft.position} onChange={(e) => setDraft((prev) => ({ ...prev, position: e.target.value }))} placeholder="VP Operations" />
              </Field>
              <div className="company-create-row">
                <Field label="Category">
                  <TextSelect value={draft.category} onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}>
                    {CONTACT_CATEGORIES.map((item) => (
                      <option key={item || "none"} value={item}>
                        {item || "Select"}
                      </option>
                    ))}
                  </TextSelect>
                </Field>
                <Field label="Pronouns">
                  <TextSelect value={draft.pronouns} onChange={(e) => setDraft((prev) => ({ ...prev, pronouns: e.target.value }))}>
                    {PRONOUNS.map((item) => (
                      <option key={item || "none"} value={item}>
                        {item || "Select"}
                      </option>
                    ))}
                  </TextSelect>
                </Field>
              </div>
              <div className="company-create-inline end">
                <button type="button" className="btn btn-ghost" onClick={() => setContactMode("hidden")}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={addNewContact}>
                  Add
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="company-create-col">
          <header>
            <MapPin size={16} />
            <h3>Address</h3>
            <div className="company-create-head-actions">
              <button type="button" onClick={() => setAddressOpen(true)}>
                <Plus size={14} /> Add new address
              </button>
            </div>
          </header>
          {addresses.length ? (
            <ul className="company-create-list">
              {addresses.map((item, index) => (
                <li key={`${item.line1}-${index}`}>
                  <strong>{formatAddress(item)}</strong>
                  <span>{item.country}</span>
                  <button type="button" aria-label={`Remove address ${index + 1}`} onClick={() => setAddresses((prev) => prev.filter((_, i) => i !== index))}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : !addressOpen ? (
            <div className="company-create-empty">No addresses</div>
          ) : null}
          {addressOpen ? (
            <div className="company-create-block">
              <Field label="Street">
                <TextInput value={addressDraft.line1} onChange={(e) => setAddressDraft((prev) => ({ ...prev, line1: e.target.value }))} />
              </Field>
              <div className="company-create-row">
                <Field label="City">
                  <TextInput value={addressDraft.city} onChange={(e) => setAddressDraft((prev) => ({ ...prev, city: e.target.value }))} />
                </Field>
                <Field label="State / region">
                  <TextInput value={addressDraft.region} onChange={(e) => setAddressDraft((prev) => ({ ...prev, region: e.target.value }))} />
                </Field>
              </div>
              <div className="company-create-row">
                <Field label="Postal code">
                  <TextInput value={addressDraft.postal} onChange={(e) => setAddressDraft((prev) => ({ ...prev, postal: e.target.value }))} />
                </Field>
                <Field label="Country">
                  <TextInput value={addressDraft.country} onChange={(e) => setAddressDraft((prev) => ({ ...prev, country: e.target.value }))} />
                </Field>
              </div>
              <div className="company-create-inline end">
                <button type="button" className="btn btn-ghost" onClick={() => setAddressOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={addAddress}>
                  Add
                </button>
              </div>
            </div>
          ) : null}

          <div className="company-create-block">
            <p>
              <Users size={14} /> Account managers
            </p>
            <span>Account managers stay up to date on logged activity and correspondence with company contacts.</span>
            <div className="company-create-chips">
              {managers.map((item) => (
                <button key={item} type="button" className="pill pill-neutral" onClick={() => setManagers((prev) => prev.filter((name) => name !== item))}>
                  {item} <X size={12} />
                </button>
              ))}
            </div>
            <TextInput value={managerQuery} onChange={(e) => setManagerQuery(e.target.value)} placeholder="Search" />
            {managerChoices.length ? (
              <ul className="company-create-suggest">
                {managerChoices.slice(0, 6).map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => {
                        setManagers((prev) => [...prev, item]);
                        setManagerQuery("");
                      }}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="company-create-block">
            <p>
              <Shield size={14} /> Privacy
            </p>
            <span>A confidential relationship means others can see when activity happens, not the subject or body.</span>
            <TextSelect value={privacy} onChange={(e) => setPrivacy(e.target.value as CompanyPrivacy)}>
              {PRIVACY.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </TextSelect>
          </div>
        </section>
      </div>

      <div className="company-create-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Create company
        </button>
      </div>
    </form>
  );
}
