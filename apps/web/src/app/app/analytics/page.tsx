"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MetricCard, MetricGrid } from "@/components/ppm/PpmWidgets";
import { PageHeader } from "@/components/ui";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

export default function AnalyticsPage() {
  const projects = useAppStore((s) => s.projects);
  const tickets = useAppStore((s) => s.tickets);
  const invoices = useAppStore((s) => s.invoices);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const workOrders = useAppStore((s) => s.workOrders);
  const companies = useAppStore((s) => s.companies);

  const stats = useMemo(() => {
    const hours = timeEntries.reduce((sum, row) => sum + row.hours, 0);
    const billed = invoices.filter((row) => row.status !== "Draft").reduce((sum, row) => sum + row.amount, 0);
    const openTickets = tickets.filter((row) => row.status !== "Resolved").length;
    const atRisk = projects.filter((row) => row.status === "At Risk" || row.status === "On Hold").length;
    const fieldOpen = workOrders.filter((row) => row.status !== "Completed").length;
    const pending = workOrders.filter((row) => row.status === "Pending approval").length;
    return { hours, billed, openTickets, atRisk, fieldOpen, pending, companies: companies.length, projects: projects.length };
  }, [projects, tickets, invoices, timeEntries, workOrders, companies]);

  return (
    <div className="fade-in">
      <PageHeader title="Analytics" subtitle="Performance across projects, field jobs, time, and cash." />
      <MetricGrid>
        <MetricCard label="Projects" value={stats.projects} hint={`${stats.atRisk} at risk or on hold`} />
        <MetricCard label="Field jobs" value={stats.fieldOpen} hint={`${stats.pending} waiting on approval`} />
        <MetricCard label="Hours logged" value={`${stats.hours}h`} hint="Approved and draft time" />
        <MetricCard label="Billed" value={money(stats.billed)} hint="Invoices past draft" />
        <MetricCard label="Open tickets" value={stats.openTickets} hint={`${stats.companies} companies on the book`} />
      </MetricGrid>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link href="/app/reports" className="panel panel-hover p-4">
          <div className="font-semibold">Open reports</div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Schedule, utilization, profitability, and company views.</p>
        </Link>
        <Link href="/app/work-orders" className="panel panel-hover p-4">
          <div className="font-semibold">Open field jobs</div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Work orders and the approval queue.</p>
        </Link>
      </div>
    </div>
  );
}
