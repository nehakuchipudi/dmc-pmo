"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  ArrowRight,
  Brain,
  Briefcase,
  Building2,
  Compass,
  Layers3,
  Lock,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { useAuth } from "@/lib/auth";
import { HeroDashboard } from "./HeroDashboard";
import { ProductFilm, type FilmScene } from "./ProductFilm";
import { ProductFrame } from "./ProductFrame";
import { useLandingData } from "./useLandingData";

const NAV = [
  { href: "#platform", label: "Platform" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#ai", label: "Intelligence" },
  { href: "#security", label: "Security" },
];

const FEATURES = [
  {
    id: "portfolio",
    title: "Portfolio Management",
    icon: Layers3,
    body: "See every program and project in one investment book, with health, budget, and strategic fit in the same view.",
  },
  {
    id: "projects",
    title: "Project Management",
    icon: Briefcase,
    body: "Run WBS, Gantt, tickets, and client-visible status from the same project record your PMO already governs.",
  },
  {
    id: "resources",
    title: "Resource Management",
    icon: Users,
    body: "Spot overload before a new start date steals time from an in-flight program.",
  },
  {
    id: "finance",
    title: "Financial Management",
    icon: Wallet,
    body: "Track committed budget, hours, margin, and overdue cash against the portfolio envelope.",
  },
  {
    id: "risks",
    title: "Risk & Issues",
    icon: ShieldAlert,
    body: "Raise, score, and mitigate risks next to the projects and dependencies they can stall.",
  },
  {
    id: "governance",
    title: "Governance",
    icon: Scale,
    body: "Stage gates, intake scoring, and decision logs so leadership reviews are evidence, not theater.",
  },
  {
    id: "strategy",
    title: "Strategy Alignment",
    icon: Target,
    body: "Map work to objectives and benefits so the portfolio answers whether strategy is actually moving.",
  },
  {
    id: "ai",
    title: "PMO Intelligence",
    icon: Brain,
    body: "Surface the exceptions a director should see this week: risk, capacity, gates, and cash.",
  },
];

const CHALLENGES = [
  {
    title: "The portfolio lives in slides",
    body: "Status is assembled by hand the night before the steering meeting. By morning it is already stale.",
  },
  {
    title: "Capacity is a rumor",
    body: "The same specialist is booked on three critical paths. Nobody sees the collision until a date slips.",
  },
  {
    title: "Risk arrives as a surprise",
    body: "Issues sit in inboxes. Dependencies are tribal knowledge. Leadership hears about them after the damage.",
  },
  {
    title: "Strategy and delivery do not meet",
    body: "Objectives live in a deck. Projects live in a tracker. Nobody can prove the work is buying the outcome.",
  },
];

const ROLES = [
  {
    role: "Leadership",
    view: "Portfolio health, alignment, and decisions that need a signature this week.",
  },
  {
    role: "PMO lead",
    view: "Intake, gates, standards, and a single book of work across every client program.",
  },
  {
    role: "Project manager",
    view: "Plans, milestones, tickets, and client-safe status without a second system.",
  },
  {
    role: "Delivery staff",
    view: "Assigned work, timesheets, and a clear view of what is blocked.",
  },
  {
    role: "Finance",
    view: "Budget, invoices, retainers, and margin against the live project record.",
  },
  {
    role: "Client sponsor",
    view: "A portal scoped to their company: status, files, and invoices they are allowed to see.",
  },
];

export function LandingPage() {
  const data = useLandingData();
  const { user, isClient } = useAuth();
  const appHref = user ? (isClient ? "/portal" : "/app/home") : "/login";

  const tourScenes = useMemo(() => buildTourScenes(data), [data]);
  const aiScenes = useMemo(() => buildAiScenes(data), [data]);
  const execScenes = useMemo(() => buildExecScenes(data), [data]);

  return (
    <div className="mkt">
      <header className="mkt-nav">
        <Link href="/" className="mkt-nav-brand">
          <span className="brand-mark !mb-0">DMC</span>
          <span>
            <strong>DMC PMO</strong>
            <em>Dillon Morgan Consulting</em>
          </span>
        </Link>
        <nav className="mkt-nav-links">
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mkt-nav-actions">
          {user ? (
            <Link href={appHref} className="btn btn-primary">
              Open workspace
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                Sign in
              </Link>
              <Link href="/login" className="btn btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="mkt-hero" id="hero">
        <div className="mkt-wrap mkt-hero-grid">
          <div className="mkt-hero-copy">
            <p className="mkt-eyebrow">Enterprise PMO and PPM</p>
            <h1>Turn Projects Into Business Outcomes.</h1>
            <p className="mkt-lead">
              DMC PMO gives organizations one intelligent platform to plan, prioritize, govern, and deliver their entire
              project portfolio.
            </p>
            <div className="mkt-hero-cta">
              <Link href="/login" className="btn btn-primary mkt-btn-lg">
                Get Started <ArrowRight size={18} />
              </Link>
              <a href="#platform" className="btn btn-ghost mkt-btn-lg">
                Explore the Platform
              </a>
            </div>
            <p className="mkt-hero-note">Live product data. Same workspace your team will use after sign-in.</p>
          </div>
          <HeroDashboard data={data} />
        </div>
      </section>

      <section className="mkt-trusted" id="trusted">
        <div className="mkt-wrap">
          <p className="mkt-eyebrow">Trusted, enterprise-ready</p>
          <h2>Built for leadership reviews, not another status spreadsheet.</h2>
          <p className="mkt-section-lead">
            DMC PMO is the operating system Dillon Morgan Consulting uses to run client delivery, internal enablement,
            and governance in one steel-and-slate workspace.
          </p>
          <div className="mkt-trust-grid">
            {[
              ["Single book of work", "Portfolios, programs, and projects share one record."],
              ["Role isolation", "Staff, finance, leadership, and clients see only their lane."],
              ["Client-safe portal", "Sponsors get status without internal notes or other tenants."],
              ["Identity-ready", "Demo roles today. Microsoft Entra ID on the production path."],
            ].map(([title, body]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <div className="mkt-wordmarks" aria-label="Industries PMOs already run">
            {["Manufacturing", "Retail", "Logistics", "Professional services", "Technology"].map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-band" id="tour">
        <div className="mkt-wrap mkt-split">
          <div>
            <p className="mkt-eyebrow">Watch the platform</p>
            <h2>A 45 second walk through the live executive view.</h2>
            <p className="mkt-section-lead">
              These films are not stock footage. They play the same Client Delivery 2026 book, risks, and capacity your
              demo workspace already holds. Pause, scrub, or jump chapters.
            </p>
          </div>
          <ProductFilm title="Executive portfolio tour" scenes={tourScenes} autoPlayOnView />
        </div>
      </section>

      <section className="mkt-section" id="challenges">
        <div className="mkt-wrap">
          <p className="mkt-eyebrow">PMO challenges</p>
          <h2>The work is not the hard part. Seeing it is.</h2>
          <div className="mkt-card-grid">
            {CHALLENGES.map((item) => (
              <article key={item.title} className="mkt-card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section-fog" id="platform">
        <div className="mkt-wrap">
          <p className="mkt-eyebrow">Platform overview</p>
          <h2>Everything Your PMO Needs. One Platform.</h2>
          <p className="mkt-section-lead">
            Eight capabilities, one project identity. Strategy, delivery, clients, and value sit on the same steel
            workspace instead of eight tools that drift apart.
          </p>
          <div className="mkt-feature-grid">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <a key={feature.id} href={`#${feature.id}`} className="mkt-feature">
                  <Icon size={20} />
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <FeatureBlock
        id="portfolio"
        kicker="Portfolio management"
        title="One investment book for every program in flight."
        body="Client Delivery 2026 and Firm Enablement share the same model: owner, theme, envelope, mapped projects, and the objectives they are supposed to move."
        points={[
          "Health rolls up from live project status, not a weekly color chosen by hand.",
          "Programs group client work so a warehouse, vendor, and website stay one story.",
          "Leadership can open the book and ask what to stop, start, or fund next.",
        ]}
      >
        <ProductFrame title="portfolios / client delivery 2026" active="portfolio" compact>
          <div className="mkt-mini">
            {data.portfolios.map((pf) => (
              <div key={pf.id} className="insight-card">
                <div className="mkt-budget-row">
                  <strong>{pf.name}</strong>
                  <span>{data.money(pf.budget)}</span>
                </div>
                <p className="mkt-budget-meta">{pf.description}</p>
              </div>
            ))}
          </div>
        </ProductFrame>
      </FeatureBlock>

      <FeatureBlock
        id="projects"
        reverse
        kicker="Project management"
        title="Plans, tickets, and client status on the same project."
        body="WBS, Gantt, files, and portal sharing stay attached to the project ID the portfolio already governs. Delivery teams do not retype status for the PMO."
        points={[
          "Progress, hours, and margin stay visible next to the plan.",
          "Client-visible notes stay separate from internal ones.",
          "The same record feeds billing, risks, and gates.",
        ]}
      >
        <ProductFrame title="projects / q3 warehouse rollout" active="projects" compact>
          <div className="mkt-mini">
            {data.projects.map((p) => (
              <div key={p.id} className="insight-card">
                <div className="mkt-budget-row">
                  <strong>{p.name}</strong>
                  <Pill value={p.status} />
                </div>
                <ProgressLine value={p.progress} />
                <p className="mkt-budget-meta">
                  {p.companyName} · {p.manager} · {data.money(p.budgetAmount)}
                </p>
              </div>
            ))}
          </div>
        </ProductFrame>
      </FeatureBlock>

      <FeatureBlock
        id="resources"
        kicker="Resource management"
        title="See who is over 100% before you say yes."
        body="Allocations roll up by person across every project. When S. Cho is on fleet and POS in the same week, the collision is a fact, not a hallway conversation."
        points={[
          "Hours and percent load in one heat view.",
          "Overloaded names surface on the executive home.",
          "New work can be refused with evidence, not instinct.",
        ]}
      >
        <ProductFrame title="resources / capacity" active="resources" compact>
          <div className="mkt-mini">
            {data.capacity.map((person) => (
              <div key={person.id} className={`insight-card ${person.pct > 100 ? "is-hot" : ""}`}>
                <div className="mkt-budget-row">
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
      </FeatureBlock>

      <FeatureBlock
        id="finance"
        reverse
        kicker="Financial management"
        title="Budget, hours, invoices, and margin in the same conversation."
        body="The portfolio envelope, project budgets, logged hours, and overdue invoices are not a month-end export. Finance and delivery read one number."
        points={[
          `${data.metrics ? data.money(data.metrics.invested) : "$0"} currently committed on client delivery.`,
          `${data.money(data.overdueCash)} sitting in overdue invoices on the live book.`,
          "Retainers and progress bills stay tied to the company and project.",
        ]}
      >
        <ProductFrame title="billing / invoices" active="home" compact>
          <div className="mkt-mini">
            {data.invoices.map((inv) => (
              <div key={inv.id} className="insight-card">
                <div className="mkt-budget-row">
                  <strong>{inv.number}</strong>
                  <Pill value={inv.status} />
                </div>
                <p className="mkt-budget-meta">
                  {inv.companyName} · {data.money(inv.amount)} · due {inv.due}
                </p>
              </div>
            ))}
          </div>
        </ProductFrame>
      </FeatureBlock>

      <FeatureBlock
        id="risks"
        kicker="Risk and issue management"
        title="Risks sit next to the work they can stop."
        body="Probability, impact, owner, and mitigation live on the project and program. Blocked dependencies are not a sidebar in a chat thread."
        points={[
          "High impact items roll to the executive home automatically.",
          "Issues and risks share the same delivery context.",
          "Cross-project holds are first-class records.",
        ]}
      >
        <ProductFrame title="risks / open items" active="risks" compact>
          <div className="mkt-mini">
            {data.highRisks.map((risk) => (
              <div key={risk.id} className="insight-card">
                <div className="mkt-budget-row">
                  <strong>{risk.title}</strong>
                  <Pill value={risk.impact} />
                </div>
                <p className="mkt-budget-meta">{risk.mitigation}</p>
              </div>
            ))}
          </div>
        </ProductFrame>
      </FeatureBlock>

      <FeatureBlock
        id="governance"
        reverse
        kicker="Governance"
        title="Stage gates with criteria, owners, and due dates."
        body="A warehouse go-live, a design review, and a fleet continue/stop decision are not calendar invites. They are gates the PMO can audit."
        points={[
          "In Review and Upcoming gates appear on portfolio home.",
          "Criteria are written down before the meeting starts.",
          "Ideas score for fit, value, and risk before they become projects.",
        ]}
      >
        <ProductFrame title="governance / stage gates" active="governance" compact>
          <div className="mkt-mini">
            {data.gates.map((gate) => (
              <div key={gate.id} className="insight-card">
                <div className="mkt-budget-row">
                  <strong>{gate.name}</strong>
                  <Pill value={gate.status} />
                </div>
                <p className="mkt-budget-meta">
                  {gate.stage} · {gate.owner} · {gate.due}
                </p>
              </div>
            ))}
          </div>
        </ProductFrame>
      </FeatureBlock>

      <FeatureBlock
        id="strategy"
        kicker="Strategy alignment"
        title="Every project should be able to name the objective it serves."
        body="Objectives, benefits, and programs share identifiers. If a project cannot point to an outcome, it is optional work wearing a serious name."
        points={[
          `${data.alignedPct}% of active projects are mapped to a program and objective.`,
          `${data.benefitAvg}% average benefit realization against target.`,
          "Lagging objectives are visible before the quarter story is rewritten.",
        ]}
      >
        <ProductFrame title="strategy / objectives" active="strategy" compact>
          <div className="mkt-mini">
            {data.objectives.map((o) => (
              <div key={o.id} className="insight-card">
                <div className="mkt-budget-row">
                  <strong>
                    {o.code} {o.name}
                  </strong>
                  <Pill value={o.status} />
                </div>
                <ProgressLine value={o.progress} />
              </div>
            ))}
          </div>
        </ProductFrame>
      </FeatureBlock>

      <section className="mkt-section mkt-section-fog" id="ai">
        <div className="mkt-wrap mkt-split">
          <div>
            <p className="mkt-eyebrow">AI PMO intelligence</p>
            <h2>Ask what needs a decision, not for another slide.</h2>
            <p className="mkt-section-lead">
              Insights reads the live book: portfolio health, overloaded people, overdue cash, blocked dependencies, and
              gates waiting in review. The film below is that briefing, played as a customer would watch it.
            </p>
            <ul className="mkt-points">
              <li>Exception-first, not a dump of every green project.</li>
              <li>Each insight links back to the record a person can fix.</li>
              <li>Same language the executive home already uses.</li>
            </ul>
          </div>
          <ProductFilm title="Weekly intelligence briefing" eyebrow="AI film" scenes={aiScenes} />
        </div>
      </section>

      <section className="mkt-section" id="dashboard">
        <div className="mkt-wrap">
          <p className="mkt-eyebrow">Executive dashboard preview</p>
          <h2>The view directors actually open on Monday.</h2>
          <p className="mkt-section-lead">
            Portfolio health, budget, status, utilization, risk, alignment, milestones, and the timeline. Click through
            the live board in the hero, or watch the film of a steering-ready pass.
          </p>
          <ProductFilm title="Monday steering pass" eyebrow="Dashboard film" scenes={execScenes} autoPlayOnView />
        </div>
      </section>

      <section className="mkt-section mkt-section-fog" id="roles">
        <div className="mkt-wrap">
          <p className="mkt-eyebrow">Role-based experience</p>
          <h2>One platform. Six honest viewpoints.</h2>
          <div className="mkt-role-grid">
            {ROLES.map((item) => (
              <article key={item.role} className="mkt-card">
                <h3>{item.role}</h3>
                <p>{item.view}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section" id="security">
        <div className="mkt-wrap mkt-split">
          <div>
            <p className="mkt-eyebrow">Security and enterprise readiness</p>
            <h2>Isolation first. Identity next. Spreadsheets never.</h2>
            <p className="mkt-section-lead">
              The preview already separates internal work from the Cascade portal tenant. Production is designed for
              Microsoft Entra ID for staff and Entra External ID for portal contacts.
            </p>
          </div>
          <div className="mkt-secure-grid">
            {[
              { icon: Lock, title: "Role isolation", body: "Admin, PM, staff, finance, leadership, and client lanes." },
              { icon: Building2, title: "Tenant-safe portal", body: "A client never sees another company's files or invoices." },
              { icon: Compass, title: "Audit-friendly records", body: "Gates, risks, time, and invoices keep owners and dates." },
              { icon: Sparkles, title: "Identity-ready path", body: "Demo roles now. Entra-backed sign-in on the production plan." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="mkt-card">
                  <Icon size={18} />
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mkt-final" id="cta">
        <div className="mkt-wrap">
          <p className="mkt-eyebrow">Start with the live book</p>
          <h2>Turn projects into outcomes your board can see.</h2>
          <p>
            Open the Dillon Morgan demo as leadership, a project manager, delivery staff, or a Cascade sponsor. The
            landing page is the product, not a mock.
          </p>
          <div className="mkt-hero-cta">
            <Link href="/login" className="btn btn-primary mkt-btn-lg">
              Get Started <ArrowRight size={18} />
            </Link>
            <a href="#platform" className="btn btn-ghost mkt-btn-lg">
              Explore the Platform
            </a>
          </div>
        </div>
      </section>

      <footer className="mkt-footer">
        <div className="mkt-wrap mkt-footer-grid">
          <div>
            <div className="mkt-nav-brand">
              <span className="brand-mark !mb-0">DMC</span>
              <span>
                <strong>DMC PMO</strong>
                <em>Dillon Morgan Consulting</em>
              </span>
            </div>
            <p>Plan, prioritize, govern, and deliver the portfolio from one intelligent platform.</p>
          </div>
          <div>
            <h4>Platform</h4>
            <a href="#portfolio">Portfolio</a>
            <a href="#projects">Projects</a>
            <a href="#resources">Resources</a>
            <a href="#ai">Intelligence</a>
          </div>
          <div>
            <h4>Enterprise</h4>
            <a href="#governance">Governance</a>
            <a href="#security">Security</a>
            <a href="#roles">Roles</a>
            <Link href="/login">Sign in</Link>
          </div>
          <div>
            <h4>Firm</h4>
            <p>Dillon Morgan Consulting</p>
            <p>PMO and client delivery</p>
            <p>Demo environment</p>
          </div>
        </div>
        <div className="mkt-wrap mkt-footer-base">
          <span>© 2026 Dillon Morgan Consulting</span>
          <span>Preview workspace. Not a production tenant.</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureBlock({
  id,
  kicker,
  title,
  body,
  points,
  children,
  reverse = false,
}: {
  id: string;
  kicker: string;
  title: string;
  body: string;
  points: string[];
  children: ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="mkt-section" id={id}>
      <div className={`mkt-wrap mkt-split ${reverse ? "is-reverse" : ""}`}>
        <div>
          <p className="mkt-eyebrow">{kicker}</p>
          <h2>{title}</h2>
          <p className="mkt-section-lead">{body}</p>
          <ul className="mkt-points">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        {children}
      </div>
    </section>
  );
}

function buildTourScenes(data: ReturnType<typeof useLandingData>): FilmScene[] {
  return [
    {
      id: "health",
      title: "Portfolio health",
      caption: `${data.delivery?.name ?? "Client Delivery"} is ${data.metrics?.health ?? "Watch"} with ${data.metrics?.atRisk ?? 0} items needing a look.`,
      durationMs: 7000,
      render: () => (
        <ProductFrame title="home / portfolio health" active="home" compact>
          <div className="mkt-film-metrics">
            <FilmMetric label="Health" value={data.metrics?.health ?? "Watch"} />
            <FilmMetric label="Aligned" value={`${data.alignedPct}%`} />
            <FilmMetric label="Margin" value={`${data.metrics?.margin ?? 0}%`} />
            <FilmMetric label="High risks" value={String(data.highRisks.length)} />
          </div>
        </ProductFrame>
      ),
    },
    {
      id: "budget",
      title: "Budget",
      caption: `${data.metrics ? data.money(data.metrics.invested) : "$0"} invested against the live envelope.`,
      durationMs: 7000,
      render: () => (
        <ProductFrame title="home / budget" active="portfolio" compact>
          <div className="mkt-mini">
            {data.projects.slice(0, 4).map((p) => (
              <div key={p.id} className="insight-card">
                <div className="mkt-budget-row">
                  <strong>{p.name}</strong>
                  <span>{data.money(p.budgetAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
    {
      id: "resources",
      title: "Resource utilization",
      caption: data.overloaded.length
        ? `${data.overloaded.map((o) => o.name).join(", ")} over 100% this week.`
        : "Capacity is inside the band.",
      durationMs: 7000,
      render: () => (
        <ProductFrame title="resources / load" active="resources" compact>
          <div className="mkt-mini">
            {data.capacity.slice(0, 4).map((person) => (
              <div key={person.id} className="insight-card">
                <div className="mkt-budget-row">
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
    {
      id: "risks",
      title: "Risks and gates",
      caption: `${data.highRisks.length} high risks and ${data.pendingGates.length} gates waiting on a decision.`,
      durationMs: 7000,
      render: () => (
        <ProductFrame title="govern / risks" active="risks" compact>
          <div className="mkt-mini">
            {data.highRisks.slice(0, 3).map((risk) => (
              <div key={risk.id} className="insight-card">
                <strong>{risk.title}</strong>
                <p className="mkt-budget-meta">{risk.mitigation}</p>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
    {
      id: "align",
      title: "Strategic alignment",
      caption: `${data.alignedPct}% of projects named an objective. Benefits average ${data.benefitAvg}%.`,
      durationMs: 7000,
      render: () => (
        <ProductFrame title="strategy / objectives" active="strategy" compact>
          <div className="mkt-mini">
            {data.objectives.map((o) => (
              <div key={o.id} className="insight-card">
                <div className="mkt-budget-row">
                  <strong>{o.code}</strong>
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

function buildAiScenes(data: ReturnType<typeof useLandingData>): FilmScene[] {
  return [
    {
      id: "brief",
      title: "Exception brief",
      caption: "Start with what is not green. Leave the healthy work in the book.",
      durationMs: 6500,
      render: () => (
        <ProductFrame title="insights / brief" active="ai" compact>
          <div className="mkt-mini">
            <div className="insight-card">
              <strong>
                {data.delivery?.name} is {data.metrics?.health?.toLowerCase()}
              </strong>
              <p className="mkt-budget-meta">
                {data.metrics?.items.length} projects, {data.metrics?.atRisk} need attention, margin {data.metrics?.margin}%.
              </p>
            </div>
            {data.overloaded.slice(0, 2).map((person) => (
              <div key={person.id} className="insight-card">
                <strong>
                  {person.name} is allocated at {person.pct}%
                </strong>
                <p className="mkt-budget-meta">
                  {person.count} assignments, {person.hours} hours this week.
                </p>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
    {
      id: "cash",
      title: "Cash and delivery",
      caption: `${data.money(data.overdueCash)} overdue. Finance and PMO see the same invoices.`,
      durationMs: 6500,
      render: () => (
        <ProductFrame title="insights / cash" active="ai" compact>
          <div className="mkt-mini">
            {data.invoices
              .filter((i) => i.status === "Overdue")
              .map((inv) => (
                <div key={inv.id} className="insight-card">
                  <strong>
                    {inv.number} · {data.money(inv.amount)}
                  </strong>
                  <p className="mkt-budget-meta">
                    {inv.companyName} · due {inv.due}
                  </p>
                </div>
              ))}
          </div>
        </ProductFrame>
      ),
    },
    {
      id: "decide",
      title: "Needs a decision",
      caption: "Gates in review are the Monday agenda, already written.",
      durationMs: 6500,
      render: () => (
        <ProductFrame title="insights / decisions" active="ai" compact>
          <div className="mkt-mini">
            {data.pendingGates.map((gate) => (
              <div key={gate.id} className="insight-card">
                <div className="mkt-budget-row">
                  <strong>{gate.name}</strong>
                  <Pill value={gate.status} />
                </div>
                <p className="mkt-budget-meta">{gate.criteria}</p>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
  ];
}

function buildExecScenes(data: ReturnType<typeof useLandingData>): FilmScene[] {
  return [
    {
      id: "status",
      title: "Project status",
      caption: `${data.statusCounts.onTrack} on track, ${data.statusCounts.atRisk} at risk, ${data.statusCounts.overdue} overdue.`,
      durationMs: 6000,
      render: () => (
        <ProductFrame title="home / status" active="home" compact>
          <div className="mkt-mini">
            {data.projects.map((p) => (
              <div key={p.id} className="insight-card">
                <div className="mkt-budget-row">
                  <strong>{p.name}</strong>
                  <Pill value={p.status} />
                </div>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
    {
      id: "miles",
      title: "Milestones",
      caption: "Phase gates and sign-offs stay on the same calendar as the portfolio.",
      durationMs: 6000,
      render: () => (
        <ProductFrame title="home / milestones" active="projects" compact>
          <div className="mkt-mini">
            {data.milestones.slice(0, 5).map((m) => (
              <div key={m.id} className="insight-card">
                <div className="mkt-budget-row">
                  <strong>{m.name}</strong>
                  <Pill value={m.status} />
                </div>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
    {
      id: "time",
      title: "Portfolio timeline",
      caption: "Jun through Sep on one track, using the real start and due dates.",
      durationMs: 7000,
      render: () => (
        <ProductFrame title="home / timeline" active="programs" compact>
          <div className="mkt-mini">
            {data.projects.map((p) => (
              <div key={p.id} className="insight-card">
                <strong>{p.name}</strong>
                <p className="mkt-budget-meta">
                  {p.start} to {p.due}
                </p>
              </div>
            ))}
          </div>
        </ProductFrame>
      ),
    },
  ];
}

function FilmMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}
