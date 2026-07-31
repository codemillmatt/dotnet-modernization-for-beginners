[CmdletBinding()]
param(
    [switch] $IncludeAzure
)

$failures = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()
$repository = Resolve-Path (Join-Path $PSScriptRoot '..')

function Require-Command {
    param(
        [Parameter(Mandatory)]
        [string] $Name,

        [Parameter(Mandatory)]
        [string] $Remediation
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        $failures.Add("$Name is missing. $Remediation")
        return $false
    }

    return $true
}

if (-not $IsWindows -and $PSVersionTable.PSEdition -eq 'Core') {
    $failures.Add('The Visual Studio and legacy application chapters require a Windows release supported by Visual Studio.')
}

if (Require-Command -Name git -Remediation 'Install Git, restart the shell, and rerun preflight.') {
    $status = git -C $repository status --porcelain
    if ($status) {
        $failures.Add('The repository working tree is not clean. Commit or safely preserve changes before running the agent.')
    }

    $branch = git -C $repository branch --show-current
    if ($branch -in @('main', 'master')) {
        $failures.Add('Create and switch to a dedicated modernization branch.')
    }
}

if (Require-Command -Name dotnet -Remediation 'Install the stable .NET 10 SDK.') {
    $sdks = dotnet --list-sdks
    if ($sdks -notmatch '(?m)^10\.0\.') {
        $failures.Add('No stable .NET 10 SDK was found. Install it and rerun preflight.')
    }
}

if ($IsWindows -or $PSVersionTable.PSEdition -eq 'Desktop') {
    $vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
    if (-not (Test-Path $vswhere)) {
        $failures.Add('Visual Studio Installer was not found. Install Visual Studio 2026 or Visual Studio 2022 17.14.17+.')
    }
    else {
        $installation = & $vswhere -latest -products * -property installationPath
        if (-not $installation) {
            $failures.Add('A supported Visual Studio installation was not found.')
        }
    }

    foreach ($command in @('msbuild', 'sqllocaldb')) {
        Require-Command -Name $command -Remediation 'Add the required Visual Studio component and open a Developer PowerShell.' | Out-Null
    }

    $warnings.Add('Manually verify .NET desktop development, ASP.NET and web development, .NET Framework 4.8 Developer Pack, IIS Express, LocalDB, GitHub Copilot, and GitHub Copilot app modernization in Visual Studio Installer.')
    $warnings.Add('Open a solution and verify that right-clicking a project shows Modernize.')
}

if ($IncludeAzure) {
    if (Require-Command -Name az -Remediation 'Install or update Azure CLI.') {
        az bicep version *> $null
        if ($LASTEXITCODE -ne 0) {
            $failures.Add('Bicep is unavailable. Run az bicep install and rerun preflight.')
        }

        az account show --query name --output none 2> $null
        if ($LASTEXITCODE -ne 0) {
            $failures.Add('Azure CLI is not signed in. Run az login for the intended sandbox tenant.')
        }
    }

    Require-Command -Name sqlcmd -Remediation 'Install Microsoft SQL command-line utilities.' | Out-Null
    $warnings.Add('Confirm Contributor plus Role Based Access Control Administrator or User Access Administrator at the deployment scope.')
    $warnings.Add('Confirm permission to configure the Azure SQL Microsoft Entra administrator and create database users.')
    $warnings.Add('Check current region/SKU availability, policy, pricing, budget, and cleanup ownership.')
}

foreach ($warning in $warnings) {
    Write-Warning $warning
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host 'Preflight passed.'
