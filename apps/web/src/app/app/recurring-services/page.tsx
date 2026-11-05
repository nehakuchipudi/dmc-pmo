"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Field, Modal, PageHeader, StatusPill, TextInput, TextSelect } from "@/components/ui";
import { RECURRING_FREQUENCIES, type RecurringFrequency } from "@/lib/service-ops";
import { useAppStore } from "@/lib/store";

export default function RecurringServicesPage() {
  const companies = useAppStore((s) => s.companies);
  const team = useAppStore((s) => s.team);
  const recurringServices = useAppStore((s) => s.recurringServices);
  const createRecurringService = useAppStore((s) => s.createRecurringService);
  const toggleRecurringService = useAppStore((s) => s.toggleRecurringService);
  const generateRecurringJob = useAppStore((s) => s.generateRecurringJob);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [frequency, setFrequency] = useState<RecurringFrequency>("Monthly");
  const [nextOn, setNextOn] = useState(new Date().toISOString().slice(0, 10));
  const [assignee, setAssignee] = useState(team.find((m) => m.active)?.name ?? "");

  return (
    <div className="fade-in">
      <PageHeader
        title="Recurring Services"
        subtitle="Stand up a cadence, pause it, or generate the next work order."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> New recurring service
          </button>
        }
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Company</th>
              <th>Cadence</th>
              <th>Next visit</th>
              <th>Assignee</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {recurringServices.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">{row.title}</td>
                <td>{row.companyName}</td>
                <td>{row.frequency}</td>
                <td>{row.nextOn}</td>
                <td>{row.assignee || "Unassigned"}</td>
                <td>
                  <StatusPill tone={row.paused ? "neutral" : "success"}>{row.paused ? "Paused" : "Active"}</StatusPill>
                </td>
                <td className="text-right space-x-2">
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => toggleRecurringService(row.id)}>
                    {row.paused ? "Resume" : "Pause"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost text-sm"
                    disabled={row.paused}
                    onClick={() => generateRecurringJob(row.id)}
                  >
                    Generate job
                  </button>
                </td>
              </tr>
            ))}
            {!recurringServices.length ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  No recurring services yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Modal open={open} title="New recurring service" onClose={() => setOpen(false)}>
        <Field label="Title" required>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quarterly HVAC check" />
        </Field>
        <Field label="Company">
          <TextSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">No company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Frequency">
          <TextSelect value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}>
            {RECURRING_FREQUENCIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Next visit">
          <TextInput type="date" value={nextOn} onChange={(e) => setNextOn(e.target.value)} />
        </Field>
        <Field label="Assignee">
          <TextSelect value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {team.filter((m) => m.active).map((member) => (
              <option key={member.id} value={member.name}>
                {member.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!title.trim()) return;
            createRecurringService({ title, companyId, frequency, nextOn, assignee });
            setTitle("");
            setOpen(false);
          }}
        >
          Save service
        </button>
      </Modal>
    </div>
  );
}
