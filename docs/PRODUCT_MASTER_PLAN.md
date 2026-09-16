# Dillon Morgan Consulting PMO Platform

## Product Master Plan (v1.0)

**Product name (working):** Dillon Morgan PMO  
**Company:** Dillon Morgan Consulting Inc.  
**Source of truth:** DMC PMO Tool Blueprint v1.0 (August 6, 2026)  
**Competitive reference:** Accelo PSA (replacement + boutique-firm supersets)  
**Delivery targets:** GitHub (`nehakuchipudi/dmc-pmo`) + Azure production  
**Clients:** Web application + mobile application (iOS / Android)

---

## 1. Product verdict

Build a **private, Azure-hosted Professional Services Automation (PSA) / PMO platform** that replaces Accelo for Dillon Morgan Consulting. The product must be a single system of record for clients, sales, projects, tickets, retainers, work, billing, and reporting, with a restricted client portal and a separate analytics warehouse.

This is not a generic project tracker. It is an operations OS for a boutique consulting firm: time becomes invoices, delivery health becomes margin, and clients get transparency without ever seeing cost rates, internal notes, or other tenants' data.

**Non-negotiable product rules**

1. **No em dashes anywhere in the product UI, emails, PDFs, or mobile copy.** Use commas, colons, parentheses, or periods.
2. **Role isolation is absolute.** Client portal users never see internal-only fields, cost/margin, other companies, Sales, or Reports.
3. **Row-level security on every query.** Company scoping is enforced in the API and database, not only in the UI.
4. **Premium 2026 UI** following blueprint tokens: Navy `#1F3864`, Gold `#B08D57`, semantic status colors, expressive typography (not Inter/Roboto/Arial/system defaults).
5. **Web + mobile share one API and one permission model.**

---

## 2. Problem, goals, and success metrics

### Problem

DMC today runs delivery in Accelo (including client portal). Accelo works, but DMC wants a purpose-built platform it owns: tailored workflows, a dimensional warehouse, Azure residency, and UX tuned for a boutique firm rather than a multi-tenant SaaS average.

### Goals

| Goal | Measure |
| --- | --- |
| One system of record | 100% of active companies, projects, tickets, retainers, time, and invoices live in DMC PMO |
| Preserve client portal familiarity | Clients can view/update shared projects, milestones, tasks; raise/reply tickets; view/pay invoices |
| Leadership visibility | Utilization, profitability, delivery health dashboards update from warehouse within SLA |
| Zero cross-tenant leaks | Automated security tests prove company isolation and portal field redaction |
| Accelo exit readiness | Accelo API import path for historical companies, contacts, projects, time, invoices |

### Industry context (from Accelo 2026 benchmarks research)

- Only ~73% of projects delivered on time (down from ~80% three years prior)
- Billable utilization industry average ~69% (optimal band often cited near 75%)
- ~42% of firms see revenue leakage (~4.3% of revenue)
- Boutique firms win by recovering unbilled time, tightening approvals, and showing margin early

DMC PMO should optimize for those recovery loops: timers → timesheets → approvals → invoices → portal pay → warehouse KPIs.

---

## 3. Personas and roles

### Internal roles

| Role | Primary job | Default access |
| --- | --- | --- |
| **Admin** | Configure firm, users, rates, integrations, billing settings | Full CRUD + Settings + User management + all modules |
| **Project Manager / Account Manager** | Own assigned companies and delivery | Companies (assigned/managed), Projects, Tickets, Retainers, Work, Billing (create/send invoices), limited Reports |
| **Staff / Consultant** | Execute tasks, log time, submit expenses | Work (own + assigned), Projects/Tickets (assigned), Time, Expenses (own), read-only company context |
| **Finance** (recommended extension) | Invoicing discipline, expense approval, statements | Billing full, Reports finance category, read projects/retainers |
| **Leadership** (recommended extension) | Portfolio health | All dashboards/reports, read-mostly elsewhere |

### External role

