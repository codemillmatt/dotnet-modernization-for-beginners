# BookCatalog: the legacy app

The app you modernize in this course. It's a book catalog with full CRUD, and it's
deliberately ordinary.

## What it is

| Aspect | What it is |
|---|---|
| Framework | .NET Framework 4.8 |
| Web | ASP.NET MVC 5 |
| Data | Entity Framework 6, SQL Server LocalDB |
| Packages | `packages.config` |
| Project format | Classic (non-SDK-style) |
| Projects | One: `BookCatalog.Web` |
| Tests | None |

```text
shared-legacy-app/
├── BookCatalog.sln
├── global.json
├── NuGet.Config
└── src/BookCatalog.Web/
    ├── App_Start/          FilterConfig, RouteConfig
    ├── Controllers/        BooksController
    ├── Models/             Book, ApplicationDbContext
    ├── Views/              Books CRUD views and the shared layout
    ├── Global.asax(.cs)    Application startup
    ├── Web.config          Connection string and settings
    ├── packages.config     Six packages
    └── BookCatalog.Web.csproj
```

## Why it looks like this

Every property in that table is a decision, and each one puts a specific obstacle in
front of the upgrade:

- **One project.** No dependency graph to untangle, so the sequencing problem moves
  *inside* the project — where most real single-app upgrades live.
- **Classic project format plus `packages.config`.** Both must be converted before the
  interesting work starts, and doing them in the wrong order means redoing code edits.
- **`System.Web` throughout.** Controllers, `Global.asax`, and routing all sit on APIs
  that simply don't exist on .NET 10. This is the structural work.
- **EF6.** It runs on .NET 10, so "port to EF Core" is a genuine decision rather than a
  forced move. `Database.SetInitializer` is the quiet trap.
- **No tests.** The common case, and the one that matters most. The modernization agent
  runs the tests you have and never writes new ones, so an untested codebase gives its
  validation loop nothing but the compiler to work with.

## Get it building

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint legacy-baseline
Set-Location .\work
nuget restore .\BookCatalog.sln
msbuild .\BookCatalog.sln /p:Configuration=Release
```

Then press <kbd>F5</kbd> and browse to `/Books`. You should see seed data, and create,
edit, and delete should all work. That's your baseline.

Work in a copy under `work/`, never in this folder. `Reset-Course.ps1` makes the copy and
leaves this pristine, so you can always get back to a known state.
{: .warning }

## Where it goes

- [Chapter 00](../00-setup/README.md) — build it, then run assessment against it
- [Chapter 01](../01-assessment/README.md) — read and correct the assessment
- [Chapter 02](../02-planning/README.md) — review and change the plan
- [Chapter 03](../03-execution/README.md) — run the upgrade, and write the tests it never had
