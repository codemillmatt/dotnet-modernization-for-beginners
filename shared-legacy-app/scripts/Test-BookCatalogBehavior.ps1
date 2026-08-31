[CmdletBinding()]
param(
    [Parameter()]
    [ValidateNotNullOrEmpty()]
    [string]$BaseUrl = "https://localhost:44300",

    [Parameter()]
    [switch]$SkipCertificateCheck
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")
$session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$userAgent = "BookCatalog-Characterization/1.0"
$requestParameters = @{
    WebSession = $session
    UserAgent = $userAgent
}

if ($SkipCertificateCheck) {
    if ($PSVersionTable.PSVersion.Major -lt 7) {
        throw "-SkipCertificateCheck requires PowerShell 7 or later."
    }
    $requestParameters.SkipCertificateCheck = $true
}

function Assert-True {
    param(
        [Parameter(Mandatory)]
        [bool]$Condition,

        [Parameter(Mandatory)]
        [string]$Message
    )

    if (-not $Condition) {
        throw "FAILED: $Message"
    }

    Write-Host "PASS: $Message" -ForegroundColor Green
}

function Invoke-BookCatalogRequest {
    param(
        [Parameter(Mandatory)]
        [string]$Path,

        [Parameter()]
        [ValidateSet("Get", "Post")]
        [string]$Method = "Get",

        [Parameter()]
        [hashtable]$Body
    )

    $parameters = $requestParameters.Clone()
    $parameters.Uri = "$BaseUrl$Path"
    $parameters.Method = $Method
    if ($Body) {
        $parameters.Body = $Body
        $parameters.ContentType = "application/x-www-form-urlencoded"
    }
    if ($PSVersionTable.PSVersion.Major -ge 7) {
        $parameters.SkipHttpErrorCheck = $true
    }

    try {
        $response = Invoke-WebRequest @parameters
        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Content = $response.Content
        }
    }
    catch {
        if (-not $_.Exception.Response) {
            throw
        }

        $response = $_.Exception.Response
        $content = ""
        if ($response.Content) {
            $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        }
        elseif ($response.GetResponseStream) {
            $reader = [System.IO.StreamReader]::new($response.GetResponseStream())
            try {
                $content = $reader.ReadToEnd()
            }
            finally {
                $reader.Dispose()
            }
        }

        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Content = $content
        }
    }
}

