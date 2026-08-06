"use client";

import { useRouter } from "next/navigation";
import { users } from "@/lib/data";
import { roleLabel, useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { setUserId } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="panel w-full max-w-xl p-8 fade-in">
        <div className="mb-2 text-sm font-semibold tracking-[0.16em] text-[var(--color-gold)]">
          DILLON MORGAN CONSULTING
        </div>
        <h1 className="page-title text-[1.8rem]">Sign in to PMO</h1>
        <p className="page-sub mb-6">
          Demo access with role-based views. Client portal users are isolated to their company.
        </p>
        <div className="space-y-3">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              className="flex w-full items-center justify-between rounded-[10px] border border-[var(--color-border)] bg-white px-4 py-3 text-left transition hover:border-[var(--color-gold)] hover:shadow-[var(--shadow-soft)]"
              onClick={() => {
                setUserId(user.id);
                router.push(user.role === "client" ? "/portal" : "/app/companies");
              }}
            >
              <div>
                <div className="font-semibold text-[var(--color-navy)]">{user.name}</div>
                <div className="text-sm text-[var(--color-muted)]">
                  {roleLabel(user.role)} · {user.email}
                </div>
              </div>
              <span className="avatar">{user.initials}</span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-xs text-[var(--color-muted)]">
          Production will use Microsoft Entra ID for staff and Entra External ID for portal contacts.
        </p>
      </div>
    </div>
  );
}
