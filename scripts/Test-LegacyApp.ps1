<#
.SYNOPSIS
Builds and checks the classic MVC application in an isolated tracked-source copy.
.DESCRIPTION
Requires Windows, Visual Studio MSBuild with web build tools and the .NET Framework
4.8 targeting pack. Runtime checks also require IIS Express and MSSQLLocalDB.
Restores packages.config with MSBuild and the copied NuGet.Config; nuget.exe is not
required. No App_Data directory or database file is supplied before startup.
Creates active and inactive books through HTTP forms, checks their details, then
restarts IIS Express and compares all stored fields, including full SQL timestamps.
Only the owned copy under artifacts and its attached database are cleaned up.
.PARAMETER BuildOnly
Restores and builds without starting IIS Express or checking runtime behavior.
#>
param([switch]$BuildOnly)
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'This check requires Windows.' }

$root = Split-Path $PSScriptRoot -Parent
$work = Join-Path $root ('artifacts\bookcatalog-legacy-' + [guid]::NewGuid().ToString('N'))
$webRoot = Join-Path $work 'src\BookCatalog.Web'
$databaseFile = Join-Path $webRoot 'App_Data\BookCatalog.mdf'
$process = $null
$run = 0
$errors = New-Object 'System.Collections.Generic.List[string]'
$canRemoveCopy = $true

function Invoke-Checked($Command, $Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit $LASTEXITCODE." }
}

function Stop-LegacySite {
    if ($script:process -and !$script:process.HasExited) {
        Stop-Process -Id $script:process.Id -Force -ErrorAction Stop
        if (!$script:process.WaitForExit(10000)) { throw 'The owned IIS Express process did not stop.' }
    }
}

function Start-LegacySite {
    $script:run++
    $outLog = Join-Path $work "iis-$run.log"
    $errorLog = Join-Path $work "iis-$run-error.log"
    $script:process = Start-Process $iis -ArgumentList "/config:`"$iisConfig`" /site:BookCatalogCheck /userhome:`"$iisHome`" /systray:false" `
        -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errorLog
    $lastFailure = ''
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        if ($script:process.HasExited) {
            throw "IIS Express stopped before readiness. $(Get-Content $outLog, $errorLog -Tail 15 | Out-String)"
        }
        try {
            $response = Invoke-WebRequest $url -UseBasicParsing -WebSession $session -TimeoutSec 5
            Write-Host "HTTP $([int]$response.StatusCode): IIS Express run $run is ready (PID $($script:process.Id))."
            return $response
        } catch {
            $detail = $_.ErrorDetails.Message -replace '(?is)<style\b.*?</style>', '' -replace '<[^>]+>', ' '
            $detail = [Net.WebUtility]::HtmlDecode(($detail -replace '\s+', ' ')).Trim()
            if ($detail.Length -gt 1500) { $detail = $detail.Substring(0, 1500) }
            $lastFailure = "$($_.Exception.Message) $detail"
            Start-Sleep -Seconds 1
        }
    }
    throw "The legacy app did not become ready. $lastFailure"
}

function Assert-Catalog($Response, [int]$ExpectedCount, [string]$ActiveTitle, [string]$InactiveTitle) {
    if ([regex]::Matches($Response.Content, 'class="badge-active"').Count -ne $ExpectedCount) {
        throw "Expected $ExpectedCount active books in the list."
    }
    $html = [Net.WebUtility]::HtmlDecode($Response.Content)
    if ($html.Contains('The Matrix:') -or ($InactiveTitle -and $html.Contains($InactiveTitle))) {
        throw 'The list included an inactive book.'
    }
    if ($ActiveTitle -and !$html.Contains($ActiveTitle)) { throw 'The list omitted the created active book.' }
    $titles = @([regex]::Matches($html, '<td><strong>(.*?)</strong></td>') | ForEach-Object { $_.Groups[1].Value })
    if ($titles.Count -ne $ExpectedCount -or (($titles -join "`n") -cne (($titles | Sort-Object) -join "`n"))) {
        throw 'The active books were not listed in title order.'
    }
}

