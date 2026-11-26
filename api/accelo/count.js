const { RESOURCES, countPage, json, queryValue, readSession } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return json(res, 405, { error: "GET only" });
  const session = readSession(req);
  if (!session?.accessToken) return json(res, 401, { error: "Connect Accelo before counting records." });
  const resource = queryValue(req, "resource");
  const page = Math.max(0, Number(queryValue(req, "page") || 0) || 0);
  if (!RESOURCES.has(resource)) return json(res, 400, { error: "Unknown Accelo record type." });
  try {
    const result = await countPage(session, resource, page);
    return json(res, 200, { resource, page, count: result.matched, done: result.done });
  } catch (err) {
    return json(res, 502, { error: err instanceof Error ? err.message : "Accelo could not be counted." });
  }
};
