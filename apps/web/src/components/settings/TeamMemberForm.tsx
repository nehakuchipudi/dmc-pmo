"use client";

import { Field, TextInput, TextSelect } from "@/components/ui";
import { roleLabel } from "@/lib/auth";
import { USER_ROLES } from "@/lib/rbac";
import type { FinancialVisibility, Role, TeamMember } from "@/lib/types";

export { USER_ROLES };
export const DEPARTMENTS = ["Delivery", "PMO", "Finance", "Leadership", "Operations"];
export const TIMEZONES = [
  "America/Chicago",
  "America/New_York",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "UTC",
];

export type TeamMemberFormValue = {
  firstName: string;
  lastName: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  mobile: string;
  department: string;
  managerId: string;
  skills: string;
  timezone: string;
  startDate: string;
  billRate?: number;
  costRate?: number;
  financialVisibility: FinancialVisibility;
  role: Role;
  username: string;
  active: boolean;
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function valuesFromMember(member?: TeamMember): Partial<TeamMemberFormValue> {
  if (!member) return {};
  const split = splitName(member.name);
  return {
    firstName: member.firstName ?? split.firstName,
    lastName: member.lastName ?? split.lastName,
    title: member.title ?? "",
    email: member.email,
    phone: member.phone ?? "",
    mobile: member.mobile ?? "",
    department: member.department ?? "",
    managerId: member.managerId ?? "",
    skills: member.skills ?? "",
    timezone: member.timezone ?? "America/Chicago",
    startDate: member.startDate ?? "",
    billRate: member.billRate,
    costRate: member.costRate,
    financialVisibility: member.financialVisibility ?? "hours",
    role: member.role,
    username: member.username ?? member.email.split("@")[0],
    active: member.active,
  };
}

export function readTeamMemberForm(form: HTMLFormElement): TeamMemberFormValue {
  const data = new FormData(form);
  const firstName = String(data.get("firstName") ?? "").trim();
  const lastName = String(data.get("lastName") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const username = String(data.get("username") ?? "").trim() || email.split("@")[0];
  const billRaw = String(data.get("billRate") ?? "").trim();
  const costRaw = String(data.get("costRate") ?? "").trim();
  return {
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(" ") || email,
    title: String(data.get("title") ?? "").trim(),
    email,
    phone: String(data.get("phone") ?? "").trim(),
    mobile: String(data.get("mobile") ?? "").trim(),
    department: String(data.get("department") ?? "").trim(),
    managerId: String(data.get("managerId") ?? "").trim(),
    skills: String(data.get("skills") ?? "").trim(),
    timezone: String(data.get("timezone") ?? "America/Chicago"),
    startDate: String(data.get("startDate") ?? "").trim(),
    billRate: billRaw ? Number(billRaw) : undefined,
    costRate: costRaw ? Number(costRaw) : undefined,
    financialVisibility: (String(data.get("financialVisibility") || "hours") as FinancialVisibility),
    role: String(data.get("role") || "staff") as Role,
    username,
    active: String(data.get("status") || "active") === "active",
  };
}

export function TeamMemberForm({
  member,
  team,
  submitLabel,
}: {
  member?: TeamMember;
  team: TeamMember[];
  submitLabel: string;
}) {
  const initial = valuesFromMember(member);
  const managers = team.filter((item) => item.id !== member?.id && item.active);

  return (
    <div className="user-create">
      <section className="user-create-section">
        <h3>Profile</h3>
        <div className="user-create-grid">
          <Field label="First name" required>
            <TextInput name="firstName" defaultValue={initial.firstName} required />
          </Field>
          <Field label="Last name" required>
            <TextInput name="lastName" defaultValue={initial.lastName} required />
          </Field>
          <Field label="Title">
            <TextInput name="title" defaultValue={initial.title} placeholder="Project manager" />
          </Field>
          <Field label="Work email" required>
            <TextInput name="email" type="email" defaultValue={initial.email} required />
          </Field>
          <Field label="Phone">
            <TextInput name="phone" type="tel" defaultValue={initial.phone} />
          </Field>
          <Field label="Mobile">
            <TextInput name="mobile" type="tel" defaultValue={initial.mobile} />
          </Field>
        </div>
      </section>

      <section className="user-create-section">
        <h3>Organization</h3>
        <div className="user-create-grid">
          <Field label="Department">
            <TextSelect name="department" defaultValue={initial.department ?? ""}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Reports to">
            <TextSelect name="managerId" defaultValue={initial.managerId ?? ""}>
              <option value="">No manager</option>
              {managers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Skills">
            <TextInput name="skills" defaultValue={initial.skills} placeholder="PMO, planning, SAP" />
          </Field>
          <Field label="Timezone">
            <TextSelect name="timezone" defaultValue={initial.timezone ?? "America/Chicago"}>
              {TIMEZONES.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Start date">
            <TextInput name="startDate" type="date" defaultValue={initial.startDate} />
          </Field>
        </div>
      </section>

      <section className="user-create-section">
        <h3>Rates and finance</h3>
        <p className="user-create-note">
          Default rates apply to new time on this person. They do not rewrite hours already approved.
        </p>
        <div className="user-create-grid">
          <Field label="Billable rate">
            <TextInput name="billRate" type="number" min="0" step="1" defaultValue={initial.billRate ?? ""} placeholder="185" />
          </Field>
          <Field label="Cost rate">
            <TextInput name="costRate" type="number" min="0" step="1" defaultValue={initial.costRate ?? ""} placeholder="65" />
          </Field>
          <Field label="Financial visibility">
            <TextSelect name="financialVisibility" defaultValue={initial.financialVisibility ?? "hours"}>
              <option value="hours">Hours only</option>
              <option value="rates_and_budgets">Hours, rates, and budgets</option>
            </TextSelect>
          </Field>
        </div>
      </section>

      <section className="user-create-section">
        <h3>Access</h3>
        <div className="user-create-grid">
          <Field label="Role" required>
            <TextSelect name="role" defaultValue={initial.role ?? "staff"}>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Username">
            <TextInput name="username" defaultValue={initial.username} placeholder="jkim" />
          </Field>
          <Field label="Status">
            <TextSelect name="status" defaultValue={initial.active === false ? "inactive" : "active"}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </TextSelect>
          </Field>
        </div>
        <p className="user-create-note">
          They sign in with Microsoft Entra ID using this email. New people can also create an account from Sign up.
        </p>
      </section>

      <div className="user-create-actions">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