| Role | Primary job | Access |
| --- | --- | --- |
| **Client Contact (Portal)** | Self-serve status, comments, tickets, invoices | Only own company: Projects, Tickets, Billing, Retainers (optional). No Sales, Reports, Settings, cost rates, internal notes |

### Permission principles

- **Least privilege by default**
- **Object ACL + company scope:** every record has `company_id`; portal users filtered to their `contact.company_id`
- **Field-level redaction:** `cost_rate`, `margin_pct`, `internal_note`, unshared tasks hidden from portal serializers
- **Action gates:** portal may update task status/comments only when `client_editable = true`
- **Admin-only:** user invites, role changes, rate cards, SSO, retention policies, warehouse credentials

---

## 4. Information architecture

### Internal web shell (from blueprint + mockups)

**Left sidebar (pinned)**  
Companies · Sales · Projects · Tickets · Retainers · Work · Billing · Reports  

**Sidebar footer**  
Collapse · Help · Feedback · Settings  

**Top bar (global, every screen)**  
Global search · Create (+) · Tasks (briefcase) · Schedule (calendar) · Time (clock) · Notifications · User avatar  

**Content pattern (3 zones)**  
1. Saved/shared list selector + search/filter/column chooser  
2. Main grid or board  
3. Right rail: Recently Viewed + Shortcuts (and on records: Quick Facts + Activity)

### Client portal shell (Fig. 12)

Sidebar only: Projects · Tickets · Billing · Retainers  
Branding: client company name + "Client Portal" · footer "Powered by Dillon Morgan Consulting"  
Landing: My Projects + open tickets + recent invoices + Raise a Ticket CTA

### Create menu groups (Fig. 11)

**Activities & Communication:** Note, Email, Meeting, Task  
**CRM & Operations:** Company, Contact, Sale, Project, Ticket, Retainer, Expense, New Idea, Asset  

Each opens a lightweight modal with essentials + "More options" for full form.

---

## 5. Module product spec (summary)

Detailed UI patterns and fields are in the blueprint. Below is the product-owner contract for build sign-off.

### A. Companies

- Sub-tabs: Companies | Contacts | Assets | Quick Links
- Lists: All Active, Recently Created, Managed By Me, Classic Lists
- Grid: logo/avatar, name, status pill, AM, open projects, open tickets, last activity
- Record: header actions (New Project, New Ticket, Log Time, Invoice); tabs Overview, Contacts, Projects, Tickets, Retainers, Billing, Files, Activity Stream; right rail Quick Facts + timeline
- Shortcuts: Company Invoice, Stream, Companies Dashboard, Reports, Company Timesheet Overview, Invoice Statements

### B. Contacts

- Portal Access Yes/No with invite flow
- Lists: All Active, Recently Created, Recent Interaction, Managed By Me
- Shortcuts: My Inbox, Stream, Reports
- Security: inviting portal access creates Entra External ID (or B2C) user bound to company

### C. Sales (Phase 5 for full parity; schema early)

- Opportunities, stages, probability, expected close, quotes (Accelo parity)
- Conversion: Sale won → Project / Retainer skeleton

### D. Projects

- Sub-tabs: Projects | Milestones | Quick Links
- Health columns: progress bar, status pill, budget vs actual, overdue highlighting
- Record tabs: Overview, Milestones, Tasks, Tickets, Time & Budget, Files, Signoffs, Client Notes
- Signoffs queue: Pending / Approved / Rejected with e-sign style approve
- Portal visibility flag per project/task/milestone

### E. Tickets

- Priority chips, SLA countdown, quick-assign
- Conversation thread: client-visible replies vs internal notes (different background)
- Sources: Portal / Email / Manual
- Ticket Signoffs for resolution confirmation

### F. Retainers

- Accelo-aligned model: **Retainer** (contract) + **Periods** (budget windows)
- Allocate time from Projects/Tickets into periods
- Auto period renewal, fixed vs T&M invoicing, excess rates
- Portal: balance/usage only (no cost)

### G. Work

