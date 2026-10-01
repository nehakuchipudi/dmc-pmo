#!/bin/sh
set -eu

app_url="$(azd env get-value WEB_URL 2>/dev/null || true)"
tenant_id="$(azd env get-value AZURE_TENANT_ID 2>/dev/null || true)"
existing="$(azd env get-value ENTRA_CLIENT_ID 2>/dev/null || true)"
rg="$(azd env get-value AZURE_RESOURCE_GROUP 2>/dev/null || true)"
app_name="$(azd env get-value SERVICE_APP_NAME 2>/dev/null || true)"

if [ -z "$app_url" ]; then
  echo "WEB_URL is not set; skip Entra app registration."
  exit 0
fi

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is not installed; skip Entra app registration."
  exit 0
fi

if ! az account show >/dev/null 2>&1; then
  echo "Azure CLI is not signed in; skip Entra app registration."
  exit 0
fi

redirect="${app_url%/}/auth/callback/"
display_name="DMC PMO"

if [ -n "$existing" ]; then
  client_id="$existing"
  az ad app update --id "$client_id" --enable-id-token-issuance true >/dev/null
  az rest --method patch \
    --uri "https://graph.microsoft.com/v1.0/applications(appId='$client_id')" \
    --headers "Content-Type=application/json" \
    --body "{\"spa\":{\"redirectUris\":[\"$redirect\",\"http://localhost:3000/auth/callback/\"]}}" >/dev/null || true
else
  client_id="$(az ad app create \
    --display-name "$display_name" \
    --sign-in-audience AzureADandPersonalMicrosoftAccount \
    --enable-id-token-issuance true \
    --query appId -o tsv)"
  az rest --method patch \
    --uri "https://graph.microsoft.com/v1.0/applications(appId='$client_id')" \
    --headers "Content-Type=application/json" \
    --body "{\"spa\":{\"redirectUris\":[\"$redirect\",\"http://localhost:3000/auth/callback/\"]}}" >/dev/null
  az ad app permission add --id "$client_id" --api 00000003-0000-0000-c000-000000000000 --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope >/dev/null || true
  azd env set ENTRA_CLIENT_ID "$client_id"
fi

if [ -n "$tenant_id" ]; then
  azd env set ENTRA_TENANT_ID "$tenant_id"
fi

if [ -n "$rg" ] && [ -n "$app_name" ] && [ -n "$client_id" ]; then
  az containerapp update \
    --name "$app_name" \
    --resource-group "$rg" \
    --set-env-vars "ENTRA_CLIENT_ID=$client_id" "ENTRA_TENANT_ID=${tenant_id}" \
    >/dev/null
  echo "Entra app $client_id registered for $redirect"
fi
