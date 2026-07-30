using './main.bicep'

param namePrefix = readEnvironmentVariable('BOOKCATALOG_NAME_PREFIX')
param location = readEnvironmentVariable('BOOKCATALOG_LOCATION')
param sqlAdministratorPassword = readEnvironmentVariable('BOOKCATALOG_SQL_ADMIN_PASSWORD')
param sqlEntraAdministratorLogin = readEnvironmentVariable('BOOKCATALOG_ENTRA_ADMIN_LOGIN')
param sqlEntraAdministratorObjectId = readEnvironmentVariable('BOOKCATALOG_ENTRA_ADMIN_OBJECT_ID')
