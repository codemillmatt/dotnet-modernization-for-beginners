# Run the legacy BookCatalog sample

<!-- repo-only:start -->
> [!TIP]
> **Prefer the web experience?** [Open this page on the course website](https://microsoft.github.io/dotnet-modernization-for-beginners/#/reference?path=shared-legacy-app%2FREADME.md) for the best reading experience and navigation.
<!-- repo-only:end -->

BookCatalog is an ASP.NET MVC 5 application using .NET Framework 4.8, EF6, and SQL Server LocalDB.

Its users add, inspect, edit, and remove book records. The main list hides inactive books and sorts active books by title.

You can run this sample without completing the course. To modernize it, start with [Chapter 02](../02-introduction/README.md).

## Windows quickstart

Check the [readiness instructions](../03-prerequisites/README.md#check-before-installing). You need Visual Studio web tools, .NET Framework 4.8 targeting tools, IIS Express, and `MSSQLLocalDB`.

> **Sample data only.** The EF6 `DropCreateDatabaseIfModelChanges` initializer can replace its database after model changes.
>
> Never change the connection string to a business database. Do not create an empty MDF as a startup workaround.

1. Open `shared-legacy-app\BookCatalog.sln` from the repository root in Visual Studio.
2. Restore NuGet packages.
3. Select **Build > Rebuild Solution**.
4. Select IIS Express.
5. Press F5.
6. Check that the active catalog loads.

`NuGet.Config` restores packages into this solution's `packages` directory. That location matches the classic project's reference paths.

Application startup creates `App_Data` before EF initialization. Do not precreate the directory or an empty MDF as a preparation step.

A fresh database contains six active books and one inactive Matrix record. Existing sample data can change those counts.

Try adding an active sample book and editing it. Select **Active** explicitly when creating it.

The [setup app tour](../03-prerequisites/README.md#run-bookcatalog) covers ordinary use. The [detailed behavior checklist](../docs/learner-record.md#behavior-checks) is optional.

The connection uses integrated authentication and an MDF under the application's data directory. It does not contain a SQL password.

If startup fails, inspect the first error and check that `MSSQLLocalDB` is available. Don't create an empty MDF to fix an attachment error.

## Working through the course

Start with [the introduction](../02-introduction/README.md), then [Setup](../03-prerequisites/README.md). Setup prepares a learner copy and finishes with an app tour.

Chapters 04 and 05 use the modernization agent through Copilot Chat in Visual Studio to assess the app and generate its upgrade plan.

For modernization, use a stable .NET SDK 10 or later. The upgraded app still targets .NET 10, even with a later SDK.

Keep the .NET 10 runtime component installed through Visual Studio Installer's **Modify > Individual components** page.

Chapter 06 upgrades **your copy** in place to ASP.NET Core MVC on .NET 10 with EF Core.

The plan replaces the old web host. It doesn't keep a side-by-side host, shared schema, YARP, or System.Web adapters.

The data is disposable. Let EF Core rebuild the schema and seed `BookCatalogModernizedLab`, recreating the demo database when needed.

Don't reset it on every startup. Add a book, edit it, and restart the upgraded app to confirm that the saved edit remains.

Existing records don't need to survive modernization. [Data transfer](../docs/data-transfer.md) is a standalone reference, not a course prerequisite.

Chapter 07 finishes with an Azure assessment and plan. [Deployment](../07-cloud/deployment.md) needs separate access and cost approval and remains optional.

For comparison, inspect the original Git commit or another clone. Do not reset over your work.

This project intentionally uses classic web application project format. SDK conversion and API migration belong to the exercise, not setup repairs.
