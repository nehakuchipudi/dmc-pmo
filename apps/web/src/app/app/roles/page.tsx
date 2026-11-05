"use client";

import { PageHeader } from "@/components/ui";
import { roleLabel, useAuth } from "@/lib/auth";
import { PACKS, type PackId } from "@/lib/modules";
import { USER_ROLES } from "@/lib/rbac";
import { packsForRole } from "@/lib/service-ops";
import { useAppStore } from "@/lib/store";

export default function RoleManagementPage() {
  const { can } = useAuth();
  const rolePacks = useAppStore((s) => s.rolePacks);
  const setRolePacks = useAppStore((s) => s.setRolePacks);
  const canEdit = can("manage_users");
  const roles = USER_ROLES.filter((role) => role !== "client");

  return (
    <div className="fade-in">
      <PageHeader
        title="Role Management"
        subtitle="Decide which capability packs each role can open. Workspace packs still have to be on."
      />
      <div className="panel overflow-x-auto p-4">
        <table className="lifecycle-matrix">
          <thead>
            <tr>
              <th>Role</th>
              {PACKS.map((pack) => (
                <th key={pack.id}>{pack.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => {
              const assigned = packsForRole(role, rolePacks);
              return (
                <tr key={role}>
                  <td className="font-medium">{roleLabel(role)}</td>
                  {PACKS.map((pack) => (
                    <td key={`${role}-${pack.id}`}>
                      <input
                        type="checkbox"
                        aria-label={`${roleLabel(role)} ${pack.label}`}
                        checked={assigned.includes(pack.id)}
                        disabled={!canEdit}
                        onChange={(e) => {
                          const current = packsForRole(role, rolePacks);
                          const next = e.target.checked
                            ? Array.from(new Set([...current, pack.id]))
                            : current.filter((id) => id !== pack.id);
                          setRolePacks(role, next as PackId[]);
                        }}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Defaults: Admin, Leadership, and PM get every pack. Finance gets project management and delivery. Staff gets
          delivery and service operations.
        </p>
      </div>
    </div>
  );
}
