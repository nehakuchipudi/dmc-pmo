"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { companyActivities, companies, projects } from "@/lib/data";
import { Avatar, PageHeader, ProgressBar, SideRail, StatusPill, statusTone } from "@/components/ui";

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const company = companies.find((c) => c.id === params.id) ?? companies[0];
  const companyProjects = projects.filter((p) => p.companyId === company.id);
  const activity = companyActivities[company.id] ?? [];

  return (
    <div className="fade-in">
      <div className="mb-2 text-sm text-[var(--color-muted)]">
        <Link href="/app/companies">Companies</Link> / {company.name}
      </div>
      <PageHeader
        title={company.name}
        subtitle={`Active · Account Manager: ${company.accountManager} · ${company.openProjects} open projects`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost">+ New Ticket</button>
            <button type="button" className="btn btn-ghost">+ New Project</button>
            <button type="button" className="btn btn-primary">Log Time</button>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        {["Overview", "Contacts", "Projects", "Tickets", "Retainers", "Billing", "Files", "Activity Stream"].map(
          (tab, i) => (
            <span
              key={tab}
              className={i === 0 ? "font-semibold text-[var(--color-navy)] border-b-2 border-[var(--color-navy)] pb-1" : "text-[var(--color-muted)]"}
            >
              {tab}
            </span>
          ),
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="panel p-4">
            <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Open Projects</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Manager</th>
                  <th>Progress</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {companyProjects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/app/projects/${p.id}`} className="font-medium text-[var(--color-navy)]">
                        {p.name}
                      </Link>
                    </td>
                    <td>{p.manager}</td>
                    <td>
                      <ProgressBar value={p.progress} />
                    </td>
                    <td>{p.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel p-4">
            <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Quick Facts</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-[var(--color-muted)]">Industry</dt><dd>{company.industry}</dd></div>
              <div><dt className="text-[var(--color-muted)]">Billing Terms</dt><dd>{company.billingTerms}</dd></div>
              <div>
                <dt className="text-[var(--color-muted)]">Portal Access</dt>
                <dd><StatusPill tone="info">{company.portalContacts} contacts enabled</StatusPill></dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Status</dt>
                <dd><StatusPill tone={statusTone(company.status)}>{company.status}</StatusPill></dd>
              </div>
            </dl>
          </div>
        </div>
        <SideRail title="Activity Stream">
          <div className="space-y-4">
            {activity.map((a) => (
              <div key={a.id} className="text-sm">
                <div className="text-xs text-[var(--color-muted)]">{a.when}</div>
                <div>{a.text}</div>
              </div>
            ))}
            {!activity.length ? (
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                <Avatar initials={company.initials} />
                No recent activity yet.
              </div>
            ) : null}
          </div>
        </SideRail>
      </div>
    </div>
  );
}
