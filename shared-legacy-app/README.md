# Run the legacy BookCatalog sample

BookCatalog is one ASP.NET MVC 5 application with .NET Framework 4.8, EF6, and SQL Server LocalDB. Chapters 01 and 02 assess and plan changes. Chapter 03 upgrades your copy. Chapter 04 optionally deploys the result.

## Windows quickstart

Check the [course readiness instructions](../00-introduction/README.md#check-before-installing). You need Visual Studio's ASP.NET web build tools, .NET Framework 4.8 targeting tools, IIS Express, and `MSSQLLocalDB`.

1. Open `BookCatalog.sln` in Visual Studio.
2. Restore NuGet packages. `NuGet.Config` places them in this solution's `packages/` directory, matching the project's reference paths.
3. Select **Build > Rebuild Solution**.
4. Select IIS Express. Press F5.
5. Check that the active catalog loads. Use [the behavior contract](../docs/validation.md#behavior-contract) to check more than the landing page.

> The sample uses an EF6 `DropCreateDatabaseIfModelChanges` initializer. It can replace its sample database after model changes. Never change the connection string to a real business database.

The legacy connection uses integrated authentication and an MDF under the application's data directory. It does not contain a SQL password. Keep it separate from the modernized lab database.

## Working through the course

Use your own branch. Follow [Chapter 00](../00-introduction/README.md). Change this copy only as part of your reviewed upgrade.

For comparison, inspect the original Git commit or use another clone. Do not reset over your work.

This project intentionally stays in classic WAP format. SDK-style conversion and API migration are part of the exercise, not setup repairs.
