#!/usr/bin/env bash
#
# DMC PMO Cloud Agent start script.
# Runs on every boot. Ensures PostgreSQL is up, then reconciles schema and
# demo data. Idempotent and must return (the dev servers run as terminals).

set -euo pipefail

PG_VERSION=16
DB_USER=dmc
DB_PASSWORD=dmc
DB_NAME=dmc_pmo
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}?schema=public"

echo "==> Starting PostgreSQL cluster if needed"
if ! sudo -u postgres pg_isready -q 2>/dev/null; then
  sudo pg_ctlcluster "${PG_VERSION}" main start
fi
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q 2>/dev/null; then break; fi
  sleep 1
done

echo "==> Reconciling database schema and demo data"
pnpm --filter @dmc/api prisma:migrate:deploy
pnpm --filter @dmc/api db:seed

echo "start complete: PostgreSQL up, schema migrated, demo data seeded"
