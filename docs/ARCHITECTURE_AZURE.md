# Dillon Morgan PMO: Azure Architecture and Delivery Plan

## 1. Goal

Run a **single-tenant production system for Dillon Morgan Consulting** on Azure, with isolated non-production environments, strong identity, and a warehouse path that does not starve the OLTP database.

GitHub repository: `nehakuchipudi/dmc-pmo`

---

## 2. Environment strategy

| Environment | Purpose | Data |
| --- | --- | --- |
| `dev` | Engineers / agents | Synthetic seed only |
| `staging` | UAT, portal demos | Anonymized subset / synthetic |
| `prod` | Live firm operations | Real client data |

Rules:
- No production data in `dev`
- Portal and internal apps share API but use separate app registrations / redirect URIs
- Infrastructure as Code for every environment (Bicep preferred; Terraform acceptable)

---

## 3. Target topology

```
Internet
   │
   ▼
Azure Front Door (WAF) + custom domains
   │
   ├─► Web (Container Apps / App Service)  Next.js
   ├─► API (Container Apps)               NestJS or .NET 8
   └─► Mobile talks to API only

Identity: Entra ID (staff) + Entra External ID (portal)

Data plane:
  - PostgreSQL Flexible Server (OLTP, Private Endpoint)
  - Azure Cache for Redis
  - Storage Account (private) for files/receipts
  - Key Vault (secrets, connection strings)
  - Service Bus or Storage Queues (async jobs)

Analytics plane:
  - ELT into staging schema / Fabric Lakehouse
  - dbt models → dimensional warehouse
  - Reports API reads warehouse; Power BI optional

Ops:
  - Application Insights + Log Analytics
  - Azure Monitor alerts
  - Backup vault / Postgres PITR
  - Microsoft Defender for Cloud
```

### Suggested resource naming

`rg-dmc-pmo-{env}`  
`ca-dmc-pmo-api-{env}`  
`ca-dmc-pmo-web-{env}`  
`psql-dmc-pmo-{env}`  
`stdmcpmo{env}`  
`kv-dmc-pmo-{env}`  
`afd-dmc-pmo` (shared edge)

---

## 4. Identity and access

### Staff (internal app)

- Microsoft Entra ID app registration
- Groups or app roles mapped to: Admin, PM_AM, Staff, Finance, Leadership
- Conditional Access + MFA for Admin/Finance
- Optional: require DMC tenant devices for Admin

### Client portal

- Entra External ID (CIAM) users created from Contact invite
- Custom attributes: `company_id`, `contact_id`
- Email magic link or password + MFA optional (MFA recommended for billing payers)

### Workload identity

- User-assigned Managed Identities for API, web, jobs
- Key Vault access via RBAC
- Postgres via Entra auth where possible; otherwise KV-stored rotated passwords

### API authorization model

1. Authenticate JWT  
2. Resolve principal → role + company scopes  
3. Repository layer applies filters (`company_id IN (...)` or RLS)  
4. Response DTOs strip fields by role (portal redaction)  
5. Audit middleware records sensitive actions  

PostgreSQL **Row Level Security** is mandatory for `companies`, `projects`, `tickets`, `invoices`, `time_entries`, `files`.

---

## 5. Application design

### Monorepo layout (recommended)

```
apps/
  web/          # Next.js internal + portal route groups
  api/          # NestJS (default) or ASP.NET Core
  mobile/       # Expo
  worker/       # jobs: ELT triggers, SLA, reminders
packages/
  shared/       # zod/types, permission enums
  ui/           # design system
  eslint-config/
infra/
  bicep/
  github-actions/
```

### Web routing

- `/app/*` internal authenticated shell  
- `/portal/*` client portal shell  
- Middleware enforces audience/role; never rely on UI hiding alone  

### Mobile

- Expo with secure token storage  
- Feature parity priority: timers, timesheets, tasks, expenses, stream, portal status  
- Push notifications via Azure Notification Hubs or Expo Push for ticket/signoff events  

