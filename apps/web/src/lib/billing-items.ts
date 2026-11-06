export const EXPENSE_TYPES = ["Travel", "Mileage", "Meals", "Lodging", "Materials", "Other"] as const;
export type ExpenseType = (typeof EXPENSE_TYPES)[number];
export const PURCHASE_STATUSES = ["Open", "Received", "Billed"] as const;
export const DEFAULT_MILE_RATE = 0.67;

export type BelongKind = "project" | "company" | "retainer";

export function parseBelongValue(raw: string): { kind: BelongKind; id: string } | undefined {
  const [kind, ...rest] = raw.split(":");
  const id = rest.join(":");
  if (!id) return undefined;
  if (kind === "project" || kind === "company" || kind === "retainer") return { kind, id };
  return undefined;
}

export function belongValue(kind: BelongKind, id: string) {
  return `${kind}:${id}`;
}

export function expenseAmountForType(type: ExpenseType, amount: number, miles?: number, mileRate?: number) {
  if (type === "Mileage") {
    return Math.round((Math.max(0, miles ?? 0) * Math.max(0, mileRate ?? DEFAULT_MILE_RATE)) * 100) / 100;
  }
  return Math.max(0, amount);
}

export function extraFieldsForExpenseType(type: ExpenseType) {
  if (type === "Mileage") {
    return [
      { id: "miles", label: "Miles" },
      { id: "mileRate", label: "Rate per mile" },
    ];
  }
  if (type === "Travel") {
    return [
      { id: "vendor", label: "Vendor" },
      { id: "route", label: "From / to" },
    ];
  }
  if (type === "Meals") {
    return [
      { id: "vendor", label: "Vendor" },
      { id: "attendees", label: "Attendees" },
    ];
  }
  if (type === "Lodging") {
    return [
      { id: "vendor", label: "Vendor" },
      { id: "nights", label: "Nights" },
    ];
  }
  if (type === "Materials") {
    return [
      { id: "vendor", label: "Vendor" },
      { id: "item", label: "Item" },
    ];
  }
  return [{ id: "vendor", label: "Vendor" }];
}
