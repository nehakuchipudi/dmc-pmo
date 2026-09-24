"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Mail, Star, X } from "lucide-react";
import { IfCan } from "@/components/auth/IfCan";
import { ContactActions } from "@/components/contacts/ContactActions";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { InvoiceCreateForm } from "@/components/InvoiceCreateForm";
import { ActivityHoursChart, monthSeries } from "@/components/records/ActivityHoursChart";
import { ActivityList, ActivityStream } from "@/components/records/ActivityStream";
import { RecordFact, RecordMetric, RecordRailBlock, RecordShell, TonePill } from "@/components/records/RecordChrome";
import { composeActivityFeed } from "@/lib/activity";
import {
  Avatar,
  Field,
  Modal,
  ProgressBar,
  Tabs,
  TextInput,
  TextSelect,
} from "@/components/ui";
import { formatDisplayDate, money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import { exportCsv } from "@/lib/pdf";
import type { CompanyAssetKind, CompanyAssetStatus, CompanyStatus } from "@/lib/types";

const TABS = [
  "Overview",
  "Stream",
  "Contacts",
  "Work",
  "Tasks",
  "Attachments",
  "Assets",
  "Tickets",
  "Retainers",
  "Billing",
];

function activityDate(when: string) {
  if (/today|yesterday/i.test(when)) return "2026-08-05";
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const idx = months.findIndex((m) => when.toLowerCase().includes(m));
  if (idx >= 0) return `2026-${String(idx + 1).padStart(2, "0")}-15`;
  return "2026-08-01";
}

function SectionHead({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="section-title">{title}</h2>
      {action && onAction ? (
        <button type="button" className="text-sm font-semibold text-[var(--color-navy)]" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

export function CompanyDetail({ id }: { id: string }) {
  const router = useRouter();
  const companies = useAppStore((s) => s.companies);
  const companyAssets = useAppStore((s) => s.companyAssets);
  const projects = useAppStore((s) => s.projects);
  const contacts = useAppStore((s) => s.contacts);
  const tickets = useAppStore((s) => s.tickets);
  const invoices = useAppStore((s) => s.invoices);
  const retainers = useAppStore((s) => s.retainers);
  const activities = useAppStore((s) => s.activities);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const milestones = useAppStore((s) => s.milestones);
  const tasks = useAppStore((s) => s.tasks);
  const team = useAppStore((s) => s.team);
  const expenses = useAppStore((s) => s.expenses);
  const trackView = useAppStore((s) => s.trackView);
  const addActivityNote = useAppStore((s) => s.addActivityNote);
  const updateCompany = useAppStore((s) => s.updateCompany);
  const addCompanyFile = useAppStore((s) => s.addCompanyFile);
  const deleteCompanyFile = useAppStore((s) => s.deleteCompanyFile);
  const createCompanyAsset = useAppStore((s) => s.createCompanyAsset);
  const deleteCompanyAsset = useAppStore((s) => s.deleteCompanyAsset);
  const pushToast = useAppStore((s) => s.pushToast);
  const [tab, setTab] = useState("Overview");
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [addressDraft, setAddressDraft] = useState("");
  const [fileOpen, setFileOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const company = companies.find((c) => c.id === id);
  const companyProjects = useMemo(
    () => projects.filter((p) => p.companyId === company?.id),
    [projects, company?.id],
  );
  const companyContacts = useMemo(
    () => contacts.filter((c) => c.companyId === company?.id),
    [contacts, company?.id],
  );
  const companyTickets = useMemo(
    () => tickets.filter((t) => t.companyId === company?.id),
    [tickets, company?.id],
  );
  const companyInvoices = useMemo(
    () => invoices.filter((i) => i.companyId === company?.id),
    [invoices, company?.id],
  );
  const companyRetainers = useMemo(
    () => retainers.filter((r) => r.companyId === company?.id),
    [retainers, company?.id],
  );
  const activity = useMemo(
    () =>
      company
        ? composeActivityFeed({
            companyId: company.id,
            activities,
            projects,
            tasks,
            timeEntries,
            milestones,
            company,
          })
        : [],
    [activities, company, projects, tasks, timeEntries, milestones],
  );
  const projectIds = useMemo(() => new Set(companyProjects.map((p) => p.id)), [companyProjects]);
  const companyTime = useMemo(
    () => timeEntries.filter((t) => projectIds.has(t.projectId)),
    [timeEntries, projectIds],
  );
  const companyTasks = useMemo(
    () => tasks.filter((t) => projectIds.has(t.projectId)),
    [tasks, projectIds],
  );
  const assets = useMemo(
    () => companyAssets.filter((a) => a.companyId === company?.id),
    [companyAssets, company?.id],
  );
  const companyExpenses = useMemo(
    () => expenses.filter((e) => projectIds.has(e.projectId)),
    [expenses, projectIds],
  );
  const projectFiles = useMemo(
    () => companyProjects.flatMap((p) => p.files.map((f) => ({ ...f, projectName: p.name, projectId: p.id }))),
    [companyProjects],
  );
  const companyFiles = company?.files ?? [];
  const attachments = useMemo(
    () => [
      ...companyFiles.map((f) => ({ ...f, source: "Company", projectId: undefined as string | undefined, projectName: company?.name })),
      ...projectFiles.map((f) => ({ ...f, source: "Project" })),
    ],
    [companyFiles, projectFiles, company?.name],
  );
  const primary = companyContacts.find((c) => c.id === company?.primaryContactId) ?? companyContacts[0];
  const managers = company?.accountManagers?.length ? company.accountManagers : company ? [company.accountManager] : [];
  const paidRevenue = companyInvoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);
  const overdueAmount = companyInvoices.filter((i) => i.status === "Overdue").reduce((sum, i) => sum + i.amount, 0);
  const outstanding = companyInvoices.filter((i) => i.status === "Sent" || i.status === "Overdue").reduce((sum, i) => sum + i.amount, 0);
  const nextInvoice = [...companyInvoices].filter((i) => i.status === "Sent" || i.status === "Draft").sort((a, b) => a.due.localeCompare(b.due))[0];
  const openTasks = companyTasks.filter((t) => t.status !== "Done");
  const chartPoints = useMemo(
    () =>
      monthSeries([
        ...companyTime.map((t) => ({ date: t.date, hours: t.hours })),
        ...activity.map((a) => ({ date: a.at ? a.at.slice(0, 10) : activityDate(a.when), activity: true })),
      ]),
    [companyTime, activity],
  );
  const staffHours = useMemo(() => {
    const map = new Map<string, number>();
    companyTime.forEach((row) => map.set(row.userName, (map.get(row.userName) ?? 0) + row.hours));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [companyTime]);

  useEffect(() => {
    if (!company) return;
    trackView("company", company.id, company.name);
    setAddressDraft(company.address ?? "");
  }, [company, trackView]);

  if (!company) {
    return (
      <div className="fade-in panel p-6">
        <p className="font-semibold text-[var(--color-navy)]">Company not found</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">This record is not in the current session.</p>
        <Link href="/app/companies" className="btn btn-primary mt-4">
          Back to companies
        </Link>
      </div>
    );
  }

  const tags = company.tags ?? [company.industry];
  const availableManagers = team.filter((m) => m.active && !managers.includes(m.name));

  function setManagers(next: string[]) {
    updateCompany(company!.id, {
      accountManagers: next,
      accountManager: next[0] ?? company!.accountManager,
    });
  }

  return (
    <>
      <RecordShell
        breadcrumb={
          <>
            <Link href="/app/companies">Companies</Link> / {company.name}
          </>
        }
        title={company.name}
        subtitle={
          <>
            <TonePill value={company.status} />
            <span>{managers.join(", ")}</span>
            <span>{company.openProjects} open projects</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setCreateKind("time")}>
              Add activity
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(true)}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setTab("Contacts");
                pushToast("Portal access is managed on contacts for this company.");
              }}
            >
              Portal
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              aria-pressed={!!company.favorite}
              onClick={() => updateCompany(company.id, { favorite: !company.favorite })}
            >
              <Star size={16} fill={company.favorite ? "currentColor" : "none"} />
              Favorite
            </button>
            <IfCan cap="create_project">
              <button type="button" className="btn btn-primary" onClick={() => setCreateKind("project")}>
                New project
              </button>
            </IfCan>
          </>
        }
        rail={
          <>
            <RecordRailBlock
              title="Primary contact"
              action={
                <button type="button" className="text-xs font-semibold text-[var(--color-navy)]" onClick={() => setTab("Contacts")}>
                  All
                </button>
              }
            >
              {primary ? (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar initials={primary.initials} name={primary.name} />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{primary.name}</div>
                      <div className="text-[var(--color-muted)] truncate">{primary.title}</div>
                    </div>
                  </div>
                  <a className="icon-btn" href={`mailto:${primary.email}`} aria-label={`Email ${primary.name}`}>
                    <Mail size={15} />
                  </a>
                </div>
              ) : (
                <button type="button" className="btn btn-ghost w-full justify-center text-sm" onClick={() => setCreateKind("contact")}>
                  Add a contact
                </button>
              )}
            </RecordRailBlock>
            <RecordRailBlock title="Comments">
              <textarea
                className="field-input min-h-16"
                placeholder="Add a company note"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary mt-2 w-full"
                disabled={!comment.trim()}
                onClick={() => {
                  addActivityNote(company.id, comment.trim());
                  setComment("");
                }}
              >
                Save comment
              </button>
            </RecordRailBlock>
            <RecordRailBlock title="Company details">
              <dl className="space-y-2">
                <RecordFact label="Status">
                  <select
                    className="field-input"
                    value={company.status}
                    onChange={(e) => updateCompany(company.id, { status: e.target.value as CompanyStatus })}
                  >
                    {["Active", "Prospect", "Overdue Inv."].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </RecordFact>
                <RecordFact label="Created">{company.createdAt ? formatDisplayDate(company.createdAt) : company.lastActivity}</RecordFact>
                <RecordFact label="Account managers">
                  <div className="space-y-1.5">
                    {managers.map((name) => (
                      <div key={name} className="flex items-center justify-between gap-2 text-sm">
                        <span>{name}</span>
                        {managers.length > 1 ? (
                          <button type="button" className="text-[var(--color-muted)]" aria-label={`Remove ${name}`} onClick={() => setManagers(managers.filter((m) => m !== name))}>
                            <X size={14} />
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {availableManagers.length ? (
                      <select
                        className="field-input"
                        value=""
                        onChange={(e) => {
                          if (!e.target.value) return;
                          setManagers([...managers, e.target.value]);
                        }}
                      >
                        <option value="">Add manager</option>
                        {availableManagers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </RecordFact>
                <RecordFact label="Portal">{company.portalContacts} enabled contacts</RecordFact>
                <RecordFact label="Billing terms">{company.billingTerms}</RecordFact>
                <RecordFact label="Website">
                  {company.website ? (
                    <a href={company.website} className="text-[var(--color-navy)]" target="_blank" rel="noreferrer">
                      {company.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "None"
                  )}
                </RecordFact>
                <RecordFact label="Phone">{company.phone || "None"}</RecordFact>
                <RecordFact label="Email">
                  {company.email ? (
                    <a href={`mailto:${company.email}`} className="text-[var(--color-navy)]">
                      {company.email}
                    </a>
                  ) : (
                    "None"
                  )}
                </RecordFact>
                {company.fax ? <RecordFact label="Fax">{company.fax}</RecordFact> : null}
                <RecordFact label="Privacy">{company.privacy ?? "Standard"}</RecordFact>
                {(company.customFields ?? []).map((field) => (
                  <RecordFact key={field.id} label={field.label}>
                    {field.value || "Empty"}
                  </RecordFact>
                ))}
                <RecordFact label="Address">
                  <div className="flex gap-2">
                    <input
                      className="field-input"
                      value={addressDraft}
                      placeholder="Add an address"
                      onChange={(e) => setAddressDraft(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={addressDraft === (company.address ?? "")}
                      onClick={() => updateCompany(company.id, { address: addressDraft.trim() })}
                    >
                      Save
                    </button>
                  </div>
                </RecordFact>
              </dl>
            </RecordRailBlock>
            <RecordRailBlock title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="pill pill-neutral inline-flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      aria-label={`Remove ${tag}`}
                      onClick={() => updateCompany(company.id, { tags: tags.filter((t) => t !== tag) })}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  className="field-input"
                  placeholder="Add tag"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    const next = tagDraft.trim();
                    if (!next || tags.includes(next)) return;
                    updateCompany(company.id, { tags: [...tags, next] });
                    setTagDraft("");
                  }}
                >
                  Add
                </button>
              </div>
            </RecordRailBlock>
          </>
        }
      >
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "Overview" && (
          <div className="company-overview">
            <div className="panel p-4">
              <SectionHead title="Company summary" action="Edit" onAction={() => setEditOpen(true)} />
              <p className="text-sm text-[var(--color-muted)]">{company.notes || "Add a company summary from Edit."}</p>
              <div className="company-summary-grid mt-3">
                <div>
                  <div className="metric-label">Industry</div>
                  <div className="text-sm font-medium">{company.industry}</div>
                </div>
                <div>
                  <div className="metric-label">Website</div>
                  <div className="text-sm font-medium">{company.website ? company.website.replace(/^https?:\/\//, "") : "None"}</div>
                </div>
                <div>
                  <div className="metric-label">Last activity</div>
                  <div className="text-sm font-medium">{company.lastActivity}</div>
                </div>
                <div>
                  <div className="metric-label">Open work</div>
                  <div className="text-sm font-medium">
                    {company.openProjects} projects · {openTasks.length} tasks · {company.openTickets} tickets
                  </div>
                </div>
                <div>
                  <div className="metric-label">Primary contact</div>
                  <div className="text-sm font-medium">{primary?.name ?? "None"}</div>
                </div>
              </div>
            </div>

            <div className="company-overview-hero">
              <div className="panel p-4">
                <SectionHead title="Activities vs hours" />
                <ActivityHoursChart points={chartPoints} />
                <div className="mt-2 flex gap-4 text-xs text-[var(--color-muted)]">
                  <span>Green bars: activities</span>
                  <span>Line: hours logged</span>
                </div>
              </div>
              <div className="company-stat-grid">
                <RecordMetric
                  label="Revenue"
                  value={money(paidRevenue)}
                  hint={`Paid since ${company.createdAt ? formatDisplayDate(company.createdAt) : "inception"}`}
                />
                <RecordMetric label="Outstanding" value={money(outstanding)} hint={`${companyInvoices.length} invoices`} />
                <RecordMetric
                  label="Overdue"
                  value={money(overdueAmount)}
                  hint={overdueAmount ? "Needs collection" : "No overdue invoices"}
                />
                <RecordMetric label="Touches" value={String(activity.length)} hint="Comments, time, and delivery notes" />
              </div>
            </div>

            <div className="company-split">
              <div className="panel p-4">
                <SectionHead title="Recent work" action="See all work" onAction={() => setTab("Work")} />
                <table className="table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Budget</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyProjects.slice(0, 4).map((p) => (
                      <tr key={p.id}>
                        <td>
                          <Link href={`/app/projects/view/?id=${p.id}`} className="font-medium text-[var(--color-navy)]">
                            {p.name}
                          </Link>
                          <div className="text-xs text-[var(--color-muted)]">{p.projectType}</div>
                        </td>
                        <td>
                          <TonePill value={p.status} />
                        </td>
                        <td>{money(p.budgetAmount)}</td>
                        <td>{formatDisplayDate(p.due)}</td>
                      </tr>
                    ))}
                    {!companyProjects.length ? (
                      <tr>
                        <td colSpan={4} className="text-[var(--color-muted)]">
                          No work on this company yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="panel p-4">
                <SectionHead title="Open tasks" action="See all tasks" onAction={() => setTab("Tasks")} />
                <table className="table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Project</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openTasks.slice(0, 5).map((t) => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td>
                          <Link href={`/app/projects/view/?id=${t.projectId}`} className="text-[var(--color-navy)]">
                            {t.projectName}
                          </Link>
                        </td>
                        <td>
                          <TonePill value={t.status} />
                        </td>
                      </tr>
                    ))}
                    {!openTasks.length ? (
                      <tr>
                        <td colSpan={3} className="text-[var(--color-muted)]">
                          No open tasks.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="company-split">
              <div className="panel p-4">
                <SectionHead title="Recent activity" action="Open stream" onAction={() => setTab("Stream")} />
                <ActivityList items={activity.slice(0, 5)} compact />
              </div>
              <div className="panel p-4">
                <SectionHead title="Billing summary" action="Open billing" onAction={() => setTab("Billing")} />
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt>Paid</dt>
                    <dd className="font-semibold">{money(paidRevenue)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Outstanding</dt>
                    <dd className="font-semibold">{money(outstanding)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Expenses</dt>
                    <dd className="font-semibold">{money(companyExpenses.reduce((s, e) => s + e.amount, 0))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Next invoice</dt>
                    <dd>
                      {nextInvoice ? (
                        <Link href={`/app/billing/view/?id=${nextInvoice.id}`} className="font-semibold text-[var(--color-navy)]">
                          {nextInvoice.number}
                        </Link>
                      ) : (
                        "None open"
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Retainers</dt>
                    <dd>{companyRetainers.length}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="company-split">
              <div className="panel p-4">
                <SectionHead title="Attachments" action="See all" onAction={() => setTab("Attachments")} />
                <ul className="space-y-2 text-sm">
                  {attachments.slice(0, 5).map((f) => (
                    <li key={`${f.source}-${f.id}`} className="flex justify-between gap-3">
                      <span className="font-medium">{f.name}</span>
                      <span className="text-[var(--color-muted)]">{f.source}</span>
                    </li>
                  ))}
                  {!attachments.length ? <li className="text-[var(--color-muted)]">No attachments yet.</li> : null}
                </ul>
              </div>
              <div className="panel p-4">
                <SectionHead title="Assets" action="See all" onAction={() => setTab("Assets")} />
                <ul className="space-y-2 text-sm">
                  {assets.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3">
                      <span>
                        <span className="font-medium">{a.name}</span>
                        <span className="ml-2 text-[var(--color-muted)]">{a.kind}</span>
                      </span>
                      <TonePill value={a.status} />
                    </li>
                  ))}
                  {!assets.length ? <li className="text-[var(--color-muted)]">No assets on this company.</li> : null}
                </ul>
              </div>
            </div>

            <div className="panel p-4">
              <SectionHead title="Staff hours" />
              {staffHours.length ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffHours.map(([name, hours]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td className="tabular-nums">{hours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">No time logged on this company.</p>
              )}
            </div>
          </div>
        )}

        {tab === "Stream" && (
          <div className="panel p-4">
            <ActivityStream
              items={activity}
              placeholder="Post to the company stream"
              onPost={(text) => addActivityNote(company.id, text)}
            />
          </div>
        )}

        {tab === "Contacts" && (
          <div className="panel overflow-hidden">
            <div className="flex justify-end p-3">
              <button type="button" className="btn btn-primary" onClick={() => setCreateKind("contact")}>
                + Contact
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Title</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Portal</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {companyContacts.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">
                      <Link href={`/app/contacts/view/?id=${c.id}`} className="text-[var(--color-navy)]">
                        {c.name}
                      </Link>
                      {primary?.id === c.id ? <span className="ml-2 text-xs text-[var(--color-muted)]">Primary</span> : null}
                    </td>
                    <td>{c.title}</td>
                    <td>
                      <a href={`mailto:${c.email}`} className="text-[var(--color-navy)]">
                        {c.email}
                      </a>
                    </td>
                    <td>
                      {c.phone ? (
                        <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="text-[var(--color-navy)]">
                          {c.phone}
                        </a>
                      ) : (
                        "None"
                      )}
                    </td>
                    <td>
                      <TonePill value={c.portal} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ContactActions contact={c} compact />
                        {primary?.id === c.id ? null : (
                          <button type="button" className="btn btn-ghost text-sm" onClick={() => updateCompany(company.id, { primaryContactId: c.id })}>
                            Set primary
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!companyContacts.length ? (
                  <tr>
                    <td colSpan={6} className="text-[var(--color-muted)]">
                      No contacts yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Work" && (
          <div className="panel overflow-hidden">
            <div className="flex justify-end p-3">
              <IfCan cap="create_project">
                <button type="button" className="btn btn-primary" onClick={() => setCreateKind("project")}>
                  New project
                </button>
              </IfCan>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Type</th>
                  <th>Progress</th>
                  <th>Status</th>
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
                    <td>{p.projectType}</td>
                    <td>
                      <ProgressBar value={p.progress} />
                    </td>
                    <td>
                      <TonePill value={p.status} />
                    </td>
                    <td>{formatDisplayDate(p.due)}</td>
                  </tr>
                ))}
                {!companyProjects.length ? (
                  <tr>
                    <td colSpan={5} className="text-[var(--color-muted)]">
                      No projects on this company.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Tasks" && (
          <div className="panel overflow-hidden">
            <div className="flex justify-end p-3">
              <button type="button" className="btn btn-primary" onClick={() => setCreateKind("task")}>
                New task
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {companyTasks.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>
                      <Link href={`/app/projects/view/?id=${t.projectId}`} className="text-[var(--color-navy)]">
                        {t.projectName}
                      </Link>
                    </td>
                    <td>{t.assignee}</td>
                    <td>
                      <TonePill value={t.status} />
                    </td>
                    <td>{formatDisplayDate(t.due)}</td>
                  </tr>
                ))}
                {!companyTasks.length ? (
                  <tr>
                    <td colSpan={5} className="text-[var(--color-muted)]">
                      No tasks on this company.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Attachments" && (
          <div className="panel overflow-hidden">
            <div className="flex justify-end p-3">
              <button type="button" className="btn btn-primary" onClick={() => setFileOpen(true)}>
                Add attachment
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Source</th>
                  <th>Folder</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {attachments.map((f) => (
                  <tr key={`${f.source}-${f.id}`}>
                    <td className="font-medium">{f.name}</td>
                    <td>
                      {f.projectId ? (
                        <Link href={`/app/projects/view/?id=${f.projectId}`} className="text-[var(--color-navy)]">
                          {f.projectName}
                        </Link>
                      ) : (
                        "Company"
                      )}
                    </td>
                    <td>{f.folder}</td>
                    <td className="text-right">
                      {f.source === "Company" ? (
                        <button type="button" className="btn btn-ghost text-sm" onClick={() => deleteCompanyFile(company.id, f.id)}>
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!attachments.length ? (
                  <tr>
                    <td colSpan={4} className="text-[var(--color-muted)]">
                      No attachments on this company yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Assets" && (
          <div className="panel overflow-hidden">
            <div className="flex justify-end p-3">
              <button type="button" className="btn btn-primary" onClick={() => setAssetOpen(true)}>
                Add asset
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => {
                  const project = projects.find((p) => p.id === a.projectId);
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="font-medium">{a.name}</div>
                        {a.note ? <div className="text-xs text-[var(--color-muted)]">{a.note}</div> : null}
                      </td>
                      <td>{a.kind}</td>
                      <td>{a.owner}</td>
                      <td>
                        {project ? (
                          <Link href={`/app/projects/view/?id=${project.id}`} className="text-[var(--color-navy)]">
                            {project.name}
                          </Link>
                        ) : (
                          "Company"
                        )}
                      </td>
                      <td>
                        <TonePill value={a.status} />
                      </td>
                      <td className="text-right">
                        <button type="button" className="btn btn-ghost text-sm" onClick={() => deleteCompanyAsset(a.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!assets.length ? (
                  <tr>
                    <td colSpan={6} className="text-[var(--color-muted)]">
                      No assets on this company.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Tickets" && (
          <div className="panel overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {companyTickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/app/tickets/view/?id=${t.id}`} className="font-medium text-[var(--color-navy)]">
                        #{t.number} {t.subject}
                      </Link>
                    </td>
                    <td>
                      <TonePill value={t.priority} />
                    </td>
                    <td>{t.assignee}</td>
                    <td>
                      <TonePill value={t.status} />
                    </td>
                  </tr>
                ))}
                {!companyTickets.length ? (
                  <tr>
                    <td colSpan={4} className="text-[var(--color-muted)]">
                      No tickets for this company.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Retainers" && (
          <div className="panel overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Retainer</th>
                  <th>Period</th>
                  <th>Usage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {companyRetainers.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/app/retainers/view/?id=${r.id}`} className="font-medium text-[var(--color-navy)]">
                        {r.name}
                      </Link>
                    </td>
                    <td>{r.periodLabel}</td>
                    <td>
                      {r.usedHours} / {r.budgetHours} hrs
                    </td>
                    <td>
                      <TonePill value={r.status} />
                    </td>
                  </tr>
                ))}
                {!companyRetainers.length ? (
                  <tr>
                    <td colSpan={4} className="text-[var(--color-muted)]">
                      No retainers for this company.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Billing" && (
          <div className="space-y-4">
            <div className="company-stat-grid">
              <RecordMetric label="Paid" value={money(paidRevenue)} />
              <RecordMetric label="Outstanding" value={money(outstanding)} />
              <RecordMetric label="Overdue" value={money(overdueAmount)} />
              <RecordMetric label="Expenses" value={money(companyExpenses.reduce((s, e) => s + e.amount, 0))} />
            </div>
            <div className="panel overflow-hidden">
              <div className="flex justify-end gap-2 p-3">
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
                <IfCan cap="create_invoice">
                  <button type="button" className="btn btn-primary" onClick={() => setInvoiceOpen(true)}>
                    New invoice
                  </button>
                </IfCan>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {companyInvoices.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <Link href={`/app/billing/view/?id=${i.id}`} className="font-medium text-[var(--color-navy)]">
                          {i.number}
                        </Link>
                      </td>
                      <td>{money(i.amount)}</td>
                      <td>{formatDisplayDate(i.due)}</td>
                      <td>
                        <TonePill value={i.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </RecordShell>

      <CreateForms kind={createKind} onClose={() => setCreateKind(null)} defaults={{ companyId: company.id, projectId: companyProjects[0]?.id }} />
      <Modal open={invoiceOpen} title={`Create invoice: ${company.name}`} onClose={() => setInvoiceOpen(false)} xl>
        <InvoiceCreateForm
          defaultCompanyId={company.id}
          defaultProjectId={companyProjects[0]?.id}
          onCancel={() => setInvoiceOpen(false)}
          onCreated={(invoiceId) => {
            setInvoiceOpen(false);
            router.push(`/app/billing/view/?id=${invoiceId}`);
          }}
        />
      </Modal>

      <Modal open={editOpen} title="Edit company" onClose={() => setEditOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const accountManager = String(fd.get("accountManager") || company.accountManager);
            updateCompany(company.id, {
              name: String(fd.get("name") || company.name),
              accountManager,
              accountManagers: [accountManager, ...managers.filter((m) => m !== accountManager)],
              industry: String(fd.get("industry") || company.industry),
              billingTerms: String(fd.get("billingTerms") || company.billingTerms),
              address: String(fd.get("address") || company.address || ""),
              website: String(fd.get("website") ?? company.website ?? ""),
              phone: String(fd.get("phone") ?? company.phone ?? ""),
              fax: String(fd.get("fax") ?? company.fax ?? ""),
              email: String(fd.get("email") ?? company.email ?? ""),
              privacy: (String(fd.get("privacy") || company.privacy || "Standard") as "Standard" | "Confidential"),
              notes: String(fd.get("notes") ?? company.notes ?? ""),
              status: String(fd.get("status") || company.status) as CompanyStatus,
            });
            setEditOpen(false);
          }}
        >
          <Field label="Name">
            <TextInput name="name" defaultValue={company.name} />
          </Field>
          <Field label="Account manager">
            <TextInput name="accountManager" defaultValue={company.accountManager} />
          </Field>
          <Field label="Status">
            <TextSelect name="status" defaultValue={company.status}>
              {["Active", "Prospect", "Overdue Inv."].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Industry">
            <TextInput name="industry" defaultValue={company.industry} />
          </Field>
          <Field label="Billing terms">
            <TextInput name="billingTerms" defaultValue={company.billingTerms} />
          </Field>
          <Field label="Website">
            <TextInput name="website" defaultValue={company.website ?? ""} />
          </Field>
          <Field label="Phone">
            <TextInput name="phone" defaultValue={company.phone ?? ""} />
          </Field>
          <Field label="Fax">
            <TextInput name="fax" defaultValue={company.fax ?? ""} />
          </Field>
          <Field label="Email">
            <TextInput name="email" type="email" defaultValue={company.email ?? ""} />
          </Field>
          <Field label="Privacy">
            <TextSelect name="privacy" defaultValue={company.privacy ?? "Standard"}>
              <option>Standard</option>
              <option>Confidential</option>
            </TextSelect>
          </Field>
          <Field label="Address">
            <TextInput name="address" defaultValue={company.address ?? ""} />
          </Field>
          <Field label="Summary">
            <textarea name="notes" className="field-input min-h-20" defaultValue={company.notes ?? ""} />
          </Field>
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
        </form>
      </Modal>

      <Modal open={fileOpen} title="Add attachment" onClose={() => setFileOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("name") || "").trim();
            if (!name) return;
            addCompanyFile(company.id, {
              name,
              folder: String(fd.get("folder") || "General"),
              kind: (String(fd.get("kind") || "other") as CompanyFileKind),
              sizeKb: 12,
            });
            setFileOpen(false);
          }}
        >
          <Field label="File name">
            <TextInput name="name" placeholder="Statement_of_Work.pdf" required />
          </Field>
          <Field label="Folder">
            <TextSelect name="folder" defaultValue="General">
              {["General", "Contracts", "Billing", "Reports"].map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Type">
            <TextSelect name="kind" defaultValue="pdf">
              {["pdf", "docx", "pptx", "img", "other"].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </TextSelect>
          </Field>
          <button type="submit" className="btn btn-primary">
            Add attachment
          </button>
        </form>
      </Modal>

      <Modal open={assetOpen} title="Add asset" onClose={() => setAssetOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("name") || "").trim();
            if (!name) return;
            const projectId = String(fd.get("projectId") || "");
            createCompanyAsset({
              companyId: company.id,
              name,
              kind: String(fd.get("kind") || "License") as CompanyAssetKind,
              status: String(fd.get("status") || "Active") as CompanyAssetStatus,
              owner: String(fd.get("owner") || managers[0] || "Staff"),
              projectId: projectId || undefined,
              note: String(fd.get("note") || ""),
            });
            setAssetOpen(false);
          }}
        >
          <Field label="Name">
            <TextInput name="name" placeholder="Production license" required />
          </Field>
          <Field label="Type">
            <TextSelect name="kind" defaultValue="License">
              {["License", "Hardware", "Subscription", "Environment"].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Status">
            <TextSelect name="status" defaultValue="Active">
              {["Active", "Expiring", "Retired"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Owner">
            <TextSelect name="owner" defaultValue={managers[0] ?? team[0]?.name}>
              {[...managers, ...team.map((m) => m.name)].filter((v, i, arr) => arr.indexOf(v) === i).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Project">
            <TextSelect name="projectId" defaultValue="">
              <option value="">Company level</option>
              {companyProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Note">
            <TextInput name="note" placeholder="Renewal, serial, or environment" />
          </Field>
          <button type="submit" className="btn btn-primary">
            Add asset
          </button>
        </form>
      </Modal>
    </>
  );
}

type CompanyFileKind = "pdf" | "docx" | "pptx" | "img" | "other";
