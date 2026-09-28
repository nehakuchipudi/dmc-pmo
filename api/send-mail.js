module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const key = (process.env.RESEND_API_KEY ?? "").trim();
  if (!key) return res.status(501).json({ error: "RESEND_API_KEY is not set" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
  const to = String(body.to ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const text = String(body.body ?? "").trim();
  const fromEmail = String(body.fromEmail ?? "notifications@dillonmorgan.com").trim();
  const fromName = String(body.fromName ?? "DMC PMO").trim();
  if (!to || !subject || !text) return res.status(400).json({ error: "to, subject, and body are required" });

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      text,
    }),
  });
  const payload = await sent.json().catch(() => ({}));
  if (!sent.ok) return res.status(sent.status).json({ error: payload.message || "Resend could not send" });
  return res.status(200).json({ id: payload.id, delivered: true });
};
