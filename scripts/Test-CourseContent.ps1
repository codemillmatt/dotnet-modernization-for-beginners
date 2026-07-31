[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repository = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$errors = [System.Collections.Generic.List[string]]::new()

function Get-RelativePath {
    param([Parameter(Mandatory)][string] $Path)

    return [IO.Path]::GetRelativePath($repository, $Path).Replace('\', '/')
}

function Test-ExcludedPath {
    param([Parameter(Mandatory)][string] $Path)

    $relative = Get-RelativePath -Path $Path
    return $relative -match '^(?:\.git|\.github/agents|\.github/extensions|_site|node_modules|vendor|work)(?:/|$)' -or
        $relative -match '/(?:bin|obj|publish)/'
}

function Get-MarkdownSlugs {
    param([Parameter(Mandatory)][string] $Path)

    $slugs = [System.Collections.Generic.HashSet[string]]::new(
        [StringComparer]::OrdinalIgnoreCase
    )
    $counts = @{}
    foreach ($line in Get-Content $Path) {
        if ($line -notmatch '^#{1,6}\s+(.+?)\s*#*\s*$') {
            continue
        }

        $slug = $Matches[1].ToLowerInvariant()
        $slug = [regex]::Replace($slug, '<[^>]+>', '')
        $slug = $slug.Replace('`', '')
        $slug = [regex]::Replace($slug, '[^\p{L}\p{Nd}\s-]', '')
        $slug = [regex]::Replace($slug.Trim(), '\s+', '-')
        $slug = [regex]::Replace($slug, '-{2,}', '-')
        if ($counts.ContainsKey($slug)) {
            $counts[$slug]++
            $slug = "$slug-$($counts[$slug])"
        }
        else {
            $counts[$slug] = 0
        }
        [void] $slugs.Add($slug)
    }

    return $slugs
}

$allFiles = Get-ChildItem $repository -Recurse -File |
    Where-Object { -not (Test-ExcludedPath -Path $_.FullName) }
$contentFiles = $allFiles |
    Where-Object { (Get-RelativePath -Path $_.FullName) -ne 'scripts/Test-CourseContent.ps1' }
$markdownFiles = $allFiles | Where-Object Extension -eq '.md'
$imageExtensions = @('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp')
$imageFiles = $allFiles | Where-Object { $_.Extension.ToLowerInvariant() -in $imageExtensions }
$referencedImages = [System.Collections.Generic.HashSet[string]]::new(
    [StringComparer]::OrdinalIgnoreCase
)
$slugCache = @{}
$mermaidBlocks = [System.Collections.Generic.List[object]]::new()

foreach ($file in $markdownFiles) {
    $relative = Get-RelativePath -Path $file.FullName
    $content = Get-Content $file.FullName -Raw
    $lines = Get-Content $file.FullName

    if ($file.Name -eq 'README.md' -and $content -notmatch '(?m)^#\s+\S') {
        $errors.Add("$relative must start with a descriptive level-one heading.")
    }

    foreach ($match in [regex]::Matches($content, '(?m)!\[(?<alt>[^\]]*)\]\((?<target>[^)\s]+)(?:\s+"[^"]*")?\)')) {
        if ([string]::IsNullOrWhiteSpace($match.Groups['alt'].Value)) {
            $errors.Add("$relative contains an image with empty alternative text.")
        }

        $target = [Uri]::UnescapeDataString($match.Groups['target'].Value.Split('#')[0])
        if ($target -match '^(?:https?:|data:)') {
            continue
        }

        $resolved = [IO.Path]::GetFullPath((Join-Path $file.DirectoryName $target))
        [void] $referencedImages.Add($resolved)
        if (-not (Test-Path $resolved -PathType Leaf)) {
            $errors.Add("$relative references missing image $target.")
        }
    }

    foreach ($match in [regex]::Matches($content, '(?m)(?<!!)\[[^\]]+\]\((?<target>[^)\s]+)(?:\s+"[^"]*")?\)')) {
        $target = $match.Groups['target'].Value
        if ($target -match '^(?:https?:|mailto:|tel:)') {
            continue
        }

        $parts = $target.Split('#', 2)
        $targetPath = [Uri]::UnescapeDataString($parts[0].Split('?')[0])
        $anchor = if ($parts.Count -eq 2) { $parts[1] } else { '' }
        $resolved = if ([string]::IsNullOrWhiteSpace($targetPath)) {
            $file.FullName
        }
        else {
            [IO.Path]::GetFullPath((Join-Path $file.DirectoryName $targetPath))
        }

        if (-not (Test-Path $resolved)) {
            $errors.Add("$relative references missing path $targetPath.")
            continue
        }

        if ($anchor -and (Test-Path $resolved -PathType Leaf) -and
            [IO.Path]::GetExtension($resolved) -eq '.md') {
            if (-not $slugCache.ContainsKey($resolved)) {
                $slugCache[$resolved] = Get-MarkdownSlugs -Path $resolved
            }
            if (-not $slugCache[$resolved].Contains($anchor)) {
                $errors.Add("$relative references missing anchor #$anchor in $(Get-RelativePath $resolved).")
            }
        }
    }

    for ($index = 1; $index -lt $lines.Count; $index++) {
        if ($lines[$index] -match '^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$') {
            $headers = $lines[$index - 1].Trim('|').Split('|') |
                ForEach-Object Trim
            if ($headers.Count -lt 2 -or $headers -contains '') {
                $errors.Add("$relative has an inaccessible table header near line $($index + 1).")
            }
        }
    }

    foreach ($match in [regex]::Matches($content, '(?ms)^```mermaid\s*\r?\n(?<diagram>.*?)^```\s*$')) {
        $prefix = $content.Substring(0, $match.Index)
        $lineNumber = ([regex]::Matches($prefix, '\n')).Count + 1
        $previous = ''
        for ($back = $lineNumber - 2; $back -ge 0; $back--) {
            if (-not [string]::IsNullOrWhiteSpace($lines[$back])) {
                $previous = $lines[$back]
                break
            }
        }
        if ($previous -notmatch '(?i)diagram') {
            $errors.Add("$relative Mermaid block near line $lineNumber needs a preceding text description containing 'Diagram'.")
        }
        $mermaidBlocks.Add([pscustomobject]@{
            Source = $relative
            Content = $match.Groups['diagram'].Value
        })
    }
}

foreach ($image in $imageFiles) {
    if (-not $referencedImages.Contains($image.FullName)) {
        $errors.Add("Unused image: $(Get-RelativePath $image.FullName).")
    }
}

$terminologyRules = @{
    'NEEDS-BLUR' = 'Unredacted screenshot marker is forbidden.'
    'microsoft/dotnet-modernization-for-beginners' = 'Use the canonical codemillmatt repository URL.'
    '\bone-developer,\s*few-day\b' = 'Finding counts must not be converted directly into schedules.'
    '\bNo global\.json exists\b' = 'The course includes global.json.'
    '\bno password anywhere\b' = 'Provisioning still has a bootstrap credential.'
    '\bTrinity owns\b' = 'Internal authoring ownership must not appear in learner content.'
    'Windows 11 \(22H2' = 'Do not pin the course to an obsolete Windows feature release.'
    '\.NET 10 preview' = '.NET 10 is stable.'
}
foreach ($rule in $terminologyRules.GetEnumerator()) {
    foreach ($file in $contentFiles | Where-Object {
        $_.Extension.ToLowerInvariant() -in @('.md', '.ps1', '.bicep', '.json', '.yml', '.yaml')
    }) {
        if ((Get-Content $file.FullName -Raw) -match $rule.Key) {
            $errors.Add("$(Get-RelativePath $file.FullName): $($rule.Value)")
        }
    }
}

$sensitivePatterns = @{
    'Email address' = '\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b'
    'GitHub token' = '\bgh[pousr]_[A-Za-z0-9]{20,}\b'
    'AWS access key' = '\bAKIA[0-9A-Z]{16}\b'
    'Private key' = '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
    'Literal password or token' = '(?i)(?:password|clientsecret|access[_-]?token)\s*[:=]\s*["''][^"''<>$]{8,}["'']'
    'User profile path' = '(?i)(?:[A-Z]:\\Users\\[^\\\s]+|/' + 'home/[^/\s]+/)'
    'Live App Service URL' = 'https://[a-z0-9][a-z0-9-]{2,}\.azurewebsites\.net'
}
$sensitiveExtensions = @(
    '.md', '.ps1', '.bicep', '.bicepparam', '.cs', '.cshtml', '.json',
    '.yml', '.yaml', '.xml', '.config', '.sql', '.sln', '.slnx', '.csproj'
)
foreach ($file in $contentFiles | Where-Object { $_.Extension.ToLowerInvariant() -in $sensitiveExtensions }) {
    $content = Get-Content $file.FullName -Raw
    foreach ($pattern in $sensitivePatterns.GetEnumerator()) {
        if ($content -match $pattern.Value) {
            $errors.Add("$(Get-RelativePath $file.FullName) contains possible $($pattern.Key).")
        }
    }
}

if ($mermaidBlocks.Count -gt 0) {
    $mmdcPath = (Get-Command mmdc -ErrorAction SilentlyContinue).Source
    if (-not $mmdcPath) {
        $candidate = Join-Path $repository 'node_modules/.bin/mmdc'
        if (Test-Path $candidate) {
            $mmdcPath = (Get-Item $candidate).FullName
        }
    }

    if (-not $mmdcPath) {
        $errors.Add('Mermaid diagrams exist but mmdc is unavailable. Run npm ci.')
    }
    else {
        $temporary = Join-Path ([IO.Path]::GetTempPath()) "course-mermaid-$([guid]::NewGuid())"
        New-Item $temporary -ItemType Directory | Out-Null
        try {
            for ($index = 0; $index -lt $mermaidBlocks.Count; $index++) {
                $inputPath = Join-Path $temporary "$index.mmd"
                $outputPath = Join-Path $temporary "$index.svg"
                Set-Content $inputPath $mermaidBlocks[$index].Content
                & $mmdcPath --input $inputPath --output $outputPath --quiet
                if ($LASTEXITCODE -ne 0 -or -not (Test-Path $outputPath)) {
                    $errors.Add("Mermaid rendering failed for $($mermaidBlocks[$index].Source).")
                }
            }
        }
        finally {
            Remove-Item $temporary -Recurse -Force
        }
    }
}

if ($errors.Count -gt 0) {
    $errors | Sort-Object -Unique | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Course content QA passed for $($markdownFiles.Count) Markdown files."
