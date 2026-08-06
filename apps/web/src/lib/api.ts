import type { Company, CreateCompanyInput } from "@dmc/shared";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000";

export async function getCompanies(): Promise<Company[]> {
  const res = await fetch(`${API_URL}/companies`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load companies (${res.status})`);
  }
  return (await res.json()) as Company[];
}

export async function createCompany(
  input: CreateCompanyInput,
): Promise<{ ok: true; company: Company } | { ok: false; message: string }> {
  const res = await fetch(`${API_URL}/companies`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  if (res.status === 201) {
    return { ok: true, company: (await res.json()) as Company };
  }

  let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (body?.message) {
      message = typeof body.message === "string" ? body.message : JSON.stringify(body.message);
    }
  } catch {
    // ignore parse errors
  }
  return { ok: false, message };
}
