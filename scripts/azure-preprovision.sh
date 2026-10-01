#!/bin/sh
set -eu

if ! azd env get-value DATABASE_PASSWORD >/dev/null 2>&1; then
  password="$(openssl rand -base64 32 | tr -d '/+=\n')Aa1!"
  azd env set DATABASE_PASSWORD "$password"
  echo "Generated DATABASE_PASSWORD for Azure Database for PostgreSQL."
fi

if ! azd env get-value ENTRA_CLIENT_ID >/dev/null 2>&1; then
  azd env set ENTRA_CLIENT_ID ""
fi

if ! azd env get-value ENTRA_TENANT_ID >/dev/null 2>&1; then
  azd env set ENTRA_TENANT_ID ""
fi
