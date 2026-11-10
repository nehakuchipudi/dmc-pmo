"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Layers, MoreVertical, Receipt, Settings as SettingsIcon, Users, Workflow, Zap } from "lucide-react";
import { clsx } from "clsx";
import { Avatar, Modal, StatusPill } from "@/components/ui";
import { IfCan } from "@/components/auth/IfCan";
import { EmailDomainRecords } from "@/components/settings/EmailDomainRecords";
import { SettingsBilling } from "@/components/settings/SettingsBilling";
import { readTeamMemberForm, TeamMemberForm, USER_ROLES } from "@/components/settings/TeamMemberForm";
import { roleLabel, useAuth } from "@/lib/auth";
import { PROJECT_LIFECYCLE_STATUSES } from "@/lib/project-lifecycle";
import { NAV_MODULES, PACKS, type PackId } from "@/lib/modules";
import { ROLE_SUMMARIES } from "@/lib/rbac";
import { useAppStore } from "@/lib/store";
import { inviteLandingHref } from "@/lib/user-invite";

type SettingsSection = "capabilities" | "users" | "lifecycle" | "email" | "billing" | "prefs";

const SECTIONS: SettingsSection[] = ["capabilities", "users", "lifecycle", "email", "billing", "prefs"];

function isSettingsSection(value: string | null): value is SettingsSection {
  return !!value && SECTIONS.includes(value as SettingsSection);
}

const RAIL: { id: SettingsSection; label: string; icon: typeof Users; needUsers?: boolean; needBilling?: boolean }[] = [
  { id: "capabilities", label: "Capabilities", icon: Layers },
  { id: "users", label: "Users & roles", icon: Users, needUsers: true },
  { id: "lifecycle", label: "Lifecycle", icon: Workflow, needUsers: true },
  { id: "email", label: "Email domain", icon: Globe, needUsers: true },
  { id: "billing", label: "Billing", icon: Receipt, needBilling: true },
  { id: "prefs", label: "Preferences", icon: SettingsIcon },
];

