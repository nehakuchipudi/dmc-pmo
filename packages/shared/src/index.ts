import { z } from "zod";

/**
 * Internal and external roles from the product master plan (section 3).
 * Permission checks in the API and web app should reference these values,
 * never string literals.
 */
export enum Role {
  Admin = "ADMIN",
  ProjectManager = "PM_AM",
  Staff = "STAFF",
  Finance = "FINANCE",
  Leadership = "LEADERSHIP",
  ClientContact = "CLIENT_CONTACT",
}

export const INTERNAL_ROLES: Role[] = [
  Role.Admin,
  Role.ProjectManager,
  Role.Staff,
  Role.Finance,
  Role.Leadership,
];

/** Company lifecycle status used for the status pill in the UI. */
export enum CompanyStatus {
  Active = "ACTIVE",
  Prospect = "PROSPECT",
  OnHold = "ON_HOLD",
  Archived = "ARCHIVED",
}

/**
 * Product rule 1: no em dashes or en dashes as rhetorical separators in any
 * user-facing copy. This guard is shared so the API, web, and future CI string
 * lint all enforce the same rule.
 */
const EM_OR_EN_DASH = /[\u2014\u2013]/;

export function containsForbiddenDash(value: string): boolean {
  return EM_OR_EN_DASH.test(value);
}

const noForbiddenDash = (label: string, max: number) =>
  z
    .string()
    .max(max)
    .refine((v) => !containsForbiddenDash(v), {
      message: `${label} must not contain em dashes or en dashes`,
    });

export const companyStatusSchema = z.nativeEnum(CompanyStatus);

/** Payload accepted when creating a company. */
export const createCompanySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(200)
    .refine((v) => !containsForbiddenDash(v), {
      message: "name must not contain em dashes or en dashes",
    }),
  status: companyStatusSchema.default(CompanyStatus.Active),
  accountManager: noForbiddenDash("accountManager", 120).optional(),
  website: z.string().url().max(200).optional(),
  notes: noForbiddenDash("notes", 2000).optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

/** A company as returned by the API to internal clients. */
export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  accountManager: string | null;
  website: string | null;
  notes: string | null;
  openProjects: number;
  openTickets: number;
  createdAt: string;
  updatedAt: string;
}

export const HEALTH_OK = "ok" as const;

export interface HealthResponse {
  status: typeof HEALTH_OK;
  service: string;
  timestamp: string;
}
