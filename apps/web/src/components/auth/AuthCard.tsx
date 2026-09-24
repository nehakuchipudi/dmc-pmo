"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="panel auth-card w-full max-w-xl p-8 fade-in">
        <div className="mb-3 inline-flex items-center gap-2">
          <span className="brand-mark !mb-0 !bg-[var(--color-navy)]">DMC</span>
          <div className="text-sm font-semibold tracking-[0.14em] text-[var(--color-navy)]">
            DILLON MORGAN CONSULTING
          </div>
        </div>
        <h1 className="page-title text-[1.7rem]">{title}</h1>
        <p className="page-sub mb-6">{subtitle}</p>
        {children}
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-[var(--color-navy)]">
          Back to DMC PMO
        </Link>
      </div>
    </div>
  );
}

export function EntraSetupNote() {
  return (
    <div className="auth-note">
      <p className="font-semibold text-[var(--color-navy)]">Connect Microsoft Entra ID</p>
      <p>
        Register a Single-page application in Entra ID with redirect URI
        {" "}
        <code>/auth/callback/</code>
        . Supported accounts should include work and personal Microsoft emails so people can create
        an account with their original address. Entra then emails the verification or sign-in code.
      </p>
      <p>
        Set <code>NEXT_PUBLIC_ENTRA_CLIENT_ID</code> and optionally
        {" "}
        <code>NEXT_PUBLIC_ENTRA_TENANT_ID</code> or a CIAM
        {" "}
        <code>NEXT_PUBLIC_ENTRA_AUTHORITY</code>.
      </p>
    </div>
  );
}
