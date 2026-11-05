"use client";

import { useState } from "react";
import { Field, Modal, PageHeader, StatusPill, TextInput, TextSelect, statusTone } from "@/components/ui";
import { IfCan } from "@/components/auth/IfCan";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

export default function QuotesPage() {
  const opportunities = useAppStore((s) => s.opportunities);
  const companies = useAppStore((s) => s.companies);
  const createOpportunity = useAppStore((s) => s.createOpportunity);
  const advanceOpportunity = useAppStore((s) => s.advanceOpportunity);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [amount, setAmount] = useState("10000");
  const [close, setClose] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="fade-in">
      <PageHeader
        title="Quotes"
        subtitle="Price the work before it becomes a project or a work order."
        actions={
          <IfCan cap="create_opportunity">
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              New quote
            </button>
          </IfCan>
        }
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Quote</th>
              <th>Company</th>
              <th>Stage</th>
              <th>Amount</th>
              <th>Close</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {opportunities.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">{row.name}</td>
                <td>{row.companyName}</td>
                <td>
                  <StatusPill tone={statusTone(row.stage)}>{row.stage}</StatusPill>
                </td>
                <td className="tabular-nums">{money(row.amount)}</td>
                <td>{row.close}</td>
                <td className="text-right">
                  {row.stage !== "Won" && row.stage !== "Lost" ? (
                    <IfCan cap="advance_opportunity">
                      <button type="button" className="btn btn-primary text-sm" onClick={() => advanceOpportunity(row.id)}>
                        Advance
                      </button>
                    </IfCan>
                  ) : null}
                </td>
              </tr>
            ))}
            {!opportunities.length ? (
              <tr>
                <td colSpan={6} className="empty-row">
                  No quotes yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Modal open={open} title="New quote" onClose={() => setOpen(false)}>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Site survey quote" />
        </Field>
        <Field label="Company">
          <TextSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Amount">
          <TextInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Expected close">
          <TextInput type="date" value={close} onChange={(e) => setClose(e.target.value)} />
        </Field>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!name.trim() || !companyId) return;
            createOpportunity({ name: name.trim(), companyId, amount: Number(amount) || 0, close });
            setName("");
            setOpen(false);
          }}
        >
          Save quote
        </button>
      </Modal>
    </div>
  );
}
