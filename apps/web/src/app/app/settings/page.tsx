"use client";

import { useMemo, useState } from "react";
import { Avatar, Modal, PageHeader, StatusPill, Tabs } from "@/components/ui";
import { readTeamMemberForm, TeamMemberForm, USER_ROLES } from "@/components/settings/TeamMemberForm";
import { PROJECT_LIFECYCLE_STATUSES } from "@/lib/project-lifecycle";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";

const SETTINGS_TABS = ["Users", "Lifecycle"];

export default function SettingsPage() {
  const { user } = useAuth();
  const team = useAppStore((s) => s.team);
  const addTeamMember = useAppStore((s) => s.addTeamMember);
  const updateTeamMember = useAppStore((s) => s.updateTeamMember);
  const setTeamMemberActive = useAppStore((s) => s.setTeamMemberActive);
  const projectWorkflow = useAppStore((s) => s.projectWorkflow);
  const setProjectWorkflowTransition = useAppStore((s) => s.setProjectWorkflowTransition);
  const setProjectWorkflowRoles = useAppStore((s) => s.setProjectWorkflowRoles);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [tab, setTab] = useState("Users");
  const canConfigure = user?.role === "admin";

  const rows = useMemo(
    () => team.filter((m) => showInactive || m.active),
    [team, showInactive],
  );
  const editing = team.find((m) => m.id === editId);

  return (
    <div className="fade-in">
      <PageHeader
        title={tab === "Users" ? "Users & roles" : "Settings"}
        subtitle={
          tab === "Users"
            ? "Add people, set rates, and decide who can see hours versus budgets. Sign-in uses Microsoft Entra ID and the email on the record."
            : "Manage team access and the project lifecycle workflow."
        }
        actions={
          tab === "Users" ? (
          <>
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              Show inactive
            </label>
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              + Add user
            </button>
          </>
          ) : undefined
        }
      />

      <Tabs tabs={SETTINGS_TABS} active={tab} onChange={setTab} />

      {tab === "Users" ? (
      <div>
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
              <th>Title</th>
              <th>Email</th>
              <th>Role</th>
              <th>Finance</th>
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
                    <div>
                      <div className="font-medium">{m.name}</div>
                      {m.department ? <div className="text-xs text-[var(--color-muted)]">{m.department}</div> : null}
                    </div>
                  </div>
                </td>
                <td className="text-[var(--color-muted)]">{m.title || "None"}</td>
                <td className="text-[var(--color-muted)]">{m.email}</td>
                <td className="capitalize">{m.role}</td>
                <td className="text-[var(--color-muted)]">
                  {m.financialVisibility === "rates_and_budgets" ? "Rates and budgets" : "Hours only"}
                </td>
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
      </div>
      ) : null}

      {tab === "Lifecycle" ? (
        <div className="space-y-4">
          <div className="panel p-4">
            <h2 className="section-title">Who can change status</h2>
            <p className="mb-3 text-sm text-[var(--color-muted)]">
              Authorized roles can move a project from the header. Invalid transitions stay blocked.
            </p>
            <div className="flex flex-wrap gap-3">
              {USER_ROLES.filter((role) => role !== "client").map((role) => {
                const checked = projectWorkflow.changerRoles.includes(role);
                return (
                  <label key={role} className="flex items-center gap-2 text-sm capitalize">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!canConfigure}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...projectWorkflow.changerRoles, role]
                          : projectWorkflow.changerRoles.filter((item) => item !== role);
                        setProjectWorkflowRoles(next);
                      }}
                    />
                    {role}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="panel overflow-x-auto p-4">
            <h2 className="section-title">Allowed transitions</h2>
            <p className="mb-3 text-sm text-[var(--color-muted)]">
              Check a cell to allow moving from the row status to the column status.
            </p>
            <table className="lifecycle-matrix">
              <thead>
                <tr>
                  <th>From</th>
                  {PROJECT_LIFECYCLE_STATUSES.map((status) => (
                    <th key={status}>{status}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROJECT_LIFECYCLE_STATUSES.map((from) => (
                  <tr key={from}>
                    <td className="font-medium">{from}</td>
                    {PROJECT_LIFECYCLE_STATUSES.map((to) => {
                      const allowed = (projectWorkflow.transitions[from] ?? []).includes(to);
                      return (
                        <td key={`${from}-${to}`}>
                          {from === to ? (
                            <span className="text-[var(--color-muted)]">Current</span>
                          ) : (
                            <input
                              type="checkbox"
                              aria-label={`Allow ${from} to ${to}`}
                              checked={allowed}
                              disabled={!canConfigure}
                              onChange={(e) => setProjectWorkflowTransition(from, to, e.target.checked)}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <Modal open={open} title="Add user" onClose={() => setOpen(false)} xl>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = readTeamMemberForm(e.currentTarget);
            addTeamMember(value);
            setOpen(false);
          }}
        >
          <TeamMemberForm team={team} submitLabel="Create user" />
        </form>
      </Modal>

      <Modal open={!!editing} title="Edit user" onClose={() => setEditId(null)} xl>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateTeamMember(editing.id, readTeamMemberForm(e.currentTarget));
              setEditId(null);
            }}
          >
            <TeamMemberForm member={editing} team={team} submitLabel="Save user" />
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
