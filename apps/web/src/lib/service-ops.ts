import type { PackId } from "./modules";
import { DEFAULT_PACKS, hasPack, packsOf } from "./modules";
import type { Role } from "./types";

export type WorkOrderStatus = "Scheduled" | "In progress" | "Pending approval" | "Completed" | "Sent back";
export type WorkOrderPriority = "Low" | "Medium" | "High" | "Critical";
export type RecurringFrequency = "Daily" | "Weekly" | "Bi-Weekly" | "Monthly" | "Quarterly" | "Annually";
export type InstanceStatus = "Active" | "Trial" | "Past Due" | "Cancelled";
export type DocumentKind = "PDF" | "Image" | "Other";

export interface WorkOrder {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  assignee: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  scheduled: string;
  notes: string;
}

export interface RecurringService {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  frequency: RecurringFrequency;
  nextOn: string;
  assignee: string;
  paused: boolean;
}

export interface ServiceDocument {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  kind: DocumentKind;
  added: string;
}

export interface FieldClock {
  id: string;
  memberName: string;
  startedAt: string;
  stoppedAt?: string;
  hours?: number;
}

export interface WorkspaceInstance {
  id: string;
  name: string;
  status: InstanceStatus;
  packs: PackId[];
  owner: string;
}

export interface PromotionalTrial {
  days: number;
  slots: number;
  used: number;
  active: boolean;
  startedOn?: string;
}

export type RolePacks = Partial<Record<Role, PackId[]>>;

export const DEFAULT_ROLE_PACKS: RolePacks = {
  admin: DEFAULT_PACKS,
  leadership: DEFAULT_PACKS,
  pm: DEFAULT_PACKS,
  finance: ["project_management", "project_delivery"],
  staff: ["project_delivery", "service_operations"],
  client: [],
};

export const DEFAULT_INSTANCES: WorkspaceInstance[] = [
  {
    id: "inst-dmc",
    name: "Dillon Morgan",
    status: "Active",
    packs: DEFAULT_PACKS,
    owner: "Dillon Morgan",
  },
];

export const DEFAULT_TRIAL: PromotionalTrial = {
  days: 30,
  slots: 3,
  used: 0,
  active: false,
};

export const WORK_ORDER_STATUSES: WorkOrderStatus[] = [
  "Scheduled",
  "In progress",
  "Pending approval",
  "Completed",
  "Sent back",
];
export const WORK_ORDER_PRIORITIES: WorkOrderPriority[] = ["Low", "Medium", "High", "Critical"];
export const RECURRING_FREQUENCIES: RecurringFrequency[] = [
  "Daily",
  "Weekly",
  "Bi-Weekly",
  "Monthly",
  "Quarterly",
  "Annually",
];
export const INSTANCE_STATUSES: InstanceStatus[] = ["Active", "Trial", "Past Due", "Cancelled"];
export const DOCUMENT_KINDS: DocumentKind[] = ["PDF", "Image", "Other"];

export function addDaysIso(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nextFromFrequency(iso: string, frequency: RecurringFrequency) {
  const step =
    frequency === "Daily"
      ? 1
      : frequency === "Weekly"
        ? 7
        : frequency === "Bi-Weekly"
          ? 14
          : frequency === "Monthly"
            ? 30
            : frequency === "Quarterly"
              ? 90
              : 365;
  return addDaysIso(iso, step);
}

export function clockHours(startedAt: string, stoppedAt = Date.now()) {
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start)) return 0;
  return Math.max(0.1, Math.round(((stoppedAt - start) / 36e5) * 10) / 10);
}

export function packsForRole(role: Role | undefined | null, rolePacks?: RolePacks | null): PackId[] {
  if (!role) return [];
  if (role === "client") return packsOf(rolePacks?.client ?? []);
  return packsOf(rolePacks?.[role] ?? DEFAULT_ROLE_PACKS[role]);
}

export function canUsePack(
  pack: PackId | null,
  enabledPacks: PackId[] | undefined | null,
  role: Role | undefined | null,
  rolePacks?: RolePacks | null,
) {
  if (!pack) return true;
  return hasPack(enabledPacks, pack) && packsForRole(role, rolePacks).includes(pack);
}

export function workOrderActions(status: WorkOrderStatus): { label: string; next: WorkOrderStatus; manage?: boolean }[] {
  if (status === "Scheduled" || status === "Sent back") return [{ label: "Start work", next: "In progress" }];
  if (status === "In progress") {
    return [
      { label: "Submit for approval", next: "Pending approval" },
      { label: "Mark complete", next: "Completed" },
    ];
  }
  if (status === "Pending approval") {
    return [
      { label: "Approve", next: "Completed", manage: true },
      { label: "Send back", next: "Sent back", manage: true },
    ];
  }
  return [];
}
