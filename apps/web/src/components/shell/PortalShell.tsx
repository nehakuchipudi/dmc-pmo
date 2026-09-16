"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ClipboardList, LayoutDashboard, LogOut, Receipt, Search, Ticket } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth";
import { Avatar, ConfirmModal } from "@/components/ui";
import { useAppStore } from "@/lib/store";
import { CommandSearch } from "@/components/shell/CommandSearch";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  useEffect(() => {
    if (!user) router.replace("/login");
    else if (!isClient) router.replace("/app/companies");
  }, [user, isClient, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    function onClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("[data-shell-menu]")) setProfileOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [profileOpen]);

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

  const crumb = NAV.find((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)))?.label ?? "Portal";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CP</div>
          <div className="brand-copy">
            <div className="brand-title">{company?.name ?? "Client"}</div>
            <div className="brand-sub">Client portal</div>
          </div>
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
        <header className="topbar topbar-portal">
          <nav className="crumb-bar" aria-label="Breadcrumb">
            <span className="crumb-current">{company?.name ?? "Portal"}</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">{crumb}</span>
          </nav>
          <button type="button" className="search text-left text-[var(--color-muted)]" onClick={() => setSearchOpen(true)}>
            <span className="inline-flex items-center gap-2">
              <Search size={15} /> Search my projects and tickets...
            </span>
            <kbd className="search-kbd">⌘K</kbd>
          </button>
          <div className="relative" data-shell-menu>
            <button type="button" className="profile-btn" onClick={() => setProfileOpen((v) => !v)}>
              <Avatar initials={user.initials} src={user.avatarUrl} name={user.name} />
              <span className="hidden sm:inline text-sm font-medium">{user.name.split(" ")[0]}</span>
              <ChevronDown size={14} className="text-[var(--color-muted)]" />
            </button>
            {profileOpen ? (
              <div className="menu-popover profile-popover fade-in">
                <div className="profile-card">
                  <Avatar initials={user.initials} src={user.avatarUrl} name={user.name} size={40} />
                  <div>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-[var(--color-muted)]">{company?.name ?? "Client portal"}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="menu-row menu-row-danger"
                  onClick={() => {
                    setProfileOpen(false);
                    setSignOutOpen(true);
                  }}
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
      <CommandSearch
        open={searchOpen}
        query={search}
        hits={hits}
        recent={[]}
        onQuery={setSearch}
        onClose={() => {
          setSearchOpen(false);
          setSearch("");
        }}
        onOpen={(href) => {
          router.push(href);
          setSearchOpen(false);
          setSearch("");
        }}
      />
      <ConfirmModal
        open={signOutOpen}
        title="Sign out"
        body="Sign out of the client portal on this device?"
        confirmLabel="Sign out"
        danger
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => {
          setSignOutOpen(false);
          logout();
        }}
      />
    </div>
  );
}
