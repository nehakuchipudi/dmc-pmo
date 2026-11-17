const crypto = require("crypto");
const { authorizeUrl, configured, query, safeReturnTo, setOauthCookie } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const returnTo = safeReturnTo(query(req).returnTo);
  const join = returnTo.includes("?") ? "&" : "?";
  if (!configured()) {
    res.redirect(302, `${returnTo}${join}qb=missing-keys`);
    return;
  }
  const nonce = crypto.randomBytes(16).toString("hex");
  setOauthCookie(req, res, { nonce, returnTo });
  res.redirect(302, authorizeUrl(req, nonce));
};