- Tasks list + Kanban (Assignee / Status / Deadline)
- Activities timeline: Notes, Emails, Meetings, Tasks
- My Schedule + Daily/Weekly Timesheet
- Persistent running timer chip in top bar

### H. Billing

- Tabs: Invoices | Expenses | Purchases | Materials
- Invoice banner: Outstanding / Overdue / In Terms / Paid MTD
- Print-style invoice preview + payment history + Send to Client Portal
- Expense approval inline for managers
- Payments via Stripe (portal) with webhook → invoice status

### I. Reports + Warehouse

- Dashboard cards: Schedule, Utilization, Profitability, My Work, Company, Sales, Projects, Tickets
- Categories: Client Management, Finance & Accounting, Project Management, Retainer Management, Sales, Task Management, Ticket Management, Time & Expenses
- Save custom view, schedule email, export CSV/XLSX/PDF
- Queries hit **warehouse**, not OLTP

---

## 6. Competitive position vs Accelo

### Parity DMC must ship

| Accelo capability | DMC PMO response |
| --- | --- |
| Companies, Contacts, Assets | Full Companies module |
| Projects, milestones, tasks, signoffs | Projects + Work |
| Tickets / issues + portal requests | Tickets + portal raise ticket |
| Retainers + periods + allocate work | Retainers module |
| Time tracking, timers, timesheets | Global Time menu + mobile timers |
| Invoices, expenses, materials | Billing module |
| Client portal (projects, tickets, invoices, retainers) | Restricted portal (no Sales/Quotes by default) |
| Mobile: home, timesheet, stream, expenses, tasks | Expo mobile app |
| Integrations: accounting, payments, M365 | Stripe + QuickBooks/Xero (later) + Graph email (later) |
| Security: MFA, encryption, backups, SOC2 path | Azure-native security baseline (see Architecture) |

### Intentional differences (boutique supersets)

1. **Owned Azure deployment** (single-tenant for DMC), not Accelo multi-tenant AWS
2. **First-class dimensional warehouse** (star schema + dbt) feeding native Reports
3. **Stricter portal** by default (no Sales/Quotes exposure unless Admin enables)
4. **Brand-forward DMC UI** (Navy/Gold) instead of Accelo chrome
5. **Audit-ready field redaction** designed for consulting confidentiality
6. **Migration importer** from Accelo API during transition

### Accelo strengths to respect (not ignore)

- AI resourcing / predictive risk (Phase 6+, after core PSA is solid)
- Deep HubSpot/Salesforce CRM sync
- Mature mobile stream/messaging
- Forecast capacity planning post-acquisition

Do **not** block MVP on AI. Ship accurate time, billing, portal, and security first. Predictive features come after facts are trustworthy.

---

## 7. UX / UI direction (premium 2026)

### Design tokens

```css
:root {
  --color-navy: #1F3864;
  --color-gold: #B08D57;
  --color-bg: #F7F8FA;
  --color-surface: #FFFFFF;
  --color-text: #1A2332;
  --color-muted: #5B6577;
  --color-border: #E3E7EE;
  --color-success: #1F7A4D;
  --color-warning: #C47B17;
  --color-danger: #C0352B;
  --radius-sm: 6px;
  --radius-md: 10px;
  --font-display: "Fraunces", "Source Serif 4", serif;
  --font-body: "IBM Plex Sans", "Source Sans 3", sans-serif;
}
```

### Layout rules (from mockups)

- Dark navy collapsible sidebar; gold "PMO" wordmark accent
- Status pills only for state (Active, On Track, Overdue, Urgent)
- Cards allowed for KPI tiles, Kanban cards, dashboard previews, and interactive containers. Avoid carding every list row.
- Motion (2–3 intentional): sidebar collapse spring, row hover reveal actions, timer pulse when running, Kanban drop settle
- No purple gradient themes, no cream/terracotta cliché, no broadsheet newspaper layout, no emoji chrome

### Copy rules

- Never use em dashes (`—`) or en dashes as rhetorical separators in product strings
- Prefer: "Welcome back, Dana. Here is what is happening across your Cascade Ventures projects."
- Prefer: "Work: Status Task Board"

