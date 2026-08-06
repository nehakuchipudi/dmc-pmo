"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase,
  Building2,
  CalendarDays,
  ChartColumn,
  CircleHelp,
  ClipboardList,
  Clock3,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Receipt,
  Settings,
  Ticket,
  Workflow,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { clsx } from "clsx";
import { roleLabel, useAuth } from "@/lib/auth";
import { Avatar } from "@/components/ui";

const NAV = [
  { href: "/app/companies", label: "Companies", icon: Building2 },
  { href: "/app/sales", label: "Sales", icon: ChartColumn },
  { href: "/app/projects", label: "Projects", icon: LayoutDashboard },
  { href: "/app/tickets", label: "Tickets", icon: Ticket },
  { href: "/app/retainers", label: "Retainers", icon: ClipboardList },
  { href: "/app/work", label: "Work", icon: Workflow },
  { href: "/app/billing", label: "Billing", icon: Receipt },
  { href: "/app/reports", label: "Reports", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isInternal, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!user) router.replace("/login");
    else if (!isInternal) router.replace("/portal");
  }, [user, isInternal, router]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  if (!user || !isInternal) return null;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className={clsx("app-shell", collapsed && "collapsed")}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">{collapsed ? "DMC" : "DILLON MORGAN"}</div>
          {!collapsed ? <div className="brand-sub">PMO</div> : null}
        </div>
        <nav>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx("nav-link", active && "active")}
                title={item.label}
              >
                <Icon size={18} />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="nav-footer space-y-1">
          <button
            type="button"
            className="nav-link w-full"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed ? <span>Collapse</span> : null}
          </button>
          <button type="button" className="nav-link w-full">
            <CircleHelp size={18} />
            {!collapsed ? <span>Help</span> : null}
          </button>
          <button type="button" className="nav-link w-full">
            <MessageSquare size={18} />
            {!collapsed ? <span>Feedback</span> : null}
          </button>
          <button type="button" className="nav-link w-full">
            <Settings size={18} />
            {!collapsed ? <span>Settings</span> : null}
          </button>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div className="text-sm text-[var(--color-muted)] truncate">
            {pathname.replace("/app/", "").split("/").join(" / ") || "Home"}
          </div>
          <input
            className="search"
            placeholder="Search companies, projects, tickets, contacts..."
          />
          <div className="relative flex items-center gap-2 justify-end">
            {timerRunning ? (
              <button
                type="button"
                className="btn btn-ghost text-sm"
                onClick={() => setTimerRunning(false)}
              >
                <Clock3 size={16} className="text-[var(--color-danger)]" />
                {mm}:{ss}
              </button>
            ) : null}
            <div className="relative">
              <button
                type="button"
                className="btn btn-ghost"
                aria-label="Create"
                onClick={() => setCreateOpen((v) => !v)}
              >
                <Plus size={18} />
              </button>
              {createOpen ? (
                <div className="absolute right-0 top-12 z-30 w-[360px] panel p-4 fade-in">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="mb-2 text-xs font-semibold tracking-wide text-[var(--color-muted)] uppercase">
                        Activities & Communication
                      </div>
                      {["Note", "Email", "Meeting", "Task"].map((x) => (
                        <button key={x} type="button" className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-[var(--color-bg)]">
                          {x}
                        </button>
                      ))}
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-semibold tracking-wide text-[var(--color-muted)] uppercase">
                        CRM & Operations
                      </div>
                      {["Company", "Contact", "Sale", "Project", "Ticket", "Retainer", "Expense", "New Idea", "Asset"].map(
                        (x) => (
                          <button key={x} type="button" className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-[var(--color-bg)]">
                            {x}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <button type="button" className="btn btn-ghost" aria-label="Tasks">
              <Briefcase size={18} />
            </button>
            <button type="button" className="btn btn-ghost" aria-label="Schedule">
              <CalendarDays size={18} />
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              aria-label="Time"
              onClick={() => {
                setTimerRunning(true);
                setSeconds(0);
              }}
            >
              <Clock3 size={18} />
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-2 py-1"
              onClick={logout}
              title={`${user.name} (${roleLabel(user.role)}). Click to sign out.`}
            >
              <Avatar initials={user.initials} />
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
