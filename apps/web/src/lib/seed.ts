import type {
  ActivityItem,
  AutomationRule,
  Company,
  Contact,
  EmailOutboxItem,
  Expense,
  Invoice,
  Milestone,
  NotificationItem,
  Opportunity,
  Project,
  Retainer,
  Task,
  Ticket,
  TicketMessage,
  TimeEntry,
  User,
} from "./types";

export const users: User[] = [
  { id: "u-admin", name: "Dillon Morgan", initials: "DM", role: "admin", email: "dillon@dillonmorgan.com" },
  { id: "u-pm", name: "M. Doyle", initials: "MD", role: "pm", email: "mdoyle@dillonmorgan.com" },
  { id: "u-staff", name: "J. Kim", initials: "JK", role: "staff", email: "jkim@dillonmorgan.com" },
  { id: "u-client", name: "Dana Kessler", initials: "DK", role: "client", email: "dana@cascadeventures.com", companyId: "c-cascade" },
];

export const seedCompanies: Company[] = [
  { id: "c-northridge", name: "Northridge Retail Group", initials: "NR", status: "Active", accountManager: "J. Alvarez", openProjects: 1, openTickets: 0, lastActivity: "Aug 5, 2026", industry: "Retail", billingTerms: "Net 30", portalContacts: 1 },
  { id: "c-harlow", name: "Harlow & Pine Law", initials: "HP", status: "Prospect", accountManager: "J. Alvarez", openProjects: 0, openTickets: 0, lastActivity: "Aug 1, 2026", industry: "Legal", billingTerms: "Net 15", portalContacts: 0 },
  { id: "c-oakton", name: "Oakton Technologies", initials: "OT", status: "Overdue Inv.", accountManager: "S. Cho", openProjects: 0, openTickets: 1, lastActivity: "Jul 29, 2026", industry: "Technology", billingTerms: "Net 30", portalContacts: 1 },
  { id: "c-cascade", name: "Cascade Ventures", initials: "CV", status: "Active", accountManager: "M. Doyle", openProjects: 3, openTickets: 1, lastActivity: "Aug 5, 2026", industry: "Manufacturing & Distribution", billingTerms: "Net 30", portalContacts: 2 },
  { id: "c-bellweather", name: "Bellweather Logistics", initials: "BL", status: "Active", accountManager: "S. Cho", openProjects: 1, openTickets: 0, lastActivity: "Aug 4, 2026", industry: "Logistics", billingTerms: "Net 30", portalContacts: 2 },
];

export const seedContacts: Contact[] = [
  { id: "ct-dana", name: "Dana Kessler", initials: "DK", companyId: "c-cascade", companyName: "Cascade Ventures", title: "VP Operations", email: "dana@cascadeventures.com", portal: "Enabled", lastInteraction: "Aug 5, 2026" },
  { id: "ct-ravi", name: "Ravi Thakur", initials: "RT", companyId: "c-cascade", companyName: "Cascade Ventures", title: "IT Director", email: "ravi@cascadeventures.com", portal: "Enabled", lastInteraction: "Aug 3, 2026" },
  { id: "ct-nina", name: "Nina Ortiz", initials: "NO", companyId: "c-northridge", companyName: "Northridge Retail Group", title: "Procurement Lead", email: "nina@northridge.com", portal: "Not Invited", lastInteraction: "Jul 28, 2026" },
];

