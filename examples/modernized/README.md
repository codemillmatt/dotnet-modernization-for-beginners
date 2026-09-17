# Completed BookCatalog reference

This reference uses .NET 10, ASP.NET Core MVC, and EF Core. It has one production web project.

The reference supports comparison and recovery. It is not a recording of the agent's output. Complete the [upgrade exercise](../../03-upgrade-execution/README.md) in your own application first.

## Run on Windows

Use a stable .NET 10 SDK and SQL Server LocalDB. From this directory:

```powershell
dotnet run --project src/BookCatalog.Web
```

Open the loopback URL from the console. The reference creates `BookCatalogModernizedLab` if that database does not exist. It does not use the legacy MDF.

> Use this database for sample data only. The reference does not transfer records from the legacy database. It never deletes an existing database.

`EnsureCreated` can create a new schema. It cannot upgrade an existing schema. If an existing lab schema conflicts, use a new isolated environment for comparison.

## Compare the behavior

Follow the [behavior contract](../../docs/validation.md#behavior-contract). The reference preserves active filtering, title order, validation, local creation time, and creation dates during edits.

The appearance stays close to the legacy sample. The footer names the new framework. The tests use SQLite only inside the test host.

## Intentional differences

- The reference uses fixed seed records in `OnModelCreating`. EF Core adds them when it creates the schema.
- Controllers use dependency injection and asynchronous database calls.
- Forms restrict binding to editable fields.
- The project includes optional Key Vault support for Chapter 04.

Without `KeyVaultName`, startup does not contact Azure. With that setting, startup requires `AZURE_CLIENT_ID` and a matching Azure managed identity.

For Azure, disable `InitializeDatabase`. Apply the schema with an administrator before the application uses its restricted database identity.

## Portable tests

From the repository root:

```powershell
dotnet test tests/BookCatalog.Tests/BookCatalog.Tests.csproj
```

```bash
dotnet test tests/BookCatalog.Tests/BookCatalog.Tests.csproj
```

These tests use real HTTP handling, Razor forms, and a SQLite database. They do not test Windows hosting, LocalDB, or Azure access.
