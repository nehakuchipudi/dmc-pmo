import { addDays, todayIso } from "./timesheet";

export const DEFAULT_RETAINER_RATE = 175;

export function retainerRate(rate?: number) {
  return rate && rate > 0 ? rate : DEFAULT_RETAINER_RATE;
}

export function earnedValue(usedHours: number, rate?: number) {
  return usedHours * retainerRate(rate);
}

export function daysUntil(iso?: string) {
  if (!iso) return null;
  const ms = new Date(`${iso}T12:00:00`).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

export function companyProjectId(projects: { id: string; companyId: string }[], companyId: string) {
  return projects.find((item) => item.companyId === companyId)?.id;
}

export function nextPeriodRange(periods: { end: string }[]) {
  const latest = [...periods].map((item) => item.end).sort().at(-1);
  const today = todayIso();
  const afterLast = latest ? addDays(latest, 1) : today;
  const start = afterLast > today ? afterLast : today;
  return { start, end: addDays(start, 29) };
}

export function pickCurrentPeriod<T extends { start: string; end: string; status: string }>(
  periods: T[],
  today = todayIso(),
) {
  const opened = periods.filter((item) => item.status === "Opened");
  return (
    opened.find((item) => item.start <= today && item.end >= today) ||
    opened.slice().sort((a, b) => b.end.localeCompare(a.end))[0] ||
    periods[0]
  );
}