export const seedProjects: Project[] = [
  { id: "p-warehouse", name: "Q3 Warehouse Rollout", companyId: "c-cascade", companyName: "Cascade Ventures", manager: "M. Doyle", progress: 70, status: "On Track", due: "2026-08-22", start: "2026-07-01", budgetHours: 420, loggedHours: 294, marginPct: 31, portalShared: true, portalContacts: 2 },
  { id: "p-website", name: "Website Replatform", companyId: "c-cascade", companyName: "Cascade Ventures", manager: "M. Doyle", progress: 35, status: "At Risk", due: "2026-09-10", start: "2026-07-15", budgetHours: 180, loggedHours: 92, marginPct: 22, portalShared: true, portalContacts: 2 },
  { id: "p-vendor", name: "Vendor Onboarding Portal", companyId: "c-cascade", companyName: "Cascade Ventures", manager: "S. Cho", progress: 90, status: "On Track", due: "2026-08-12", start: "2026-06-20", budgetHours: 120, loggedHours: 108, marginPct: 38, portalShared: true, portalContacts: 2 },
  { id: "p-fleet", name: "Fleet Tracking Pilot", companyId: "c-bellweather", companyName: "Bellweather Logistics", manager: "S. Cho", progress: 15, status: "Overdue", due: "2026-07-30", start: "2026-06-01", budgetHours: 200, loggedHours: 55, marginPct: 18, portalShared: false, portalContacts: 0 },
  { id: "p-pos", name: "POS Integration", companyId: "c-northridge", companyName: "Northridge Retail Group", manager: "J. Alvarez", progress: 55, status: "On Track", due: "2026-08-28", start: "2026-07-10", budgetHours: 160, loggedHours: 88, marginPct: 29, portalShared: true, portalContacts: 1 },
];

export const seedMilestones: Milestone[] = [
  { id: "m1", projectId: "p-warehouse", name: "Site Survey Complete", due: "2026-07-18", start: "2026-07-01", status: "Approved" },
  { id: "m2", projectId: "p-warehouse", name: "Racking Installation", due: "2026-08-08", start: "2026-07-20", status: "In Progress" },
  { id: "m3", projectId: "p-warehouse", name: "WMS Go-Live", due: "2026-08-22", start: "2026-08-10", status: "Not Started" },
  { id: "m4", projectId: "p-website", name: "Homepage Design Review", due: "2026-08-09", start: "2026-07-28", status: "In Progress" },
  { id: "m5", projectId: "p-vendor", name: "Final Sign-off", due: "2026-08-12", start: "2026-08-05", status: "Not Started" },
];

export const seedTickets: Ticket[] = [
  { id: "t-1042", number: 1042, subject: "Portal login issue", companyId: "c-cascade", companyName: "Cascade Ventures", projectId: "p-warehouse", priority: "Urgent", assignee: "J. Kim", slaDue: "2h 10m", status: "In Progress", submitted: "2026-08-05" },
  { id: "t-1045", number: 1045, subject: "Invoice PDF missing line items", companyId: "c-oakton", companyName: "Oakton Technologies", priority: "High", assignee: "Unassigned", slaDue: "1d 4h", status: "Open", submitted: "2026-08-04" },
  { id: "t-1038", number: 1038, subject: "Retainer hours clarification", companyId: "c-northridge", companyName: "Northridge Retail Group", projectId: "p-pos", priority: "Low", assignee: "M. Doyle", slaDue: "3d", status: "Resolved", submitted: "2026-07-30" },
];

export const seedTicketMessages: TicketMessage[] = [
  { id: "tm1", ticketId: "t-1042", author: "Dana Kessler", body: "Two contacts cannot log into the portal after the password reset.", createdAt: "2026-08-05 09:10", visibility: "client" },
  { id: "tm2", ticketId: "t-1042", author: "J. Kim", body: "Reproduced. Checking SSO mapping for Cascade contacts.", createdAt: "2026-08-05 10:22", visibility: "internal" },
  { id: "tm3", ticketId: "t-1042", author: "J. Kim", body: "We reset portal access for both contacts. Please confirm login.", createdAt: "2026-08-05 14:05", visibility: "client" },
];

