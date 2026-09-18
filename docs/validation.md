# Validation and evidence

This page is for maintainers. Learners should use the compact [learner record](learner-record.md).

Keep planned checks separate from actual results. Record the command, environment, date, and limitations before claiming a result.

## Behavior contract

The [learner checklist](learner-record.md#behavior-checks) owns the reusable behavior cases. Keep those checks against the original and actual upgraded applications.

Preserve active filtering, title order, validation, antiforgery protection, missing-record responses, persistence, and creation-date behavior.

Use two stable learner-created records for data comparison. One is active, and one is inactive.

Use a separate throwaway record for edits, validation experiments, inactive/restore actions, and deletion.

Preserve the selected IDs, all field values, SQL nulls, `IsActive`, and full stored `CreatedDate`. Date-only details screenshots do not establish timestamp precision.

`Book` and the legacy create action use local `DateTime.Now`. Do not silently change time semantics during the upgrade.

Fresh seed counts apply only before learner additions. Reseeding is not selected-record migration.

## What the reference tests prove

The modernized reference tests exercise HTTP, Razor forms, validation, antiforgery protection, and relational SQLite behavior.

They do not establish SQL Server compatibility or correctness of a different agent-generated implementation.

From the repository root in PowerShell:

```powershell
dotnet test tests\BookCatalog.Tests\BookCatalog.Tests.csproj
if ($LASTEXITCODE -ne 0) { throw "Reference application tests failed." }
```

The production application still uses SQL Server. Do not change its provider merely to make a portable test pass.

Check the runner's executed-test count. Exit code `0` without executed tests is not a passing test result.

## Maintainer checks

Inspect scripts before running them. Do not publish the site, call live Azure services, or modify learner databases as a side effect of validation.

After dependency-manifest changes, or a missing-dependency failure, restore with `npm ci`.

If Playwright reports a missing browser, install the required browser before its tests. Do not replace compatible tools unnecessarily.

Run the smallest checks that cover the change. These commands run from the repository root:

```powershell
npm run test:content
if ($LASTEXITCODE -ne 0) { throw "Content checks failed." }
npm run test:language
if ($LASTEXITCODE -ne 0) { throw "Language checks failed." }
npm run test:cloud
if ($LASTEXITCODE -ne 0) { throw "Mocked cloud checks failed." }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Site build failed." }
npm run test:site
if ($LASTEXITCODE -ne 0) { throw "Browser checks failed." }
```

For a direct Windows prose check, use `py -3 -B tools\check-language.py`. A Store alias is not evidence of a working Python interpreter.

Browser tests own their loopback server. Generated output belongs in the build's ignored, owned directories.

For illustration or palette changes, run `npm run illustrations` before the site build.
The generated SVG files belong in `docs/illustrations/` and must stay with their source changes.
The build checks their freshness without launching a browser.

The illustration browser checks cover light/dark images, full-size links, text explanations, mobile layout, and image failures.
They also check SVG labels for clipping and overlaps. Review the artwork itself to check its technical relationships and visual clarity.

Never record unavailable platforms or mocked Azure operations as successful live runs.

## Windows legacy checks

The legacy check requires Windows, Visual Studio web build tools, .NET Framework 4.8 targeting tools, IIS Express, and LocalDB.

It restores packages through native Visual Studio MSBuild with `RestorePackagesConfig=true`, using the copied `NuGet.Config`.

From the repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-LegacyApp.ps1
if ($LASTEXITCODE -ne 0) { throw "Legacy validation failed." }
```

Use an isolated source copy and database. A test must not create a missing application prerequisite before checking clean-clone startup.

The application creates its actual `AppDomain` data directory before EF initialization. The harness must not precreate `App_Data` or an empty MDF.

The required runtime evidence includes the active catalog, missing-record response, and a created record that survives application restart.

`-BuildOnly` establishes compilation only. It does not establish those runtime results.

Record the actual script result below. A workflow definition does not prove that a Windows run occurred.

## Windows modernized reference checks

Use Windows, a stable .NET 10 SDK, and SQL Server LocalDB.

From the repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\Test-ModernizedApp.ps1
if ($LASTEXITCODE -ne 0) { throw "Modernized reference LocalDB checks failed." }
```

The harness publishes the completed reference and uses a separate LocalDB instance for each run. Its MDF and LDF paths are also isolated.

Its owned run directory is `artifacts\bookcatalog-modernized-<guid>` under the repository root. This ignored directory is not a learner workspace.

It checks real HTTP requests, active filtering, missing-record responses, antiforgery protection, and create, read, update, and delete behavior.

It checks server validation, stored creation-time protection against forged input, and persistence after process restart. Cleanup belongs to that isolated run.

This is SQL Server evidence for the completed reference. It does not test a learner-generated application or an Azure deployment.

## Selected-record helper checks

Use the [data helper guide](../tools/BookCatalog.Data/README.md) for its current test commands and supported schema.

Required cases include:

- Explicit selection and source-only reads.
- Supported snapshot version and required fields.
- Exact null and stored-timestamp comparison.
- Nonmutating preview.
- Exact-repeat apply without duplicates.
- Conflicting IDs without overwrite.
- Transaction rollback without partial copies.
- Refusal of an unintended destination or schema.
- Parameterized record operations.
- No credentials or tokens in snapshots and diagnostics.

Require an isolated Windows/LocalDB integration run for actual SQL Server copy behavior. Portable tests alone do not establish that result.

The helper stays outside the learner's solution and upgrade scope.

## Evidence boundaries

| Check | Evidence | Limit |
| --- | --- | --- |
| Source and documentation review | Constraints, command structure, and implementation intent | Not runtime success |
| Reference application tests | HTTP, forms, and SQLite behavior | Not SQL Server or the learner's generated output |
| Windows reference harness | Real HTTP behavior and persistence against isolated LocalDB | Not the learner's generated output or Azure |
| Helper unit tests | Parsing, comparison, and bounded failure behavior | Not a live SQL Server transaction |
| LocalDB integration | Selected-record behavior on isolated SQL Server databases | Not Azure authentication or service behavior |
| Language checks | Selected structural rules | Not official dictionary compliance or teaching quality |
| Mocked cloud-helper tests | Command scope and simulated cleanup failures | Not live access, provisioning, or cleanup |
| Bicep compilation | Template syntax and types | Not quota, permissions, or deployment |
| Site build and browser tests | Routes, progress, references, assets, copy, and layouts | Not publication or learner understanding |
| Windows learner walkthrough | Behavior in the exercised environment | Not every Visual Studio version or machine |
| Representative learner pilot | Observed decisions and understanding | Not established by an automated build |

## Current rewrite: actual execution record

This section records checks for the Windows curriculum rewrite. Historical results below do not establish the current branch's status.

Documentation checks on September 17, 2026, Windows:

- All 15 rewritten documentation files passed the existing linter's structural rules in an explicit file-set check.
- Local file and heading-anchor checks passed across those 15 files.
- All 48 original chapter heading targets remain available, including the 11 Chapter 04 anchors.
- PowerShell parsing passed for 40 documented command blocks. Placeholders were substituted for parsing only. No commands were executed.
- `node tools\python.mjs tools\check-language.py` passed across 20 files, including the helper guide.
- Current Microsoft Learn pages were reviewed for Visual Studio's Azure assessment and migration artifact locations.

Application and template results reported by the coordinating session on September 17, 2026, Windows:

- All 12 tests in `BookCatalog.Tests` passed on Windows.
- Those tests use the SQLite test host. A separate run of the documented `Test-ModernizedApp.ps1` command passed against isolated LocalDB.
- The reference harness passed active-catalog, 404, antiforgery, CRUD, invalid-input, and process-restart persistence checks.
- Its stored-timestamp check preserved creation time against forged input. Its isolated resource cleanup also passed.
- Local Bicep compilation passed with the preinstalled CLI, without contacting Azure.
- Local `dbcontext script` generation passed with .NET EF 10.0.12, without a database connection.

The modernized harness rerun also passed after moving run files into the repository's ignored `artifacts` directory.

The added `Imported_record_keeps_identity_nulls_and_full_creation_timestamp_when_edited` test inserts fixture ID `8010` directly. It does not invoke the transfer helper.

It checks nullable ISBN/year fields and full stored timestamp ticks during an edit. A posted `CreatedDate` override must not replace the stored value.

This test validates reference behavior after fixture insertion. Actual helper transfer requires the separate SQL Server integration checks.

Data-helper results reported by its owner on September 17, 2026, Windows:

| Command | Actual result |
| --- | --- |
| `dotnet build tools\BookCatalog.Data\BookCatalog.Data.csproj` | Passed with zero warnings and errors |
| `dotnet test tests\BookCatalog.Data.Tests\BookCatalog.Data.Tests.csproj --no-restore --nologo --verbosity minimal` | 68 unit tests passed. One LocalDB integration test was intentionally skipped |
| `.\scripts\Test-DataTransfer.ps1` | The separate real SQL Server integration passed on LocalDB 17.0.4025.3 |

The integration run resolved an already attached legacy MDF without attaching or creating it. Deterministic export and source/configuration preservation passed.

Copied values preserved nulls, empty strings, Unicode, trailing spaces, inactive state, stored SQL `datetime` values, and seven-digit `datetime2` values.

Preview wrote nothing. Apply and verify matched exactly, and a repeated apply inserted no rows.

Conflicts refused all writes. An injected mid-transaction constraint failure rolled back the copy.

Wrong source, destination, schema, and trigger guards passed. The run removed its dedicated random LocalDB instance and owned directory.

The latest integration run also passed after the path-separator correction. Its MDF and LDF paths stayed inside the owned run directory.

Azure tests used mocked CLI metadata and tokens. They covered identity, subscription, resource metadata, encrypted connections, and token checks without live Azure operations.

Legacy results reported by the readiness owner on September 17, 2026, Windows:

| Command | Actual result |
| --- | --- |
| `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-LegacyApp.ps1` | Full build and runtime checks passed |
| `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-LegacyApp.ps1 -BuildOnly` | Build passed. Runtime checks explicitly did not run |
| `pwsh.exe -NoProfile -File .\scripts\Test-LegacyApp.ps1` | Full build and runtime checks passed |

Before repair, a fresh source copy without `App_Data` returned HTTP 500. SQL reported a missing directory and failed database creation.

The repair creates the application's data directory before EF initialization and includes `Global.asax` as project content.

After repair, full runs started without precreated `App_Data`. They checked six active seeds, active/inactive HTTP creation, details, title ordering, and a missing-record 404.

The harness restarted IIS Express with a distinct process ID. All nine rows and all stored fields remained unchanged, including full SQL `CreatedDate` values.

An injected failure after restart still stopped the owned process, detached its exact MDF, and removed its owned temporary source copy.

These results do not establish Visual Studio F5 launch or signed-in Copilot behavior. Neither was exercised.

These results do not establish correctness of the learner-generated app. Local template compilation does not establish Azure permissions or deployment success.

Site results reported by the site owner on September 17, 2026, Windows, with Node 25.6.1 and Python 3.9:

The final combined command was `npm run build && npm test && npm run test:site && git diff --check`.

It completed with exit code `0` on settled sources. The 31 Chromium tests completed in 18.7 seconds.

| Command | Actual result |
| --- | --- |
| `npm run build` | Passed, including five unique Mermaid diagrams in light/dark variants and all new references |
| `npm run test:content` | 21 tests passed, including the source allowlist and actual ZIP contents |
| `npm run test:cloud` | 11 mocked tests passed |
| `npm run test:site` | 31 real Chromium tests passed |
| `git diff --check` | Passed |

Browser checks used `/workshop/` and the hosting root. They covered all six eras in light/dark and mobile layouts.

They checked new references, old anchors, progress-revision migration, history, theme, resume, reset, and exact code copying.

Completion checks covered five required chapters, including Azure planning but not paid deployment.

The site owner inspected a desktop overview screenshot and captured a mobile dark Chapter 04 view. These observations do not establish learner understanding.

Site validation did not contact live Azure services. It also did not run application or SQL checks.

Record each additional result with its command, environment, and scope. Do not treat one passing suite as completion of all Windows checks.

### Illustration replacement: September 18, 2026, Windows

Six original compositions replace the five course diagrams and add a planning illustration. Each has a light and dark SVG variant.

The images use the chapter palettes. README image links, full-size views, and text explanations remain available without a diagram renderer.

| Command | Actual result |
| --- | --- |
| `npm run illustrations` | Created all 12 SVG files |
| `npm run build` | Two consecutive builds passed after adding bounded recovery for Windows directory-rename failures |
| `npm run test:content` | 28 tests passed, including image freshness, public allowlisting, ZIP image contents, and rename recovery |
| `npm run test:site` | 50 Chromium tests passed, including all 12 standalone SVG variants |
| `npm run test:cloud` | 11 mocked tests passed after dependency removal |
| `npm run test:language` | Passed across 20 documentation files |

The browser checks covered label bounds and overlaps, theme changes, full-size links, text explanations, and unavailable-image messages.
All six chapter routes worked under the hosting root and `/workshop/`.

Two earlier builds encountered `EPERM` during the output-directory rename.
The build now reports and retries transient Windows rename failures. Persistent failures still stop the build.

Visual review covered the light/dark artwork collections, a desktop overview, and the narrow dark Azure page.
Small-screen readers can open the full-size image or expand its text explanation.

These checks concern the website and artwork. They do not establish application behavior, learner understanding, or live Azure deployment.

### Unperformed live and UI checks

No live Azure provisioning or authenticated validation was performed. These operations are excluded from this implementation run because subscription and budget approval are unavailable.

Static and mocked checks do not prove live Azure authentication, record transfer, application behavior, or cleanup.

An initial Visual Studio launch produced only a transient splash. A later attempt reached the Visual Studio 2026 start window.

Opening the solution was blocked because foreground actions were disallowed. Computer Use reported `requires_escalation`, and no bypass was attempted.

No solution load, UI build, or agent prompt ran during that attempt.

No actual Modernize assessment or agent-driven learner walkthrough is recorded as passed. Workflow and artifact guidance comes from official documentation and source review.

## Planned release checks

These are acceptance checks, not completed results:

| Area | Evidence still required before claiming completion |
| --- | --- |
| Visual Studio entry | F5 and signed-in Copilot checks. Command-line clean startup and restart checks have passed |
| Learner data transfer | Repeat the passing isolated helper checks against the actual learner-generated application and its selected records |
| Complete learner journey | Assessment edit, reconciled plan, actual generated app checks, and successful resume |
| Required Azure learning | Visual Studio assessment and edited plan without provisioning prerequisites |
| Optional Azure deployment | Excluded from this run. A future approved run needs data, behavior, and dedicated-group cleanup evidence |
| Teaching quality | Representative learner attempts and explanations |

Do not perform live Azure validation without explicit access, scope, region, budget, and ownership approval.

## Historical execution record: September 17, 2026, macOS

This record predates the current Windows curriculum rewrite. It is retained as history, not current verification:

- 11 application tests in Release mode.
- 10 content and state tests.
- 11 cloud-helper tests with mocked external operations.
- 10 browser tests, including narrow layouts and enlarged text.
- Structural language checks across 16 documentation files.
- Bicep compilation and SQL generation without a database connection.
- PowerShell parsing and actionlint workflow checks.

The browser checks used a repository subpath. Visual review covered the landing page, a lesson, and a narrow dark-theme view.

Windows application execution and live Azure operations did not run in that record.

## Era interface checks

The era tests cover all six chapter/overview themes in light and dark modes. They check styles, artwork, contrast, narrow layouts, navigation, and request handling.

Retain the historical era-branch result: 28 browser checks, 11 content/state checks, and structural language checks passed.

That inherited record did not specify its run date. It does not claim current rewritten-content validation.

The historical review compared all six eras on desktop and mobile in both color modes. It did not establish learner engagement or historical authenticity.

Keep current rendered-page evidence separate from these historical results and from a live published-site review.
