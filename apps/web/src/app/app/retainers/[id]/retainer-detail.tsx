"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { FilesNotesPanel } from "@/components/FilesNotesPanel";
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
import { useAuth } from "@/lib/auth";
import { formatDisplayDate, money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import type { RetainerStatus, RetainerType } from "@/lib/types";

const TABS = ["Overview", "Periods", "Billing", "Tickets", "Files & Notes"];

export function RetainerDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const retainers = useAppStore((s) => s.retainers);
  const retainerPeriods = useAppStore((s) => s.retainerPeriods);
  const allTickets = useAppStore((s) => s.tickets);
  const allContacts = useAppStore((s) => s.contacts);
  const updateRetainer = useAppStore((s) => s.updateRetainer);
  const allocate = useAppStore((s) => s.allocateRetainerHours);
  const addPeriod = useAppStore((s) => s.addRetainerPeriod);
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

  useEffect(() => {
    if (!retainer) return;
    trackView("retainer", retainer.id, retainer.name);
  }, [retainer, trackView]);

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

  const pct = Math.round((retainer.usedHours / Math.max(retainer.budgetHours, 1)) * 100);
  const remaining = Math.max(0, retainer.budgetHours - retainer.usedHours);

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
            <StatusPill tone={statusTone(retainer.status)}>{retainer.status}</StatusPill>
            <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(true)}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                const to = linkedContact?.email ?? "billing@client.com";
                queueEmail(
                  to,
                  `Retainer: ${retainer.name}`,
                  `Usage ${retainer.usedHours}/${retainer.budgetHours}h. Period expires ${retainer.expires}.`,
                );
                pushToast(`Email queued to ${to}`);
              }}
            >
              Send email
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const open = periods.find((p) => p.status === "Opened");
                if (!open) {
                  pushToast("No open period to invoice", "danger");
                  return;
                }
                const inv = generatePeriodInvoice(open.id);
                if (inv) router.push(`/app/billing/view/?id=${inv}`);
              }}
            >
              Generate invoice
            </button>
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
                <dt className="text-[var(--color-muted)]">Expires</dt>
                <dd>{formatDisplayDate(retainer.expires)}</dd>
              </div>
            </dl>
          </SideRail>
          <div className="space-y-4">
            <div className="panel p-4">
              <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Current period allowance</h2>
              <div className="mb-2 text-sm text-[var(--color-muted)]">{retainer.periodLabel}</div>
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="Budget" value={`${retainer.budgetHours}h`} />
                <Metric label="Used" value={`${retainer.usedHours}h`} />
                <Metric label="Remaining" value={`${remaining}h`} accent />
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
          </div>
        </div>
      ) : null}

      {tab === "Periods" ? (
        <div className="panel overflow-hidden">
          <div className="flex justify-end p-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => addPeriod(retainer.id, "2026-09-01", "2026-09-30", retainer.budgetHours)}
            >
              + Add new period
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Status</th>
                <th>Usage</th>
                <th>Invoice</th>
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
                      {formatDisplayDate(p.start)} - {formatDisplayDate(p.end)}
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
                        <button
                          type="button"
                          className="btn btn-ghost text-sm"
                          onClick={() => {
                            const inv = generatePeriodInvoice(p.id);
                            if (inv) router.push(`/app/billing/view/?id=${inv}`);
                          }}
                        >
                          Create
                        </button>
                      )}
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
            Create invoices from open periods. Estimated value at $175/hr on current usage:{" "}
            <strong className="text-[var(--color-navy)]">{money(retainer.usedHours * 175)}</strong>
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const open = periods.find((p) => p.status === "Opened");
              if (!open) return;
              const inv = generatePeriodInvoice(open.id);
              if (inv) router.push(`/app/billing/view/?id=${inv}`);
            }}
          >
            Invoice current period
          </button>
        </div>
      ) : null}

      {tab === "Tickets" ? (
        <div className="panel overflow-hidden">
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
          <Field label="Budget hours">
            <TextInput name="budgetHours" type="number" defaultValue={retainer.budgetHours} />
          </Field>
          <Field label="Expires">
            <TextInput name="expires" type="date" defaultValue={retainer.expires} />
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
