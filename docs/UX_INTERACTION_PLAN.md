# DMC PMO: UX Redesign + Interaction Completeness Plan

**Status:** Phase A–C implemented in app preview (client-side store). Real API/auth still deferred.  
**Date:** August 6, 2026  
**Constraint for this phase:** Application UX and client-side end-to-end behavior first. Real API/auth deferred.

---

## 1. Verdict on current product

The live preview is an Accelo-shaped **shell with seed data**. Navigation and a few filters work. Most buttons, tabs, shortcuts, create actions, timers, portal pay/raise-ticket, and board switches are dead. That is why the product feels unfinished and the UI feels like chrome without substance.

**Principle going forward:** every visible control either works or is removed/disabled with an honest label. No fake Accelo muscle-memory.

---

## 2. UX redesign direction (2026 premium, boutique consulting)

### Problems with the current UI
- Dense Accelo clone without Accelo depth (uncanny valley)
- Flat white panels + navy rail feel generic SaaS
- Tabs look real but do nothing (trust break)
- Shortcuts rails are decoration
- Hero brand signal is weak once inside modules
- Motion and hierarchy are underused

### New visual system (still Dillon Morgan brand)
| Token | Value | Role |
| --- | --- | --- |
| Ink | `#0E1A2B` | Primary text / deep chrome |
| Navy | `#1F3864` | Brand / primary actions |
| Gold | `#B08D57` | Accent / focus / premium moments |
| Fog | `#F3F0EA` | Warm page atmosphere (not cream cliché: cooler taupe-fog) |
| Paper | `#FFFCFA` | Surfaces |
| Line | `#D9D2C5` | Borders |
| Success / Warn / Danger | keep semantic, slightly muted |

**Typography**
- Display: Fraunces (brand moments, page titles)
- UI: Source Sans 3 (cleaner than IBM for dense grids)
- Numerals: tabular for money/hours

**Layout**
- Keep left nav + top global actions (PSA muscle memory)
- Replace "card everywhere" with **zones**: filter bar, primary canvas, optional inspector
- Record pages: sticky header action band + true tab panels
- Client portal: calmer, wider whitespace, client company as brand-first

**Motion (intentional)**
1. Sidebar collapse spring
2. Modal/drawer enter
3. Toast after successful create/update
4. Kanban card settle on drop

**Copy rules**
- No em dashes anywhere
- Prefer verbs: "Log time", "Send invoice", "Request signoff"

---

## 3. Roles and hats (who uses what)

| Role | Daily hats | Primary screens |
| --- | --- | --- |
| Admin | Configure firm, users, rates, automations | Settings, Users, Automations, Billing config |
| PM / AM | Delivery + client relationship | Companies, Projects (Gantt/plan), Tickets, Signoffs, Invoices draft |
| Staff / Consultant | Execute + capture time | Work board, Timer, Daily/Weekly timesheet, Expenses |
| Finance | Cash + approvals | Billing tabs, Expense approvals, Statements, PDF invoices |
| Leadership | Portfolio health | Reports/dashboards, Utilization, Profitability |
| Client Contact | Transparency + collaboration | Portal Projects, Tickets, Signoffs, Pay invoice, Retainer usage |

---

## 4. End-to-end journeys (use cases)

### UC-01 Capture billable work
Staff starts timer on task → stops → reviews entry → submits timesheet → PM approves → Finance invoices → Client pays.

### UC-02 Run a project plan
PM creates project → adds milestones/tasks → opens Gantt/plan view → assigns staff → tracks % complete → requests milestone signoff → client approves in portal.

### UC-03 Support a client issue
Client raises ticket in portal → PM assigns → Staff replies (client-visible) + internal note → resolve → client signoff.

### UC-04 Retainer burn
PM creates retainer + period → allocates ticket/project time → portal shows hours remaining → period closes → invoice.

### UC-05 Notify and automate
Rule: "When timesheet overdue Friday 4pm, email staff" / "When project margin < 20%, notify PM" / "When invoice overdue 7 days, send reminder".

### UC-06 Export and share
PM exports project plan PDF / Finance exports invoice PDF / Leadership exports utilization CSV.

---

## 5. Feature inventory (must / should / later)

