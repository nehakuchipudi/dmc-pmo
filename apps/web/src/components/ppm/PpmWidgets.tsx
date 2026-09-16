"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { StatusPill, statusTone } from "@/components/ui";

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  return (
    <div className={clsx("metric-card", tone !== "default" && `metric-card-${tone}`)}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {hint ? <div className="metric-hint">{hint}</div> : null}
    </div>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="metric-grid">{children}</div>;
}

export function ProgressLine({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-line">
      <div className="progress-line-track">
        <div className="progress-line-fill" style={{ width: `${pct}%` }} />
      </div>
      {label ? <span className="progress-line-label">{label}</span> : <span className="progress-line-label">{pct}%</span>}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length ? <p className="empty-row">{empty ?? "Nothing here yet."}</p> : null}
    </div>
  );
}

export function Pill({ value }: { value: string }) {
  return <StatusPill tone={statusTone(value)}>{value}</StatusPill>;
}
