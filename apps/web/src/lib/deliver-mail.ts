export type MailAttachment = {
  name: string;
  contentType: string;
  contentBytes: string;
};

export type MailPayload = {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
  cc?: string;
  attachments?: MailAttachment[];
};

export function parseMailAddresses(value?: string) {
  return (value ?? "")
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter((part) => part.includes("@"));
}

function decodeBase64(value: string) {
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(value, "base64"));
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function mailAttachmentBlob(file: MailAttachment) {
  return new Blob([decodeBase64(file.contentBytes)], {
    type: file.contentType || "application/octet-stream",
  });
}

export function downloadMailAttachment(file: MailAttachment) {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(mailAttachmentBlob(file));
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function viewMailAttachment(file: MailAttachment) {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(mailAttachmentBlob(file));
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    downloadMailAttachment(file);
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

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
  return "Sign in with Microsoft so DMC PMO can send from your Outlook mailbox. Demo users cannot deliver mail.";
}

export async function deliverMail(input: MailPayload): Promise<MailDelivery> {
  const to = parseMailAddresses(input.to)[0] ?? input.to.trim();
  if (!to || !to.includes("@")) return { delivered: false, error: "That invite needs a valid email address." };

  const graph = await tryGraphSend(input);
  if (graph) return graph;

  const api = await tryApiSend(input);
  if (api) return api;

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
          toRecipients: parseMailAddresses(input.to).map((address) => ({ emailAddress: { address } })),
          ccRecipients: parseMailAddresses(input.cc).map((address) => ({ emailAddress: { address } })),
          attachments: (input.attachments ?? []).map((file) => ({
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: file.name,
            contentType: file.contentType,
            contentBytes: file.contentBytes,
          })),
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
