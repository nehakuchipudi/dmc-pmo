"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, LayoutDashboard, Receipt, Search, Ticket } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth";
import { Avatar, Drawer } from "@/components/ui";
import { useAppStore } from "@/lib/store";

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
  const companies = useAppStore((s) => s.companies);
  const projects = useAppStore((s) => s.projects);
  const tickets = useAppStore((s) => s.tickets);
  const company = companies.find((c) => c.id === user?.companyId);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) router.replace("/login");
    else if (!isClient) router.replace("/app/companies");
  }, [user, isClient, router]);

  const hits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !user?.companyId) return [];
    return [
      ...projects
        .filter((p) => p.companyId === user.companyId && p.portalShared && p.name.toLowerCase().includes(q))
        .map((p) => ({ label: p.name, type: "Project", href: "/portal" })),
      ...tickets
        .filter((t) => t.companyId === user.companyId && (t.subject.toLowerCase().includes(q) || String(t.number).includes(q)))
        .map((t) => ({ label: `#${t.number} ${t.subject}`, type: "Ticket", href: "/portal/tickets" })),
    ].slice(0, 8);
  }, [search, projects, tickets, user?.companyId]);

  if (!user || !isClient) return null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CP</div>
          <div className="brand-title">{company?.name ?? "Client"}</div>
          <div className="brand-sub">Client portal</div>
        </div>
        <nav>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={clsx("nav-link", active && "active")}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="nav-footer text-xs text-white/60 px-3">Powered by Dillon Morgan Consulting</div>
      </aside>
      <div className="main-col">
        <header className="topbar" style={{ gridTemplateColumns: "1fr auto" }}>
          <button type="button" className="search text-left text-[var(--color-muted)]" onClick={() => setSearchOpen(true)}>
            <span className="inline-flex items-center gap-2">
              <Search size={15} /> Search my projects and tickets...
            </span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-2 py-1"
            onClick={logout}
            title="Sign out"
          >
            <Avatar initials={user.initials} src={user.avatarUrl} name={user.name} />
          </button>
        </header>
        <main className="content">{children}</main>
      </div>
      <Drawer open={searchOpen} title="Search" onClose={() => setSearchOpen(false)}>
        <input
          className="field-input mb-3"
          autoFocus
          placeholder="Type to search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="space-y-2">
          {hits.map((hit) => (
            <button
              key={hit.label}
              type="button"
              className="panel w-full p-3 text-left"
              onClick={() => {
                router.push(hit.href);
                setSearchOpen(false);
                setSearch("");
              }}
            >
              <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{hit.type}</div>
              <div className="font-medium">{hit.label}</div>
            </button>
          ))}
          {search && !hits.length ? <p className="text-sm text-[var(--color-muted)]">No matches.</p> : null}
        </div>
      </Drawer>
    </div>
  );
}
