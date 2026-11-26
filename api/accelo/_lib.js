const crypto = require("crypto");

const COOKIE = "dmc_accelo";
const DEPLOYMENT = (process.env.ACCELO_DEPLOYMENT || "dillon-morgan-consulting").trim();
const CLIENT_ID = (process.env.ACCELO_CLIENT_ID || "6e410b11e1@dillon-morgan-consulting.accelo.com").trim();
const PAGE_SIZE = 100;

function apiBase() {
  return `https://${DEPLOYMENT}.api.accelo.com/api/v0`;
}

function tokenUrl() {
  return `https://${DEPLOYMENT}.api.accelo.com/oauth2/v0/token`;
}

function origin(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "dmc-pmo.vercel.app").split(",")[0].trim();
  return `${proto}://${host}`;
}

function json(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  return res.status(status).json(body);
}

function queryValue(req, key) {
  if (req.query && req.query[key] != null) return String(req.query[key]);
  try {
    return new URL(req.url || "/", "https://dmc-pmo.vercel.app").searchParams.get(key) || "";
  } catch {
    return "";
  }
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

function keyBuf() {
  return crypto.scryptSync(CLIENT_ID, "dmc-accelo", 32);
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
    const jsonText = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function readCookies(req) {
  const header = String(req.headers.cookie || "");
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    try {
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    }
  }
  return out;
}

function cookieHeader(req, value, maxAge) {
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const parts = [`${COOKIE}=${encodeURIComponent(value)}`, "Path=/api/accelo", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (proto === "https") parts.push("Secure");
  return parts.join("; ");
}

function setSessionCookie(req, res, session) {
  res.setHeader("Set-Cookie", cookieHeader(req, seal(session), 60 * 60 * 8));
}

function readSession(req) {
  return open(readCookies(req)[COOKIE]);
}

function acceloError(payload) {
  return payload?.error_description || payload?.error || payload?.meta?.message || "Accelo refused the request.";
}

function rowsOf(payload, resource) {
  const response = payload?.response;
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response[resource])) return response[resource];
  if (Array.isArray(payload?.[resource])) return payload[resource];
  return [];
}

