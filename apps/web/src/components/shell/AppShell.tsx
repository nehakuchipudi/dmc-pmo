"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Contact,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Gift,
  Layers,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Plus,
  Receipt,
  Repeat,
  ScrollText,
  Search,
  Settings,
  Shield,
  Sparkles,
  Ticket,
  Timer,
  UserRound,
  Users,
  UsersRound,
  Workflow,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { clsx } from "clsx";
import { roleLabel, useAuth } from "@/lib/auth";
import { Avatar, ConfirmModal, Drawer, Field, Modal, TextSelect, TextTextarea } from "@/components/ui";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { AccessDenied } from "@/components/shell/AccessDenied";
import { canAccessHref, canCreateKind } from "@/lib/rbac";
import { NAV_GROUP_ORDER, NAV_GROUPS, NAV_MODULES, PACKS, hasPack, packForHref } from "@/lib/modules";
import { canUsePack } from "@/lib/service-ops";
import { useAppStore } from "@/lib/store";
import { formatDisplayDate } from "@/lib/seed";
import { buildAppBreadcrumbs } from "@/components/shell/breadcrumbs";
import { CommandSearch } from "@/components/shell/CommandSearch";
import { HelpSupport, HelpTrigger } from "@/components/help/HelpSupport";
import { timerClock } from "@/lib/timesheet-work";

const NAV_ICONS: Record<string, typeof Building2> = {
  "/app/home": LayoutDashboard,
  "/app/projects": Briefcase,
  "/app/work": Workflow,
  "/app/tickets": Ticket,
  "/app/timesheets": Clock3,
  "/app/ideas": Lightbulb,
  "/app/automations": Zap,
  "/app/resources": Users,
  "/app/team": UsersRound,
  "/app/employee": UserRound,
  "/app/roles": Shield,
  "/app/work-journey": Map,
  "/app/work-orders": ClipboardCheck,
  "/app/recurring-services": Repeat,
  "/app/documents": FolderOpen,
  "/app/work-schedule": CalendarRange,
  "/app/scheduling": CalendarClock,
  "/app/approvals": BadgeCheck,
  "/app/companies": Building2,
  "/app/contacts": Contact,
  "/app/retainers": ClipboardList,
  "/app/billing": Receipt,
  "/app/quotes": FileSpreadsheet,
  "/app/reports": FileText,
  "/app/analytics": BarChart3,
  "/app/instances": Layers,
  "/app/promotional-trial": Gift,
  "/app/audit": ScrollText,
};

function deniedModuleName(pathname: string) {
  if (pathname.startsWith("/app/settings")) return "Settings";
  if (pathname.startsWith("/app/strategy")) return "Strategy";
  if (pathname.startsWith("/app/portfolios")) return "Portfolios";
  const pack = packForHref(pathname);
  const match = NAV_MODULES.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.label ?? (pack ? PACKS.find((item) => item.id === pack)?.label : undefined);
}

type MenuId = "create" | "profile" | "company" | "time" | "tasks" | "schedule" | "notifications" | "help" | null;

