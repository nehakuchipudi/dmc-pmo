const crypto = require("crypto");

const COOKIE = "dmc_qb";
const OAUTH_COOKIE = "dmc_qb_oauth";
const MINOR = "75";
const AUTH = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const REVOKE = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

function configured() {
  return Boolean((process.env.QB_CLIENT_ID || "").trim() && (process.env.QB_CLIENT_SECRET || "").trim());
}

function environment() {
  return (process.env.QB_ENVIRONMENT || "sandbox").trim().toLowerCase() === "production" ? "production" : "sandbox";
}

function apiHost(env) {
  return env === "production" ? "https://quickbooks.api.intuit.com" : "https://sandbox-quickbooks.api.intuit.com";
}

function invoiceHref(env, id) {
  const host = env === "production" ? "https://app.qbo.intuit.com" : "https://app.sandbox.qbo.intuit.com";
  return `${host}/app/invoice?txnId=${encodeURIComponent(id)}`;
}

function origin(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "https")
    .split(",")[0]
    .trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "dmc-pmo.vercel.app")
    .split(",")[0]
    .trim();
  return `${proto}://${host}`;
}

function redirectUri(req) {
  return (process.env.QB_REDIRECT_URI || "").trim() || `${origin(req)}/api/quickbooks/callback`;
}

function clientId() {
  return (process.env.QB_CLIENT_ID || "").trim();
}

function clientSecret() {
  return (process.env.QB_CLIENT_SECRET || "").trim();
}

function basicAuth() {
  return Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64");
}

function query(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    return Object.fromEntries(new URL(req.url, origin(req)).searchParams);
  } catch {
    return {};
  }
}