export function SettingsWorkspace() {
  const { can } = useAuth();
  const canViewUsers = can("view_users");
  const canManageUsers = can("manage_users");
  const canManagePacks = can("manage_users") || can("manage_service_ops");
  const canConfigure = can("configure_lifecycle");
  const enabledPacks = useAppStore((s) => s.enabledPacks);
  const setEnabledPacks = useAppStore((s) => s.setEnabledPacks);
  const team = useAppStore((s) => s.team);
  const addTeamMember = useAppStore((s) => s.addTeamMember);
  const inviteTeamMember = useAppStore((s) => s.inviteTeamMember);
  const updateTeamMember = useAppStore((s) => s.updateTeamMember);
  const setTeamMemberActive = useAppStore((s) => s.setTeamMemberActive);
  const pushToast = useAppStore((s) => s.pushToast);
  const projectWorkflow = useAppStore((s) => s.projectWorkflow);
  const setProjectWorkflowTransition = useAppStore((s) => s.setProjectWorkflowTransition);
  const setProjectWorkflowRoles = useAppStore((s) => s.setProjectWorkflowRoles);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("section");
  const [section, setSection] = useState<SettingsSection>(isSettingsSection(requested) ? requested : "capabilities");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [query, setQuery] = useState("");
  const editing = team.find((m) => m.id === editId);

  useEffect(() => {
    if (isSettingsSection(requested)) setSection(requested);
  }, [requested]);

  function openSection(next: SettingsSection) {
    setSection(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "capabilities") params.delete("section");
    else params.set("section", next);
    const qs = params.toString();
    router.replace(qs ? `/app/settings/?${qs}` : "/app/settings/", { scroll: false });
  }

  const items = RAIL.filter((item) => (!item.needUsers || canViewUsers) && (!item.needBilling || can("view_billing")));
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return team.filter((m) => {
      if (!showInactive && !m.active) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.title ?? "").toLowerCase().includes(q) ||
        roleLabel(m.role).toLowerCase().includes(q)
      );
    });
  }, [team, showInactive, query]);

  return (
    <div className="settings-shell fade-in">
      <aside className="settings-rail" aria-label="Settings">
        {items.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={clsx("settings-rail-item", active && "is-active")}
              onClick={() => openSection(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
        {can("view_automations") ? (
          <Link href="/app/automations" className="settings-rail-item">
            <Zap size={16} />
            <span>Automations</span>
          </Link>
        ) : null}
      </aside>

      <div className="settings-main">
        {section === "capabilities" ? (
          <>
            <header className="page-header">
              <div>
                <h1 className="page-title">Capabilities</h1>
                <p className="page-sub">
                  DMC PMO is one modular platform. Turn on only the packs this customer needs. Home and the left nav
                  update as soon as you change a pack.
                </p>
              </div>
            </header>
            <div className="grid gap-3 lg:grid-cols-3">
              {PACKS.map((pack) => {
                const on = enabledPacks.includes(pack.id);
                const modules = NAV_MODULES.filter((item) => item.pack === pack.id);
                return (
                  <div key={pack.id} className="panel p-4">
                    <label className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[var(--color-navy)]">{pack.label}</div>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">{pack.summary}</p>
                      </div>
                      <input
                        type="checkbox"
                        aria-label={`Enable ${pack.label}`}
                        checked={on}
                        disabled={!canManagePacks}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...enabledPacks, pack.id]
                            : enabledPacks.filter((id) => id !== pack.id);
                          setEnabledPacks(Array.from(new Set(next)) as PackId[]);
                        }}
                      />
                    </label>
                    <ul className="mt-3 space-y-1 text-sm text-[var(--color-muted)]">
                      {modules.map((item) => (
                        <li key={item.href}>{item.label}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}

        {section === "users" ? (
          <div className="settings-users">
            <header className="page-header">
              <div>
                <h1 className="page-title">Users & roles</h1>
                <p className="page-sub">
                  {canManageUsers
                    ? "Add people, send an invite, assign roles, set rates, and decide who can see hours versus budgets."
                    : "Review who is on the workspace and what each role can do. Only an admin can change access."}
                </p>
              </div>
              <div className="page-header-actions">
                <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                  Show inactive
                </label>
                <IfCan cap="manage_users">
                  <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
                    Add user
                  </button>
                </IfCan>
              </div>
            </header>

            <label className="settings-search">
              <input
                type="search"
                placeholder="Search users"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>

            <div className="panel">
              <div className="table-wrap">
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
                            <Avatar initials={m.initials} name={m.name} size={32} />
                            <div>
                              <div className="font-medium">{m.name}</div>
                              {m.department ? <div className="text-xs text-[var(--color-muted)]">{m.department}</div> : null}
                            </div>
                          </div>
                        </td>
                        <td className="text-[var(--color-muted)]">{m.title || "None"}</td>
                        <td className="text-[var(--color-muted)]" title={m.email}>{m.email}</td>
                        <td>{roleLabel(m.role)}</td>
                        <td className="text-[var(--color-muted)]">
                          {m.financialVisibility === "rates_and_budgets" ? "Rates and budgets" : "Hours only"}
                        </td>
                        <td>
                          <div className="flex flex-col items-start gap-1">
                            <StatusPill tone={m.active ? "success" : "neutral"}>{m.active ? "Active" : "Inactive"}</StatusPill>
                            {m.invitedAt ? (
                              <div className="text-xs text-[var(--color-muted)] whitespace-nowrap">Invited {m.invitedAt}</div>
                            ) : null}
                          </div>
                        </td>
                        <td
                          className="row-actions text-right"
                          onMouseEnter={() => setMenuId(m.id)}
                          onMouseLeave={() => setMenuId((id) => (id === m.id ? null : id))}
                        >
                          {canManageUsers ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                aria-label={`Actions for ${m.name}`}
                                onClick={() => setMenuId(menuId === m.id ? null : m.id)}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {menuId === m.id ? (
                                <div className="row-menu">
                                  <button type="button" onClick={() => { setEditId(m.id); setMenuId(null); }}>
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      inviteTeamMember(m.id);
                                      setMenuId(null);
                                    }}
                                  >
                                    {m.invitedAt ? "Resend invite" : "Send invite"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const href = inviteLandingHref({
                                        email: m.email,
                                        firstName: m.firstName,
                                        lastName: m.lastName,
                                        role: m.role,
                                      });
                                      void navigator.clipboard.writeText(href);
                                      pushToast("Invite link copied");
                                      setMenuId(null);
                                    }}
                                  >
                                    Copy invite link
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTeamMemberActive(m.id, !m.active);
                                      setMenuId(null);
                                    }}
                                  >
                                    {m.active ? "Deactivate" : "Reactivate"}
                                  </button>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-xs text-[var(--color-muted)]">View only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!rows.length ? (
                      <tr>
                        <td colSpan={7} className="empty-row">
                          No users match that search.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {ROLE_SUMMARIES.filter((item) => item.role !== "client").map((item) => (
                <RoleCard key={item.role} title={item.title} body={item.body} />
              ))}
            </div>
          </div>
        ) : null}

        {section === "lifecycle" ? (
          <div className="space-y-4">
            <header className="page-header">
              <div>
                <h1 className="page-title">Lifecycle</h1>
                <p className="page-sub">Manage who can change project status and which moves are allowed.</p>
              </div>
            </header>
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

        {section === "billing" ? <SettingsBilling /> : null}

        {section === "email" ? (
          <>
            <header className="page-header">
              <div>
                <h1 className="page-title">Email domain / DNS records</h1>
                <p className="page-sub">
                  Prove DMC PMO may send invoices and reminders as your company, so inboxes do not treat them as spam.
                </p>
              </div>
            </header>
            <EmailDomainRecords />
          </>
        ) : null}

        {section === "prefs" ? (
          <>
            <header className="page-header">
              <div>
                <h1 className="page-title">Preferences</h1>
                <p className="page-sub">Workspace alerts for your sign-in. These stay on this device.</p>
              </div>
            </header>
            <div className="panel space-y-4 p-4 text-sm">
              <label className="flex items-center justify-between gap-3">
                <span>Email me overdue invoice alerts</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Friday timesheet reminder</span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
          </>
        ) : null}
      </div>

      <Modal open={open} title="Add user" onClose={() => setOpen(false)} xl>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const { sendInvite, ...value } = readTeamMemberForm(e.currentTarget);
            addTeamMember({ ...value, sendInvite });
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
              const { sendInvite: _invite, ...value } = readTeamMemberForm(e.currentTarget);
              updateTeamMember(editing.id, value);
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
