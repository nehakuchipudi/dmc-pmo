"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader, StatusPill, TextTextarea, statusTone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

export function TicketDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const tickets = useAppStore((s) => s.tickets);
  const messages = useAppStore((s) => s.ticketMessages);
  const updateTicketStatus = useAppStore((s) => s.updateTicketStatus);
  const addTicketMessage = useAppStore((s) => s.addTicketMessage);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"client" | "internal">("client");

  const ticket = tickets.find((t) => t.id === id) ?? tickets[0];
  const thread = useMemo(
    () => messages.filter((m) => m.ticketId === ticket.id).slice().reverse(),
    [messages, ticket.id],
  );

  return (
    <div className="fade-in">
      <div className="mb-2 text-sm text-[var(--color-muted)]">
        <Link href="/app/tickets">Tickets</Link> / #{ticket.number}
      </div>
      <PageHeader
        title={`#${ticket.number} ${ticket.subject}`}
        subtitle={`${ticket.companyName} · Submitted ${formatDisplayDate(ticket.submitted)} · SLA ${ticket.slaDue}`}
        actions={
          <>
            <select
              className="field-input w-auto"
              value={ticket.status}
              onChange={(e) => updateTicketStatus(ticket.id, e.target.value as typeof ticket.status)}
            >
              {["Open", "In Progress", "Resolved"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <StatusPill tone={statusTone(ticket.priority)}>{ticket.priority}</StatusPill>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="panel p-4">
          <h2 className="mb-3 font-semibold text-[var(--color-navy)]">Conversation</h2>
          <div className="space-y-3 mb-4">
            {thread.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl p-3 text-sm ${m.visibility === "internal" ? "bg-[var(--color-warning-bg)]" : "bg-[var(--color-fog)]"}`}
              >
                <div className="mb-1 flex justify-between gap-2 text-xs text-[var(--color-muted)]">
                  <span>{m.author} · {m.visibility === "internal" ? "Internal note" : "Client-visible"}</span>
                  <span>{m.createdAt}</span>
                </div>
                <div>{m.body}</div>
              </div>
            ))}
          </div>
          <TextTextarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply..." />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select className="field-input w-auto" value={visibility} onChange={(e) => setVisibility(e.target.value as "client" | "internal")}>
              <option value="client">Client-visible reply</option>
              <option value="internal">Internal note</option>
            </select>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!body.trim()) return;
                addTicketMessage(ticket.id, user?.name ?? "Staff", body.trim(), visibility);
                setBody("");
              }}
            >
              Post
            </button>
          </div>
        </div>
        <aside className="panel p-4 text-sm space-y-3">
          <div><div className="text-[var(--color-muted)]">Assignee</div><div className="font-medium">{ticket.assignee}</div></div>
          <div><div className="text-[var(--color-muted)]">Priority</div><StatusPill tone={statusTone(ticket.priority)}>{ticket.priority}</StatusPill></div>
          <div><div className="text-[var(--color-muted)]">Status</div><StatusPill tone={statusTone(ticket.status)}>{ticket.status}</StatusPill></div>
          <div><div className="text-[var(--color-muted)]">SLA</div><div>{ticket.slaDue}</div></div>
        </aside>
      </div>
    </div>
  );
}
