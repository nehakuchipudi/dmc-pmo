"use client";

import { useEffect, useMemo, useState } from "react";
import { roleLabel, useAuth } from "@/lib/auth";
import { allAccounts } from "@/lib/directory";
import { applyTeamRole, PERMISSION_AREAS, roleHasGrant, type EditableRole } from "@/lib/rbac";
import { useAppStore } from "@/lib/store";
import type { User } from "@/lib/types";

const ROLES: EditableRole[] = ["leadership", "pm", "finance", "staff"];

export function SettingsPermissions() {
  const { can } = useAuth();
  const canManage = can("manage_users");
  const roleGrants = useAppStore((s) => s.roleGrants);
  const userGrants = useAppStore((s) => s.userGrants);
  const team = useAppStore((s) => s.team);
  const setRoleCapability = useAppStore((s) => s.setRoleCapability);
  const resetRoleGrants = useAppStore((s) => s.resetRoleGrants);
  const setUserCapability = useAppStore((s) => s.setUserCapability);
  const clearUserGrants = useAppStore((s) => s.clearUserGrants);
  const [role, setRole] = useState<EditableRole>("pm");
  const [userId, setUserId] = useState("");
  const [areaId, setAreaId] = useState(PERMISSION_AREAS[0]?.id ?? "home");
  const [accounts, setAccounts] = useState<User[]>([]);
  const area = PERMISSION_AREAS.find((item) => item.id === areaId) ?? PERMISSION_AREAS[0];

  useEffect(() => {
    setAccounts(allAccounts());
  }, [team]);

  const people = useMemo(() => {
    return accounts
      .map((account) => applyTeamRole(account, team) ?? account)
      .filter((person) => person.role !== "client")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts, team]);

  const person = people.find((item) => item.id === userId) ?? null;
  const personRole = person && person.role !== "admin" && person.role !== "client" ? person.role : null;
  const activeRole: EditableRole = personRole ?? role;
  const personal = Boolean(person && userGrants?.[person.id]);
  const lockedAdmin = person?.role === "admin";

  function isOn(cap: (typeof PERMISSION_AREAS)[number]["items"][number]["cap"]) {
    if (lockedAdmin) return true;
    if (person && userGrants?.[person.id]) return userGrants[person.id].includes(cap);
    return roleHasGrant(roleGrants, activeRole, cap);
  }

  const sheetNote = lockedAdmin
    ? "Admin always keeps every permission."
    : person
      ? personal
        ? `Switches for ${person.name} only. Everyone else in ${roleLabel(person.role)} is unchanged.`
        : `Showing ${roleLabel(person.role)} permissions. A change here applies only to ${person.name}.`
      : `Switches for ${roleLabel(activeRole)}.`;

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Permissions</h1>
          <p className="page-sub">
            Access follows a role, so one change applies to everyone in that role. Pick a person in the User menu to set permissions for that person only. Admin always keeps every permission, which keeps the workspace from being locked. Client contacts stay on the portal.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={!canManage || lockedAdmin}
          onClick={() => {
            if (person && personRole) clearUserGrants(person.id);
            else resetRoleGrants(activeRole);
          }}
        >
          {person && personRole ? "Use role defaults" : lockedAdmin ? "Admin keeps every permission" : `Restore ${roleLabel(activeRole)}`}
        </button>
      </header>
      <label className="perm-user">
        <span>User</span>
        <select aria-label="User" value={person?.id ?? ""} onChange={(event) => setUserId(event.target.value)}>
          <option value="">Everyone in the role</option>
          {people.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}, {roleLabel(item.role)}
            </option>
          ))}
        </select>
      </label>
      {person ? null : (
        <div className="perm-roles">
          {ROLES.map((item) => (
            <button
              key={item}
              type="button"
              className={item === role ? "btn btn-primary" : "btn btn-ghost"}
              onClick={() => setRole(item)}
            >
              {roleLabel(item)}
            </button>
          ))}
        </div>
      )}
      <div className="perm-layout">
        <div className="perm-nav panel">
          {PERMISSION_AREAS.map((item) => (
            <button key={item.id} type="button" className={item.id === area?.id ? "is-active" : ""} onClick={() => setAreaId(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="panel perm-sheet">
          <h2 className="section-title">{area?.label}</h2>
          <p className="page-sub">{sheetNote}</p>
          {area?.items.map((item) => {
            const on = isOn(item.cap);
            return (
              <label key={item.cap} className="perm-item">
                <span>
                  <span className="perm-label">{item.label}</span>
                  <span className="perm-detail">{item.detail}</span>
                </span>
                <input
                  type="checkbox"
                  checked={on}
                  disabled={!canManage || lockedAdmin}
                  aria-label={`${item.label} for ${person?.name ?? roleLabel(activeRole)}`}
                  onChange={(event) => {
                    if (person && personRole) setUserCapability(person.id, personRole, item.cap, event.target.checked);
                    else setRoleCapability(activeRole, item.cap, event.target.checked);
                  }}
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
