"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard, EntraSetupNote } from "@/components/auth/AuthCard";
import { Field, TextInput, TextSelect } from "@/components/ui";
import { findAccountByEmail, savePendingSignup } from "@/lib/directory";
import { entraConfigured, startEntraSignIn } from "@/lib/entra";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import type { Role } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const { setSessionUser } = useAuth();
  const registerAccount = useAppStore((s) => s.registerAccount);
  const companies = useAppStore((s) => s.companies);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [companyId, setCompanyId] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = entraConfigured();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!firstName.trim() || !trimmed) {
      setError("First name and email are required.");
      return;
    }
    const existing = findAccountByEmail(trimmed);
    if (existing) {
      setError("An account already uses that email. Sign in instead.");
      return;
    }
    const pending = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: trimmed,
      role,
      companyId: role === "client" ? companyId || undefined : undefined,
      notifyEmail,
    };
    savePendingSignup(pending);
    if (configured) {
      setBusy(true);
      try {
        await startEntraSignIn({ email: trimmed, create: true });
      } catch (err) {
        setBusy(false);
        setError(err instanceof Error ? err.message : "Microsoft sign-up could not start.");
      }
      return;
    }
    const user = registerAccount({
      name: `${pending.firstName} ${pending.lastName}`.trim(),
      email: trimmed,
      role,
      companyId: pending.companyId,
      notifyEmail,
    });
    setSessionUser(user);
    router.push(user.role === "client" ? "/portal" : "/app/home");
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Use the email address you already work from. Microsoft Entra ID verifies it and we send workspace notifications there."
    >
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="auth-name-grid">
          <Field label="First name" required>
            <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
          </Field>
          <Field label="Last name">
            <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
          </Field>
        </div>
        <Field label="Email" required>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </Field>
        <Field label="I am joining as">
          <TextSelect value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="staff">Internal team (PMO workspace)</option>
            <option value="pm">Project manager</option>
            <option value="finance">Finance</option>
            <option value="leadership">Leadership</option>
            <option value="client">Client portal contact</option>
          </TextSelect>
        </Field>
        {role === "client" ? (
          <Field label="Company">
            <TextSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">Choose a company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </TextSelect>
          </Field>
        ) : null}
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.checked)}
          />
          <span>Send account and workspace notifications to this email.</span>
        </label>
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        <button type="submit" className="btn btn-primary w-full justify-center" disabled={busy}>
          {configured ? "Create account with Microsoft" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[var(--color-navy)]">
          Sign in
        </Link>
      </p>
      {!configured ? <EntraSetupNote /> : null}
    </AuthCard>
  );
}