---

## 8. Security and privacy (no data leaks)

### Threat model (high priority)

1. Client A queries Client B projects via IDOR  
2. Portal user sees internal notes or cost rates via over-fetching GraphQL/REST  
3. Staff exports all invoices without role  
4. Timer/API tokens stolen from mobile  
5. Accelo import dumps secrets into logs  
6. Warehouse credentials used by app tier  

### Controls

| Layer | Control |
| --- | --- |
| Identity | Microsoft Entra ID for internal staff; Entra External ID for portal contacts; MFA enforced for Admin/Finance |
| AuthZ | Server-side RBAC + ABAC (`company_id`, `assigned_to`, `portal_visible`) |
| API | Deny by default; OpenAPI with permission annotations; automated IDOR tests |
| Data | PostgreSQL RLS policies mirroring app rules; separate warehouse principal |
| Secrets | Azure Key Vault; Managed Identity; no secrets in repo |
| Encryption | TLS 1.2+ in transit; AES-256 at rest (Azure default + CMK optional) |
| Audit | Immutable audit log: login, permission change, invoice send, portal invite, export |
| Files | Private Blob with short-lived SAS; virus scan on upload |
| Payments | Stripe; no card data in DMC DB (PCI scope minimization) |
| Backups | Geo-redundant Postgres + Blob; tested restore runbook |
| SDLC | Secret scanning, Dependabot, SAST, PR checks, staging env with anonymized data |

### Portal redaction checklist (must pass CI)

Portal serializers exclude: cost_rate, bill_rate (internal), margin, internal notes, unshared tasks, other companies, Sales module, staff PII beyond project-visible names, expense receipts for other users, purchase costs unless explicitly shared.

---

## 9. Platform architecture (overview)

```
┌──────────────────┐   ┌──────────────────┐
│  Next.js Web App │   │ Expo Mobile App  │
│  (internal+portal│   │  (staff + portal)│
└────────┬─────────┘   └────────┬─────────┘
         │ HTTPS/JWT            │
         └──────────┬───────────┘
                    ▼
         ┌─────────────────────┐
         │  Azure API (NestJS  │
         │  or .NET 8 Minimal) │
         │  + RBAC middleware  │
         └──────────┬──────────┘
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
 Postgres OLTP   Blob Files    Redis/Cache
 (Flexible)      (private)     (timers/sess)
     │
     │ CDC / nightly ELT
     ▼
 Staging → dbt → Azure Fabric / Synapse / Postgres WH
     │
     ▼
 Reports module + Power BI (optional)
```

**Recommended stack (Azure-native, 2026)**

| Layer | Choice | Why |
| --- | --- | --- |
| Web | Next.js 15+ (App Router) on Azure Container Apps / App Service | SSR for portal SEO-less auth pages + rich internal SPA zones |
| Mobile | Expo (React Native) | Shared TypeScript types; Accelo-like timer/timesheet UX |
| API | NestJS (TypeScript) **or** ASP.NET Core 8 | Prefer NestJS if one TS team; prefer .NET if Azure/.NET skills dominate |
| OLTP | Azure Database for PostgreSQL Flexible Server | Matches blueprint; strong RLS |
| Auth | Entra ID + Entra External ID | Enterprise SSO path + portal users |
| Files | Azure Blob + Front Door | Receipts, project files |
| WH | Azure Fabric Warehouse or Synapse Serverless + dbt | Dimensional model in blueprint §6 |
| Jobs | Azure Functions / Container Apps Jobs / Dagster on ACA | ELT, SLA recalcs, reminder emails |
| Observability | Application Insights + Log Analytics | Traces, audits, SLOs |
| CI/CD | GitHub Actions → Azure | Repo already on GitHub |

Decision gate before coding Phase 1: confirm **NestJS vs .NET** with stakeholders. Default recommendation for this repo/team velocity: **TypeScript monorepo (Next.js + NestJS + Expo + shared packages)**.

---

## 10. Data model (operational + warehouse)