export const seedTasks: Task[] = [
  { id: "tk1", name: "Configure WMS user roles", projectId: "p-warehouse", projectName: "Q3 Warehouse Rollout", assignee: "J. Kim", assigneeInitials: "JK", status: "Not Started", due: "2026-08-12", start: "2026-08-06", clientEditable: false, estimateHours: 8 },
  { id: "tk2", name: "Draft training materials", projectId: "p-warehouse", projectName: "Q3 Warehouse Rollout", assignee: "S. Ahmed", assigneeInitials: "SA", status: "Not Started", due: "2026-08-15", start: "2026-08-08", clientEditable: true, estimateHours: 12 },
  { id: "tk3", name: "Vendor API credentials", projectId: "p-vendor", projectName: "Vendor Onboarding Portal", assignee: "S. Cho", assigneeInitials: "SC", status: "Not Started", due: "2026-08-10", start: "2026-08-05", clientEditable: false, estimateHours: 4 },
  { id: "tk4", name: "Install racking Zone B", projectId: "p-warehouse", projectName: "Q3 Warehouse Rollout", assignee: "M. Doyle", assigneeInitials: "MD", status: "In Progress", due: "2026-08-07", start: "2026-08-01", dueLabel: "Due Tomorrow", clientEditable: false, estimateHours: 16 },
  { id: "tk5", name: "QA fleet tracking sync", projectId: "p-fleet", projectName: "Fleet Tracking Pilot", assignee: "S. Cho", assigneeInitials: "SC", status: "In Progress", due: "2026-08-09", start: "2026-07-25", clientEditable: false, estimateHours: 10 },
  { id: "tk6", name: "Client review homepage design", projectId: "p-website", projectName: "Website Replatform", assignee: "J. Kim", assigneeInitials: "JK", status: "Review", due: "2026-08-09", start: "2026-08-02", clientEditable: true, estimateHours: 6 },
  { id: "tk7", name: "Site survey report", projectId: "p-warehouse", projectName: "Q3 Warehouse Rollout", assignee: "M. Doyle", assigneeInitials: "MD", status: "Done", due: "2026-07-18", start: "2026-07-10", dueLabel: "Completed Jul 18", clientEditable: false, estimateHours: 8 },
  { id: "tk8", name: "Kickoff deck sent", projectId: "p-warehouse", projectName: "Q3 Warehouse Rollout", assignee: "S. Ahmed", assigneeInitials: "SA", status: "Done", due: "2026-07-10", start: "2026-07-05", dueLabel: "Completed Jul 10", clientEditable: false, estimateHours: 3 },
];

export const seedInvoices: Invoice[] = [
  { id: "inv-2291", number: "INV-2291", companyId: "c-cascade", companyName: "Cascade Ventures", amount: 12400, terms: "Net 30", due: "2026-08-03", status: "Overdue", lineItems: [{ description: "Q3 Warehouse Rollout (Jul)", amount: 9800 }, { description: "Materials", amount: 2600 }] },
  { id: "inv-2298", number: "INV-2298", companyId: "c-northridge", companyName: "Northridge Retail Group", amount: 8900, terms: "Net 30", due: "2026-08-18", status: "Sent", lineItems: [{ description: "POS Integration progress billing", amount: 8900 }] },
  { id: "inv-2301", number: "INV-2301", companyId: "c-bellweather", companyName: "Bellweather Logistics", amount: 15600, terms: "Net 15", due: "2026-09-01", status: "Sent", lineItems: [{ description: "Fleet Tracking Pilot", amount: 15600 }] },
  { id: "inv-2265", number: "INV-2265", companyId: "c-cascade", companyName: "Cascade Ventures", amount: 6900, terms: "Net 30", due: "2026-07-20", status: "Paid", lineItems: [{ description: "Website discovery", amount: 6900 }] },
  { id: "inv-2288", number: "INV-2288", companyId: "c-oakton", companyName: "Oakton Technologies", amount: 11200, terms: "Net 30", due: "2026-07-29", status: "Overdue", lineItems: [{ description: "Support retainer Jul", amount: 11200 }] },
];

export const seedTimeEntries: TimeEntry[] = [
  { id: "te1", userName: "J. Kim", projectId: "p-warehouse", projectName: "Q3 Warehouse Rollout", taskId: "tk1", taskName: "Configure WMS user roles", date: "2026-08-05", hours: 2.5, billable: true, note: "Role matrix draft", status: "Submitted" },
  { id: "te2", userName: "M. Doyle", projectId: "p-warehouse", projectName: "Q3 Warehouse Rollout", taskId: "tk4", taskName: "Install racking Zone B", date: "2026-08-05", hours: 4, billable: true, note: "Onsite supervision", status: "Approved" },
  { id: "te3", userName: "J. Kim", projectId: "p-website", projectName: "Website Replatform", taskId: "tk6", taskName: "Client review homepage design", date: "2026-08-06", hours: 1.5, billable: true, note: "Prep review notes", status: "Draft" },
];

