[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [uri] $BaseUrl
)

$ErrorActionPreference = 'Stop'
$session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$index = Invoke-WebRequest -Uri $BaseUrl -WebSession $session

if ($index.StatusCode -ne 200 -or $index.Content -notmatch 'Active books ordered by title') {
    throw 'The BookCatalog index behavior check failed.'
}

$health = Invoke-WebRequest -Uri ([uri]::new($BaseUrl, '/health'))
if ($health.StatusCode -ne 200) {
    throw 'The health endpoint check failed.'
}

$createPage = Invoke-WebRequest -Uri ([uri]::new($BaseUrl, '/Books/Create')) -WebSession $session
$tokenMatch = [regex]::Match(
    $createPage.Content,
    'name="__RequestVerificationToken" type="hidden" value="([^"]+)"'
)
if (-not $tokenMatch.Success) {
    throw 'The create form did not contain an anti-forgery token.'
}

$testTitle = "Cloud persistence check $([guid]::NewGuid().ToString('N'))"
$form = @{
    __RequestVerificationToken = [System.Net.WebUtility]::HtmlDecode($tokenMatch.Groups[1].Value)
    Title = $testTitle
    Author = 'Course validation'
    PublishedYear = '2026'
    IsActive = 'true'
}
Invoke-WebRequest `
    -Uri ([uri]::new($BaseUrl, '/Books/Create')) `
    -Method Post `
    -Body $form `
    -WebSession $session | Out-Null

$independentSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$persisted = Invoke-WebRequest -Uri $BaseUrl -WebSession $independentSession
if ($persisted.Content -notmatch [regex]::Escape($testTitle)) {
    throw 'The created book was not visible in a new session; persistence validation failed.'
}

Write-Host 'Deployment behavior and persistence checks passed.'
