"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MoreHorizontal, MoreVertical, Plus } from "lucide-react";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { AddActivityModal, AddPeriodModal } from "@/components/retainers/RetainerModals";
import {
  Field,
  FilterChips,
  Modal,
  PageHeader,
  ProgressBar,
  StatusPill,
  TextInput,
  TextSelect,
  statusTone,
} from "@/components/ui";
import { IfCan } from "@/components/auth/IfCan";
import { useAuth } from "@/lib/auth";
import { exportCsv } from "@/lib/pdf";
import { companyProjectId, earnedValue, nextPeriodRange } from "@/lib/retainers";
import { hiddenMoney } from "@/lib/rbac";
import { formatDisplayDate, money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import type { Retainer, RetainerType } from "@/lib/types";

const FILTERS = ["All open retainers", "My retainers", "Over budget"];

export default function RetainersPage() {
  const router = useRouter();
  const { user, can, canSeeFinancials } = useAuth();
  const retainers = useAppStore((s) => s.retainers);
  const companies = useAppStore((s) => s.companies);
  const contacts = useAppStore((s) => s.contacts);
  const projects = useAppStore((s) => s.projects);
  const periods = useAppStore((s) => s.retainerPeriods);
  const createRetainer = useAppStore((s) => s.createRetainer);
  const deleteRetainer = useAppStore((s) => s.deleteRetainer);
  const addPeriod = useAppStore((s) => s.addRetainerPeriod);
  const addRetainerNote = useAppStore((s) => s.addRetainerNote);
  const queueEmail = useAppStore((s) => s.queueEmail);
  const pushToast = useAppStore((s) => s.pushToast);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [open, setOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [headerMore, setHeaderMore] = useState(false);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [logRetainer, setLogRetainer] = useState<Retainer | null>(null);
  const [periodRetainer, setPeriodRetainer] = useState<Retainer | null>(null);
  const [noteRetainer, setNoteRetainer] = useState<Retainer | null>(null);

  const rows = useMemo(() => {
    if (filter === "My retainers") return retainers.filter((r) => r.manager === "M. Doyle");
    if (filter === "Over budget") return retainers.filter((r) => r.usedHours > r.budgetHours);
    return retainers.filter((r) => r.status === "Active");
  }, [filter, retainers]);

  const companyContacts = contacts.filter((c) => c.companyId === companyId);
  const periodDraft = periodRetainer
    ? nextPeriodRange(periods.filter((item) => item.retainerId === periodRetainer.id))
    : { start: "", end: "" };

  function startLogTime(retainer: Retainer) {
    const projectId = companyProjectId(projects, retainer.companyId);
    if (!projectId) {
      pushToast("Add a project on this company first.", "danger");
      return;
    }
    setLogRetainer(retainer);
    setCreateKind("time");
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Retainers"
        subtitle="Open contracts, hours used, and the next period date."
        actions={
          <>
            <IfCan cap="create_retainer">
              <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
                <Plus size={16} /> New retainer
              </button>
            </IfCan>
            <div className="row-actions">
              <button
                type="button"
                className="icon-btn"
                aria-label="More retainer actions"
                aria-expanded={headerMore}
                onClick={() => setHeaderMore((value) => !value)}
              >
                <MoreHorizontal size={18} />
              </button>
              {headerMore ? (
                <div className="row-menu">
                  <button
                    type="button"
                    onClick={() => {
                      exportCsv(
                        "retainers.csv",
                        rows.map((r) => ({
                          title: r.name,
                          company: r.companyName,
                          type: r.type,
                          manager: r.manager,
                          status: r.status,
                          earned: earnedValue(r.usedHours, r.rate),
                          expiry: r.expires,
                        })),
                      );
                      setHeaderMore(false);
                    }}
                  >
                    Export
                  </button>
                </div>
              ) : null}
            </div>
          </>
        }
      />
      <FilterChips items={FILTERS} active={filter} onChange={setFilter} />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Company</th>
              <th>Type</th>
              <th>Manager</th>
              <th>Status</th>
              <th>Earned</th>
              <th>Period expiry</th>
              <th>Usage</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pct = Math.round((r.usedHours / Math.max(r.budgetHours, 1)) * 100);
              return (
                <tr key={r.id}>
                  <td>
                    <Link
                      href={`/app/retainers/view/?id=${r.id}`}
                      className="font-semibold text-[var(--color-navy)] hover:underline"
                      onMouseEnter={() => router.prefetch(`/app/retainers/view/?id=${r.id}`)}
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/app/companies/view/?id=${r.companyId}`} className="hover:underline">
                      {r.companyName}
                    </Link>
                  </td>
                  <td>{r.type}</td>
                  <td>{r.manager}</td>
                  <td>
                    <StatusPill tone={statusTone(r.status)}>{r.status}</StatusPill>
                  </td>
                  <td className="tabular-nums">{hiddenMoney(canSeeFinancials, money(earnedValue(r.usedHours, r.rate)))}</td>
                  <td>{formatDisplayDate(r.expires)}</td>
                  <td className="min-w-[150px]">
                    <div className="mb-1 text-xs tabular-nums">
                      {r.usedHours}/{r.budgetHours}h
                    </div>
                    <ProgressBar value={Math.min(pct, 100)} />
                  </td>
                  <td className="row-actions text-right">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      aria-label={`Actions for ${r.name}`}
                      onClick={() => {
                        setHeaderMore(false);
                        setMenuId(menuId === r.id ? null : r.id);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {menuId === r.id ? (
                      <div className="row-menu">
                        {can("log_time") ? (
                          <button
                            type="button"
                            onClick={() => {
                              startLogTime(r);
                              setMenuId(null);
                            }}
                          >
                            Log time
                          </button>
                        ) : null}
                        {can("manage_retainer") ? (
                          <button
                            type="button"
                            onClick={() => {
                              setNoteRetainer(r);
                              setMenuId(null);
                            }}
                          >
                            Add activity
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            router.push(`/app/retainers/view/?id=${r.id}&edit=1`);
                            setMenuId(null);
                          }}
                        >
                          Edit retainer
                        </button>
                        {can("manage_retainer") ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPeriodRetainer(r);
                              setMenuId(null);
                            }}
                          >
                            Add period
                          </button>
                        ) : null}
                        <button type="button" onClick={() => { router.push(`/app/retainers/view/?id=${r.id}`); setMenuId(null); }}>
                          Open details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const contact = contacts.find((c) => c.id === r.contactId);
                            const to = contact?.email ?? "billing@client.com";
                            queueEmail(
                              to,
                              `Retainer update: ${r.name}`,
                              `Current usage ${r.usedHours}/${r.budgetHours} hours.`,
                            );
                            pushToast(`Email queued to ${to}`);
                            setMenuId(null);
                          }}
                        >
                          Email contact
                        </button>
                        {can("manage_retainer") ? (
                          <button
                            type="button"
                            onClick={() => {
                              deleteRetainer(r.id);
                              setMenuId(null);
                            }}
                          >
                            Delete
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

      <Modal open={open} title="New retainer" onClose={() => setOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const id = createRetainer({
              name: String(fd.get("name") || "New retainer"),
              companyId: String(fd.get("companyId") || companyId),
              type: String(fd.get("type") || "Monthly T&M") as RetainerType,
              manager: String(fd.get("manager") || "M. Doyle"),
              contactId: String(fd.get("contactId") || "") || undefined,
              budgetHours: Number(fd.get("budgetHours") || 20),
              expires: String(fd.get("expires") || "2026-09-30"),
            });
            setOpen(false);
            if (id) router.push(`/app/retainers/view/?id=${id}`);
          }}
        >
          <Field label="Title">
            <TextInput name="name" defaultValue="Monthly Managed Support" required />
          </Field>
          <Field label="Company">
            <TextSelect
              name="companyId"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Primary contact">
            <TextSelect name="contactId" defaultValue={companyContacts[0]?.id ?? ""}>
              <option value="">No contact linked</option>
              {companyContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Type">
            <TextSelect name="type" defaultValue="Monthly T&M">
              <option>Monthly T&M</option>
              <option>Pre-paid</option>
              <option>Fixed</option>
            </TextSelect>
          </Field>
          <Field label="Manager">
            <TextInput name="manager" defaultValue="M. Doyle" />
          </Field>
          <Field label="Period hours">
            <TextInput name="budgetHours" type="number" defaultValue={20} />
          </Field>
          <Field label="Expires">
            <TextInput name="expires" type="date" defaultValue="2026-09-30" />
          </Field>
          <button type="submit" className="btn btn-primary">
            Create retainer
          </button>
        </form>
      </Modal>

      <AddPeriodModal
        open={Boolean(periodRetainer)}
        defaultHours={periodRetainer?.budgetHours ?? 20}
        defaultStart={periodDraft.start}
        defaultEnd={periodDraft.end}
        onClose={() => setPeriodRetainer(null)}
        onSubmit={(start, end, hours) => {
          if (!periodRetainer) return;
          addPeriod(periodRetainer.id, start, end, hours);
          setPeriodRetainer(null);
        }}
      />
      <AddActivityModal
        open={Boolean(noteRetainer)}
        onClose={() => setNoteRetainer(null)}
        onSubmit={(body) => {
          if (!noteRetainer) return;
          addRetainerNote(noteRetainer.id, { author: user?.name ?? "Staff", body, visibility: "internal" });
          setNoteRetainer(null);
        }}
      />
      <CreateForms
        kind={createKind}
        onClose={() => {
          setCreateKind(null);
          setLogRetainer(null);
        }}
        defaults={{
          companyId: logRetainer?.companyId,
          projectId: logRetainer ? companyProjectId(projects, logRetainer.companyId) : undefined,
        }}
      />
    </div>
  );
}
