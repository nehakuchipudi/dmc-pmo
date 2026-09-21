import type { Project, TeamMember, TimeEntry } from "./types";

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function todayIso() {
  return isoDate(new Date());
}

export function parseIso(iso: string) {
  return new Date(`${iso}T12:00:00`);
}

export function addDays(iso: string, days: number) {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

export function startOfWeek(iso: string) {
  const date = parseIso(iso);
  const weekday = date.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + offset);
  return isoDate(date);
}

export function weekDays(weekStart: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function formatWeekday(iso: string) {
  return parseIso(iso).toLocaleDateString("en-US", { weekday: "short" });
}

export function formatDayLabel(iso: string) {
  return parseIso(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatLongDay(iso: string) {
  return parseIso(iso).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

export function formatWeekRange(weekStart: string) {
  const end = addDays(weekStart, 6);
  const startLabel = parseIso(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = parseIso(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} to ${endLabel}`;
}

export function hoursInRange(entries: TimeEntry[], start: string, end: string) {
  return entries
    .filter((entry) => entry.date >= start && entry.date <= end)
    .reduce((sum, entry) => sum + entry.hours, 0);
}

export function formatDuration(hours: number) {
  const minutes = Math.round(hours * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!minutes) return "0m";
  if (!h) return `${m}m`;
  if (!m) return `${h}h 00m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function formatClockHours(hours: number) {
  if (!hours) return "";
  const minutes = Math.round(hours * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function parseClock(value: string) {
  const [h, m] = value.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function formatClock(minutes: number) {
  const wrapped = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
}

export function entryWindow(entry: TimeEntry) {
  let start = 9 * 60;
  if (entry.start) start = parseClock(entry.start);
  else {
    let hash = 0;
    for (const ch of entry.id) hash += ch.charCodeAt(0);
    start = 8 * 60 + (hash % 8) * 45;
  }
  const end = start + Math.round(entry.hours * 60);
  return { start, end };
}

export function billRateFor(name: string, team: TeamMember[]) {
  return team.find((member) => member.name === name)?.billRate ?? 180;
}

export function costRateFor(name: string, team: TeamMember[]) {
  return Math.round(billRateFor(name, team) * 0.35);
}

export type OverviewProjectRow = {
  projectId: string;
  projectName: string;
  activities: number;
  nonbillable: number;
  billable: number;
  total: number;
  amount: number;
  cost: number;
};

export type OverviewCompanyRow = {
  companyId: string;
  companyName: string;
  activities: number;
  nonbillable: number;
  billable: number;
  total: number;
  amount: number;
  cost: number;
  projects: OverviewProjectRow[];
};

export function overviewByCompany(
  entries: TimeEntry[],
  projects: Project[],
  team: TeamMember[],
): OverviewCompanyRow[] {
  const companies = new Map<string, OverviewCompanyRow>();
  for (const entry of entries) {
    const project = projects.find((item) => item.id === entry.projectId);
    const companyId = project?.companyId ?? "internal";
    const companyName = project?.companyName ?? "Internal";
    const company = companies.get(companyId) ?? {
      companyId,
      companyName,
      activities: 0,
      nonbillable: 0,
      billable: 0,
      total: 0,
      amount: 0,
      cost: 0,
      projects: [],
    };
    let projectRow = company.projects.find((item) => item.projectId === entry.projectId);
    if (!projectRow) {
      projectRow = {
        projectId: entry.projectId,
        projectName: entry.projectName,
        activities: 0,
        nonbillable: 0,
        billable: 0,
        total: 0,
        amount: 0,
        cost: 0,
      };
      company.projects.push(projectRow);
    }
    const billable = entry.billable ? entry.hours : 0;
    const nonbillable = entry.billable ? 0 : entry.hours;
    const amount = billable * billRateFor(entry.userName, team);
    const cost = entry.hours * costRateFor(entry.userName, team);
    for (const row of [company, projectRow]) {
      row.activities += 1;
      row.billable += billable;
      row.nonbillable += nonbillable;
      row.total += entry.hours;
      row.amount += amount;
      row.cost += cost;
    }
    companies.set(companyId, company);
  }
  return [...companies.values()]
    .map((row) => ({ ...row, projects: row.projects.sort((a, b) => b.total - a.total) }))
    .sort((a, b) => b.total - a.total);
}

export function weekMatrix(entries: TimeEntry[], weekStart: string, rowKey: (entry: TimeEntry) => string) {
  const days = weekDays(weekStart);
  const rows = new Map<string, { key: string; cells: number[]; total: number }>();
  for (const entry of entries) {
    const index = days.indexOf(entry.date);
    if (index < 0) continue;
    const key = rowKey(entry);
    const row = rows.get(key) ?? { key, cells: [0, 0, 0, 0, 0, 0, 0], total: 0 };
    row.cells[index] += entry.hours;
    row.total += entry.hours;
    rows.set(key, row);
  }
  const totals = days.map((_, index) => [...rows.values()].reduce((sum, row) => sum + row.cells[index], 0));
  return {
    days,
    rows: [...rows.values()].sort((a, b) => b.total - a.total),
    totals,
    grand: totals.reduce((sum, value) => sum + value, 0),
  };
}
