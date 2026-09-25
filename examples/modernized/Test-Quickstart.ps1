#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
$work = Join-Path $PSScriptRoot ('.bookcatalog-lab\quickstart-' + [guid]::NewGuid().ToString('N'))
$originalDirectory = (Get-Location).Path
$originalConnection = [Environment]::GetEnvironmentVariable('ConnectionStrings__BookCatalogContext', 'Process')
$state = @{
    Calls = [Collections.Generic.List[string]]::new()
    Sdk = '10.0.401'
    Runtime = "Microsoft.NETCore.App 10.0.12 [runtime]`nMicrosoft.AspNetCore.App 10.0.12 [runtime]"
    Server = 'linux x86_64'
    Compose = '2.20.0'
    FailStart = $false
    FailApp = $false
    ExistingResource = $false
    Connection = ''
    Password = ''
}

function Assert-True([bool]$Condition, [string]$Message) {
    if (!$Condition) { throw $Message }
}
function Assert-Fails([scriptblock]$Action, [string]$Message) {
    $failed = $false
    try { & $Action | Out-Null } catch { $failed = $true }
    Assert-True $failed $Message
}
function docker {
    $state.Calls.Add('docker ' + ($args -join ' '))
    $global:LASTEXITCODE = 0
    if ($args[0] -eq 'info') { return $state.Server }
    if ($args[1] -eq 'version') { return $state.Compose }
    if ($args[0] -eq 'volume' -and $state.ExistingResource) { return 'existing-volume' }
    if ($args -contains 'up' -and $state.FailStart) { $global:LASTEXITCODE = 1 }
}
function dotnet {
    $state.Calls.Add('dotnet ' + ($args -join ' '))
    $global:LASTEXITCODE = 0
    switch ($args[0]) {
        '--version' { return $state.Sdk }
        '--list-runtimes' { return $state.Runtime }
        'run' {
            $state.Connection = $env:ConnectionStrings__BookCatalogContext
            $state.Password = $env:MSSQL_SA_PASSWORD
            Assert-True ($env:InitializeDatabase -eq 'true') 'The helper must enable demo initialization.'
            Assert-True ([string]::IsNullOrEmpty($env:KeyVaultName)) 'The helper must not contact Key Vault.'
            if ($state.FailApp) { $global:LASTEXITCODE = 1 }
        }
    }
}

