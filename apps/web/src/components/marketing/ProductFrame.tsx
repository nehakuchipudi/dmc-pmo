"use client";

import type { ReactNode } from "react";
import {
  Briefcase,
  LayoutDashboard,
  Layers3,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { clsx } from "clsx";

const SIDE_ITEMS = [
  { label: "Home", icon: LayoutDashboard, key: "home" },
  { label: "Strategy", icon: Target, key: "strategy" },
  { label: "Portfolios", icon: Layers3, key: "portfolio" },
  { label: "Projects", icon: Briefcase, key: "projects" },
  { label: "Resources", icon: Users, key: "resources" },
  { label: "Risks", icon: ShieldAlert, key: "risks" },
  { label: "Governance", icon: Scale, key: "governance" },
  { label: "Insights", icon: Sparkles, key: "ai" },
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
          <div className="mkt-product-group">Overview</div>
          {SIDE_ITEMS.slice(0, 1).map((item) => (
            <SideLink key={item.key} item={item} active={active} />
          ))}
          <div className="mkt-product-group">Align</div>
          {SIDE_ITEMS.slice(1, 3).map((item) => (
            <SideLink key={item.key} item={item} active={active} />
          ))}
          <div className="mkt-product-group">Deliver</div>
          {SIDE_ITEMS.slice(3, 4).map((item) => (
            <SideLink key={item.key} item={item} active={active} />
          ))}
          <div className="mkt-product-group">Govern</div>
          {SIDE_ITEMS.slice(4).map((item) => (
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
