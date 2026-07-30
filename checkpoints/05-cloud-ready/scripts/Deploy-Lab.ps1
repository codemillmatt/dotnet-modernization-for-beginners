[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)]
    [string] $SubscriptionId,

    [Parameter(Mandatory)]
    [ValidatePattern('^[a-z0-9-]{3,12}$')]
    [string] $NamePrefix,

    [Parameter(Mandatory)]
    [string] $ResourceGroup,

    [Parameter(Mandatory)]
    [string] $Location,

    [Parameter(Mandatory)]
    [string] $EntraAdministratorLogin,

    [Parameter(Mandatory)]
    [guid] $EntraAdministratorObjectId
)

$ErrorActionPreference = 'Stop'
$checkpoint = Split-Path -Parent $PSScriptRoot
$repository = Resolve-Path (Join-Path $checkpoint '..\..')
$modernized = Join-Path $repository 'checkpoints\03-modernized'
$template = Join-Path $checkpoint 'infra\main.bicepparam'
$bootstrapPassword = Read-Host 'Enter a new SQL bootstrap administrator password' -AsSecureString
$plainPassword = [System.Net.NetworkCredential]::new('', $bootstrapPassword).Password

try {
    $env:BOOKCATALOG_NAME_PREFIX = $NamePrefix
    $env:BOOKCATALOG_LOCATION = $Location
    $env:BOOKCATALOG_SQL_ADMIN_PASSWORD = $plainPassword
    $env:BOOKCATALOG_ENTRA_ADMIN_LOGIN = $EntraAdministratorLogin
    $env:BOOKCATALOG_ENTRA_ADMIN_OBJECT_ID = $EntraAdministratorObjectId

    az account set --subscription $SubscriptionId
    az group create --name $ResourceGroup --location $Location --output none

    az deployment group what-if `
        --resource-group $ResourceGroup `
        --parameters $template

    if (-not $PSCmdlet.ShouldProcess($ResourceGroup, 'Provision lab infrastructure and deploy BookCatalog')) {
        return
    }

    $outputs = az deployment group create `
        --name 'bookcatalog-lab' `
        --resource-group $ResourceGroup `
        --parameters $template `
        --query properties.outputs `
        --output json | ConvertFrom-Json

    $migrationConnection = "Server=tcp:$($outputs.sqlServerFullyQualifiedDomainName.value),1433;Database=$($outputs.databaseName.value);Authentication=Active Directory Default;Encrypt=True;TrustServerCertificate=False;"
    Push-Location $modernized
    try {
        dotnet restore .\BookCatalog.slnx
        dotnet test .\BookCatalog.slnx --configuration Release
        dotnet ef database update `
            --project .\src\BookCatalog.Web\BookCatalog.Web.csproj `
            --startup-project .\src\BookCatalog.Web\BookCatalog.Web.csproj `
            --connection $migrationConnection
        dotnet publish .\src\BookCatalog.Web\BookCatalog.Web.csproj `
            --configuration Release `
            --output .\publish
    }
    finally {
        Pop-Location
    }

    & (Join-Path $PSScriptRoot 'Grant-DatabaseAccess.ps1') `
        -ServerName $outputs.sqlServerFullyQualifiedDomainName.value `
        -DatabaseName $outputs.databaseName.value `
        -RuntimeIdentityName $outputs.runtimeIdentityName.value `
        -RuntimeIdentityObjectId $outputs.runtimeIdentityObjectId.value

    Compress-Archive `
        -Path (Join-Path $modernized 'publish\*') `
        -DestinationPath (Join-Path $modernized 'bookcatalog.zip') `
        -Force
    az webapp deploy `
        --resource-group $ResourceGroup `
        --name $outputs.appName.value `
        --src-path (Join-Path $modernized 'bookcatalog.zip') `
        --type zip `
        --output none

    & (Join-Path $PSScriptRoot 'Test-DeployedBehavior.ps1') -BaseUrl $outputs.appUrl.value
}
finally {
    $plainPassword = $null
    Remove-Item Env:\BOOKCATALOG_NAME_PREFIX -ErrorAction SilentlyContinue
    Remove-Item Env:\BOOKCATALOG_LOCATION -ErrorAction SilentlyContinue
    Remove-Item Env:\BOOKCATALOG_SQL_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:\BOOKCATALOG_ENTRA_ADMIN_LOGIN -ErrorAction SilentlyContinue
    Remove-Item Env:\BOOKCATALOG_ENTRA_ADMIN_OBJECT_ID -ErrorAction SilentlyContinue
}
