# Chapter 02: Choose the upgrade plan

Your assessment now includes requirements the agent could not infer from code. Turn those requirements into ordered actions and checks.

Start with the reviewed assessment from [Chapter 01](../01-assessment/README.md). BookCatalog must still run as the original .NET Framework application.

Your output is a revised plan and a snapshot of your selected records. Do not authorize application changes yet.

## Understand the choices

![A desktop-style plan connects the requirement to preserve stored values with a data decision and a check of selected records. Run one group at a time.](../docs/illustrations/plan-light.svg)

| Choice | Why it matters | This course's path |
| --- | --- | --- |
| Project order | BookCatalog has one production project | Coordinate changes inside that application |
| Application approach | A second app and reverse proxy add operating responsibilities | Upgrade in place on your learner branch |
| Entity Framework | Changing EF changes data access as well as the web framework | Include EF Core and its checks |
| Configuration | ASP.NET Core reads startup and connection settings differently | Map existing settings explicitly |
| Database | A code upgrade does not copy existing rows | Create a separate target, then copy selected records |
| Review and Git | An agent pause is not a saved checkpoint | Request review boundaries and control commits yourself |

In larger systems, bottom-up means upgrading dependencies before their consumers. It describes project order.

A side-by-side web migration keeps old and new applications running together. A reverse proxy directs requests between them. That is a different choice.

BookCatalog is small enough for this in-place exercise. That does not make in-place migration the only valid approach.

## Choose the EF approach deliberately

EF is the data-access library between the application and SQL Server.

Keeping EF6 can reduce simultaneous changes. You must still check the selected package's target-runtime support and application behavior.

This course includes EF Core because its one-context, one-entity data layer is small enough to inspect. A larger system can justify a separate EF migration.

Dependency injection supplies a configured context to the controller. The application controls its lifetime instead of the controller creating and disposing it.

<div class="activity">

### Your decision: what evidence justifies EF Core now?

Inspect `Models\ApplicationDbContext.cs` and `Models\Book.cs` in the legacy web project.

Record one reason to include EF Core and one reason another team might defer it. Name a check for each reason.

</div>

<details>
<summary>Compare your reasoning</summary>

One context and one entity keep this change bounded. Active filtering, nullable fields, and creation-date behavior give you concrete checks.

Complex queries or an existing business database can justify separating the changes. Keeping EF6 still requires support and behavior checks.

</details>

Use these database boundaries:

- Keep the legacy database and its MDF unchanged.
- Use a fresh `BookCatalogModernizedLab` database for the local target.
- Preserve the original seed base in that target.
- Copy your two learner-created records separately, with their existing IDs and values.
- Use a separate schema step and `BookCatalogLab` database for optional Azure deployment.

