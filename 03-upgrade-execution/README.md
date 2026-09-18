# Chapter 03: Upgrade and check the application

Execute a reviewed group, inspect its result, and decide whether to continue. Agent status is not proof that the application or records survived.

Start with the revised plan and source snapshot from [Chapter 02](../02-planning/README.md). Keep your [learner record](../docs/learner-record.md) available.

Your output is a .NET 10 application using ASP.NET Core MVC and EF Core, with your selected records verified in a separate database.

## Authorize one execution group

Confirm that `.bookcatalog-lab\books.json` contains your two selected source records. Inspect the plan, pending diff, and selected mode.

Send:

```text
Execute the first approved runnable group.
Preserve our requirements and leave the legacy database unchanged.
Keep tools\BookCatalog.Data outside the learner solution and upgrade scope.
Do not create Git commits or change my source snapshot.
Pause for review at the approved boundary.
If the group cannot finish, explain the incomplete state.
Do not start the next group until I approve it.
```

Check the response. Guided mode does not guarantee a pause after each internal task.

Inspect requested commands and their directories. Do not authorize a reset, database deletion, or overwrite merely to get past an error.

## Check the SDK and project changes

After the application conversion group, start in the repository root:

```powershell
Set-Location shared-legacy-app
dotnet --version
if ($LASTEXITCODE -ne 0) { throw "SDK selection failed." }
Set-Location ..
```

The result must select a stable .NET 10 SDK. The existing `global.json` allows later stable .NET 10 feature bands.

Inspect `shared-legacy-app\src\BookCatalog.Web\BookCatalog.Web.csproj`. Expect an SDK-style web project targeting `net10.0`.

MVC 5 packages and `System.Web` references should no longer drive the app. Check compatible package versions rather than matching a screenshot's patch numbers.

## Inspect responsibilities, not only filenames

| Legacy responsibility | New approach | Check |
| --- | --- | --- |
| `Global.asax.cs` startup | `Program.cs` | MVC services and routes exist |
| `RouteConfig` | Endpoint routing | Root route reaches the book list |
| MVC controller APIs | ASP.NET Core APIs | Missing records return 404 and writes retain validation |
| `Web.config` connection | Application configuration | Effective connection uses `BookCatalogModernizedLab`, not the legacy MDF |
| Controller-owned context | Constructor injection | Context has the intended request lifetime |
| EF6 initializer | Explicit schema and seed strategy | Target has a separate schema and source remains unchanged |
| Views and static files | Razor views and `wwwroot` | Forms, links, styles, and antiforgery tokens work |

![A browser sends a request to BooksController. The injected ApplicationDbContext accesses BookCatalogModernizedLab. The controller selects a Razor view, which renders the response for the browser.](../docs/illustrations/architecture-light.svg)

The context executes database operations. The controller selects a response. The view renders it. Review each responsibility before running the changed application.

<div class="activity">

### Your review: did the edit preserve the behavior?

Inspect the generated `Edit` action. Find how it loads and updates the existing record.

Check that editable fields change without replacing `CreatedDate`. Compare the create action with the original local-time behavior.

Explain why assigning every posted property can pass a build but fail this review.

</div>

<details>
<summary>Compare your review</summary>

The legacy edit action leaves `CreatedDate` unchanged. Its create action uses `DateTime.Now`.

Accepting a posted creation date changes that behavior. A build checks types and references, not the intended meaning of the field.

</details>

## Rebuild, run, and repeat the checks

Finish the runnable group before building. From the repository root:

```powershell
Set-Location shared-legacy-app
dotnet build src\BookCatalog.Web\BookCatalog.Web.csproj --no-incremental
if ($LASTEXITCODE -ne 0) { throw "Build failed. Resolve errors before running." }
dotnet run --project src\BookCatalog.Web\BookCatalog.Web.csproj
```

Open the loopback URL from the console. In Visual Studio, select the new project launch profile rather than the old IIS Express configuration.

Check warnings as well as errors. Confirm that the app uses the separate target database.

A fresh target contains the seed base, not your learner-created records. Similar seed titles do not establish a data copy.

Stop the app with Ctrl+C before the import. Return the shell to the repository root with `Set-Location ..`.

## Preview, copy, and verify the selected records

Open `shared-legacy-app\src\BookCatalog.Web\appsettings.json`. Check that `ConnectionStrings:BookCatalogContext` names the approved local target.

Check environment-specific settings and environment variables too. The application and helper must use the same target, without an unnoticed configuration override.

The helper reads the named configuration file. It does not reconstruct every ASP.NET Core configuration provider.

From the repository root, preview:

```powershell
dotnet run --project tools\BookCatalog.Data -- import --input .bookcatalog-lab\books.json --target-config shared-legacy-app\src\BookCatalog.Web\appsettings.json
if ($LASTEXITCODE -ne 0) { throw "Import preview failed. Do not apply." }
```

This command does **not** copy records. Review the destination and selected rows before proceeding.

The `Destination:` line identifies the server and database. Compare both with your approved target.

The helper prints `PREVIEW ONLY` and identifies missing, matching, or conflicting rows. A conflicting preview exits unsuccessfully.

If an ID already has different values, stop. Do not renumber your records, overwrite the conflict, or delete unrelated data.

Investigate whether you selected the wrong target or reused an occupied lab environment.

When the preview matches the plan, apply and verify:

```powershell
dotnet run --project tools\BookCatalog.Data -- import --input .bookcatalog-lab\books.json --target-config shared-legacy-app\src\BookCatalog.Web\appsettings.json --apply
if ($LASTEXITCODE -ne 0) { throw "Import failed. Inspect the error before continuing." }
dotnet run --project tools\BookCatalog.Data -- verify --input .bookcatalog-lab\books.json --target-config shared-legacy-app\src\BookCatalog.Web\appsettings.json
if ($LASTEXITCODE -ne 0) { throw "Stored values do not match. The data check has not passed." }
```

