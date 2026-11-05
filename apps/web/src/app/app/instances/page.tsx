"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Field, Modal, PageHeader, StatusPill, statusTone, TextInput, TextSelect } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { PACKS, type PackId } from "@/lib/modules";
import { INSTANCE_STATUSES, type InstanceStatus } from "@/lib/service-ops";
import { useAppStore } from "@/lib/store";

export default function InstancesPage() {
  const { can } = useAuth();
  const canEdit = can("manage_users") || can("manage_service_ops");
  const workspaceInstances = useAppStore((s) => s.workspaceInstances);
  const createInstance = useAppStore((s) => s.createInstance);
  const updateInstance = useAppStore((s) => s.updateInstance);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<InstanceStatus>("Trial");
  const [packs, setPacks] = useState<PackId[]>(["project_management", "project_delivery"]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Instances"
        subtitle="Each customer workspace can run a different mix of capability packs."
        actions={
          canEdit ? (
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              <Plus size={16} /> New instance
            </button>
          ) : null
        }
      />
      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Instance</th>
              <th>Owner</th>
              <th>Packs</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {workspaceInstances.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">{row.name}</td>
                <td>{row.owner}</td>
                <td>{row.packs.map((id) => PACKS.find((pack) => pack.id === id)?.label ?? id).join(", ")}</td>
                <td>
                  {canEdit ? (
                    <TextSelect
                      value={row.status}
                      onChange={(e) => updateInstance(row.id, { status: e.target.value as InstanceStatus })}
                    >
                      {INSTANCE_STATUSES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </TextSelect>
                  ) : (
                    <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                  )}
                </td>
              </tr>
            ))}
            {!workspaceInstances.length ? (
              <tr>
                <td colSpan={4} className="empty-row">
                  No instances yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Modal open={open} title="New instance" onClose={() => setOpen(false)}>
        <Field label="Name" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer workspace" />
        </Field>
        <Field label="Owner">
          <TextInput value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Account owner" />
        </Field>
        <Field label="Status">
          <TextSelect value={status} onChange={(e) => setStatus(e.target.value as InstanceStatus)}>
            {INSTANCE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </TextSelect>
        </Field>
        <div className="mb-3 text-sm">
          <div className="mb-1 text-[var(--color-muted)]">Packs</div>
          {PACKS.map((pack) => (
            <label key={pack.id} className="mb-1 flex items-center gap-2">
              <input
                type="checkbox"
                checked={packs.includes(pack.id)}
                onChange={(e) =>
                  setPacks((current) => (e.target.checked ? [...current, pack.id] : current.filter((id) => id !== pack.id)))
                }
              />
              {pack.label}
            </label>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!name.trim()) return;
            createInstance({ name, owner, packs, status });
            setName("");
            setOwner("");
            setOpen(false);
          }}
        >
          Create instance
        </button>
      </Modal>
    </div>
  );
}
