"use client";

import type { ReactNode } from "react";
import {
  Briefcase,
  Building2,
  ClipboardList,
  Clock3,
  FileText,
  Layers3,
  LayoutDashboard,
  Lightbulb,
  Receipt,
  Target,
  Ticket,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

const SIDE_ITEMS = [
  { label: "Home", icon: LayoutDashboard, key: "home" },
  { label: "Projects", icon: Briefcase, key: "projects" },
  { label: "Work", icon: Workflow, key: "work" },
  { label: "Tickets", icon: Ticket, key: "tickets" },
  { label: "Timesheets", icon: Clock3, key: "timesheets" },
  { label: "Resources", icon: Users, key: "resources" },
  { label: "Companies", icon: Building2, key: "companies" },
  { label: "Retainers", icon: ClipboardList, key: "retainers" },
  { label: "Billing", icon: Receipt, key: "billing" },
  { label: "Reports", icon: FileText, key: "reports" },
  { label: "Automations", icon: Zap, key: "automations" },
  { label: "Strategy", icon: Target, key: "strategy" },
  { label: "Ideas", icon: Lightbulb, key: "ideas" },
  { label: "Portfolios", icon: Layers3, key: "portfolio" },
];

export function ProductFrame({
  title,
  active = "home",
  children,
  compact = false,
}: {
  title: string;
  active?: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={clsx("mkt-product", compact && "mkt-product-compact")}>
      <aside className="mkt-product-side" aria-hidden="true">
        <div className="mkt-product-brand">
          <span className="brand-mark !mb-0">DMC</span>
          <div>
            <div className="mkt-product-brand-title">DMC PMO</div>
            <div className="mkt-product-brand-sub">Portfolio</div>
          </div>
        </div>
        <nav>
          {SIDE_ITEMS.map((item) => (
            <SideLink key={item.key} item={item} active={active} />
          ))}
        </nav>
      </aside>
      <div className="mkt-product-main">
        <header className="mkt-product-top">
          <div className="mkt-product-crumb">{title}</div>
          <div className="mkt-product-search">Search portfolios, projects, companies...</div>
          <div className="mkt-product-user">DM</div>
        </header>
        <div className="mkt-product-body">{children}</div>
      </div>
    </div>
  );
}

function SideLink({
  item,
  active,
}: {
  item: (typeof SIDE_ITEMS)[number];
  active: string;
}) {
  const Icon = item.icon;
  return (
    <div className={clsx("mkt-product-link", active === item.key && "active")}>
      <Icon size={14} />
      <span>{item.label}</span>
    </div>
  );
}
