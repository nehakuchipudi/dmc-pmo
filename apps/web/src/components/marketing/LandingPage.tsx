"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ClipboardCheck,
  Layers3,
  Menu,
  Play,
  ShieldAlert,
  Target,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { LandingConnected } from "@/components/marketing/LandingConnected";
import { LandingDemo } from "@/components/marketing/LandingDemo";
import { LandingFaq } from "@/components/marketing/LandingFaq";
import { LandingPacks } from "@/components/marketing/LandingPacks";
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
  { title: "Modular capabilities", icon: Layers3, body: "Enable project management, project delivery, or field service." },
  { title: "Project Management", icon: Briefcase, body: "Keep the plan, team, status, and files on one project." },
  { title: "Service operations", icon: ClipboardCheck, body: "Run work orders, recurring visits, schedule, and crew." },
  { title: "Resource Management", icon: Users, body: "See who is overloaded before you staff another job." },
  { title: "Financial Management", icon: Wallet, body: "Hold budget, hours, invoices, and margin together." },
  { title: "Companies and ideas", icon: Building2, body: "Keep the client and intake on the same book of work." },
  { title: "Risk and Issues", icon: ShieldAlert, body: "Log likelihood, impact, owner, and the next action." },
  { title: "PMO Intelligence", icon: Brain, body: "Surface the calls that need a decision this week." },
];

const ACTION_SHOTS = [
  {
    src: "/marketing/card-overview.jpg?v=6",
    title: "Project record",
    body: "Status, cost, team, and progress stay on the same job.",
  },
  {
    src: "/marketing/card-plan.jpg?v=6",
    title: "Delivery plan",
    body: "Phases and tasks on a schedule the team can run.",
  },
  {
    src: "/marketing/card-insights.jpg?v=6",
    title: "Weekly brief",
    body: "Capacity, risk, gates, and cash that need attention.",
  },
];

const LEADERSHIP = [
  "One platform for office work and field service",
  "Turn on only the capability packs you need",
  "A weekly brief of risk, capacity, and cash",
];

const DELIVERY = [
  "One project record for plan, team, and tasks",
  "Time, expenses, and invoices on that job",
  "Work orders, schedule, and crew in the same workspace",
];

const BENEFITS = [
  { title: "More visibility across your portfolio", icon: BarChart3 },
  { title: "Better decisions with real-time data", icon: Zap },
  { title: "Greater impact from your projects", icon: Target },
];

const NAV = [
  {
    label: "Product",
    href: "#product",
    items: [
      { label: "Overview", href: "#product" },
      { label: "Connected workspace", href: "#connected" },
      { label: "Live product tour", href: "#watchnow" },
    ],
  },
  {
    label: "Capabilities",
    href: "#platform",
    items: [
      { label: "PMO modules", href: "#platform" },
      { label: "Project, delivery, and field service", href: "#platform" },
    ],
  },
  {
    label: "How it works",
    href: "#packs",
    items: [
      { label: "Companies to outcomes", href: "#packs" },
      { label: "Inside the tool", href: "#action" },
    ],
  },
  {
    label: "Resources",
    href: "#watchnow",
    items: [
      { label: "Live workspace tours", href: "#watchnow" },
      { label: "Capacity and teams", href: "#watch-resources" },
      { label: "FAQ", href: "#faq" },
    ],
  },
] as const;

