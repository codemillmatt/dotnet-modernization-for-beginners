$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'This check requires Windows and SQL Server LocalDB.' }
Add-Type -AssemblyName System.Net.Http
Add-Type -AssemblyName System.Data

$root = Split-Path $PSScriptRoot -Parent
$id = [guid]::NewGuid().ToString('N')
$work = Join-Path $root "artifacts\bookcatalog-modernized-$id"
$instance = "BookCatalogCheck_$id"
$connectionString = "Server=(localdb)\$instance;Database=BookCatalogModernizedLab;Integrated Security=True;TrustServerCertificate=True"
$process = $null
$client = $null
$instanceCreated = $false
$canRemoveCopy = $true
$errors = New-Object 'System.Collections.Generic.List[string]'

function Invoke-Checked($Command, $Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit $LASTEXITCODE." }
}

function Stop-App {
    if ($script:process) {
        if (!$script:process.HasExited) {
            Stop-Process -Id $script:process.Id -Force -ErrorAction Stop
        }
        if (!$script:process.WaitForExit(15000)) { throw 'The isolated application did not stop.' }
        [IO.File]::AppendAllText((Join-Path $work 'application.log'), $script:stdout.GetAwaiter().GetResult())
        [IO.File]::AppendAllText((Join-Path $work 'application.log'), $script:stderr.GetAwaiter().GetResult())
        $script:process.Dispose()
        $script:process = $null
    }
}

function Start-App {
    $start = New-Object Diagnostics.ProcessStartInfo
    $start.FileName = (Get-Command dotnet -ErrorAction Stop).Source
    $start.Arguments = '"' + (Join-Path $work 'app\BookCatalog.Web.dll') + '"'
    $start.WorkingDirectory = Join-Path $work 'app'
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.EnvironmentVariables['ConnectionStrings__BookCatalogContext'] = $connectionString
    $start.EnvironmentVariables['InitializeDatabase'] = 'true'
    $start.EnvironmentVariables['KeyVaultName'] = ''
    $start.EnvironmentVariables['ASPNETCORE_ENVIRONMENT'] = 'Development'
    $start.EnvironmentVariables['DOTNET_ENVIRONMENT'] = 'Development'
    $start.EnvironmentVariables['ASPNETCORE_URLS'] = $url
    $script:process = [Diagnostics.Process]::Start($start)
    $script:stdout = $script:process.StandardOutput.ReadToEndAsync()
    $script:stderr = $script:process.StandardError.ReadToEndAsync()
    $lastError = ''
    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        if ($script:process.HasExited) { throw 'The isolated application exited before readiness.' }
        try {
            $response = $client.GetAsync($url).GetAwaiter().GetResult()
            try {
                if ([int]$response.StatusCode -eq 200) { return }
                $lastError = "HTTP $([int]$response.StatusCode)"
            } finally { $response.Dispose() }
        } catch { $lastError = $_.Exception.Message }
        Start-Sleep -Seconds 1
    }
    throw "The isolated application did not become ready. $lastError"
}

function Read-Page([string]$Path) {
    $response = $client.GetAsync("$url$Path").GetAwaiter().GetResult()
    try {
        return [pscustomobject]@{
            Status = [int]$response.StatusCode
            Body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        }
    } finally { $response.Dispose() }
}

function Submit-Form([string]$Path, [hashtable]$Fields, [switch]$WithoutToken) {
    $data = New-Object 'System.Collections.Generic.Dictionary[string,string]'
    foreach ($key in $Fields.Keys) { $data.Add($key, [string]$Fields[$key]) }
    if (!$WithoutToken) {
        $page = Read-Page $Path
        if ($page.Status -ne 200) { throw "The form $Path returned HTTP $($page.Status)." }
        $input = [regex]::Match($page.Body, '<input\b[^>]*name="__RequestVerificationToken"[^>]*>')
        $token = [regex]::Match($input.Value, '\bvalue="([^"]+)"').Groups[1].Value
        if (!$token) { throw "The form $Path has no antiforgery token." }
        $data.Add('__RequestVerificationToken', [Net.WebUtility]::HtmlDecode($token))
    }
    $content = [System.Net.Http.FormUrlEncodedContent]::new($data)
    try {
        $response = $client.PostAsync("$url$Path", $content).GetAwaiter().GetResult()
        try {
            return [pscustomobject]@{
                Status = [int]$response.StatusCode
                Body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
            }
        } finally { $response.Dispose() }
    } finally { $content.Dispose() }
}

