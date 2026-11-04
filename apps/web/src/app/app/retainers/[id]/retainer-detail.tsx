"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { MoreHorizontal, MoreVertical } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { FilesNotesPanel } from "@/components/FilesNotesPanel";
import { AddActivityModal, AddPeriodModal } from "@/components/retainers/RetainerModals";
import {
  Field,
  Modal,
  PageHeader,
  ProgressBar,
  SideRail,
  StatusPill,
  Tabs,
  TextInput,
  TextSelect,
  statusTone,
} from "@/components/ui";
import { IfCan } from "@/components/auth/IfCan";
import { useAuth } from "@/lib/auth";
import { companyProjectId, daysUntil, earnedValue, nextPeriodRange, pickCurrentPeriod, retainerRate } from "@/lib/retainers";
import { formatDisplayDate, money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import type { RetainerStatus, RetainerType } from "@/lib/types";

const TABS = ["Overview", "Periods", "Billing", "Tickets", "Files & Notes"];

export function RetainerDetail({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, can } = useAuth();
  const retainers = useAppStore((s) => s.retainers);
  const retainerPeriods = useAppStore((s) => s.retainerPeriods);
  const allTickets = useAppStore((s) => s.tickets);
  const allContacts = useAppStore((s) => s.contacts);
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const updateRetainer = useAppStore((s) => s.updateRetainer);
  const allocate = useAppStore((s) => s.allocateRetainerHours);
  const addPeriod = useAppStore((s) => s.addRetainerPeriod);
  const updatePeriod = useAppStore((s) => s.updateRetainerPeriod);
  const generatePeriodInvoice = useAppStore((s) => s.generatePeriodInvoice);
  const queueEmail = useAppStore((s) => s.queueEmail);
  const addRetainerFile = useAppStore((s) => s.addRetainerFile);
  const deleteRetainerFile = useAppStore((s) => s.deleteRetainerFile);
  const moveRetainerFile = useAppStore((s) => s.moveRetainerFile);
  const addRetainerNote = useAppStore((s) => s.addRetainerNote);
  const pushToast = useAppStore((s) => s.pushToast);
  const trackView = useAppStore((s) => s.trackView);
  const [tab, setTab] = useState("Overview");
  const [editOpen, setEditOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [periodMenu, setPeriodMenu] = useState<string | null>(null);
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [hours, setHours] = useState("1");

  const retainer = useMemo(() => retainers.find((r) => r.id === id), [retainers, id]);
  const periods = useMemo(
    () => retainerPeriods.filter((p) => p.retainerId === id),
    [retainerPeriods, id],
  );
  const tickets = useMemo(
    () => allTickets.filter((t) => t.companyId === retainer?.companyId),
    [allTickets, retainer?.companyId],
  );
  const contacts = useMemo(
    () => allContacts.filter((c) => c.companyId === retainer?.companyId),
    [allContacts, retainer?.companyId],
  );
  const linkedContact = useMemo(
    () => contacts.find((c) => c.id === retainer?.contactId) ?? contacts[0],
    [contacts, retainer?.contactId],
  );
  const linkedProjects = useMemo(
    () => projects.filter((p) => p.companyId === retainer?.companyId),
    [projects, retainer?.companyId],
  );
  const upcoming = useMemo(() => {
    const ids = new Set(linkedProjects.map((p) => p.id));
    return tasks
      .filter((task) => ids.has(task.projectId) && task.status !== "Done")
      .slice()
      .sort((a, b) => a.due.localeCompare(b.due))
      .slice(0, 5);
  }, [linkedProjects, tasks]);
  const currentPeriod = useMemo(() => pickCurrentPeriod(periods), [periods]);
  const periodDraft = nextPeriodRange(periods);

  useEffect(() => {
    if (!retainer) return;
    trackView("retainer", retainer.id, retainer.name);
  }, [retainer, trackView]);

  useEffect(() => {
    const edit = searchParams.get("edit") === "1";
    const period = searchParams.get("period") === "1";
    if (!edit && !period) return;
    if (edit) setEditOpen(true);
    if (period) setPeriodOpen(true);
    router.replace(`/app/retainers/view/?id=${id}`);
  }, [id, router, searchParams]);

  if (!retainer) {
    return (
      <div className="fade-in panel p-6">
        <p className="font-semibold text-[var(--color-navy)]">Retainer not found</p>
        <Link href="/app/retainers" className="btn btn-primary mt-4">
          Back to retainers
        </Link>
      </div>
    );
  }

  const rate = retainerRate(retainer.rate);
  const budgetHours = currentPeriod?.budgetHours ?? retainer.budgetHours;
  const usedHours = currentPeriod?.usedHours ?? retainer.usedHours;
  const pct = Math.round((usedHours / Math.max(budgetHours, 1)) * 100);
  const remaining = Math.max(0, budgetHours - usedHours);
  const renewIn = daysUntil(retainer.nextRenew ?? retainer.expires);
  const projectId = companyProjectId(projects, retainer.companyId);

  function emailContact() {
    const to = linkedContact?.email ?? "billing@client.com";
    queueEmail(
      to,
      `Retainer: ${retainer!.name}`,
      `Usage ${retainer!.usedHours}/${retainer!.budgetHours}h. Period expires ${retainer!.expires}.`,
    );
    pushToast(`Email queued to ${to}`);
  }

  function invoicePeriod(periodId?: string) {
    const target = periodId ?? periods.find((p) => p.status === "Opened")?.id;
    if (!target) {
      pushToast("No open period to invoice", "danger");
      return;
    }
    const inv = generatePeriodInvoice(target);
    if (inv) router.push(`/app/billing/view/?id=${inv}`);
  }

  function startLogTime() {
    if (!projectId) {
      pushToast("Add a project on this company first.", "danger");
      return;
    }
    setCreateKind("time");
  }

  return (
    <div className="fade-in">
      <div className="mb-2 text-sm text-[var(--color-muted)]">
        <Link href="/app/companies">Company</Link>:{" "}
        <Link href={`/app/companies/view/?id=${retainer.companyId}`}>{retainer.companyName}</Link> / Retainer
      </div>
      <PageHeader
        title={retainer.name}
        subtitle={`${retainer.companyName} · ${retainer.type} · Manager ${retainer.manager}`}
        actions={
          <>
            <IfCan cap="log_time">
              <button type="button" className="btn btn-primary" onClick={startLogTime}>
                Log time
              </button>
            </IfCan>
            <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(true)}>
              Edit
            </button>
            <div className="row-actions">
              <button
                type="button"
                className="icon-btn"
                aria-label="More retainer actions"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((open) => !open)}
              >
                <MoreHorizontal size={18} />
              </button>
              {moreOpen ? (
                <div className="row-menu">
                  {can("manage_retainer") ? (
                    <button type="button" onClick={() => { setPeriodOpen(true); setMoreOpen(false); }}>
                      Add period
                    </button>
                  ) : null}
                  {can("manage_retainer") ? (
                    <button type="button" onClick={() => { setActivityOpen(true); setMoreOpen(false); }}>
                      Add activity
                    </button>
                  ) : null}
                  {can("create_invoice") ? (
                    <button type="button" onClick={() => { invoicePeriod(); setMoreOpen(false); }}>
                      Create invoice
                    </button>
                  ) : null}
                  {can("create_ticket") ? (
                    <button type="button" onClick={() => { setCreateKind("ticket"); setMoreOpen(false); }}>
                      New ticket
                    </button>
                  ) : null}
                  {can("create_project") ? (
                    <button type="button" onClick={() => { setCreateKind("project"); setMoreOpen(false); }}>
                      New project
                    </button>
                  ) : null}
                  <button type="button" onClick={() => { emailContact(); setMoreOpen(false); }}>
                    Email contact
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      router.push("/app/timesheets");
                      setMoreOpen(false);
                    }}
                  >
                    Timesheets
                  </button>
                  <button type="button" onClick={() => { setPortalOpen(true); setMoreOpen(false); }}>
                    Client portal
                  </button>
                </div>
              ) : null}
            </div>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["Active", "Expired", "Cancelled"].map((s) => (
          <button
            key={s}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              retainer.status === s
                ? "bg-[var(--color-success)] text-white"
                : "bg-white text-[var(--color-muted)] border border-[var(--color-border)]"
            }`}
            onClick={() => updateRetainer(retainer.id, { status: s as RetainerStatus })}
          >
            {s === "Active" ? "Active" : s === "Expired" ? "Retainer expired" : "Cancel retainer"}
          </button>
        ))}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(t) => startTransition(() => setTab(t))} />

      {tab === "Overview" ? (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <SideRail title="Retainer details">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[var(--color-muted)]">Company</dt>
                <dd className="font-semibold">{retainer.companyName}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Contact</dt>
                <dd className="font-semibold">{retainer.contactName ?? "Not linked"}</dd>
                {linkedContact ? (
                  <dd className="mt-0.5 text-xs text-[var(--color-muted)]">
                    <Link href={`/app/contacts/view/?id=${linkedContact.id}`} className="hover:underline">
                      {linkedContact.email}
                    </Link>
                  </dd>
                ) : null}
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Manager</dt>
                <dd>{retainer.manager}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Type</dt>
                <dd>{retainer.type}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Auto renew</dt>
                <dd>{retainer.autoRenew ? "On" : "Off"}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Rate</dt>
                <dd>{money(rate)}/hr</dd>
              </div>
            </dl>
            <h3 className="mt-6 text-sm font-semibold text-[var(--color-navy)]">Key dates</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-[var(--color-muted)]">Started</dt>
                <dd>{retainer.started ? formatDisplayDate(retainer.started) : "Not set"}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Expires</dt>
                <dd>{formatDisplayDate(retainer.expires)}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Period began</dt>
                <dd>{currentPeriod ? formatDisplayDate(currentPeriod.start) : "Not set"}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Next renew</dt>
                <dd>{retainer.nextRenew ? formatDisplayDate(retainer.nextRenew) : formatDisplayDate(retainer.expires)}</dd>
              </div>
            </dl>
          </SideRail>
          <div className="space-y-4">
            <div className="panel p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-[var(--color-navy)]">Current period</h2>
                {currentPeriod ? (
                  <span className="text-sm text-[var(--color-muted)]">
                    {formatDisplayDate(currentPeriod.start)} to {formatDisplayDate(currentPeriod.end)}
                  </span>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="Budget" value={`${budgetHours}h`} />
                <Metric label="Used" value={`${usedHours}h`} />
                <Metric label="Remaining" value={`${remaining}h`} accent />
                <Metric label="Renewal" value={renewIn === null ? "Not set" : renewIn >= 0 ? `${renewIn} days` : `${Math.abs(renewIn)} days ago`} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Metric label="Earned" value={money(earnedValue(usedHours, retainer.rate))} />
                <Metric label="Burn" value={`${pct}%`} />
              </div>
              <div className="mt-4">
                <ProgressBar value={Math.min(pct, 100)} />
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <Field label="Allocate hours">
                  <TextInput type="number" step="0.25" min="0.25" value={hours} onChange={(e) => setHours(e.target.value)} />
                </Field>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const n = Number(hours);
                    if (!n) return;
                    allocate(retainer.id, n);
                    setHours("1");
                  }}
                >
                  Allocate
                </button>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="panel p-4">
                <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Linked work</h2>
                <ul className="space-y-2 text-sm">
                  {linkedProjects.map((project) => (
                    <li key={project.id}>
                      <Link href={`/app/projects/view/?id=${project.id}`} className="font-semibold text-[var(--color-navy)] hover:underline">
                        {project.name}
                      </Link>
                      <div className="text-xs text-[var(--color-muted)]">{project.status}</div>
                    </li>
                  ))}
                  {!linkedProjects.length ? <li className="text-[var(--color-muted)]">No projects on this company.</li> : null}
                </ul>
              </div>
              <div className="panel p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-[var(--color-navy)]">Upcoming work</h2>
                  <IfCan cap="log_time">
                    <button type="button" className="btn btn-ghost text-sm" onClick={startLogTime}>
                      Schedule time
                    </button>
                  </IfCan>
                </div>
                <ul className="space-y-2 text-sm">
                  {upcoming.map((task) => (
                    <li key={task.id}>
                      <span className="font-semibold">{task.name}</span>
                      <div className="text-xs text-[var(--color-muted)]">
                        {task.projectName} · due {formatDisplayDate(task.due)}
                      </div>
                    </li>
                  ))}
                  {!upcoming.length ? <li className="text-[var(--color-muted)]">No upcoming work.</li> : null}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "Periods" ? (
        <div className="panel overflow-hidden">
          <div className="flex justify-end p-3">
            <IfCan cap="manage_retainer">
              <button type="button" className="btn btn-primary" onClick={() => setPeriodOpen(true)}>
                Add new period
              </button>
            </IfCan>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Status</th>
                <th>Usage</th>
                <th>Invoice</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => {
                const burn = Math.round((p.usedHours / Math.max(p.budgetHours, 1)) * 100);
                const barClass =
                  burn > 100
                    ? "bg-[var(--color-danger)]"
                    : burn > 80
                      ? "bg-[var(--color-warning)]"
                      : "bg-[var(--color-success)]";
                return (
                  <tr key={p.id}>
                    <td>
                      {formatDisplayDate(p.start)} to {formatDisplayDate(p.end)}
                    </td>
                    <td>
                      <StatusPill tone={statusTone(p.status)}>{p.status}</StatusPill>
                    </td>
                    <td className="min-w-[180px]">
                      <div className="mb-1 text-xs tabular-nums">
                        {p.usedHours}h / {p.budgetHours}h
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e8ecf3]">
                        <div className={`h-full ${barClass}`} style={{ width: `${Math.min(burn, 100)}%` }} />
                      </div>
                    </td>
                    <td>
                      {p.invoiceId ? (
                        <Link href={`/app/billing/view/?id=${p.invoiceId}`} className="text-[var(--color-navy)] underline">
                          View
                        </Link>
                      ) : (
                        <button type="button" className="btn btn-ghost text-sm" onClick={() => invoicePeriod(p.id)}>
                          Create
                        </button>
                      )}
                    </td>
                    <td className="row-actions text-right">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        aria-label={`Period actions ${p.start}`}
                        onClick={() => setPeriodMenu(periodMenu === p.id ? null : p.id)}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {periodMenu === p.id ? (
                        <div className="row-menu">
                          {!p.invoiceId ? (
                            <button type="button" onClick={() => { invoicePeriod(p.id); setPeriodMenu(null); }}>
                              Create invoice
                            </button>
                          ) : (
                            <button type="button" onClick={() => { router.push(`/app/billing/view/?id=${p.invoiceId}`); setPeriodMenu(null); }}>
                              Open invoice
                            </button>
                          )}
                          {p.status === "Opened" && can("manage_retainer") ? (
                            <button type="button" onClick={() => { updatePeriod(p.id, { status: "Closed" }); setPeriodMenu(null); }}>
                              Close period
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "Billing" ? (
        <div className="panel p-6">
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            Create invoices from open periods. Estimated value at {money(rate)}/hr on current usage:{" "}
            <strong className="text-[var(--color-navy)]">{money(earnedValue(retainer.usedHours, retainer.rate))}</strong>
          </p>
          <button type="button" className="btn btn-primary" onClick={() => invoicePeriod()}>
            Invoice current period
          </button>
        </div>
      ) : null}

      {tab === "Tickets" ? (
        <div className="panel overflow-hidden">
          <div className="flex justify-end p-3">
            <IfCan cap="create_ticket">
              <button type="button" className="btn btn-primary" onClick={() => setCreateKind("ticket")}>
                New ticket
              </button>
            </IfCan>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/app/tickets/view/?id=${t.id}`}>
                      #{t.number} {t.subject}
                    </Link>
                  </td>
                  <td>
                    <StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill>
                  </td>
                </tr>
              ))}
              {!tickets.length ? (
                <tr>
                  <td colSpan={2} className="text-[var(--color-muted)]">
                    No company tickets.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "Files & Notes" ? (
        <FilesNotesPanel
          files={retainer.files}
          notes={retainer.notes}
          author={user?.name ?? "Staff"}
          onUpload={(file) => addRetainerFile(retainer.id, file)}
          onDeleteFile={(fileId) => deleteRetainerFile(retainer.id, fileId)}
          onMoveFile={(fileId, folder) => moveRetainerFile(retainer.id, fileId, folder)}
          onAddNote={(body, visibility) =>
            addRetainerNote(retainer.id, { author: user?.name ?? "Staff", body, visibility })
          }
        />
      ) : null}

      <Modal open={editOpen} title="Edit retainer" onClose={() => setEditOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateRetainer(retainer.id, {
              name: String(fd.get("name") || retainer.name),
              type: String(fd.get("type") || retainer.type) as RetainerType,
              manager: String(fd.get("manager") || retainer.manager),
              contactId: String(fd.get("contactId") || "") || undefined,
              budgetHours: Number(fd.get("budgetHours") || retainer.budgetHours),
              autoRenew: fd.get("autoRenew") === "on",
              started: String(fd.get("started") || retainer.started || ""),
              nextRenew: String(fd.get("nextRenew") || retainer.nextRenew || ""),
              rate: Number(fd.get("rate") || rate),
              expires: String(fd.get("expires") || retainer.expires),
            });
            setEditOpen(false);
          }}
        >
          <Field label="Title">
            <TextInput name="name" defaultValue={retainer.name} />
          </Field>
          <Field label="Type">
            <TextSelect name="type" defaultValue={retainer.type}>
              <option>Monthly T&M</option>
              <option>Pre-paid</option>
              <option>Fixed</option>
            </TextSelect>
          </Field>
          <Field label="Manager">
            <TextInput name="manager" defaultValue={retainer.manager} />
          </Field>
          <Field label="Contact">
            <TextSelect name="contactId" defaultValue={retainer.contactId ?? ""}>
              <option value="">No contact</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Started">
            <TextInput name="started" type="date" defaultValue={retainer.started ?? ""} />
          </Field>
          <Field label="Expires">
            <TextInput name="expires" type="date" defaultValue={retainer.expires} />
          </Field>
          <Field label="Next renew">
            <TextInput name="nextRenew" type="date" defaultValue={retainer.nextRenew ?? retainer.expires} />
          </Field>
          <Field label="Budget hours">
            <TextInput name="budgetHours" type="number" defaultValue={retainer.budgetHours} />
          </Field>
          <Field label="Rate">
            <TextInput name="rate" type="number" defaultValue={rate} />
          </Field>
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input type="checkbox" name="autoRenew" defaultChecked={retainer.autoRenew} />
            Auto renew
          </label>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </form>
      </Modal>

      <AddPeriodModal
        open={periodOpen}
        defaultHours={retainer.budgetHours}
        defaultStart={periodDraft.start}
        defaultEnd={periodDraft.end}
        onClose={() => setPeriodOpen(false)}
        onSubmit={(start, end, hoursValue) => {
          addPeriod(retainer.id, start, end, hoursValue);
          setPeriodOpen(false);
          setTab("Periods");
        }}
      />
      <AddActivityModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        onSubmit={(body) => {
          addRetainerNote(retainer.id, { author: user?.name ?? "Staff", body, visibility: "internal" });
          setActivityOpen(false);
        }}
      />
      <Modal open={portalOpen} title="Client portal" onClose={() => setPortalOpen(false)}>
        <p className="mb-4 text-sm text-[var(--color-ink)]">
          Company contacts can see hours and open periods for this retainer on the client portal.
        </p>
        <Link href="/portal/retainers" className="btn btn-primary" onClick={() => setPortalOpen(false)}>
          Open portal view
        </Link>
      </Modal>
      <CreateForms
        kind={createKind}
        onClose={() => setCreateKind(null)}
        defaults={{ companyId: retainer.companyId, projectId }}
      />
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-[var(--color-fog)] p-3">
      <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accent ? "text-[var(--color-success)]" : "text-[var(--color-navy)]"}`}>{value}</div>
    </div>
  );
}
