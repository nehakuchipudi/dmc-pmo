"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, Trash2, X } from "lucide-react";
import { clsx } from "clsx";

export function PricingSheet({ children }: { children: ReactNode }) {
  return <section className="pricing-sheet">{children}</section>;
}

export function PricingTitle({ children }: { children: ReactNode }) {
  return <h1 className="pricing-title">{children}</h1>;
}

export function PricingToolbar({ children }: { children: ReactNode }) {
  return <div className="pricing-toolbar">{children}</div>;
}

export function PricingOutlineBtn({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="pricing-outline-btn" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function PricingAddMenu({
  label,
  items,
  disabled,
}: {
  label: string;
  items: { id: string; label: string; onSelect: () => void }[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="pricing-add" ref={wrap}>
      <button type="button" className="pricing-outline-btn" onClick={() => setOpen((value) => !value)} disabled={disabled}>
        {label}
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="pricing-add-menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PricingToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="pricing-toggle">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={clsx("pricing-switch", checked && "is-on")}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
      <span>{label}</span>
    </label>
  );
}

export function PricingInactiveSearch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={clsx("pricing-inactive-search", checked && "is-on")}
      onClick={() => onChange(!checked)}
    >
      <Search size={14} />
      Show Inactive
    </button>
  );
}

export function PricingTable({
  columns,
  children,
}: {
  columns: { key: string; label: string; width?: string }[];
  children: ReactNode;
}) {
  return (
    <div className="pricing-table-wrap">
      <table className="pricing-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={column.width ? { width: column.width } : undefined}>
                {column.label}
              </th>
            ))}
            <th className="pricing-table-action" />
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function PricingTitleLink({
  children,
  onClick,
  checked,
}: {
  children: ReactNode;
  onClick: () => void;
  checked?: boolean;
}) {
  return (
    <button type="button" className="pricing-title-link" onClick={onClick}>
      <span>{children}</span>
      {checked ? (
        <span className="pricing-check-dot" aria-label="Active">
          <Check size={10} />
        </span>
      ) : null}
    </button>
  );
}

export function PricingRemoveBtn({
  label,
  kind = "x",
  onClick,
  disabled,
}: {
  label: string;
  kind?: "x" | "trash";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="pricing-remove" onClick={onClick} aria-label={label} disabled={disabled}>
      {kind === "trash" ? <Trash2 size={15} /> : <X size={16} />}
    </button>
  );
}

export function PricingForm({
  title,
  onCancel,
  onSave,
  canEdit,
  children,
}: {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  canEdit: boolean;
  children: ReactNode;
}) {
  return (
    <section className="pricing-sheet">
      <div className="pricing-form-head">
        <h1 className="pricing-title">{title}</h1>
        <button type="button" className="pricing-cancel" onClick={onCancel}>
          <X size={14} />
          Cancel
        </button>
      </div>
      <form
        className="pricing-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (canEdit) onSave();
        }}
      >
        {children}
        {canEdit ? (
          <div className="pricing-form-actions">
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        ) : null}
      </form>
    </section>
  );
}

export function PricingField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="pricing-field">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

export function PricingCheckField({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="pricing-field pricing-field-check">
      <span>{label}</span>
      <label className="pricing-check">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
        <span>{hint}</span>
      </label>
    </div>
  );
}

export function PricingEmpty({ children }: { children: ReactNode }) {
  return <p className="pricing-empty">{children}</p>;
}
