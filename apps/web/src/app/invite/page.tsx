"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { roleLabel } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { inviteLoginHref, inviteSignupHref } from "@/lib/user-invite";

const ROLES: Role[] = ["admin", "pm", "staff", "finance", "leadership", "client"];

function asRole(value: string | null): Role | undefined {
  return ROLES.find((role) => role === value);
}

export default function InvitePage() {
  const params = useSearchParams();
  const email = (params.get("email") ?? "").trim();
  const firstName = params.get("first") ?? "";
  const lastName = params.get("last") ?? "";
  const role = asRole(params.get("role"));
  const name = [firstName, lastName].filter(Boolean).join(" ");
  const signupHref = inviteSignupHref({ email, firstName, lastName, origin: "" }) || "/signup/?invite=1";
  const loginHref = email ? inviteLoginHref(email, "") : "/login/";

  return (
    <AuthCard
      title={name ? `${name}, you are invited` : "You are invited to DMC PMO"}
      subtitle="Open the workspace with the email from your invitation. Create an account first if you have not signed in before, then return with Microsoft Entra ID."
    >
      <ol className="invite-steps">
        <li>
          <strong>Create your account</strong>
          <span>Use {email || "the invited email"} so the roster recognizes you{role ? ` as ${roleLabel(role)}` : ""}.</span>
        </li>
        <li>
          <strong>Sign in</strong>
          <span>Microsoft Entra ID verifies that same address. Demo workspaces can continue with email.</span>
        </li>
        <li>
          <strong>Open the tool</strong>
          <span>After sign-in you land in DMC PMO and can work on assigned projects.</span>
        </li>
      </ol>
      <div className="invite-actions">
        <Link href={signupHref} className="btn btn-primary justify-center">
          Create account
        </Link>
        <Link href={loginHref} className="btn btn-ghost justify-center">
          Sign in
        </Link>
      </div>
    </AuthCard>
  );
}
