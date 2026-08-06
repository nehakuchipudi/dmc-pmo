"use client";

import { clsx } from "clsx";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useAppStore } from "@/lib/store";

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
  if (["active", "on track", "paid", "approved", "resolved", "enabled", "done", "sent"].includes(s)) {
    return "success";
  }
  if (["prospect", "at risk", "in progress", "review", "awaiting your review", "awaiting signoff", "submitted", "draft", "pending", "qualify", "propose", "negotiate"].includes(s)) {
    return "warning";
  }
  if (["overdue", "overdue inv.", "urgent", "rejected", "failed"].includes(s)) {
    return "danger";
  }
  if (["open", "high", "medium", "queued"].includes(s)) return "info";
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
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3 fade-in">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
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

export function SideRail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="panel p-4">
      <div className="mb-3 text-xs font-semibold tracking-[0.1em] text-[var(--color-muted)] uppercase">
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
      <span className="text-sm tabular-nums text-[var(--color-muted)]">{value}%</span>
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 border-b border-[var(--color-border)]">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={clsx("tab", active === tab && "active")}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={clsx("modal-panel fade-in", wide && "modal-wide")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-ink)]">{title}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)]">{title}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}

export function ToastHost() {
  const toasts = useAppStore((s) => s.toasts);
  const dismiss = useAppStore((s) => s.dismissToast);
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          className={clsx("toast", t.tone === "danger" && "toast-danger", t.tone === "info" && "toast-info")}
          onClick={() => dismiss(t.id)}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block text-[var(--color-muted)]">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="field-input" {...props} />;
}

export function TextSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="field-input" {...props} />;
}

export function TextTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="field-input min-h-24" {...props} />;
}
