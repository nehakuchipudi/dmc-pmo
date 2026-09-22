"use client";

import Link from "next/link";
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
import { LandingTour } from "@/components/marketing/LandingTour";
import { useAuth } from "@/lib/auth";

const TOURS = [
  {
    id: "portfolio",
    label: "Portfolio",
    title: "Portfolio books",
    caption: "Investment books, health, and the work each book funds this week.",
    src: "/tours/portfolio.mp4?v=5",
    poster: "/tours/portfolio.jpg?v=5",
  },
  {
    id: "projects",
    label: "Projects",
    title: "Project list",
    caption: "Open work, at-risk jobs, and the filters the delivery team uses every day.",
    src: "/tours/projects.mp4?v=5",
    poster: "/tours/projects.jpg?v=5",
  },
  {
    id: "resources",
    label: "Resources",
    title: "Capacity board",
    caption: "People, load, and assignments on the team already in flight.",
    src: "/tours/resources.mp4?v=5",
    poster: "/tours/resources.jpg?v=5",
  },
  {
    id: "risks",
    label: "Risks",
    title: "Risk register",
    caption: "Likelihood, impact, owners, and the next action on each open risk.",
    src: "/tours/risks.mp4?v=5",
    poster: "/tours/risks.jpg?v=5",
  },
  {
    id: "ai",
    label: "Intelligence",
    title: "Portfolio insights",
    caption: "A live brief of exceptions: capacity, risk, gates, and cash.",
    src: "/tours/intelligence.mp4?v=5",
    poster: "/tours/intelligence.jpg?v=5",
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

const CONNECTED = ["Strategy", "Portfolio", "Projects", "Plan", "Delivery", "Outcomes"];

const ACTION_SHOTS = [
  {
    src: "/marketing/shot-overview.jpg",
    title: "Project workspace",
    body: "Health, cost, team, and the live record on one project.",
  },
  {
    src: "/marketing/shot-plan.jpg",
    title: "Project plan",
    body: "Phases, tasks, and the Gantt the delivery team actually runs.",
  },
  {
    src: "/marketing/shot-insights.jpg",
    title: "Weekly PMO brief",
    body: "Exceptions across capacity, risk, gates, and cash.",
  },
];

export function LandingPage() {
  const { user, isClient } = useAuth();
  const appHref = user ? (isClient ? "/portal" : "/app/home") : "/login";
  const startHref = user ? appHref : "/login";
  const startLabel = user ? "Open workspace" : "Get Started";

  return (
    <div className="mkt">
      <header className="mkt-nav">
        <Link href="/" className="mkt-logo">
          <span className="mkt-logo-mark">DMC</span>
          PMO
        </Link>
        <nav className="mkt-nav-links">
          <a href="#product">Product</a>
          <a href="#watchnow">Watch</a>
          <a href="#platform">Capabilities</a>
          <a href="#action">How it works</a>
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

      <section className="mkt-hero mkt-hero-split" id="product">
        <div className="mkt-blob mkt-blob-a" />
        <div className="mkt-blob mkt-blob-b" />
        <div className="mkt-hero-copy">
          <p className="mkt-kicker">PMO platform for every organization</p>
          <h1>Turn Projects Into Business Outcomes.</h1>
          <p className="mkt-lead">
            DMC PMO gives organizations one intelligent platform to plan, prioritize, govern, and deliver their entire
            project portfolio.
          </p>
          <div className="mkt-hero-actions">
            <Link href={startHref} className="mkt-cta">
              {startLabel}
            </Link>
            <a href="#watchnow" className="mkt-ghost">
              Explore the Platform
            </a>
          </div>
        </div>
        <div className="mkt-hero-shot">
          <img src="/marketing/hero-home.jpg" alt="DMC PMO portfolio home with health, cost, risk, and decisions" />
        </div>
      </section>

      <div className="mkt-watch-head">
        <p className="mkt-kicker">Live product tour</p>
        <h2>Watch the real workspace.</h2>
        <p className="mkt-lead">Each tab is a live module. The film advances on its own when a clip ends.</p>
      </div>
      <LandingTour clips={TOURS} />

      <section className="mkt-connected" id="connected">
        <p className="mkt-kicker">The full picture</p>
        <h2>Your Portfolio, Connected</h2>
        <p className="mkt-lead">
          Strategy, books, projects, people, and risk sit on the same records. This is the workspace teams open every
          week, not a mock.
        </p>
        <div className="mkt-shot mkt-shot-wide">
          <img src="/marketing/shot-projects.jpg" alt="DMC PMO project list with status, progress, and budget" />
        </div>
        <div className="mkt-pills" aria-hidden="true">
          {CONNECTED.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
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
        <p className="mkt-kicker">Capabilities</p>
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

      <section className="mkt-action" id="action">
        <p className="mkt-kicker">How it works</p>
        <h2>See the PMO in Action</h2>
        <p className="mkt-lead">The same project workspace, plan, and weekly brief from the live tool.</p>
        <div className="mkt-action-grid">
          {ACTION_SHOTS.map((shot) => (
            <article key={shot.title} className="mkt-action-card">
              <div className="mkt-shot">
                <img src={shot.src} alt={shot.title} />
              </div>
              <h3>{shot.title}</h3>
              <p>{shot.body}</p>
            </article>
          ))}
        </div>
        <div className="mkt-audiences">
          <article>
            <h3>Built for Leadership</h3>
            <ul>
              <li>Portfolio health and performance in one home</li>
              <li>Risk, capacity, and cash in the weekly brief</li>
              <li>Strategy, objectives, and the work they fund</li>
            </ul>
          </article>
          <article>
            <h3>Built for Delivery Teams</h3>
            <ul>
              <li>Project workspace, plan, and tasks on one record</li>
              <li>Time, expenses, and invoices on the same job</li>
              <li>Stage gates and decisions with owners and dates</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="mkt-final mkt-final-dark">
        <h2>Make every project count.</h2>
        <p>Start a demo workspace and walk the same boards you just watched.</p>
        <Link href={startHref} className="mkt-cta">
          {startLabel}
        </Link>
      </section>

      <footer className="mkt-footer">
        <Link href="/" className="mkt-logo">
          <span className="mkt-logo-mark">DMC</span>
          PMO
        </Link>
        <div className="mkt-footer-links">
          <a href="#product">Product</a>
          <a href="#watchnow">Watch</a>
          <a href="#platform">Capabilities</a>
          <Link href="/login">Sign in</Link>
        </div>
        <span>© 2026 DMC PMO</span>
      </footer>
    </div>
  );
}
