# Dillon Morgan PMO (`dmc-pmo`)

Purpose-built Professional Services Automation / PMO platform for **Dillon Morgan Consulting Inc.**  
Designed as an Accelo replacement with boutique supersets, a client portal, mobile apps, and an Azure-hosted analytics warehouse.

## Status

**Phase: Product planning complete.** Implementation has not started.

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

## Next

Approve open decisions in the master plan (API stack, Azure region, portal payments), then scaffold the monorepo and Phase 0 Azure environments.
