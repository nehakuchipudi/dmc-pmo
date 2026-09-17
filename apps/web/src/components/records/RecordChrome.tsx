"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { StatusPill, statusTone } from "@/components/ui";

export function RecordShell({
  breadcrumb,
  title,
  subtitle,
  actions,
  stepper,
  banner,
  rail,
  children,
}: {
  breadcrumb: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  stepper?: ReactNode;
  banner?: ReactNode;
  rail: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="fade-in record-page">
      <div className="record-crumb sr-only">{breadcrumb}</div>
      <div className="record-head">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle ? <div className="record-sub">{subtitle}</div> : null}
        </div>
        {actions ? <div className="record-actions">{actions}</div> : null}
      </div>
      {stepper}
      {banner}
      <div className="record-grid">
        <aside className="record-rail">{rail}</aside>
        <div className="record-main">{children}</div>
      </div>
    </div>
  );
}

export function RecordRailBlock({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="record-rail-block">
      <div className="record-rail-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusStepper<T extends string>({
  steps,
  value,
  onChange,
}: {
  steps: T[];
  value: T;
  onChange: (next: T) => void;
}) {
  const current = Math.max(0, steps.indexOf(value));
  return (
    <div className="status-stepper" role="tablist" aria-label="Record status">
      {steps.map((step, i) => (
        <button
          key={step}
          type="button"
          role="tab"
          aria-selected={value === step}
          className={clsx("status-step", i <= current && "is-done", value === step && "is-current")}
          onClick={() => onChange(step)}
        >
          {step}
        </button>
      ))}
    </div>
  );
}

export function RecordFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="record-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function RecordMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="record-metric">
      <div className="record-metric-value">{value}</div>
      <div className="record-metric-label">{label}</div>
      {hint ? <div className="record-metric-hint">{hint}</div> : null}
    </div>
  );
}

export function TonePill({ value }: { value: string }) {
  return <StatusPill tone={statusTone(value)}>{value}</StatusPill>;
}
