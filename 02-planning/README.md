# Chapter 02: Choose the upgrade plan

You now have an assessment and a record of affected behaviors. Use them to choose the changes that belong together.

Start with the assessment commit from [Chapter 01](../01-assessment/README.md). BookCatalog must still run as the original .NET Framework application.

Your output is a reviewed plan. Do not authorize application edits yet.

## Understand the choices

The agent can ask strategy questions during assessment or planning. Review their meaning rather than waiting for an exact dialog.

| Choice | Why it matters for BookCatalog | Choice for this exercise |
| --- | --- | --- |
| Upgrade strategy | One production project has no project dependency chain to sequence | Coordinate the changes in this application |
| Project approach | A second web application and reverse proxy add deployment responsibilities | Use an in-place upgrade on your learner branch |
| Entity Framework | EF Core changes data access as well as the web framework | Include EF Core and its behavior checks |
| Configuration | ASP.NET Core needs connection and startup settings in its configuration system | Map the existing settings explicitly |
| Database | An EF code change does not migrate existing records | Use a separate disposable database |
| Review and Git | An agent pause does not create a code checkpoint | Request review boundaries and save actual commits |

In larger systems, bottom-up means upgrading dependencies before their consumers. It is a project-order strategy.

A side-by-side web migration keeps old and new applications running together. A reverse proxy can direct requests between them. That is a different decision.

BookCatalog is small enough for an in-place exercise. This does not make in-place migration the only valid approach for a single-project application.

## Choose the EF approach deliberately

Keeping EF6 can reduce the number of simultaneous changes. You must still check its package support and behavior on the target runtime.

This exercise includes EF Core. We can inspect the small data layer and test its behavior. A larger data layer can justify a separate EF migration.

Dependency injection supplies a configured database context to the controller. The application controls its lifetime instead of the controller creating and disposing it manually.

EF Core's `EnsureCreated()` can create a schema in a new database. It cannot migrate an existing schema. Do not use it as a data-migration step.

Use these database boundaries:

- Leave the legacy MDF and its connection unchanged.
- Use `BookCatalogModernizedLab` for the modernized LocalDB sample.
- Use sample records in each database.
- Do not claim that records transfer between the databases.
- Use a separate schema step for the optional Azure database.

<div class="activity">

### Your decision: what evidence justifies EF Core now?

Inspect `Models/ApplicationDbContext.cs` and `Models/Book.cs` in the legacy project.

Write one reason to include EF Core. Write one reason a different team might defer it. Name a behavior check for each reason.

</div>

<details>
<summary>Compare your reasoning</summary>

One context and one entity keep this exercise small. The active filter, editable fields, and creation-date behavior provide concrete checks.

A team with complex queries or an existing business database can choose a separate data-layer migration. Keeping EF6 does not remove the need for tests.

</details>

## Ask for the plan

Send this request in the BookCatalog chat:

```text
Create the .NET 10 upgrade plan. Stay in Guided mode.
Use an in-place ASP.NET Core MVC upgrade and include EF Core.
Keep the legacy database untouched. Use BookCatalogModernizedLab
as a separate disposable LocalDB database.
Preserve the behavior checks from our assessment.
Group package, API, and startup changes into coherent runnable states.
Request my review before each execution group. Do not execute yet.
Keep Git commits under my control.
```

Open the scenario files that the agent identifies:

| Artifact | What to check |
| --- | --- |
| `upgrade-options.md` | Your choices and the reasons for them |
| `plan.md` | The scope and order of the changes |
| `tasks.md` | The execution groups and their completion conditions |
| `scenario-instructions.md` | Your constraints, including the database boundary |

Task names and counts can differ. Treat the plan as a proposal that you can edit.

## Define runnable groups

A project-file conversion is not necessarily a working web application. The project can compile while its views or hosting configuration still fail.

Likewise, removing EF6 packages before replacing EF6 code can leave the application incomplete. Keep coupled changes inside the same review group.

| Group | Change | Evidence at the boundary |
| --- | --- | --- |
| Readiness | Check SDK selection, restore, branch, and baseline | The original app runs and the baseline record exists |
| Application conversion | Change the project, MVC APIs, views, startup, configuration, and coupled EF code | The new app rebuilds and loads the separate lab database |
| Behavior review | Compare results and correct regressions | The behavior contract passes |
| Follow-up | Record intentional omissions and a recovery commit | The work can resume without recreating the plan |

The agent can use smaller internal tasks. A temporary incomplete state is acceptable inside a group if you know when to run the application again.

Reject a completion condition that only says "build succeeded" when the group changes database or request behavior.

## Approve the plan, not the execution

Inspect the pending diff before approval. Check that no application code changed during this planning step.

Ask for corrections where necessary. For example:

```text
The plan removes EF6 before the context migration.
Keep those changes in the same runnable group.
Add an HTTP check and a saved-record check at that boundary.
Do not execute the revised plan yet.
```

From the repository root in PowerShell:

```powershell
git status --short
git diff
git add .github/upgrades
git diff --cached
git commit -m "Record reviewed BookCatalog upgrade plan"
```

Commit only the reviewed artifacts. Keep unrelated files out of the staged changes.

You are ready when each execution group has a stated result and a way to check it.

**[Next: execute and check the upgrade](../03-upgrade-execution/README.md)**

## Reference

- [Upgrade strategies and flow modes](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/concepts)
- [EF6 to EF Core](https://learn.microsoft.com/ef/efcore-and-ef6/porting/)
- [EF Core schema creation](https://learn.microsoft.com/ef/core/managing-schemas/ensure-created)
- [Incremental ASP.NET migration](https://learn.microsoft.com/aspnet/core/migration/inc/overview)
