param([switch]$BuildOnly)
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'This check requires Windows.' }

$root = Split-Path $PSScriptRoot -Parent
$work = Join-Path ([IO.Path]::GetTempPath()) ('bookcatalog-legacy-' + [guid]::NewGuid().ToString('N'))
$process = $null
$databaseFile = Join-Path $work 'src\BookCatalog.Web\App_Data\BookCatalog.mdf'
$errors = New-Object 'System.Collections.Generic.List[string]'
$canRemoveCopy = $true
function Invoke-Checked($Command, $Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit $LASTEXITCODE." }
}
try {
    $nuget = (Get-Command nuget -ErrorAction Stop).Source
    $vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
    $msbuild = & $vswhere -latest -products '*' -requires Microsoft.Component.MSBuild -find 'MSBuild\**\Bin\MSBuild.exe' | Select-Object -First 1
    if (!$msbuild) { throw 'Install Visual Studio web build tools and MSBuild.' }
    New-Item -ItemType Directory -Path $work | Out-Null
    Push-Location $root
    try {
        $files = git ls-files shared-legacy-app
        if ($LASTEXITCODE -ne 0) { throw 'Git could not list the legacy source.' }
        foreach ($file in $files) {
            $relative = $file.Substring('shared-legacy-app/'.Length)
            $destination = Join-Path $work $relative
            New-Item -ItemType Directory -Force -Path (Split-Path $destination -Parent) | Out-Null
            Copy-Item (Join-Path $root $file) $destination
        }
    } finally { Pop-Location }
    Invoke-Checked $nuget @('restore', (Join-Path $work 'BookCatalog.sln'), '-NonInteractive', '-Verbosity', 'quiet')
    Invoke-Checked $msbuild @((Join-Path $work 'BookCatalog.sln'), '/t:Rebuild', '/p:Configuration=Debug', '/verbosity:minimal', '/nologo')
    if (!$BuildOnly) {
        $iis = Join-Path $env:ProgramFiles 'IIS Express\iisexpress.exe'
        if (!(Test-Path $iis)) { throw 'Install IIS Express before the runtime check.' }
        Invoke-Checked sqllocaldb @('start', 'MSSQLLocalDB')
        $webRoot = Join-Path $work 'src\BookCatalog.Web'
        New-Item -ItemType Directory -Force (Join-Path $webRoot 'App_Data') | Out-Null
        $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
        $listener.Start()
        $port = $listener.LocalEndpoint.Port
        $listener.Stop()
        $process = Start-Process $iis -ArgumentList "/path:`"$webRoot`" /port:$port /clr:v4.0 /systray:false" -PassThru `
            -RedirectStandardOutput (Join-Path $work 'iis.log') -RedirectStandardError (Join-Path $work 'iis-error.log')
        $url = "http://localhost:$port"
        $response = $null
        $lastFailure = ''
        for ($attempt = 0; $attempt -lt 30; $attempt++) {
            if ($process.HasExited) { throw 'IIS Express stopped before the application was ready.' }
            try {
                $response = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 3
                break
            } catch {
                $lastFailure = $_.Exception.Message
                Start-Sleep -Seconds 1
            }
        }
        if (!$response) { throw "The legacy app did not become ready. $lastFailure" }
        if ([regex]::Matches($response.Content, 'class="badge-active"').Count -ne 6) {
            throw 'The fresh legacy catalog did not contain six active records.'
        }
        if ($response.Content -match 'The Matrix:') { throw 'The legacy list included an inactive record.' }
        try {
            Invoke-WebRequest "$url/Books/Details/2147483647" -UseBasicParsing -TimeoutSec 5 | Out-Null
            throw 'The missing record did not return HTTP 404.'
        } catch {
            if (!$_.Exception.Response -or [int]$_.Exception.Response.StatusCode -ne 404) { throw }
        }
        Write-Host 'The legacy build, active catalog, and missing-record checks passed.'
    } else {
        Write-Host 'The legacy build passed. Runtime checks did not run.'
    }
} catch {
    $errors.Add($_.Exception.Message)
} finally {
    if ($process -and !$process.HasExited) {
        try { Stop-Process -Id $process.Id -Force -ErrorAction Stop } catch { $errors.Add($_.Exception.Message) }
    }
    if (Test-Path $databaseFile) {
        $connection = New-Object System.Data.SqlClient.SqlConnection 'Server=(localdb)\MSSQLLocalDB;Database=master;Integrated Security=True'
        try {
            $connection.Open()
            $command = $connection.CreateCommand()
            $command.CommandText = 'SELECT DB_NAME(database_id) FROM sys.master_files WHERE physical_name = @path'
            $command.Parameters.AddWithValue('@path', $databaseFile) | Out-Null
            $name = $command.ExecuteScalar()
            if ($name -and $name -ne [DBNull]::Value) {
                $detach = $connection.CreateCommand()
                $detach.CommandText = 'EXEC sp_detach_db @dbname'
                $detach.Parameters.AddWithValue('@dbname', $name) | Out-Null
                $detach.ExecuteNonQuery() | Out-Null
            }
        } catch {
            $canRemoveCopy = $false
            $errors.Add("The isolated database could not detach. Keep $work for inspection. $($_.Exception.Message)")
        } finally { $connection.Dispose() }
    }
    if ($canRemoveCopy -and (Test-Path $work)) {
        try {
            if ((Split-Path $work -Leaf) -notmatch '^bookcatalog-legacy-[0-9a-f]{32}$') {
                throw 'The cleanup path is not an isolated legacy test directory.'
            }
            Remove-Item -LiteralPath $work -Recurse -Force
        } catch { $errors.Add($_.Exception.Message) }
    }
}
if ($errors.Count) { throw ($errors -join [Environment]::NewLine) }
