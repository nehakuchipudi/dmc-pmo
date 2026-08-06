"use server";

import { revalidatePath } from "next/cache";
import { CompanyStatus, createCompanySchema } from "@dmc/shared";
import { createCompany } from "@/lib/api";

export type CreateCompanyState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function createCompanyAction(
  _prevState: CreateCompanyState,
  formData: FormData,
): Promise<CreateCompanyState> {
  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    status: String(formData.get("status") ?? CompanyStatus.Active),
    accountManager: String(formData.get("accountManager") ?? "").trim() || undefined,
    website: String(formData.get("website") ?? "").trim() || undefined,
  };

  const parsed = createCompanySchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return {
      status: "error",
      message: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input",
    };
  }

  const result = await createCompany(parsed.data);
  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/app/companies");
  return {
    status: "success",
    message: `Created ${result.company.name}.`,
  };
}
