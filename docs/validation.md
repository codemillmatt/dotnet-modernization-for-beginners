# Validation and evidence

This page is for maintainers. The [learner record](learner-record.md) is an optional detailed workbook, not a core-course prerequisite.

Keep planned checks separate from actual results. Record the command, environment, date, and limitations before claiming a result.

## Behavior contract

The [optional behavior checklist](learner-record.md#behavior-checks) owns the reusable detailed cases. Maintainers should check the original and actual upgraded applications.

Preserve active filtering, title order, validation, antiforgery protection, missing-record responses, persistence, and creation-date behavior.

The revised core path uses one in-place ASP.NET Core MVC application on .NET 10 with EF Core.
EF Core creates and seeds a separate demo database. Core completion doesn't require preservation of the original records or a shared schema.
Keep the original database outside that work.
Check that later launches retain a newly saved edit rather than recreate the demo data each time.

For the optional data-transfer lab, use two stable learner-created records for comparison. One is active, and one is inactive.

Use a separate throwaway record for edits, validation experiments, inactive/restore actions, and deletion.

Preserve the selected IDs, all field values, SQL nulls, `IsActive`, and full stored `CreatedDate`. Date-only details screenshots do not establish timestamp precision.

`Book` and the legacy create action use local `DateTime.Now`. Do not silently change time semantics during the upgrade.

Fresh seed counts apply only before learner additions. Reseeding is not selected-record migration.

Core completion requires the learner's upgraded app to run and save an edit that remains after restart.
It doesn't require the optional record-copy lab, server-validation exercises, workbook, or author-filter challenge.

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

## Supplied upgrade evidence: September 21, 2026

This is a review of user-supplied artifacts, not a new application or site validation run.
The [BookCatalog evidence page](../examples/assessments/bookcatalog/README.md) preserves the earlier September 18 observations and adds the later supplied record.

The review covered all 151 files in `mod-course-notes`, including `final-mod-agent-files`, plus the working-notes attachment.
It covered both assessment snapshots, plans, preferences, all task narratives, scripts, logs, response files, and six screenshots.
Identical report snapshots and repeated response bodies were compared by content.
Large build logs were inspected for outcomes and diagnostics.
No supplied scripts were executed, and no ongoing Visual Studio upgrade was changed.

### Assessment and planning facts

The assessment covers one non-SDK-style `net48` web project with no project dependencies.
The saved target is `net10.0`.
It records 636 lines of code, 89 incompatible API findings, seven package findings, and three binding findings.
The 89 API findings comprise 83 binary and six source incompatibilities grouped under `System.Web`.

The Markdown aggregate package count is zero, but the readiness record reconciles six installed packages and seven package findings.
The two EntityFramework findings account for the extra package finding.
The readiness record also reports assembly-identity checks that contradict the proposed Newtonsoft.Json redirect change.
Package `13.0.3` contains assembly `13.0.0.0`, which matches the existing redirect.
The baseline build didn't reproduce the reported `MSB3836` conflict.

The initial plan selected All-at-Once ordering with a side-by-side Core project, System.Web Adapters, EF6, inline fixes, and disabled nullable reference types.
It required binding review and authorized planning only.
The generated plan and tasks are separate artifacts from the assessment.
The supplied scripts place the framework scenario under `.github\upgrades\scenarios\dotnet-version-upgrade`, relative to the solution root.
The post-plan instructions capture has a misspelled filename. The generated file remains `scenario-instructions.md`.

### Execution facts and limits

The user reports an upgrade still running after more than five hours, with database safety causing difficulty.
That duration is a user observation, not an independently measured course timing.
The records don't establish how much of the reported delay came from database admission.

The recorded two-host approach required shared-schema ownership, a restorable data copy, and a restricted runtime identity.
The task records describe disabling legacy startup creation and seeding.
They then report a LocalDB runtime identity with `sysadmin` privileges and an unsuitable existing SQL Express configuration.
The user later authorized code-first work, Automatic execution, and a fresh isolated Docker fixture instead of original-data preservation.

| Supplied evidence | Supported result | What it doesn't establish |
| --- | --- | --- |
| Readiness baseline build log | Zero warnings and errors with SDK `10.0.401` and full Visual Studio MSBuild | A generated-app launch |
| Task 03.04 build and retry logs | Initial executable-lock failure, followed by a zero-warning, zero-error rebuild | Final upgrade acceptance |
| Proxy and native-asset HTTP logs | Health and CSS responses passed. Book routes remained guarded with HTTP 503 | CRUD, form interaction, or restart persistence |
| Task 02.01 admission log and superseding narrative | Reported backup, restore, schema, and restricted-permission checks on a three-record synthetic fixture | Original-data parity or a complete app walkthrough |
| `runtime-acceptance.md` | Explicitly deferred runtime checks | Passed runtime acceptance |
| Final task scripts | Intended parity, persistence, and rebuild checks | Execution or success without their result logs |
| `tasks.md` and `scenario.json` | Ten of eleven tasks complete, with final task 04 in progress | Completed migration or final adapter cleanup |
| Dashboard screenshots | Assessment, planning, and intermediate execution states | A manually observed generated-app Visual Studio launch |

Some older task narratives still say database admission is blocked.
The superseding task 02.01 entry and its admission log record the later fresh-fixture result.
Final validation remains open in the copied task state.
The folder name `final-mod-agent-files` doesn't override that state.

The metadata's last update is `2026-09-22T00:16:07Z`.
The snapshot contains no completed final parity, restart-persistence, or final-build result log.
It contains no Azure assessment, plan, deployment, or cleanup evidence.
All test projects were explicitly excluded from the supplied upgrade run.
Loopback HTTP probes used a certificate-trust bypass and don't establish TLS trust.

### Decision for the revised demo

The shared-database safeguards match a production coexistence problem.
The approved demo doesn't require that problem: it uses one upgraded host and fresh sample data.
The course now requests an in-place ASP.NET Core MVC upgrade to .NET 10, EF Core schema creation, and demo seeding.
It doesn't require adapters, YARP fallback, old/new schema coexistence, or preservation of original records.
That's a change in teaching scope, not a claim that the new path has been demonstrated successfully.

The assessment can stay unchanged.
Learners can record a preference when they need one, then review whether the generated plan matches the demo scope.
The final learner check still requires an actual Visual Studio launch and a saved edit that remains after restart.

### Public curation and current validation status

Three excerpt pages preserve selected original text with separate explanations.
Six screenshots retain their original filenames under the BookCatalog evidence image directory.
Their documented crops remove browser accounts and workspace paths without changing report text or task state.
The original detailed assessment screenshot includes .NET 8 labels that conflict with the saved `net10.0` target.
Those labels remain unchanged and are called out in the evidence page.

Raw response headers can contain encoded source paths. Raw build logs contain private filesystem paths.
Neither those files nor raw scripts, configuration, credentials, or database files were copied into public content.
The [provenance table](../examples/assessments/bookcatalog/README.md#provenance-and-excerpt-boundaries) records source names and exact image treatment.

The current revision's source and site checks are recorded below.
They don't replace the missing generated-application runtime checks.
No commits, pushes, publication, deployment, database changes, or interventions in the user's upgrade were performed for this review.

### Integrated checks for the September 21 revision

The complete required course and its optional guides now use the demo-rebuild scope.
The assessment edit is optional. Planning starts with the agent request, followed by explicit option review.
The standalone transfer exercise uses its own legacy copy instead of depending on records from the required upgrade.
Azure deployment remains optional and separately approved.

| Check | Actual result |
| --- | --- |
| `npm run illustrations` | Regenerated the light and dark illustrations, including the corrected planning sequence |
| `npm run build` | Passed with the three new excerpt pages and six curated screenshots |
| `npm test` | 34 content tests and 11 mocked cloud tests passed. Language checks passed across 28 files |
| `npm run test:site` | 62 Chromium browser tests passed |
| `git diff --check` | Passed |
| PowerShell syntax parsing | All 43 fenced PowerShell blocks in the revised core and optional guides parsed without executing them |
| SDK selection | `dotnet --version` returned `10.0.401` in both sample directories |
| Reference build | From `examples\modernized`, `dotnet build src\BookCatalog.Web\BookCatalog.Web.csproj --no-restore --nologo --verbosity quiet` passed with zero warnings and errors |

Both sample SDK policies accept later stable SDKs through `latestMajor` and reject preview SDKs.
The installed .NET 10 SDK was tested. No later major SDK was installed for this review.
The application target remains `net10.0`.

Browser checks cover old anchors, all required and reference routes, six-step progress, and preserved revision-2 completion.
They also cover the exact public-file list, ZIP contents, root/subpath hosting, code copying, and image loading.
Raw scenario files, private logs, databases, and arbitrary screenshots remain excluded from the site and download.

Direct visual review covered the corrected planning illustration at desktop width and the Setup page in the narrow dark theme.
The assessment screenshot loaded at narrow width with a full-size link.
The browser suite also checked light/dark themes, 320/390-pixel layouts, contrast, and illustration labels.
Review screenshots are retained in the private session artifacts, not published as course content.

The local preview responded at `http://127.0.0.1:4173/`.
The learner-copy commands weren't executed against the user's checkout, and the ongoing Visual Studio upgrade wasn't changed.
The source changes don't establish that a fresh in-place upgrade finishes successfully or takes less time.
That walkthrough and the Azure planning run remain unverified.

## Course slimming: September 18, 2026, Windows

The approved implementation adds a separate Setup chapter and narrows the required path to the Visual Studio tools.
Core completion has six steps: introduction, setup, assessment, planning, upgrade execution, and Azure planning.
The workbook, data lab, advanced checks, independent feature challenge, and deployment remain optional.

### Isolated Visual Studio observations

The recording started from tracked source commit `8a03066708b478c700fcfdf60119a1de46cae56b`, not the user's working files.
The user's root README edits were read and integrated. Their emphasis on Copilot tooling and generated artifacts remains.

The recording used Visual Studio Professional 2026 Insiders `18.11.12210.170`.
Installed SDKs were `9.0.318` and `10.0.401`. LocalDB reported `17.0.4025.3`.
Installed VSIX manifests reported GitHub Copilot `18.11.979.32481` and the modernization upgrade extension `1.1.458.59476`.

Its source copy, named LocalDB instance, MDF paths, and development port were separate from the course checkout and original database.
Only the recording copy's connection and port settings were changed for isolation.

| Action | Actual result |
| --- | --- |
| Open isolated solution | User opened it after Computer Use's open-solution action failed |
| Visual Studio F5 | Computer Use started a build, and Visual Studio showed BookCatalog running |
| Browser app check | Isolated URL displayed six active seed books and the legacy framework footer |
| Add a book | Explicitly approved form submission saved an active sample book, visible as the seventh listed book |
| `@modernize` | Explicitly approved chat submission returned an actual response and a .NET version assessment choice |
| Framework assessment and preference edit | Not captured |
| Upgrade options, edited plan, and execution | Not captured |
| Generated-app launch and resume | Not captured |
| Azure assessment and edited migration plan | Not captured |

Computer Use intermittently exposed an incomplete accessibility tree.
Some actions returned `no_viable_candidate` or UIA focus failures. Other clicks reported dispatch without an observed UI change.
The recorded success doesn't establish a completed unattended walkthrough.

The [curated recording](../examples/assessments/bookcatalog/README.md) contains the real app preview, verbatim Modernize greeting, provenance, and capture limits.
Raw source and database files remain in the private session workspace. No raw scenario directory is publicly allowlisted.

At that point, the remaining tool procedures were checked against current Microsoft Learn documentation.
They weren't presented as observed assessment, upgrade, or Azure results.
The later supplied assessment and planning evidence is recorded separately above. The full live walkthrough remains incomplete.

No Azure resources, commits, pushes, or publication were performed.
The recording copy and its dedicated LocalDB instance are retained. Cleanup requires separate approval.

### Source and site checks

The existing language checker passed across 25 documentation files with zero structural failures.
A separate STE-inspired review reported 13 findings and exited `1`, including eight synonym findings classified as hard.
Those included a preserved installation URL, exact UI wording, compatibility anchors, and terms with distinct uses here.
They were reviewed in context rather than changing protected technical text to satisfy a heuristic. This isn't a controlled-language compliance claim.
A heading comparison against the source commit retained all 81 prior root and core-chapter heading or explicit anchor targets.
Browser checks passed for moved anchors, including opening collapsed compatibility notices and following their Setup links.

PowerShell parsing passed for the three new core/setup command blocks after substituting the documented clone-URL placeholder.
That check parsed the examples without executing their commands.
The optional-document workstream also parsed 35 PowerShell blocks and resolved 97 local links and anchors.
Those checks didn't execute either deployment branch or perform database transfers.

The portable helper regression command passed all 68 selected tests:

```powershell
dotnet test tests\BookCatalog.Data.Tests\BookCatalog.Data.Tests.csproj --no-restore --nologo --verbosity quiet --filter 'FullyQualifiedName!~LocalDbIntegrationTests'
```

The filter explicitly excluded LocalDB integration. This run didn't copy records or establish behavior against the generated application.

The five original chapter sources contained 8,490 whitespace-delimited words.
The revised chapters plus the new Setup source contain 4,784, a 43.7% reduction.
This count includes Markdown, code, tables, optional notices, and link targets. It isn't a measured learner time saving.

Final integrated checks against the rewritten sources passed:

| Command | Actual result |
| --- | --- |
| `npm run illustrations` | Generated all 14 chapter illustration variants |
| `npm run build` | Passed |
| `npm test` | 31 content tests, 11 mocked cloud tests, and language checks across 25 files passed |
| `npm run test:site` | 59 Chromium browser tests passed |
| `git diff --check` | Passed |

These checks cover six-step progress, retained revision-2 completions, initially incomplete Setup, and excluded optional-page completion.
They also cover old routes and anchors, root/subpath hosting, exact public allowlists, packaged download links, and code copying.

Visual inspection covered Setup at 1440-pixel desktop and 390-pixel narrow widths, in light and dark themes.
The artwork, body, code, and navigation showed no clipping or horizontal overflow. Narrow artwork has full-size and text alternatives.
The screenshot set is retained under the ignored `artifacts\site-slimming` directory, not published as course content.

The final local preview returned HTTP 200 at its loopback address. It wasn't published.
Git HEAD remained `8a03066708b478c700fcfdf60119a1de46cae56b` on `workshop/decade-progression`.
No representative learner pilot or clean-machine installation has been performed.

## Current rewrite: actual execution record

This section retains the earlier Windows curriculum rewrite results. They don't establish the current course-slimming changes' status.

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

No actual Modernize assessment or agent-driven learner walkthrough was recorded as passed during that September 17 attempt.
Its workflow and artifact guidance came from official documentation and source review.
The September 21 supplied record above establishes later assessment and planning artifacts, not a completed walkthrough.

## Planned release checks

These are acceptance checks, not completed results:

| Area | Evidence still required before claiming completion |
| --- | --- |
| Visual Studio entry | Isolated legacy F5 launch and a signed-in Modernize response were observed on September 18. Generated-app F5 launch remains unrecorded |
| Optional learner data transfer | Repeat the passing isolated helper checks against the actual learner-generated application and its selected records |
| Complete learner journey | Review the supplied assessment and plan against the revised in-place demo. Capture generated-app launch, saved-edit persistence, and successful resume. Assessment edits are optional |
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
