# Chapter 06: Upgrade and check the application

Now we'll have the modernization agent upgrade BookCatalog using the plan you reviewed.
You'll inspect the result, launch it from Visual Studio, and try the app running on the version of .NET you specified.

Keep `shared-legacy-app\BookCatalog.sln` open.
Use the same scenario and chat from Chapter 05.

## Authorize the upgrade

<a id="authorize-one-execution-group"></a>
The saved plan and `scenario-instructions.md` contain the scope you reviewed.
Ask the agent to follow them rather than repeating the full plan in chat.

Send this request:

```text
@Modernize Execute this scenario's reviewed plan.
Follow the plan through to completion.
Build the app and report which checks ran.
Tell me which Visual Studio profile to launch and which app-use checks remain.
Don't create Git commits, create Azure resources, or deploy.
```

> **It may take up to an hour.** The upgrade can run for a while.
> You may need to periodically tell the agent to `continue`. Watch for it to stop and prompt it again.

Review and approve requests to edit the learner project, restore packages, and build it.
The plan permits recreating only `BookCatalogModernizedLab`, not the original database.
It also requires keeping saved edits across normal restarts.

The **Upgrade Agent Dashboard** shows execution progress.
Open a task there to read its details. The agent also updates `tasks.md` and may create files under a `tasks` directory.
Task counts and names can differ from the screenshots in this [previously executed sample](../examples/assessments/bookcatalog/README.md).

![The recorded Upgrade Agent Dashboard shows most tasks complete, with final validation still in progress.](../examples/assessments/bookcatalog/images/ch3-2-most-tasks-complete.png)

[Open the full-size dashboard screenshot](../examples/assessments/bookcatalog/images/ch3-2-most-tasks-complete.png).

## Check the SDK and project changes

An **SDK-style project** uses a shorter project-file format that selects build tools and lists package dependencies.

After the agent reports that the conversion builds, open **View > Git Changes**.
Open the diff for `shared-legacy-app\src\BookCatalog.Web\BookCatalog.Web.csproj`.

The project should now use `Microsoft.NET.Sdk.Web`, which selects the ASP.NET Core build tools.
Its target should be `net10.0`.
Look for EF Core package references instead of the EF6 package.
Legacy MVC 5 and `System.Web` references should no longer be required by the upgraded project.

<a id="inspect-responsibilities-not-only-filenames"></a>
## Spot inspect some upgrades

ASP.NET Core creates the configured `ApplicationDbContext` and passes it to `BooksController`.
That's **dependency injection**. The controller no longer creates its own context.

A **connection string** identifies the database server, database, and how the app connects.
The upgraded app keeps this setting in `appsettings.json` instead of the old `Web.config`.

Open these files under `shared-legacy-app\src\BookCatalog.Web`:

| File | What to check |
| --- | --- |
| `Program.cs` | Configures MVC and database access, then connects URLs to controller actions |
| `Controllers\BooksController.cs` | Uses ASP.NET Core actions and receives its context through the constructor |
| `appsettings.json` | Configures the `BookCatalogModernizedLab` demo database |
| `Views\Books` | Contains the book list and forms |
| `Properties\launchSettings.json` | Stores the launch profiles and their startup settings for Visual Studio |

The agent may put database creation and seed code in another file.
Ask it to identify that file if it isn't in `Program.cs`.
The code should create the schema when needed, not erase the catalog each time you start the app.

![A browser request reaches BooksController. Its context reads or writes the EF Core demo database, and a Razor view produces the response.](../docs/illustrations/architecture-light.svg)

<a id="your-review-did-the-edit-preserve-the-behavior"></a>
`CreatedDate` is the **Date Added** value you saw in the original app.
Changing a title shouldn't change when that record entered the catalog.

Read the controller's `Edit` action marked `[HttpPost]`, which handles the submitted form.
It should update the editable book fields without replacing `CreatedDate` with a form value.

## Rebuild, run, and repeat the checks

1. Select **Build > Rebuild Solution**.
2. Wait for a successful build in **View > Output**.
3. In **Solution Explorer**, right-click `BookCatalog.Web` and select **Set as Startup Project** if needed.
4. Open the list beside Visual Studio's green start button.
5. Select the project profile the agent reported, usually `http` or `https`, not **IIS Express**.
6. Press F5.

The profile's `commandName` is `Project` in `Properties\launchSettings.json`.
This profile starts the upgraded app directly instead of using the original project's IIS Express settings.
If no project profile exists, ask the agent to add one to `BookCatalog.Web`, then rebuild.

Use the browser address opened by Visual Studio. The port can differ from the original app.
Expect the book list and seed books. You don't need the books you added in Setup.

## Check your actual upgraded application

1. Open a book's details page.
2. Return to the list and select **Add New Book**.
3. Enter a sample title and author.
4. Select **Active** and save.
5. Open the new book's **Edit** link.
6. Change the title and save.
7. Select **Debug > Stop Debugging** in Visual Studio.
8. Press F5 to start the app again.
9. Check that the list still shows the changed title.

If the edit disappears, ask the agent to check the database connection and startup initialization.
It must keep the database between normal restarts. Repeat the add/edit/restart check after the fix.

A completed dashboard task or a successful build doesn't replace this browser check.
The completed reference's tests don't test your generated application.

## Save a real checkpoint

Stop debugging. Open **View > Git Changes** and review the files that changed.
Keep the generated application and scenario files in your learner copy.
The course doesn't require a commit.

Ask the agent to leave checks it didn't run marked **not run**.
If you performed the browser check yourself, tell it which actions passed so it can record your result.

## Recover without discarding your work

For a build or runtime error, copy the full error from **Output** into the same chat.
Replace the last line below with that error:

```text
@Modernize Fix this error in the current BookCatalog upgrade scenario.
Use the reviewed in-place .NET 10 and EF Core demo plan.
Keep completed work and update the affected task.
Don't reset the repository or create Git commits.
Error:
<paste the complete error here>
```

For a database-schema mismatch, the agent can recreate `BookCatalogModernizedLab` from EF Core.
It doesn't need to recover the old records.
After repair, rerun the app and repeat the add/edit/restart check.

If you reopen Visual Studio later, ask the agent to find this scenario and show its first unfinished task.
Read that task before approving more work.

## Finish the local upgrade

<a id="finish-the-core-workshop"></a>
Continue when your generated .NET 10 app builds, opens, and keeps a saved edit after restart.
Chapter 07 uses this upgraded solution.

<a id="preview-copy-and-verify-the-selected-records"></a>
<a id="check-the-legacy-source-remains-unchanged"></a>
<a id="make-an-independent-change"></a>
<a id="optional-data-and-independent-change-exercises"></a>
**[Next: assess and plan for Azure](../07-cloud/README.md)** · **[Course overview](../README.md)**
