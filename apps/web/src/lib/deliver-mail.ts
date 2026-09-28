export type MailPayload = {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
};

export type MailDelivery = {
  delivered: boolean;
  via?: "graph" | "api";
  error?: string;
};

export function mailHtml(text: string) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const linked = escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
  return `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.5;color:#1b2a41">${linked.replace(/\n/g, "<br/>")}</div>`;
}

export function noSenderMessage() {
  return "No mail sender is connected. Sign in with Microsoft so DMC PMO can send from your mailbox, or add a RESEND_API_KEY on the host.";
}

export async function deliverMail(input: MailPayload): Promise<MailDelivery> {
  const to = input.to.trim();
  if (!to || !to.includes("@")) return { delivered: false, error: "That invite needs a valid email address." };

  const api = await tryApiSend(input);
  if (api) return api;

  const graph = await tryGraphSend(input);
  if (graph) return graph;

  return { delivered: false, error: noSenderMessage() };
}

async function tryApiSend(input: MailPayload): Promise<MailDelivery | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const res = await fetch("/api/send-mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.status === 404 || res.status === 501) return undefined;
    if (!res.ok) {
      const text = await res.text();
      return { delivered: false, via: "api", error: text.slice(0, 180) || "The workspace mail API could not send." };
    }
    return { delivered: true, via: "api" };
  } catch {
    return undefined;
  }
}

async function tryGraphSend(input: MailPayload): Promise<MailDelivery | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const { acquireMailToken } = await import("./entra");
    const token = await acquireMailToken();
    if (!token) return undefined;
    const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: input.subject,
          body: { contentType: "HTML", content: mailHtml(input.body) },
          toRecipients: [{ emailAddress: { address: input.to } }],
        },
        saveToSentItems: true,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        delivered: false,
        via: "graph",
        error:
          res.status === 403
            ? "Microsoft needs the Mail.Send permission on the Entra app before invites can leave the workspace."
            : text.slice(0, 180) || "Microsoft Graph could not send the mail.",
      };
    }
    return { delivered: true, via: "graph" };
  } catch (err) {
    return {
      delivered: false,
      via: "graph",
      error: err instanceof Error ? err.message : "Microsoft sign-in is required to send mail.",
    };
  }
}
