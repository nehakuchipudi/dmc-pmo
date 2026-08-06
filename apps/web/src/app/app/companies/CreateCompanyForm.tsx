"use client";

import { useActionState } from "react";
import { CompanyStatus } from "@dmc/shared";
import { createCompanyAction, type CreateCompanyState } from "./actions";

const initialState: CreateCompanyState = { status: "idle", message: "" };

const statusOptions: { value: CompanyStatus; label: string }[] = [
  { value: CompanyStatus.Active, label: "Active" },
  { value: CompanyStatus.Prospect, label: "Prospect" },
  { value: CompanyStatus.OnHold, label: "On hold" },
  { value: CompanyStatus.Archived, label: "Archived" },
];

export function CreateCompanyForm() {
  const [state, formAction, pending] = useActionState(
    createCompanyAction,
    initialState,
  );

  return (
    <section className="panel">
      <h2>New company</h2>
      {state.status === "error" ? (
        <div className="notice error">{state.message}</div>
      ) : null}
      {state.status === "success" ? (
        <div className="notice success">{state.message}</div>
      ) : null}
      <form action={formAction}>
        <div className="form-row">
          <div className="field">
            <label htmlFor="name">Company name</label>
            <input id="name" name="name" required placeholder="Acme Advisory" />
          </div>
          <div className="field">
            <label htmlFor="accountManager">Account manager</label>
            <input
              id="accountManager"
              name="accountManager"
              placeholder="Dana Whitfield"
            />
          </div>
          <div className="field">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="url"
              placeholder="https://acme.example.com"
            />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={CompanyStatus.Active}>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Saving..." : "Create company"}
          </button>
        </div>
      </form>
    </section>
  );
}
