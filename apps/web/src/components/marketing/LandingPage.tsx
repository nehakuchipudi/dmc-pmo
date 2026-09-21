"use client";

import Link from "next/link";
import {
  Briefcase,
  Building2,
  ChartColumn,
  Layers3,
  ShieldAlert,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DemoRequestForm } from "./DemoRequestForm";
import { TourPlayer } from "./TourPlayer";
import { useLandingData } from "./useLandingData";

const FEATURES = [
  { title: "Portfolio home", icon: Layers3, body: "One book for funded work, capacity, cash, and the decisions waiting this week." },
  { title: "Companies and contacts", icon: Building2, body: "The client record, activity, and the people who own the relationship." },
  { title: "Project workspace", icon: Briefcase, body: "Health, lifecycle, team, insights, and plan on the same project." },
  { title: "Project plan", icon: ChartColumn, body: "Milestones, tasks, subtasks, and an aligned Gantt you can edit." },
  { title: "Team and capacity", icon: Users, body: "Roles, allocation, and logged hours so you see overload before it lands." },
  { title: "Insights", icon: Target, body: "Schedule, budget, resource, and risk health scored from live project data." },
  { title: "Finance", icon: Wallet, body: "Budget, hours, invoices, and margin stay on the same identity." },
  { title: "Risk and governance", icon: ShieldAlert, body: "Open risks and stage gates sit next to the work they can stall." },
];

export function LandingPage() {
  const data = useLandingData();
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
          <a href="#tours">Tours</a>
          <a href="#platform">Platform</a>
          <a href="#demo">Demo</a>
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
              <a href="#demo" className="mkt-cta mkt-cta-sm">
                Request a demo
              </a>
            </>
          )}
        </div>
      </header>

      <section className="mkt-hero mkt-hero-split">
        <div className="mkt-hero-copy">
          <p className="mkt-kicker">Watch the live PMO, then book the walkthrough</p>
          <h1>See the workspace before you ask for a demo.</h1>
          <p className="mkt-lead">
            These are short tours of the actual DMC PMO. Portfolio home, company records, project team, insights, and
            the Accelo-style plan. Same data your team would run.
          </p>
          <div className="mkt-hero-actions">
            <a href="#demo" className="mkt-cta">
              Request a demo
            </a>
            <a href="#tours" className="mkt-ghost">
              Watch module tours
            </a>
          </div>
          <dl className="mkt-hero-stats">
            <div>
              <dt>Projects on the book</dt>
              <dd>{data.projects.length}</dd>
            </div>
            <div>
              <dt>Work aligned</dt>
              <dd>{data.alignedPct}%</dd>
            </div>
            <div>
              <dt>Benefit progress</dt>
              <dd>{data.benefitAvg}%</dd>
            </div>
          </dl>
          <p className="mkt-hero-modules">Portfolio · Companies · Team · Insights · Plan</p>
        </div>
        <div className="mkt-hero-media">
          <div className="mkt-hero-video-wrap">
            <video
              className="mkt-hero-video"
              src="/tours/hero.mp4"
              poster="/tours/hero.jpg"
              muted
              playsInline
              loop
              autoPlay
              preload="metadata"
            />
            <div className="mkt-tour-badge">Live product</div>
          </div>
        </div>
      </section>

      <section className="mkt-watch" id="tours">
        <div className="mkt-section-head">
          <p className="mkt-kicker">Product tours</p>
          <h2>Click a module. Watch the real screen.</h2>
          <p className="mkt-lead">
            Not slides. Not a sketched UI. These clips were recorded in the live workspace on Q3 Warehouse Rollout and
            Cascade Ventures.
          </p>
        </div>
        <TourPlayer initialId="plan" />
      </section>

      <section className="mkt-trust">
        <p>Built for the people who have to answer for the book</p>
        <div>
          {["PMO", "Delivery", "Finance", "Client leads", "Executives"].map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </section>

      <section className="mkt-platform" id="platform">
        <h2>The modules you just watched.</h2>
        <p className="mkt-lead">One project identity from intake to invoice. Ask for the demo on the parts that matter to you.</p>
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

      <section className="mkt-final mkt-demo" id="demo">
        <div className="mkt-demo-copy">
          <p className="mkt-kicker">Book a walkthrough</p>
          <h2>If the videos look like your week, ask for the demo.</h2>
          <p>
            Tell us who you are and which modules you want live. We will walk the same workspace, with your questions
            on the table.
          </p>
        </div>
        <DemoRequestForm />
      </section>

      <footer className="mkt-footer">
        <Link href="/" className="mkt-logo">
          <span className="mkt-logo-mark">DMC</span>
          PMO
        </Link>
        <div className="mkt-footer-links">
          <a href="#tours">Tours</a>
          <a href="#demo">Request a demo</a>
          <Link href="/login">Sign in</Link>
        </div>
        <span>2026 DMC PMO</span>
      </footer>
    </div>
  );
}