function acceloDate(value) {
  if (value == null || value === "" || value === "0" || value === 0) return "";
  const n = Number(value);
  if (Number.isFinite(n) && n > 1000000000) return new Date(n * 1000).toISOString().slice(0, 10);
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : "";
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function personName(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return [value.firstname, value.surname].filter(Boolean).join(" ").trim() || value.name || value.email || "";
}

function against(row) {
  const nested = row?.against && typeof row.against === "object" ? row.against : null;
  return {
    type: String(row?.against_type || nested?.type || "").toLowerCase(),
    id: String(row?.against_id || nested?.id || ""),
    name: typeof row?.against === "string" ? row.against : nested?.name || nested?.title || "",
  };
}

function companyStatus(row) {
  const text = String(row?.standing || "").toLowerCase();
  if (text.includes("prospect") || text.includes("interest")) return "Prospect";
  return "Active";
}

function projectStatus(row) {
  const text = `${row?.status?.title || ""} ${row?.status?.standing || ""} ${typeof row?.status === "string" ? row.status : ""} ${row?.standing || ""}`.toLowerCase();
  if (text.includes("complete")) return "Completed";
  if (text.includes("cancel") || text.includes("inactive")) return "Cancelled";
  if (text.includes("hold") || text.includes("pause")) return "On Hold";
  if (text.includes("plan") || text.includes("pending")) return "Planning";
  if (text.includes("draft")) return "Draft";
  return "Active";
}

function invoiceStatus(row) {
  const standing = String(row?.standing || (typeof row?.status === "string" ? row.status : row?.status?.title) || "").toLowerCase();
  const amount = money(row?.amount ?? row?.total ?? row?.total_amount);
  const outstanding = money(row?.outstanding ?? row?.balance ?? amount);
  const due = acceloDate(row?.date_due || row?.due_date || row?.due);
  const today = new Date().toISOString().slice(0, 10);
  if (standing.includes("draft")) return "Draft";
  if (standing.includes("paid") || (amount > 0 && outstanding <= 0)) return "Paid";
  if (standing.includes("overdue") || (due && due < today && outstanding > 0)) return "Overdue";
  return "Sent";
}

function hoursFromActivity(row) {
  const seconds = (Number(row?.billable) || 0) + (Number(row?.nonbillable) || 0);
  return Math.round((seconds / 3600) * 100) / 100;
}

function mapCompany(row) {
  const id = String(row?.id || "");
  if (!id) return null;
  return {
    id: `accelo-co-${id}`,
    name: String(row.name || row.title || "Untitled company").trim(),
    website: String(row.website || ""),
    phone: String(row.phone || ""),
    notes: String(row.comments || row.notes || ""),
    status: companyStatus(row),
  };
}

function mapStaff(row) {
  const id = String(row?.id || "");
  const name = personName(row);
  if (!id || !name) return null;
  return {
    id: `accelo-staff-${id}`,
    name,
    email: String(row.email || ""),
    title: String(row.position || row.title || ""),
    active: String(row.standing || "active").toLowerCase() !== "inactive",
  };
}

function mapContact(row) {
  const id = String(row?.id || "");
  const name = personName(row);
  if (!id || !name) return null;
  const companyRaw = row.company && typeof row.company === "object" ? row.company.id : row.company;
  return {
    id: `accelo-ct-${id}`,
    name,
    email: String(row.email || ""),
    phone: String(row.phone || ""),
    mobile: String(row.mobile || ""),
    title: String(row.position || row.title || ""),
    companyId: companyRaw ? `accelo-co-${companyRaw}` : "",
  };
}

function mapAffiliation(row) {
  const contactRaw = row?.contact && typeof row.contact === "object" ? row.contact.id : row?.contact;
  const companyRaw = row?.company && typeof row.company === "object" ? row.company.id : row?.company;
  if (!contactRaw || !companyRaw) return null;
  return {
    contactId: `accelo-ct-${contactRaw}`,
    companyId: `accelo-co-${companyRaw}`,
    email: String(row.email || ""),
    phone: String(row.phone || row.mobile || ""),
    title: String(row.position || ""),
  };
}

function mapJob(row) {
  const id = String(row?.id || "");
  if (!id) return null;
  const link = against(row);
  const manager = personName(row.manager) || String(row.manager_name || "");
  return {
    id: `accelo-job-${id}`,
    name: String(row.title || row.name || "Untitled project").trim(),
    companyId: link.type.includes("company") && link.id ? `accelo-co-${link.id}` : link.id && !link.type ? `accelo-co-${link.id}` : "",
    companyName: link.name,
    manager,
    status: projectStatus(row),
    start: acceloDate(row.date_started || row.date_start || row.started),
    due: acceloDate(row.date_due || row.due),
    description: String(row.description || row.comments || ""),
  };
}

function mapInvoice(row) {
  const id = String(row?.id || "");
  if (!id) return null;
  const link = against(row);
  const amount = money(row.amount ?? row.total ?? row.total_amount);
  const outstanding = money(row.outstanding ?? row.balance ?? amount);
  return {
    id: `accelo-inv-${id}`,
    number: String(row.invoice_number || row.number || id),
    title: String(row.subject || row.title || `Invoice ${row.invoice_number || id}`),
    companyId: link.id ? `accelo-co-${link.id}` : "",
    companyName: link.name,
    amount,
    outstanding,
    raised: acceloDate(row.date_raised || row.raised || row.date_created),
    due: acceloDate(row.date_due || row.due_date || row.due),
    status: invoiceStatus(row),
  };
}

function mapIssue(row) {
  const id = String(row?.id || "");
  if (!id) return null;
  const link = against(row);
  const priorityText = String(row.priority?.title || row.priority || "").toLowerCase();
  let priority = "Medium";
  if (priorityText.includes("urgent") || priorityText === "1") priority = "Urgent";
  else if (priorityText.includes("high") || priorityText === "2") priority = "High";
  else if (priorityText.includes("low") || priorityText === "4" || priorityText === "5") priority = "Low";
  const standing = String(row.standing || row.status?.standing || row.status?.title || "").toLowerCase();
  let status = "Open";
  if (standing.includes("resolve") || standing.includes("closed") || standing.includes("complete")) status = "Resolved";
  else if (standing.includes("progress")) status = "In Progress";
  return {
    id: `accelo-issue-${id}`,
    number: Number(id) || 0,
    subject: String(row.subject || row.title || "Ticket"),
    companyId: link.id ? `accelo-co-${link.id}` : "",
    companyName: link.name,
    priority,
    assignee: personName(row.assignee) || personName(row.staff) || "Unassigned",
    status,
    submitted: acceloDate(row.date_submitted || row.date_created || row.submitted),
  };
}

function mapActivity(row) {
  const hours = hoursFromActivity(row);
  if (hours <= 0) return null;
  const id = String(row?.id || "");
  if (!id) return null;
  const link = against(row);
  const projectId = link.type.includes("job") && link.id ? `accelo-job-${link.id}` : "";
  return {
    id: `accelo-time-${id}`,
    staffId: String(row.staff?.id || row.staff || ""),
    userName: personName(row.staff) || personName(row.owner) || "",
    projectId,
    projectName: link.type.includes("job") ? link.name : "",
    date: acceloDate(row.date_started || row.date_logged || row.date_created),
    hours,
    billable: (Number(row.billable) || 0) > 0,
    note: String(row.subject || row.body || "Accelo time").slice(0, 500),
  };
}

const MAPPERS = {
  companies: mapCompany,
  staff: mapStaff,
  contacts: mapContact,
  affiliations: mapAffiliation,
  jobs: mapJob,
  invoices: mapInvoice,
  issues: mapIssue,
  activities: mapActivity,
};

const RESOURCES = new Set(Object.keys(MAPPERS));

async function fetchToken(secret) {
  const sent = await fetch(tokenUrl(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials&scope=read(all)",
  });
  const payload = await sent.json().catch(() => ({}));
  if (!sent.ok || !payload.access_token) throw new Error(acceloError(payload));
  return payload;
}

async function acceloGet(session, resource, page) {
  const url = `${apiBase()}/${resource}?_limit=${PAGE_SIZE}&_page=${page}`;
  const sent = await fetch(url, { headers: { Authorization: `Bearer ${session.accessToken}`, Accept: "application/json" } });
  const payload = await sent.json().catch(() => ({}));
  if (sent.status === 401) throw new Error("Accelo session expired. Enter the client secret again.");
  if (!sent.ok || payload?.meta?.status === "error") throw new Error(acceloError(payload));
  return rowsOf(payload, resource);
}

async function countPage(session, resource, page) {
  const rows = await acceloGet(session, resource, page);
  const matched = resource === "activities" ? rows.filter((row) => hoursFromActivity(row) > 0).length : rows.length;
  return { matched, done: rows.length < PAGE_SIZE, pageSize: rows.length };
}

function mapPage(resource, rows) {
  const map = MAPPERS[resource];
  return rows.map(map).filter(Boolean);
}

module.exports = {
  DEPLOYMENT,
  CLIENT_ID,
  RESOURCES,
  json,
  queryValue,
  readBody,
  setSessionCookie,
  readSession,
  fetchToken,
  countPage,
  mapPage,
  acceloGet,
  acceloDate,
  hoursFromActivity,
  mapCompany,
  mapStaff,
  mapContact,
  mapAffiliation,
  mapJob,
  mapInvoice,
  mapIssue,
  mapActivity,
};
