"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { MetricCard, MetricGrid, Pill } from "@/components/ppm/PpmWidgets";
import { allocationByMember, blockedDependencies, openHighRisks, portfolioMetrics } from "@/lib/ppm";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

type Insight = { id: string; title: string; body: string; href: string; severity: "Watch" | "Critical" | "Healthy"; tag: string };

export default function InsightsPage() {
  const projects = useAppStore((s) => s.projects);
  const portfolios = useAppStore((s) => s.portfolios);
  const risks = useAppStore((s) => s.risks);
  const allocations = useAppStore((s) => s.allocations);
  const dependencies = useAppStore((s) => s.dependencies);
  const gates = useAppStore((s) => s.gates);
  const benefits = useAppStore((s) => s.benefits);
  const invoices = useAppStore((s) => s.invoices);
  const [query, setQuery] = useState("");

  const insights = useMemo<Insight[]>(() => {
    const rows: Insight[] = [];
    const delivery = portfolios.find((p) => p.id === "pf-delivery");
    if (delivery) {
      const m = portfolioMetrics(delivery, projects);
      rows.push({
        id: "book",
        title: `${delivery.name} is ${m.health.toLowerCase()}`,
        body: `${m.items.length} projects, ${m.atRisk} need attention, blended margin ${m.margin}%, ${m.hoursUsed} of ${m.hoursBudget} hours used.`,
        href: `/app/portfolios/view/?id=${delivery.id}`,
        severity: m.health === "Healthy" ? "Healthy" : m.health,
        tag: "Portfolio",
      });
    }
    for (const project of projects.filter((p) => p.status === "At Risk" || p.status === "Overdue")) {
      rows.push({
        id: `p-${project.id}`,
        title: `${project.name} is ${project.status.toLowerCase()}`,
        body: `${project.progress}% complete, ${project.loggedHours}/${project.budgetHours} hours, margin ${project.marginPct}%. Manager ${project.manager}.`,
        href: `/app/projects/view/?id=${project.id}`,
        severity: project.status === "Overdue" ? "Critical" : "Watch",
        tag: "Delivery",
      });
    }
    for (const person of allocationByMember(allocations).filter((p) => p.pct > 100)) {
      rows.push({
        id: `cap-${person.id}`,
        title: `${person.name} is allocated at ${person.pct}%`,
        body: `${person.count} assignments, ${person.hours} hours this week. A new project will steal time from an in-flight one.`,
        href: "/app/resources",
        severity: "Critical",
        tag: "Capacity",
      });
    }
    for (const risk of openHighRisks(risks)) {
      rows.push({
        id: `rk-${risk.id}`,
        title: risk.title,
        body: `${risk.probability} likelihood, ${risk.impact} impact. ${risk.mitigation}`,
        href: "/app/risks",
        severity: risk.impact === "Critical" ? "Critical" : "Watch",
        tag: "Risk",
      });
    }
    for (const dep of blockedDependencies(dependencies)) {
      rows.push({
        id: `dep-${dep.id}`,
        title: `${dep.type} dependency is ${dep.status.toLowerCase()}`,
        body: dep.note,
        href: "/app/dependencies",
        severity: dep.status === "Blocked" ? "Critical" : "Watch",
        tag: "Dependency",
      });
    }
    const pending = gates.filter((g) => g.status === "In Review");
    if (pending.length) {
      rows.push({
        id: "gates",
        title: `${pending.length} governance gates wait for a decision`,
        body: pending.map((g) => g.name).join(", "),
        href: "/app/governance",
        severity: "Watch",
        tag: "Governance",
      });
    }
    const weakBenefits = benefits.filter((b) => b.progress < 50);
    if (weakBenefits.length) {
      rows.push({
        id: "ben",
        title: `${weakBenefits.length} benefits are behind target`,
        body: weakBenefits.map((b) => `${b.name} (${b.progress}%)`).join(", "),
        href: "/app/benefits",
        severity: "Watch",
        tag: "Value",
      });
    }
    const overdue = invoices.filter((i) => i.status === "Overdue");
    if (overdue.length) {
      rows.push({
        id: "cash",
        title: `${overdue.length} invoices are overdue`,
        body: `${money(overdue.reduce((s, i) => s + i.amount, 0))} sitting outside terms.`,
        href: "/app/billing",
        severity: "Critical",
        tag: "Cash",
      });
    }
    return rows;
  }, [portfolios, projects, allocations, risks, dependencies, gates, benefits, invoices]);

  const filtered = insights.filter((i) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${i.title} ${i.body} ${i.tag}`.toLowerCase().includes(q);
  });

  return (
    <div className="fade-in">
      <PageHeader
        title="Portfolio insights"
        subtitle="A scoring pass over the live store: delivery health, capacity, risk, cash, and benefits. Model-backed narrative analysis can sit on this same surface later."
      />
      <MetricGrid>
        <MetricCard label="Signals" value={insights.length} />
        <MetricCard label="Critical" value={insights.filter((i) => i.severity === "Critical").length} tone="bad" />
        <MetricCard label="Watch" value={insights.filter((i) => i.severity === "Watch").length} tone="warn" />
        <MetricCard label="Healthy" value={insights.filter((i) => i.severity === "Healthy").length} tone="good" />
        <MetricCard label="Shown" value={filtered.length} hint="Matches the filter below" />
      </MetricGrid>
      <input
        className="field-input mb-4"
        placeholder="Ask the book: margin, Cascade, capacity, gates..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="space-y-3">
        {filtered.map((insight) => (
          <Link key={insight.id} href={insight.href} className="insight-card block">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-semibold">{insight.title}</div>
              <div className="flex gap-2">
                <Pill value={insight.tag} />
                <Pill value={insight.severity} />
              </div>
            </div>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{insight.body}</p>
          </Link>
        ))}
        {!filtered.length ? <p className="text-sm text-[var(--color-muted)]">No signals match that question.</p> : null}
      </div>
    </div>
  );
}
