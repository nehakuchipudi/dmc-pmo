const { configured, createQboInvoice, json, readBody, setSessionCookie, withSession } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });
  if (!configured()) return json(res, 501, { error: "QuickBooks app keys are not set on this host." });
  const session = await withSession(req, res).catch(() => null);
  if (!session) return json(res, 401, { error: "not_connected" });
  const body = readBody(req);
  if (!body.companyName || !Array.isArray(body.lines) || !body.lines.length) {
    return json(res, 400, { error: "companyName and at least one line are required" });
  }
  try {
    const created = await createQboInvoice(session, body);
    setSessionCookie(req, res, created.session);
    return json(res, 200, { id: created.id, docNumber: created.docNumber, href: created.href });
  } catch (err) {
    return json(res, 502, { error: err instanceof Error ? err.message : "QuickBooks could not create the invoice." });
  }
};