### Operational domains (OLTP)

`users`, `roles`, `permissions`, `companies`, `contacts`, `assets`, `sales`, `projects`, `milestones`, `tasks`, `tickets`, `ticket_messages`, `retainers`, `retainer_periods`, `time_entries`, `timers`, `expenses`, `purchases`, `materials`, `invoices`, `invoice_lines`, `payments`, `files`, `activities`, `signoffs`, `saved_views`, `audit_events`

### Warehouse (star schema from blueprint)

Dimensions: `dim_date`, `dim_company`, `dim_contact`, `dim_user`, `dim_project`, `dim_milestone`, `dim_task`, `dim_ticket`, `dim_retainer`, `dim_service_item`, `dim_activity_type` (SCD2 on company/contact)

Facts: `fact_time_entry`, `fact_invoice_line`, `fact_expense`, `fact_purchase`, `fact_material`, `fact_task_status_snapshot`, `fact_project_financials_snapshot`, `fact_ticket_sla`, `fact_sale`

---

## 11. Delivery roadmap

| Phase | Scope | Outcome |
| --- | --- | --- |
| **0** | Repo scaffold, design system, auth, RBAC skeleton, CI, Azure env (dev/staging) | Secure empty shell |
| **1** | Companies, Contacts, Projects, Milestones, Work/Tasks, Time logging | Internal delivery tracking live |
| **2** | Tickets, Retainers, Client Portal (read + limited edit), Signoffs | Clients self-serve |
| **3** | Billing (Invoices, Expenses, Purchases, Materials), Stripe pay | End-to-end billing |
| **4** | Warehouse + Reports/Dashboards | Leadership analytics |
| **5** | Sales, Assets polish, Accelo importer, mobile feature parity | Accelo exit |
| **6** | AI assists (risk flags, NL queries), advanced resourcing | Differentiation |

Phases align with blueprint §9 and Accelo research priorities (time/billing leakage first).

---

## 12. Non-functional requirements

- Availability target: 99.9% for production web/API
- p95 API < 300ms for list endpoints under normal load
- Mobile offline-tolerant draft for time entries (sync queue)
- Accessibility: WCAG 2.2 AA for internal + portal
- Localization: English first (US/CA); date formats locale-aware
- Audit retention: minimum 2 years
- RPO ≤ 1 hour, RTO ≤ 4 hours (production)

---

## 13. Open decisions (need stakeholder confirm)

1. NestJS vs ASP.NET Core for API  
2. Single Azure region initially (recommend Canada Central or East US based on DMC residency)  
3. Portal payments: Stripe Checkout vs Payment Element  
4. Accounting sync day-1 vs Phase 3.5 (QuickBooks/Xero)  
5. Whether Client Portal ever shows Sales/Quotes (Accelo yes; blueprint no; default **no**)  
6. Custom domain: `pmo.dillonmorgan.com` + `portal.dillonmorgan.com`

---

## 14. Immediate next build steps (after plan approval)

1. Scaffold TypeScript monorepo (`apps/web`, `apps/api`, `apps/mobile`, `packages/ui`, `packages/shared`)  
2. Stand up Azure resource group via Bicep/Terraform (dev)  
3. Implement Entra auth + role claims  
4. Ship Companies + Contacts CRUD with RLS + audit  
5. Design system components matching mockups (sidebar, grid, pills, record shell)  
6. Seed demo data matching blueprint figures (Cascade Ventures, etc.) for visual QA

---

## Document map

| Doc | Purpose |
| --- | --- |
| [USER_STORIES.md](./USER_STORIES.md) | Epics, user stories, acceptance criteria, use cases |
| [ARCHITECTURE_AZURE.md](./ARCHITECTURE_AZURE.md) | Azure topology, environments, CI/CD, security baseline |
| [research/ACCELLO_COMPETITIVE_ANALYSIS.md](./research/ACCELLO_COMPETITIVE_ANALYSIS.md) | Accelo website/help/ebook research notes |
| Blueprint PDF (uploaded) | Original product/UI/warehouse specification |
