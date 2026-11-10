"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";

const PILLARS = [
  {
    id: "company",
    title: "Company visibility",
    body: "The client sits on every job.",
    detail: "Open one company and see projects, invoices, contacts, and activity on the same record.",
    image: "/tours/companies.jpg",
    watch: "watchnow",
  },
  {
    id: "projects",
    title: "Project management",
    body: "The live book, not a status slide.",
    detail: "Filter the live book by health, owner, and budget without leaving the list.",
    image: "/marketing/shot-projects.jpg",
    watch: "watch-projects",
  },
  {
    id: "plan",
    title: "Project planning",
    body: "Milestones the team can run.",
    detail: "Phases, dates, and owners sit on the same plan the delivery team runs each week.",
    image: "/marketing/card-plan.jpg?v=6",
    watch: "watch-projects",
  },
  {
    id: "ideas",
    title: "Ideas and initiatives",
    body: "Intake before it is a project.",
    detail: "Score an idea, keep the objective attached, then convert it when the book has room.",
    image: "/tours/portfolio.jpg",
    watch: "watch-portfolio",
  },
  {
    id: "team",
    title: "Team visibility",
    body: "Who is loaded, and by how much.",
    detail: "Load, assignments, and open work stay on the people already in flight.",
    image: "/marketing/shot-resources.jpg",
    watch: "watch-resources",
  },
  {
    id: "insights",
    title: "PMO insights",
    body: "The call you need this week.",
    detail: "A weekly brief of capacity, risk, gates, and cash that needs a call.",
    image: "/marketing/card-insights.jpg?v=6",
    watch: "watch-ai",
  },
  {
    id: "service",
    title: "Service operations",
    body: "Field work in the same workspace.",
    detail: "Work Journey, schedule, approvals, and the employee clock live next to the project book.",
    image: "/marketing/card-overview.jpg?v=6",
    watch: "watchnow",
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
    }, 5600);
    return () => window.clearInterval(timer);
  }, [paused]);

  function select(index: number) {
    setPaused(true);
    setActive(index);
  }

  return (
    <section
      className="mkt-band mkt-band-pmo"
      id="connected"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mkt-band-inner mkt-band-inner-wide">
        <div className="mkt-pmo-head">
          <p className="mkt-kicker">Built around the way PMOs work</p>
          <h2>The book, the plan, and the call you need this week.</h2>
        </div>
        <div className="mkt-pmo-console">
          <ol className="mkt-pmo-rail" role="tablist" aria-label="How the workspace stays connected">
            {PILLARS.map((item, index) => {
              const selected = index === active;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={clsx("mkt-pmo-beat", selected && "is-active")}
                    onClick={() => select(index)}
                    onFocus={() => select(index)}
                  >
                    <span className="mkt-pmo-index">{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <strong>{item.title}</strong>
                      <em>{item.body}</em>
                    </span>
                    {selected && !paused ? <i className="mkt-pmo-progress" aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mkt-pmo-stage" aria-live="polite">
            <div className="mkt-shot">
              <img src={pillar.image} alt="" />
            </div>
            <div className="mkt-pmo-stage-copy">
              <p className="mkt-kicker">{pillar.title}</p>
              <p>{pillar.detail}</p>
              <a className="mkt-pmo-watch" href={`#${pillar.watch}`}>
                Watch this in the live workspace
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