### Must (Phase A–B: make app believable and usable)
- Working Create menu modals (Company, Contact, Project, Ticket, Task, Expense, Time)
- Working module tabs with real panel content
- Client-side store (Zustand/context) so creates persist in session
- Global search
- Tasks drawer + Schedule mini calendar
- Timer → time entry linked to project/task
- Daily + weekly timesheet grid (submit/approve simulation)
- Work boards: Status / Assignee / Deadline + drag-drop status
- Project Plan tab + Gantt view
- Ticket detail with client vs internal thread
- Invoice detail + PDF export (print/PDF)
- Project plan PDF export
- Notifications center (in-app) + email simulation log
- Portal: raise ticket, reply, signoff, pay invoice (simulated)
- Export CSV on major grids

### Should (Phase C)
- Automations builder (trigger → condition → action)
- Email notification templates + outbox viewer
- Signoffs queue (projects + tickets)
- Expenses / Purchases / Materials billing tabs
- Retainer periods + allocate work
- Saved views ("Classic Lists" → named views)
- Files attachments (local mock)
- Reports filters (date/team/company) with live seed aggregations

### Later (Phase D+, after API)
- Real email (ACS/Graph), Stripe, Entra, warehouse, Accelo import, mobile, AI

---

## 6. Module-by-module interaction contract

### Shell
| Control | Behavior |
| --- | --- |
| Search | Command palette: jump to company/project/ticket/contact |
| Create | Opens typed modal; saves to store; toast; optional navigate |
| Tasks | Drawer: My Open Tasks with complete toggle |
| Schedule | Drawer: week strip of due tasks/meetings |
| Time | Start/stop timer; on stop open Log Time modal prefilled |
| Notifications | Bell with unread list (signoffs, SLA, overdue invoices) |
| Settings | Sheet: profile display, notification prefs (local) |

### Companies
Tabs: Overview | Contacts | Projects | Tickets | Retainers | Billing | Files | Activity  
Actions: New Company, New Ticket, New Project, Log Time, Export CSV

### Projects
Tabs: Overview | Plan (Gantt) | Milestones | Tasks | Tickets | Time & Budget | Files | Signoffs | Client Notes  
Actions: New Milestone/Task, Request Signoff, Export Plan PDF

### Tickets
List → Detail (thread, status, priority, assignee, SLA)  
Portal raise + reply

### Work
Boards switchable; drag between status; New Task; My Schedule; Daily Timesheet

### Billing
Tabs Invoices | Expenses | Purchases | Materials  
Invoice detail, Send (marks Sent), Export PDF, Reminder (notification)

### Reports
Each dashboard card opens a real page with KPI + charts from seed aggregations  
Export CSV/PDF

### Portal
Projects (comment + signoff), Tickets (raise/reply), Billing (pay sim), Retainers (usage)

---

## 7. Phased delivery

### Phase A (now): Foundation UX + honesty
1. Design tokens + shell redesign  
2. App store (entities + mutations)  
3. Toast, Modal, Drawer, Tabs primitives  
4. Wire Create menu + Log Time + Search + Notifications  
5. Fix Contacts/Work filters and board switching  
6. Make company/project tabs real  

### Phase B: Delivery depth
1. Gantt / Project Plan  
2. Ticket detail + portal ticket flows  
3. Timesheets daily/weekly  
4. Invoice detail + PDF export  
5. Project plan PDF  

### Phase C: Operations depth
1. Automations  
2. Email outbox + templates  
3. Retainers periods  
4. Billing sub-tabs  
5. Signoffs queues  
6. Reports with filters  

### Phase D: Backend (later)
API, Entra, RLS, Stripe, real email, warehouse

---

## 8. Acceptance criteria for "done" on interaction phase

1. No primary button is a no-op  
2. Every tab changes content  
3. Create Company/Contact/Project/Ticket/Task/Time works and appears in lists  
4. Timer produces a timesheet line  
5. Gantt shows project tasks/milestones  
6. Invoice and project plan can export/print PDF  
7. Portal can raise ticket and simulate pay  
8. Notifications appear for key events  
9. UI matches new design tokens; no em dashes  
10. Redeploy free preview URL

---

## 9. Research inputs informing this plan

- Accelo: timers → timesheets → invoices; portal signoffs; retainers+periods; stream  
- PSA 2026 guides (Teamwork, BigTime, Klient): Gantt + boards sharing one data model; frictionless time capture; automated reminders; invoice from approved time; role-based UX  
- Internal blueprint + prior mockups: Navy/Gold, module IA, client portal restrictions  

---

## 10. Immediate next step

Execute **Phase A**, then **Phase B** continuously in this branch, redeploy free preview when interaction milestones land.