function Add-TestBook([string]$Title, [string]$ISBN, [bool]$IsActive) {
    $form = Invoke-WebRequest "$url/Books/Create" -UseBasicParsing -WebSession $session -TimeoutSec 15
    $inputTag = [regex]::Match($form.Content, '<input\b[^>]*\bname="__RequestVerificationToken"[^>]*>').Value
    $token = [Net.WebUtility]::HtmlDecode([regex]::Match($inputTag, '\bvalue="([^"]+)"').Groups[1].Value)
    if (!$token) { throw 'The create form did not contain an anti-forgery token.' }
    $fields = @{
        __RequestVerificationToken = $token
        Title = $Title
        Author = 'Legacy & Persistence'
        ISBN = $ISBN
        PublishedYear = '2026'
        IsActive = $IsActive.ToString().ToLowerInvariant()
    }
    Invoke-WebRequest "$url/Books/Create" -Method Post -Body $fields -ContentType 'application/x-www-form-urlencoded' `
        -UseBasicParsing -WebSession $session -TimeoutSec 15 | Out-Null
}

function Get-StoredBooks {
    $connection = New-Object System.Data.SqlClient.SqlConnection $databaseConnectionString
    try {
        $connection.Open()
        $command = $connection.CreateCommand()
        $command.CommandText = 'SELECT Id, Title, Author, ISBN, PublishedYear, IsActive, CreatedDate FROM dbo.Books ORDER BY Id'
        $reader = $command.ExecuteReader()
        try {
            while ($reader.Read()) {
                [pscustomobject][ordered]@{
                    Id = $reader.GetInt32(0)
                    Title = $reader.GetString(1)
                    Author = $reader.GetString(2)
                    ISBN = if ($reader.IsDBNull(3)) { $null } else { $reader.GetString(3) }
                    PublishedYear = if ($reader.IsDBNull(4)) { $null } else { $reader.GetInt32(4) }
                    IsActive = $reader.GetBoolean(5)
                    CreatedDate = $reader.GetDateTime(6).ToString('o', [Globalization.CultureInfo]::InvariantCulture)
                }
            }
        } finally { $reader.Dispose() }
    } finally { $connection.Dispose() }
}

function Assert-Details($Book) {
    $response = Invoke-WebRequest "$url/Books/Details/$($Book.Id)" -UseBasicParsing -WebSession $session -TimeoutSec 15
    $html = [Net.WebUtility]::HtmlDecode($response.Content)
    foreach ($value in @($Book.Title, $Book.Author, $Book.ISBN, [string]$Book.PublishedYear)) {
        if (!$html.Contains($value)) { throw "Details for book $($Book.Id) omitted '$value'." }
    }
    $statusClass = if ($Book.IsActive) { 'badge-active' } else { 'badge-inactive' }
    if (!$html.Contains("class=`"$statusClass`"")) { throw "Details for book $($Book.Id) had the wrong active status." }
}

function Assert-MissingRecord {
    try {
        Invoke-WebRequest "$url/Books/Details/2147483647" -UseBasicParsing -WebSession $session -TimeoutSec 15 | Out-Null
        throw 'The missing record did not return HTTP 404.'
    } catch {
        if (!$_.Exception.Response -or [int]$_.Exception.Response.StatusCode -ne 404) { throw }
    }
}

