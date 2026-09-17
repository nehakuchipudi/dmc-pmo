"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilterChips, PageHeader, StatusPill, statusTone } from "@/components/ui";
import { money } from "@/lib/seed";
import { exportCsv } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

const DASHBOARDS = [
  { name: "Schedule Dashboard", key: "schedule" },
  { name: "Utilization Dashboard", key: "utilization" },
  { name: "Profitability Dashboard", key: "profitability", href: "/app/reports/profitability" },
  { name: "My Work Dashboard", key: "work" },
  { name: "Company Dashboard", key: "company" },
  { name: "Sales Dashboard", key: "sales" },
  { name: "Projects Dashboard", key: "projects" },
  { name: "Tickets Dashboard", key: "tickets" },
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
  const [active, setActive] = useState("utilization");
  const projects = useAppStore((s) => s.projects);
  const tickets = useAppStore((s) => s.tickets);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const invoices = useAppStore((s) => s.invoices);
  const companies = useAppStore((s) => s.companies);
  const retainers = useAppStore((s) => s.retainers);
  const tasks = useAppStore((s) => s.tasks);

  const insights = useMemo(() => {
    const openTickets = tickets.filter((t) => t.status !== "Resolved").length;
    const atRisk = projects.filter((p) => p.status === "At Risk" || p.status === "On Hold").length;
    const hours = timeEntries.reduce((s, e) => s + e.hours, 0);
    const billed = invoices.filter((i) => i.status !== "Draft").reduce((s, i) => s + i.amount, 0);
    const util = projects.length
      ? Math.round(
          (projects.reduce((s, p) => s + p.loggedHours / Math.max(p.budgetHours, 1), 0) / projects.length) * 100,
        )
      : 0;
    return { openTickets, atRisk, hours, billed, util };
  }, [tickets, projects, timeEntries, invoices]);

  const categoryBody = useMemo(() => {
    switch (category) {
      case "Finance & Accounting":
        return invoices.map((i) => ({ label: i.number, meta: `${i.companyName} · ${money(i.amount)}`, status: i.status }));
      case "Project Management":
        return projects.map((p) => ({ label: p.name, meta: `${p.companyName} · ${p.progress}%`, status: p.status }));
      case "Retainer Management":
        return retainers.map((r) => ({
          label: r.name,
          meta: `${r.usedHours}/${r.budgetHours} hrs · ${r.companyName}`,
          status: r.status,
        }));
      case "Ticket Management":
        return tickets.map((t) => ({ label: `#${t.number} ${t.subject}`, meta: t.companyName, status: t.status }));
      case "Task Management":
        return tasks.slice(0, 8).map((t) => ({ label: t.name, meta: t.projectName, status: t.status }));
      case "Time & Expenses":
        return timeEntries.map((e) => ({
          label: `${e.userName} · ${e.hours}h`,
          meta: `${e.projectName} · ${e.date}`,
          status: e.status,
        }));
      case "Sales":
        return companies
          .filter((c) => c.status === "Prospect")
          .map((c) => ({ label: c.name, meta: c.industry, status: c.status }));
      default:
        return companies.map((c) => ({
          label: c.name,
          meta: `${c.openProjects} projects · ${c.openTickets} tickets`,
          status: c.status,
        }));
    }
  }, [category, invoices, projects, retainers, tickets, tasks, timeEntries, companies]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Reports"
        subtitle="Dashboards and live aggregations from your working data."
        actions={
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              exportCsv("report-snapshot.csv", [
                { metric: "Open tickets", value: insights.openTickets },
                { metric: "At-risk projects", value: insights.atRisk },
                { metric: "Logged hours", value: insights.hours },
                { metric: "Billed", value: insights.billed },
                { metric: "Utilization", value: insights.util },
              ])
            }
          >
            Export CSV
          </button>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARDS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => {
              if (d.href) window.location.href = d.href;
              else setActive(d.key);
            }}
            className={`panel block overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] ${
              active === d.key ? "ring-2 ring-[var(--color-gold)]" : ""
            }`}
          >
            <div className="h-24 bg-[var(--color-fog)]" />
            <div className="p-3 text-sm font-semibold text-[var(--color-navy)]">{d.name}</div>
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Open tickets" value={String(insights.openTickets)} />
        <Kpi label="At-risk / overdue projects" value={String(insights.atRisk)} />
        <Kpi label="Logged hours" value={`${insights.hours.toFixed(1)}h`} />
        <Kpi label="Utilization (portfolio)" value={`${insights.util}%`} />
      </div>

      {active === "schedule" ? (
        <div className="panel p-4">
          <h2 className="mb-3 text-lg font-semibold">Schedule</h2>
          <ul className="space-y-2 text-sm">
            {tasks
              .filter((t) => t.status !== "Done")
              .slice(0, 8)
              .map((t) => (
                <li key={t.id} className="flex justify-between gap-3 border-b border-[var(--color-border)] pb-2">
                  <span>
                    {t.name} <span className="text-[var(--color-muted)]">· {t.assignee}</span>
                  </span>
                  <span className="text-[var(--color-navy)]">{t.due}</span>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      {active === "utilization" || active === "work" || active === "company" || active === "sales" || active === "projects" || active === "tickets" ? (
        <div className="panel mb-6 overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 py-3 text-sm font-semibold capitalize">
            {active} snapshot
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Detail</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(active === "tickets"
                ? tickets.map((t) => ({ id: t.id, label: `#${t.number} ${t.subject}`, detail: t.companyName, status: t.status }))
                : active === "projects" || active === "company"
                  ? projects.map((p) => ({ id: p.id, label: p.name, detail: `${p.loggedHours}/${p.budgetHours}h · ${p.companyName}`, status: p.status }))
                  : active === "sales"
                    ? companies.filter((c) => c.status === "Prospect").map((c) => ({ id: c.id, label: c.name, detail: c.industry, status: c.status }))
                    : timeEntries.map((e) => ({
                        id: e.id,
                        label: `${e.userName} · ${e.hours}h`,
                        detail: e.projectName,
                        status: e.status,
                      }))
              ).map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.label}</td>
                  <td className="text-[var(--color-muted)]">{row.detail}</td>
                  <td>
                    <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        Report Categories
      </div>
      <FilterChips items={CATEGORIES} active={category} onChange={setCategory} />
      <div className="panel overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-4 py-3 text-sm">
          Showing live rows for <strong className="text-[var(--color-navy)]">{category}</strong>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Detail</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {categoryBody.map((row) => (
              <tr key={row.label + row.meta}>
                <td className="font-medium">{row.label}</td>
                <td className="text-[var(--color-muted)]">{row.meta}</td>
                <td>
                  <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-[var(--color-muted)]">
        Need margin detail? Open the{" "}
        <Link href="/app/reports/profitability" className="text-[var(--color-navy)] underline">
          Profitability Dashboard
        </Link>
        .
      </p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[var(--color-navy)]">{value}</div>
    </div>
  );
}
