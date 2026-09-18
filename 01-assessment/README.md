# Chapter 01: Assess BookCatalog

An assessment describes the application before you change it. Make that description useful by adding what matters to its users.

Start with the working app and learner branch from [Chapter 00](../00-introduction/README.md). Keep your [learner record](../docs/learner-record.md) open.

Your output is a reviewed assessment with explicit requirements. Do not edit application code in this chapter.

## Ask for an assessment

Open `shared-legacy-app\BookCatalog.sln` in Visual Studio. Stop debugging.

Select **Modernize** from the solution's context menu. Choose the .NET upgrade operation if asked.

Attach your baseline notes through chat's context controls, or paste the relevant sections. Include:

- The solution and baseline commit.
- Your two actual record IDs, field values, and active states.
- The observed behavior checks and any unresolved results.
- The requirement to leave the legacy database unchanged.

Do not assume the agent can see local notes that you have not attached. Use sample data only. Do not share connection credentials or database files.

Send this request with that context:

```text
Assess BookCatalog from .NET Framework 4.8 to .NET 10 in Guided mode.
Use the baseline context attached to this request.
Do not change application code or execute an upgrade.
Identify the scenario folder and the assessment file.
Explain each major compatibility risk with source evidence.
Separate observed facts, assumptions, and missing information.
```

Inspect requested permissions before approval. Check the directory and command scope. Stop a request that targets another repository or database.

Ask the agent to open its assessment. Current documentation uses `.github\upgrades\{scenarioId}\assessment.md`. Verify the actual location, solution name, and target framework.

![One recorded assessment identifies a classic web project and an architectural migration. Your report can differ.](images/assessment-complete.png)

The screenshot records one run. Do not expect identical issue counts, package versions, or report sections.

## Read the report in a useful order

| Section or equivalent | Inspect | What it establishes |
| --- | --- | --- |
| Project summary | Source, target, project type, and dependencies | Which application was assessed |
| Package findings | Packages to upgrade, replace, or remove | Dependency work to investigate |
| API findings | Named APIs and source locations | Source or runtime behavior needing attention |
| Technology groups | MVC, configuration, EF6, and startup | Related changes that belong together |
| Tests and risks | Existing coverage and missing checks | Which conclusions still need evidence |

BookCatalog's classic web project and `System.Web` dependencies require more than a target-framework edit.

ASP.NET Core supplies web features through its framework reference. Removing an MVC 5 package still requires compatible controllers and views.

## Separate compatibility from priority

Compatibility categories describe a kind of change. They do not establish business priority.

| Category | Meaning | Evidence to seek |
| --- | --- | --- |
| Binary incompatibility | A compiled component can stop working with the new runtime or dependency | Replacement support and rebuilt components |
| Source incompatibility | Source can need edits before it compiles against the new API | Reported source and compilation results |
| Behavioral change | Code can compile but produce a different result | Checks of affected behavior |

A source incompatibility can block a build. A behavioral change can damage data. Neither category automatically means optional.

Record three separate decisions for an important finding:

1. What technical change does it describe?
2. Why does the behavior matter to the application's user?
3. Will you fix, replace, remove, or explicitly defer that behavior?

Deferral needs a workable design. Low usage does not make incompatible code compile.

![An investigation trail from a finding to source inspection, affected behavior, a chosen action, and a defined check.](../docs/illustrations/investigation-light.svg)

## Trace a finding into the application

Open `shared-legacy-app\src\BookCatalog.Web\Controllers\BooksController.cs`.

`Details(int id)` calls `HttpNotFound()` when a book does not exist. Preserve the HTTP 404 response, not the old method name.

`Index()` reads the request's user-agent value. ASP.NET Core controllers expose the current request through `Request`. This case does not require a separate context accessor.

Inspect `Global.asax.cs` next. Routes, filters, and database initialization need corresponding responsibilities in the new startup code.

<div class="activity">

### Your decision: can this finding wait?

Choose a real finding in your report. Record its source, affected behavior, action, and check.

Suppose the page has few users. Explain whether that changes compatibility or only business priority.

</div>

<details>
<summary>Compare your reasoning</summary>

The page belongs to the same compiled application. User count does not change API requirements.

For `HttpNotFound()`, ASP.NET Core's `NotFound()` is a reasonable replacement. Check that a missing record still returns HTTP 404.

For the active list, check filtering and title order. A build establishes neither behavior.

</details>

## Tell the agent what must survive

The agent can inspect code. It cannot infer which records you selected or why they must remain unchanged.

Open **your generated assessment file**. Add an **Application requirements** section.

Replace the ID placeholders below with your actual IDs before saving:

```text
R1: Preserve the selected records with IDs <active-id> and <inactive-id>.
R2: Preserve each ID, Title, Author, ISBN, PublishedYear, IsActive,
    and the full stored CreatedDate value, including null fields.
R3: Keep inactive books out of the main list and sort active books by title.
R4: Leave the legacy database unchanged.
R5: Copy the selected records to the separate BookCatalogModernizedLab
    database. New seed records do not count as that copy.
R6: Preserve validation, missing-record responses, antiforgery protection,
    persistence after restart, and CreatedDate during edits.
```

Refer to your baseline notes in this section. Record the two IDs in your learner record as well.

Now attach or refer to the edited assessment in chat. Ask:

```text
Read the Application requirements section I added to this assessment.
Compare it with the attached baseline observations.
Identify the affected code and any information still missing.
Explain how these requirements constrain the upgrade options.
Keep my requirement IDs when you reconcile the assessment.
Do not change application code or execute the upgrade.
```

Inspect the updated artifact, not only the chat acknowledgement. Correct lost requirements, invented observations, and mistaken assumptions.

The separate database is deliberate. Copying selected records is a later explicit step, not a side effect of changing EF packages.

## What the numbers do not prove

API counts can reveal repeated patterns. They do not measure redesign, environment repair, or testing effort.

No reported behavioral issues means the assessment found none. It does not prove that behavior will remain identical.

An assessment is an input to a decision. Your requirements explain which result is acceptable.

## Save the assessment for planning

From the repository root, inspect:

```powershell
git status --short
git diff
```

Expect assessment and scenario changes, not application edits. If code changed, stop and inspect it before asking the agent to restore the agreed scope.

Use the actual scenario directory when staging reviewed artifacts. For example:

```powershell
git add -- .github\upgrades\<actual-scenario-id>
if ($LASTEXITCODE -ne 0) { throw "Staging failed." }
git diff --cached
```

The path contains a placeholder. Replace it before running. Inspect the staged diff before making a checkpoint:

```powershell
git commit -m "Record BookCatalog assessment and requirements"
if ($LASTEXITCODE -ne 0) { throw "Checkpoint was not saved." }
```

Do not include credentials, snapshots, database files, or unrelated work.

You are ready when you can show a finding's source and your requirements in the assessment. Chapter 02 traces each requirement into a plan action and check.

## If the assessment differs or fails

For restore errors, rebuild the legacy solution first. For an incorrect solution name, reopen the correct solution.

For a disputed finding, inspect the source and give the agent contrary evidence. Do not change categories merely to reduce a count.

For an expired chat, ask the agent to identify the existing scenario before creating another assessment.

**[Next: choose an upgrade plan](../02-planning/README.md)**

## Reference

- [Upgrade concepts and state](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/concepts)
- [Types of breaking changes](https://learn.microsoft.com/dotnet/core/compatibility/categories)
- [ASP.NET Framework migration](https://learn.microsoft.com/aspnet/core/migration/fx-to-core/)
- [Historical console assessment](../examples/assessments/README.md)
