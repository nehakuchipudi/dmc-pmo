"use client";

import { useState } from "react";
import { Briefcase, Check, ClipboardCheck, Layers3 } from "lucide-react";
import { clsx } from "clsx";

const PACKS = [
  {
    id: "project_management",
    icon: Layers3,
    label: "Project management",
    promise: "Keep the client, ideas, and reports on the office book of work.",
    turnsOn: ["Companies and contacts", "Ideas before they are projects", "Reports and analytics"],
  },
  {
    id: "project_delivery",
    icon: Briefcase,
    label: "Project delivery",
    promise: "Run the live jobs: plan, people, time, retainers, and billing.",
    turnsOn: ["Projects, work, and tickets", "Timesheets and resources", "Retainers, quotes, and invoices"],
  },
  {
    id: "service_operations",
    icon: ClipboardCheck,
    label: "Service operations",
    promise: "Dispatch field work without a second PMO tool.",
    turnsOn: ["Work journey and work orders", "Recurring service and schedule", "Crew, approvals, and the employee clock"],
  },
] as const;

const SPINE = ["Companies", "Projects", "Field work", "Time", "Invoices", "Weekly brief"];

export function LandingPacks() {
  const [active, setActive] = useState(0);
  const pack = PACKS[active] ?? PACKS[0];
  const Icon = pack.icon;

  return (
    <section className="mkt-band mkt-band-packs" id="packs">
      <div className="mkt-band-inner mkt-band-inner-wide">
        <div className="mkt-packs-head">
          <h2>From companies to outcomes.</h2>
          <p className="mkt-lead">Choose the packs you need.</p>
        </div>
        <div className="mkt-packs-console">
          <div className="mkt-packs-list" role="tablist" aria-label="Capability packs">
            {PACKS.map((item, index) => {
              const PackIcon = item.icon;
              const selected = index === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={clsx("mkt-pack-card", selected && "is-active")}
                  onClick={() => setActive(index)}
                >
                  <span className="mkt-pack-icon">
                    <PackIcon size={18} />
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <em>{item.promise}</em>
                  </span>
                </button>
              );
            })}
          </div>
          <aside className="mkt-pack-detail" aria-live="polite">
            <p className="mkt-kicker">This pack turns on</p>
            <div className="mkt-pack-detail-title">
              <span className="mkt-pack-icon">
                <Icon size={18} />
              </span>
              <h3>{pack.label}</h3>
            </div>
            <p>{pack.promise}</p>
            <ul>
              {pack.turnsOn.map((item) => (
                <li key={item}>
                  <Check size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
        <ol className="mkt-pack-spine" aria-label="What the workspace carries">
          {SPINE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