function readCookies(req) {
  const header = String(req.headers.cookie || "");
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

function keyBuf() {
  return crypto.scryptSync(clientSecret() || "dmc-qb-placeholder", "dmc-qb", 32);
}

function seal(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuf(), iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(obj), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

function open(token) {
  try {
    const buf = Buffer.from(String(token || ""), "base64url");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuf(), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function cookieBase(req, name, value, maxAge) {
  const proto = String(req.headers["x-forwarded-proto"] || "https")
    .split(",")[0]
    .trim();
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/api/quickbooks",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (proto === "https") parts.push("Secure");
  return parts.join("; ");
}

function clearCookie(req, name) {
  const proto = String(req.headers["x-forwarded-proto"] || "https")
    .split(",")[0]
    .trim();
  const parts = [`${name}=`, "Path=/api/quickbooks", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (proto === "https") parts.push("Secure");
  return parts.join("; ");
}

function appendCookie(res, value) {
  const prev = res.getHeader("Set-Cookie");
  if (!prev) res.setHeader("Set-Cookie", value);
  else if (Array.isArray(prev)) res.setHeader("Set-Cookie", [...prev, value]);
  else res.setHeader("Set-Cookie", [prev, value]);
}

function setSessionCookie(req, res, session) {
  appendCookie(res, cookieBase(req, COOKIE, seal(session), 60 * 60 * 24 * 360));
}

function setOauthCookie(req, res, payload) {
  appendCookie(res, cookieBase(req, OAUTH_COOKIE, seal(payload), 600));
}

function clearOauthCookie(req, res) {
  appendCookie(res, clearCookie(req, OAUTH_COOKIE));
}

function clearSessionCookie(req, res) {
  appendCookie(res, clearCookie(req, COOKIE));
}

function readSession(req) {
  if (!configured()) return null;
  return open(readCookies(req)[COOKIE]);
}

function readOauth(req) {
  if (!configured()) return null;
  return open(readCookies(req)[OAUTH_COOKIE]);
}

function json(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  return res.status(status).json(body);
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch {
      return {};
    }
  }
  return {};
}

function safeReturnTo(value) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("/app/")) return "/app/settings/?section=billing&panel=quickbooks";
  if (raw.startsWith("//") || raw.includes("://")) return "/app/settings/?section=billing&panel=quickbooks";
  return raw.slice(0, 300);
}

function authorizeUrl(req, nonce) {
  const params = new URLSearchParams({
    client_id: clientId(),
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: redirectUri(req),
    state: nonce,
  });
  return `${AUTH}?${params.toString()}`;
}

function parseFault(payload) {
  const err = payload?.Fault?.Error?.[0] || payload?.error || payload;
  if (!err) return "QuickBooks returned an error.";
  if (typeof err === "string") return err;
  const message = err.Message || err.message || err.error || "QuickBooks returned an error.";
  const detail = err.Detail || err.detail || err.error_description;
  return detail ? `${message}: ${detail}` : String(message);
}

function escapeQbo(value) {
  return String(value || "").replace(/'/g, "''");
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function mapTaxCodes(codes = [], rates = []) {
  const rateById = Object.fromEntries(rates.map((row) => [String(row.Id), Number(row.RateValue) || 0]));
  return (codes || [])
    .filter((row) => row && row.Active !== false)
    .map((row) => {
      const sales = row.SalesTaxRateList?.TaxRateDetail || [];
      const purchases = row.PurchaseTaxRateList?.TaxRateDetail || [];
      const salesRate = sales.reduce((sum, item) => sum + (rateById[String(item.TaxRateRef?.value)] || 0), 0);
      const purchaseRate = purchases.reduce((sum, item) => sum + (rateById[String(item.TaxRateRef?.value)] || 0), 0);
      return {
        title: String(row.Name || "").trim(),
        rate: sales.length ? round2(salesRate) : round2(purchaseRate),
        invoices: sales.length > 0 || row.Taxable === true,
        purchases: purchases.length > 0,
        active: row.Active !== false,
        quickbooksId: String(row.Id || ""),
      };
    })
    .filter((row) => row.title);
}

function qboInvoiceBody(input) {
  const lines = (input.lines || []).map((line, idx) => {
    const qty = Number(line.quantity) > 0 ? Number(line.quantity) : 1;
    const amount = round2(line.amount);
    return {
      LineNum: idx + 1,
      Description: String(line.description || "Services").slice(0, 4000),
      Amount: amount,
      DetailType: "SalesItemLineDetail",
      SalesItemLineDetail: {
        ItemRef: { value: String(input.itemId) },
        Qty: qty,
        UnitPrice: round2(amount / qty),
      },
    };
  });
  const note = [input.poNumber ? `PO ${input.poNumber}` : "", input.privateNote || ""].filter(Boolean).join(". ").slice(0, 4000);
  const body = {
    DocNumber: String(input.number || "").slice(0, 21),
    TxnDate: input.txnDate,
    DueDate: input.dueDate,
    CustomerRef: { value: String(input.customerId) },
    Line: lines,
  };
  if (note) body.PrivateNote = note;
  if (input.memo) body.CustomerMemo = { value: String(input.memo).slice(0, 1000) };
  if (input.currency && input.currency !== "USD") body.CurrencyRef = { value: input.currency };
  return body;
}

async function tokenRequest(params) {
  const sent = await fetch(TOKEN, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  });
  const payload = await sent.json().catch(() => ({}));
  if (!sent.ok) throw new Error(parseFault(payload));
  return payload;
}

async function exchangeCode(req, code) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(req),
  });
  return tokenRequest(params);
}

async function refreshSession(session) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: session.refreshToken,
  });
  const payload = await tokenRequest(params);
  return {
    ...session,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || session.refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000 - 60_000,
  };
}

async function revokeToken(token) {
  if (!token) return;
  await fetch(REVOKE, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ token }),
  }).catch(() => undefined);
}

async function qbFetch(session, path, init = {}) {
  const url = path.startsWith("http") ? path : `${apiHost(session.environment)}/v3/company/${session.realmId}${path}${path.includes("?") ? "&" : "?"}minorversion=${MINOR}`;
  const sent = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const payload = await sent.json().catch(() => ({}));
  return { ok: sent.ok, status: sent.status, payload };
}

async function withSession(req, res) {
  let session = readSession(req);
  if (!session?.accessToken || !session?.realmId) return null;
  if (session.expiresAt && session.expiresAt < Date.now()) {
    session = await refreshSession(session);
    setSessionCookie(req, res, session);
  }
  return session;
}

async function qboGet(session, path) {
  let result = await qbFetch(session, path);
  if (result.status === 401) {
    session = await refreshSession(session);
    result = await qbFetch(session, path);
  }
  if (!result.ok) throw new Error(parseFault(result.payload));
  return { session, payload: result.payload };
}

async function qboPost(session, path, body) {
  let result = await qbFetch(session, path, { method: "POST", body: JSON.stringify(body) });
  if (result.status === 401) {
    session = await refreshSession(session);
    result = await qbFetch(session, path, { method: "POST", body: JSON.stringify(body) });
  }
  if (!result.ok) throw new Error(parseFault(result.payload));
  return { session, payload: result.payload };
}

