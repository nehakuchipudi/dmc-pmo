"use client";

import { useMemo, useState } from "react";
import { Avatar, Field, Modal, PageHeader, StatusPill, TextInput, TextSelect } from "@/components/ui";
import { useAppStore } from "@/lib/store";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["admin", "pm", "staff", "finance", "leadership", "client"];

export default function SettingsPage() {
  const team = useAppStore((s) => s.team);
  const addTeamMember = useAppStore((s) => s.addTeamMember);
  const updateTeamMember = useAppStore((s) => s.updateTeamMember);
  const setTeamMemberActive = useAppStore((s) => s.setTeamMemberActive);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const rows = useMemo(
    () => team.filter((m) => showInactive || m.active),
    [team, showInactive],
  );
  const editing = team.find((m) => m.id === editId);

  return (
    <div className="fade-in">
      <PageHeader
        title="Users & roles"
        subtitle="Manage team access for the PMO. Permissions are role-based (demo store)."
        actions={
          <>
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              Show inactive
            </label>
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              + Add user
            </button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <RoleCard title="Admin" body="Full project, billing, and user management." />
        <RoleCard title="PM" body="Own projects: schedule, files, invoices, signoffs." />
        <RoleCard title="Staff" body="Edit assigned tasks, log time, upload files." />
      </div>

      <div className="panel overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <Avatar initials={m.initials} src={m.avatarUrl} name={m.name} size={32} />
                    <span className="font-medium">{m.name}</span>
                  </div>
                </td>
                <td className="text-[var(--color-muted)]">{m.email}</td>
                <td className="capitalize">{m.role}</td>
                <td>
                  <StatusPill tone={m.active ? "success" : "neutral"}>{m.active ? "Active" : "Inactive"}</StatusPill>
                </td>
                <td className="text-right space-x-2">
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => setEditId(m.id)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost text-sm"
                    onClick={() => setTeamMemberActive(m.id, !m.active)}
                  >
                    {m.active ? "Deactivate" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Add user" onClose={() => setOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            addTeamMember({
              name: String(fd.get("name") || "New user"),
              email: String(fd.get("email") || "user@dillonmorgan.com"),
              role: String(fd.get("role") || "staff") as Role,
            });
            setOpen(false);
          }}
        >
          <Field label="Name">
            <TextInput name="name" required />
          </Field>
          <Field label="Email">
            <TextInput name="email" type="email" required />
          </Field>
          <Field label="Role">
            <TextSelect name="role" defaultValue="staff">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </TextSelect>
          </Field>
          <button type="submit" className="btn btn-primary">
            Create user
          </button>
        </form>
      </Modal>

      <Modal open={!!editing} title="Edit user" onClose={() => setEditId(null)}>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateTeamMember(editing.id, {
                name: String(fd.get("name") || editing.name),
                email: String(fd.get("email") || editing.email),
                role: String(fd.get("role") || editing.role) as Role,
              });
              setEditId(null);
            }}
          >
            <Field label="Name">
              <TextInput name="name" defaultValue={editing.name} />
            </Field>
            <Field label="Email">
              <TextInput name="email" type="email" defaultValue={editing.email} />
            </Field>
            <Field label="Role">
              <TextSelect name="role" defaultValue={editing.role}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function RoleCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel p-4">
      <div className="font-semibold text-[var(--color-navy)]">{title}</div>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{body}</p>
    </div>
  );
}
