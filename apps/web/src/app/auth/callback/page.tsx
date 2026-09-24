"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { claimsFromAccount, completeEntraRedirect, entraConfigured } from "@/lib/entra";
import { takePendingSignup } from "@/lib/directory";
import { useAuth } from "@/lib/auth";
import { useAppStore } from "@/lib/store";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setSessionUser } = useAuth();
  const registerAccount = useAppStore((s) => s.registerAccount);
  const [message, setMessage] = useState("Finishing Microsoft sign-in...");

  useEffect(() => {
    let cancelled = false;
    async function finish() {
      if (!entraConfigured()) {
        router.replace("/login");
        return;
      }
      try {
        const account = await completeEntraRedirect();
        if (!account) {
          setMessage("Microsoft did not return an account. Try signing in again.");
          return;
        }
        const claims = claimsFromAccount(account);
        const pending = takePendingSignup();
        const name =
          pending ? `${pending.firstName} ${pending.lastName}`.trim() : claims.name;
        const email = (pending?.email || claims.email).toLowerCase();
        if (!email) {
          setMessage("Microsoft signed you in, but no email was returned.");
          return;
        }
        const user = registerAccount({
          name: name || email,
          email,
          role: pending?.role ?? "staff",
          companyId: pending?.companyId,
          entraOid: claims.oid,
          notifyEmail: pending?.notifyEmail ?? true,
        });
        if (cancelled) return;
        setSessionUser(user);
        router.replace(user.role === "client" ? "/portal" : "/app/home");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Microsoft sign-in failed.");
      }
    }
    void finish();
    return () => {
      cancelled = true;
    };
  }, [registerAccount, router, setSessionUser]);

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="panel max-w-md p-8 text-center">
        <p className="font-semibold text-[var(--color-navy)]">{message}</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">You can close this tab if nothing happens.</p>
      </div>
    </div>
  );
}
