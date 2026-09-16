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
  outstanding: 84220,
  overdue: 12400,
  inTerms: 71820,
  paidMtd: 56900,
};

export const profitability = {
  revenueRecognized: 412900,
  actualCost: 268400,
  grossMargin: 35,
  avgUtilization: 78,
  revenueDelta: "+8.2% vs Q2",
  costDelta: "+3.1% vs Q2",
  marginDelta: "+2 pts",
  utilDelta: "-1 pt",
  topAccounts: [
    { name: "Cascade Ventures", amount: 96200 },
    { name: "Bellweather Logistics", amount: 71050 },
    { name: "Northridge Retail Group", amount: 58900 },
  ],
};
