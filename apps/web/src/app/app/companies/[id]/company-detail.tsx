"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import {
  Avatar,
  PageHeader,
  ProgressBar,
  SideRail,
  StatusPill,
  Tabs,
  statusTone,
} from "@/components/ui";
import { formatDisplayDate, money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import { exportCsv } from "@/lib/pdf";

export function CompanyDetail({ id }: { id: string }) {
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const contacts = useAppStore((s) => s.contacts);
  const tickets = useAppStore((s) => s.tickets);
  const invoices = useAppStore((s) => s.invoices);
  const retainers = useAppStore((s) => s.retainers);
  const activities = useAppStore((s) => s.activities);
  const trackView = useAppStore((s) => s.trackView);
  const [tab, setTab] = useState("Overview");
  const [createKind, setCreateKind] = useState<CreateKind>(null);

  const company = companies.find((c) => c.id === id) ?? companies[0];
  const companyProjects = projects.filter((p) => p.companyId === company.id);
  const companyContacts = contacts.filter((c) => c.companyId === company.id);
  const companyTickets = tickets.filter((t) => t.companyId === company.id);
  const companyInvoices = invoices.filter((i) => i.companyId === company.id);
  const companyRetainers = retainers.filter((r) => r.companyId === company.id);
  const activity = useMemo(
    () => activities.filter((a) => a.companyId === company.id),
    [activities, company.id],
  );

  useEffect(() => {
    trackView("company", company.id, company.name);
  }, [company.id, company.name, trackView]);

  return (
    <div className="fade-in">
      <div className="mb-2 text-sm text-[var(--color-muted)]">
        <Link href="/app/companies">Companies</Link> / {company.name}
      </div>
      <PageHeader
        title={company.name}
        subtitle={`${company.status} · Account Manager: ${company.accountManager} · ${company.openProjects} open projects`}
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setCreateKind("ticket")}>+ New Ticket</button>
            <button type="button" className="btn btn-ghost" onClick={() => setCreateKind("project")}>+ New Project</button>
            <button type="button" className="btn btn-primary" onClick={() => setCreateKind("time")}>Log Time</button>
          </>
        }
      />
      <Tabs
        tabs={["Overview", "Contacts", "Projects", "Tickets", "Retainers", "Billing", "Files", "Activity"]}
        active={tab}
        onChange={setTab}
      />

      {tab === "Overview" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="panel p-4">
              <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Open Projects</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Manager</th>
                    <th>Progress</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {companyProjects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/app/projects/view/?id=${p.id}`} className="font-medium text-[var(--color-navy)]">
                          {p.name}
                        </Link>
                      </td>
                      <td>{p.manager}</td>
                      <td><ProgressBar value={p.progress} /></td>
                      <td>{formatDisplayDate(p.due)}</td>
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
      )}

      {tab === "Contacts" && (
        <div className="panel overflow-hidden">
          <div className="flex justify-end p-3">
            <button type="button" className="btn btn-primary" onClick={() => setCreateKind("contact")}>+ Contact</button>
          </div>
          <table className="table">
            <thead><tr><th>Name</th><th>Title</th><th>Email</th><th>Portal</th></tr></thead>
            <tbody>
              {companyContacts.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.title}</td>
                  <td>{c.email}</td>
                  <td><StatusPill tone={statusTone(c.portal)}>{c.portal}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Projects" && (
        <div className="panel overflow-hidden">
          <table className="table">
            <thead><tr><th>Project</th><th>Status</th><th>Progress</th><th>Due</th></tr></thead>
            <tbody>
              {companyProjects.map((p) => (
                <tr key={p.id}>
                  <td><Link href={`/app/projects/view/?id=${p.id}`} className="font-medium text-[var(--color-navy)]">{p.name}</Link></td>
                  <td><StatusPill tone={statusTone(p.status)}>{p.status}</StatusPill></td>
                  <td><ProgressBar value={p.progress} /></td>
                  <td>{formatDisplayDate(p.due)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Tickets" && (
        <div className="panel overflow-hidden">
          <table className="table">
            <thead><tr><th>Ticket</th><th>Priority</th><th>Assignee</th><th>Status</th></tr></thead>
            <tbody>
              {companyTickets.map((t) => (
                <tr key={t.id}>
                  <td><Link href={`/app/tickets/view/?id=${t.id}`} className="font-medium text-[var(--color-navy)]">#{t.number} {t.subject}</Link></td>
                  <td><StatusPill tone={statusTone(t.priority)}>{t.priority}</StatusPill></td>
                  <td>{t.assignee}</td>
                  <td><StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Retainers" && (
        <div className="panel overflow-hidden">
          <table className="table">
            <thead><tr><th>Retainer</th><th>Period</th><th>Usage</th><th>Status</th></tr></thead>
            <tbody>
              {companyRetainers.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.name}</td>
                  <td>{r.periodLabel}</td>
                  <td>{r.usedHours} / {r.budgetHours} hrs</td>
                  <td><StatusPill tone="success">{r.status}</StatusPill></td>
                </tr>
              ))}
              {!companyRetainers.length ? <tr><td colSpan={4} className="text-[var(--color-muted)]">No retainers for this company.</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Billing" && (
        <div className="panel overflow-hidden">
          <div className="flex justify-end p-3">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                exportCsv(
                  `${company.name}-invoices.csv`,
                  companyInvoices.map((i) => ({
                    number: i.number,
                    amount: i.amount,
                    status: i.status,
                    due: i.due,
                  })),
                )
              }
            >
              Export CSV
            </button>
          </div>
          <table className="table">
            <thead><tr><th>Invoice</th><th>Amount</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {companyInvoices.map((i) => (
                <tr key={i.id}>
                  <td><Link href={`/app/billing/view/?id=${i.id}`} className="font-medium text-[var(--color-navy)]">{i.number}</Link></td>
                  <td>{money(i.amount)}</td>
                  <td>{formatDisplayDate(i.due)}</td>
                  <td><StatusPill tone={statusTone(i.status)}>{i.status}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Files" && (
        <div className="panel p-6 text-sm text-[var(--color-muted)]">
          File uploads will attach to Azure Blob in the API phase. Demo placeholder: SOW.pdf, Kickoff-Deck.pptx.
        </div>
      )}

      {tab === "Activity" && (
        <div className="panel p-4 space-y-3">
          {activity.map((a) => (
            <div key={a.id} className="border-b border-[var(--color-border)] pb-3 text-sm">
              <div className="text-xs text-[var(--color-muted)]">{a.when}</div>
              <div>{a.text}</div>
            </div>
          ))}
        </div>
      )}

      <CreateForms kind={createKind} onClose={() => setCreateKind(null)} defaults={{ companyId: company.id }} />
    </div>
  );
}
