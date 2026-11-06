"use client";

import { useState } from "react";
import { Field, TextInput, TextSelect, TextTextarea } from "@/components/primitives";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/seed";
import { useAppStore } from "@/lib/store";
import { todayIso } from "@/lib/timesheet";

export type PurchaseCreateValues = {
  title: string;
  vendor: string;
  amount: number;
  date: string;
  owner: string;
  note?: string;
  companyId?: string;
  projectId?: string;
};

export function PurchaseCreateForm({
  defaultCompanyId,
  defaultProjectId,
  onSubmit,
}: {
  defaultCompanyId?: string;
  defaultProjectId?: string;
  onSubmit: (v: PurchaseCreateValues) => void;
}) {
  const { user } = useAuth();
  const team = useAppStore((s) => s.team).filter((member) => member.active);
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const preferred =
    team.find((member) => member.email.toLowerCase() === user?.email?.toLowerCase()) ??
    team.find((member) => member.name === user?.name) ??
    team[0];
  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("0");
  const [date, setDate] = useState(todayIso());
  const [ownerId, setOwnerId] = useState(preferred?.id ?? "");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? "");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [note, setNote] = useState("");
  const owner = team.find((member) => member.id === ownerId) ?? preferred;
  const companyProjects = projects.filter((row) => !companyId || row.companyId === companyId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
          title: title.trim(),
          vendor: vendor.trim() || title.trim(),
          amount: Number(amount) || 0,
          date,
          owner: owner?.name ?? user?.name ?? "Unassigned",
          note: note.trim() || undefined,
          companyId: companyId || undefined,
          projectId: projectId || undefined,
        });
      }}
    >
      <Field label="Title" required>
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label="Vendor" required>
        <TextInput value={vendor} onChange={(e) => setVendor(e.target.value)} required />
      </Field>
      <Field label="Company">
        <TextSelect
          value={companyId}
          onChange={(e) => {
            setCompanyId(e.target.value);
            setProjectId("");
          }}
        >
          <option value="">No company</option>
          {companies.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Project">
        <TextSelect value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">No project</option>
          {companyProjects.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date" required>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Amount" required>
          <TextInput type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>
      <Field label="Owner">
        <TextSelect value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          {team.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Note">
        <TextTextarea value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <button type="submit" className="btn btn-primary">
        Add purchase {money(Number(amount) || 0)}
      </button>
    </form>
  );
}
