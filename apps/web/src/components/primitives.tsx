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
  if (["active", "on track", "paid", "approved", "resolved", "enabled", "done", "sent", "completed", "opened", "invoiced", "healthy", "achieved", "converted"].includes(s)) {
    return "success";
  }
  if (["prospect", "at risk", "in progress", "review", "awaiting your review", "awaiting signoff", "submitted", "draft", "pending", "qualify", "propose", "negotiate", "planned", "planning", "watch", "scoring", "mitigating", "in review", "lagging"].includes(s)) {
    return "warning";
  }
  if (["overdue", "overdue inv.", "urgent", "rejected", "failed", "critical", "blocked", "cancelled"].includes(s)) {
    return "danger";
  }
  if (["open", "high", "medium", "queued", "upcoming", "deferred", "on hold"].includes(s)) return "info";
  return "neutral";
}

export function avatarUrlFor(seed: string) {
  return `https://i.pravatar.cc/128?u=${encodeURIComponent(seed)}`;
}

export function Avatar({
  initials,
  src,
  name,
  size = 34,
}: {
  initials: string;
  src?: string;
  name?: string;
  size?: number;
}) {
  const photo = src || (name ? avatarUrlFor(name) : undefined);
  return (
    <span className="avatar" style={{ width: size, height: size }} title={name}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="avatar-photo"
          src={photo}
          alt={name ?? initials}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const parent = e.currentTarget.parentElement;
            if (parent && !parent.querySelector("[data-fallback]")) {
              const span = document.createElement("span");
              span.dataset.fallback = "1";
              span.textContent = initials;
              parent.appendChild(span);
            }
          }}
        />
      ) : (
        initials
      )}
    </span>
  );
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
    <div className="page-header fade-in">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
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
  xl,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  xl?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={clsx("modal-panel fade-in", wide && "modal-wide", xl && "modal-xl")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="modal-copy">{body}</p>
      <div className="confirm-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={clsx("btn", danger ? "btn-danger" : "btn-primary")} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function Drawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className={clsx("drawer-panel", wide && "drawer-wide")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
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
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 flex items-center justify-between gap-2 text-[var(--color-muted)]">
        <span>{label}</span>
        {required ? <span className="field-required">Required</span> : null}
      </span>
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
