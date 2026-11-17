const { configured, environment, json, redirectUri, withSession } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return json(res, 405, { error: "GET only" });
  const session = configured() ? await withSession(req, res).catch(() => null) : null;
  return json(res, 200, {
    configured: configured(),
    connected: Boolean(session?.realmId),
    companyName: session?.companyName || undefined,
    realmId: session?.realmId || undefined,
    environment: session?.environment || environment(),
    callbackUrl: redirectUri(req),
  });
};
