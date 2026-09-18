# Check the application, not just the build

## Behavior contract

Run the same cases on the original app and your modernized app. Use disposable records in each database. This exercise does not transfer records.

| Case | Action | Acceptable result |
| --- | --- | --- |
| Active list | Inspect the fresh catalog | The list contains six active seeded books in title order. The inactive Matrix record is absent |
| Create and persist | Add a book with valid values. Record its details URL. Restart the app | The details URL shows the saved values |
| Validation | Try an empty title/author, a title over 200 characters, or a year outside 1800-2100 | The server rejects invalid records, even without browser validation |
| Edit | Change a saved book's title, author, or year | The changes persist. The original creation date stays unchanged |
| Inactive | Mark your record inactive. Return to the list | The record disappears from the list. Its details URL still works |
| Restore experiment | Open the details URL. Edit the record. Make it active again | The record returns in the correct order |
| Missing record | Open `/Books/Details/2147483647` in the disposable lab | HTTP 404 rather than a successful empty page |
| Delete | Delete the disposable record through the confirmation form | It disappears and its details URL returns 404 |
| Request protection | Submit a write without a valid antiforgery token | The server rejects the write |

`Book` and `BooksController.Create` use local `DateTime.Now`. Preserve that behavior for this exercise rather than silently changing time semantics during the framework migration.

Record the result, relevant URL, and any discrepancy in your own notes. Do not put real personal data, credentials, or database files in the notes or in Copilot chat.

## What the reference tests prove

The modernized reference tests exercise HTTP, Razor forms, validation, antiforgery protection, and database behavior using a relational SQLite test host. They do not prove SQL Server compatibility or that your agent-generated implementation is identical.

Run from the repository root:

```powershell
dotnet test tests/BookCatalog.Tests/BookCatalog.Tests.csproj
```

```bash
dotnet test tests/BookCatalog.Tests/BookCatalog.Tests.csproj
```

The production sample still uses SQL Server. Do not change the learner app's provider just to make a portable test pass.

## Maintainer checks

After changing Node dependency manifests, restore with `npm ci`. From the repository root:

If Playwright reports a missing browser, run `npx playwright install chromium` before the browser tests.

```bash
npm run test:content
npm run test:language
npm run test:cloud
npm run build
npm run test:site
dotnet test tests/BookCatalog.Tests/BookCatalog.Tests.csproj
```

The same commands work in PowerShell. The site tests start and stop their own loopback server. Generated output lives in ignored directories.

Never count an unavailable platform or mocked Azure command as a successful live run.

## Windows legacy checks

Use Windows PowerShell, Visual Studio web build tools, NuGet CLI, IIS Express, and LocalDB.

From the repository root:

```powershell
.\scripts\Test-LegacyApp.ps1
```

The script copies tracked legacy source into a unique temporary directory. It does not change your learner application or its database.

It rebuilds the copy and checks the active catalog and a missing-record response. It then stops its IIS process and detaches its isolated database.

With `-BuildOnly`, the script checks compilation only. It reports that runtime checks did not run.

## Evidence boundaries

| Check | Evidence | Limit |
| --- | --- | --- |
| Portable application tests | HTTP, forms, validation, and SQLite behavior | Not SQL Server or the learner's generated output |
| Language checks | Selected structural rules | Not certified dictionary compliance |
| Cloud helper tests | Mocked command scope and failure cleanup | Not Azure access or live service behavior |
| Bicep compilation | Local template syntax and types | Not quota, permissions, or successful deployment |
| Browser tests | Routes, assets, progress, themes, copy, and responsive behavior | Not observed learner understanding |
| Windows workflow | Separate build and runtime checks when the job executes | The YAML alone does not prove a Windows run |

## Local execution record

On September 17, 2026, local checks passed on macOS:

- 11 application tests in Release mode.
- 10 content and state tests.
- 11 cloud helper tests with mocked external operations.
- 10 browser tests, including narrow layouts and enlarged text.
- Structural language checks across 16 documentation files.
- Bicep compilation and SQL script generation without a database connection.
- PowerShell parsing and actionlint workflow checks.

The browser checks used a repository subpath. The visual review covered the landing page, a lesson, and a narrow dark-theme view.

Windows application execution and live Azure operations did not run. This record does not claim those results.

## Era interface checks

The era tests cover every chapter in light and dark modes. They check the actual styles, artwork size, text contrast, and narrow layouts.

They also check history navigation, Resume, failed requests, delayed responses, and diagram palettes.

The six-era visual comparison belongs in the session review artifacts. It does not establish learner engagement or historical authenticity.

The era changes do not alter application behavior or Azure resources.

The era branch passed 28 browser checks and 11 content/state checks. Structural language checks also passed.

The review compared all six eras on desktop and mobile, in both color modes. The original application and cloud source stayed unchanged.
