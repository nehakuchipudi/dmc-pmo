# Dillon Morgan PMO: User Stories, Use Cases, and Acceptance Criteria

Roles: **Admin**, **PM/AM**, **Staff**, **Finance**, **Leadership**, **Client Contact (Portal)**

Story format: *As a [role], I want [capability], so that [outcome].*  
Acceptance criteria use Given/When/Then where useful.  
Copy rule: product strings must never contain em dashes.

---

## Epic 0: Platform foundation

### US-0.1 Secure login (internal)
As an internal user, I want to sign in with Entra ID + MFA (when required), so that only authorized staff access the PMO.

**AC**
- Invalid credentials never reveal whether email exists
- MFA enforced for Admin and Finance
- Session expiry and refresh tokens follow Entra policy
- Every login writes an audit event

### US-0.2 Role assignment
As an Admin, I want to invite users and assign roles, so that access matches job duties.

**AC**
- Roles: Admin, PM/AM, Staff, Finance, Leadership, Client Contact
- User cannot escalate own role
- Deactivated users lose API access within 1 minute

### US-0.3 Global shell
As any internal user, I want the sidebar, top Create/Tasks/Schedule/Time menus, and global search on every screen, so that I never lose context to log time or create work.

### US-0.4 No cross-company leak
As a security owner, I want automated tests that attempt IDOR across companies, so that data leaks fail the build.

**AC**
- Staff of Company A cannot GET/PATCH Company B resources by UUID
- Portal user cannot list other companies' projects even if UUID guessed
- Over-fetched fields (cost_rate, internal_note) absent from portal JSON

---

## Epic 1: Companies and Contacts

### US-1.1 Company list and saved views
As a PM/AM, I want saved lists (All Active, Recently Created, Managed By Me, Classic), so that I can focus on my book of business.

### US-1.2 Create/edit company
As a PM/AM, I want to create a company with name, status, industry, AM, primary contact, website, billing address, tags, so that CRM data lives in one place.

### US-1.3 Company record workspace
As a PM/AM, I want Overview/Contacts/Projects/Tickets/Retainers/Billing/Files/Activity tabs, so that the client context is complete.

### US-1.4 Recently viewed + shortcuts
As any internal user, I want a Recently Viewed rail and Shortcuts (Invoice, Stream, Dashboard, Timesheet Overview, Statements), so that navigation matches Accelo muscle memory without leaving the list.

### US-1.5 Contacts with portal flag
As a PM/AM, I want to mark a contact for Portal Access and invite them, so that clients can self-serve securely.

**AC**
- Invite binds contact to exactly one company
- Portal credentials cannot be reused across companies
- "Not Invited" vs "Enabled" visible on Contacts grid

### Use cases
- **UC-C1** Onboard new client company + primary contact + invite portal  
- **UC-C2** Reassign Account Manager (SCD2 history captured for warehouse)  
- **UC-C3** Deactivate company; open projects flagged; portal access suspended  

---

## Epic 2: Projects, Milestones, Signoffs

### US-2.1 Project portfolio grid
As a PM/AM, I want open projects with progress, status pills, budget vs actual cues, and overdue highlighting, so that delivery risk is visible at a glance.

### US-2.2 Create project
As a PM/AM, I want to create a project linked to a company with manager, dates, budget hours/$, and portal visibility, so that delivery can start.

### US-2.3 Milestones
As a PM/AM, I want milestones with due dates and statuses, and a Gantt-style mini timeline toggle, so that phase tracking is clear.

### US-2.4 Project tasks board/list
As Staff, I want to see tasks on the project and update status, so that work progresses without leaving the project.

### US-2.5 Request signoff
As a PM/AM, I want to request milestone/deliverable signoff from internal or client approvers, so that acceptance is auditable.

### US-2.6 Client notes vs internal
As a PM/AM, I want Client Notes separated from internal activity, so that portal users never see internal discussion.

### Use cases
- **UC-P1** Kick off project from won sale (or manually) with template milestones  
- **UC-P2** Client approves "Site Survey Complete" via portal signoff  
- **UC-P3** Mark project At Risk when budget burn > plan  

