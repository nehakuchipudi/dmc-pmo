"use client";

import { clsx } from "clsx";
import { Star } from "lucide-react";
import type { ReactNode } from "react";
import { IfCan } from "@/components/auth/IfCan";
import { StatusPill, statusTone } from "@/components/ui";

export function RecordActionButtons({
  favorite,
  onActivity,
  onEdit,
  onPortal,
  onFavorite,
  onNewProject,
}: {
  favorite: boolean;
  onActivity: () => void;
  onEdit: () => void;
  onPortal: () => void;
  onFavorite: () => void;
  onNewProject: () => void;
}) {
  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={onActivity}>
        Add activity
      </button>
      <button type="button" className="btn btn-ghost" onClick={onEdit}>
        Edit
      </button>
      <button type="button" className="btn btn-ghost" onClick={onPortal}>
        Portal
      </button>
      <button type="button" className="btn btn-ghost" aria-pressed={favorite} onClick={onFavorite}>
        <Star size={14} fill={favorite ? "currentColor" : "none"} />
        Favorite
      </button>
      <IfCan cap="create_project">
        <button type="button" className="btn btn-primary" onClick={onNewProject}>
          New project
        </button>
      </IfCan>
    </>
  );
}

export function RecordShell({
  breadcrumb,
  title,
  subtitle,
  actions,
  stepper,
  banner,
  rail,
  children,
  wide = false,
}: {
  breadcrumb: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  stepper?: ReactNode;
  banner?: ReactNode;
  rail: ReactNode;
  children: ReactNode;
  wide?: boolean;
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
      <div className={clsx("record-grid", wide && "is-wide")}>
        {wide ? null : <aside className="record-rail">{rail}</aside>}
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