async function qboQuery(session, statement) {
  const result = await qboGet(session, `/query?query=${encodeURIComponent(statement)}`);
  return { session: result.session, response: result.payload.QueryResponse || {} };
}

async function companyName(session) {
  const result = await qboGet(session, `/companyinfo/${session.realmId}`);
  return result.payload.CompanyInfo?.CompanyName || "QuickBooks company";
}

async function findOrCreateCustomer(session, payload) {
  const name = String(payload.companyName || payload.billToName || "Customer").slice(0, 100);
  const found = await qboQuery(session, `select * from Customer where DisplayName = '${escapeQbo(name)}' maxresults 1`);
  session = found.session;
  const existing = found.response.Customer?.[0];
  if (existing?.Id) return { session, id: String(existing.Id) };
  const body = {
    DisplayName: name,
    CompanyName: name,
  };
  if (payload.billToEmail) body.PrimaryEmailAddr = { Address: String(payload.billToEmail).slice(0, 100) };
  const line1 = payload.billToLines?.[0];
  if (line1) body.BillAddr = { Line1: line1 };
  const created = await qboPost(session, "/customer", body);
  const id = created.payload.Customer?.Id;
  if (!id) throw new Error("QuickBooks did not return a customer id.");
  return { session: created.session, id: String(id) };
}

async function findOrCreateItem(session) {
  let found = await qboQuery(session, "select * from Item where Name = 'Services' maxresults 1");
  session = found.session;
  let item = found.response.Item?.[0];
  if (!item?.Id) {
    found = await qboQuery(session, "select * from Item where Type = 'Service' maxresults 1");
    session = found.session;
    item = found.response.Item?.[0];
  }
  if (item?.Id) return { session, id: String(item.Id) };
  const accounts = await qboQuery(session, "select * from Account where AccountType = 'Income' maxresults 1");
  session = accounts.session;
  const account = accounts.response.Account?.[0];
  if (!account?.Id) throw new Error("QuickBooks needs an income account before DMC PMO can create invoices.");
  const created = await qboPost(session, "/item", {
    Name: "DMC Services",
    Type: "Service",
    IncomeAccountRef: { value: String(account.Id) },
  });
  const id = created.payload.Item?.Id;
  if (!id) throw new Error("QuickBooks did not return a service item.");
  return { session: created.session, id: String(id) };
}

async function createQboInvoice(session, payload) {
  const customer = await findOrCreateCustomer(session, payload);
  session = customer.session;
  const item = await findOrCreateItem(session);
  session = item.session;
  const body = qboInvoiceBody({
    ...payload,
    customerId: customer.id,
    itemId: item.id,
  });
  let created;
  try {
    created = await qboPost(session, "/invoice", body);
  } catch (err) {
    if (!/duplicate|docnumber/i.test(err instanceof Error ? err.message : "")) throw err;
    delete body.DocNumber;
    created = await qboPost(session, "/invoice", body);
  }
  const invoice = created.payload.Invoice;
  if (!invoice?.Id) throw new Error("QuickBooks did not return an invoice id.");
  return {
    session: created.session,
    id: String(invoice.Id),
    docNumber: String(invoice.DocNumber || payload.number || ""),
    href: invoiceHref(session.environment, invoice.Id),
  };
}

async function listTaxCodes(session) {
  const codes = await qboQuery(session, "select * from TaxCode maxresults 1000");
  session = codes.session;
  const rates = await qboQuery(session, "select * from TaxRate maxresults 1000");
  session = rates.session;
  return {
    session,
    codes: mapTaxCodes(codes.response.TaxCode || [], rates.response.TaxRate || []),
  };
}

module.exports = {
  COOKIE,
  OAUTH_COOKIE,
  configured,
  environment,
  apiHost,
  invoiceHref,
  origin,
  redirectUri,
  query,
  json,
  readBody,
  safeReturnTo,
  authorizeUrl,
  parseFault,
  escapeQbo,
  mapTaxCodes,
  qboInvoiceBody,
  exchangeCode,
  refreshSession,
  revokeToken,
  withSession,
  companyName,
  createQboInvoice,
  listTaxCodes,
  setSessionCookie,
  setOauthCookie,
  clearOauthCookie,
  clearSessionCookie,
  readOauth,
};
