"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { ActivityHoursChart, monthSeries } from "@/components/records/ActivityHoursChart";
import { RecordFact, RecordMetric, RecordRailBlock, RecordShell, TonePill } from "@/components/records/RecordChrome";
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
import type { CompanyStatus } from "@/lib/types";

function activityDate(when: string) {
  if (/today|yesterday/i.test(when)) return "2026-08-05";
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const idx = months.findIndex((m) => when.toLowerCase().includes(m));
  if (idx >= 0) return `2026-${String(idx + 1).padStart(2, "0")}-15`;
  return "2026-08-01";
}

export function CompanyDetail({ id }: { id: string }) {
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const contacts = useAppStore((s) => s.contacts);
  const tickets = useAppStore((s) => s.tickets);
  const invoices = useAppStore((s) => s.invoices);
  const retainers = useAppStore((s) => s.retainers);
  const activities = useAppStore((s) => s.activities);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const tasks = useAppStore((s) => s.tasks);
  const trackView = useAppStore((s) => s.trackView);
  const addActivityNote = useAppStore((s) => s.addActivityNote);
  const updateCompany = useAppStore((s) => s.updateCompany);
  const pushToast = useAppStore((s) => s.pushToast);
  const [tab, setTab] = useState("Overview");
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [tagDraft, setTagDraft] = useState("");

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
    () => (company ? activities.filter((a) => a.companyId === company.id) : []),
    [activities, company],
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
  const companyFiles = useMemo(
    () => companyProjects.flatMap((p) => p.files.map((f) => ({ ...f, projectName: p.name, projectId: p.id }))),
    [companyProjects],
  );
  const primary = companyContacts[0];
  const paidRevenue = companyInvoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);
  const chartPoints = useMemo(
    () =>
      monthSeries([
        ...companyTime.map((t) => ({ date: t.date, hours: t.hours })),
        ...activity.map((a) => ({ date: activityDate(a.when), activity: true })),
      ]),
    [companyTime, activity],
  );

  useEffect(() => {
    if (!company) return;
    trackView("company", company.id, company.name);
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
            <span>{company.accountManager}</span>
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
            <button type="button" className="btn btn-primary" onClick={() => setCreateKind("project")}>
              New project
            </button>
          </>
        }
        rail={
          <>
            <RecordRailBlock title="Frequently contacted">
              {primary ? (
                <div className="flex items-center gap-2 text-sm">
                  <Avatar initials={primary.initials} name={primary.name} />
                  <div>
                    <div className="font-semibold">{primary.name}</div>
                    <div className="text-[var(--color-muted)]">{primary.title}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">No contacts yet.</p>
              )}
            </RecordRailBlock>
            <RecordRailBlock title="Comments">
              <textarea
                className="field-input min-h-20"
                placeholder="Add a comment on this company"
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
                <RecordFact label="Primary contact">{primary?.name ?? "Add a contact"}</RecordFact>
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
                <RecordFact label="Account manager">{company.accountManager}</RecordFact>
                <RecordFact label="Billing terms">{company.billingTerms}</RecordFact>
                <RecordFact label="Address">{company.address ?? "Add an address"}</RecordFact>
              </dl>
            </RecordRailBlock>
            <RecordRailBlock title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="pill pill-neutral">
                    {tag}
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
                    if (!next) return;
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
        <Tabs
          tabs={["Overview", "Stream", "Contacts", "Work", "Projects", "Tickets", "Retainers", "Billing", "Files"]}
          active={tab}
          onChange={setTab}
        />

        {tab === "Overview" && (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="panel p-4">
                <h2 className="mb-2 font-semibold text-[var(--color-navy)]">Activities vs hours</h2>
                <ActivityHoursChart points={chartPoints} />
                <div className="mt-2 flex gap-4 text-xs text-[var(--color-muted)]">
                  <span>Green bars: activities</span>
                  <span>Line: hours logged</span>
                </div>
              </div>
              <div className="grid gap-3">
                <RecordMetric label="Revenue" value={money(paidRevenue)} hint={`${companyInvoices.length} invoices on this company`} />
                <RecordMetric label="Touches" value={String(activity.length)} hint="Comments, time, and delivery notes" />
              </div>
            </div>
            <div className="panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-[var(--color-navy)]">Recent work</h2>
                <button type="button" className="text-sm font-semibold text-[var(--color-navy)]" onClick={() => setTab("Work")}>
                  See all work
                </button>
              </div>
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
                  {companyProjects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/app/projects/view/?id=${p.id}`} className="font-medium text-[var(--color-navy)]">
                          {p.name}
                        </Link>
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
          </div>
        )}

        {tab === "Stream" && (
          <div className="panel p-4 space-y-3">
            {activity.map((a) => (
              <div key={a.id} className="border-b border-[var(--color-border)] pb-3 text-sm">
                <div className="text-xs text-[var(--color-muted)]">{a.when}</div>
                <div>{a.text}</div>
                {a.projectId ? (
                  <Link href={`/app/projects/view/?id=${a.projectId}`} className="text-xs font-semibold text-[var(--color-navy)]">
                    Open project
                  </Link>
                ) : null}
              </div>
            ))}
            {!activity.length ? <p className="text-sm text-[var(--color-muted)]">No stream items yet.</p> : null}
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
                  <th>Portal</th>
                </tr>
              </thead>
              <tbody>
                {companyContacts.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td>{c.title}</td>
                    <td>{c.email}</td>
                    <td>
                      <TonePill value={c.portal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Work" && (
          <div className="space-y-4">
            <div className="panel overflow-hidden">
              <h2 className="p-4 pb-0 font-semibold text-[var(--color-navy)]">Projects</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Type</th>
                    <th>Progress</th>
                    <th>Status</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel overflow-hidden">
              <h2 className="p-4 pb-0 font-semibold text-[var(--color-navy)]">Tasks</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Assignee</th>
                    <th>Status</th>
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
                    </tr>
                  ))}
                  {!companyTasks.length ? (
                    <tr>
                      <td colSpan={4} className="text-[var(--color-muted)]">
                        No tasks on this company.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "Projects" && (
          <div className="panel overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
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
                    <td>
                      <TonePill value={p.status} />
                    </td>
                    <td>
                      <ProgressBar value={p.progress} />
                    </td>
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
        )}

        {tab === "Files" && (
          <div className="panel overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Project</th>
                  <th>Folder</th>
                </tr>
              </thead>
              <tbody>
                {companyFiles.map((f) => (
                  <tr key={`${f.projectId}-${f.id}`}>
                    <td className="font-medium">{f.name}</td>
                    <td>
                      <Link href={`/app/projects/view/?id=${f.projectId}`} className="text-[var(--color-navy)]">
                        {f.projectName}
                      </Link>
                    </td>
                    <td>{f.folder}</td>
                  </tr>
                ))}
                {!companyFiles.length ? (
                  <tr>
                    <td colSpan={3} className="text-[var(--color-muted)]">
                      No attachments on this company yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </RecordShell>

      <CreateForms kind={createKind} onClose={() => setCreateKind(null)} defaults={{ companyId: company.id }} />

      <Modal open={editOpen} title="Edit company" onClose={() => setEditOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateCompany(company.id, {
              name: String(fd.get("name") || company.name),
              accountManager: String(fd.get("accountManager") || company.accountManager),
              industry: String(fd.get("industry") || company.industry),
              billingTerms: String(fd.get("billingTerms") || company.billingTerms),
              address: String(fd.get("address") || company.address || ""),
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
          <Field label="Address">
            <TextInput name="address" defaultValue={company.address ?? ""} />
          </Field>
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
        </form>
      </Modal>
    </>
  );
}