function Read-Scalar([string]$Sql, [hashtable]$Parameters = @{}) {
    $connection = New-Object System.Data.SqlClient.SqlConnection $connectionString
    try {
        $connection.Open()
        $command = $connection.CreateCommand()
        try {
            $command.CommandText = $Sql
            foreach ($key in $Parameters.Keys) { $command.Parameters.AddWithValue($key, $Parameters[$key]) | Out-Null }
            return $command.ExecuteScalar()
        } finally { $command.Dispose() }
    } finally { $connection.Dispose() }
}

try {
    Get-Command dotnet, sqllocaldb -ErrorAction Stop | Out-Null
    New-Item -ItemType Directory -Path $work | Out-Null
    Invoke-Checked dotnet @('publish', (Join-Path $root 'examples\modernized\src\BookCatalog.Web\BookCatalog.Web.csproj'),
        '-c', 'Release', '-o', (Join-Path $work 'app'), '--verbosity', 'minimal')
    Invoke-Checked sqllocaldb @('create', $instance)
    $instanceCreated = $true
    Invoke-Checked sqllocaldb @('start', $instance)
    $master = New-Object System.Data.SqlClient.SqlConnection "Server=(localdb)\$instance;Database=master;Integrated Security=True"
    try {
        $master.Open()
        $command = $master.CreateCommand()
        try {
            $dataPath = (Join-Path $work 'BookCatalogModernizedLab.mdf').Replace("'", "''")
            $logPath = (Join-Path $work 'BookCatalogModernizedLab_log.ldf').Replace("'", "''")
            $command.CommandText = "CREATE DATABASE [BookCatalogModernizedLab] ON PRIMARY (NAME = N'BookCatalogModernizedLab', FILENAME = N'$dataPath') LOG ON (NAME = N'BookCatalogModernizedLab_log', FILENAME = N'$logPath')"
            $command.ExecuteNonQuery() | Out-Null
        } finally { $command.Dispose() }
    } finally { $master.Dispose() }
    $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $port = $listener.LocalEndpoint.Port
    $listener.Stop()
    $url = "http://127.0.0.1:$port"
    $handler = New-Object System.Net.Http.HttpClientHandler
    $handler.AllowAutoRedirect = $false
    $client = [System.Net.Http.HttpClient]::new($handler)
    $client.Timeout = [TimeSpan]::FromSeconds(5)
    Start-App

    $page = Read-Page '/'
    if ([regex]::Matches($page.Body, 'class="badge-active"').Count -ne 6 -or $page.Body -match 'The Matrix:') {
        throw 'The fresh SQL Server catalog did not show the six active seed records.'
    }
    if ((Read-Page '/Books/Details/2147483647').Status -ne 404) { throw 'A missing record did not return HTTP 404.' }
    if ((Submit-Form '/Books/Create' @{ Title = 'No token' } -WithoutToken).Status -ne 400) {
        throw 'The server accepted a write without an antiforgery token.'
    }

    $fields = @{ Title = "Windows persistence $id"; Author = 'Test Author'; ISBN = ''; PublishedYear = '2000'; IsActive = 'true' }
    if ((Submit-Form '/Books/Create' $fields).Status -ne 302) { throw 'The valid create did not redirect.' }
    $bookId = Read-Scalar 'SELECT Id FROM dbo.Books WHERE Title = @title' @{ '@title' = $fields.Title }
    if (!$bookId -or $bookId -eq [DBNull]::Value) { throw 'The created book was not stored.' }
    $created = Read-Scalar 'SELECT CreatedDate FROM dbo.Books WHERE Id = @id' @{ '@id' = $bookId }
    $fields.Id = $bookId
    $fields.Title = "Changed persistence $id"
    $fields.IsActive = 'false'
    $fields.CreatedDate = '1900-01-01'
    if ((Submit-Form "/Books/Edit/$bookId" $fields).Status -ne 302) { throw 'The valid edit did not redirect.' }
    if ((Read-Scalar 'SELECT CreatedDate FROM dbo.Books WHERE Id = @id' @{ '@id' = $bookId }) -ne $created) {
        throw 'Editing the book changed the stored creation timestamp.'
    }
    if ((Read-Page '/').Body.Contains($fields.Title)) { throw 'The inactive book appeared in the list.' }
    if (!(Read-Page "/Books/Details/$bookId").Body.Contains($fields.Title)) { throw 'The inactive book details were unavailable.' }

    Stop-App
    Start-App
    if (!(Read-Page "/Books/Details/$bookId").Body.Contains($fields.Title)) { throw 'The saved record did not survive application restart.' }
    if ((Read-Scalar 'SELECT CreatedDate FROM dbo.Books WHERE Id = @id' @{ '@id' = $bookId }) -ne $created) {
        throw 'The stored creation timestamp changed after restart.'
    }
    $fields.IsActive = 'true'
    if ((Submit-Form "/Books/Edit/$bookId" $fields).Status -ne 302 -or !(Read-Page '/').Body.Contains($fields.Title)) {
        throw 'The restored active record did not return to the list.'
    }
    if ((Submit-Form "/Books/Delete/$bookId" @{ Id = $bookId }).Status -ne 302) { throw 'The delete form did not redirect.' }
    if ((Read-Page "/Books/Details/$bookId").Status -ne 404) { throw 'The deleted record remained available.' }
    $count = Read-Scalar 'SELECT COUNT(*) FROM dbo.Books'
    foreach ($invalid in @(
        @{ Title = ''; Author = 'Test Author'; PublishedYear = '2000'; IsActive = 'true' },
        @{ Title = 'Invalid year'; Author = 'Test Author'; PublishedYear = '1700'; IsActive = 'true' },
        @{ Title = ('x' * 201); Author = 'Test Author'; PublishedYear = '2000'; IsActive = 'true' }
    )) {
        if ((Submit-Form '/Books/Create' $invalid).Status -ne 200) { throw 'Invalid input did not return the validation form.' }
        if ((Read-Scalar 'SELECT COUNT(*) FROM dbo.Books') -ne $count) { throw 'Invalid input created a SQL Server record.' }
    }
    Write-Host 'The modernized reference passed SQL Server HTTP, validation, antiforgery, filtering, timestamp, restart, and deletion checks.'
} catch {
    $errors.Add($_.Exception.Message)
} finally {
    try { Stop-App } catch { $canRemoveCopy = $false; $errors.Add($_.Exception.Message) }
    if ($client) { $client.Dispose() }
    if ($errors.Count -and (Test-Path (Join-Path $work 'application.log'))) {
        Get-Content (Join-Path $work 'application.log') -Tail 35 | Write-Host
    }
    if ($instanceCreated) {
        try {
            Invoke-Checked sqllocaldb @('stop', $instance, '-k')
            Invoke-Checked sqllocaldb @('delete', $instance)
        } catch {
            $canRemoveCopy = $false
            $errors.Add("The isolated LocalDB instance $instance needs cleanup. $($_.Exception.Message)")
        }
    }
    if ($canRemoveCopy -and (Test-Path $work)) {
        try {
            if ((Split-Path $work -Parent) -ne (Join-Path $root 'artifacts') -or
                (Split-Path $work -Leaf) -notmatch '^bookcatalog-modernized-[0-9a-f]{32}$') {
                throw 'The cleanup path is not an isolated modernized test directory.'
            }
            Remove-Item -LiteralPath $work -Recurse -Force
        } catch { $errors.Add($_.Exception.Message) }
    }
}
if ($errors.Count) { throw ($errors -join [Environment]::NewLine) }
