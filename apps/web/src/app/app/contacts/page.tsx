"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { contacts } from "@/lib/data";
import { Avatar, FilterChips, PageHeader, SideRail, StatusPill, statusTone } from "@/components/ui";

const FILTERS = [
  "All Active Contacts",
  "Recently Created",
  "Recent Interaction",
  "Managed By Me",
  "Classic Lists",
];

export default function ContactsPage() {
  const [filter, setFilter] = useState(FILTERS[0]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Contacts"
        subtitle="Everyone you work with, across every client company."
        actions={
          <button type="button" className="btn btn-primary">
            <Plus size={16} /> New Contact
          </button>
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
              {contacts.map((c) => (
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
            {contacts.slice(0, 2).map((c) => (
              <div key={c.id} className="mb-2 flex items-center gap-2 text-sm">
                <Avatar initials={c.initials} />
                {c.name}
              </div>
            ))}
          </SideRail>
          <SideRail title="Shortcuts">
            <ul className="space-y-2 text-sm">
              {["My Inbox", "Stream", "Reports"].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </SideRail>
        </div>
      </div>
    </div>
  );
}
