"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  ChartColumn,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  FileText,
  FolderKanban,
  GitBranch,
  Landmark,
  Layers3,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Receipt,
  Scale,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Target,
  Ticket,
  Users,
  Workflow,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { clsx } from "clsx";
import { roleLabel, useAuth } from "@/lib/auth";
import { Avatar, ConfirmModal, Drawer, Field, Modal, TextSelect, TextTextarea } from "@/components/ui";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { useAppStore } from "@/lib/store";
import { formatDisplayDate } from "@/lib/seed";
import { buildAppBreadcrumbs } from "@/components/shell/breadcrumbs";
import { CommandSearch } from "@/components/shell/CommandSearch";

const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: typeof Building2; exact?: boolean }[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/app/home", label: "Home", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Align",
    items: [
      { href: "/app/strategy", label: "Strategy", icon: Target },
      { href: "/app/ideas", label: "Ideas", icon: Lightbulb },
      { href: "/app/portfolios", label: "Portfolios", icon: Layers3 },
      { href: "/app/programs", label: "Programs", icon: FolderKanban },
    ],
  },
  {
    label: "Deliver",
    items: [
      { href: "/app/projects", label: "Projects", icon: Briefcase },
      { href: "/app/work", label: "Work", icon: Workflow },
      { href: "/app/tickets", label: "Tickets", icon: Ticket },
      { href: "/app/timesheets", label: "Timesheets", icon: Clock3 },
    ],
  },
  {
    label: "Clients",
    items: [
      { href: "/app/companies", label: "Companies", icon: Building2 },
      { href: "/app/sales", label: "Sales", icon: ChartColumn },
      { href: "/app/retainers", label: "Retainers", icon: ClipboardList },
    ],
  },
  {
    label: "Govern",
    items: [
      { href: "/app/resources", label: "Resources", icon: Users },
      { href: "/app/risks", label: "Risks", icon: ShieldAlert },
      { href: "/app/dependencies", label: "Dependencies", icon: GitBranch },
      { href: "/app/governance", label: "Governance", icon: Scale },
    ],
  },
  {
    label: "Value",
    items: [
      { href: "/app/billing", label: "Billing", icon: Receipt },
      { href: "/app/benefits", label: "Benefits", icon: Landmark },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/app/reports", label: "Reports", icon: FileText },
      { href: "/app/ai", label: "Insights", icon: Sparkles },
      { href: "/app/automations", label: "Automations", icon: Zap },
    ],
  },
];

