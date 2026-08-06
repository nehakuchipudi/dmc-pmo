# DMC PMO: Module Workflows and Verification

**Purpose:** Clear process for every module, role ownership, and acceptance checks.  
**Scope:** Client-side preview (Zustand). API/auth deferred.  
**Rule:** Every primary control must complete its step or be honestly labeled as later.

---

## Cross-module journeys

| ID | Journey | Happy path |
| --- | --- | --- |
| UC-01 | Billable work | Timer/Log time → Submit → Approve → Invoice draft/send → Client pay |
| UC-02 | Project delivery | Create project → Milestones/tasks → Plan/Gantt → Request signoff → Client approve |
| UC-03 | Support | Client raise ticket → Staff reply (+ internal note) → Resolve → (optional) client follow-up |
| UC-04 | Retainer | Allocate hours on retainer → Portal shows remaining |
| UC-05 | Notify | Automation Run now / Send invoice / Request signoff → Notification + Email outbox |
| UC-06 | Export | Invoice PDF, Project plan PDF, CSV on major grids |

---

## Role → primary modules

| Role | Owns |
| --- | --- |
| Admin | Automations, Settings, all modules |
| PM | Companies, Projects, Tickets, Signoffs, draft invoices |
| Staff | Work, Timer, Timesheets (own), Ticket replies |
| Finance | Billing, Expense approve, Invoice send/pay record |
| Client | Portal projects/signoffs, tickets, pay, retainers |

---

## Module process cards

### Shell
1. Search → jump to company/project/ticket/contact  
2. Create → typed modal → store → toast (list updates)  
3. Timer start → Stop & log → Log time modal with elapsed hours → draft time entry  
4. Tasks drawer → Mark done  
5. Schedule → due work list → Timesheets  
6. Notifications → mark read → navigate  
7. Note → company activity stream  
8. Expense → expense list under Billing  

**Verify:** Timer stop prefills hours; Note appears under company Activity; Expense appears under Billing → Expenses.

### Companies
1. Filter list → open company  
2. New Company → appears in list  
3. Detail tabs: Overview, Contacts, Projects, Tickets, Retainers, Billing, Files (stub), Activity  
4. From header: New Ticket / New Project / Log Time scoped to company  
5. Export CSV  

**Verify:** Create contact on company; Activity shows notes/time; wrong id shows not found.

### Contacts
1. Filter (portal enabled / not invited)  
2. New Contact → list  
3. Company name links to company  
4. Export CSV  

**Verify:** New contact on correct company; filter Portal Enabled works.

### Projects
1. List tabs: Projects / Milestones / Signoffs  
2. New Project → list  
3. Detail: Plan (Gantt), Milestones, Tasks (status), Time & Budget, Signoffs  
4. Request Signoff → milestone `Awaiting Signoff` + email + notification  
5. Client portal Approve → `Approved`  
6. Export plan PDF  

**Verify:** Request changes milestone status; portal Approve clears queue; Gantt shows tasks.

### Tickets
1. Filters: Open / Assigned to me (current user) / Unassigned  
2. New Ticket → list + notification  
3. Detail: status change, client reply, internal note  
4. Resolve decrements company open ticket count  

**Verify:** Assigned to me uses signed-in user; Resolve updates company counter.

### Work
1. Status board drag between columns → task status  
2. Assignee / Deadline boards are view boards (honest; no drop reassign yet)  
3. New Task → board  

**Verify:** Drag Not Started → In Progress persists on reload of page (same session).

### Timesheets
1. Log time → Draft  
2. Submit → Submitted  
3. PM/Admin/Finance Approve or Reject  
4. Staff sees own rows  

**Verify:** Full draft → submit → approve path; approved KPI updates.

### Billing
1. Tabs: Invoices (live) / Expenses (approve) / Purchases & Materials (labeled later)  
2. New Invoice → pick company → Draft → open detail  
3. Send → Sent + outbox  
4. Record payment / Portal Pay (Sent or Overdue only) → Paid  
5. Export PDF / CSV  

**Verify:** Cannot pay Draft from portal; Send flips Draft→Sent; Expense from Create lands here.

### Retainers
1. View period usage  
2. Allocate hours → used/remaining update  
3. Portal mirrors remaining  

**Verify:** Allocate 2h; portal remaining drops by 2.

### Sales
1. New opportunity (persisted in session store)  
2. Advance Qualify → Propose → Negotiate → Won  
3. Won creates Project  

**Verify:** Won opportunity appears under Projects for that company.

### Reports
1. Dashboard cards show live snapshots  
2. Profitability: company filter + CSV  
3. Categories show live rows  

**Verify:** Creating invoice changes profitability revenue.

### Automations
1. Toggle rule  
2. Run now → notification + outbox  
3. Templates → preview send  
4. Email outbox lists sends  

**Verify:** Run now adds outbox row.

### Portal
1. Projects: raise ticket, approve awaiting signoffs  
2. Tickets: raise, reply (client-visible only)  
3. Billing: PDF; Pay on Sent/Overdue  
4. Retainers: read usage  

**Verify:** Internal notes never shown; Draft invoices not payable.

---

## Verification log

| Date | Method | Result |
| --- | --- | --- |
| 2026-08-06 | Code audit | Gaps: timer hours, signoff status, expense/note, counters, draft pay gate |
| 2026-08-06 | Fixes landed | Store + UI hardened for UC-01..06 process paths |
| 2026-08-06 | Browser E2E on serene-dust preview | PASS: time submit/approve, signoff request→portal approve, tickets, expense+note, draft pay gate, sales→project, retainers, note modal. Work board status updates via Tasks dropdown; drag improved with dataTransfer |

---

## Known honest limitations (not bugs)

- Files tabs: Azure Blob later  
- Purchases/Materials: finance integration later  
- Automations do not auto-fire on domain events (manual Run now for demo)  
- Real Entra/Stripe/email deferred to API phase  
