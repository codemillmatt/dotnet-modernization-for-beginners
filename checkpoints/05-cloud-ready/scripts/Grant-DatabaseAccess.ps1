[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string] $ServerName,

    [Parameter(Mandatory)]
    [string] $DatabaseName,

    [Parameter(Mandatory)]
    [ValidatePattern('^[a-zA-Z0-9-]+$')]
    [string] $RuntimeIdentityName,

    [Parameter(Mandatory)]
    [guid] $RuntimeIdentityObjectId
)

$ErrorActionPreference = 'Stop'
$script = Join-Path (Split-Path -Parent $PSScriptRoot) 'database\grant-runtime-access.sql'

if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    throw 'sqlcmd is required. Install the Microsoft SQL command-line utilities and rerun the script.'
}

sqlcmd `
    -S $ServerName `
    -d $DatabaseName `
    -G `
    -l 30 `
    -i $script `
    -v "RuntimeIdentityName=$RuntimeIdentityName" "RuntimeIdentityObjectId=$RuntimeIdentityObjectId"

if ($LASTEXITCODE -ne 0) {
    throw 'Database runtime permission assignment failed.'
}
