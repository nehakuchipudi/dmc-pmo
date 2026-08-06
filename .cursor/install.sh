#!/usr/bin/env bash
#
# DMC PMO Cloud Agent install script.
# Idempotent: prepares PostgreSQL, installs Node dependencies, generates the
# Prisma client, applies migrations, seeds demo data, and builds the API.
# Runs after the repository is checked out. Safe to run repeatedly.

set -euo pipefail

PG_VERSION=16
DB_USER=dmc
DB_PASSWORD=dmc
DB_NAME=dmc_pmo
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}?schema=public"

echo "==> [1/6] Ensuring PostgreSQL ${PG_VERSION} is installed"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    "postgresql-${PG_VERSION}" postgresql-client
fi

echo "==> [2/6] Starting the PostgreSQL cluster"
sudo pg_ctlcluster "${PG_VERSION}" main start 2>/dev/null || true
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q 2>/dev/null; then break; fi
  sleep 1
done

echo "==> [3/6] Ensuring the ${DB_USER} role and ${DB_NAME} database exist"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END \$\$;
ALTER ROLE ${DB_USER} CREATEDB;
SQL
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
fi

echo "==> [4/6] Installing Node dependencies"
pnpm install --frozen-lockfile

echo "==> [5/6] Building shared package, generating Prisma client, migrating and seeding"
pnpm --filter @dmc/shared build
pnpm --filter @dmc/api prisma:generate
pnpm --filter @dmc/api prisma:migrate:deploy
pnpm --filter @dmc/api db:seed

echo "==> [6/6] Building the API"
pnpm --filter @dmc/api build

echo "install complete"