type MenuId = "create" | "profile" | "company" | null;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isInternal, logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [menu, setMenu] = useState<MenuId>(null);
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [createDefaults, setCreateDefaults] = useState<{ companyId?: string; projectId?: string; hours?: number }>({});
  const [tasksOpen, setTasksOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteCompanyId, setNoteCompanyId] = useState("");
  const [signOutOpen, setSignOutOpen] = useState(false);

  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const companies = useAppStore((s) => s.companies);
  const tickets = useAppStore((s) => s.tickets);
  const contacts = useAppStore((s) => s.contacts);
  const portfolios = useAppStore((s) => s.portfolios);
  const programs = useAppStore((s) => s.programs);
  const ideas = useAppStore((s) => s.ideas);
  const invoices = useAppStore((s) => s.invoices);
  const retainers = useAppStore((s) => s.retainers);
  const notifications = useAppStore((s) => s.notifications);
  const recentlyViewed = useAppStore((s) => s.recentlyViewed);
  const focusCompanyId = useAppStore((s) => s.focusCompanyId);
  const setFocusCompanyId = useAppStore((s) => s.setFocusCompanyId);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAll = useAppStore((s) => s.markAllNotificationsRead);

  const recordId = searchParams.get("id");
  const focusCompany = companies.find((c) => c.id === focusCompanyId) ?? null;
  const focusProject = projects.find((p) => p.companyId === focusCompanyId);

  useEffect(() => {
    if (!user) router.replace("/login");
    else if (!isInternal) router.replace("/portal");
  }, [user, isInternal, router]);

  useEffect(() => {
    if (window.localStorage.getItem("dmc-pmo-nav-collapsed") === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    setNavOpen(false);
    setMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (pathname.includes("/companies/view") && recordId) setFocusCompanyId(recordId);
    if (pathname.includes("/projects/view") && recordId) {
      const project = projects.find((p) => p.id === recordId);
      if (project) setFocusCompanyId(project.companyId);
    }
  }, [pathname, recordId, projects, setFocusCompanyId]);

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
    if (!menu) return;
    function onClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("[data-shell-menu]")) setMenu(null);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menu]);

  const myTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.assignee.includes(user?.name.split(" ").slice(-1)[0] ?? "Kim") || t.assignee === "J. Kim" || t.assignee === user?.name)
        .filter((t) => t.status !== "Done")
        .slice(0, 12),
    [tasks, user],
  );

  const searchHits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return [
      ...portfolios.filter((p) => p.name.toLowerCase().includes(q)).map((p) => ({ href: `/app/portfolios/view/?id=${p.id}`, label: p.name, type: "Portfolio" })),
      ...programs.filter((p) => p.name.toLowerCase().includes(q)).map((p) => ({ href: `/app/programs/view/?id=${p.id}`, label: p.name, type: "Program" })),
      ...projects.filter((p) => p.name.toLowerCase().includes(q)).map((p) => ({ href: `/app/projects/view/?id=${p.id}`, label: p.name, type: "Project" })),
      ...companies.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({ href: `/app/companies/view/?id=${c.id}`, label: c.name, type: "Company" })),
      ...ideas.filter((i) => i.name.toLowerCase().includes(q)).map((i) => ({ href: "/app/ideas", label: i.name, type: "Idea" })),
      ...tickets.filter((t) => t.subject.toLowerCase().includes(q) || String(t.number).includes(q)).map((t) => ({ href: `/app/tickets/view/?id=${t.id}`, label: `#${t.number} ${t.subject}`, type: "Ticket" })),
      ...contacts.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({ href: "/app/contacts", label: c.name, type: "Contact" })),
    ].slice(0, 8);
  }, [search, companies, projects, tickets, contacts, portfolios, programs, ideas]);

  const recentHits = useMemo(
    () =>
      recentlyViewed.map((item) => ({
        href:
          item.type === "project"
            ? `/app/projects/view/?id=${item.id}`
            : item.type === "company"
              ? `/app/companies/view/?id=${item.id}`
              : item.type === "ticket"
                ? `/app/tickets/view/?id=${item.id}`
                : item.type === "portfolio"
                  ? `/app/portfolios/view/?id=${item.id}`
                  : item.type === "program"
                    ? `/app/programs/view/?id=${item.id}`
                    : "/app/home",
        label: item.label,
        type: item.type.charAt(0).toUpperCase() + item.type.slice(1),
      })),
    [recentlyViewed],
  );

  const crumbs = useMemo(
    () =>
      buildAppBreadcrumbs({
        pathname,
        recordId,
        companies,
        projects,
        tickets,
        invoices,
        retainers,
        portfolios,
        programs,
      }),
    [pathname, recordId, companies, projects, tickets, invoices, retainers, portfolios, programs],
  );

  const companyChoices = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    return companies.filter((c) => !q || c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q));
  }, [companies, companyQuery]);

  if (!user || !isInternal) return null;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const unread = notifications.filter((n) => !n.read).length;

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      window.localStorage.setItem("dmc-pmo-nav-collapsed", next ? "1" : "0");
      return next;
    });
  }

  function contextDefaults(extra: typeof createDefaults = {}) {
    return {
      companyId: extra.companyId ?? focusCompanyId ?? undefined,
      projectId: extra.projectId ?? focusProject?.id,
      hours: extra.hours,
    };
  }

  function openCreate(kind: CreateKind, defaults: typeof createDefaults = {}) {
    setMenu(null);
    setCreateDefaults(contextDefaults(defaults));
    setCreateKind(kind);
  }

  return (
    <div className={clsx("app-shell", collapsed && "collapsed", navOpen && "nav-open")}>
      {navOpen ? <button type="button" className="shell-scrim" aria-label="Close navigation" onClick={() => setNavOpen(false)} /> : null}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">DMC</div>
          {!collapsed ? (
            <div className="brand-copy">
              <div className="brand-title">Dillon Morgan</div>
              <div className="brand-sub">PMO / PPM</div>
            </div>
          ) : null}
        </div>
        <nav>
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed ? <div className="nav-group">{group.label}</div> : null}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} className={clsx("nav-link", active && "active")} title={item.label}>
                    <Icon size={17} />
                    {!collapsed ? <span>{item.label}</span> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="nav-footer space-y-1">
          <button type="button" className="nav-link w-full" onClick={toggleCollapsed}>
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed ? <span>Collapse</span> : null}
          </button>
          <button type="button" className="nav-link w-full" onClick={() => setHelpOpen(true)}>
            <CircleHelp size={18} />
            {!collapsed ? <span>Help</span> : null}
          </button>
          <button
            type="button"
            className="nav-link w-full"
            onClick={() => {
              useAppStore.getState().pushToast("Feedback noted. Thank you.", "info");
            }}
          >
            <MessageSquare size={18} />
            {!collapsed ? <span>Feedback</span> : null}
          </button>
          <button type="button" className="nav-link w-full" onClick={() => setSettingsOpen(true)}>
            <Settings size={18} />
            {!collapsed ? <span>Settings</span> : null}
          </button>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div className="topbar-lead">
            <button type="button" className="icon-btn topbar-menu" aria-label="Open navigation" onClick={() => setNavOpen(true)}>
              <Menu size={18} />
            </button>
            <nav className="crumb-bar" aria-label="Breadcrumb">
              {crumbs.map((crumb, i) => (
                <span key={`${crumb.label}-${i}`} className="crumb-item">
                  {i > 0 ? <span className="crumb-sep">/</span> : null}
                  {crumb.href && i < crumbs.length - 1 ? (
                    <Link href={crumb.href} className="crumb-link">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="crumb-current">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>
          <button type="button" className="search text-left text-[var(--color-muted)]" onClick={() => setSearchOpen(true)}>
            <span className="inline-flex items-center gap-2 min-w-0">
              <Search size={15} />
              <span className="truncate">Search portfolios, projects, companies...</span>
            </span>
            <kbd className="search-kbd">⌘K</kbd>
          </button>
          <div className="topbar-actions">
            <div className="relative" data-shell-menu>
              <button
                type="button"
                className="context-btn"
                aria-expanded={menu === "company"}
                onClick={() => setMenu((v) => (v === "company" ? null : "company"))}
              >
                <Building2 size={15} />
                <span className="context-label truncate">{focusCompany?.name ?? "All companies"}</span>
                <ChevronDown size={14} />
              </button>
              {menu === "company" ? (
                <div className="menu-popover context-popover fade-in">
                  <input
                    className="field-input"
                    placeholder="Find a company"
                    value={companyQuery}
                    onChange={(e) => setCompanyQuery(e.target.value)}
                  />
                  <button
                    type="button"
                    className={clsx("menu-row", !focusCompanyId && "is-active")}
                    onClick={() => {
                      setFocusCompanyId(null);
                      setMenu(null);
                      setCompanyQuery("");
                    }}
                  >
                    All companies
                  </button>
                  {companyChoices.map((company) => (
                    <div key={company.id} className={clsx("context-row", focusCompanyId === company.id && "is-active")}>
                      <button
                        type="button"
                        className="menu-row"
                        onClick={() => {
                          setFocusCompanyId(company.id);
                          setMenu(null);
                          setCompanyQuery("");
                        }}
                      >
                        <span>
                          <span className="block font-medium">{company.name}</span>
                          <span className="text-xs text-[var(--color-muted)]">
                            {company.status} · {company.openProjects} projects
                          </span>
                        </span>
                      </button>
                      <Link
                        href={`/app/companies/view/?id=${company.id}`}
                        className="context-open"
                        onClick={() => {
                          setFocusCompanyId(company.id);
                          setMenu(null);
                        }}
                      >
                        Open
                      </Link>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            {timerRunning ? (
              <button
                type="button"
                className="btn btn-ghost text-sm"
                onClick={() => {
                  const elapsedHours = Math.max(0.25, Math.round((seconds / 3600) * 4) / 4);
                  setTimerRunning(false);
                  openCreate("time", { hours: elapsedHours });
                  setSeconds(0);
                }}
              >
                <Clock3 size={16} className="text-[var(--color-danger)]" />
                {mm}:{ss} Stop & log
              </button>
            ) : null}
            <div className="relative" data-shell-menu>
              <button type="button" className="icon-btn icon-btn-primary" aria-label="Create" onClick={() => setMenu((v) => (v === "create" ? null : "create"))}>
                <Plus size={18} />
              </button>
              {menu === "create" ? (
                <div className="menu-popover create-popover fade-in">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="menu-heading">Activities</div>
                      {[
                        ["time", "Log time"],
                        ["task", "Task"],
                        ["expense", "Expense"],
                      ].map(([k, label]) => (
                        <button key={k} type="button" className="menu-row" onClick={() => openCreate(k as CreateKind)}>
                          {label}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="menu-row"
                        onClick={() => {
                          setMenu(null);
                          setNoteCompanyId(focusCompanyId ?? companies[0]?.id ?? "");
                          setNoteText("");
                          setNoteOpen(true);
                        }}
                      >
                        Note
                      </button>
                    </div>
                    <div>
                      <div className="menu-heading">Operations</div>
                      {[
                        ["company", "Company"],
                        ["contact", "Contact"],
                        ["project", "Project"],
                        ["ticket", "Ticket"],
                        ["milestone", "Milestone"],
                        ["idea", "Idea"],
                        ["risk", "Risk"],
                      ].map(([k, label]) => (
                        <button key={k} type="button" className="menu-row" onClick={() => openCreate(k as CreateKind)}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {focusCompany ? <p className="create-hint">New records default to {focusCompany.name}.</p> : null}
                </div>
              ) : null}
            </div>
            <button type="button" className="icon-btn" aria-label="Tasks" onClick={() => setTasksOpen(true)}>
              <Briefcase size={18} />
            </button>
            <button type="button" className="icon-btn" aria-label="Schedule" onClick={() => setScheduleOpen(true)}>
              <CalendarDays size={18} />
            </button>
            <button
              type="button"
              className={clsx("icon-btn", timerRunning && "active-soft")}
              aria-label="Time"
              onClick={() => {
                setTimerRunning(true);
                setSeconds(0);
              }}
            >
              <Clock3 size={18} />
            </button>
            <button type="button" className="icon-btn relative" aria-label="Notifications" onClick={() => setNotesOpen(true)}>
              <Bell size={18} />
              {unread ? (
                <span className="notify-dot">
                  {unread}
                </span>
              ) : null}
            </button>
            <div className="relative" data-shell-menu>
              <button
                type="button"
                className="profile-btn"
                aria-expanded={menu === "profile"}
                onClick={() => setMenu((v) => (v === "profile" ? null : "profile"))}
              >
                <Avatar initials={user.initials} src={user.avatarUrl} name={user.name} />
                <span className="hidden sm:grid text-left leading-tight">
                  <span className="text-sm font-medium text-[var(--color-ink)]">{user.name.split(" ")[0]}</span>
                  <span className="text-[11px] text-[var(--color-muted)]">{roleLabel(user.role)}</span>
                </span>
                <ChevronDown size={14} className="hidden sm:block text-[var(--color-muted)]" />
              </button>
              {menu === "profile" ? (
                <div className="menu-popover profile-popover fade-in">
                  <div className="profile-card">
                    <Avatar initials={user.initials} src={user.avatarUrl} name={user.name} size={40} />
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs text-[var(--color-muted)]">{roleLabel(user.role)}</div>
                      <div className="text-xs text-[var(--color-muted)]">{user.email}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="menu-row"
                    onClick={() => {
                      setMenu(null);
                      setSettingsOpen(true);
                    }}
                  >
                    <Settings size={15} /> Settings
                  </button>
                  <Link href="/app/settings" className="menu-row" onClick={() => setMenu(null)}>
                    <Users size={15} /> Users and roles
                  </Link>
                  <button
                    type="button"
                    className="menu-row menu-row-danger"
                    onClick={() => {
                      setMenu(null);
                      setSignOutOpen(true);
                    }}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>

      <CreateForms
        key={`${createKind}-${createDefaults.hours ?? ""}-${createDefaults.projectId ?? ""}-${createDefaults.companyId ?? ""}`}
        kind={createKind}
        defaults={createDefaults}
        onClose={() => {
          setCreateKind(null);
          setCreateDefaults({});
        }}
      />

      <CommandSearch
        open={searchOpen}
        query={search}
        hits={searchHits}
        recent={recentHits}
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

      <Modal open={noteOpen} title="Activity note" onClose={() => setNoteOpen(false)}>
        <Field label="Company">
          <TextSelect value={noteCompanyId} onChange={(e) => setNoteCompanyId(e.target.value)}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Note">
          <TextTextarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="What happened?" />
        </Field>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!noteText.trim() || !noteCompanyId) return;
            useAppStore.getState().addActivityNote(noteCompanyId, `${user.name}: ${noteText.trim()}`);
            setNoteOpen(false);
            setNoteText("");
          }}
        >
          Save note
        </button>
      </Modal>

      <ConfirmModal
        open={signOutOpen}
        title="Sign out"
        body="Sign out of Dillon Morgan PMO on this device? Your workspace data stays in this browser."
        confirmLabel="Sign out"
        danger
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => {
          setSignOutOpen(false);
          logout();
        }}
      />

      <Drawer open={tasksOpen} title="My open tasks" subtitle={`${myTasks.length} assigned to you`} onClose={() => setTasksOpen(false)}>
        <div className="space-y-2">
          {myTasks.map((t) => (
            <div key={t.id} className="panel panel-hover p-3">
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-[var(--color-muted)]">{t.projectName} · due {formatDisplayDate(t.due)}</div>
              <button type="button" className="btn btn-ghost mt-2 text-sm" onClick={() => useAppStore.getState().updateTaskStatus(t.id, "Done")}>
                Mark done
              </button>
            </div>
          ))}
          {!myTasks.length ? <p className="text-sm text-[var(--color-muted)]">No open tasks.</p> : null}
          <button type="button" className="btn btn-primary w-full justify-center" onClick={() => { setTasksOpen(false); openCreate("task"); }}>
            New task
          </button>
        </div>
      </Drawer>

      <Drawer open={scheduleOpen} title="My schedule" onClose={() => setScheduleOpen(false)}>
        <div className="space-y-3">
          {tasks
            .filter((t) => t.status !== "Done")
            .slice(0, 10)
            .map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-[var(--color-muted)]">{t.projectName}</div>
                </div>
                <div className="text-xs text-[var(--color-navy)]">{formatDisplayDate(t.due)}</div>
              </div>
            ))}
          <Link href="/app/timesheets" className="btn btn-primary w-full justify-center" onClick={() => setScheduleOpen(false)}>
            Open timesheets
          </Link>
        </div>
      </Drawer>

      <Drawer open={notesOpen} title="Notifications" subtitle={unread ? `${unread} unread` : "You are caught up"} wide onClose={() => setNotesOpen(false)}>
        <div className="mb-3 flex justify-between">
          <span className="text-sm text-[var(--color-muted)]">{notifications.length} updates</span>
          <button type="button" className="text-sm font-semibold text-[var(--color-navy)]" onClick={markAll}>
            Mark all read
          </button>
        </div>
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className={clsx("notify-item", !n.read && "is-unread")}
              onClick={() => {
                markRead(n.id);
                if (n.href) router.push(n.href);
                setNotesOpen(false);
              }}
            >
              <div className="font-semibold">{n.title}</div>
              <div className="text-sm text-[var(--color-muted)]">{n.body}</div>
              <div className="mt-1 text-xs text-[var(--color-muted)]">{n.createdAt}</div>
            </button>
          ))}
        </div>
      </Drawer>

      <Drawer open={settingsOpen} title="Settings" onClose={() => setSettingsOpen(false)}>
        <div className="space-y-4 text-sm">
          <div className="panel p-3">
            <div className="font-semibold">{user.name}</div>
            <div className="text-[var(--color-muted)]">{roleLabel(user.role)} · {user.email}</div>
          </div>
          <label className="flex items-center justify-between gap-3">
            <span>Email me overdue invoice alerts</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>Friday timesheet reminder</span>
            <input type="checkbox" defaultChecked />
          </label>
          <Link href="/app/settings" className="btn btn-primary w-full justify-center" onClick={() => setSettingsOpen(false)}>
            Users & roles
          </Link>
          <Link href="/app/automations" className="btn btn-ghost w-full justify-center" onClick={() => setSettingsOpen(false)}>
            Manage automations
          </Link>
        </div>
      </Drawer>

      <Drawer open={helpOpen} title="Help" onClose={() => setHelpOpen(false)}>
        <div className="space-y-3 text-sm text-[var(--color-muted)]">
          <p>Home answers whether the firm is on the right work, with the right people, cost, and risk.</p>
          <p>Create (+) still adds companies, projects, tickets, tasks, ideas, and risks.</p>
          <p>The company selector sets workspace context for new records. It does not hide other companies.</p>
          <p>Client portal users only see their company projects, tickets, billing, and retainers.</p>
          <Link href="/app/automations" className="btn btn-primary w-full justify-center" onClick={() => setHelpOpen(false)}>
            Open automations
          </Link>
        </div>
      </Drawer>
    </div>
  );
}
