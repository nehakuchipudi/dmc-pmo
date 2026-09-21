"use client";

import { useState, type FormEvent } from "react";
import { useAppStore } from "@/lib/store";

const INTERESTS = ["Portfolio", "Companies", "Project plan", "Team", "Insights", "Billing"];
const ROLES = ["PMO lead", "Project manager", "Delivery executive", "Finance", "Other"];
const STORAGE_KEY = "dmc-pmo-demo-requests";

export function DemoRequestForm() {
  const queueEmail = useAppStore((s) => s.queueEmail);
  const pushToast = useAppStore((s) => s.pushToast);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [interest, setInterest] = useState<string[]>(["Project plan"]);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  function toggleInterest(value: string) {
    setInterest((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !company.trim()) return;
    const request = {
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      role,
      interest,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };
    const prior = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown[];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([request, ...prior].slice(0, 20)));
    queueEmail(
      "hello@dillonmorgan.com",
      `Demo request from ${request.company}`,
      `${request.name} (${request.email}) wants a walkthrough. Role: ${request.role}. Modules: ${request.interest.join(", ") || "open"}. ${request.message}`,
    );
    pushToast("Demo request sent. We will follow up.");
    setDone(true);
  }

  if (done) {
    return (
      <div className="mkt-demo-success" role="status">
        <h3>You are on the list.</h3>
        <p>
          We will reach out at {email} to walk {company} through the same workspace you just watched.
        </p>
      </div>
    );
  }

  return (
    <form className="mkt-demo-form" onSubmit={onSubmit}>
      <div className="mkt-demo-grid">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </label>
        <label>
          Work email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Company
          <input value={company} onChange={(e) => setCompany(e.target.value)} required autoComplete="organization" />
        </label>
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <fieldset>
        <legend>What do you want to see?</legend>
        <div className="mkt-demo-chips">
          {INTERESTS.map((item) => (
            <label key={item} className={interest.includes(item) ? "is-on" : undefined}>
              <input type="checkbox" checked={interest.includes(item)} onChange={() => toggleInterest(item)} />
              {item}
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        Anything we should prepare?
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Portfolio size, current tool, or a project you want to walk" />
      </label>
      <button type="submit" className="mkt-cta">
        Request a demo
      </button>
    </form>
  );
}
