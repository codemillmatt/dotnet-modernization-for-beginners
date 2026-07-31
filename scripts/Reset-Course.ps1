[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory)]
    [ValidateSet(
        'legacy-baseline',
        '01-assessment',
        '02-planning',
        '03-modernized',
        '04-validated',
        '05-cloud-ready',
        '06-azure',
        '07-capstone'
    )]
    [string] $Checkpoint,

    # The agent names its state folder after the scenario it selects. Check
    # .github/upgrades/ in your own run and pass the folder name you find there.
    [string] $ScenarioId = 'dotnet-version-upgrade'
)

$ErrorActionPreference = 'Stop'
$repository = Resolve-Path (Join-Path $PSScriptRoot '..')
$destination = Join-Path $repository 'work'

if (-not $PSCmdlet.ShouldProcess($destination, "Replace ignored work directory with checkpoint $Checkpoint")) {
    return
}

if (Test-Path $destination) {
    Remove-Item $destination -Recurse -Force
}
New-Item $destination -ItemType Directory | Out-Null

function Copy-Tree {
    param(
        [Parameter(Mandatory)]
        [string] $Source,

        [Parameter(Mandatory)]
        [string] $Target
    )

    New-Item $Target -ItemType Directory -Force | Out-Null
    Get-ChildItem $Source -Force | Copy-Item -Destination $Target -Recurse -Force
}

function Copy-UpgradeArtifacts {
    param(
        [Parameter(Mandatory)]
        [string] $Source
    )

    $target = Join-Path $destination ".github\upgrades\$ScenarioId"
    Copy-Tree -Source $Source -Target $target
}

switch ($Checkpoint) {
    'legacy-baseline' {
        Copy-Tree -Source (Join-Path $repository 'shared-legacy-app') -Target $destination
    }
    '01-assessment' {
        Copy-Tree -Source (Join-Path $repository 'shared-legacy-app') -Target $destination
        Copy-UpgradeArtifacts -Source (Join-Path $repository 'checkpoints\01-assessment\artifacts')
    }
    '02-planning' {
        Copy-Tree -Source (Join-Path $repository 'shared-legacy-app') -Target $destination
        Copy-UpgradeArtifacts -Source (Join-Path $repository 'checkpoints\01-assessment\artifacts')
        Copy-UpgradeArtifacts -Source (Join-Path $repository 'checkpoints\02-planning\artifacts')
    }
    { $_ -in @('03-modernized', '04-validated', '05-cloud-ready', '06-azure') } {
        Copy-Tree -Source (Join-Path $repository 'checkpoints\03-modernized') -Target $destination

        if ($Checkpoint -in @('04-validated', '05-cloud-ready', '06-azure')) {
            Copy-Tree -Source (Join-Path $repository 'checkpoints\04-validated') -Target (Join-Path $destination 'validation')
        }

        if ($Checkpoint -in @('05-cloud-ready', '06-azure')) {
            foreach ($folder in @('database', 'infra', 'scripts')) {
                Copy-Tree `
                    -Source (Join-Path $repository "checkpoints\05-cloud-ready\$folder") `
                    -Target (Join-Path $destination $folder)
            }
            Copy-Item `
                (Join-Path $repository 'checkpoints\05-cloud-ready\README.md') `
                (Join-Path $destination 'CLOUD-CHECKPOINT.md')
        }

        if ($Checkpoint -eq '06-azure') {
            Copy-Tree -Source (Join-Path $repository 'checkpoints\06-azure') -Target (Join-Path $destination 'deployment-evidence')
        }
    }
    '07-capstone' {
        Copy-Tree -Source (Join-Path $repository 'templates') -Target $destination
        Copy-Tree -Source (Join-Path $repository 'checkpoints\07-capstone') -Target (Join-Path $destination 'rubric')
    }
}

Write-Host "Checkpoint $Checkpoint is available at $destination."
