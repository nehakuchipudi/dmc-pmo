"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

export function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "info" | "neutral";
  children: ReactNode;
}) {
  return <span className={clsx("pill", `pill-${tone}`)}>{children}</span>;
}

export function statusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  const s = status.toLowerCase();
  if (["active", "on track", "paid", "approved", "resolved", "enabled", "done"].includes(s)) {
    return "success";
  }
  if (["prospect", "at risk", "in progress", "sent", "review", "awaiting your review"].includes(s)) {
    return "warning";
  }
  if (["overdue", "overdue inv.", "urgent", "danger"].includes(s)) {
    return "danger";
  }
  if (["open", "high", "medium"].includes(s)) return "info";
  return "neutral";
}

export function Avatar({ initials }: { initials: string }) {
  return <span className="avatar">{initials}</span>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 fade-in">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function FilterChips({
  items,
  active,
  onChange,
}: {
  items: string[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={clsx("filter-chip", active === item && "active")}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function SideRail({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="panel p-4">
      <div className="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--color-muted)] uppercase">
        {title}
      </div>
      {children}
    </aside>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="progress flex-1">
        <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="text-sm text-[var(--color-muted)]">{value}%</span>
    </div>
  );
}
