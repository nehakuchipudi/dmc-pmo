"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import {
  Avatar,
  FilterChips,
  PageHeader,
  SideRail,
  StatusPill,
  statusTone,
} from "@/components/ui";
import { IfCan } from "@/components/auth/IfCan";
import { exportCsv } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

const FILTERS = [
  "All Active Companies",
  "Recently Created",
  "Managed By Me",
  "Prospects",
];

export default function CompaniesPage() {
  const companies = useAppStore((s) => s.companies);
  const recentlyViewed = useAppStore((s) => s.recentlyViewed);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [createKind, setCreateKind] = useState<CreateKind>(null);

  const rows = useMemo(() => {
    if (filter === "Managed By Me") return companies.filter((c) => c.accountManager === "M. Doyle");
    if (filter === "Recently Created") return [...companies];
    if (filter === "Prospects") return companies.filter((c) => c.status === "Prospect");
    return companies.filter((c) => c.status === "Active" || c.status === "Overdue Inv.");
  }, [filter, companies]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Companies"
        subtitle="Manage every client account in one place."
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                exportCsv(
                  "companies.csv",
                  rows.map((c) => ({
                    name: c.name,
                    status: c.status,
                    manager: c.accountManager,
                    projects: c.openProjects,
                    tickets: c.openTickets,
                  })),
                )
              }
            >
              Export CSV
            </button>
            <IfCan cap="create_company">
              <button type="button" className="btn btn-primary" onClick={() => setCreateKind("company")}>
                <Plus size={16} /> New Company
              </button>
            </IfCan>
          </>
        }
      />
      <div className="mb-3 flex gap-4 text-sm">
        {["Companies", "Contacts"].map((tab, i) => (
          <Link
            key={tab}
            href={tab === "Contacts" ? "/app/contacts" : "/app/companies"}
            className={
              i === 0
                ? "border-b-2 border-[var(--color-navy)] pb-1 font-semibold text-[var(--color-navy)]"
                : "text-[var(--color-muted)]"
            }
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
                    <Link
                      href={`/app/companies/view/?id=${c.id}`}
                      className="flex items-center gap-3 font-medium text-[var(--color-navy)]"
                    >
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
              {recentlyViewed
                .filter((r) => r.type === "company")
                .map((r) => {
                  const c = companies.find((x) => x.id === r.id);
                  return (
                    <Link
                      key={r.id}
                      href={`/app/companies/view/?id=${r.id}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Avatar initials={c?.initials ?? "?"} />
                      <span>{r.label}</span>
                    </Link>
                  );
                })}
            </div>
          </SideRail>
          <SideRail title="Shortcuts">
            <ul className="space-y-2 text-sm text-[var(--color-navy)]">
              <li>
                <Link href="/app/billing" className="hover:underline">
                  Company invoices
                </Link>
              </li>
              <li>
                <Link href="/app/reports" className="hover:underline">
                  Companies dashboard
                </Link>
              </li>
              <li>
                <Link href="/app/timesheets" className="hover:underline">
                  Company timesheet overview
                </Link>
              </li>
              <li>
                <button type="button" className="hover:underline" onClick={() => setFilter("Managed By Me")}>
                  Managed by me
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