export function LandingPage() {
  const { user, isClient } = useAuth();
  const appHref = user ? (isClient ? "/portal" : "/app/home") : "/login";
  const startHref = user ? appHref : "/login";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onHash() {
      setMenuOpen(false);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="mkt">
      <header className="mkt-nav">
        <Link href="/" className="mkt-logo">
          <span className="mkt-logo-mark">DMC</span>
          PMO
        </Link>
        <nav className="mkt-nav-links" aria-label="Marketing">
          {NAV.map((item) => (
            <div className="mkt-nav-item" key={item.label}>
              <a href={item.href}>
                {item.label}
                <ChevronDown size={14} />
              </a>
              <div className="mkt-nav-drop">
                {item.items.map((entry) => (
                  <a key={entry.label} href={entry.href}>
                    {entry.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mkt-nav-actions">
          {user ? (
            <>
              <a href="#demo" className="mkt-text-link">
                Request a demo
              </a>
              <Link href={appHref} className="mkt-cta mkt-cta-sm">
                Open workspace
              </Link>
            </>
          ) : (
            <>
              <a href="#demo" className="mkt-text-link">
                Request a demo
              </a>
              <Link href="/login" className="mkt-text-link">
                Sign in
              </Link>
              <Link href="/signup" className="mkt-cta mkt-cta-sm">
                Get Started
              </Link>
            </>
          )}
          <button
            type="button"
            className="mkt-nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="mkt-mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
            <span>Menu</span>
          </button>
        </div>
        {menuOpen ? (
          <nav className="mkt-nav-drawer" id="mkt-mobile-nav" aria-label="Marketing menu">
            {NAV.map((item) => (
              <div key={item.label}>
                <a href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
                {item.items.map((entry) => (
                  <a key={entry.label} href={entry.href} onClick={() => setMenuOpen(false)}>
                    {entry.label}
                  </a>
                ))}
              </div>
            ))}
            <div>
              <a href="#demo" onClick={() => setMenuOpen(false)}>
                Request a demo
              </a>
              {user ? (
                <Link href={appHref} onClick={() => setMenuOpen(false)}>
                  Open workspace
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    Sign in
                  </Link>
                  <Link href="/signup" onClick={() => setMenuOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        ) : null}
      </header>

      <section className="mkt-hero mkt-hero-cover" id="product">
        <div className="mkt-hero-sky" aria-hidden="true" />
        <div className="mkt-hero-copy">
          <p className="mkt-kicker">One platform. Endless possibilities.</p>
          <h1>
            <span>Turn Projects Into</span>
            <span>Business Outcomes.</span>
          </h1>
          <p className="mkt-lead">
            DMC PMO is one modular platform. Enable project management, project delivery, or field service operations
            and run the whole book in one workspace.
          </p>
          <div className="mkt-hero-actions">
            <Link href={startHref} className="mkt-cta">
              Open workspace
              <ArrowRight size={16} />
            </Link>
            <a href="#watchnow" className="mkt-ghost">
              <Play size={14} fill="currentColor" />
              Watch product tour
            </a>
          </div>
        </div>
        <aside className="mkt-hero-benefits">
          {BENEFITS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title}>
                <span>
                  <Icon size={16} />
                </span>
                <p>{item.title}</p>
              </div>
            );
          })}
        </aside>
      </section>

      <LandingPacks />

      <LandingConnected />

      <section className="mkt-band mkt-band-watch" id="resources">
        <div className="mkt-band-inner mkt-band-inner-wide">
          <div className="mkt-watch-head">
            <p className="mkt-kicker">The workspace</p>
            <h2>Run your PMO with complete visibility.</h2>
            <p className="mkt-lead">
              Connect companies, projects, plans, teams, milestones and business outcomes in one modern workspace built
              for the way your organization actually delivers work.
            </p>
          </div>
          <LandingTour clips={TOURS} />
        </div>
      </section>

      <section className="mkt-band mkt-band-trust">
        <div className="mkt-band-inner">
          <p>Teams use DMC PMO across</p>
          <div className="mkt-trust-row">
            {["Operations", "IT", "Product", "Finance", "Delivery", "Field service"].map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-band mkt-band-platform" id="platform">
        <div className="mkt-band-inner mkt-band-inner-wide">
          <p className="mkt-kicker">Capabilities</p>
          <h2>The capabilities a customer can turn on.</h2>
          <p className="mkt-lead">Project management, project delivery, and field service operations on one workspace.</p>
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
        </div>
      </section>

      <section className="mkt-band mkt-band-action" id="action">
        <div className="mkt-band-inner mkt-band-inner-wide">
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
        </div>
      </section>

      <LandingFaq />
      <LandingDemo />

      <footer className="mkt-footer">
        <Link href="/" className="mkt-logo">
          <span className="mkt-logo-mark">DMC</span>
          PMO
        </Link>
        <div className="mkt-footer-links">
          <a href="#product">Product</a>
          <a href="#platform">Capabilities</a>
          <a href="#packs">How it works</a>
          <a href="#faq">FAQ</a>
          <a href="#demo">Request a demo</a>
          <Link href="/login">Sign in</Link>
          <Link href="/signup">Create account</Link>
        </div>
        <span>© 2026 DMC PMO</span>
      </footer>
    </div>
  );
}
