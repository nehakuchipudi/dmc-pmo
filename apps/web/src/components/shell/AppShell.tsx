"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
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
  Search,
  Settings,
  Ticket,
  Workflow,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { clsx } from "clsx";
import { roleLabel, useAuth } from "@/lib/auth";
import { Avatar, Drawer, Field, Modal, TextSelect, TextTextarea } from "@/components/ui";
import { CreateForms, type CreateKind } from "@/components/CreateForms";
import { useAppStore } from "@/lib/store";
import { formatDisplayDate } from "@/lib/seed";

const NAV = [
  { href: "/app/companies", label: "Companies", icon: Building2 },
  { href: "/app/sales", label: "Sales", icon: ChartColumn },
  { href: "/app/projects", label: "Projects", icon: LayoutDashboard },
  { href: "/app/tickets", label: "Tickets", icon: Ticket },
  { href: "/app/retainers", label: "Retainers", icon: ClipboardList },
  { href: "/app/work", label: "Work", icon: Workflow },
  { href: "/app/timesheets", label: "Timesheets", icon: Clock3 },
  { href: "/app/billing", label: "Billing", icon: Receipt },
  { href: "/app/reports", label: "Reports", icon: FileText },
  { href: "/app/automations", label: "Automations", icon: Zap },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isInternal, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [createDefaults, setCreateDefaults] = useState<{ companyId?: string; projectId?: string; hours?: number }>({});
  const [tasksOpen, setTasksOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteCompanyId, setNoteCompanyId] = useState("");

  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const companies = useAppStore((s) => s.companies);
  const tickets = useAppStore((s) => s.tickets);
  const contacts = useAppStore((s) => s.contacts);
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAll = useAppStore((s) => s.markAllNotificationsRead);

  useEffect(() => {
    if (!user) router.replace("/login");
    else if (!isInternal) router.replace("/portal");
  }, [user, isInternal, router]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assignee.includes(user?.name.split(" ").slice(-1)[0] ?? "Kim") || t.assignee === "J. Kim" || t.assignee === user?.name).filter((t) => t.status !== "Done").slice(0, 12),
    [tasks, user],
  );

  const searchHits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return [
      ...companies.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({ href: `/app/companies/view/?id=${c.id}`, label: c.name, type: "Company" })),
      ...projects.filter((p) => p.name.toLowerCase().includes(q)).map((p) => ({ href: `/app/projects/view/?id=${p.id}`, label: p.name, type: "Project" })),
      ...tickets.filter((t) => t.subject.toLowerCase().includes(q) || String(t.number).includes(q)).map((t) => ({ href: `/app/tickets/view/?id=${t.id}`, label: `#${t.number} ${t.subject}`, type: "Ticket" })),
      ...contacts.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({ href: "/app/contacts", label: c.name, type: "Contact" })),
    ].slice(0, 8);
  }, [search, companies, projects, tickets, contacts]);

  if (!user || !isInternal) return null;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const unread = notifications.filter((n) => !n.read).length;

  function openCreate(kind: CreateKind, defaults: typeof createDefaults = {}) {
    setCreateOpen(false);
    setCreateDefaults(defaults);
    setCreateKind(kind);
  }

  return (
    <div className={clsx("app-shell", collapsed && "collapsed")}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">DMC</div>
          {!collapsed ? (
            <>
              <div className="brand-title">Dillon Morgan</div>
              <div className="brand-sub">Consulting PMO</div>
            </>
          ) : null}
        </div>
        <nav>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={clsx("nav-link", active && "active")} title={item.label}>
                <Icon size={18} />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="nav-footer space-y-1">
          <button type="button" className="nav-link w-full" onClick={() => setCollapsed((v) => !v)}>
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
          <div className="text-sm text-[var(--color-muted)] truncate capitalize">
            {pathname.replace("/app/", "").split("/").join(" / ") || "Home"}
          </div>
          <button type="button" className="search text-left text-[var(--color-muted)]" onClick={() => setSearchOpen(true)}>
            <span className="inline-flex items-center gap-2">
              <Search size={15} /> Search companies, projects, tickets, contacts...
            </span>
          </button>
          <div className="relative flex items-center gap-2 justify-end">
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
            <div className="relative">
              <button type="button" className="icon-btn" aria-label="Create" onClick={() => setCreateOpen((v) => !v)}>
                <Plus size={18} />
              </button>
              {createOpen ? (
                <div className="absolute right-0 top-12 z-40 w-[380px] panel p-4 fade-in">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="mb-2 text-xs font-semibold tracking-wide text-[var(--color-muted)] uppercase">Activities</div>
                      {[
                        ["time", "Log time"],
                        ["task", "Task"],
                        ["expense", "Expense"],
                      ].map(([k, label]) => (
                        <button key={k} type="button" className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-[var(--color-fog)]" onClick={() => openCreate(k as CreateKind)}>
                          {label}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-[var(--color-fog)]"
                        onClick={() => {
                          setCreateOpen(false);
                          setNoteCompanyId(companies[0]?.id ?? "");
                          setNoteText("");
                          setNoteOpen(true);
                        }}
                      >
                        Note
                      </button>
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-semibold tracking-wide text-[var(--color-muted)] uppercase">Operations</div>
                      {[
                        ["company", "Company"],
                        ["contact", "Contact"],
                        ["project", "Project"],
                        ["ticket", "Ticket"],
                        ["milestone", "Milestone"],
                      ].map(([k, label]) => (
                        <button key={k} type="button" className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-[var(--color-fog)]" onClick={() => openCreate(k as CreateKind)}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
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
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] text-white">
                  {unread}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white py-1 pl-1 pr-2.5"
              onClick={logout}
              title={`${user.name} (${roleLabel(user.role)}). Click to sign out.`}
            >
              <Avatar initials={user.initials} src={user.avatarUrl} name={user.name} />
              <span className="hidden text-sm font-medium text-[var(--color-ink)] sm:inline">{user.name.split(" ")[0]}</span>
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>

      <CreateForms
        key={`${createKind}-${createDefaults.hours ?? ""}-${createDefaults.projectId ?? ""}`}
        kind={createKind}
        defaults={createDefaults}
        onClose={() => {
          setCreateKind(null);
          setCreateDefaults({});
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

      <Drawer open={tasksOpen} title="My open tasks" onClose={() => setTasksOpen(false)}>
        <div className="space-y-2">
          {myTasks.map((t) => (
            <div key={t.id} className="panel p-3">
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-[var(--color-muted)]">{t.projectName} · due {formatDisplayDate(t.due)}</div>
              <button type="button" className="btn btn-ghost mt-2 text-sm" onClick={() => useAppStore.getState().updateTaskStatus(t.id, "Done")}>
                Mark done
              </button>
            </div>
          ))}
          {!myTasks.length ? <p className="text-sm text-[var(--color-muted)]">No open tasks.</p> : null}
          <button type="button" className="btn btn-primary w-full justify-center" onClick={() => { setTasksOpen(false); setCreateKind("task"); }}>
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

      <Drawer open={notesOpen} title="Notifications" onClose={() => setNotesOpen(false)}>
        <div className="mb-3 flex justify-between">
          <span className="text-sm text-[var(--color-muted)]">{unread} unread</span>
          <button type="button" className="text-sm text-[var(--color-navy)]" onClick={markAll}>
            Mark all read
          </button>
        </div>
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className={clsx("panel w-full p-3 text-left", !n.read && "border-[var(--color-navy)]")}
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
          <p>Use Create (+) to add companies, projects, tickets, tasks, and time.</p>
          <p>Start the timer with the clock icon, then Stop and log to capture hours.</p>
          <p>Client portal users only see their company projects, tickets, billing, and retainers.</p>
          <Link href="/app/automations" className="btn btn-primary w-full justify-center" onClick={() => setHelpOpen(false)}>
            Open automations
          </Link>
        </div>
      </Drawer>

      <Drawer open={searchOpen} title="Search" onClose={() => setSearchOpen(false)}>
        <input
          className="field-input mb-3"
          autoFocus
          placeholder="Type to search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="space-y-2">
          {searchHits.map((hit) => (
            <button
              key={hit.href + hit.label}
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
          {search && !searchHits.length ? <p className="text-sm text-[var(--color-muted)]">No matches.</p> : null}
        </div>
      </Drawer>
    </div>
  );
}