Keep the `Books` columns and nullability compatible with the [helper's supported SQL shape](../tools/BookCatalog.Data/README.md#prerequisites-and-limits).

The target needs `CreatedDate` as `datetime2(7)`. Do not reduce timestamp precision or introduce unrelated schema changes during this exercise.

EF Core's `EnsureCreated()` can create a schema in a new database. It neither upgrades an existing schema nor copies existing records.

If `BookCatalogModernizedLab` already contains unrelated work, stop before initialization. Use an isolated learner environment rather than deleting or repurposing that database.

## Know which artifact you are changing

Ask the agent to identify the actual files in your scenario. Current upgrade documentation uses `.github\upgrades\{scenarioId}`.

| Artifact or equivalent | Purpose | Your responsibility |
| --- | --- | --- |
| `assessment.md` | Findings, evidence, and application requirements | Correct facts and add missing requirements |
| `upgrade-options.md` | Strategy choices and their reasons | Review and reconcile the chosen options |
| `plan.md` | Scope, order, dependencies, and validation | Edit inadequate actions or checks before approval |
| `scenario-instructions.md` | Constraints carried across the scenario | Keep database, review, and commit boundaries explicit |
| Task specifications, when generated | Instructions and acceptance conditions for individual tasks | Check that they implement the reviewed plan |
| `tasks.md` and per-task progress, when generated | Agent-updated execution status and recorded outcomes | Inspect status against evidence, not just checkmarks |

Do not create a missing task file merely to match this table. Product versions differ in when they create task artifacts.

Do not mark unfinished tasks complete. Ask the agent to reconcile progress with actual checks instead.

The repository's root historical `plan.md` is not an active scenario artifact.

## Ask for the plan

Attach your edited assessment and relevant baseline notes. Send:

```text
Create the .NET 10 upgrade plan in Guided mode.
Use my edited assessment and requirements R1 through R6.
Choose an in-place ASP.NET Core MVC upgrade with EF Core.
Leave the legacy database unchanged.
Use the separate BookCatalogModernizedLab LocalDB target.
Export the two selected records before changing Web.config.
Use the supplied tools\BookCatalog.Data helper outside the learner solution.
Include import preview, explicit apply, and stored-value verification.
Keep nulls, IDs, IsActive, and full stored CreatedDate values.
Group coupled project, package, API, and startup changes into runnable states.
Request review at each boundary. Keep commits under my control.
Do not execute application changes yet.
```

Check the agent's selected mode and response. An instruction to pause does not guarantee every task-level pause.

## Define runnable groups

A converted project file is not necessarily a working web application. Views, hosting, configuration, and data access must also work.

Removing EF6 packages before replacing EF6 code can create an incomplete state. Keep those coupled changes within one review group.

| Group | Work | Evidence at its boundary |
| --- | --- | --- |
| Readiness | Check baseline, selected IDs, SDK, branch, and source export | Original app works and reviewed snapshot exists |
| Application conversion | Convert project, MVC, views, startup, configuration, and coupled EF code | Fresh build and HTTP checks against the separate target |
| Record copy | Preview, apply, and verify the selected snapshot | Same IDs and stored values, including nulls and timestamps |
| Behavior review | Repeat request, persistence, filtering, and edit checks | Results from your actual upgraded app |
| Recovery | Record unresolved items and save a reviewed checkpoint | Existing scenario can resume without discarding work |

The agent can use smaller internal tasks. Temporary incomplete states are acceptable inside a group if the next runnable boundary is clear.

## Change one inadequate plan step

Open your generated `plan.md`. Find a check that is missing or too weak.

If your plan already covers the requirements, use this teaching specimen to test its reasoning:

```text
After EF Core conversion, create and seed a database.
The group is complete when the project builds.
```

Explain why that fragment does not establish record preservation. Then add an explicit acceptance condition to your actual plan.

For example:

```text
Record-copy acceptance:
- Preview the selected snapshot against BookCatalogModernizedLab.
- Stop on an unexpected target, schema, or conflicting ID.
- Apply the copy only after reviewing the preview.
- Verify the same IDs and all stored fields against the source snapshot.
- Check inactive filtering separately through the application.
- Use a different throwaway record for edit and deletion tests.
```

Do not paste this over the whole plan. Integrate it into the relevant group.

Ask the agent to read your edit:

```text
Reconcile the plan with the acceptance condition I added.
Show where each assessment requirement R1 through R6 has an action and check.
Update related options, instructions, or task specifications as needed.
Explain the changes without claiming unrun checks passed.
Do not execute yet.
```

Fill in the [requirement-to-check table](../docs/learner-record.md#requirements-and-upgrade-plan). A chat acknowledgement alone is not evidence of a corrected plan.

## Export the selected records before the upgrade

The supplied [BookCatalog data helper](../tools/BookCatalog.Data/README.md) reads or copies only the BookCatalog `Books` shape.

It is a .NET 10 command-line tool outside `BookCatalog.sln`. Do not add it to the learner solution or include it in the agent's conversion scope.

It does not create a database or schema. The source must already be attached by the legacy app, and the target must exist before import.

Its input is your selected IDs and the legacy connection configuration. Its output is a versioned JSON snapshot with the stored fields.

An export reads the source. An import without `--apply` only previews. An explicit apply copies the selected set transactionally. Verify compares stored destination values.

A conflict stops the copy instead of overwriting rows or choosing new IDs. An exact repeat must not duplicate matching records.

This helper is not a production backup or general migration tool. Review the [helper's boundaries and failure guidance](../tools/BookCatalog.Data/README.md) before running it.

Stop debugging after the baseline records are saved. Confirm that the legacy `Web.config` still exists.

Export creates a new file and refuses to overwrite an existing snapshot. When resuming this attempt, inspect and reuse your saved snapshot instead.

For a new course attempt, choose a new filename. Use that filename consistently in later `--input` arguments.

From the repository root, replace both placeholders with your actual IDs:

```powershell
$ids = "<active-id>,<inactive-id>"
New-Item -ItemType Directory -Force .bookcatalog-lab -ErrorAction Stop | Out-Null
dotnet run --project tools\BookCatalog.Data -- export --source-config shared-legacy-app\src\BookCatalog.Web\Web.config --ids $ids --output .bookcatalog-lab\books.json
if ($LASTEXITCODE -ne 0) { throw "Source export failed. Do not start the upgrade." }
```

Open the local snapshot:

```powershell
Get-Content .bookcatalog-lab\books.json
git check-ignore .bookcatalog-lab\books.json
if ($LASTEXITCODE -ne 0) { throw "Keep the snapshot out of Git before continuing." }
```

Check both IDs, every field, the inactive state, and the blank fields' stored nulls. Copy the full stored `CreatedDate` values into your learner record.

Confirm `formatVersion` is `1` and inspect the entries under `books`. The nullable `isbn` and `publishedYear` fields must be present, even when their value is `null`.

Keep the snapshot unchanged for local and optional Azure comparisons. Do not convert dates to UTC, round them, or replace null fields.

The snapshot writes timestamps with seven fractional digits and no time-zone suffix. Legacy SQL `datetime` has already rounded values to its supported precision.

Export preserves the value returned by SQL Server. It cannot recover precision lost before export.

If a selected ID is missing, correct the selection against the legacy database. Do not substitute a seed record to make the export succeed.

If export fails, keep the legacy project intact while investigating. The upgrade can remove `Web.config`, so export must happen first.

## Approve the plan, not the execution

Inspect the pending diff from the repository root:

```powershell
git status --short
git diff
```

The changes should still be scenario artifacts, not application conversion. Stage only the reviewed scenario files, as in Chapter 01.

Inspect `git diff --cached` before creating your plan checkpoint. Keep `.bookcatalog-lab` out of that commit.

You are ready when each requirement has an action and check, your plan edit is reconciled, and the source snapshot matches your selected records.

**[Next: execute and check the upgrade](../03-upgrade-execution/README.md)**

## Reference

- [Upgrade strategies and flow modes](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/concepts)
- [EF6 to EF Core](https://learn.microsoft.com/ef/efcore-and-ef6/porting/)
- [EF Core schema creation](https://learn.microsoft.com/ef/core/managing-schemas/ensure-created)
- [Incremental ASP.NET migration](https://learn.microsoft.com/aspnet/core/migration/inc/overview)
