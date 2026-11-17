const { configured, json, listTaxCodes, setSessionCookie, withSession } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return json(res, 405, { error: "GET only" });
  if (!configured()) return json(res, 501, { error: "QuickBooks app keys are not set on this host." });
  const session = await withSession(req, res).catch(() => null);
  if (!session) return json(res, 401, { error: "not_connected" });
  try {
    const result = await listTaxCodes(session);
    setSessionCookie(req, res, result.session);
    return json(res, 200, { codes: result.codes });
  } catch (err) {
    return json(res, 502, { error: err instanceof Error ? err.message : "QuickBooks could not load tax codes." });
  }
};
