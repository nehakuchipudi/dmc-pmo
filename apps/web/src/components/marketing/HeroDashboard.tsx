"use client";

import { useMemo, useState } from "react";
import { Pill, ProgressLine } from "@/components/ppm/PpmWidgets";
import { ProductFrame } from "./ProductFrame";
import type { LandingData } from "./useLandingData";

const MODULES = [
  { id: "health", label: "Portfolio health" },
  { id: "budget", label: "Budget" },
  { id: "status", label: "Project status" },
  { id: "resources", label: "Resource utilization" },
  { id: "risks", label: "Risks" },
  { id: "alignment", label: "Strategic alignment" },
  { id: "milestones", label: "Milestones" },
  { id: "timeline", label: "Portfolio timeline" },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

const RANGE_START = new Date("2026-06-01").getTime();
const RANGE_END = new Date("2026-09-20").getTime();
const RANGE = RANGE_END - RANGE_START;

function barStyle(start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const left = Math.max(0, ((s - RANGE_START) / RANGE) * 100);
  const width = Math.max(8, ((e - s) / RANGE) * 100);
  return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
}

export function HeroDashboard({ data }: { data: LandingData }) {
  const [focus, setFocus] = useState<ModuleId>("health");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const project = useMemo(
    () => data.projects.find((p) => p.id === selectedProject) ?? data.projects[0],
    [data.projects, selectedProject],
  );

  return (
    <div className="mkt-hero-dash">
      <ProductFrame title="home / portfolio" active="home">
        <div className="mkt-dash-head">
          <div>
            <div className="mkt-dash-kicker">Executive view</div>
            <h3 className="mkt-dash-title">{data.delivery?.name ?? "Client Delivery 2026"}</h3>
          </div>
          <div className="mkt-dash-owner">Owner {data.delivery?.owner ?? "M. Doyle"}</div>
        </div>

        <div className="mkt-dash-metrics" role="tablist" aria-label="Executive dashboard modules">
          <DashMetric
            id="health"
            focus={focus}
            onFocus={setFocus}
            label="Portfolio health"
            value={data.metrics?.health ?? "Watch"}
            hint={`${data.metrics?.atRisk ?? 0} projects need attention`}
            tone={data.metrics?.health === "Healthy" ? "good" : data.metrics?.health === "Critical" ? "bad" : "warn"}
          />
          <DashMetric
            id="budget"
            focus={focus}
            onFocus={setFocus}
            label="Budget"
            value={data.metrics ? data.money(data.metrics.invested) : "-"}
            hint={data.metrics ? `${data.metrics.margin}% blended margin` : "No portfolio"}
            tone={(data.metrics?.margin ?? 0) >= 28 ? "good" : "warn"}
          />
          <DashMetric
            id="status"
            focus={focus}
            onFocus={setFocus}
            label="Project status"
            value={`${data.statusCounts.onTrack} on track`}
            hint={`${data.statusCounts.atRisk} at risk · ${data.statusCounts.overdue} overdue`}
            tone={data.statusCounts.overdue ? "bad" : data.statusCounts.atRisk ? "warn" : "good"}
          />
          <DashMetric
            id="resources"
            focus={focus}
            onFocus={setFocus}
            label="Resource utilization"
            value={data.overloaded.length ? `${data.overloaded.length} over` : "In band"}
            hint={data.overloaded.length ? data.overloaded.map((o) => o.name).join(", ") : "No one above 100%"}
            tone={data.overloaded.length ? "bad" : "good"}
          />
          <DashMetric
            id="risks"
            focus={focus}
            onFocus={setFocus}
            label="Risks"
            value={data.highRisks.length}
            hint={`${data.issues.length} open issues · ${data.blocked.length} blocked links`}
            tone={data.highRisks.length > 2 ? "bad" : data.highRisks.length ? "warn" : "good"}
          />
          <DashMetric
            id="alignment"
            focus={focus}
            onFocus={setFocus}
            label="Strategic alignment"
            value={`${data.alignedPct}%`}
            hint={`${data.benefitAvg}% benefit realization`}
            tone={data.alignedPct >= 80 ? "good" : "warn"}
          />
        </div>

        <div className="mkt-dash-tabs" role="tablist" aria-label="Dashboard views">
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              type="button"
              role="tab"
              aria-selected={focus === mod.id}
              className={focus === mod.id ? "active" : undefined}
              onClick={() => setFocus(mod.id)}
            >
              {mod.label}
            </button>
          ))}
        </div>

        <div className="mkt-dash-split">
          <div className="mkt-dash-panel">
            {focus === "health" || focus === "status" ? (
              <StatusPanel data={data} selected={project.id} onSelect={setSelectedProject} />
            ) : null}
            {focus === "budget" ? <BudgetPanel data={data} selected={project.id} onSelect={setSelectedProject} /> : null}
            {focus === "resources" ? <ResourcePanel data={data} /> : null}
            {focus === "risks" ? <RiskPanel data={data} /> : null}
            {focus === "alignment" ? <AlignmentPanel data={data} /> : null}
            {focus === "milestones" ? <MilestonePanel data={data} /> : null}
            {focus === "timeline" ? (
              <TimelinePanel data={data} selected={project.id} onSelect={setSelectedProject} />
            ) : null}
          </div>
          <aside className="mkt-dash-inspector">
            <div className="mkt-dash-kicker">Selected project</div>
            <div className="mkt-dash-inspector-title">{project.name}</div>
            <div className="mkt-dash-inspector-meta">
              {project.companyName} · {project.manager}
            </div>
            <div className="mkt-dash-inspector-row">
              <span>Status</span>
              <Pill value={project.status} />
            </div>
            <div className="mkt-dash-inspector-row">
              <span>Progress</span>
              <ProgressLine value={project.progress} />
            </div>
            <div className="mkt-dash-inspector-row">
              <span>Budget</span>
              <strong>{data.money(project.budgetAmount)}</strong>
            </div>
            <div className="mkt-dash-inspector-row">
              <span>Hours</span>
              <strong>
                {project.loggedHours}/{project.budgetHours}
              </strong>
            </div>
            <div className="mkt-dash-inspector-row">
              <span>Margin</span>
              <strong>{project.marginPct}%</strong>
            </div>
            <p className="mkt-dash-inspector-copy">{project.description}</p>
          </aside>
        </div>
      </ProductFrame>
    </div>
  );
}

