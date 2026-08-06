"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClipboardList, LayoutDashboard, Receipt, Ticket } from "lucide-react";
import { clsx } from "clsx";
import { companies } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/ui";

const NAV = [
  { href: "/portal", label: "Projects", icon: LayoutDashboard, exact: true },
  { href: "/portal/tickets", label: "Tickets", icon: Ticket },
  { href: "/portal/billing", label: "Billing", icon: Receipt },
  { href: "/portal/retainers", label: "Retainers", icon: ClipboardList },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { user, isClient, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const company = companies.find((c) => c.id === user?.companyId);

  useEffect(() => {
    if (!user) router.replace("/login");
    else if (!isClient) router.replace("/app/companies");
  }, [user, isClient, router]);

  if (!user || !isClient) return null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">{company?.name.toUpperCase() ?? "CLIENT"}</div>
          <div className="brand-sub">CLIENT PORTAL</div>
        </div>
        <nav>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx("nav-link", active && "active")}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="nav-footer text-xs text-white/60 px-3">
          Powered by Dillon Morgan Consulting
        </div>
      </aside>
      <div className="main-col">
        <header className="topbar" style={{ gridTemplateColumns: "1fr auto" }}>
          <input className="search" placeholder="Search my projects & tickets..." />
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-2 py-1"
            onClick={logout}
            title="Sign out"
          >
            <Avatar initials={user.initials} />
          </button>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
