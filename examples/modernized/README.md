# Completed BookCatalog reference

<!-- repo-only:start -->
> [!TIP]
> **Prefer the web experience?** [Open this page on the course website](https://microsoft.github.io/dotnet-modernization-for-beginners/#/reference?path=examples%2Fmodernized%2FREADME.md) for the best reading experience and navigation.
<!-- repo-only:end -->

You'll run a completed .NET 10 application that lets you browse books, add one, and keep your changes.
It uses ASP.NET Core MVC and Entity Framework Core (EF Core).
Running it gives you a working example to compare with your own upgrade.

This is a separate example for comparison, not a recording of the modernization agent's output.
Your upgraded app can have different files and still do the same work.

## What runs where

We'll run SQL Server in Docker and the app with `dotnet` on your computer.
The container gives this reference its own SQL Server, separate from your learner app's LocalDB instance.

Docker is optional. The core course still uses Windows and LocalDB to rebuild the demo schema and seed books.
You don't need Azure here.

## Check your tools

Use **PowerShell on x64 Windows**, with Docker running **Linux containers**.
SQL Server's Linux image doesn't support ARM hosts or emulation.

Open PowerShell in `examples\modernized` inside your repository or extracted sample download.
Run these checks before installing anything:

```powershell
dotnet --version
dotnet --list-runtimes
docker info --format '{{.OSType}} {{.Architecture}}'
docker compose version
```

- Expect a stable SDK version of `10.0.x` or later.
- Expect both `Microsoft.NETCore.App 10.0.x` and `Microsoft.AspNetCore.App 10.0.x`. A later SDK might not include these runtimes.
- Expect `linux x86_64` or `linux amd64`, with Compose **2.20 or later**.

Missing a tool? Install the [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) or [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/).
Start Docker Desktop before continuing. Allow at least 2 GB of memory for SQL Server, plus memory for Docker and the app.

## Start the completed app

Use sample data only. SQL Server Developer edition is for development and testing, not production.
Read the [SQL Server container license terms](https://go.microsoft.com/fwlink/?linkid=857698) before accepting them.

The helper generates a password in the Git-ignored `.env` file.
Keep it private and with your sample. It's plain text, and local Docker administrators can inspect container settings too.

From `examples\modernized`, run:

```powershell
.\Start-BookCatalog.ps1 -AcceptSqlServerLicense
```

The helper starts SQL Server on `127.0.0.1:14333` and waits until it can answer a query.
Then it runs the app at **http://127.0.0.1:5099**.
The first run may take a few minutes to download SQL Server and restore .NET packages.

EF Core creates the schema and seed books on the first launch, not every restart.
Expect six active books. One inactive seed book stays off the list.

The helper temporarily replaces the LocalDB connection and disables the optional Key Vault setting.
It doesn't change the project's defaults.

## Try a saved change

<a id="compare-the-behavior"></a>

1. Select **Add New Book**.
2. Enter a sample title and author.
3. Select **Active** and save.
4. Open the book's **Edit** link.
5. Change the title and save.
6. Press Ctrl+C in PowerShell to stop the app.
7. Run the same helper command again.
8. Check that your changed title remains.

That's the useful comparison: the forms work, and a saved edit survives a restart.

## Stop and resume

After Ctrl+C stops the app, SQL Server keeps running.
From `examples\modernized`, stop this reference's SQL container with:

```powershell
docker compose stop
```

Run `.\Start-BookCatalog.ps1 -AcceptSqlServerLicense` again to resume.
The `bookcatalog-reference_sql-data` volume keeps the database between stops and container recreation.
Keep `.env` too. The stored database still needs its original password.
Use the same sample copy when you resume.

Don't use `docker compose down --volumes` unless you intend to erase this reference's demo data.
Stopping the container doesn't delete the volume. These commands don't stop your LocalDB instance or another Compose project.

## If something doesn't start

| Problem | What to do |
| --- | --- |
| Docker can't connect, or reports `windows` | Start Docker Desktop and switch to Linux containers. Repeat the checks above. |
| PowerShell blocks the helper | Follow your organization's script policy. For a trusted downloaded file, use `Unblock-File .\Start-BookCatalog.ps1` if permitted. |
| Port 14333 or 5099 is busy | Leave the other app running. Use `.\Start-BookCatalog.ps1 -AcceptSqlServerLicense -SqlPort 14334 -AppPort 5100` instead. Reuse those ports next time. |
| SQL Server doesn't become healthy | Run `docker compose logs --tail 40 sql`. Check Docker memory and disk space. Don't share logs without reviewing them. |
| Login fails after replacing `.env` | Restore the original `.env`. A new password doesn't change the password inside an existing SQL volume. |
| Startup reports a schema mismatch | Stop the app. `EnsureCreated` can't update an existing schema. To erase this reference's disposable books and rebuild, run `docker compose down --volumes`, then rerun the helper. |

## Prefer LocalDB?

<a id="run-on-windows"></a>

Already have LocalDB? You can skip Docker. Use the course's [setup checks](../../03-prerequisites/README.md#check-before-installing).

**Stop your learner app first.** This path uses the same `BookCatalogModernizedLab` database in `(localdb)\MSSQLLocalDB`, even across separate clones.
Unlike the Docker path, it can read and change your learner app's demo records.

From `examples\modernized` in PowerShell:

```powershell
dotnet run --project src\BookCatalog.Web
```

Open the console's URL. Press Ctrl+C to stop.
For an incompatible schema, stop the app before deleting **BookCatalogModernizedLab** in Visual Studio's **SQL Server Object Explorer**.
Delete it only if you no longer need its demo records.
The next launch creates its schema and seeds. Don't add deletion to startup code.

## Where to look in the code

<a id="intentional-differences"></a>

All paths below are under `src\BookCatalog.Web`.

| File | Why it's here |
| --- | --- |
| `Program.cs` | Connects MVC and EF Core, maps the book routes, and creates the demo database when needed |
| `Controllers\BooksController.cs` | Handles the book forms with asynchronous database calls and limits which fields a form can change |
| `Models\ApplicationDbContext.cs` | Defines the EF Core context and fixed seed books |
| `Views\Books` | Contains the catalog and forms |
| `appsettings.json` | Keeps the default LocalDB connection and demo initialization setting |

ASP.NET Core creates the database context and passes it to the controller. That's dependency injection.
The reference keeps active filtering, title order, validation, local creation time, and creation dates during edits.

<a id="selected-records-are-a-separate-copy"></a>

This reference doesn't transfer legacy records. The core course rebuilds demo data with EF Core.

<a id="portable-tests"></a>
<a id="windows-localdb-checks"></a>

Maintaining the reference? See the [validation guide](../../docs/validation.md#completed-reference-docker-checks) for checks and cloud configuration.
