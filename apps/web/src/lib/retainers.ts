import type { RetainerStatus, RetainerType } from "./types";
import { addDays, todayIso } from "./timesheet";

export const DEFAULT_RETAINER_RATE = 175;
export const RETAINER_TYPES: RetainerType[] = ["Monthly T&M", "Pre-paid", "Fixed"];
export const RETAINER_CREATE_STATUSES: RetainerStatus[] = ["Active", "Expired", "Cancelled"];
export const PERIOD_DURATION_KINDS = ["Fixed", "Rolling"] as const;
export const PERIOD_UNITS = ["Day", "Week", "Month", "Year"] as const;
export const PERIOD_BILLING = ["Pre-paid", "In arrears", "Time and materials"] as const;
export const PERIOD_ALLOWANCES = ["Unlimited hours", "Fixed hours"] as const;
export const RETAINER_RATE_MODES = ["Use staff rates", "Retainer rate"] as const;
export const RETAINER_SERVICE_ITEMS = ["Managed support", "On-call coverage", "Advisory hours"] as const;
export const RETAINER_TASK_TEMPLATES = ["None", "Kickoff checklist", "Monthly review"] as const;
export const RETAINER_MATERIAL_TEMPLATES = ["None", "Standard consumables"] as const;
export const DEFAULT_RETAINER_INVOICE_LINE =
  "Retainer for the period {period.commence} - {period.expiry}";

export function formatRetainerInvoiceLine(pattern: string, start: string, end: string) {
  return pattern
    .replaceAll("{period.commence}", start)
    .replaceAll("{period.expiry}", end)
    .replaceAll("{start}", start)
    .replaceAll("{end}", end);
}

export function parseRetainerTags(raw: string) {
  return [...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function customFieldsForRetainerType(type: string) {
  if (type === "Monthly T&M") {
    return [
      { id: "coverage", label: "Coverage window" },
      { id: "onCall", label: "On-call" },
    ];
  }
  if (type === "Pre-paid") {
    return [
      { id: "hoursBank", label: "Hours bank" },
      { id: "burnAlert", label: "Burn alert" },
    ];
  }
  if (type === "Fixed") {
    return [
      { id: "scope", label: "Scope summary" },
      { id: "cadence", label: "Review cadence" },
    ];
  }
  return [] as { id: string; label: string }[];
}

export function periodEndFromStart(start: string, length: number, unit: (typeof PERIOD_UNITS)[number]) {
  const count = Math.max(1, length);
  if (unit === "Day") return addDays(start, count);
  if (unit === "Week") return addDays(start, count * 7);
  if (unit === "Year") return addDays(start, count * 365);
  return addDays(start, count * 30);
}

export function defaultPeriodBilling(type: RetainerType): (typeof PERIOD_BILLING)[number] {
  if (type === "Monthly T&M") return "Time and materials";
  return "Pre-paid";
}

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
