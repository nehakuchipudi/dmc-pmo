const { clearSessionCookie, configured, json, revokeToken, withSession } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res.status(204).end();
  }
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });
  if (configured()) {
    const session = await withSession(req, res).catch(() => null);
    await revokeToken(session?.refreshToken);
  }
  clearSessionCookie(req, res);
  return json(res, 200, { connected: false });
};
