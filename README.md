# Dillon Morgan PMO (`dmc-pmo`)

Purpose-built Professional Services Automation / PMO for **Dillon Morgan Consulting Inc.**  
Accelo replacement with boutique supersets, client portal, and Azure-ready packaging.

## Quick start

```bash
pnpm install
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000) and pick a demo role on the login screen.

| Demo user | Role | Lands on |
| --- | --- | --- |
| Dillon Morgan | Admin | Internal Companies |
| M. Doyle | Project Manager | Internal Companies |
| J. Kim | Staff | Internal Companies |
| Dana Kessler | Client Contact | Client Portal (Cascade Ventures only) |

## What's included (MVP preview)

- Internal shell: Companies, Contacts, Projects, Tickets, Retainers, Work (Kanban), Billing, Reports, Sales placeholder
- Client portal: Projects, Tickets, Billing, Retainers (company-scoped; no cost/margin)
- Global Create menu, running timer chip, Navy/Gold design system
- Seed data matching the blueprint mockups
- Docker + Bicep skeleton for Azure Container Apps
- Copy lint: no em/en dashes in `apps/web/src`

## Docs

| Document | Description |
| --- | --- |
| [docs/PRODUCT_MASTER_PLAN.md](./docs/PRODUCT_MASTER_PLAN.md) | Product vision and roadmap |
| [docs/USER_STORIES.md](./docs/USER_STORIES.md) | Epics and acceptance criteria |
| [docs/ARCHITECTURE_AZURE.md](./docs/ARCHITECTURE_AZURE.md) | Azure topology |
| [docs/research/ACCELLO_COMPETITIVE_ANALYSIS.md](./docs/research/ACCELLO_COMPETITIVE_ANALYSIS.md) | Accelo research |

## Live preview (free)

- **ShipStatic:** https://intense-seed-2n3e8oy.shipstatic.com/login/
- Claim ShipStatic permanently: https://my.shipstatic.com/claim/5710d5930266d515eb878c96cba50314fcc5d4e2edb8a4358816ace70dbe0239
- Latest URL also tracked in `docs/PREVIEW_URL.txt`

Static export lives in `apps/web/out`. Redeploy with:

```bash
GITHUB_PAGES=false pnpm --filter web build
npx -y @shipstatic/ship apps/web/out --label dmc-pmo
```

GitHub Pages: `gh-pages` branch is ready. Enable under repo Settings → Pages → Deploy from branch `gh-pages` → `/`.
