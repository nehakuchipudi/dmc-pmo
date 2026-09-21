import type { TimeEntry } from "./types";

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

export function groupHours(
  entries: TimeEntry[],
  keyOf: (entry: TimeEntry) => string,
) {
  const map = new Map<string, { key: string; hours: number; billable: number; count: number }>();
  for (const entry of entries) {
    const key = keyOf(entry);
    const current = map.get(key) ?? { key, hours: 0, billable: 0, count: 0 };
    current.hours += entry.hours;
    current.billable += entry.billable ? entry.hours : 0;
    current.count += 1;
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => b.hours - a.hours);
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