function Get-AntiForgeryToken {
    param(
        [Parameter(Mandatory)]
        [string]$Html
    )

    $inputMatch = [regex]::Match(
        $Html,
        '<input[^>]+name=["'']__RequestVerificationToken["''][^>]*>',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
    if (-not $inputMatch.Success) {
        throw "FAILED: The modifying form does not contain an anti-forgery token."
    }

    $valueMatch = [regex]::Match(
        $inputMatch.Value,
        'value=["'']([^"'']+)["'']',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
    if (-not $valueMatch.Success) {
        throw "FAILED: The anti-forgery token has no value."
    }

    return [System.Net.WebUtility]::HtmlDecode($valueMatch.Groups[1].Value)
}

Write-Host "Testing BookCatalog at $BaseUrl" -ForegroundColor Cyan

$index = Invoke-BookCatalogRequest -Path "/Books"
Assert-True ($index.StatusCode -eq 200) "The index returns HTTP 200"
$indexText = [System.Net.WebUtility]::HtmlDecode($index.Content)

$activeTitles = @(
    "Clean Code",
    "Design Patterns: Elements of Reusable OO Software",
    "Jurassic Park",
    "The Hitchhiker's Guide to the Galaxy",
    "The Lord of the Rings",
    "The Pragmatic Programmer"
)

foreach ($title in $activeTitles) {
    Assert-True ($indexText.Contains($title)) "The active seed '$title' appears"
}
Assert-True (-not $indexText.Contains("The Matrix: The Shooting Script")) "The inactive seed is omitted"

$previousPosition = -1
foreach ($title in $activeTitles) {
    $position = $indexText.IndexOf($title, [System.StringComparison]::Ordinal)
    Assert-True ($position -gt $previousPosition) "'$title' appears in title order"
    $previousPosition = $position
}

Assert-True ($indexText.Contains($userAgent)) "The request User-Agent is displayed"

$missing = Invoke-BookCatalogRequest -Path "/Books/Details/2147483647"
Assert-True ($missing.StatusCode -eq 404) "An unknown book ID returns HTTP 404"

$createPage = Invoke-BookCatalogRequest -Path "/Books/Create"
Assert-True ($createPage.StatusCode -eq 200) "The create form loads"
$createToken = Get-AntiForgeryToken -Html $createPage.Content
Assert-True (-not [string]::IsNullOrWhiteSpace($createToken)) "The create form contains an anti-forgery token"

$withoutToken = Invoke-BookCatalogRequest -Path "/Books/Create" -Method Post -Body @{
    Title = "Rejected request"
    Author = "Characterization harness"
    PublishedYear = 2025
    IsActive = "true"
}
Assert-True ($withoutToken.StatusCode -ge 400) "A create request without an anti-forgery token is rejected"

$invalid = Invoke-BookCatalogRequest -Path "/Books/Create" -Method Post -Body @{
    __RequestVerificationToken = $createToken
    Title = ""
    Author = ""
    PublishedYear = 1700
    IsActive = "true"
}
Assert-True ($invalid.StatusCode -eq 200) "An invalid create returns the form"
Assert-True ($invalid.Content.Contains("The Title field is required")) "Title remains required"
Assert-True ($invalid.Content.Contains("The Author field is required")) "Author remains required"
Assert-True ($invalid.Content.Contains("must be between 1800 and 2100")) "Published year validation is preserved"

$uniqueSuffix = [Guid]::NewGuid().ToString("N").Substring(0, 8)
$title = "Characterization $uniqueSuffix"
$author = "Before Upgrade"
$isbn = "9780000000002"

$createPage = Invoke-BookCatalogRequest -Path "/Books/Create"
$createToken = Get-AntiForgeryToken -Html $createPage.Content
$created = Invoke-BookCatalogRequest -Path "/Books/Create" -Method Post -Body @{
    __RequestVerificationToken = $createToken
    Title = $title
    Author = $author
    ISBN = $isbn
    PublishedYear = 2025
    IsActive = "true"
}
Assert-True ($created.StatusCode -eq 200 -and $created.Content.Contains($title)) "Create persists the submitted book"

$escapedTitle = [regex]::Escape($title)
$row = [regex]::Match($created.Content, "(?is)<tr[^>]*>(?:(?!</tr>).)*?$escapedTitle(?:(?!</tr>).)*?</tr>")
$idMatch = [regex]::Match($row.Value, '(?i)(?:Details|Edit|Delete)/(\d+)')
Assert-True ($row.Success -and $idMatch.Success) "The created book can be located by ID"
$bookId = $idMatch.Groups[1].Value

$detailsBefore = Invoke-BookCatalogRequest -Path "/Books/Details/$bookId"
Assert-True ($detailsBefore.Content.Contains($author)) "Create preserves the author"
Assert-True ($detailsBefore.Content.Contains($isbn)) "Create preserves the ISBN"
Assert-True ($detailsBefore.Content.Contains("2025")) "Create preserves the published year"
$dateMatch = [regex]::Match($detailsBefore.Content, '(?is)<th>Date Added</th>\s*<td>([^<]+)</td>')
Assert-True ($dateMatch.Success) "Create assigns a date"
$createdDateDisplay = $dateMatch.Groups[1].Value.Trim()

$editPage = Invoke-BookCatalogRequest -Path "/Books/Edit/$bookId"
$editToken = Get-AntiForgeryToken -Html $editPage.Content
Assert-True (-not [string]::IsNullOrWhiteSpace($editToken)) "The edit form contains an anti-forgery token"

$editWithoutToken = Invoke-BookCatalogRequest -Path "/Books/Edit" -Method Post -Body @{
    Id = $bookId
    Title = $title
    Author = "Rejected edit"
    ISBN = $isbn
    PublishedYear = 2025
    IsActive = "true"
    CreatedDate = "1901-01-01"
}
Assert-True ($editWithoutToken.StatusCode -ge 400) "An edit request without an anti-forgery token is rejected"

$invalidEdit = Invoke-BookCatalogRequest -Path "/Books/Edit" -Method Post -Body @{
    __RequestVerificationToken = $editToken
    Id = $bookId
    Title = ""
    Author = ""
    ISBN = $isbn
    PublishedYear = 1700
    IsActive = "true"
    CreatedDate = "1901-01-01"
}
Assert-True ($invalidEdit.StatusCode -eq 200) "An invalid edit returns the form"
Assert-True ($invalidEdit.Content.Contains("The Title field is required")) "Edit enforces the required title"
Assert-True ($invalidEdit.Content.Contains("The Author field is required")) "Edit enforces the required author"
Assert-True ($invalidEdit.Content.Contains("must be between 1800 and 2100")) "Edit enforces the published year range"

$detailsAfterInvalidEdit = Invoke-BookCatalogRequest -Path "/Books/Details/$bookId"
Assert-True ($detailsAfterInvalidEdit.Content.Contains($author)) "An invalid edit does not change the record"
Assert-True (-not $detailsAfterInvalidEdit.Content.Contains("January 01, 1901")) "An invalid edit cannot overwrite CreatedDate"

$editPage = Invoke-BookCatalogRequest -Path "/Books/Edit/$bookId"
$editToken = Get-AntiForgeryToken -Html $editPage.Content
$updatedAuthor = "After Upgrade"
$edited = Invoke-BookCatalogRequest -Path "/Books/Edit" -Method Post -Body @{
    __RequestVerificationToken = $editToken
    Id = $bookId
    Title = $title
    Author = $updatedAuthor
    ISBN = $isbn
    PublishedYear = 2025
    IsActive = "true"
    CreatedDate = "1901-01-01"
}
Assert-True ($edited.StatusCode -eq 200) "Edit redirects back to the index"

$detailsAfter = Invoke-BookCatalogRequest -Path "/Books/Details/$bookId"
Assert-True ($detailsAfter.Content.Contains($updatedAuthor)) "Edit updates an allowed field"
Assert-True ($detailsAfter.Content.Contains($isbn)) "Edit preserves ISBN"
Assert-True ($detailsAfter.Content.Contains($createdDateDisplay)) "Edit does not overwrite CreatedDate"
Assert-True (-not $detailsAfter.Content.Contains("January 01, 1901")) "Edit rejects an overposted CreatedDate"

$deletePage = Invoke-BookCatalogRequest -Path "/Books/Delete/$bookId"
$deleteToken = Get-AntiForgeryToken -Html $deletePage.Content
Assert-True (-not [string]::IsNullOrWhiteSpace($deleteToken)) "The delete form contains an anti-forgery token"

$deleteWithoutToken = Invoke-BookCatalogRequest -Path "/Books/Delete" -Method Post -Body @{
    Id = $bookId
}
Assert-True ($deleteWithoutToken.StatusCode -ge 400) "A delete request without an anti-forgery token is rejected"
$detailsAfterRejectedDelete = Invoke-BookCatalogRequest -Path "/Books/Details/$bookId"
Assert-True ($detailsAfterRejectedDelete.StatusCode -eq 200) "A rejected delete leaves the book intact"

$deletePage = Invoke-BookCatalogRequest -Path "/Books/Delete/$bookId"
$deleteToken = Get-AntiForgeryToken -Html $deletePage.Content
$deleted = Invoke-BookCatalogRequest -Path "/Books/Delete" -Method Post -Body @{
    __RequestVerificationToken = $deleteToken
    Id = $bookId
}
Assert-True ($deleted.StatusCode -eq 200 -and -not $deleted.Content.Contains($title)) "Delete removes the expected book"

Write-Host "BookCatalog behavior contract passed." -ForegroundColor Cyan
