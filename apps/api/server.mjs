import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { DefaultAzureCredential } from "@azure/identity";
import { createRemoteJWKSet, jwtVerify } from "jose";
import pg from "pg";

const PORT = Number(process.env.PORT || 8080);
const STATIC_DIR = resolve(process.env.STATIC_DIR || join(process.cwd(), "public"));
const WORKSPACE_ID = "default";
const ENTRA_CLIENT_ID = (process.env.ENTRA_CLIENT_ID || "").trim();
const ENTRA_TENANT_ID = (process.env.ENTRA_TENANT_ID || "common").trim() || "common";

let pool = null;
let poolReady = false;
let lastPoolError = "";

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function postgresPassword() {
  if ((process.env.DATABASE_AUTH || "").toLowerCase() === "entra") {
    const credential = new DefaultAzureCredential({
      managedIdentityClientId: process.env.AZURE_CLIENT_ID,
    });
    const token = await credential.getToken("https://ossrdbms-aad.database.windows.net/.default");
    return token.token;
  }
  return process.env.DATABASE_PASSWORD;
}

async function getPool() {
  if (!process.env.DATABASE_HOST) return null;
  if (pool && poolReady) return pool;
  const password = await postgresPassword();
  pool = new pg.Pool({
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME || "dmcpmo",
    user: process.env.DATABASE_USER || "dmcadmin",
    password,
    port: Number(process.env.DATABASE_PORT || 5432),
    ssl: process.env.DATABASE_SSL === "disable" ? false : { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 15000,
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workspace_snapshots (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      updated_by text
    )
  `);
  poolReady = true;
  lastPoolError = "";
  return pool;
}

async function ensurePool() {
  try {
    return await getPool();
  } catch (error) {
    pool = null;
    poolReady = false;
    lastPoolError = error instanceof Error ? error.message : String(error);
    console.error("PostgreSQL is not ready:", lastPoolError);
    return null;
  }
}

function jwksUrl() {
  return new URL(`https://login.microsoftonline.com/${ENTRA_TENANT_ID}/discovery/v2.0/keys`);
}

const jwks = ENTRA_CLIENT_ID ? createRemoteJWKSet(jwksUrl()) : null;

async function caller(req) {
  if (!ENTRA_CLIENT_ID) return { ok: true, email: "local-dev", oid: "" };
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return { ok: false, status: 401, error: "Sign in with Microsoft Entra ID." };
  try {
    const { payload } = await jwtVerify(header.slice(7), jwks, {
      audience: ENTRA_CLIENT_ID,
    });
    const issuer = String(payload.iss || "");
    if (!issuer.includes("login.microsoftonline.com")) {
      return { ok: false, status: 401, error: "Token issuer is not Microsoft Entra ID." };
    }
    return {
      ok: true,
      email: String(payload.preferred_username || payload.email || payload.upn || ""),
      oid: String(payload.oid || payload.sub || ""),
    };
  } catch (error) {
    return { ok: false, status: 401, error: error instanceof Error ? error.message : "Invalid Entra token." };
  }
}

function contentType(file) {
  switch (extname(file)) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".ico":
      return "image/x-icon";
    case ".woff2":
      return "font/woff2";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function sendFile(res, file) {
  const stat = statSync(file);
  res.writeHead(200, {
    "Content-Type": contentType(file),
    "Content-Length": stat.size,
  });
  createReadStream(file).pipe(res);
}

function tryStatic(urlPath) {
  const cleaned = decodeURIComponent(urlPath.split("?")[0] || "/");
  const relative = cleaned === "/" ? "index.html" : cleaned.replace(/^\/+/, "");
  const candidates = [
    join(STATIC_DIR, relative),
    join(STATIC_DIR, relative, "index.html"),
    join(STATIC_DIR, `${relative}.html`),
  ];
  for (const file of candidates) {
    const resolved = normalize(file);
    if (!resolved.startsWith(STATIC_DIR)) continue;
    if (existsSync(resolved) && statSync(resolved).isFile()) return resolved;
  }
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const path = url.pathname;

  try {
    if (path === "/healthz" || path === "/api/health") {
      const db = await ensurePool();
      json(res, 200, {
        ok: true,
        service: "dmc-pmo",
        database: Boolean(db),
        entra: Boolean(ENTRA_CLIENT_ID),
        error: db ? undefined : lastPoolError || undefined,
      });
      return;
    }

    if (path === "/config.json") {
      json(res, 200, {
        apiUrl: "",
        entraClientId: ENTRA_CLIENT_ID,
        entraTenantId: ENTRA_TENANT_ID,
        entraAuthority: (process.env.ENTRA_AUTHORITY || "").trim(),
        database: Boolean(process.env.DATABASE_HOST),
      });
      return;
    }

    if (path === "/api/workspace" && req.method === "GET") {
      const auth = await caller(req);
      if (!auth.ok) {
        json(res, auth.status || 401, { error: auth.error });
        return;
      }
      const db = await ensurePool();
      if (!db) {
        json(res, 503, { error: "Azure Database is not connected.", detail: lastPoolError });
        return;
      }
      const result = await db.query("SELECT payload, updated_at, updated_by FROM workspace_snapshots WHERE id = $1", [
        WORKSPACE_ID,
      ]);
      json(res, 200, {
        snapshot: result.rows[0]?.payload ?? null,
        updatedAt: result.rows[0]?.updated_at ?? null,
        updatedBy: result.rows[0]?.updated_by ?? null,
      });
      return;
    }

    if (path === "/api/workspace" && req.method === "PUT") {
      const auth = await caller(req);
      if (!auth.ok) {
        json(res, auth.status || 401, { error: auth.error });
        return;
      }
      const db = await ensurePool();
      if (!db) {
        json(res, 503, { error: "Azure Database is not connected.", detail: lastPoolError });
        return;
      }
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const snapshot = body.snapshot ?? body;
      if (!snapshot || typeof snapshot !== "object" || !snapshot.data) {
        json(res, 400, { error: "Workspace snapshot data is required." });
        return;
      }
      await db.query(
        `INSERT INTO workspace_snapshots (id, payload, updated_at, updated_by)
         VALUES ($1, $2::jsonb, now(), $3)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now(), updated_by = EXCLUDED.updated_by`,
        [WORKSPACE_ID, JSON.stringify(snapshot), auth.email || auth.oid || "unknown"],
      );
      json(res, 200, { ok: true });
      return;
    }

    if (path.startsWith("/api/")) {
      json(res, 404, { error: "Not found." });
      return;
    }

    const file = tryStatic(path);
    if (file) {
      sendFile(res, file);
      return;
    }
    const fallback = join(STATIC_DIR, "index.html");
    if (existsSync(fallback)) {
      sendFile(res, fallback);
      return;
    }
    json(res, 404, { error: "Not found." });
  } catch (error) {
    console.error(error);
    json(res, 500, { error: error instanceof Error ? error.message : "Server error." });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`DMC PMO listening on ${PORT}`);
  void ensurePool();
});
