"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, Modal, PageHeader, ProgressBar, StatusPill, TextInput, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";

export default function PortalHomePage() {
  const { user } = useAuth();
  const projects = useAppStore((s) => s.projects);
  const milestones = useAppStore((s) => s.milestones);
  const tickets = useAppStore((s) => s.tickets);
  const invoices = useAppStore((s) => s.invoices);
  const approveSignoff = useAppStore((s) => s.approveSignoff);
  const createTicket = useAppStore((s) => s.createTicket);
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [subject, setSubject] = useState("");

  const companyProjects = projects.filter((p) => p.companyId === user?.companyId && p.portalShared);
  const openTickets = tickets.filter((t) => t.companyId === user?.companyId && t.status !== "Resolved");
  const recentInvoices = invoices.filter((i) => i.companyId === user?.companyId).slice(0, 3);
  const pending = milestones.filter(
    (m) => companyProjects.some((p) => p.id === m.projectId) && m.status === "Awaiting Signoff",
  );

  return (
    <div className="fade-in">
      <PageHeader
        title="My Projects"
        subtitle={`Welcome back, ${user?.name.split(" ")[0]}. Track delivery, approvals, and support for your company.`}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setRaiseOpen(true)}>
            + Raise a Ticket
          </button>
        }
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
                  const next = milestones.find((m) => m.projectId === p.id && m.status !== "Approved");
                  const portalStatus =
                    next?.status === "Awaiting Signoff" || next?.status === "In Progress"
                      ? "Awaiting Your Review"
                      : p.status;
                  return (
                    <tr key={p.id}>
                      <td className="font-medium text-[var(--color-navy)]">{p.name}</td>
                      <td>
                        <ProgressBar value={p.progress} />
                      </td>
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
            <div className="px-4 pt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
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
                    <td>
                      #{t.number} {t.subject}
                    </td>
                    <td>{t.submitted}</td>
                    <td>
                      <StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill>
                    </td>
                  </tr>
                ))}
                {!openTickets.length ? (
                  <tr>
                    <td colSpan={3} className="text-[var(--color-muted)]">
                      No open tickets.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="panel overflow-hidden">
            <div className="px-4 pt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Signoffs awaiting you
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Project</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pending.map((m) => {
                  const project = companyProjects.find((p) => p.id === m.projectId);
                  return (
                    <tr key={m.id}>
                      <td className="font-medium">{m.name}</td>
                      <td>{project?.name ?? "-"}</td>
                      <td className="text-right">
                        <button type="button" className="btn btn-primary text-sm" onClick={() => approveSignoff(m.id)}>
                          Approve
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!pending.length ? (
                  <tr>
                    <td colSpan={3} className="text-[var(--color-muted)]">
                      Nothing waiting for approval.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-4">
          <div className="panel p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Your Recent Invoices
            </div>
            <ul className="space-y-3 text-sm">
              {recentInvoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-2">
                  <Link href="/portal/billing" className="hover:underline">
                    {inv.number}
                  </Link>
                  <StatusPill tone={statusTone(inv.status)}>{inv.status}</StatusPill>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Need Help?
            </div>
            <button type="button" className="btn btn-primary w-full justify-center" onClick={() => setRaiseOpen(true)}>
              + Raise a Ticket
            </button>
          </div>
        </div>
      </div>
      <Modal open={raiseOpen} title="Raise a ticket" onClose={() => setRaiseOpen(false)}>
        <Field label="Subject">
          <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="How can we help?" />
        </Field>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!subject.trim() || !user?.companyId) return;
            createTicket({
              subject: subject.trim(),
              companyId: user.companyId,
              priority: "Medium",
              assignee: "Unassigned",
            });
            setSubject("");
            setRaiseOpen(false);
          }}
        >
          Submit ticket
        </button>
      </Modal>
    </div>
  );
}
