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
    src: "/tours/portfolio.mp4?v=4",
    poster: "/tours/portfolio.jpg?v=4",
  },
  {
    id: "projects",
    label: "Projects",
    title: "Project list",
    caption: "Open work, at-risk jobs, and the filters the delivery team uses every day.",
    src: "/tours/projects.mp4?v=4",
    poster: "/tours/projects.jpg?v=4",
  },
  {
    id: "resources",
    label: "Resources",
    title: "Capacity board",
    caption: "People, load, and assignments on the team already in flight.",
    src: "/tours/resources.mp4?v=4",
    poster: "/tours/resources.jpg?v=4",
  },
  {
    id: "risks",
    label: "Risks",
    title: "Risk register",
    caption: "Likelihood, impact, owners, and the next action on each open risk.",
    src: "/tours/risks.mp4?v=4",
    poster: "/tours/risks.jpg?v=4",
  },
  {
    id: "ai",
    label: "Intelligence",
    title: "Portfolio insights",
    caption: "A live brief of exceptions: capacity, risk, gates, and cash.",
    src: "/tours/intelligence.mp4?v=4",
    poster: "/tours/intelligence.jpg?v=4",
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
  const appHref = user ? (isClient ? "/portal" : "/app/home") : "/login";

  return (
    <div className="mkt">
      <header className="mkt-nav">
        <Link href="/" className="mkt-logo">
          <span className="mkt-logo-mark">DMC</span>
          PMO
        </Link>
        <nav className="mkt-nav-links">
          <a href="#watchnow">Watch</a>
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
          <a href="#watchnow" className="mkt-ghost">
            Explore the Platform
          </a>
        </div>
      </section>

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
          <a href="#watchnow">Watch</a>
          <a href="#platform">Platform</a>
          <Link href="/login">Sign in</Link>
        </div>
        <span>© 2026 DMC PMO</span>
      </footer>
    </div>
  );
}
