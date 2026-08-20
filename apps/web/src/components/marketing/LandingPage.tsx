"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { useAuth } from "@/lib/auth";
import { ProductFilm, type FilmScene } from "./ProductFilm";
import { ProductFrame } from "./ProductFrame";
import { useLandingData, type LandingData } from "./useLandingData";

const TABS = [
  { id: "portfolio", label: "Portfolio" },
  { id: "projects", label: "Projects" },
  { id: "resources", label: "Resources" },
  { id: "risks", label: "Risks" },
  { id: "ai", label: "Intelligence" },
] as const;

const FEATURES = [
  { title: "Portfolio Management", icon: Layers3, body: "One book for every program, with health and spend in the same view." },
  { title: "Project Management", icon: Briefcase, body: "Plans, tickets, and status on the same project record." },
  { title: "Resource Management", icon: Users, body: "See who is over capacity before you start more work." },
  { title: "Financial Management", icon: Wallet, body: "Budget, hours, invoices, and margin stay connected." },
  { title: "Risk & Issues", icon: ShieldAlert, body: "Score and track risks next to the work they can stall." },
  { title: "Governance", icon: Scale, body: "Stage gates and decisions with owners, dates, and criteria." },
  { title: "Strategy Alignment", icon: Target, body: "Map projects to objectives so the portfolio proves outcomes." },
  { title: "PMO Intelligence", icon: Brain, body: "A weekly brief of exceptions: risk, capacity, gates, and cash." },
];

