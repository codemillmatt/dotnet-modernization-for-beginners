# Run the legacy BookCatalog sample

BookCatalog is an ASP.NET MVC 5 application using .NET Framework 4.8, EF6, and SQL Server LocalDB.

Its users add, inspect, edit, and remove book records. The main list hides inactive books and sorts active books by title.

You can run this sample without completing the course. To modernize it, start with [Chapter 00](../00-introduction/README.md).

## Windows quickstart

Check the [readiness instructions](../00-introduction/README.md#check-before-installing). You need Visual Studio web tools, .NET Framework 4.8 targeting tools, IIS Express, and `MSSQLLocalDB`.

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

Check creation, editing, inactive filtering, and persistence with the [learner behavior checklist](../docs/learner-record.md#behavior-checks).

The connection uses integrated authentication and an MDF under the application's data directory. It does not contain a SQL password.

If startup fails, inspect the LocalDB instance and configuration before changing anything. Do not delete an existing database to force a fresh start.

## Working through the course

Use your own branch. Chapter 00 establishes a baseline and two learner-created carry-forward records.

Chapters 01 and 02 assess requirements and revise a plan. Export the selected records in Chapter 02, while the original `Web.config` still exists.

Chapter 03 upgrades **your copy** in place. It uses a separate `BookCatalogModernizedLab` database and an explicit selected-record copy.

Changing the framework or recreating seed data does not transfer those records. Keep the legacy database unchanged.

Chapter 04 requires an Azure assessment and plan. [Deployment](../04-cloud/deployment.md) needs separate access and cost approval and remains optional.

For comparison, inspect the original Git commit or another clone. Do not reset over your work.

This project intentionally uses classic web application project format. SDK conversion and API migration belong to the exercise, not setup repairs.