function hoverMenuProps(
  id: Exclude<MenuId, null>,
  setMenu: (value: MenuId | ((current: MenuId) => MenuId)) => void,
  timer: { current: number },
) {
  return {
    onMouseEnter: () => {
      window.clearTimeout(timer.current);
      setMenu(id);
    },
    onMouseLeave: () => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setMenu((current) => (current === id ? null : current));
      }, 180);
    },
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isInternal, logout, can } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(() => [...NAV_GROUP_ORDER]);
  const [menu, setMenu] = useState<MenuId>(null);
  const hoverTimer = useRef(0);
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [createDefaults, setCreateDefaults] = useState<{
    companyId?: string;
    projectId?: string;
    milestoneId?: string;
    taskId?: string;
    workKind?: "project" | "phase" | "task" | "subtask";
    hours?: number;
  }>({});
  const [tasksOpen, setTasksOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<"guide" | "chat">("guide");

  function openHelp(tab: "guide" | "chat" = "guide") {
    setHelpTab(tab);
    setHelpOpen(true);
  }
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [now, setNow] = useState(Date.now());
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
  const ideas = useAppStore((s) => s.ideas);
  const objectives = useAppStore((s) => s.objectives);
  const invoices = useAppStore((s) => s.invoices);
  const retainers = useAppStore((s) => s.retainers);
  const notifications = useAppStore((s) => s.notifications);
  const recentlyViewed = useAppStore((s) => s.recentlyViewed);
  const focusCompanyId = useAppStore((s) => s.focusCompanyId);
  const setFocusCompanyId = useAppStore((s) => s.setFocusCompanyId);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAll = useAppStore((s) => s.markAllNotificationsRead);
  const timeTimers = useAppStore((s) => s.timeTimers);
  const showTimeTimers = useAppStore((s) => s.showTimeTimers);
  const startTimeTimer = useAppStore((s) => s.startTimeTimer);
  const stopTimeTimer = useAppStore((s) => s.stopTimeTimer);
  const setShowTimeTimers = useAppStore((s) => s.setShowTimeTimers);
  const workOrders = useAppStore((s) => s.workOrders);
  const enabledPacks = useAppStore((s) => s.enabledPacks);
  const rolePacks = useAppStore((s) => s.rolePacks);

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
    if (!timeTimers.length) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timeTimers.length]);

  useEffect(() => {
    setNavOpen(false);
    setMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (pathname.includes("/companies/view") && recordId) setFocusCompanyId(recordId);
    if (pathname.includes("/contacts/view") && recordId) {
      const contact = contacts.find((c) => c.id === recordId);
      if (contact) setFocusCompanyId(contact.companyId);
    }
    if (pathname.includes("/projects/view") && recordId) {
      const project = projects.find((p) => p.id === recordId);
      if (project) setFocusCompanyId(project.companyId);
    }
  }, [pathname, recordId, contacts, projects, setFocusCompanyId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.key === "?" || (e.shiftKey && e.key === "/")) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.closest("input, textarea, select, [contenteditable='true']")) return;
        e.preventDefault();
        openHelp("guide");
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
      ...projects.filter((p) => p.name.toLowerCase().includes(q)).map((p) => ({ href: `/app/projects/view/?id=${p.id}`, label: p.name, type: "Project" })),
      ...companies.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({ href: `/app/companies/view/?id=${c.id}`, label: c.name, type: "Company" })),
      ...ideas.filter((i) => i.name.toLowerCase().includes(q)).map((i) => ({ href: `/app/ideas/view/?id=${i.id}`, label: i.name, type: "Idea" })),
      ...objectives.filter((o) => o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q)).map((o) => ({ href: `/app/strategy/view/?id=${o.id}`, label: `${o.code} ${o.name}`, type: "Objective" })),
      ...tickets.filter((t) => t.subject.toLowerCase().includes(q) || String(t.number).includes(q)).map((t) => ({ href: `/app/tickets/view/?id=${t.id}`, label: `#${t.number} ${t.subject}`, type: "Ticket" })),
      ...contacts.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({ href: `/app/contacts/view/?id=${c.id}`, label: c.name, type: "Contact" })),
      ...workOrders.filter((row) => row.title.toLowerCase().includes(q)).map((row) => ({ href: "/app/work-orders", label: row.title, type: "Work order" })),
    ].filter((hit) => canAccessHref(user?.role, hit.href) && canUsePack(packForHref(hit.href), enabledPacks, user?.role, rolePacks)).slice(0, 8);
  }, [search, companies, projects, tickets, contacts, portfolios, ideas, objectives, workOrders, enabledPacks, rolePacks, user]);

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
                  : item.type === "contact"
                      ? `/app/contacts/view/?id=${item.id}`
                      : item.type === "idea"
                        ? `/app/ideas/view/?id=${item.id}`
                        : item.type === "objective"
                          ? `/app/strategy/view/?id=${item.id}`
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
        contacts,
        projects,
        tickets,
        invoices,
        retainers,
        portfolios,
        ideas,
        objectives,
      }),
    [pathname, recordId, companies, contacts, projects, tickets, invoices, retainers, portfolios, ideas, objectives],
  );

  const companyChoices = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    return companies.filter((c) => !q || c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q));
  }, [companies, companyQuery]);

  if (!user || !isInternal) return null;

  const showHome = canAccessHref(user.role, "/app/home");
  const navGroups = NAV_GROUP_ORDER.map((group) => ({
    id: group,
    label: NAV_GROUPS.find((item) => item.id === group)?.label ?? group,
    items: NAV_MODULES.filter(
      (item) =>
        item.group === group &&
        canAccessHref(user.role, item.href) &&
        canUsePack(item.pack, enabledPacks, user.role, rolePacks),
    ),
  })).filter((group) => group.items.length);
  const routePack = packForHref(pathname);
  const workspaceHasPack = !routePack || hasPack(enabledPacks, routePack);
  const routeAllowed = canAccessHref(user.role, pathname) && canUsePack(routePack, enabledPacks, user.role, rolePacks);
  const deniedReason = routeAllowed ? undefined : workspaceHasPack ? "role" : "pack";
  const activityCreates = (
    [
      ["time", "Log time"],
      ["task", "Task"],
      ["expense", "Expense"],
    ] as const
  ).filter(([kind]) => canCreateKind(user.role, kind));
  const operationCreates = (
    [
      ["company", "Company"],
      ["contact", "Contact"],
      ["project", "Project"],
      ["ticket", "Ticket"],
      ["milestone", "Milestone"],
      ["idea", "Idea"],
      ["portfolio", "Portfolio"],
      ["objective", "Objective"],
      ["risk", "Risk"],
    ] as const
  ).filter(([kind]) => canCreateKind(user.role, kind));
  const canCreateAnything = activityCreates.length + operationCreates.length > 0 || can("add_note");

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
      milestoneId: extra.milestoneId,
      taskId: extra.taskId,
      workKind: extra.workKind,
      hours: extra.hours,
    };
  }

  function startShellTimer() {
    const project = focusProject ?? projects[0];
    if (!project) return;
    startTimeTimer({
      projectId: project.id,
      projectName: project.name,
      workKind: "project",
      label: project.name,
    });
    setMenu(null);
  }

  function stopShellTimer(id: string) {
    const timer = stopTimeTimer(id);
    if (!timer) return;
    openCreate("time", {
      projectId: timer.projectId,
      milestoneId: timer.milestoneId,
      taskId: timer.taskId,
      workKind: timer.workKind,
      hours: timerClock(timer.startedAt).hours,
    });
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
          <button
            type="button"
            className="brand-collapse"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        <nav>
          {showHome ? (
            <Link href="/app/home" className={clsx("nav-link", pathname === "/app/home" && "active")} title="Home">
              <LayoutDashboard size={17} />
              {!collapsed ? <span>Home</span> : null}
            </Link>
          ) : null}
          {navGroups.map((group) => {
            const open = collapsed || openGroups.includes(group.id);
            const hasActive = group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
            return (
              <div key={group.id} className={clsx("nav-group", !open && !hasActive && "is-closed")}>
                {!collapsed ? (
                  <button
                    type="button"
                    className="nav-group-label"
                    aria-expanded={open || hasActive}
                    onClick={() =>
                      setOpenGroups((current) =>
                        current.includes(group.id) ? current.filter((id) => id !== group.id) : [...current, group.id],
                      )
                    }
                  >
                    <span>{group.label}</span>
                    <ChevronDown size={12} style={{ transform: open || hasActive ? "rotate(0deg)" : "rotate(-90deg)" }} />
                  </button>
                ) : (
                  <div className="nav-group-rule" title={group.label} />
                )}
                {group.items.map((item) => {
                  const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} className={clsx("nav-link", active && "active")} title={item.label}>
                      <Icon size={17} />
                      {!collapsed ? <span>{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="nav-footer space-y-1">
          <HelpTrigger onClick={() => openHelp("guide")} collapsed={collapsed} />
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
          <Link
            href="/app/settings"
            className={clsx("nav-link", pathname.startsWith("/app/settings") && "active")}
            title="Settings"
            onClick={() => setNavOpen(false)}
          >
            <Settings size={17} />
            {!collapsed ? <span>Settings</span> : null}
          </Link>
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
              <span className="truncate">Search ideas, portfolios, strategy...</span>
            </span>
            <kbd className="search-kbd">⌘K</kbd>
          </button>
          <div className="topbar-actions">
            <div className="relative" data-shell-menu {...hoverMenuProps("company", setMenu, hoverTimer)}>
              <button
                type="button"
                className="context-btn"
                title="Companies"
                aria-label="Companies"
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
            {showTimeTimers
              ? timeTimers.map((timer) => (
                  <button
                    key={timer.id}
                    type="button"
                    className="btn btn-ghost text-sm topbar-timer"
                    onClick={() => stopShellTimer(timer.id)}
                  >
                    <Clock3 size={16} className="text-[var(--color-danger)]" />
                    {timer.label} {timerClock(timer.startedAt, now).label} Stop and log
                  </button>
                ))
              : null}
            {canCreateAnything ? (
            <div className="relative" data-shell-menu {...hoverMenuProps("create", setMenu, hoverTimer)}>
              <button type="button" className="icon-btn icon-btn-primary" title="Create" aria-label="Create" onClick={() => setMenu((v) => (v === "create" ? null : "create"))}>
                <Plus size={18} />
              </button>
              {menu === "create" ? (
                <div className="menu-popover create-popover fade-in">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="menu-heading">Activities</div>
                      {activityCreates.map(([k, label]) => (
                        <button key={k} type="button" className="menu-row" onClick={() => openCreate(k as CreateKind)}>
                          {label}
                        </button>
                      ))}
                      {can("add_note") ? (
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
                      ) : null}
                    </div>
                    <div>
                      <div className="menu-heading">Operations</div>
                      {operationCreates.map(([k, label]) => (
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
            ) : null}
            <div className="relative" data-shell-menu {...hoverMenuProps("tasks", setMenu, hoverTimer)}>
              <button
                type="button"
                className="icon-btn topbar-secondary"
                title="Tasks"
                aria-label="Tasks"
                aria-expanded={menu === "tasks"}
                onClick={() => setMenu((v) => (v === "tasks" ? null : "tasks"))}
              >
                <Briefcase size={18} />
              </button>
              {menu === "tasks" ? (
                <div className="menu-popover icon-popover fade-in">
                  <div className="menu-heading">My tasks</div>
                  {myTasks.map((t) => (
                    <div key={t.id} className="icon-popover-item">
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-[var(--color-muted)]">{t.projectName} · due {formatDisplayDate(t.due)}</div>
                      </div>
                      <button type="button" className="btn btn-ghost text-sm" onClick={() => useAppStore.getState().updateTaskStatus(t.id, "Done")}>
                        Done
                      </button>
                    </div>
                  ))}
                  {!myTasks.length ? <p className="menu-empty">No open tasks.</p> : null}
                  {can("create_task") ? (
                    <button type="button" className="menu-row" onClick={() => openCreate("task")}>
                      New task
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="relative" data-shell-menu {...hoverMenuProps("schedule", setMenu, hoverTimer)}>
              <button
                type="button"
                className="icon-btn topbar-secondary"
                title="Schedule"
                aria-label="Schedule"
                aria-expanded={menu === "schedule"}
                onClick={() => setMenu((v) => (v === "schedule" ? null : "schedule"))}
              >
                <CalendarDays size={18} />
              </button>
              {menu === "schedule" ? (
                <div className="menu-popover icon-popover fade-in">
                  <div className="menu-heading">My schedule</div>
                  {tasks
                    .filter((t) => t.status !== "Done")
                    .slice(0, 8)
                    .map((t) => (
                      <div key={t.id} className="icon-popover-item">
                        <div>
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-[var(--color-muted)]">{t.projectName}</div>
                        </div>
                        <div className="text-xs text-[var(--color-navy)]">{formatDisplayDate(t.due)}</div>
                      </div>
                    ))}
                  {!tasks.some((t) => t.status !== "Done") ? <p className="menu-empty">Nothing scheduled.</p> : null}
                  <Link href="/app/timesheets" className="menu-row" onClick={() => setMenu(null)}>
                    Open timesheets
                  </Link>
                </div>
              ) : null}
            </div>
            {can("log_time") ? (
            <div className="relative" data-shell-menu {...hoverMenuProps("time", setMenu, hoverTimer)}>
              <button
                type="button"
                className={clsx("icon-btn topbar-secondary", timeTimers.length && "active-soft")}
                title="Time"
                aria-label="Time"
                aria-expanded={menu === "time"}
                onClick={() => setMenu((v) => (v === "time" ? null : "time"))}
              >
                <Clock3 size={18} />
              </button>
              {menu === "time" ? (
                <div className="menu-popover ts-time-popover fade-in">
                  <div className="menu-heading">Time</div>
                  <button type="button" className="menu-row" onClick={startShellTimer}>
                    <Timer size={15} /> Create timer
                  </button>
                  <button type="button" className="menu-row" onClick={() => { setShowTimeTimers(!showTimeTimers); setMenu(null); }}>
                    {showTimeTimers ? <EyeOff size={15} /> : <Eye size={15} />}
                    {showTimeTimers ? "Hide timers" : "Show timers"}
                  </button>
                  <button type="button" className="menu-row" onClick={() => openCreate("time")}>
                    <Plus size={15} /> Log time
                  </button>
                  <div className="menu-heading">Timesheets</div>
                  {(["Overview", "Daily", "Weekly"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className="menu-row"
                      onClick={() => {
                        setMenu(null);
                        router.push(`/app/timesheets/?view=${tab}`);
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            ) : null}
            <div className="relative" data-shell-menu {...hoverMenuProps("notifications", setMenu, hoverTimer)}>
              <button
                type="button"
                className="icon-btn relative"
                title="Notifications"
                aria-label="Notifications"
                aria-expanded={menu === "notifications"}
                onClick={() => setMenu((v) => (v === "notifications" ? null : "notifications"))}
              >
                <Bell size={18} />
                {unread ? (
                  <span className="notify-dot">
                    {unread}
                  </span>
                ) : null}
              </button>
              {menu === "notifications" ? (
                <div className="menu-popover icon-popover fade-in">
                  <div className="menu-heading">Notifications</div>
                  <div className="icon-popover-toolbar">
                    <span className="text-xs text-[var(--color-muted)]">{notifications.length ? `${notifications.length} updates` : "You are caught up"}</span>
                    {notifications.length ? (
                      <button type="button" className="text-xs font-semibold text-[var(--color-navy)]" onClick={markAll}>
                        Mark all read
                      </button>
                    ) : null}
                  </div>
                  {notifications.slice(0, 8).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={clsx("menu-row notify-menu-row", !n.read && "is-unread")}
                      onClick={() => {
                        markRead(n.id);
                        if (n.href) router.push(n.href);
                        setMenu(null);
                      }}
                    >
                      <span>
                        <span className="block font-medium">{n.title}</span>
                        <span className="block text-xs text-[var(--color-muted)]">{n.body}</span>
                      </span>
                    </button>
                  ))}
                  {!notifications.length ? <p className="menu-empty">No notifications yet.</p> : null}
                </div>
              ) : null}
            </div>
            <div className="relative" data-shell-menu {...hoverMenuProps("help", setMenu, hoverTimer)}>
              <button
                type="button"
                className="icon-btn topbar-secondary"
                title="Help and Support"
                aria-label="Help and Support"
                aria-expanded={menu === "help"}
                onClick={() => setMenu((v) => (v === "help" ? null : "help"))}
              >
                <CircleHelp size={18} />
              </button>
              {menu === "help" ? (
                <div className="menu-popover fade-in">
                  <div className="menu-heading">Help</div>
                  <button type="button" className="menu-row" onClick={() => { setMenu(null); openHelp("guide"); }}>
                    <CircleHelp size={15} /> Help & Support
                  </button>
                  <button type="button" className="menu-row" onClick={() => { setMenu(null); openHelp("chat"); }}>
                    <Sparkles size={15} /> Ask AI
                  </button>
                </div>
              ) : null}
            </div>
            <div className="relative" data-shell-menu {...hoverMenuProps("profile", setMenu, hoverTimer)}>
              <button
                type="button"
                className="profile-btn"
                title="Profile"
                aria-label="Profile"
                aria-expanded={menu === "profile"}
                onClick={() => setMenu((v) => (v === "profile" ? null : "profile"))}
              >
                <Avatar initials={user.initials} name={user.name} />
                <span className="hidden sm:grid text-left leading-tight">
                  <span className="text-sm font-medium text-[var(--color-ink)]">{user.name.split(" ")[0]}</span>
                  <span className="text-[11px] text-[var(--color-muted)]">{roleLabel(user.role)}</span>
                </span>
                <ChevronDown size={14} className="hidden sm:block text-[var(--color-muted)]" />
              </button>
              {menu === "profile" ? (
                <div className="menu-popover profile-popover fade-in">
                  <div className="profile-card">
                    <Avatar initials={user.initials} name={user.name} size={40} />
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
                      openHelp("guide");
                    }}
                  >
                    <CircleHelp size={15} /> Help & Support
                  </button>
                  <button
                    type="button"
                    className="menu-row"
                    onClick={() => {
                      setMenu(null);
                      setTasksOpen(true);
                    }}
                  >
                    <Briefcase size={15} /> My tasks
                  </button>
                  <button
                    type="button"
                    className="menu-row"
                    onClick={() => {
                      setMenu(null);
                      setScheduleOpen(true);
                    }}
                  >
                    <CalendarDays size={15} /> My schedule
                  </button>
                  <Link href="/app/settings" className="menu-row" onClick={() => setMenu(null)}>
                    <Settings size={15} /> Settings
                  </Link>
                  {can("view_users") ? (
                  <Link href="/app/settings" className="menu-row" onClick={() => setMenu(null)}>
                    <Users size={15} /> Users & roles
                  </Link>
                  ) : null}
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
        <main className="content">
          {routeAllowed ? children : <AccessDenied moduleName={deniedModuleName(pathname)} reason={deniedReason} />}
        </main>
      </div>

      <CreateForms
        key={`${createKind}-${createDefaults.hours ?? ""}-${createDefaults.projectId ?? ""}-${createDefaults.milestoneId ?? ""}-${createDefaults.taskId ?? ""}-${createDefaults.companyId ?? ""}`}
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
          {can("create_task") ? (
          <button type="button" className="btn btn-primary w-full justify-center" onClick={() => { setTasksOpen(false); openCreate("task"); }}>
            New task
          </button>
          ) : null}
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

      <HelpSupport open={helpOpen} onClose={() => setHelpOpen(false)} audience="internal" startTab={helpTab} />
    </div>
  );
}
