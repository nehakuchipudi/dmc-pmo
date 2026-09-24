"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard, EntraSetupNote } from "@/components/auth/AuthCard";
import { Avatar, Field, TextInput } from "@/components/ui";
import { findAccountByEmail } from "@/lib/directory";
import { entraConfigured, startEntraSignIn } from "@/lib/entra";
import { users } from "@/lib/data";
import { roleLabel, useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { setUserId, setSessionUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = entraConfigured();

  function goHome(role: string) {
    router.push(role === "client" ? "/portal" : "/app/home");
  }

  async function signInWithMicrosoft() {
    setError("");
    setBusy(true);
    try {
      await startEntraSignIn({ email: email.trim() || undefined });
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Microsoft sign-in could not start.");
    }
  }

  function signInWithEmail() {
    setError("");
    const found = findAccountByEmail(email);
    if (!found) {
      setError("No account uses that email yet. Create one to continue.");
      return;
    }
    setSessionUser(found);
    goHome(found.role);
  }

  return (
    <AuthCard
      title="Sign in to PMO"
      subtitle="Use your original work or personal email with Microsoft Entra ID. Demo users stay available for the sample workspace."
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (configured) void signInWithMicrosoft();
          else signInWithEmail();
        }}
      >
        <Field label="Email" required>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
          />
        </Field>
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        <button type="submit" className="btn btn-primary w-full justify-center" disabled={busy}>
          {configured ? "Sign in with Microsoft" : "Continue with email"}
        </button>
        {configured ? (
          <button type="button" className="btn btn-ghost w-full justify-center" onClick={signInWithEmail}>
            Use an existing workspace account
          </button>
        ) : null}
      </form>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-[var(--color-navy)]">
          Create an account
        </Link>
        . Entra emails a verification or sign-in code to the address you use.
      </p>
      {!configured ? <EntraSetupNote /> : null}

      <details className="auth-demo">
        <summary>Demo workspace users</summary>
        <div className="mt-3 space-y-3">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              className="flex w-full items-center justify-between rounded-[12px] border border-[var(--color-border)] bg-white px-4 py-3 text-left transition hover:border-[var(--color-gold)] hover:bg-[var(--color-fog)] hover:shadow-[var(--shadow-soft)]"
              onClick={() => {
                setUserId(user.id);
                goHome(user.role);
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
      </details>
    </AuthCard>
  );
}
