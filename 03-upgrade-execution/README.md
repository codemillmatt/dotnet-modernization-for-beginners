# Chapter 03: Review the generated upgrade

Execute the reviewed plan one task at a time. The work is not complete when the agent says "done"; it is complete when the diff matches your decision record and BookCatalog still satisfies its behavior contract.

## Learning outcomes

By the end of this chapter, you will:

- review the SDK-style, ASP.NET Core, .NET 10, and EF changes;
- correct at least one plausible but unsafe generated result;
- make and document a database schema decision;
- verify BookCatalog behavior beyond compilation; and
- preserve rollback evidence at every Guided-mode pause.

**Learner artifacts:** reviewed diffs, a code-review checklist, behavior results, and a schema decision.

## Guided-mode protocol

Before each task, verify the current mode. If necessary, enter:

> Switch to guided mode.

To execute one task without switching to Automatic mode, enter:

> Execute the next task, remain in Guided mode, and pause after the task completes.

At the pause:

1. inspect the diff;
2. run the task-specific checks;
3. correct or reject unsafe changes;
4. update generated progress/plan state if reality differs; and
5. commit the accepted task as a rollback point.

Product UI, task names, wording, file counts, and recovery steps may differ from the recorded run. The next expected review point is always the completed task's diff and evidence.

## Review matrix

Use this matrix throughout execution:

| Surface | What correct BookCatalog output demonstrates |
|---|---|
| SDK-style project | `Microsoft.NET.Sdk.Web`, intended target framework, no stale explicit source includes, necessary package references only |
| Target framework | `net10.0` after the ASP.NET migration, not during the isolated structure-only step |
| Packages | MVC 5/EF6 references removed only after their source is migrated; package versions support .NET 10 |
| Hosting | `Program.cs` replaces `Global.asax` startup responsibilities |
| Routing | Default Books route is represented by endpoint routing |
| Filters/error handling | The global error behavior is intentionally replaced, not silently lost |
| Dependency injection | Controller receives the context; startup registers it |
| `DbContext` lifetime | Scoped lifetime; no controller-owned `Dispose` |
| Controller behavior | Active filtering, ordering, not-found results, create/edit/delete allow-list |
| Async data access | Async EF calls are awaited and cancellation is considered where useful |
| Validation | data annotations and server-side `ModelState` checks remain |
| Anti-forgery | modifying actions and forms retain token validation |
| Configuration | connection strings and settings use modern configuration providers |
| Static assets | CSS is served and referenced from the correct web root |
| Error handling | development and non-development behavior are explicit |
| Database initialization | seed behavior is idempotent and schema management is an explicit decision |

## Task 1: Reconfirm the baseline

Before any application edit:

1. Build `shared-legacy-app\BookCatalog.sln`.
2. Run BookCatalog.
3. Execute:

   ```pwsh
   cd shared-legacy-app
   .\scripts\Test-BookCatalogBehavior.ps1 -BaseUrl https://localhost:44300
   ```

4. Save the passing output in your review notes.
5. Confirm the generated task includes this behavior contract.

If it does not, ask the agent to amend the plan before execution.

## Task 2: Isolate SDK-style conversion

The project should remain on .NET Framework 4.8 during the structure-only conversion. Review:

- SDK selection;
- `OutputType`;
- assembly references needed by an SDK-style `net48` web project;
- conversion from `packages.config` to `PackageReference`;
- content/view inclusion; and
- removal of obsolete explicit compile entries.

Build immediately. Do not allow an API migration in the same task because that destroys the ability to attribute a failure.

The recorded run exposed two conversion mistakes: dropped `System.Web` references and `OutputType=Exe`. The agent repaired both before proceeding:

![Recorded SDK-style conversion recovery showing two failed builds and their corrections](images/12-build-failed-recovered.png)

These are case studies, not failures every learner should reproduce. Your success criterion is a working SDK-style `net48` checkpoint with no intended behavior change.

Run the behavior contract again. Commit only if the build and behavior checks pass.

## Task 3: Review the ASP.NET Core migration

Retargeting is an architectural migration, not a package rename.

| Legacy concept | Required modern result | Review question |
|---|---|---|
| `System.Web.Mvc` | `Microsoft.AspNetCore.Mvc` | Do action results and status codes retain their meaning? |
| `Global.asax` | `Program.cs` and middleware | Were initialization, routing, filters, and errors all accounted for? |
| MVC 5 routing | ASP.NET Core endpoint routing | Does `/Books` remain the default experience? |
| MVC 5 filters | ASP.NET Core filters/middleware | Was `HandleErrorAttribute` replaced intentionally? |
| `Web.config` app configuration | `appsettings.json`, environment variables, providers | Are environment-specific values outside source? |
| `System.Web` request APIs | ASP.NET Core `HttpContext` | Does the User-Agent feature still work? |
| MVC 5 Razor/WebPages | ASP.NET Core Razor infrastructure | Were helpers, layout, imports, and static assets migrated? |

Only after those source and hosting changes can the MVC 5, Razor, WebPages, and `Microsoft.Web.Infrastructure` package references disappear. `Microsoft.NET.Sdk.Web` brings the ASP.NET Core shared framework; it does not provide the old packages under new names.

One recorded result produced this compact project:

![Recorded final SDK-style project targeting .NET 10 with EF Core package references](images/15-csproj-final.png)

