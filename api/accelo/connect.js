const { CLIENT_ID, DEPLOYMENT, fetchToken, json, readBody, setSessionCookie } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });
  const body = readBody(req);
  const secret = String(body.secret || process.env.ACCELO_CLIENT_SECRET || "").trim();
  if (!secret) return json(res, 400, { error: "Enter the Accelo client secret to start the count." });
  try {
    const token = await fetchToken(secret);
    setSessionCookie(req, res, {
      accessToken: token.access_token,
      expiresAt: Date.now() + Number(token.expires_in || 3600) * 1000,
    });
    return json(res, 200, { connected: true, deployment: DEPLOYMENT, clientId: CLIENT_ID });
  } catch (err) {
    return json(res, 401, { error: err instanceof Error ? err.message : "Accelo did not accept the client secret." });
  }
};
