"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { clsx } from "clsx";

const PILLARS = [
  {
    id: "company",
    title: "Company visibility",
    body: "Keep the client and company context connected to the work your teams are delivering.",
    detail: "Open one company and see projects, invoices, contacts, and activity on the same record.",
    image: "/tours/companies.jpg",
    watch: "watchnow",
  },
  {
    id: "projects",
    title: "Project management",
    body: "Track projects, ownership, status and delivery information from one workspace.",
    detail: "Filter the live book by health, owner, and budget without leaving the list.",
    image: "/marketing/shot-projects.jpg",
    watch: "watch-projects",
  },
  {
    id: "plan",
    title: "Project planning",
    body: "Turn projects into structured plans with milestones, tasks, dependencies and accountability.",
    detail: "Phases, dates, and owners sit on the same plan the delivery team runs each week.",
    image: "/marketing/card-plan.jpg",
    watch: "watch-projects",
  },
  {
    id: "ideas",
    title: "Ideas and initiatives",
    body: "Capture potential work before it becomes a formal project and keep the strategic context visible.",
    detail: "Score an idea, keep the objective attached, then convert it when the book has room.",
    image: "/tours/portfolio.jpg",
    watch: "watch-portfolio",
  },
  {
    id: "team",
    title: "Team visibility",
    body: "Understand who is working on what and where capacity or attention is needed.",
    detail: "Load, assignments, and open work stay on the people already in flight.",
    image: "/marketing/shot-resources.jpg",
    watch: "watch-resources",
  },
  {
    id: "insights",
    title: "PMO insights",
    body: "Move from project-level information to management-level visibility and decision making.",
    detail: "A weekly brief of capacity, risk, gates, and cash that needs a call.",
    image: "/marketing/card-insights.jpg",
    watch: "watch-ai",
  },
] as const;

export function LandingConnected() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pillar = PILLARS[active] ?? PILLARS[0];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % PILLARS.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  function select(index: number) {
    setPaused(true);
    setActive(index);
  }

  return (
    <section
      className="mkt-connect"
      id="connected"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="mkt-kicker">Built around the way PMOs work</p>
      <h2>Everything connected. Nothing hidden.</h2>
      <div className="mkt-connect-grid" role="tablist" aria-label="How the workspace stays connected">
        {PILLARS.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={clsx("mkt-connect-card", selected && "is-active")}
              onClick={() => select(index)}
              onFocus={() => select(index)}
            >
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </button>
          );
        })}
      </div>
      <div className="mkt-connect-preview" aria-live="polite">
        <div className="mkt-shot">
          <img src={pillar.image} alt="" />
        </div>
        <div className="mkt-connect-preview-copy">
          <p className="mkt-kicker">{pillar.title}</p>
          <p>{pillar.detail}</p>
          <a className="mkt-connect-watch" href={`#${pillar.watch}`}>
            Watch this in the live workspace
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
      <a className="mkt-connect-down" href="#watchnow" aria-label="Continue to the live product tour">
        <ArrowDown size={18} />
      </a>
    </section>
  );
}