Your package versions and exact file layout may differ. Verify the semantic result from the matrix instead of matching the screenshot.

### Deliberately flawed generated change

Review this plausible edit; **do not copy it**:

```csharp
[HttpPost]
public async Task<IActionResult> Edit(Book book)
{
    _db.Update(book);
    await _db.SaveChangesAsync();
    return RedirectToAction(nameof(Index));
}
```

Identify at least these defects:

- `[ValidateAntiForgeryToken]` was lost;
- an unvalidated model can be saved;
- binding the entire entity permits overposting; and
- `CreatedDate` can be overwritten by a field the form never intended to edit.

Correct the generated controller by retaining anti-forgery, checking `ModelState`, loading the existing entity, returning `NotFound()` when needed, assigning only `Title`, `Author`, `ISBN`, `PublishedYear`, and `IsActive`, then saving asynchronously. Record the correction in your review checklist even if your agent did not make this exact mistake.

Run the behavior contract and commit the reviewed ASP.NET Core task.

## Task 4: Review EF Core and schema management

Check:

- `AddDbContext<ApplicationDbContext>` uses the intended connection string;
- the context is constructor-injected and scoped;
- LINQ filters and ordering occur before materialization;
- async calls do not change not-found or validation behavior;
- seed data is deterministic and not duplicated; and
- the schema approach is explicit.

### `EnsureCreated()` is a lab simplification

The recorded course run replaced the EF6 initializer with `EnsureCreated()` plus idempotent seed code. That is acceptable only for this disposable local prototype/test database.

`EnsureCreated()`:

- is useful for transient, prototype, and test databases;
- bypasses the migrations history used for schema evolution;
- does not transition cleanly to migrations after a schema already exists;
- gives the caller schema-creation capability; and
- is not the default production deployment pattern.

For production, generate and review an initial migration, produce an idempotent deployment script or bundle, and apply it with a deployment/administrator identity:

```pwsh
dotnet ef migrations add InitialCreate
dotnet ef migrations script --idempotent --output .\artifacts\BookCatalog.sql
```

Do not run an unreviewed migration automatically at application startup. The runtime identity should normally receive data permissions, not broad DDL permissions.

Record one schema decision:

| Choice | Appropriate use | BookCatalog decision |
|---|---|---|
| `EnsureCreated()` | Disposable local course database | Allowed for the local lab only |
| EF Core migrations | Evolving shared or production schema | Preferred before treating the Azure deployment as production |

If you change from an `EnsureCreated()` database to migrations, recreate the disposable local database or plan a deliberate baseline; do not assume EF can adopt it automatically.

Run the behavior contract and commit the reviewed EF task.

## Task 5: Final verification

Perform all of these checks:

- [ ] Clean solution build succeeds.
- [ ] The behavior script passes every check.
- [ ] Restarting the app does not duplicate seed records.
- [ ] Unknown IDs return 404.
- [ ] Invalid create input remains on the form with messages.
- [ ] Create, edit, and delete work with anti-forgery enabled.
- [ ] Edit preserves `CreatedDate`.
- [ ] The active-only, title-ordered index remains correct.
- [ ] The custom User-Agent is displayed or an intentional removal is documented.
- [ ] CSS and layout load.
- [ ] Non-development error handling is configured.
- [ ] No MVC 5, EF6, or `System.Web` source remains unless the reviewed plan explicitly kept it.
- [ ] The schema decision is recorded.

The final page should still show the seeded active catalog:

![Recorded modernized BookCatalog index with six active seed books](images/19-bookcatalog-running.png)

The screenshot is not the test oracle. The behavior contract is.

## Review gate

Update the generated progress artifacts with:

- accepted and rejected changes;
- the deliberately flawed-change correction;
- behavior result paths;
- the schema decision;
- deferred work; and
- the final commit.

Then ask:

> Summarize the verified upgrade without making more changes. Remain in Guided mode.

Do not begin Azure work until the final checkpoint is committed.

## Recovery

- If the chat expires, reopen **Modernize** and ask it to resume from the committed `.github/upgrades/` state.
- If a task fails, stay in Guided mode, fix only that task, and rerun its build and behavior checks.
- If behavior changes while compilation succeeds, revert to the preceding task commit and inspect the smallest relevant diff.
- If LocalDB is unavailable, install SQL Server Express LocalDB through Visual Studio Installer; do not substitute an unreviewed database provider.

## Transfer exercise

How would the review gates change if BookCatalog had years of EF migrations, a public API, a shared database, and a zero-downtime requirement? Identify which change must use a deployment identity and which change should move to a side-by-side rollout.

## References

- [ASP.NET Framework to ASP.NET Core migration](https://learn.microsoft.com/aspnet/core/migration/fx-to-core/start?view=aspnetcore-10.0)
- [ASP.NET migration tooling](https://learn.microsoft.com/aspnet/core/migration/fx-to-core/tooling?view=aspnetcore-10.0)
- [EF6 to EF Core porting](https://learn.microsoft.com/ef/efcore-and-ef6/porting/)
- [`EnsureCreated` guidance](https://learn.microsoft.com/ef/core/managing-schemas/ensure-created)
- [EF Core migrations](https://learn.microsoft.com/ef/core/managing-schemas/migrations/)
- [Applying migrations](https://learn.microsoft.com/ef/core/managing-schemas/migrations/applying)

**[Continue to Chapter 04: Azure deployment](../04-cloud/README.md)**
