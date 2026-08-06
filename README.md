# Dillon Morgan PMO (`dmc-pmo`)

Purpose-built Professional Services Automation / PMO platform for **Dillon Morgan Consulting Inc.**  
Designed as an Accelo replacement with boutique supersets, a client portal, mobile apps, and an Azure-hosted analytics warehouse.

## Status

**Phase: Product planning complete. Phase 0 scaffold in progress.**

The TypeScript monorepo scaffold from the master plan (section 14) is now in place:
a NestJS API, a Next.js web app, and a shared package, backed by PostgreSQL. The
first vertical slice (Companies) works end to end: create a company in the web UI,
it is validated (including the no em dash rule), persisted through the API into
PostgreSQL, and rendered back in the branded companies grid.

Planning artifacts live in [`docs/`](./docs/).

| Document | Description |
| --- | --- |
| [docs/PRODUCT_MASTER_PLAN.md](./docs/PRODUCT_MASTER_PLAN.md) | Product vision, IA, modules, UX, security, roadmap |
| [docs/USER_STORIES.md](./docs/USER_STORIES.md) | Epics, user stories, use cases, acceptance criteria |
| [docs/ARCHITECTURE_AZURE.md](./docs/ARCHITECTURE_AZURE.md) | Azure topology, identity, CI/CD, cutover |
| [docs/research/ACCELLO_COMPETITIVE_ANALYSIS.md](./docs/research/ACCELLO_COMPETITIVE_ANALYSIS.md) | Accelo research notes |

## Product pillars

1. **One system of record** for companies, sales, projects, tickets, retainers, work, billing, reports  
2. **Client portal** with strict company isolation and field redaction  
3. **Web + mobile** on one API and one permission model  
4. **Dimensional warehouse** for utilization, profitability, and delivery health  
5. **Azure production** with Entra identity, private data plane, and auditability  

## Hard product rules

- No em dashes in any user-facing copy (UI, email, PDF, mobile)  
- Portal users never see internal notes, cost/margin, or other companies  
- RBAC + PostgreSQL RLS + automated IDOR tests  

## Brand tokens (from blueprint)

- Navy: `#1F3864`  
- Gold: `#B08D57`  
- Semantic status: green / amber / red  

## Monorepo layout

```
apps/
  api/          NestJS API (Prisma + PostgreSQL): /health, /companies
  web/          Next.js 15 App Router internal shell (branded companies module)
packages/
  shared/       Shared TypeScript types, role enums, and zod schemas
docs/           Product and architecture planning
.cursor/        Cloud Agent environment (install.sh, start.sh, environment.json)
```

## Local development

Prerequisites: Node 20+ and pnpm 10. PostgreSQL 16 is provisioned automatically by
the Cloud Agent environment; for a manual setup point `DATABASE_URL` at any local
PostgreSQL instance.

```bash
pnpm install
cp .env.example .env                     # adjust DATABASE_URL if needed
pnpm --filter @dmc/shared build
pnpm --filter @dmc/api prisma:generate
pnpm --filter @dmc/api prisma:migrate:deploy
pnpm --filter @dmc/api db:seed           # seeds demo companies (Cascade Ventures, ...)

# run the two services (separate terminals)
pnpm dev:api                             # http://127.0.0.1:4000
pnpm dev:web                             # http://127.0.0.1:3000  -> /app/companies
```

In Cloud Agents this is fully automated: `.cursor/install.sh` prepares the database
and dependencies, `.cursor/start.sh` reconciles schema and seed data on boot, and the
`api` and `web` terminals run the dev servers.

## Next

Approve the remaining open decisions in the master plan (Azure region, portal
payments), then extend Phase 0 with Contacts CRUD, Entra auth, RBAC, and PostgreSQL
row level security, followed by the Phase 0 Azure environments.
