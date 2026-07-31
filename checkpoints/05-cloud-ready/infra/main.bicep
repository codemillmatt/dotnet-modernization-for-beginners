targetScope = 'resourceGroup'

@description('Short lowercase prefix used to derive globally unique resource names.')
@minLength(3)
@maxLength(12)
param namePrefix string

@description('Azure region. Verify service and SKU availability before deployment.')
param location string = resourceGroup().location

@description('App Service plan SKU for the lab. Reassess this choice for production.')
@allowed([
  'F1'
  'B1'
  'S1'
  'P0v3'
])
param appServiceSku string = 'B1'

@description('Azure SQL Database service objective for the lab.')
param sqlDatabaseSku string = 'Basic'

@description('SQL authentication administrator used only to bootstrap the logical server.')
param sqlAdministratorLogin string = 'sqlbootstrap'

@secure()
@description('SQL bootstrap administrator password. Supply through an environment variable; never commit it.')
param sqlAdministratorPassword string

@description('Display name of the Microsoft Entra administrator that applies migrations.')
param sqlEntraAdministratorLogin string

@description('Object ID of the Microsoft Entra administrator that applies migrations.')
param sqlEntraAdministratorObjectId string

@description('Allows Azure-hosted services through the SQL public firewall for this learning lab.')
param allowAzureServices bool = true

var suffix = uniqueString(subscription().id, resourceGroup().id, namePrefix)
var appName = toLower('${namePrefix}-web-${suffix}')
var planName = '${namePrefix}-plan'
var sqlServerName = toLower('${namePrefix}-sql-${suffix}')
var databaseName = '${namePrefix}-catalog'
var vaultName = take(toLower('${namePrefix}-kv-${suffix}'), 24)
var workspaceName = '${namePrefix}-logs'
var insightsName = '${namePrefix}-insights'
var keyVaultSecretsUserRoleId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '4633458b-17de-408a-b874-0445c86b69e6'
)

resource plan 'Microsoft.Web/serverfarms@2024-11-01' = {
  name: planName
  location: location
  kind: 'linux'
  sku: {
    name: appServiceSku
  }
  properties: {
    reserved: true
  }
}

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  properties: {
    retentionInDays: 30
  }
}

resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: insightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspace.id
  }
}

resource sqlServer 'Microsoft.Sql/servers@2023-08-01' = {
  name: sqlServerName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    administratorLogin: sqlAdministratorLogin
    administratorLoginPassword: sqlAdministratorPassword
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

resource entraAdministrator 'Microsoft.Sql/servers/administrators@2023-08-01' = {
  parent: sqlServer
  name: 'ActiveDirectory'
  properties: {
    administratorType: 'ActiveDirectory'
    login: sqlEntraAdministratorLogin
    sid: sqlEntraAdministratorObjectId
    tenantId: tenant().tenantId
  }
}

resource database 'Microsoft.Sql/servers/databases@2023-08-01' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: {
    name: sqlDatabaseSku
  }
  properties: {
    zoneRedundant: false
  }
}

resource allowAzureFirewall 'Microsoft.Sql/servers/firewallRules@2023-08-01' = if (allowAzureServices) {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource vault 'Microsoft.KeyVault/vaults@2024-11-01' = {
  name: vaultName
  location: location
  properties: {
    tenantId: tenant().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enableSoftDelete: true
    enablePurgeProtection: true
    publicNetworkAccess: 'Enabled'
  }
}

var runtimeConnectionString = 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Database=${database.name};Authentication=Active Directory Default;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

resource connectionSecret 'Microsoft.KeyVault/vaults/secrets@2024-11-01' = {
  parent: vault
  name: 'bookcatalog-connection'
  properties: {
    value: runtimeConnectionString
  }
}

resource webApp 'Microsoft.Web/sites@2024-11-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      alwaysOn: appServiceSku != 'F1'
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      linuxFxVersion: 'DOTNETCORE|10.0'
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: 'Production'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: insights.properties.ConnectionString
        }
        {
          name: 'ConnectionStrings__BookCatalogContext'
          value: '@Microsoft.KeyVault(SecretUri=${connectionSecret.properties.secretUriWithVersion})'
        }
        {
          name: 'Database__ApplyMigrationsOnStartup'
          value: 'false'
        }
        {
          name: 'Database__SeedOnStartup'
          value: 'false'
        }
      ]
    }
  }
}

resource vaultAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(vault.id, webApp.id, keyVaultSecretsUserRoleId)
  scope: vault
  properties: {
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRoleId
  }
}

output appName string = webApp.name
output appUrl string = 'https://${webApp.properties.defaultHostName}'
output databaseName string = database.name
output keyVaultName string = vault.name
output runtimeIdentityName string = webApp.name
output runtimeIdentityObjectId string = webApp.identity.principalId
output sqlServerFullyQualifiedDomainName string = sqlServer.properties.fullyQualifiedDomainName
