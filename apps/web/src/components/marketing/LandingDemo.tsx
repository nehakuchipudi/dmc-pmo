"use client";

import { FormEvent, useMemo, useState } from "react";

const STORAGE_KEY = "dmc-pmo-demo-requests";

const HEARD_ABOUT = [
  "Colleague or referral",
  "Search",
  "Event or webinar",
  "Already a DMC client",
  "Partner",
  "Other",
] as const;

type DemoRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  heard: string;
  message: string;
  createdAt: string;
};

function readRequests(): DemoRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRequest(entry: DemoRequest) {
  const next = [entry, ...readRequests()].slice(0, 25);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function LandingDemo() {
  const [sent, setSent] = useState<DemoRequest | null>(null);
  const [error, setError] = useState("");
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const role = String(data.get("role") ?? "").trim();
    const heard = String(data.get("heard") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name || !email || !company) {
      setError("Add your name, work email, and company so we can prepare the walkthrough.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Use a work email we can reply to.");
      return;
    }

    const entry: DemoRequest = {
      id: `demo-${Date.now()}`,
      name,
      email,
      phone,
      company,
      role,
      heard,
      message,
      createdAt: new Date().toISOString(),
    };
    saveRequest(entry);
    setError("");
    setSent(entry);
    event.currentTarget.reset();
  }

  return (
    <section className="mkt-band mkt-band-demo" id="demo">
      <div className="mkt-demo">
        <div className="mkt-demo-copy">
          <p className="mkt-kicker">Request a demo</p>
          <h2>See it with your own book of work.</h2>
          <p className="mkt-lead">
            Tell us the company and what you want to walk through. Same form for demos, questions, and contact.
          </p>
          <ul className="mkt-demo-points">
            <li>Live portfolio, projects, and plans</li>
            <li>Capacity, risk, and the weekly brief</li>
            <li>Prepared around the boards you name</li>
          </ul>
        </div>
        <form className="mkt-demo-card" onSubmit={onSubmit} noValidate>
          {sent ? (
            <div className="mkt-demo-success" role="status">
              <strong>Request saved for {sent.company}.</strong>
              <p>
                Thanks {sent.name}. We have {sent.email} and will use your note to prepare the walkthrough.
              </p>
              <button type="button" className="mkt-text-link" onClick={() => setSent(null)}>
                Send another request
              </button>
            </div>
          ) : null}
          <div className="mkt-demo-grid">
            <label>
              Full name
              <input name="name" type="text" autoComplete="name" required placeholder="Alex Morgan" />
            </label>
            <label>
              Work email
              <input name="email" type="email" autoComplete="email" required placeholder="alex@company.com" />
            </label>
            <label>
              Phone <span>(optional)</span>
              <input name="phone" type="tel" autoComplete="tel" placeholder="+1 555 0100" />
            </label>
            <label>
              Company / organization
              <input name="company" type="text" autoComplete="organization" required placeholder="Northwind PMO" />
            </label>
            <label>
              Role / title <span>(optional)</span>
              <input name="role" type="text" autoComplete="organization-title" placeholder="PMO lead" />
            </label>
            <label>
              How did you hear about us?
              <select name="heard" defaultValue="">
                <option value="">Select one</option>
                {HEARD_ABOUT.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mkt-demo-message">
            Message
            <textarea
              name="message"
              rows={4}
              placeholder="Cycle, portfolio, or a specific board you want to see"
            />
          </label>
          {error ? <p className="mkt-demo-error">{error}</p> : null}
          <button type="submit" className="mkt-cta">
            Request a demo
          </button>
          <p className="mkt-demo-note">
            Same form for demos, questions, and contact. Email is not sent from this host. Requests stay in this
            browser, dated {today}.
          </p>
        </form>
      </div>
    </section>
  );
}
