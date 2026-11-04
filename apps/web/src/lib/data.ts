/** Compatibility re-exports. Prefer importing from seed/store in new code. */
export {
  money,
  formatDisplayDate,
  users,
  seedCompanies as companies,
  seedContacts as contacts,
  seedProjects as projects,
  seedMilestones as milestones,
  seedTickets as tickets,
  seedTasks as tasks,
  seedInvoices as invoices,
  seedActivities as companyActivitiesRaw,
} from "./seed";

import { seedActivities } from "./seed";
import type { ActivityItem } from "./types";

export const companyActivities: Record<string, ActivityItem[]> = seedActivities.reduce(
  (acc, item) => {
    if (!item.companyId) return acc;
    acc[item.companyId] = acc[item.companyId] ?? [];
    acc[item.companyId].push(item);
    return acc;
  },
  {} as Record<string, ActivityItem[]>,
);

export const billingTotals = {
  outstanding: 0,
  overdue: 0,
  inTerms: 0,
  paidMtd: 0,
};

export const profitability = {
  revenueRecognized: 0,
  actualCost: 0,
  grossMargin: 0,
  avgUtilization: 0,
  revenueDelta: "0 vs last period",
  costDelta: "0 vs last period",
  marginDelta: "0 pts",
  utilDelta: "0 pt",
  topAccounts: [] as { name: string; amount: number }[],
};