export const seedNotifications: NotificationItem[] = [
  { id: "n1", title: "Invoice overdue", body: "INV-2291 for Cascade Ventures is overdue.", createdAt: "Today 8:15 AM", read: false, href: "/app/billing/view/?id=inv-2291" },
  { id: "n2", title: "Signoff requested", body: "Homepage Design Review awaits client approval.", createdAt: "Yesterday 4:40 PM", read: false, href: "/app/projects/view/?id=p-website" },
  { id: "n3", title: "SLA risk", body: "Ticket #1042 is inside the final 3 hours.", createdAt: "Yesterday 2:10 PM", read: true, href: "/app/tickets/view/?id=t-1042" },
];

export const seedActivities: ActivityItem[] = [
  { id: "a1", companyId: "c-cascade", projectId: "p-warehouse", when: "Today, 9:12 AM", text: "M. Doyle logged 2.5h on Q3 Warehouse Rollout." },
  { id: "a2", companyId: "c-cascade", projectId: "p-warehouse", when: "Yesterday, 4:40 PM", text: "Client approved Milestone: Site Survey Complete." },
  { id: "a3", companyId: "c-cascade", when: "Aug 3, 2026", text: "Invoice INV-2291 sent ($12,400)." },
  { id: "a4", companyId: "c-cascade", when: "Aug 1, 2026", text: "New ticket raised: Portal login issue." },
];

export const seedRetainers: Retainer[] = [
  { id: "r1", companyId: "c-cascade", companyName: "Cascade Ventures", name: "Monthly Managed Support", periodLabel: "Aug 1 to Aug 31, 2026", usedHours: 28, budgetHours: 40, status: "Active" },
  { id: "r2", companyId: "c-northridge", companyName: "Northridge Retail Group", name: "SEO Retainer", periodLabel: "Aug 1 to Aug 31, 2026", usedHours: 12, budgetHours: 20, status: "Active" },
];

export const seedAutomations: AutomationRule[] = [
  { id: "auto1", name: "Timesheet reminder", trigger: "Friday 4:00 PM", condition: "Staff has draft time under target", action: "Email staff + in-app notification", enabled: true },
  { id: "auto2", name: "Overdue invoice nudge", trigger: "Invoice age = 7 days overdue", condition: "Status is Overdue", action: "Email billing contact + notify Finance", enabled: true },
  { id: "auto3", name: "Margin risk alert", trigger: "Nightly", condition: "Project margin under 20%", action: "Notify project manager", enabled: false },
];

export const seedEmailOutbox: EmailOutboxItem[] = [
  { id: "e1", to: "dana@cascadeventures.com", subject: "Invoice INV-2291 is overdue", body: "Please review and pay INV-2291 in the client portal.", sentAt: "2026-08-04 09:00", status: "Sent" },
  { id: "e2", to: "jkim@dillonmorgan.com", subject: "Reminder: submit timesheet", body: "You have draft time entries for this week.", sentAt: "2026-08-01 16:00", status: "Sent" },
];

export const seedExpenses: Expense[] = [
  { id: "ex1", vendor: "Delta Travel", projectId: "p-warehouse", projectName: "Q3 Warehouse Rollout", amount: 420, status: "Pending", date: "2026-08-04", note: "Client travel" },
  { id: "ex2", vendor: "Office Depot", projectId: "p-website", projectName: "Website Replatform", amount: 86, status: "Approved", date: "2026-08-02", note: "Supplies" },
];

export const seedOpportunities: Opportunity[] = [
  { id: "o1", name: "ERP readiness assessment", companyId: "c-harlow", companyName: "Harlow & Pine Law", stage: "Qualify", amount: 18000, close: "2026-09-15" },
  { id: "o2", name: "Warehouse phase 2", companyId: "c-cascade", companyName: "Cascade Ventures", stage: "Propose", amount: 62000, close: "2026-08-28" },
  { id: "o3", name: "Fleet expansion", companyId: "c-bellweather", companyName: "Bellweather Logistics", stage: "Negotiate", amount: 44000, close: "2026-09-05" },
];

export function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDisplayDate(iso: string) {
  if (!iso.includes("-")) return iso;
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
