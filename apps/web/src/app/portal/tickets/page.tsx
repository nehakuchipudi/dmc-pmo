"use client";

import { useMemo, useState } from "react";
import { Field, Modal, PageHeader, StatusPill, Tabs, TextInput, TextTextarea, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";

export default function PortalTicketsPage() {
  const { user } = useAuth();
  const tickets = useAppStore((s) => s.tickets);
  const messages = useAppStore((s) => s.ticketMessages);
  const createTicket = useAppStore((s) => s.createTicket);
  const addMessage = useAppStore((s) => s.addTicketMessage);
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [tab, setTab] = useState("Open");

  const rows = useMemo(() => {
    const mine = tickets.filter((t) => t.companyId === user?.companyId);
    if (tab === "Resolved") return mine.filter((t) => t.status === "Resolved");
    if (tab === "Open") return mine.filter((t) => t.status !== "Resolved");
    return mine;
  }, [tickets, user?.companyId, tab]);

  const selected = tickets.find((t) => t.id === selectedId) ?? rows[0];
  const thread = messages
    .filter((m) => m.ticketId === selected?.id && m.visibility === "client")
    .slice()
    .reverse();

  return (
    <div className="fade-in">
      <PageHeader
        title="Tickets"
        subtitle="Raise and track support requests for your company only."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setRaiseOpen(true)}>
            + Raise a Ticket
          </button>
        }
      />
      <Tabs tabs={["Open", "Resolved", "All"]} active={tab} onChange={setTab} />
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="panel overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  className={selected?.id === t.id ? "bg-[var(--color-fog)]" : undefined}
                  onClick={() => setSelectedId(t.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="font-medium">
                    #{t.number} {t.subject}
                  </td>
                  <td>
                    <StatusPill tone={statusTone(t.priority)}>{t.priority}</StatusPill>
                  </td>
                  <td>
                    <StatusPill tone={statusTone(t.status)}>{t.status}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel p-4">
          {selected ? (
            <>
              <div className="mb-3">
                <div className="font-[family-name:var(--font-display)] text-lg text-[var(--color-navy)]">
                  #{selected.number} {selected.subject}
                </div>
                <div className="text-sm text-[var(--color-muted)]">Submitted {selected.submitted}</div>
              </div>
              <div className="mb-4 max-h-72 space-y-3 overflow-auto">
                {thread.map((m) => (
                  <div key={m.id} className="rounded-lg border border-[var(--color-border)] bg-white p-3">
                    <div className="mb-1 text-xs font-semibold text-[var(--color-navy)]">
                      {m.author} · {m.createdAt}
                    </div>
                    <p className="text-sm">{m.body}</p>
                  </div>
                ))}
                {!thread.length ? <p className="text-sm text-[var(--color-muted)]">No client-visible messages yet.</p> : null}
              </div>
              <Field label="Reply">
                <TextTextarea value={reply} onChange={(e) => setReply(e.target.value)} />
              </Field>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!reply.trim() || !user) return;
                  addMessage(selected.id, user.name, reply.trim(), "client");
                  setReply("");
                }}
              >
                Send reply
              </button>
            </>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">Select a ticket to view the conversation.</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-[var(--color-muted)]">
        Internal notes, cost rates, and other companies are never shown in the client portal.
      </p>
      <Modal open={raiseOpen} title="Raise a ticket" onClose={() => setRaiseOpen(false)}>
        <Field label="Subject">
          <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!subject.trim() || !user?.companyId) return;
            const id = createTicket({
              subject: subject.trim(),
              companyId: user.companyId,
              priority: "Medium",
              assignee: "Unassigned",
            });
            setSelectedId(id);
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
