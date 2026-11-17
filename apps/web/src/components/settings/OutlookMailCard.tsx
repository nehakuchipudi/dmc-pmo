"use client";

import { useEffect, useState } from "react";
import { connectOutlookMail, peekOutlookMail, type OutlookMailStatus } from "@/lib/entra";
import { useAppStore } from "@/lib/store";

export function OutlookMailCard({ returnTo }: { returnTo: string }) {
  const pushToast = useAppStore((s) => s.pushToast);
  const [status, setStatus] = useState<OutlookMailStatus | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setStatus(await peekOutlookMail());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onConnect() {
    setBusy(true);
    try {
      const result = await connectOutlookMail({ returnTo });
      await refresh();
      if (result.ok) pushToast("Outlook mailbox connected. Invites will send from this mailbox.", "success");
      else if (result.error && !/Redirecting/.test(result.error)) pushToast(result.error, "danger");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Microsoft sign-in could not start.", "danger");
    } finally {
      setBusy(false);
    }
  }

  const state = status?.state ?? "needs-sign-in";
  const label =
    state === "ready"
      ? `Invites send from ${status?.account ?? "your Outlook mailbox"}.`
      : state === "needs-consent"
        ? "Microsoft signed you in. Allow Mail.Send so DMC PMO can send from this Outlook mailbox."
        : state === "unconfigured"
          ? "Microsoft Entra ID is not configured on this host yet."
          : "You are on a demo session. Sign in with Microsoft so invites leave from your Outlook mailbox.";

  return (
    <div className="outlook-mail-card">
      <div>
        <p className="outlook-mail-kicker">{state === "ready" ? "Outlook connected" : "Outlook not connected"}</p>
        <p>{label}</p>
      </div>
      {state !== "unconfigured" ? (
        <button type="button" className="btn btn-primary" onClick={() => void onConnect()} disabled={busy}>
          {state === "ready" ? "Reconnect Outlook" : state === "needs-consent" ? "Allow Outlook mail" : "Connect Outlook"}
        </button>
      ) : null}
    </div>
  );
}