try {
    New-Item -ItemType Directory -Path $work -Force | Out-Null
    Copy-Item (Join-Path $PSScriptRoot 'Start-BookCatalog.ps1') $work
    $helper = Join-Path $work 'Start-BookCatalog.ps1'
    $tokens = $null
    $errors = $null
    [Management.Automation.Language.Parser]::ParseFile($helper, [ref]$tokens, [ref]$errors) | Out-Null
    Assert-True ($errors.Count -eq 0) 'The helper must parse.'

    Assert-Fails { & $helper } 'The helper must require license acceptance.'
    Assert-True ($state.Calls.Count -eq 0) 'License refusal must not invoke Docker or .NET.'
    Assert-Fails { & $helper -AcceptSqlServerLicense -SqlPort 5099 } 'Ports must differ.'
    $state.Sdk = '9.0.318'
    Assert-Fails { & $helper -AcceptSqlServerLicense } 'SDK 9 must fail.'
    $state.Sdk = '11.0.100-preview.1'
    Assert-Fails { & $helper -AcceptSqlServerLicense } 'Preview SDKs must fail.'
    $state.Sdk = '10.0.401'
    $state.Server = 'linux aarch64'
    Assert-Fails { & $helper -AcceptSqlServerLicense } 'ARM must fail before starting SQL.'
    $state.Server = 'windows x86_64'
    Assert-Fails { & $helper -AcceptSqlServerLicense } 'Windows containers must fail.'
    $state.Server = 'linux x86_64'
    $state.Compose = '2.19.0'
    Assert-Fails { & $helper -AcceptSqlServerLicense } 'Old Compose must fail.'
    $state.Compose = '2.20.0'
    $state.Runtime = 'Microsoft.NETCore.App 10.0.12 [runtime]'
    Assert-Fails { & $helper -AcceptSqlServerLicense } 'The ASP.NET Core 10 runtime is required.'
    $state.Runtime += "`nMicrosoft.AspNetCore.App 10.0.12 [runtime]"
    Assert-True (!(Test-Path (Join-Path $work '.env'))) 'Failed prerequisites must not generate secrets.'
    Assert-True (!(($state.Calls -join "`n").Contains(' up '))) 'Failed prerequisites must not start SQL.'

    $state.ExistingResource = $true
    Assert-Fails { & $helper -AcceptSqlServerLicense } 'Refuse existing Docker data without its password file.'
    Assert-True (!(Test-Path (Join-Path $work '.env'))) 'Do not generate a replacement password for existing resources.'
    $state.ExistingResource = $false

    [Environment]::SetEnvironmentVariable('ConnectionStrings__BookCatalogContext', 'existing-value', 'Process')
    $options = @{ AcceptSqlServerLicense = $true; SqlPort = 15333; AppPort = 5199; ProjectName = 'bookcatalog-quickstart-check' }
    & $helper @options
    $secret = [IO.File]::ReadAllText((Join-Path $work '.env'))
    Assert-True ($state.Password.Length -ge 40) 'Generate a strong random password.'
    Assert-True ($secret.Trim() -eq "MSSQL_SA_PASSWORD=$($state.Password)") 'Compose and the app must use the same password.'
    Assert-True ($state.Connection.Contains('Server=127.0.0.1,15333;Database=BookCatalogModernizedLab;')) 'Use the isolated local SQL endpoint.'
    Assert-True ($state.Connection.Contains("Password=$($state.Password);")) 'The connection must contain the generated password.'
    Assert-True ($state.Calls.Contains('docker compose --project-name bookcatalog-quickstart-check --file compose.yaml --env-file .env up --detach --wait --wait-timeout 180 sql')) 'Wait for SQL health.'
    Assert-True ($state.Calls.Contains('dotnet run --project src\BookCatalog.Web --no-launch-profile -- --urls http://127.0.0.1:5199')) 'Launch dotnet on an explicit loopback URL.'
    & $helper @options
    Assert-True ([IO.File]::ReadAllText((Join-Path $work '.env')) -eq $secret) 'Reuse the password on restart.'
    $state.Sdk = '11.0.100'
    & $helper @options
    $state.Sdk = '10.0.401'
    Assert-True ($env:ConnectionStrings__BookCatalogContext -eq 'existing-value') 'Restore caller configuration.'
    Assert-True ((Get-Location).Path -eq $originalDirectory) 'Restore the caller directory.'

    $state.Calls.Clear()
    $state.FailStart = $true
    Assert-Fails { & $helper @options } 'A failed database start must fail the helper.'
    Assert-True (!(($state.Calls -join "`n").Contains('dotnet run '))) 'Do not run the app after SQL fails.'
    $state.FailStart = $false
    $state.FailApp = $true
    Assert-Fails { & $helper @options } 'A failed app must fail the helper.'
    Assert-True ($env:ConnectionStrings__BookCatalogContext -eq 'existing-value') 'Restore configuration after failure.'
    Assert-True ((Get-Location).Path -eq $originalDirectory) 'Restore the directory after failure.'
    [IO.File]::WriteAllText((Join-Path $work '.env'), 'invalid')
    $state.Calls.Clear()
    Assert-Fails { & $helper @options } 'Reject an invalid secret file.'
    Assert-True ([IO.File]::ReadAllText((Join-Path $work '.env')) -eq 'invalid') 'Do not overwrite an invalid secret file.'
    Assert-True (!(($state.Calls -join "`n").Contains(' up '))) 'Do not start SQL with an invalid secret.'

    $compose = Get-Content (Join-Path $PSScriptRoot 'compose.yaml') -Raw
    Assert-True ($compose.Contains('127.0.0.1:${BOOKCATALOG_SQL_PORT:-14333}:1433')) 'Bind SQL only to loopback.'
    Assert-True ($compose.Contains('SQLCMDPASSWORD="$$MSSQL_SA_PASSWORD"')) 'Read the healthcheck password inside the container.'
    Assert-True ($compose.Contains('sql-data:/var/opt/mssql')) 'Keep SQL data in a named volume.'
    Assert-True ($compose.Contains('platform: linux/amd64')) 'Use the supported SQL image platform.'
    Assert-True ((Get-Content (Join-Path $PSScriptRoot '.gitignore')) -contains '.env') 'Ignore the generated secret file.'
    Write-Host 'Quickstart checks passed: prerequisites, secrets, health wait, endpoints, restart, failures, and configuration restoration.'
} finally {
    [Environment]::SetEnvironmentVariable('ConnectionStrings__BookCatalogContext', $originalConnection, 'Process')
    if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force }
}