---

## Epic 3: Work (Tasks, Activities, Schedule, Time)

### US-3.1 My open tasks
As Staff, I want My Open Tasks and Tasks Overdue lists, so that I know what to do today.

### US-3.2 Kanban boards
As a PM/AM, I want Assignee / Status / Deadline boards with drag-and-drop, so that I can rebalance work quickly.

**AC**
- Drop updates status/assignee/deadline immediately
- Undo toast available for 5 seconds
- Overdue badges use danger color

### US-3.3 Activities stream
As a PM/AM, I want a merged timeline of Notes, Emails, Meetings, Tasks, so that client history is chronological.

### US-3.4 Running timer
As Staff, I want Create Timer / Show-Hide Timers / persistent top-bar timer chip, so that billable work is not lost.

### US-3.5 Log time modal
As Staff, I want quick Log Time (project/task, hours, date, billable, note), so that entry takes seconds.

### US-3.6 Daily/weekly timesheet
As Staff, I want daily and weekly timesheet grids with target hours, so that I can complete timesheets before cutoff.

### US-3.7 My Schedule / Team Scheduling
As a PM/AM, I want personal calendar and team resource calendar, so that capacity conflicts surface early.

### Use cases
- **UC-W1** Start timer on task → stop → propose timesheet line → submit  
- **UC-W2** Manager rejects time → staff corrects → resubmit  
- **UC-W3** Drag task from Not Started to In Progress on Status Board  

---

## Epic 4: Tickets and SLA

### US-4.1 Ticket inbox
As Staff/PM, I want open/assigned/unassigned ticket lists with priority and SLA countdown, so that support stays within policy.

### US-4.2 Ticket thread
As Staff, I want client-visible replies vs internal notes clearly differentiated, so that we never leak internal commentary.

### US-4.3 Portal raise/reply
As a Client Contact, I want to raise a ticket and reply on my company's tickets, so that I do not depend on email alone.

### US-4.4 Ticket signoff
As a Client Contact, I want to confirm resolution, so that tickets close with acceptance.

### US-4.5 Email intake (Phase 2/5)
As a system, I want inbound email to create/append tickets when configured, so that clients can still use email.

