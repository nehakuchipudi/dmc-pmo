targetScope = 'resourceGroup'

@description('Short application name')
param name string

@description('Azure region')
param location string = resourceGroup().location

@description('Resource tags')
param tags object = {}

@description('azd environment name')
param environmentName string

@description('Deployer principal for Key Vault admin')
param principalId string = ''

@secure()
param databasePassword string

param entraClientId string = ''
param entraTenantId string = ''

var resourceSuffix = take(uniqueString(subscription().id, environmentName, location), 6)
var acrName = take('acrdmcpmo${resourceSuffix}', 50)
var keyVaultName = take('kv-${name}-${resourceSuffix}', 24)
var postgresName = take('psql-${name}-${resourceSuffix}', 63)
var identityName = 'id-${name}-${resourceSuffix}'
var logName = 'log-${name}-${resourceSuffix}'
var insightsName = 'appi-${name}-${resourceSuffix}'
var caeName = 'cae-${name}-${resourceSuffix}'
var caName = 'ca-${name}-${resourceSuffix}'
var databaseName = 'dmcpmo'
var adminLogin = 'dmcadmin'

var kvSecretsUserRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
var kvAdminRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '00482a5a-887f-4fb3-b363-3b7fe8e74483')
var acrPullRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
  tags: tags
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logName
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: insightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  tags: tags
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
    anonymousPullEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenant().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    enablePurgeProtection: true
    publicNetworkAccess: 'Enabled'
  }
}

resource kvSecretAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, identity.id, kvSecretsUserRole)
  scope: keyVault
  properties: {
    roleDefinitionId: kvSecretsUserRole
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource kvDeployerAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(principalId)) {
  name: guid(keyVault.id, principalId, kvAdminRole)
  scope: keyVault
  properties: {
    roleDefinitionId: kvAdminRole
    principalId: principalId
  }
}

resource databasePasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'database-password'
  properties: {
    value: databasePassword
  }
  dependsOn: [
    kvDeployerAccess
    kvSecretAccess
  ]
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: postgresName
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: adminLogin
    administratorLoginPassword: databasePassword
    storage: {
      storageSizeGB: 32
      autoGrow: 'Disabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    authConfig: {
      activeDirectoryAuth: 'Enabled'
      passwordAuth: 'Enabled'
    }
    createMode: 'Create'
  }
}

resource postgresFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2024-08-01' = {
  parent: postgres
  name: 'AllowAllAzureServicesAndResourcesWithinAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: postgres
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource postgresEntraAdmin 'Microsoft.DBforPostgreSQL/flexibleServers/administrators@2024-08-01' = {
  parent: postgres
  name: identity.name
  properties: {
    principalType: 'ServicePrincipal'
    principalName: identity.name
    tenantId: tenant().tenantId
  }
}

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, identity.id, acrPullRole)
  scope: acr
  properties: {
    roleDefinitionId: acrPullRole
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource cae 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: caeName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: caName
  location: location
  tags: union(tags, { 'azd-service-name': 'app' })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: cae.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: identity.id
        }
      ]
      secrets: [
        {
          name: 'database-password'
          value: databasePassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'dmc-pmo'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'PORT', value: '8080' }
            { name: 'DATABASE_HOST', value: postgres.properties.fullyQualifiedDomainName }
            { name: 'DATABASE_NAME', value: databaseName }
            { name: 'DATABASE_USER', value: adminLogin }
            { name: 'DATABASE_PASSWORD', secretRef: 'database-password' }
            { name: 'DATABASE_SSL', value: 'require' }
            { name: 'ENTRA_CLIENT_ID', value: entraClientId }
            { name: 'ENTRA_TENANT_ID', value: empty(entraTenantId) ? tenant().tenantId : entraTenantId }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: insights.properties.ConnectionString }
            { name: 'AZURE_CLIENT_ID', value: identity.properties.clientId }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 3
      }
    }
  }
  dependsOn: [
    acrPull
    postgresFirewallAzure
    postgresDatabase
    databasePasswordSecret
  ]
}

output acrLoginServer string = acr.properties.loginServer
output keyVaultName string = keyVault.name
output logAnalyticsId string = logAnalytics.id
output containerAppName string = containerApp.name
output appUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output postgresFqdn string = postgres.properties.fullyQualifiedDomainName
output postgresDatabase string = databaseName
output identityClientId string = identity.properties.clientId
output identityPrincipalId string = identity.properties.principalId
