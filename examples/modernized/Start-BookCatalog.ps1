#Requires -Version 5.1
[CmdletBinding()]
param(
    [switch]$AcceptSqlServerLicense,
    [ValidateRange(1024, 65535)]
    [int]$SqlPort = 14333,
    [ValidateRange(1024, 65535)]
    [int]$AppPort = 5099,
    [ValidatePattern('^[a-z0-9][a-z0-9_-]*$')]
    [string]$ProjectName = 'bookcatalog-reference'
)

$ErrorActionPreference = 'Stop'
if (!$AcceptSqlServerLicense) {
    throw 'Read the SQL Server license link in README.md. Rerun with -AcceptSqlServerLicense if you accept it.'
}
if ($SqlPort -eq $AppPort) { throw 'SqlPort and AppPort must be different.' }

function Invoke-Checked([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit $LASTEXITCODE. See the output above." }
}

Push-Location $PSScriptRoot
$environment = @{}
try {
    Get-Command docker, dotnet -ErrorAction Stop | Out-Null
    $sdk = Invoke-Checked dotnet @('--version')
    if (($sdk | Out-String).Trim() -notmatch '^([1-9][0-9]+)\.\d+\.\d+$' -or [int]$Matches[1] -lt 10) {
        throw 'Install a stable .NET SDK 10 or later. Preview SDKs are not supported.'
    }
    $runtimes = (Invoke-Checked dotnet @('--list-runtimes')) -join "`n"
    foreach ($runtime in @('Microsoft.NETCore.App', 'Microsoft.AspNetCore.App')) {
        if ($runtimes -notmatch "(?m)^$([regex]::Escape($runtime)) 10\.0\.\d+ ") {
            throw "Install the .NET 10 runtime for $runtime. A later SDK alone may not include it."
        }
    }
    $server = (Invoke-Checked docker @('info', '--format', '{{.OSType}} {{.Architecture}}')) -join ''
    if ($server.Trim() -notmatch '^linux (x86_64|amd64)$') {
        throw 'Use Docker with Linux containers on an x64 machine. This SQL Server image does not support ARM.'
    }
    $compose = (Invoke-Checked docker @('compose', 'version', '--short')) -join ''
    if ($compose.Trim().TrimStart('v') -notmatch '^(\d+)\.(\d+)\.' -or
        [int]$Matches[1] -lt 2 -or ([int]$Matches[1] -eq 2 -and [int]$Matches[2] -lt 20)) {
        throw 'Use Docker Compose 2.20 or later so the helper can wait for a healthy database.'
    }

    $secretFile = Join-Path $PSScriptRoot '.env'
    if (!(Test-Path -LiteralPath $secretFile)) {
        $containers = Invoke-Checked docker @('ps', '--all', '--quiet', '--filter', "label=com.docker.compose.project=$ProjectName")
        $volumes = Invoke-Checked docker @('volume', 'ls', '--quiet', '--filter', "label=com.docker.compose.project=$ProjectName")
        if ($containers -or $volumes) {
            throw "Docker resources for $ProjectName already exist, but this copy has no .env. Use the original sample copy or restore its .env."
        }
        $bytes = New-Object byte[] 32
        $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
        $password = 'Bc1!' + [Convert]::ToBase64String($bytes)
        # Keep the same password when the persistent SQL volume is used again.
        [IO.File]::WriteAllText($secretFile, "MSSQL_SA_PASSWORD=$password`n", [Text.Encoding]::ASCII)
    }
    $secret = [IO.File]::ReadAllText($secretFile).Trim()
    if ($secret -notmatch '^MSSQL_SA_PASSWORD=([A-Za-z0-9+/=!]{24,128})$') {
        throw 'The .env file is not in the generated format. Restore its original content; do not replace a volume password.'
    }
    $password = $Matches[1]
    $values = @{
        MSSQL_SA_PASSWORD = $password
        BOOKCATALOG_SQL_PORT = [string]$SqlPort
        ConnectionStrings__BookCatalogContext = "Server=127.0.0.1,$SqlPort;Database=BookCatalogModernizedLab;User ID=sa;Password=$password;Encrypt=True;TrustServerCertificate=True"
        InitializeDatabase = 'true'
        KeyVaultName = ''
        ASPNETCORE_ENVIRONMENT = 'Development'
        DOTNET_ENVIRONMENT = 'Development'
    }
    foreach ($key in $values.Keys) {
        $environment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
        [Environment]::SetEnvironmentVariable($key, $values[$key], 'Process')
    }

    Write-Host 'Starting the reference SQL Server. The first image download can take several minutes.'
    Invoke-Checked docker @('compose', '--project-name', $ProjectName, '--file', 'compose.yaml',
        '--env-file', '.env', 'up', '--detach', '--wait', '--wait-timeout', '180', 'sql')
    Write-Host "Open http://127.0.0.1:$AppPort. Press Ctrl+C to stop the app; SQL Server stays available."
    Invoke-Checked dotnet @('run', '--project', 'src\BookCatalog.Web', '--no-launch-profile',
        '--', '--urls', "http://127.0.0.1:$AppPort")
} finally {
    foreach ($key in $environment.Keys) {
        [Environment]::SetEnvironmentVariable($key, $environment[$key], 'Process')
    }
    Pop-Location
}
