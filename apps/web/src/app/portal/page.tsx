"use client";

import { milestones, projects, tickets, invoices } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { PageHeader, ProgressBar, StatusPill, statusTone } from "@/components/ui";

export default function PortalHomePage() {
  const { user } = useAuth();
  const companyProjects = projects.filter(
    (p) => p.companyId === user?.companyId && p.portalShared,
  );
  const openTickets = tickets.filter(
    (t) => t.companyId === user?.companyId && t.status !== "Resolved",
  );
  const recentInvoices = invoices.filter((i) => i.companyId === user?.companyId).slice(0, 2);

  return (
    <div className="fade-in">
      <PageHeader
        title="My Projects"
        subtitle={`Welcome back, ${user?.name.split(" ")[0]}. Here is what is happening across your Cascade Ventures projects.`}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <div className="panel overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Progress</th>
                  <th>Next Milestone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {companyProjects.map((p) => {
                  const next = milestones.find(
                    (m) => m.projectId === p.id && m.status !== "Approved",
                  );
                  const portalStatus =
                    p.id === "p-website" ? "Awaiting Your Review" : p.status;
                  return (
                    <tr key={p.id}>
                      <td className="font-medium text-[var(--color-navy)]">{p.name}</td>
                      <td><ProgressBar value={p.progress} /></td>
                      <td className="text-sm text-[var(--color-muted)]">
                        {next ? `${next.name} · ${next.due}` : "None"}
                      </td>
                      <td>
                        <StatusPill tone={statusTone(portalStatus)}>{portalStatus}</StatusPill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="panel overflow-hidden">
            <div className="px-4 pt-4 text-xs font-semibold tracking-[0.08em] text-[var(--color-muted)] uppercase">
              Open Support Tickets
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {openTickets.map((t) => (
                  <tr key={t.id}>
                    <td>#{t.number} {t.subject}</td>
                    <td>{t.submitted}</td>
                    <td><StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-4">
          <div className="panel p-4">
            <div className="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--color-muted)] uppercase">
              Your Recent Invoices
            </div>
            <ul className="space-y-3 text-sm">
              {recentInvoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-2">
                  <span>{inv.number}</span>
                  <StatusPill tone={statusTone(inv.status)}>{inv.status}</StatusPill>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-4">
            <div className="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--color-muted)] uppercase">
              Need Help?
            </div>
            <button type="button" className="btn btn-primary w-full justify-center">
              + Raise a Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
