"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ActivityList } from "@/components/records/ActivityStream";
import { DataTable, MetricCard, MetricGrid, Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { Avatar, PageHeader, StatusPill, statusTone } from "@/components/ui";
import { composeActivityFeed } from "@/lib/activity";
import { allocationByMember, blockedDependencies, openHighRisks, portfolioMetrics } from "@/lib/ppm";
import { formatDisplayDate, money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

export function HomeWorkspace() {
  const focusCompanyId = useAppStore((s) => s.focusCompanyId);
  if (focusCompanyId) return <CompanyHome key={focusCompanyId} companyId={focusCompanyId} />;
  return <PortfolioHome />;
}

function PortfolioHome() {
  const projects = useAppStore((s) => s.projects);
  const portfolios = useAppStore((s) => s.portfolios);
  const objectives = useAppStore((s) => s.objectives);
  const risks = useAppStore((s) => s.risks);
  const gates = useAppStore((s) => s.gates);
  const allocations = useAppStore((s) => s.allocations);
  const benefits = useAppStore((s) => s.benefits);
  const dependencies = useAppStore((s) => s.dependencies);
  const invoices = useAppStore((s) => s.invoices);

  const snapshot = useMemo(() => {
    const delivery = portfolios.find((p) => p.id === "pf-delivery");
    const metrics = delivery ? portfolioMetrics(delivery, projects) : null;
    const mapped = new Set(portfolios.flatMap((p) => p.projectIds));
    const aligned = projects.filter((p) => mapped.has(p.id)).length;
    const capacity = allocationByMember(allocations);
    const overloaded = capacity.filter((c) => c.pct > 100);
    const highRisks = openHighRisks(risks);
    const benefitAvg = benefits.length
      ? Math.round(benefits.reduce((sum, b) => sum + b.progress, 0) / benefits.length)
      : 0;
    const overdueCash = invoices.filter((i) => i.status === "Overdue").reduce((sum, i) => sum + i.amount, 0);
    return {
      metrics,
      alignedPct: projects.length ? Math.round((aligned / projects.length) * 100) : 0,
      overloaded,
      highRisks,
      benefitAvg,
      overdueCash,
      blocked: blockedDependencies(dependencies),
      pendingGates: gates.filter((g) => g.status === "In Review" || g.status === "Upcoming"),
    };
  }, [portfolios, projects, allocations, risks, benefits, invoices, dependencies, gates]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Portfolio home"
        subtitle="Are we on the right projects, with the right people, at the right cost, with acceptable risk, and are those projects moving the strategy?"
      />
      <MetricGrid>
        <MetricCard
          label="Right work"
          value={`${snapshot.alignedPct}%`}
          hint="Active projects mapped to a portfolio and objective"
          tone={snapshot.alignedPct >= 80 ? "good" : "warn"}
        />
        <MetricCard
          label="Right resources"
          value={snapshot.overloaded.length ? `${snapshot.overloaded.length} over` : "In band"}
          hint={snapshot.overloaded.length ? snapshot.overloaded.map((o) => o.name).join(", ") : "No one above 100% allocation"}
          tone={snapshot.overloaded.length ? "bad" : "good"}
        />
        <MetricCard
          label="Right cost"
          value={snapshot.metrics ? `${snapshot.metrics.margin}%` : "-"}
          hint={snapshot.metrics ? `${money(snapshot.metrics.invested)} invested · ${snapshot.metrics.hoursUsed}/${snapshot.metrics.hoursBudget} hrs` : "No portfolio"}
          tone={(snapshot.metrics?.margin ?? 0) >= 28 ? "good" : "warn"}
        />
        <MetricCard
          label="Acceptable risk"
          value={snapshot.highRisks.length}
          hint={`${snapshot.blocked.length} cross-project holds · ${money(snapshot.overdueCash)} overdue invoices`}
          tone={snapshot.highRisks.length > 2 ? "bad" : snapshot.highRisks.length ? "warn" : "good"}
        />
        <MetricCard
          label="Strategy moving"
          value={`${snapshot.benefitAvg}%`}
          hint="Average benefit realization against target"
          tone={snapshot.benefitAvg >= 60 ? "good" : "warn"}
        />
      </MetricGrid>

      <div className="split-2">
        <div className="panel p-5">
          <h2 className="section-title">Portfolios in flight</h2>
          <DataTable
            columns={["Portfolio", "Owner", "Health", "Progress", "Projects"]}
            rows={portfolios.map((portfolio) => {
              const m = portfolioMetrics(portfolio, projects);
              return [
                <Link key={portfolio.id} href={`/app/portfolios/view/?id=${portfolio.id}`} className="font-semibold text-[var(--color-navy)]">
                  {portfolio.name}
                </Link>,
                portfolio.owner,
                <Pill key={`${portfolio.id}-h`} value={m.health} />,
                <ProgressLine key={`${portfolio.id}-p`} value={m.progress} />,
                String(m.items.length),
              ];
            })}
          />
        </div>
        <div className="panel p-5">
          <h2 className="section-title">Needs a decision</h2>
          <div className="space-y-3">
            {snapshot.pendingGates.slice(0, 4).map((gate) => (
              <Link key={gate.id} href="/app/governance" className="insight-card block">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{gate.name}</div>
                  <Pill value={gate.status} />
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">
                  {gate.stage} · due {gate.due} · {gate.owner}
                </div>
              </Link>
            ))}
            {snapshot.highRisks.slice(0, 3).map((risk) => (
              <Link key={risk.id} href="/app/risks" className="insight-card block">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{risk.title}</div>
                  <Pill value={risk.impact} />
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">
                  {risk.owner} · {risk.status}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 panel p-5">
        <h2 className="section-title">Strategic objectives</h2>
        <DataTable
          columns={["Code", "Objective", "Owner", "Status", "Progress"]}
          rows={objectives.map((o) => [
            o.code,
            <Link key={o.id} href={`/app/strategy/view/?id=${o.id}`} className="font-medium text-[var(--color-navy)]">
              {o.name}
            </Link>,
            o.owner,
            <Pill key={`${o.id}-s`} value={o.status} />,
            <ProgressLine key={`${o.id}-p`} value={o.progress} />,
          ])}
        />
      </div>
    </div>
  );
}

function CompanyHome({ companyId }: { companyId: string }) {
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const contacts = useAppStore((s) => s.contacts);
  const tickets = useAppStore((s) => s.tickets);
  const invoices = useAppStore((s) => s.invoices);
  const retainers = useAppStore((s) => s.retainers);
  const activities = useAppStore((s) => s.activities);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const milestones = useAppStore((s) => s.milestones);
  const tasks = useAppStore((s) => s.tasks);
  const risks = useAppStore((s) => s.risks);
  const addActivityNote = useAppStore((s) => s.addActivityNote);

  const company = companies.find((c) => c.id === companyId);
  const companyProjects = useMemo(() => projects.filter((p) => p.companyId === companyId), [projects, companyId]);
  const companyContacts = useMemo(() => contacts.filter((c) => c.companyId === companyId), [contacts, companyId]);
  const companyTickets = useMemo(() => tickets.filter((t) => t.companyId === companyId), [tickets, companyId]);
  const companyInvoices = useMemo(() => invoices.filter((i) => i.companyId === companyId), [invoices, companyId]);
  const companyRetainers = useMemo(() => retainers.filter((r) => r.companyId === companyId), [retainers, companyId]);
  const projectIds = useMemo(() => new Set(companyProjects.map((p) => p.id)), [companyProjects]);
  const hours = useMemo(
    () => timeEntries.filter((t) => projectIds.has(t.projectId)).reduce((sum, t) => sum + t.hours, 0),
    [timeEntries, projectIds],
  );
  const outstanding = companyInvoices
    .filter((i) => i.status === "Sent" || i.status === "Overdue")
    .reduce((sum, i) => sum + i.amount, 0);
  const overdue = companyInvoices.filter((i) => i.status === "Overdue").reduce((sum, i) => sum + i.amount, 0);
  const openTickets = companyTickets.filter((t) => t.status !== "Resolved");
  const openRisks = risks.filter((r) => r.projectId && projectIds.has(r.projectId) && r.status !== "Closed");
  const activity = useMemo(
    () =>
      composeActivityFeed({
        companyId,
        activities,
        projects,
        tasks,
        timeEntries,
        milestones,
        company,
      }).slice(0, 6),
    [companyId, activities, projects, tasks, timeEntries, milestones, company],
  );
  const primary = companyContacts.find((c) => c.id === company?.primaryContactId) ?? companyContacts[0];
  const managers = company?.accountManagers?.length ? company.accountManagers : company ? [company.accountManager] : [];

  if (!company) {
    return (
      <div className="fade-in panel p-6">
        <p className="font-semibold">That company is not in this workspace.</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Pick another company from the top bar, or go back to all companies.</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader
        title={company.name}
        subtitle={`${company.industry} · ${managers.join(", ")} · last activity ${company.lastActivity}`}
        actions={
          <>
            <Link href={`/app/companies/view/?id=${company.id}`} className="btn btn-ghost">
              Open company record
            </Link>
            <Link href="/app/projects/" className="btn btn-primary">
              Projects
            </Link>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <StatusPill tone={statusTone(company.status)}>{company.status}</StatusPill>
        {company.tags?.map((tag) => (
          <Pill key={tag} value={tag} />
        ))}
        <span className="text-[var(--color-muted)]">{company.billingTerms}</span>
        {company.address ? <span className="text-[var(--color-muted)]">{company.address}</span> : null}
      </div>
      <MetricGrid>
        <MetricCard label="Open projects" value={companyProjects.length} hint={`${company.openProjects} marked open on the record`} />
        <MetricCard
          label="Open tickets"
          value={openTickets.length}
          hint={openTickets[0]?.subject ?? "No open tickets"}
          tone={openTickets.some((t) => t.priority === "Urgent") ? "bad" : openTickets.length ? "warn" : "good"}
        />
        <MetricCard
          label="Outstanding"
          value={money(outstanding)}
          hint={overdue ? `${money(overdue)} overdue` : `${companyInvoices.length} invoices`}
          tone={overdue ? "bad" : outstanding ? "warn" : "good"}
        />
        <MetricCard label="Hours logged" value={`${hours}h`} hint="Time on this company's projects" />
        <MetricCard
          label="Retainers"
          value={companyRetainers.length}
          hint={companyRetainers[0]?.name ?? "No retainers"}
        />
      </MetricGrid>

      <div className="split-2">
        <div className="panel p-5">
          <h2 className="section-title">Projects</h2>
          {companyProjects.length ? (
            <DataTable
              columns={["Project", "Manager", "Status", "Progress", "Due"]}
              rows={companyProjects.map((project) => [
                <Link key={project.id} href={`/app/projects/view/?id=${project.id}`} className="font-semibold text-[var(--color-navy)]">
                  {project.name}
                </Link>,
                project.manager,
                <StatusPill key={`${project.id}-s`} tone={statusTone(project.status)}>
                  {project.status}
                </StatusPill>,
                <ProgressLine key={`${project.id}-p`} value={project.progress} />,
                formatDisplayDate(project.due),
              ])}
            />
          ) : (
            <p className="text-sm text-[var(--color-muted)]">No projects on this company yet.</p>
          )}
        </div>
        <div className="panel p-5">
          <h2 className="section-title">Needs attention</h2>
          <div className="space-y-3">
            {openTickets.slice(0, 3).map((ticket) => (
              <Link key={ticket.id} href={`/app/tickets/view/?id=${ticket.id}`} className="insight-card block">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">#{ticket.number} {ticket.subject}</div>
                  <Pill value={ticket.priority} />
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">
                  {ticket.status} · {ticket.assignee} · SLA {ticket.slaDue}
                </div>
              </Link>
            ))}
            {openRisks.slice(0, 3).map((risk) => (
              <Link key={risk.id} href="/app/risks" className="insight-card block">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{risk.title}</div>
                  <Pill value={risk.impact} />
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">
                  {risk.owner} · {risk.status}
                </div>
              </Link>
            ))}
            {!openTickets.length && !openRisks.length ? (
              <p className="text-sm text-[var(--color-muted)]">Nothing open on this company.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 split-2">
        <div className="panel p-5">
          <h2 className="section-title">Contacts and billing</h2>
          <div className="space-y-3">
            {primary ? (
              <Link href={`/app/contacts/view/?id=${primary.id}`} className="flex items-center gap-3">
                <Avatar initials={primary.initials} name={primary.name} size={36} />
                <div>
                  <div className="font-semibold">{primary.name}</div>
                  <div className="text-sm text-[var(--color-muted)]">{primary.title} · {primary.email}</div>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">No contacts yet.</p>
            )}
            {companyInvoices.slice(0, 4).map((invoice) => (
              <Link key={invoice.id} href={`/app/billing/view/?id=${invoice.id}`} className="insight-card block">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{invoice.number}</div>
                  <StatusPill tone={statusTone(invoice.status)}>{invoice.status}</StatusPill>
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">
                  {money(invoice.amount)} · due {formatDisplayDate(invoice.due)}
                </div>
              </Link>
            ))}
            {!companyInvoices.length ? <p className="text-sm text-[var(--color-muted)]">No invoices on this company.</p> : null}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="section-title">Recent activity</h2>
          <ActivityList items={activity} compact />
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const input = event.currentTarget.elements.namedItem("note") as HTMLInputElement | null;
              const text = input?.value.trim();
              if (!text) return;
              addActivityNote(company.id, text);
              if (input) input.value = "";
            }}
          >
            <input name="note" className="field-input" placeholder={`Note on ${company.name}`} />
            <button type="submit" className="btn btn-primary">
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
