"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ContactActions } from "@/components/contacts/ContactActions";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { Avatar, FilterChips, PageHeader, SideRail, StatusPill, statusTone } from "@/components/ui";
import { contactMatches, isPrimaryContact } from "@/lib/contacts";
import { exportCsv } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

const FILTERS = ["All Contacts", "Primary", "Portal Enabled", "Not Invited"];

export default function ContactsPage() {
  const contacts = useAppStore((s) => s.contacts);
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const recentlyViewed = useAppStore((s) => s.recentlyViewed);
  const focusCompanyId = useAppStore((s) => s.focusCompanyId);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [query, setQuery] = useState("");
  const [companyId, setCompanyId] = useState("all");
  const [createKind, setCreateKind] = useState<CreateKind>(null);

  const rows = useMemo(() => {
    return contacts.filter((c) => {
      if (!contactMatches(c, query)) return false;
      if (companyId !== "all" && c.companyId !== companyId) return false;
      const company = companies.find((co) => co.id === c.companyId);
      if (filter === "Primary") return isPrimaryContact(c, company);
      if (filter === "Portal Enabled") return c.portal === "Enabled";
      if (filter === "Not Invited") return c.portal === "Not Invited";
      return true;
    });
  }, [contacts, companies, filter, query, companyId]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Contacts"
        subtitle="Everyone you work with, across every client company."
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                exportCsv(
                  "contacts.csv",
                  rows.map((c) => ({
                    name: c.name,
                    company: c.companyName,
                    title: c.title,
                    email: c.email,
                    phone: c.phone ?? "",
                    portal: c.portal,
                  })),
                )
              }
            >
              Export CSV
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setCreateKind("contact")}>
              <Plus size={16} /> New Contact
            </button>
          </>
        }
      />
      <div className="mb-3 flex gap-4 text-sm">
        {["Companies", "Contacts"].map((tab) => (
          <Link
            key={tab}
            href={tab === "Contacts" ? "/app/contacts" : "/app/companies"}
            className={
              tab === "Contacts"
                ? "border-b-2 border-[var(--color-navy)] pb-1 font-semibold text-[var(--color-navy)]"
                : "text-[var(--color-muted)]"
            }
          >
            {tab}
          </Link>
        ))}
      </div>
      <div className="contacts-toolbar">
        <input
          className="field-input contacts-search"
          placeholder="Search name, company, email, or title"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="field-input contacts-company" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          <option value="all">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <FilterChips items={FILTERS} active={filter} onChange={setFilter} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="panel overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Title</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Portal</th>
                <th>Last Interaction</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const company = companies.find((co) => co.id === c.companyId);
                const primary = isPrimaryContact(c, company);
                const projectCount = c.projectIds?.length
                  ?? projects.filter((p) => p.companyId === c.companyId).length;
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center justify-between gap-3">
                        <Link href={`/app/contacts/view/?id=${c.id}`} className="flex items-center gap-3 font-medium text-[var(--color-navy)]">
                          <Avatar initials={c.initials} name={c.name} />
                          <span>
                            {c.name}
                            {primary ? <span className="ml-2 text-xs text-[var(--color-muted)]">Primary</span> : null}
                            <div className="text-xs font-normal text-[var(--color-muted)]">{projectCount} projects</div>
                          </span>
                        </Link>
                        <ContactActions contact={c} compact />
                      </div>
                    </td>
                    <td>
                      <Link href={`/app/companies/view/?id=${c.companyId}`} className="text-[var(--color-navy)] hover:underline">
                        {c.companyName}
                      </Link>
                    </td>
                    <td>{c.title}</td>
                    <td className="text-[var(--color-muted)]">{c.email}</td>
                    <td className="contacts-phone text-[var(--color-muted)]">{c.phone || "None"}</td>
                    <td>
                      <StatusPill tone={statusTone(c.portal)}>{c.portal}</StatusPill>
                    </td>
                    <td>{c.lastInteraction}</td>
                  </tr>
                );
              })}
              {!rows.length ? (
                <tr>
                    <td colSpan={7} className="text-[var(--color-muted)]">
                    No contacts match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <SideRail title="Recently Viewed">
            {recentlyViewed
              .filter((r) => r.type === "contact")
              .map((r) => {
                const c = contacts.find((x) => x.id === r.id);
                if (!c) return null;
                return (
                  <Link key={r.id} href={`/app/contacts/view/?id=${c.id}`} className="mb-2 flex items-center gap-2 text-sm">
                    <Avatar initials={c.initials} name={c.name} size={26} />
                    {c.name}
                  </Link>
                );
              })}
            {!recentlyViewed.some((r) => r.type === "contact")
              ? contacts.slice(0, 3).map((c) => (
                  <Link key={c.id} href={`/app/contacts/view/?id=${c.id}`} className="mb-2 flex items-center gap-2 text-sm">
                    <Avatar initials={c.initials} name={c.name} size={26} />
                    {c.name}
                  </Link>
                ))
              : null}
          </SideRail>
          <SideRail title="Shortcuts">
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" className="hover:underline" onClick={() => setFilter("Primary")}>
                  Primary contacts
                </button>
              </li>
              <li>
                <button type="button" className="hover:underline" onClick={() => setFilter("Portal Enabled")}>
                  Portal enabled
                </button>
              </li>
              <li>
                <button type="button" className="hover:underline" onClick={() => setCreateKind("contact")}>
                  Invite contact
                </button>
              </li>
            </ul>
          </SideRail>
        </div>
      </div>
      <CreateForms kind={createKind} defaults={{ companyId: focusCompanyId ?? undefined }} onClose={() => setCreateKind(null)} />
    </div>
  );
}
