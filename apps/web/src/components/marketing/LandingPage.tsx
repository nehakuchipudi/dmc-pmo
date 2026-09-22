"use client";

import Link from "next/link";
import {
  Brain,
  Briefcase,
  Check,
  Layers3,
  Scale,
  ShieldAlert,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { LandingConnected } from "@/components/marketing/LandingConnected";
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
  { title: "Portfolio Management", icon: Layers3, body: "Group funded work by book, owner, health, and spend." },
  { title: "Project Management", icon: Briefcase, body: "Keep the plan, team, status, and files on one project." },
  { title: "Resource Management", icon: Users, body: "See who is overloaded before you staff another job." },
  { title: "Financial Management", icon: Wallet, body: "Hold budget, hours, invoices, and margin together." },
  { title: "Risk and Issues", icon: ShieldAlert, body: "Log likelihood, impact, owner, and the next action." },
  { title: "Governance", icon: Scale, body: "Run stage gates with criteria, owners, and dates." },
  { title: "Strategy Alignment", icon: Target, body: "Tie each project to an objective you can measure." },
  { title: "PMO Intelligence", icon: Brain, body: "Surface the calls that need a decision this week." },
];

const ACTION_SHOTS = [
  {
    src: "/marketing/card-overview.jpg",
    title: "Project record",
    body: "Status, cost, team, and progress stay on the same job.",
  },
  {
    src: "/marketing/card-plan.jpg",
    title: "Delivery plan",
    body: "Phases and tasks on a schedule the team can run.",
  },
  {
    src: "/marketing/card-insights.jpg",
    title: "Weekly brief",
    body: "Capacity, risk, gates, and cash that need attention.",
  },
];

const LEADERSHIP = [
  "Portfolio health and spend in one home",
  "A weekly brief of risk, capacity, and cash",
  "Objectives mapped to the work they fund",
];

const DELIVERY = [
  "One project record for plan, team, and tasks",
  "Time, expenses, and invoices on that job",
  "Gates and decisions with owners and dates",
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
          <a href="#connected">Connected</a>
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
          <img src="/marketing/hero-generic.svg" alt="Generic portfolio overview with project health, capacity, and budget" />
        </div>
      </section>

      <LandingConnected />

      <div className="mkt-watch-head">
        <p className="mkt-kicker">The workspace</p>
        <h2>Run your PMO with complete visibility.</h2>
        <p className="mkt-lead">
          Connect companies, projects, plans, teams, milestones and business outcomes in one modern workspace built for
          the way your organization actually delivers work.
        </p>
      </div>
      <LandingTour clips={TOURS} />

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
        <h2>The modules a PMO actually runs.</h2>
        <p className="mkt-lead">Portfolio through intelligence, on one project identity.</p>
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
        <p className="mkt-kicker">Inside the tool</p>
        <h2>From one project to the whole book.</h2>
        <p className="mkt-lead">Open a job, run the plan, then read what needs a decision this week.</p>
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
            <h3>For leadership</h3>
            <ul>
              {LEADERSHIP.map((item) => (
                <li key={item}>
                  <Check size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
          <article>
            <h3>For delivery teams</h3>
            <ul>
              {DELIVERY.map((item) => (
                <li key={item}>
                  <Check size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="mkt-final mkt-final-dark">
        <h2>Walk the same workspace.</h2>
        <p>Sign in and open the boards you just watched.</p>
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
