const { configured, json, pullQuickBooks, query, setSessionCookie, withSession } = require("./_lib");

const RESOURCES = new Set(["accounts", "ledgers", "items", "companies", "invoices"]);

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return json(res, 405, { error: "GET only" });
  if (!configured()) return json(res, 501, { error: "QuickBooks app keys are not set on this host." });
  const session = await withSession(req, res).catch(() => null);
  if (!session) return json(res, 401, { error: "not_connected" });
  const params = query(req);
  const resource = String(params.resource || "");
  if (!RESOURCES.has(resource)) return json(res, 400, { error: "Unknown QuickBooks import." });
  try {
    const result = await pullQuickBooks(session, resource, {
      customerStatus: params.customerStatus,
      vendorStatus: params.vendorStatus,
    });
    setSessionCookie(req, res, result.session);
    const body = { ...result };
    delete body.session;
    return json(res, 200, body);
  } catch (err) {
    return json(res, 502, { error: err instanceof Error ? err.message : "QuickBooks could not load that data." });
  }
};
