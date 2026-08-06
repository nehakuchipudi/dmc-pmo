"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { companies } from "@/lib/data";
import {
  Avatar,
  FilterChips,
  PageHeader,
  SideRail,
  StatusPill,
  statusTone,
} from "@/components/ui";

const FILTERS = [
  "All Active Companies",
  "Recently Created",
  "Managed By Me",
  "Classic Lists",
];

export default function CompaniesPage() {
  const [filter, setFilter] = useState(FILTERS[0]);
  const rows = useMemo(() => {
    if (filter === "Managed By Me") {
      return companies.filter((c) => c.accountManager === "M. Doyle");
    }
    if (filter === "Recently Created") return [...companies].reverse();
    return companies.filter((c) => c.status !== "Prospect" || filter !== "All Active Companies")
      .filter((c) => (filter === "All Active Companies" ? c.status === "Active" || c.status === "Overdue Inv." : true));
  }, [filter]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Companies"
        subtitle="Manage every client account in one place."
        actions={
          <button type="button" className="btn btn-primary">
            <Plus size={16} /> New Company
          </button>
        }
      />
      <div className="mb-3 flex gap-4 text-sm">
        {["Companies", "Contacts", "Assets", "Quick Links"].map((tab, i) => (
          <Link
            key={tab}
            href={tab === "Contacts" ? "/app/contacts" : "/app/companies"}
            className={i === 0 ? "font-semibold text-[var(--color-navy)] border-b-2 border-[var(--color-navy)] pb-1" : "text-[var(--color-muted)]"}
          >
            {tab}
          </Link>
        ))}
      </div>
      <FilterChips items={FILTERS} active={filter} onChange={setFilter} />
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Status</th>
                <th>Account Manager</th>
                <th>Open Projects</th>
                <th>Open Tickets</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/app/companies/${c.id}`} className="flex items-center gap-3 font-medium text-[var(--color-navy)]">
                      <Avatar initials={c.initials} />
                      {c.name}
                    </Link>
                  </td>
                  <td>
                    <StatusPill tone={statusTone(c.status)}>{c.status}</StatusPill>
                  </td>
                  <td>{c.accountManager}</td>
                  <td>{c.openProjects}</td>
                  <td>{c.openTickets}</td>
                  <td className="text-[var(--color-muted)]">{c.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <SideRail title="Recently Viewed">
            <div className="space-y-3">
              {companies.slice(0, 3).map((c) => (
                <Link key={c.id} href={`/app/companies/${c.id}`} className="flex items-center gap-2 text-sm">
                  <Avatar initials={c.initials} />
                  <span>{c.name}</span>
                </Link>
              ))}
            </div>
          </SideRail>
          <SideRail title="Shortcuts">
            <ul className="space-y-2 text-sm text-[var(--color-navy)]">
              {[
                "Company Invoice",
                "Stream",
                "Companies Dashboard",
                "Reports",
                "Company Timesheet Overview",
                "Invoice Statements",
              ].map((s) => (
                <li key={s}>
                  <button type="button" className="hover:underline">{s}</button>
                </li>
              ))}
            </ul>
          </SideRail>
        </div>
      </div>
    </div>
  );
}
