"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { Avatar, FilterChips, PageHeader, SideRail, StatusPill, statusTone } from "@/components/ui";
import { exportCsv } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

const FILTERS = [
  "All Active Contacts",
  "Recently Created",
  "Portal Enabled",
  "Not Invited",
];

export default function ContactsPage() {
  const contacts = useAppStore((s) => s.contacts);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [createKind, setCreateKind] = useState<CreateKind>(null);

  const rows = useMemo(() => {
    if (filter === "Portal Enabled") return contacts.filter((c) => c.portal === "Enabled");
    if (filter === "Not Invited") return contacts.filter((c) => c.portal === "Not Invited");
    if (filter === "Recently Created") return [...contacts];
    return contacts;
  }, [filter, contacts]);

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
      <FilterChips items={FILTERS} active={filter} onChange={setFilter} />
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Title</th>
                <th>Email</th>
                <th>Portal</th>
                <th>Last Interaction</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="flex items-center gap-3 font-medium">
                    <Avatar initials={c.initials} />
                    {c.name}
                  </td>
                  <td>{c.companyName}</td>
                  <td>{c.title}</td>
                  <td className="text-[var(--color-muted)]">{c.email}</td>
                  <td>
                    <StatusPill tone={statusTone(c.portal)}>{c.portal}</StatusPill>
                  </td>
                  <td>{c.lastInteraction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <SideRail title="Recently Viewed">
            {contacts.slice(0, 3).map((c) => (
              <div key={c.id} className="mb-2 flex items-center gap-2 text-sm">
                <Avatar initials={c.initials} />
                {c.name}
              </div>
            ))}
          </SideRail>
          <SideRail title="Shortcuts">
            <ul className="space-y-2 text-sm">
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
      <CreateForms kind={createKind} onClose={() => setCreateKind(null)} />
    </div>
  );
}
