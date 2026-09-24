"use client";

import { useState } from "react";
import { Field, Modal, PageHeader, StatusPill, TextInput, TextSelect, statusTone } from "@/components/ui";
import { IfCan } from "@/components/auth/IfCan";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";

export default function SalesPage() {
  const opportunities = useAppStore((s) => s.opportunities);
  const companies = useAppStore((s) => s.companies);
  const createOpportunity = useAppStore((s) => s.createOpportunity);
  const advanceOpportunity = useAppStore((s) => s.advanceOpportunity);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [amount, setAmount] = useState("10000");
  const [close, setClose] = useState("2026-10-01");

  return (
    <div className="fade-in">
      <PageHeader
        title="Sales"
        subtitle="Pipeline and opportunities. Won deals convert into projects."
        actions={
          <IfCan cap="create_opportunity">
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              New opportunity
            </button>
          </IfCan>
        }
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Opportunity</th>
              <th>Company</th>
              <th>Stage</th>
              <th>Amount</th>
              <th>Close</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr key={o.id}>
                <td className="font-medium text-[var(--color-navy)]">{o.name}</td>
                <td>{o.companyName}</td>
                <td>
                  <StatusPill tone={statusTone(o.stage)}>{o.stage}</StatusPill>
                </td>
                <td className="tabular-nums">{money(o.amount)}</td>
                <td>{o.close}</td>
                <td className="text-right">
                  {o.stage !== "Won" && o.stage !== "Lost" ? (
                    <IfCan cap="advance_opportunity">
                      <button type="button" className="btn btn-primary text-sm" onClick={() => advanceOpportunity(o.id)}>
                        Advance
                      </button>
                    </IfCan>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} title="New opportunity" onClose={() => setOpen(false)}>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Company">
          <TextSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
            createOpportunity({
              name: name.trim(),
              companyId,
              amount: Number(amount) || 0,
              close,
            });
            setName("");
            setOpen(false);
          }}
        >
          Create opportunity
        </button>
      </Modal>
    </div>
  );
}
