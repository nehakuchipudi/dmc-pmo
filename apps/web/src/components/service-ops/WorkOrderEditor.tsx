"use client";

import { useState } from "react";
import { Field, Modal, TextInput, TextSelect, TextTextarea } from "@/components/ui";
import { WORK_ORDER_PRIORITIES } from "@/lib/service-ops";
import { useAppStore } from "@/lib/store";

export function WorkOrderEditor({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const companies = useAppStore((s) => s.companies);
  const team = useAppStore((s) => s.team);
  const createWorkOrder = useAppStore((s) => s.createWorkOrder);
  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [assignee, setAssignee] = useState(team.find((m) => m.active)?.name ?? "");
  const [priority, setPriority] = useState<(typeof WORK_ORDER_PRIORITIES)[number]>("Medium");
  const [scheduled, setScheduled] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  function submit() {
    if (!title.trim()) return;
    createWorkOrder({ title, companyId, assignee, priority, scheduled, notes });
    setTitle("");
    setNotes("");
    onClose();
  }

  return (
    <Modal open={open} title="New work order" onClose={onClose}>
      <Field label="Title" required>
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Site inspection" />
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
      <Field label="Priority">
        <TextSelect value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
          {WORK_ORDER_PRIORITIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label="Scheduled">
        <TextInput type="date" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
      </Field>
      <Field label="Notes">
        <TextTextarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Access, parts, or customer notes" />
      </Field>
      <button type="button" className="btn btn-primary" onClick={submit}>
        Create work order
      </button>
    </Modal>
  );
}
