"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { users } from "@/lib/data";
import { roleLabel, useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { setUserId } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="panel w-full max-w-xl p-8 fade-in">
        <div className="mb-3 inline-flex items-center gap-2">
          <span className="brand-mark !mb-0 !bg-[var(--color-navy)]">DMC</span>
          <div className="text-sm font-semibold tracking-[0.14em] text-[var(--color-navy)]">
            DILLON MORGAN CONSULTING
          </div>
        </div>
        <h1 className="page-title text-[1.7rem]">Sign in to PMO</h1>
        <p className="page-sub mb-6">
          Demo access with role-based views. Client portal users are isolated to their company.
        </p>
        <div className="space-y-3">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              className="flex w-full items-center justify-between rounded-[12px] border border-[var(--color-border)] bg-white px-4 py-3 text-left transition hover:border-[var(--color-gold)] hover:bg-[var(--color-fog)] hover:shadow-[var(--shadow-soft)]"
              onClick={() => {
                setUserId(user.id);
                router.push(user.role === "client" ? "/portal" : "/app/home");
              }}
            >
              <div>
                <div className="font-semibold text-[var(--color-ink)]">{user.name}</div>
                <div className="text-sm text-[var(--color-muted)]">
                  {roleLabel(user.role)} · {user.email}
                </div>
              </div>
              <Avatar initials={user.initials} src={user.avatarUrl} name={user.name} size={40} />
            </button>
          ))}
        </div>
        <p className="mt-6 text-xs text-[var(--color-muted)]">
          Production will use Microsoft Entra ID for staff and Entra External ID for portal contacts.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-[var(--color-navy)]">
          Back to DMC PMO
        </Link>
      </div>
    </div>
  );
}
