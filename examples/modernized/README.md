# Completed BookCatalog reference

This standalone reference uses .NET 10, ASP.NET Core MVC, and EF Core. It has one production web project.

It supports comparison and recovery. It is not a recording of the agent's output or a replacement for your learner application.

## Run on Windows

Use a stable .NET 10 SDK and SQL Server LocalDB.

> Use sample data only. The default target is `BookCatalogModernizedLab`, which the course also uses.
>
> Run this reference in an isolated environment if that database already contains your learner work. A separate clone alone does not isolate LocalDB databases.

From `examples\modernized`:

```powershell
dotnet run --project src\BookCatalog.Web
```

Open the loopback URL from the console. Press Ctrl+C to stop the application.

The reference creates the target schema and seed base when the database does not exist. It does not use the legacy MDF or delete an existing database.

`EnsureCreated` cannot upgrade an existing schema. Investigate a conflicting lab schema instead of deleting it as a shortcut.

## Compare the behavior

Use the [learner behavior checklist](../../docs/learner-record.md#behavior-checks). The reference preserves active filtering, title order, validation, local creation time, and creation dates during edits.

The appearance stays close to the legacy sample. The footer names the new framework.

The course's author-filter exercise is an independent learner change. Its absence from this reference is intentional.

## Selected records are a separate copy

The reference does not automatically transfer legacy records. The course exports selected records before upgrading, then uses the [bounded data helper](../../tools/BookCatalog.Data/README.md).

Import preview does not write. Explicit apply copies the selected set, and verify compares stored values.

Seeding does not establish data preservation. Use the original selected IDs and all fields, including nulls and stored `CreatedDate`.

Follow [Chapter 03](../../03-upgrade-execution/README.md) against your actual upgraded application. Do not run its copy commands against a reference database by mistake.

## Intentional differences

- The reference has fixed seed records in `OnModelCreating`. EF Core adds them when it creates the schema.
- Controllers use dependency injection and asynchronous calls.
- Forms restrict binding to editable fields.
- The project includes optional Key Vault configuration.
- Tests use SQLite only inside the test host. The application uses SQL Server.

Your agent can choose different file layouts and equivalent implementations. Compare responsibilities and observed behavior rather than requiring identical files.

Without `KeyVaultName`, startup does not contact Azure. With that setting, startup requires `AZURE_CLIENT_ID` and a matching user-assigned managed identity.

For Azure, disable `InitializeDatabase`. An approved administrator prepares schema and copies selected records before the app uses its restricted runtime identity.

Required [Azure planning](../../04-cloud/README.md) does not deploy this reference. The [optional lab](../../04-cloud/deployment.md) deploys your learner application.

## Portable tests

From the repository root in PowerShell:

```powershell
dotnet test tests\BookCatalog.Tests\BookCatalog.Tests.csproj
if ($LASTEXITCODE -ne 0) { throw "Reference application tests failed." }
```

These tests use HTTP handling, Razor forms, and a relational SQLite database. They do not test your generated app, Windows hosting, LocalDB, or Azure access.

See [validation boundaries](../../docs/validation.md) for separate SQL Server and platform evidence.

## Windows LocalDB checks

The [modernized reference harness](../../docs/validation.md#windows-modernized-reference-checks) checks this app with real HTTP requests and an isolated LocalDB instance.

It covers request protection, server validation, stored creation-time preservation, and persistence after process restart. It does not use your learner database.

These checks complement the SQLite tests. Neither suite automatically validates a different agent-generated implementation.
