[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = Split-Path $PSScriptRoot -Parent
if ($env:OS -ne 'Windows_NT') { throw 'This integration check requires Windows and SQL Server LocalDB.' }
$localDb = (Get-Command SqlLocalDB.exe -ErrorAction Stop).Source
$dotnet = (Get-Command dotnet -ErrorAction Stop).Source
$runId = [guid]::NewGuid().ToString('N')
$instance = "BookCatalogTransfer_$runId"
$runDirectory = Join-Path $root ".bookcatalog-lab\integration-$runId"
$oldInstance = $env:BOOKCATALOG_TRANSFER_TEST_INSTANCE
$oldDirectory = $env:BOOKCATALOG_TRANSFER_TEST_DIRECTORY
$created = $false
$stopped = $false

New-Item -ItemType Directory -Path $runDirectory | Out-Null
Set-Content -LiteralPath (Join-Path $runDirectory '.owned-instance') -Value $instance -NoNewline
try {
    & $localDb create $instance
    if ($LASTEXITCODE -ne 0) { throw 'Cannot create the dedicated integration LocalDB instance.' }
    $created = $true
    & $localDb start $instance
    if ($LASTEXITCODE -ne 0) { throw 'Cannot start the dedicated integration LocalDB instance.' }
    $env:BOOKCATALOG_TRANSFER_TEST_INSTANCE = $instance
    $env:BOOKCATALOG_TRANSFER_TEST_DIRECTORY = $runDirectory
    & $dotnet test (Join-Path $root 'tests\BookCatalog.Data.Tests\BookCatalog.Data.Tests.csproj') `
        --nologo --verbosity minimal --filter 'FullyQualifiedName~LocalDbIntegrationTests'
    if ($LASTEXITCODE -ne 0) { throw 'The real LocalDB data-transfer integration check failed.' }
    Write-Host 'Passed: real LocalDB export, preview, apply, verify, repeat, conflicts, guards and rollback.'
}
finally {
    $env:BOOKCATALOG_TRANSFER_TEST_INSTANCE = $oldInstance
    $env:BOOKCATALOG_TRANSFER_TEST_DIRECTORY = $oldDirectory
    if ($created) {
        # Only this randomly named, owned instance is stopped or deleted.
        & $localDb stop $instance -k
        if ($LASTEXITCODE -ne 0) { throw "Cannot stop owned instance $instance. Its files remain at $runDirectory." }
        $stopped = $true
        & $localDb delete $instance
        if ($LASTEXITCODE -ne 0) { throw "Cannot delete owned instance $instance. Its files remain at $runDirectory." }
    }
    if ((!$created -or $stopped) -and
        (Get-Content -LiteralPath (Join-Path $runDirectory '.owned-instance') -Raw) -eq $instance) {
        Remove-Item -LiteralPath $runDirectory -Recurse -Force
    }
}
