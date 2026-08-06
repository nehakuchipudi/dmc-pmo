"use client";

import Link from "next/link";
import { useState } from "react";
import { FilterChips, PageHeader } from "@/components/ui";

const DASHBOARDS = [
  "Schedule Dashboard",
  "Utilization Dashboard",
  "Profitability Dashboard",
  "My Work Dashboard",
  "Company Dashboard",
  "Sales Dashboard",
  "Projects Dashboard",
  "Tickets Dashboard",
];

const CATEGORIES = [
  "Client Management",
  "Finance & Accounting",
  "Project Management",
  "Retainer Management",
  "Sales",
  "Task Management",
  "Ticket Management",
  "Time & Expenses",
];

export default function ReportsPage() {
  const [category, setCategory] = useState(CATEGORIES[0]);

  return (
    <div className="fade-in">
      <PageHeader title="Reports" subtitle="Dashboards & report library." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARDS.map((name) => {
          const href =
            name === "Profitability Dashboard"
              ? "/app/reports/profitability"
              : "/app/reports";
          return (
            <Link key={name} href={href} className="panel block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
              <div className="h-24 bg-gradient-to-br from-[var(--color-gold-soft)]/50 to-[var(--color-navy)]/15" />
              <div className="p-3 text-sm font-semibold text-[var(--color-navy)]">{name}</div>
            </Link>
          );
        })}
      </div>
      <div className="mb-2 text-xs font-semibold tracking-[0.08em] text-[var(--color-muted)] uppercase">
        Report Categories
      </div>
      <FilterChips items={CATEGORIES} active={category} onChange={setCategory} />
      <div className="panel p-4 text-sm text-[var(--color-muted)]">
        Showing templates for <strong className="text-[var(--color-navy)]">{category}</strong>. Full warehouse-backed catalog ships in Phase 4.
      </div>
    </div>
  );
}
