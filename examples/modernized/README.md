# Completed BookCatalog reference

This standalone reference uses .NET 10, ASP.NET Core MVC, and EF Core. It has one production web project.

It supports comparison and recovery. It is not a recording of the agent's output or a replacement for your learner application.

## Run on Windows

Use a stable .NET SDK 10 or later and SQL Server LocalDB. The [setup checks](../../prerequisites/README.md#check-before-installing) explain these requirements.

The application still targets .NET 10. A later SDK doesn't replace the .NET 10 runtimes needed to run it.

In Visual Studio Installer, select **Modify > Individual components**. Keep the .NET 10 runtime component selected.

For a command-line check, run `dotnet --list-runtimes`. Expect `Microsoft.NETCore.App 10.0.x` and `Microsoft.AspNetCore.App 10.0.x`, with your installed patch numbers.

If either runtime is missing, repair the .NET 10 components through the [setup instructions](../../prerequisites/README.md#check-before-installing) before running the app.

Use sample data only. The default target is `BookCatalogModernizedLab`, which the learner app also uses.

Stop the learner app before trying the reference. Both connect to that named database, even from different clones.

From `examples\modernized`:

```powershell
dotnet run --project src\BookCatalog.Web
```

Open the loopback URL from the console. Press Ctrl+C to stop the application.

The reference creates the schema and seed data when the database doesn't exist. It doesn't reset data on restart.

`EnsureCreated` can't upgrade an existing schema. If startup reports a schema mismatch, stop the app.

You can recreate the disposable `BookCatalogModernizedLab` database, then run the reference again to create its EF Core schema and seeds.

For this reset, open **View > SQL Server Object Explorer** in Visual Studio. Connect to `(localdb)\MSSQLLocalDB`.

Under **Databases**, right-click **BookCatalogModernizedLab** and select **Delete**. Confirm that specific demo database, then rerun the command above.

This removes its demo records. Don't add deletion to `Program.cs` or a startup script.

## Compare the behavior

Try adding an active sample book, editing it, and restarting the app. Confirm that its saved values remain.

For deeper checks, use the [optional behavior checklist](../../docs/learner-record.md#behavior-checks) and [advanced guidance](../../docs/advanced-checks.md).

The reference preserves active filtering, title order, validation, local creation time, and creation dates during edits.

The appearance stays close to the legacy sample. The footer names the new framework.

The [author-filter challenge](../../docs/author-filter.md) is optional. Its absence from this reference is intentional.

## Selected records are a separate copy

The reference doesn't transfer legacy records. The core course rebuilds demo data through EF Core.

For a separate import exercise, use the [standalone data-transfer reference](../../docs/data-transfer.md) and [data helper](../../tools/BookCatalog.Data/README.md).

## Intentional differences

- The reference has fixed seed records in `OnModelCreating`. EF Core adds them when it creates the schema.
- Controllers use dependency injection and asynchronous calls.
- Forms restrict binding to editable fields.
- The project includes optional Key Vault configuration.
- Tests use SQLite only inside the test host. The application uses SQL Server.

Your agent can choose different file layouts and equivalent implementations. Compare responsibilities and observed behavior rather than requiring identical files.

Without `KeyVaultName`, startup does not contact Azure. With that setting, startup requires `AZURE_CLIENT_ID` and a matching user-assigned managed identity.

For Azure, disable `InitializeDatabase`. An approved administrator prepares schema and seeds before the app uses its restricted runtime identity.

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
