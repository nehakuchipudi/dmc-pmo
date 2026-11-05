"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ActivityList } from "@/components/records/ActivityStream";
import { DataTable, MetricCard, MetricGrid, Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { Avatar, PageHeader, StatusPill, statusTone } from "@/components/ui";
import { composeActivityFeed } from "@/lib/activity";
import { useAuth } from "@/lib/auth";
import { homeSectionOn, hasPack } from "@/lib/modules";
import { allocationByMember, blockedDependencies, openHighRisks } from "@/lib/ppm";
import { formatDisplayDate, money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

function firstName(name?: string) {
  return name?.trim().split(/\s+/)[0] || "there";
}

function dueIn(date: string) {
  const days = Math.round((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86400000);
  if (Number.isNaN(days) || days <= 0) return "Due now";
  if (days === 1) return "In 1 day";
  if (days < 7) return `In ${days} days`;
  if (days < 14) return "In 1 week";
  return `In ${Math.round(days / 7)} weeks`;
}

function homeSubtitle(packs: string[]) {
  const bits = [];
  if (packs.includes("project_delivery") || packs.includes("project_management")) bits.push("projects");
  if (packs.includes("service_operations")) bits.push("operations");
  if (packs.includes("project_delivery")) bits.push("team");
  if (!bits.length) return "Turn on capabilities in Settings to populate this view.";
  return `${bits.join(", ")} performance at a glance.`;
}

export function HomeWorkspace() {
  const focusCompanyId = useAppStore((s) => s.focusCompanyId);
  if (focusCompanyId) return <CompanyHome key={focusCompanyId} companyId={focusCompanyId} />;
  return <WorkspaceHome />;
}

function WorkspaceHome() {
  const { user, canSeeFinancials } = useAuth();
  const enabledPacks = useAppStore((s) => s.enabledPacks);
  const projects = useAppStore((s) => s.projects);
  const portfolios = useAppStore((s) => s.portfolios);
  const risks = useAppStore((s) => s.risks);
  const issues = useAppStore((s) => s.issues);
  const allocations = useAppStore((s) => s.allocations);
  const invoices = useAppStore((s) => s.invoices);
  const workOrders = useAppStore((s) => s.workOrders);
  const opportunities = useAppStore((s) => s.opportunities);
  const milestones = useAppStore((s) => s.milestones);
  const activities = useAppStore((s) => s.activities);
  const tasks = useAppStore((s) => s.tasks);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const companies = useAppStore((s) => s.companies);
  const dependencies = useAppStore((s) => s.dependencies);
  const show = (section: Parameters<typeof homeSectionOn>[0]) => homeSectionOn(section, enabledPacks);

  const snapshot = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status !== "Completed" && p.status !== "Cancelled");
    const onTrack = activeProjects.filter((p) => p.status === "Active" || p.status === "Planning" || p.status === "Draft").length;
    const atRisk = activeProjects.filter((p) => p.status === "At Risk").length;
    const behind = activeProjects.filter((p) => p.status === "On Hold").length;
    const capacity = allocationByMember(allocations);
    const overloaded = capacity.filter((c) => c.pct > 100);
    const available = capacity.filter((c) => c.pct <= 80);
    const util = capacity.length ? Math.round(capacity.reduce((sum, row) => sum + row.pct, 0) / capacity.length) : 0;
    const outstanding = invoices.filter((i) => i.status === "Sent" || i.status === "Overdue").reduce((sum, i) => sum + i.amount, 0);
    const budgeted = activeProjects.reduce((sum, p) => sum + p.budgetAmount, 0);
    const actual = invoices.filter((i) => i.status !== "Draft").reduce((sum, i) => sum + i.amount, 0);
    const variance = budgeted - actual;
    const progress = activeProjects.length
      ? Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length)
      : 0;
    const types = new Map<string, number>();
    for (const project of activeProjects) {
      const key = project.projectType || "General";
      types.set(key, (types.get(key) ?? 0) + 1);
    }
    const upcoming = [...milestones]
      .filter((row) => row.status !== "Approved")
      .sort((a, b) => a.due.localeCompare(b.due))
      .slice(0, 4);
    const activity = composeActivityFeed({
      activities,
      projects,
      tasks,
      timeEntries,
      milestones,
    }).slice(0, 5);
    return {
      activeProjects: activeProjects.length,
      portfolios: portfolios.length,
      fieldOpen: workOrders.filter((row) => row.status !== "Completed").length,
      util,
      overloaded,
      available: available.length,
      allocated: capacity.length - available.length,
      outstanding,
      onTrack,
      atRisk,
      behind,
      quotes: opportunities.filter((row) => row.stage !== "Won" && row.stage !== "Lost").length,
      scheduled: workOrders.filter((row) => row.status === "Scheduled").length,
      inProgress: workOrders.filter((row) => row.status === "In progress").length,
      approval: workOrders.filter((row) => row.status === "Pending approval").length,
      invoicing: invoices.filter((row) => row.status === "Draft" || row.status === "Sent").length,
      budgeted,
      actual,
      variance,
      progress,
      risks: openHighRisks(risks).length,
      issues: issues.filter((row) => row.status !== "Resolved").length,
      blocked: blockedDependencies(dependencies).length,
      types: [...types.entries()].sort((a, b) => b[1] - a[1]),
      upcoming,
      activity,
      companies: companies.length,
    };
  }, [
    projects,
    portfolios,
    allocations,
    invoices,
    workOrders,
    opportunities,
    milestones,
    activities,
    tasks,
    timeEntries,
    risks,
    issues,
    companies,
    dependencies,
  ]);

  const kpis = [
    show("projects") ? (
      <MetricCard
        key="projects"
        label="Active projects"
        value={snapshot.activeProjects}
        hint={`${snapshot.onTrack} on track · ${snapshot.atRisk} at risk`}
        tone={snapshot.atRisk ? "warn" : "good"}
      />
    ) : null,
    show("portfolios") ? (
      <MetricCard key="portfolios" label="Active portfolios" value={snapshot.portfolios} hint={`${snapshot.companies} companies on the book`} />
    ) : null,
    show("work_orders") ? (
      <MetricCard
        key="work"
        label="Open work orders"
        value={snapshot.fieldOpen}
        hint={`${snapshot.approval} waiting on approval`}
        tone={snapshot.approval ? "warn" : snapshot.fieldOpen ? "good" : "warn"}
      />
    ) : null,
    show("utilization") || show("work_orders") ? (
      <MetricCard
        key="util"
        label="Team utilization"
        value={snapshot.util ? `${snapshot.util}%` : "-"}
        hint={snapshot.overloaded.length ? `${snapshot.overloaded.length} over capacity` : "No one above 100%"}
        tone={snapshot.overloaded.length ? "bad" : snapshot.util >= 70 ? "good" : "warn"}
      />
    ) : null,
    show("billing") && canSeeFinancials ? (
      <MetricCard
        key="bill"
        label="Outstanding billing"
        value={money(snapshot.outstanding)}
        hint="Sent and overdue invoices"
        tone={snapshot.outstanding ? "warn" : "good"}
      />
    ) : null,
  ].filter(Boolean);

  return (
    <div className="fade-in">
      <PageHeader title={`Welcome back, ${firstName(user?.name)}`} subtitle={homeSubtitle(enabledPacks)} />
      {kpis.length ? <MetricGrid>{kpis}</MetricGrid> : null}

      {(show("health") || show("journey") || show("capacity") || show("work_orders")) && (
        <div className="split-3">
          {show("health") ? (
            <div className="panel p-5">
              <h2 className="section-title">Portfolio health</h2>
              <p className="mb-3 text-sm text-[var(--color-muted)]">{snapshot.activeProjects} active projects</p>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>On track</span>
                    <span>{snapshot.onTrack}</span>
                  </div>
                  <ProgressLine value={snapshot.activeProjects ? Math.round((snapshot.onTrack / snapshot.activeProjects) * 100) : 0} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>At risk</span>
                    <span>{snapshot.atRisk}</span>
                  </div>
                  <ProgressLine value={snapshot.activeProjects ? Math.round((snapshot.atRisk / snapshot.activeProjects) * 100) : 0} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Behind</span>
                    <span>{snapshot.behind}</span>
                  </div>
                  <ProgressLine value={snapshot.activeProjects ? Math.round((snapshot.behind / snapshot.activeProjects) * 100) : 0} />
                </div>
              </div>
            </div>
          ) : null}
          {show("journey") ? (
            <div className="panel p-5">
              <h2 className="section-title">Work journey</h2>
              <p className="mb-3 text-sm text-[var(--color-muted)]">Quotes through field work and invoicing</p>
              <div className="journey-steps">
                {[
                  hasPack(enabledPacks, "project_delivery") ? ["Quotes", snapshot.quotes] : null,
                  ["Scheduled", snapshot.scheduled],
                  ["In progress", snapshot.inProgress],
                  ["Approval", snapshot.approval],
                  hasPack(enabledPacks, "project_delivery") ? ["Invoicing", snapshot.invoicing] : null,
                ]
                  .filter((row): row is [string, number] => Boolean(row))
                  .map(([label, value]) => (
                    <div key={label} className="journey-step">
                      <div className="journey-step-value">{value}</div>
                      <div className="journey-step-label">{label}</div>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
          {show("capacity") || show("work_orders") ? (
            <div className="panel p-5">
              <h2 className="section-title">Resource capacity</h2>
              <p className="mb-3 text-sm text-[var(--color-muted)]">{snapshot.util || 0}% overall utilization</p>
              <ProgressLine value={snapshot.util} />
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Allocated</span>
                  <span>{snapshot.allocated}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available</span>
                  <span>{snapshot.available}</span>
                </div>
                <div className="flex justify-between">
                  <span>Over capacity</span>
                  <span>{snapshot.overloaded.length}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {(show("financials") || show("trend") || show("risks")) && (
        <div className="mt-4 split-3">
          {show("financials") && canSeeFinancials ? (
            <div className="panel p-5">
              <h2 className="section-title">Financial overview</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Budgeted</span>
                  <span className="font-semibold">{money(snapshot.budgeted)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual</span>
                  <span className="font-semibold">{money(snapshot.actual)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Variance</span>
                  <span className="font-semibold">
                    {money(snapshot.variance)}
                    {snapshot.budgeted ? ` · ${Math.round((snapshot.variance / snapshot.budgeted) * 100)}%` : ""}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
          {show("trend") ? (
            <div className="panel p-5">
              <h2 className="section-title">Project trend</h2>
              <p className="mb-3 text-sm text-[var(--color-muted)]">Average progress across active projects</p>
              <ProgressLine value={snapshot.progress} />
              <p className="mt-3 text-sm text-[var(--color-muted)]">{snapshot.progress}% complete</p>
            </div>
          ) : null}
          {show("risks") ? (
            <div className="panel p-5">
              <h2 className="section-title">Risks and issues</h2>
              <Link href="/app/risks" className="insight-card block">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{snapshot.risks} risks</div>
                  <Pill value={snapshot.risks ? "Watch" : "Healthy"} />
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">Open high-impact items</div>
              </Link>
              <Link href="/app/tickets" className="insight-card block">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{snapshot.issues} issues</div>
                  <Pill value={snapshot.issues ? "Open" : "Clear"} />
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">{snapshot.blocked} cross-project holds</div>
              </Link>
            </div>
          ) : null}
        </div>
      )}

      {(show("milestones") || show("distribution") || show("activity")) && (
        <div className="mt-4 split-3">
          {show("milestones") ? (
            <div className="panel p-5">
              <h2 className="section-title">Upcoming milestones</h2>
              {snapshot.upcoming.length ? (
                <div className="space-y-3">
                  {snapshot.upcoming.map((row) => {
                    const project = projects.find((p) => p.id === row.projectId);
                    return (
                      <Link key={row.id} href={project ? `/app/projects/view/?id=${project.id}` : "/app/projects"} className="insight-card block">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold">{row.name}</div>
                          <span className="text-sm text-[var(--color-muted)]">{dueIn(row.due)}</span>
                        </div>
                        <div className="mt-1 text-sm text-[var(--color-muted)]">
                          {project?.name ?? "Project"} · {formatDisplayDate(row.due)}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">No upcoming milestones yet.</p>
              )}
            </div>
          ) : null}
          {show("distribution") ? (
            <div className="panel p-5">
              <h2 className="section-title">Project distribution</h2>
              {snapshot.types.length ? (
                <div className="space-y-3">
                  {snapshot.types.map(([type, count]) => (
                    <div key={type}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{type}</span>
                        <span>
                          {count} · {snapshot.activeProjects ? Math.round((count / snapshot.activeProjects) * 100) : 0}%
                        </span>
                      </div>
                      <ProgressLine value={snapshot.activeProjects ? Math.round((count / snapshot.activeProjects) * 100) : 0} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">Add projects to see type mix.</p>
              )}
            </div>
          ) : null}
          {show("activity") ? (
            <div className="panel p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="section-title" style={{ margin: 0 }}>
                  Recent activity
                </h2>
                <Link href="/app/audit" className="text-sm text-[var(--color-navy)]">
                  View all
                </Link>
              </div>
              {snapshot.activity.length ? <ActivityList items={snapshot.activity} compact /> : <p className="text-sm text-[var(--color-muted)]">Nothing posted yet.</p>}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function CompanyHome({ companyId }: { companyId: string }) {
  const enabledPacks = useAppStore((s) => s.enabledPacks);
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
  const workOrders = useAppStore((s) => s.workOrders);
  const addActivityNote = useAppStore((s) => s.addActivityNote);
  const showDelivery = hasPack(enabledPacks, "project_delivery");
  const showService = hasPack(enabledPacks, "service_operations");

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
  const companyJobs = workOrders.filter((row) => row.companyId === companyId && row.status !== "Completed");
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
            {showDelivery ? (
              <Link href="/app/projects/" className="btn btn-primary">
                Projects
              </Link>
            ) : null}
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
        {showDelivery ? <MetricCard label="Open projects" value={companyProjects.length} hint={`${company.openProjects} marked open on the record`} /> : null}
        <MetricCard
          label="Open tickets"
          value={openTickets.length}
          hint={openTickets[0]?.subject ?? "No open tickets"}
          tone={openTickets.some((t) => t.priority === "Urgent") ? "bad" : openTickets.length ? "warn" : "good"}
        />
        {showDelivery ? (
          <MetricCard
            label="Outstanding"
            value={money(outstanding)}
            hint={overdue ? `${money(overdue)} overdue` : `${companyInvoices.length} invoices`}
            tone={overdue ? "bad" : outstanding ? "warn" : "good"}
          />
        ) : null}
        {showDelivery ? <MetricCard label="Hours logged" value={`${hours}h`} hint="Time on this company's projects" /> : null}
        {showDelivery ? <MetricCard label="Retainers" value={companyRetainers.length} hint={companyRetainers[0]?.name ?? "No retainers"} /> : null}
        {showService ? (
          <MetricCard
            label="Field jobs"
            value={companyJobs.length}
            hint={companyJobs[0]?.title ?? "No open work orders"}
            tone={companyJobs.some((row) => row.status === "Pending approval") ? "warn" : "good"}
          />
        ) : null}
      </MetricGrid>

      <div className="split-2">
        <div className="panel p-5">
          <h2 className="section-title">Projects</h2>
          {showDelivery && companyProjects.length ? (
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
            <p className="text-sm text-[var(--color-muted)]">{showDelivery ? "No projects on this company yet." : "Project delivery is off for this workspace."}</p>
          )}
        </div>
        <div className="panel p-5">
          <h2 className="section-title">Needs attention</h2>
          <div className="space-y-3">
            {showService
              ? companyJobs.slice(0, 3).map((job) => (
                  <Link key={job.id} href="/app/work-orders" className="insight-card block">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{job.title}</div>
                      <Pill value={job.status} />
                    </div>
                    <div className="mt-1 text-sm text-[var(--color-muted)]">
                      {job.assignee || "Unassigned"} · {job.scheduled}
                    </div>
                  </Link>
                ))
              : null}
            {openTickets.slice(0, 3).map((ticket) => (
              <Link key={ticket.id} href={`/app/tickets/view/?id=${ticket.id}`} className="insight-card block">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">
                    #{ticket.number} {ticket.subject}
                  </div>
                  <Pill value={ticket.priority} />
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">
                  {ticket.status} · {ticket.assignee} · SLA {ticket.slaDue}
                </div>
              </Link>
            ))}
            {showDelivery
              ? openRisks.slice(0, 3).map((risk) => (
                  <Link key={risk.id} href="/app/risks" className="insight-card block">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{risk.title}</div>
                      <Pill value={risk.impact} />
                    </div>
                    <div className="mt-1 text-sm text-[var(--color-muted)]">
                      {risk.owner} · {risk.status}
                    </div>
                  </Link>
                ))
              : null}
            {!openTickets.length && (!showDelivery || !openRisks.length) && (!showService || !companyJobs.length) ? (
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
                  <div className="text-sm text-[var(--color-muted)]">
                    {primary.title} · {primary.email}
                  </div>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">No contacts yet.</p>
            )}
            {showDelivery
              ? companyInvoices.slice(0, 4).map((invoice) => (
                  <Link key={invoice.id} href={`/app/billing/view/?id=${invoice.id}`} className="insight-card block">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{invoice.number}</div>
                      <StatusPill tone={statusTone(invoice.status)}>{invoice.status}</StatusPill>
                    </div>
                    <div className="mt-1 text-sm text-[var(--color-muted)]">
                      {money(invoice.amount)} · due {formatDisplayDate(invoice.due)}
                    </div>
                  </Link>
                ))
              : null}
            {showDelivery && !companyInvoices.length ? <p className="text-sm text-[var(--color-muted)]">No invoices on this company.</p> : null}
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
