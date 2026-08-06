"use client";

import { PageHeader, StatusPill } from "@/components/ui";

const RETAINERS = [
  {
    company: "Cascade Ventures",
    name: "Monthly Managed Support",
    period: "Aug 1 to Aug 31, 2026",
    used: "28 / 40 hrs",
    status: "Active",
  },
  {
    company: "Northridge Retail Group",
    name: "SEO Retainer",
    period: "Aug 1 to Aug 31, 2026",
    used: "12 / 20 hrs",
    status: "Active",
  },
];

export default function RetainersPage() {
  return (
    <div className="fade-in">
      <PageHeader
        title="Retainers"
        subtitle="Recurring contracts with period budgets, allocation, and usage."
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Retainer</th>
              <th>Company</th>
              <th>Period</th>
              <th>Usage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {RETAINERS.map((r) => (
              <tr key={r.name}>
                <td className="font-medium text-[var(--color-navy)]">{r.name}</td>
                <td>{r.company}</td>
                <td>{r.period}</td>
                <td>{r.used}</td>
                <td><StatusPill tone="success">{r.status}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
