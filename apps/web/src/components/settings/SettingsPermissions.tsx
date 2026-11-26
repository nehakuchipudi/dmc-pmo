"use client";

import { useState } from "react";
import { roleLabel, useAuth } from "@/lib/auth";
import { PERMISSION_AREAS, roleHasGrant, type EditableRole } from "@/lib/rbac";
import { useAppStore } from "@/lib/store";

const ROLES: EditableRole[] = ["leadership", "pm", "finance", "staff"];

export function SettingsPermissions() {
  const { can } = useAuth();
  const canManage = can("manage_users");
  const roleGrants = useAppStore((s) => s.roleGrants);
  const setRoleCapability = useAppStore((s) => s.setRoleCapability);
  const resetRoleGrants = useAppStore((s) => s.resetRoleGrants);
  const [role, setRole] = useState<EditableRole>("pm");
  const [areaId, setAreaId] = useState(PERMISSION_AREAS[0]?.id ?? "home");
  const area = PERMISSION_AREAS.find((item) => item.id === areaId) ?? PERMISSION_AREAS[0];

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Permissions</h1>
          <p className="page-sub">
            Access follows a role, so one change applies to everyone in that role. Admin always keeps every permission, which keeps the workspace from being locked. Client contacts stay on the portal.
          </p>
        </div>
        <button type="button" className="btn btn-ghost" disabled={!canManage} onClick={() => resetRoleGrants(role)}>
          Restore {roleLabel(role)}
        </button>
      </header>
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
          <p className="page-sub">Switches for {roleLabel(role)}.</p>
          {area?.items.map((item) => {
            const on = roleHasGrant(roleGrants, role, item.cap);
            return (
              <label key={item.cap} className="perm-item">
                <span>
                  <span className="perm-label">{item.label}</span>
                  <span className="perm-detail">{item.detail}</span>
                </span>
                <input
                  type="checkbox"
                  checked={on}
                  disabled={!canManage}
                  aria-label={`${item.label} for ${roleLabel(role)}`}
                  onChange={(event) => setRoleCapability(role, item.cap, event.target.checked)}
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
