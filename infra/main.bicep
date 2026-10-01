targetScope = 'subscription'

@description('azd environment name, for example dmc-pmo-dev')
param environmentName string

@description('Azure region for all resources')
param location string

@description('Signed-in principal used for Key Vault administration')
param principalId string = ''

@secure()
@description('PostgreSQL admin password. Generated in preprovision and stored in Key Vault.')
param databasePassword string

@description('Entra SPA application (client) ID. Empty until postprovision registers the app.')
param entraClientId string = ''

@description('Entra tenant ID for staff sign-in')
param entraTenantId string = ''

var tags = {
  'azd-env-name': environmentName
  application: 'dmc-pmo'
}

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'rg-dmc-pmo-${environmentName}'
  location: location
  tags: tags
}

module resources 'modules/resources.bicep' = {
  name: 'dmc-pmo-resources'
  scope: rg
  params: {
    name: 'dmc-pmo'
    location: location
    tags: tags
    environmentName: environmentName
    principalId: principalId
    databasePassword: databasePassword
    entraClientId: entraClientId
    entraTenantId: entraTenantId
  }
}

output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = rg.name
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = resources.outputs.acrLoginServer
output AZURE_KEY_VAULT_NAME string = resources.outputs.keyVaultName
output AZURE_LOG_ANALYTICS_WORKSPACE_ID string = resources.outputs.logAnalyticsId
output SERVICE_APP_NAME string = resources.outputs.containerAppName
output SERVICE_APP_URI string = resources.outputs.appUrl
output SERVICE_APP_ENDPOINTS array = [
  resources.outputs.appUrl
]
output WEB_URL string = resources.outputs.appUrl
output API_URL string = resources.outputs.appUrl
output POSTGRES_FQDN string = resources.outputs.postgresFqdn
output POSTGRES_DATABASE string = resources.outputs.postgresDatabase
output APP_IDENTITY_CLIENT_ID string = resources.outputs.identityClientId
output APP_IDENTITY_PRINCIPAL_ID string = resources.outputs.identityPrincipalId