export function LandingPage() {
  const data = useLandingData();
  const { user, isClient } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("portfolio");
  const appHref = user ? (isClient ? "/portal" : "/app/home") : "/login";
  const scenes = useMemo(() => scenesFor(tab, data), [tab, data]);
  const activeTab = TABS.find((item) => item.id === tab)?.label ?? "Portfolio";

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
        <div className="mkt-tabs" role="tablist" aria-label="Platform films">
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
        <ProductFilm
          key={tab}
          title={`${activeTab} in motion`}
          eyebrow="Interactive film"
          scenes={scenes}
          autoPlay
          loop
          variant="hero"
        />
        <p className="mkt-watch-note">Click a tab, play, pause, or jump chapters. Pause to explore the live board.</p>
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

function scenesFor(tab: string, data: LandingData): FilmScene[] {
  if (tab === "projects") return projectScenes(data);
  if (tab === "resources") return resourceScenes(data);
  if (tab === "risks") return riskScenes(data);
  if (tab === "ai") return aiScenes(data);
  return portfolioScenes(data);
}

function portfolioScenes(data: LandingData): FilmScene[] {
  return [
    {
      id: "health",
      title: "Portfolio health",
      caption: `${data.metrics?.health ?? "Watch"} across the live investment book.`,
      durationMs: 5200,
      render: () => (
        <ProductFrame title="portfolio / health" active="portfolio" compact>
          <div className="mkt-film-metrics">
            <BigStat label="Health" value={data.metrics?.health ?? "Watch"} />
            <BigStat label="Budget" value={data.metrics ? data.money(data.metrics.invested) : "-"} />
            <BigStat label="Aligned" value={`${data.alignedPct}%`} />
            <BigStat label="Margin" value={`${data.metrics?.margin ?? 0}%`} />
          </div>
        </ProductFrame>
      ),
    },
    {
      id: "programs",
      title: "Programs",
      caption: "Programs keep related projects in one story.",
      durationMs: 5200,
      render: () => (
        <ProductFrame title="portfolio / programs" active="programs" compact>
          <div className="mkt-mini">
            {data.programs.map((program) => (
              <div key={program.id} className="insight-card">
                <div className="mkt-row">
                  <strong>{program.name}</strong>
                  <Pill value={program.status} />
                </div>
                <p>{program.description}</p>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
    {
      id: "timeline",
      title: "Timeline",
      caption: "The portfolio calendar, using real start and due dates.",
      durationMs: 5200,
      render: () => (
        <ProductFrame title="portfolio / timeline" active="portfolio" compact>
          <div className="mkt-mini">
            {data.projects.map((p) => (
              <div key={p.id} className="insight-card">
                <div className="mkt-row">
                  <strong>{p.name}</strong>
                  <span>
                    {p.start} to {p.due}
                  </span>
                </div>
                <div className="mkt-bar">
                  <i style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
  ];
}

function projectScenes(data: LandingData): FilmScene[] {
  return [
    {
      id: "status",
      title: "Project status",
      caption: `${data.statusCounts.onTrack} on track · ${data.statusCounts.atRisk} at risk · ${data.statusCounts.overdue} overdue.`,
      durationMs: 5000,
      render: () => (
        <ProductFrame title="projects / status" active="projects" compact>
          <div className="mkt-mini">
            {data.projects.map((p) => (
              <div key={p.id} className="insight-card">
                <div className="mkt-row">
                  <strong>{p.name}</strong>
                  <Pill value={p.status} />
                </div>
                <ProgressLine value={p.progress} />
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
    {
      id: "miles",
      title: "Milestones",
      caption: "Phase gates stay on the same record as the plan.",
      durationMs: 5000,
      render: () => (
        <ProductFrame title="projects / milestones" active="projects" compact>
          <div className="mkt-mini">
            {data.milestones.slice(0, 5).map((m) => (
              <div key={m.id} className="insight-card">
                <div className="mkt-row">
                  <strong>{m.name}</strong>
                  <Pill value={m.status} />
                </div>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
  ];
}

function resourceScenes(data: LandingData): FilmScene[] {
  return [
    {
      id: "load",
      title: "Utilization",
      caption: data.overloaded.length
        ? `${data.overloaded.map((o) => o.name).join(", ")} over 100% this week.`
        : "Capacity is inside the band.",
      durationMs: 6000,
      render: () => (
        <ProductFrame title="resources / load" active="resources" compact>
          <div className="mkt-mini">
            {data.capacity.map((person) => (
              <div key={person.id} className="insight-card">
                <div className="mkt-row">
                  <strong>{person.name}</strong>
                  <span>{person.pct}%</span>
                </div>
                <div className="mkt-bar">
                  <i style={{ width: `${Math.min(person.pct, 140)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
  ];
}

function riskScenes(data: LandingData): FilmScene[] {
  return [
    {
      id: "open",
      title: "Open risks",
      caption: `${data.highRisks.length} high-impact items on the live book.`,
      durationMs: 5500,
      render: () => (
        <ProductFrame title="risks / open" active="risks" compact>
          <div className="mkt-mini">
            {data.risks.map((risk) => (
              <div key={risk.id} className="insight-card">
                <div className="mkt-row">
                  <strong>{risk.title}</strong>
                  <Pill value={risk.impact} />
                </div>
                <p>{risk.mitigation}</p>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
    {
      id: "gates",
      title: "Governance",
      caption: "Gates waiting on a decision become the Monday agenda.",
      durationMs: 5500,
      render: () => (
        <ProductFrame title="governance / gates" active="governance" compact>
          <div className="mkt-mini">
            {data.gates.map((gate) => (
              <div key={gate.id} className="insight-card">
                <div className="mkt-row">
                  <strong>{gate.name}</strong>
                  <Pill value={gate.status} />
                </div>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
  ];
}

function aiScenes(data: LandingData): FilmScene[] {
  return [
    {
      id: "brief",
      title: "Exception brief",
      caption: "Start with what is not green.",
      durationMs: 5500,
      render: () => (
        <ProductFrame title="insights / brief" active="ai" compact>
          <div className="mkt-mini">
            <div className="insight-card">
              <strong>
                Portfolio is {data.metrics?.health?.toLowerCase() ?? "watch"}
              </strong>
              <p>
                {data.metrics?.atRisk ?? 0} projects need attention · {data.highRisks.length} high risks
              </p>
            </div>
            {data.overloaded.map((person) => (
              <div key={person.id} className="insight-card">
                <strong>
                  {person.name} is at {person.pct}%
                </strong>
                <p>
                  {person.count} assignments this week
                </p>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
    {
      id: "align",
      title: "Strategy moving",
      caption: `${data.alignedPct}% of projects name an objective.`,
      durationMs: 5500,
      render: () => (
        <ProductFrame title="strategy / objectives" active="strategy" compact>
          <div className="mkt-mini">
            {data.objectives.map((o) => (
              <div key={o.id} className="insight-card">
                <div className="mkt-row">
                  <strong>{o.name}</strong>
                  <span>{o.progress}%</span>
                </div>
                <ProgressLine value={o.progress} />
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
  ];
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}