### Use cases
- **UC-T1** Portal login issue (#1042) created by client → assigned → resolved → client signoff  
- **UC-T2** SLA breach paints ticket red and notifies PM  

---

## Epic 5: Retainers

### US-5.1 Create retainer
As a PM/AM, I want to create a retainer with type, period cadence, budget hours/amount, and excess rates, so that recurring work is contracted.

### US-5.2 Periods
As a PM/AM, I want automatic period renewal and period budgets, so that admin overhead stays low.

### US-5.3 Allocate work
As a PM/AM, I want to allocate project/ticket time into a retainer period, so that usage is accurate.

### US-5.4 Portal retainer usage
As a Client Contact, I want to see remaining hours/balance (not cost), so that I understand entitlement.

### Use cases
- **UC-R1** Monthly support retainer auto-opens period and invoices fixed fee up front  
- **UC-R2** Excess hours billed at configured rate at period close  

---

## Epic 6: Client Portal

### US-6.1 Portal landing
As a Client Contact, I want My Projects with progress, next milestone, status, open tickets, recent invoices, and Raise a Ticket, so that I get status in one place.

### US-6.2 Update shared tasks
As a Client Contact, I want to update status/comments on tasks explicitly shared with me, so that collaboration is possible without email.

### US-6.3 Cannot see forbidden data
As a Client Contact, I must not see internal notes, internal-only tasks, cost/margin, other clients, Sales, or Reports.

### US-6.4 Pay invoice
As a Client Contact, I want to view statements and pay invoices online, so that collections accelerate.

### US-6.5 Branding
As a Client Contact, I want my company name in the portal chrome and DMC powered-by footer, so that the experience feels white-labeled yet trustworthy.

### Use cases
- **UC-CP1** Dana (Cascade Ventures) reviews Website Replatform awaiting review and comments  
- **UC-CP2** Dana pays INV-2291; status becomes Paid; warehouse fact updates next ELT  

---

## Epic 7: Billing

### US-7.1 Invoice list + KPI banner
As Finance/PM, I want Outstanding / Overdue / In Terms / Paid MTD, so that collections focus is immediate.

### US-7.2 Create invoice from time/materials/retainer
As Finance, I want to generate invoices from approved time and materials, so that leakage drops.

### US-7.3 Send to portal + reminders
As Finance, I want Send to Client Portal and bulk reminders, so that clients can self-pay.

### US-7.4 Expenses
As Staff, I want to submit expenses with receipts; as PM/Finance, I want Approve/Reject inline.

### US-7.5 Purchases and materials
As PM/Finance, I want POs and materials with uninvoiced filters, so that project costs are complete.

### Use cases
- **UC-B1** Weekly billing run: approve time → draft invoice → send → portal pay  
- **UC-B2** Expense with receipt approved and optionally passed to invoice  

---

## Epic 8: Reports and Warehouse

### US-8.1 Dashboard library
As Leadership, I want eight live dashboard cards, so that I can open Profitability / Utilization / etc. quickly.

### US-8.2 Profitability dashboard
As Leadership, I want Revenue Recognized, Actual Cost, Gross Margin, Avg Utilization, margin by project, and top accounts, so that I manage the firm on facts.

### US-8.3 Custom views and schedules
As a PM/AM, I want Save As Custom View, schedule email delivery, and export CSV/XLSX/PDF.

### US-8.4 Warehouse freshness
As Leadership, I want warehouse data no older than the published SLA (nightly or CDC), so that reports are trusted.

### Use cases
- **UC-RP1** Monday leadership review on Profitability Dashboard for Q3  
- **UC-RP2** Utilization report emailed every Friday 4pm  

---

## Epic 9: Sales (Phase 5)

### US-9.1 Pipeline
As a PM/AM, I want sales/opportunities with stage, amount, probability, expected close, so that forecast feeds capacity.

### US-9.2 Convert to delivery
As a PM/AM, I want won sale → project/retainer creation, so that handoff is clean.

---

## Epic 10: Mobile

### US-10.1 Staff mobile home
As Staff, I want Home, Timesheet, Stream, Tasks, Companies/Contacts lookup, so that field work is covered.

### US-10.2 Mobile timers and expenses
As Staff, I want timers and expense capture with photo receipt, so that revenue and costs are captured on site.

### US-10.3 Portal mobile
As a Client Contact, I want project status, ticket reply, and invoice view/pay on mobile web or app, so that approvals are not desk-bound.

**AC**
- Same RBAC as web
- Biometric unlock optional; tokens in secure storage
- Offline queue for time drafts

---

## Epic 11: Admin, Settings, Migration

### US-11.1 Settings
As an Admin, I want org profile, roles, rate cards, SLA policies, invoice terms, email templates, branding, so that the firm is configurable.

### US-11.2 Accelo import
As an Admin, I want to import companies, contacts, projects, time, and invoices from Accelo API, so that cutover is feasible.

### US-11.3 Feedback/Help
As any user, I want Help and Feedback entry points in the sidebar footer.

---

## Cross-cutting acceptance pack (Definition of Done)

Every story merging to `main` must satisfy:

1. RBAC tests for Admin / PM / Staff / Portal  
2. No em dash in user-facing strings (lint rule)  
3. Audit event for create/update/delete of money or permission objects  
4. Empty/loading/error states  
5. Responsive web (desktop + mobile web) for touched screens  
6. OpenAPI updated  
7. Seed/demo data still boots  

---

## Story map priority (MVP cut)

**Must (Phase 1–2):** 0.x, 1.x, 2.x, 3.1–3.6, 4.1–4.4, 6.1–6.3, 10.1–10.2 (timers)  
**Should (Phase 3–4):** 5.x, 6.4, 7.x, 8.x, 10.3  
**Could (Phase 5–6):** 9.x, AI assists, advanced team scheduling, accounting sync
