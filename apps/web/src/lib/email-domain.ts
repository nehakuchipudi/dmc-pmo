import type { DnsRecord, EmailDomain, EmailDomainStatus } from "./types";

export const EMAIL_DOMAIN_KEY = "dmc-pmo-email-domains";
export const SEND_INCLUDE = "_spf.dmc-pmo.app";
export const DKIM_TARGET = "dmc._domainkey.dmc-pmo.app";

export function normalizeDomain(raw: string): string | undefined {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "")
    .replace(/\.$/, "");
  if (!/^[a-z0-9][a-z0-9.-]{1,80}\.[a-z]{2,24}$/.test(cleaned)) return undefined;
  if (cleaned.includes("..")) return undefined;
  return cleaned;
}

export function localPart(raw: string): string {
  const part = raw.trim().toLowerCase().replace(/[^a-z0-9._+-]/g, "") || "notifications";
  return part.slice(0, 40);
}

export function buildDnsRecords(domain: string): DnsRecord[] {
  return [
    {
      kind: "spf",
      type: "TXT",
      host: "@",
      name: domain,
      value: `v=spf1 include:${SEND_INCLUDE} ~all`,
      purpose: "Lists who may send mail as this domain.",
    },
    {
      kind: "dkim",
      type: "CNAME",
      host: "dmc._domainkey",
      name: `dmc._domainkey.${domain}`,
      value: DKIM_TARGET,
      purpose: "Signs each message so inboxes can prove it was not changed.",
    },
    {
      kind: "dmarc",
      type: "TXT",
      host: "_dmarc",
      name: `_dmarc.${domain}`,
      value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`,
      purpose: "Tells Gmail and Outlook what to do if SPF or DKIM fail.",
    },
  ];
}

export function domainStatus(records: DnsRecord[]): EmailDomainStatus {
  const hits = records.filter((row) => row.found).length;
  if (!records.length) return "Not checked";
  if (records.every((row) => row.found === undefined)) return "Not checked";
  if (hits === records.length) return "Verified";
  if (hits > 0) return "Partial";
  return "Missing";
}

export function defaultEmailDomains(): EmailDomain[] {
  const domain = "dillonmorgan.com";
  return [
    {
      id: "ed-dmc",
      domain,
      fromName: "DMC PMO",
      fromEmail: `notifications@${domain}`,
      primary: true,
      status: "Not checked",
      records: buildDnsRecords(domain),
    },
  ];
}

export function loadEmailDomains(): EmailDomain[] {
  if (typeof window === "undefined") return defaultEmailDomains();
  try {
    const raw = window.localStorage.getItem(EMAIL_DOMAIN_KEY);
    if (!raw) return defaultEmailDomains();
    const parsed = JSON.parse(raw) as EmailDomain[];
    if (!Array.isArray(parsed) || !parsed.length) return defaultEmailDomains();
    return parsed.map((row) => ({
      ...row,
      records: row.records?.length ? row.records : buildDnsRecords(row.domain),
    }));
  } catch {
    return defaultEmailDomains();
  }
}

export function persistEmailDomains(rows: EmailDomain[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EMAIL_DOMAIN_KEY, JSON.stringify(rows));
}

function unwrapTxt(value: string) {
  return value.replace(/^"+|"+$/g, "").replace(/"\s*"/g, "");
}

async function dnsLookup(name: string, type: "TXT" | "CNAME"): Promise<string[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { Accept: "application/dns-json" } });
  if (!res.ok) throw new Error("DNS lookup failed");
  const data = (await res.json()) as { Answer?: { data?: string }[] };
  return (data.Answer ?? []).map((row) => unwrapTxt(String(row.data ?? ""))).filter(Boolean);
}

export function recordMatches(record: DnsRecord, answers: string[]): boolean {
  const hay = answers.join(" ").toLowerCase();
  if (!hay) return false;
  if (record.kind === "spf") return hay.includes("v=spf1");
  if (record.kind === "dmarc") return hay.includes("v=dmarc1");
  return hay.includes(record.value.toLowerCase()) || hay.includes("domainkey");
}

export async function inspectDnsRecords(records: DnsRecord[]): Promise<DnsRecord[]> {
  const next: DnsRecord[] = [];
  for (const record of records) {
    try {
      const answers = await dnsLookup(record.name, record.type);
      const extra = record.type === "CNAME" && !answers.length ? await dnsLookup(record.name, "TXT") : [];
      const foundValues = [...answers, ...extra];
      next.push({
        ...record,
        found: recordMatches(record, foundValues),
        foundValue: foundValues[0],
      });
    } catch {
      next.push({ ...record, found: false, foundValue: undefined });
    }
  }
  return next;
}