function DashMetric({
  id,
  label,
  value,
  hint,
  tone,
  focus,
  onFocus,
}: {
  id: ModuleId;
  label: string;
  value: string | number;
  hint: string;
  tone: "good" | "warn" | "bad";
  focus: ModuleId;
  onFocus: (id: ModuleId) => void;
}) {
  return (
    <button
      type="button"
      className={`mkt-dash-metric metric-card metric-card-${tone} ${focus === id ? "is-focus" : ""}`}
      onClick={() => onFocus(id)}
    >
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-hint">{hint}</div>
    </button>
  );
}

function StatusPanel({
  data,
  selected,
  onSelect,
}: {
  data: LandingData;
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <h4>Programs in flight</h4>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Program</th>
              <th>Owner</th>
              <th>Health</th>
              <th>Projects</th>
            </tr>
          </thead>
          <tbody>
            {data.programs.map((program) => {
              const items = data.projects.filter((p) => program.projectIds.includes(p.id));
              const health = items.some((p) => p.status === "Overdue")
                ? "Critical"
                : items.some((p) => p.status === "At Risk")
                  ? "Watch"
                  : "Healthy";
              return (
                <tr key={program.id}>
                  <td className="font-semibold">{program.name}</td>
                  <td>{program.owner}</td>
                  <td>
                    <Pill value={health} />
                  </td>
                  <td>{items.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h4 className="mt-4">Project status</h4>
      <div className="mkt-status-list">
        {data.projects.map((p) => (
          <button
            key={p.id}
            type="button"
            className={selected === p.id ? "is-on" : undefined}
            onClick={() => onSelect(p.id)}
          >
            <span>{p.name}</span>
            <Pill value={p.status} />
            <ProgressLine value={p.progress} />
          </button>
        ))}
      </div>
    </>
  );
}

function BudgetPanel({
  data,
  selected,
  onSelect,
}: {
  data: LandingData;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const spent = data.projects.reduce((sum, p) => sum + p.budgetAmount, 0);
  const book = data.delivery?.budget ?? spent;
  return (
    <>
      <h4>Investment book</h4>
      <p className="mkt-panel-copy">
        {data.money(spent)} committed against a {data.money(book)} portfolio envelope. Hours used{" "}
        {data.metrics?.hoursUsed ?? 0} of {data.metrics?.hoursBudget ?? 0}.
      </p>
      <div className="mkt-budget-bars">
        {data.projects.map((p) => (
          <button
            key={p.id}
            type="button"
            className={selected === p.id ? "is-on" : undefined}
            onClick={() => onSelect(p.id)}
          >
            <div className="mkt-budget-row">
              <span>{p.name}</span>
              <strong>{data.money(p.budgetAmount)}</strong>
            </div>
            <div className="mkt-bar">
              <i style={{ width: `${Math.min(100, (p.budgetAmount / 160000) * 100)}%` }} />
            </div>
            <div className="mkt-budget-meta">
              Margin {p.marginPct}% · {p.loggedHours}/{p.budgetHours} hrs
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function ResourcePanel({ data }: { data: LandingData }) {
  return (
    <>
      <h4>Team load this week</h4>
      <div className="mkt-resource-list">
        {data.capacity.map((person) => (
          <div key={person.id} className={person.pct > 100 ? "is-hot" : undefined}>
            <div className="mkt-budget-row">
              <span>{person.name}</span>
              <strong>{person.pct}%</strong>
            </div>
            <div className="mkt-bar">
              <i style={{ width: `${Math.min(person.pct, 140)}%` }} />
            </div>
            <div className="mkt-budget-meta">
              {person.hours} hrs · {person.count} assignments
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function RiskPanel({ data }: { data: LandingData }) {
  return (
    <>
      <h4>Open risk and issues</h4>
      <div className="mkt-risk-list">
        {data.risks.map((risk) => (
          <div key={risk.id} className="insight-card">
            <div className="mkt-budget-row">
              <span className="font-semibold">{risk.title}</span>
              <Pill value={risk.impact} />
            </div>
            <div className="mkt-budget-meta">
              {risk.owner} · {risk.status} · due {risk.due}
            </div>
          </div>
        ))}
        {data.issues.map((issue) => (
          <div key={issue.id} className="insight-card">
            <div className="mkt-budget-row">
              <span className="font-semibold">{issue.title}</span>
              <Pill value={issue.severity} />
            </div>
            <div className="mkt-budget-meta">
              Issue · {issue.owner} · {issue.status}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AlignmentPanel({ data }: { data: LandingData }) {
  return (
    <>
      <h4>Objectives and benefits</h4>
      <div className="mkt-align-list">
        {data.objectives.map((o) => (
          <div key={o.id} className="insight-card">
            <div className="mkt-budget-row">
              <span className="font-semibold">
                {o.code} {o.name}
              </span>
              <Pill value={o.status} />
            </div>
            <ProgressLine value={o.progress} />
            <div className="mkt-budget-meta">{o.target}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function MilestonePanel({ data }: { data: LandingData }) {
  return (
    <>
      <h4>Upcoming milestones and gates</h4>
      <div className="mkt-align-list">
        {data.milestones.slice(0, 6).map((m) => (
          <div key={m.id} className="insight-card">
            <div className="mkt-budget-row">
              <span className="font-semibold">{m.name}</span>
              <Pill value={m.status} />
            </div>
            <div className="mkt-budget-meta">
              Due {m.due} · {data.projects.find((p) => p.id === m.projectId)?.name}
            </div>
          </div>
        ))}
        {data.pendingGates.map((gate) => (
          <div key={gate.id} className="insight-card">
            <div className="mkt-budget-row">
              <span className="font-semibold">{gate.name}</span>
              <Pill value={gate.status} />
            </div>
            <div className="mkt-budget-meta">
              {gate.stage} · due {gate.due} · {gate.owner}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TimelinePanel({
  data,
  selected,
  onSelect,
}: {
  data: LandingData;
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <h4>Portfolio timeline</h4>
      <div className="mkt-gantt-scale">
        <span>Jun</span>
        <span>Jul</span>
        <span>Aug</span>
        <span>Sep</span>
      </div>
      <div className="mkt-gantt">
        {data.projects.map((p) => (
          <button
            key={p.id}
            type="button"
            className={selected === p.id ? "is-on" : undefined}
            onClick={() => onSelect(p.id)}
          >
            <span>{p.name}</span>
            <div className="mkt-gantt-track">
              <i className={`is-${p.status.replace(" ", "-").toLowerCase()}`} style={barStyle(p.start, p.due)} />
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
