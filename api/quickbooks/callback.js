const {
  clearOauthCookie,
  companyName,
  configured,
  environment,
  exchangeCode,
  query,
  readOauth,
  safeReturnTo,
  setSessionCookie,
} = require("./_lib");

function bounce(res, returnTo, flag) {
  const join = returnTo.includes("?") ? "&" : "?";
  res.redirect(302, `${returnTo}${join}qb=${flag}`);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const params = query(req);
  const oauth = readOauth(req);
  const returnTo = safeReturnTo(oauth?.returnTo);
  clearOauthCookie(req, res);
  if (!configured()) return bounce(res, returnTo, "missing-keys");
  if (params.error) return bounce(res, returnTo, params.error === "access_denied" ? "denied" : "error");
  if (!params.code || !params.realmId || !oauth?.nonce || params.state !== oauth.nonce) {
    return bounce(res, returnTo, "error");
  }
  try {
    const tokens = await exchangeCode(req, String(params.code));
    const session = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + Number(tokens.expires_in || 3600) * 1000 - 60_000,
      realmId: String(params.realmId),
      environment: environment(),
      companyName: "",
    };
    session.companyName = await companyName(session);
    setSessionCookie(req, res, session);
    bounce(res, returnTo, "connected");
  } catch {
    bounce(res, returnTo, "error");
  }
};
