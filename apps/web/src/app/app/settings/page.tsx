"use client";

import { useMemo, useState } from "react";
import { Avatar, Modal, PageHeader, StatusPill, Tabs } from "@/components/ui";
import { IfCan } from "@/components/auth/IfCan";
import { AccessDenied } from "@/components/shell/AccessDenied";
import { EmailDomainRecords } from "@/components/settings/EmailDomainRecords";
import { readTeamMemberForm, TeamMemberForm, USER_ROLES } from "@/components/settings/TeamMemberForm";
import { roleLabel, useAuth } from "@/lib/auth";
import { PROJECT_LIFECYCLE_STATUSES } from "@/lib/project-lifecycle";
import { ROLE_SUMMARIES } from "@/lib/rbac";
import { useAppStore } from "@/lib/store";

const SETTINGS_TABS = ["Users", "Lifecycle", "Email domain"];

export default function SettingsPage() {
  const { can } = useAuth();
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
  const canConfigure = can("configure_lifecycle");
  const canManageUsers = can("manage_users");

  const rows = useMemo(
    () => team.filter((m) => showInactive || m.active),
    [team, showInactive],
  );
  const editing = team.find((m) => m.id === editId);

  if (!can("view_users")) return <AccessDenied moduleName="Users and roles" />;

  return (
    <div className="fade-in">
      <PageHeader
        title={tab === "Users" ? "Users & roles" : tab === "Email domain" ? "Email domain / DNS records" : "Settings"}
        subtitle={
          tab === "Users"
            ? canManageUsers
              ? "Add people, assign roles, set rates, and decide who can see hours versus budgets."
              : "Review who is on the workspace and what each role can do. Only an admin can change access."
            : tab === "Email domain"
              ? "Prove DMC PMO may send invoices and reminders as your company, so inboxes do not treat them as spam."
            : "Manage team access and the project lifecycle workflow."
        }
        actions={
          tab === "Users" ? (
          <>
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              Show inactive
            </label>
            <IfCan cap="manage_users">
              <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
                + Add user
              </button>
            </IfCan>
          </>
          ) : undefined
        }
      />

      <Tabs tabs={SETTINGS_TABS} active={tab} onChange={setTab} />

      {tab === "Users" ? (
      <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ROLE_SUMMARIES.filter((item) => item.role !== "client").map((item) => (
          <RoleCard key={item.role} title={item.title} body={item.body} />
        ))}
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
                <td>{roleLabel(m.role)}</td>
                <td className="text-[var(--color-muted)]">
                  {m.financialVisibility === "rates_and_budgets" ? "Rates and budgets" : "Hours only"}
                </td>
                <td>
                  <StatusPill tone={m.active ? "success" : "neutral"}>{m.active ? "Active" : "Inactive"}</StatusPill>
                </td>
                <td className="text-right space-x-2">
                  {canManageUsers ? (
                    <>
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
                    </>
                  ) : (
                    <span className="text-xs text-[var(--color-muted)]">View only</span>
                  )}
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
                  <label key={role} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={role === "admin" ? true : checked}
                      disabled={!canConfigure || role === "admin"}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...projectWorkflow.changerRoles, role]
                          : projectWorkflow.changerRoles.filter((item) => item !== role);
                        setProjectWorkflowRoles(next);
                      }}
                    />
                    {roleLabel(role)}
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

      {tab === "Email domain" ? <EmailDomainRecords /> : null}

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
