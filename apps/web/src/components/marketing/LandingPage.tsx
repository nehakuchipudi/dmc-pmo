"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Brain,
  Briefcase,
  Layers3,
  Scale,
  ShieldAlert,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const TABS = [
  {
    id: "portfolio",
    label: "Portfolio",
    title: "Portfolio home",
    caption: "Funded work, capacity, cash, and the decisions waiting this week.",
    src: "/tours/portfolio.mp4",
    poster: "/tours/portfolio.jpg",
  },
  {
    id: "projects",
    label: "Projects",
    title: "Project plan",
    caption: "Milestones, tasks, and an aligned Gantt on Q3 Warehouse Rollout.",
    src: "/tours/plan.mp4",
    poster: "/tours/plan.jpg",
  },
  {
    id: "resources",
    label: "Resources",
    title: "Project team",
    caption: "Roles, allocation, capacity, and logged hours on the same roster.",
    src: "/tours/team.mp4",
    poster: "/tours/team.jpg",
  },
  {
    id: "risks",
    label: "Risks",
    title: "Project insights",
    caption: "Schedule, budget, resources, and risk scored from live project data.",
    src: "/tours/insights.mp4",
    poster: "/tours/insights.jpg",
  },
  {
    id: "ai",
    label: "Intelligence",
    title: "The whole workspace",
    caption: "Home, company record, project team, insights, and the live plan in one walk.",
    src: "/tours/hero.mp4",
    poster: "/tours/hero.jpg",
  },
] as const;

const FEATURES = [
  { title: "Portfolio Management", icon: Layers3, body: "One book for the work you fund, with health and spend in the same view." },
  { title: "Project Management", icon: Briefcase, body: "Plans, tickets, and status on the same project record." },
  { title: "Resource Management", icon: Users, body: "See who is over capacity before you start more work." },
  { title: "Financial Management", icon: Wallet, body: "Budget, hours, invoices, and margin stay connected." },
  { title: "Risk & Issues", icon: ShieldAlert, body: "Score and track risks next to the work they can stall." },
  { title: "Governance", icon: Scale, body: "Stage gates and decisions with owners, dates, and criteria." },
  { title: "Strategy Alignment", icon: Target, body: "Map projects to objectives so the portfolio proves outcomes." },
  { title: "PMO Intelligence", icon: Brain, body: "A weekly brief of exceptions: risk, capacity, gates, and cash." },
];

export function LandingPage() {
  const { user, isClient } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("portfolio");
  const appHref = user ? (isClient ? "/portal" : "/app/home") : "/login";
  const tour = TABS.find((item) => item.id === tab) ?? TABS[0];

  return (
    <div className="mkt">
      <header className="mkt-nav">
        <Link href="/" className="mkt-logo">
          <span className="mkt-logo-mark">DMC</span>
          PMO
        </Link>
        <nav className="mkt-nav-links">
          <a href="#watch">Watch</a>
          <a href="#platform">Platform</a>
        </nav>
        <div className="mkt-nav-actions">
          {user ? (
            <Link href={appHref} className="mkt-cta mkt-cta-sm">
              Open workspace
            </Link>
          ) : (
            <>
              <Link href="/login" className="mkt-text-link">
                Sign in
              </Link>
              <Link href="/login" className="mkt-cta mkt-cta-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="mkt-hero">
        <div className="mkt-blob mkt-blob-a" />
        <div className="mkt-blob mkt-blob-b" />
        <div className="mkt-blob mkt-blob-c" />
        <p className="mkt-kicker">PMO platform for every organization</p>
        <h1>Turn Projects Into Business Outcomes.</h1>
        <p className="mkt-lead">
          DMC PMO gives organizations one intelligent platform to plan, prioritize, govern, and deliver their entire
          project portfolio.
        </p>
        <div className="mkt-hero-actions">
          <Link href="/login" className="mkt-cta">
            Get Started
          </Link>
          <a href="#watch" className="mkt-ghost">
            Explore the Platform
          </a>
        </div>
      </section>

      <section className="mkt-watch" id="watch">
        <div className="mkt-tabs" role="tablist" aria-label="Live product tours">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "active" : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mkt-film mkt-film-hero">
          <div className="mkt-film-stage">
            <video
              key={tour.id}
              className="mkt-live-video"
              src={tour.src}
              poster={tour.poster}
              muted
              playsInline
              loop
              autoPlay
              controls
              preload="metadata"
            />
            <div className="mkt-film-live">Live product</div>
          </div>
          <div className="mkt-film-caption">
            <em>{tour.title}</em>
            <span>{tour.caption}</span>
          </div>
        </div>
        <p className="mkt-watch-note">
          Click a tab to watch the live workspace. These clips were recorded on Q3 Warehouse Rollout and Cascade
          Ventures.
        </p>
      </section>

      <section className="mkt-trust">
        <p>Teams use DMC PMO across</p>
        <div>
          {["Operations", "IT", "Product", "Finance", "Delivery", "Strategy"].map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </section>

      <section className="mkt-platform" id="platform">
        <h2>Everything Your PMO Needs. One Platform.</h2>
        <p className="mkt-lead">Eight capabilities. One project identity. Built for any company that runs a portfolio.</p>
        <div className="mkt-features">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title}>
                <span className="mkt-feature-icon">
                  <Icon size={18} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mkt-final">
        <h2>See your whole portfolio in one place.</h2>
        <p>Start a demo workspace and walk the same board you just watched.</p>
        <Link href="/login" className="mkt-cta">
          Get Started
        </Link>
      </section>

      <footer className="mkt-footer">
        <Link href="/" className="mkt-logo">
          <span className="mkt-logo-mark">DMC</span>
          PMO
        </Link>
        <div className="mkt-footer-links">
          <a href="#watch">Watch</a>
          <a href="#platform">Platform</a>
          <Link href="/login">Sign in</Link>
        </div>
        <span>© 2026 DMC PMO</span>
      </footer>
    </div>
  );
}