The selected set is transactional: a conflict must not leave a partial copy. Reapplying matching records must not create duplicates.

If a connection fails during apply, run verify before retrying. A lost response can leave the client unable to confirm a completed commit.

Record the actual preview, apply, and verification results. Do not edit the snapshot to hide a mismatch.

Use these final messages to distinguish the operations. `N` and `M` below are count placeholders, not text you enter:

```text
PREVIEW ONLY: N would be inserted; M already match. No rows changed.
Applied and verified: N inserted; M already matched. No records overwritten.
Verified N records: IDs and all stored values match exactly.
```

Verify compares IDs and stored fields, including nulls, `IsActive`, and full `CreatedDate` values. A date-only details page cannot establish timestamp precision.

Exit code `0` means the requested helper operation passed. A failed or incomplete operation must not become a passing learner-record entry.

### Check the legacy source remains unchanged

Use SQL Server Object Explorer to inspect the **original** database on `(localdb)\MSSQLLocalDB`. Do not point the upgraded app at it.

Replace both placeholders in this read-only query:

```sql
SELECT Id, Title, Author, ISBN, PublishedYear, IsActive,
       CONVERT(nvarchar(27), CreatedDate, 126) AS StoredCreatedDate
FROM dbo.Books
WHERE Id IN (<active-id>, <inactive-id>)
ORDER BY Id;
```

Compare the results with your source snapshot. Check values, SQL nulls, and timestamp precision. Record the source check separately from target verification.

Do not modify, detach, or delete the legacy database.

## Check your actual upgraded application

Run the upgraded project again from `shared-legacy-app`. Open both saved details paths on the **new** local address.

The active carry-forward record belongs in the list. The inactive record must stay absent while its details route remains available.

Repeat the [behavior checks](../docs/learner-record.md#behavior-checks) with a **new throwaway record** in the target database.

Use that record for edits, validation, inactive/restore experiments, and deletion. Keep both carry-forward records unchanged.

Use [Chapter 00's check guidance](../00-introduction/README.md#check-behavior-with-a-separate-record) against the upgraded app's URL and target database.

Restart the app and check persistence. Use stored values to check creation dates during edits, not only the date shown by the view.

![One recorded modernized app shows the active catalog. Your own behavior and stored-value checks establish the result.](images/19-bookcatalog-running.png)

The [reference tests](../docs/validation.md#what-the-reference-tests-prove) run against the completed example. They do not automatically test your agent-generated application.

Ask the agent to add or adapt checks for your actual app when a result remains unverified. Keep **Not run** distinct from **Pass**.

## Save a real checkpoint

Stop the app. From the repository root:

```powershell
git status --short
git diff --stat
git diff
```

Stage only reviewed application and scenario files. If those directories contain no unrelated changes:

```powershell
git add -- shared-legacy-app .github\upgrades
if ($LASTEXITCODE -ne 0) { throw "Staging failed." }
git diff --cached
```

Inspect the staged diff before committing:

```powershell
git commit -m "Upgrade BookCatalog and verify selected records"
if ($LASTEXITCODE -ne 0) { throw "Checkpoint was not saved." }
```

Do not stage snapshots, database files, credentials, or build output. Record unresolved checks honestly.

Request the next approved group explicitly if work remains. Keep the same review rules.

## Recover without discarding your work

Find the existing scenario's task status and progress details. Current upgrade documentation uses paths such as `tasks\{taskId}\progress-details.md` under the scenario folder.

Use the actual path reported by your agent. Do not create a file merely because an example names it.

Give the agent the actual error, last successful check, and current incomplete state. Ask it to reconcile the next action with the plan.

Rehearse a resume after saving your checkpoint:

1. Close and reopen Visual Studio.
2. Open the same solution and learner branch.
3. Ask the agent to identify the existing scenario and pending group.
4. Compare its answer with your learner record before authorizing changes.

Do not manufacture completion by editing progress checkmarks.

For SQL startup errors, inspect the selected target and LocalDB instance. `EnsureCreated()` cannot repair an incompatible existing schema.

For comparison, open [the completed reference](../examples/modernized/README.md) in an isolated environment. Do not copy it over your learner output.

## Make an independent change

Add an optional author filter to the list. Keep active-only results and title order.

First, write the requirement and checks in your own words. Then use the agent to inspect and edit the relevant controller and view.

Check a matching author, a nonmatching author, and an empty filter. Confirm that an inactive matching book remains absent.

<details>
<summary>Worked approach after your attempt</summary>

Start `BooksController.Index` with the active query. Add the author condition before materializing results.

This fragment belongs inside the action. Adapt the context variable to your implementation:

```csharp
var query = db.Books.Where(book => book.IsActive);
if (!string.IsNullOrWhiteSpace(author))
{
    query = query.Where(book => book.Author.Contains(author));
}
var books = await query.OrderBy(book => book.Title).ToListAsync();
```

Add a nullable `author` parameter and a GET form in `Views\Books\Index.cshtml`. Name the input `author`.

Define case-matching expectations for your database. Do not assume all providers compare text identically.

Check the complete action and view before saving the change.

</details>

<a id="finish-the-core-workshop"></a>
## Finish the local upgrade

Save the independent change after its checks pass. Run selected-record verification again to confirm that the filter did not change your stable data.

You have completed the local journey, not the whole course. Next, apply the same assessment and planning discipline to Azure.

**[Next: assess and plan for Azure](../04-cloud/README.md)** · **[Course overview](../README.md)**