---

## 6. Data and integrations

| Concern | Azure service | Notes |
| --- | --- | --- |
| OLTP | PostgreSQL Flexible Server HA | Zone-redundant in prod |
| Files | Blob hot tier + private endpoints | Malware scan pipeline |
| Payments | Stripe | Webhooks to API; signature verify |
| Email | Azure Communication Services or Graph | Ticket intake later |
| Accounting | QuickBooks/Xero APIs | Post Phase 3 |
| Accelo migration | Azure Function importer | Rate-limited; idempotent upserts |
| Warehouse | Fabric Warehouse / Synapse + dbt | Nightly + optional CDC (Debezium) |

---

## 7. Security baseline (meet/beat Accelo)

Accelo publishes SOC 2 Type 2, AES-256 at rest, TLS in transit, MFA, lockout, backups, AWS multi-AZ. DMC on Azure should ship:

| Control | Implementation |
| --- | --- |
| Encryption in transit | Front Door TLS 1.2+, HTTPS only |
| Encryption at rest | Azure SSE; consider CMK via Key Vault for Postgres/Blob in prod |
| MFA | Entra CA policies |
| Lockout / password | Entra smart lockout |
| WAF | Front Door WAF (OWASP) |
| Network | Private Endpoints for Postgres, Blob, KV; no public DB |
| Secrets | Key Vault; GitHub OIDC to Azure (no long-lived cloud creds in repo) |
| Backups | Postgres PITR + geo-redundant; Blob soft delete + versioning |
| Vulnerability | Defender for Cloud, Dependabot, container scanning |
| Audit | App Insights + immutable `audit_events` table |
| Penetration test | Before Accelo cutover |
| Compliance path | Document controls for future SOC 2 if product expands |

**Data leak prevention checklist**

- IDOR test suite in CI  
- Contract tests for portal serializers  
- Separate warehouse credentials (read-only for Reports API)  
- PII minimization in logs (no invoice line dumps)  
- Admin impersonation (if any) fully audited and time-boxed  

---

## 8. CI/CD

GitHub Actions:

1. PR: lint, unit tests, typecheck, RBAC/IDOR tests, string lint (ban em dash)  
2. merge to `main`: build images → push ACR → deploy `dev`  
3. manual/approvals: deploy `staging` then `prod`  
4. Infra changes via Bicep what-if + review  

Use GitHub OIDC federated credentials to Azure subscriptions.

---

## 9. Observability and SLOs

- Availability 99.9% API/web  
- p95 latency budgets by route class  
- Alerts: 5xx spike, Postgres CPU, failed Stripe webhooks, ELT job failure, SLA breach queue depth  
- Synthetic checks: login + companies list + portal projects  

---

## 10. Cutover plan (Accelo → DMC PMO)

1. Read-only Accelo period  
2. Final importer run (companies, contacts, projects, tasks, time, invoices, retainers)  
3. DNS switch for portal domain  
4. Staff login validation day 1  
5. Client portal pilot (1–2 friendly clients) then full  
6. Keep Accelo export backup for 90 days  

---

## 11. Cost-aware sizing (initial prod)

Start small, scale with Container Apps:

- API: 1–2 vCPU, 2GB, min replicas 2  
- Web: 0.5–1 vCPU, min replicas 2  
- Postgres: Burstable/General Purpose 2–4 vCore with HA  
- Redis: Basic/Standard C1  
- Front Door + WAF  
- Fabric/Synapse Serverless until report load justifies reserved capacity  

Revisit after 30 days of metrics.

---

## 12. Decision log (to confirm)

| ID | Decision | Default |
| --- | --- | --- |
| D1 | API runtime | NestJS + TypeScript monorepo |
| D2 | Primary region | TBD (Canada Central vs East US) |
| D3 | Warehouse | Azure Fabric Warehouse + dbt |
| D4 | Portal IdP | Entra External ID |
| D5 | Payments | Stripe |
| D6 | IaC | Bicep |