try {
    $vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
    if (!(Test-Path $vswhere)) { throw 'Install Visual Studio with web build tools and MSBuild.' }
    $msbuild = & $vswhere -latest -products '*' -requires Microsoft.Component.MSBuild -find 'MSBuild\**\Bin\MSBuild.exe' | Select-Object -First 1
    if (!$msbuild) { throw 'Install Visual Studio web build tools and MSBuild.' }
    New-Item -ItemType Directory -Path $work | Out-Null
    Push-Location $root
    try {
        $files = git ls-files shared-legacy-app
        if ($LASTEXITCODE -ne 0 -or !$files) { throw 'Git could not list the legacy source.' }
        foreach ($file in $files) {
            $relative = $file.Substring('shared-legacy-app/'.Length)
            $destination = Join-Path $work $relative
            New-Item -ItemType Directory -Force -Path (Split-Path $destination -Parent) | Out-Null
            Copy-Item -LiteralPath (Join-Path $root $file) -Destination $destination
        }
    } finally { Pop-Location }

    # A tracked-source copy must not hide an omitted application startup content item.
    [xml]$project = Get-Content -LiteralPath (Join-Path $webRoot 'BookCatalog.Web.csproj')
    $namespaces = New-Object Xml.XmlNamespaceManager $project.NameTable
    $namespaces.AddNamespace('msbuild', $project.DocumentElement.NamespaceURI)
    if (!$project.SelectSingleNode('//msbuild:Content[@Include="Global.asax"]', $namespaces)) {
        throw 'The web project must include Global.asax as Content.'
    }
    Invoke-Checked $msbuild @((Join-Path $work 'BookCatalog.sln'), '/t:Restore', '/p:RestorePackagesConfig=true', "/p:RestoreConfigFile=$(Join-Path $work 'NuGet.Config')", '/verbosity:quiet', '/nologo')
    Invoke-Checked $msbuild @((Join-Path $work 'BookCatalog.sln'), '/t:Rebuild', '/p:Configuration=Debug', '/verbosity:minimal', '/nologo')

    if ($BuildOnly) {
        Write-Host 'The legacy build passed. Runtime checks did not run.'
    } else {
        $iis = Join-Path $env:ProgramFiles 'IIS Express\iisexpress.exe'
        if (!(Test-Path $iis)) { throw 'Install IIS Express before the runtime check.' }
        if (Test-Path (Join-Path $webRoot 'App_Data')) { throw 'The fresh source unexpectedly contains App_Data before startup.' }

        # Refuse an edited connection that might target a learner database.
        $webConfigPath = Join-Path $webRoot 'Web.config'
        [xml]$webConfig = Get-Content -LiteralPath $webConfigPath
        $configured = $webConfig.configuration.connectionStrings.add | Where-Object { $_.name -eq 'BookCatalogContext' }
        $connectionString = [System.Data.SqlClient.SqlConnectionStringBuilder]::new([string]$configured.connectionString)
        if ($connectionString.DataSource -ine '(LocalDB)\MSSQLLocalDB' -or
            $connectionString.AttachDBFilename -ine '|DataDirectory|\BookCatalog.mdf' -or
            !$connectionString.IntegratedSecurity -or $connectionString.InitialCatalog) {
            throw 'Runtime checks require the default isolated App_Data LocalDB connection.'
        }
        $connectionString.set_AttachDBFilename($databaseFile)
        $connectionString.Pooling = $false
        $databaseConnectionString = $connectionString.ConnectionString
        Invoke-Checked sqllocaldb @('start', 'MSSQLLocalDB')

        $iisHome = Join-Path $work 'iis'
        $iisConfig = Join-Path $iisHome 'config\applicationhost.config'
        $template = Join-Path $env:ProgramFiles 'IIS Express\config\templates\PersonalWebServer'
        New-Item -ItemType Directory -Path (Split-Path $iisConfig -Parent) | Out-Null
        Copy-Item -LiteralPath (Join-Path $template 'aspnet.config') -Destination (Split-Path $iisConfig -Parent)
        [xml]$config = Get-Content -LiteralPath (Join-Path $template 'applicationhost.config')
        $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
        $listener.Start()
        try { $port = $listener.LocalEndpoint.Port } finally { $listener.Stop() }
        $site = $config.configuration.'system.applicationHost'.sites.site
        $site.name = 'BookCatalogCheck'
        $site.application.virtualDirectory.SetAttribute('physicalPath', $webRoot)
        $site.bindings.binding.bindingInformation = ":${port}:localhost"
        $defaults = $config.configuration.'system.applicationHost'.sites.siteDefaults
        $defaults.logFile.SetAttribute('directory', (Join-Path $iisHome 'logs'))
        $defaults.traceFailedRequestsLogging.SetAttribute('directory', (Join-Path $iisHome 'traces'))
        $config.configuration.'system.webServer'.asp.cache.SetAttribute('diskTemplateCacheDirectory', (Join-Path $iisHome 'asp-cache'))
        $config.Save($iisConfig)
        $compileCache = Join-Path $work 'aspnet-cache'
        New-Item -ItemType Directory -Path $compileCache | Out-Null
        $webConfig.configuration.'system.web'.compilation.SetAttribute('tempDirectory', $compileCache)
        $webConfig.Save($webConfigPath)

        $url = "http://localhost:$port"
        $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
        Assert-Catalog (Start-LegacySite) 6
        if (!(Test-Path $databaseFile)) { throw 'Application startup did not create the isolated database.' }
        Assert-MissingRecord
        $tag = [guid]::NewGuid().ToString('N')
        $activeTitle = "AA runtime & persistence $tag"
        $inactiveTitle = "ZZ inactive runtime $tag"
        Add-TestBook $activeTitle '9781234567890' $true
        Add-TestBook $inactiveTitle '9781234567891' $false
        $before = @(Get-StoredBooks)
        if ($before.Count -ne 9) { throw 'HTTP creation did not leave seven seed books and two new books.' }
        $active = @($before | Where-Object { $_.Title -ceq $activeTitle })
        $inactive = @($before | Where-Object { $_.Title -ceq $inactiveTitle })
        if ($active.Count -ne 1 -or $inactive.Count -ne 1 -or !$active[0].IsActive -or $inactive[0].IsActive) {
            throw 'The HTTP-created books or their active states were not stored correctly.'
        }
        foreach ($book in @($active[0], $inactive[0])) {
            $expectedISBN = if ($book.IsActive) { '9781234567890' } else { '9781234567891' }
            if ($book.Author -cne 'Legacy & Persistence' -or $book.ISBN -cne $expectedISBN -or $book.PublishedYear -ne 2026) {
                throw "HTTP creation did not preserve the entered fields for book $($book.Id)."
            }
            Assert-Details $book
            Write-Host "HTTP-created book $($book.Id): IsActive=$($book.IsActive); SQL CreatedDate=$($book.CreatedDate)"
        }
        Assert-Catalog (Invoke-WebRequest $url -UseBasicParsing -WebSession $session -TimeoutSec 15) 7 $activeTitle $inactiveTitle

        Stop-LegacySite
        Assert-Catalog (Start-LegacySite) 7 $activeTitle $inactiveTitle
        $after = @(Get-StoredBooks)
        if ((ConvertTo-Json -InputObject $before -Compress) -cne (ConvertTo-Json -InputObject $after -Compress)) {
            throw 'Stored books changed across the IIS Express process restart.'
        }
        Assert-Details $active[0]
        Assert-Details $inactive[0]
        Assert-MissingRecord
        Write-Host 'The legacy build, clean startup, HTTP create/read, active filter, title order, restart persistence, and missing-record HTTP 404 checks passed.'
        Write-Host 'Restart comparison covered every stored field and full SQL CreatedDate values, not the date-only details display.'
    }
} catch {
    $errors.Add("$($_.Exception.Message) $($_.InvocationInfo.PositionMessage)")
} finally {
    try { Stop-LegacySite } catch {
        $canRemoveCopy = $false
        $errors.Add("The owned IIS process could not stop. Keep $work for inspection. $($_.Exception.Message)")
    }
    if ($canRemoveCopy -and (Test-Path $databaseFile)) {
        $connection = New-Object System.Data.SqlClient.SqlConnection 'Server=(localdb)\MSSQLLocalDB;Database=master;Integrated Security=True;Pooling=False'
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
            if ((Split-Path $work -Parent) -ne (Join-Path $root 'artifacts') -or
                (Split-Path $work -Leaf) -notmatch '^bookcatalog-legacy-[0-9a-f]{32}$') {
                throw 'The cleanup path is not an isolated legacy test directory.'
            }
            Remove-Item -LiteralPath $work -Recurse -Force
        } catch { $errors.Add($_.Exception.Message) }
    }
}
if ($errors.Count) { throw ($errors -join [Environment]::NewLine) }
