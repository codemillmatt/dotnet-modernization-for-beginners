# Chapter 01: Annotate the assessment

Chapter 00 produced a BookCatalog assessment and your predictions. Now turn the generated report into engineering evidence instead of accepting its summary at face value.

## Learning outcomes

By the end of this chapter, you will:

- trace major findings to BookCatalog source files;
- classify compatibility type separately from remediation severity;
- identify behavior that requires regression verification;
- challenge package recommendations and effort assumptions; and
- produce an annotated assessment for planning.

**Learner artifacts:** an annotated assessment and a behavior-risk list.

## 1. Preserve the assessment state

Confirm that the application still builds and that no application source was changed during assessment. Commit the generated `.github/upgrades/` state before editing it.

> **Generated-output variance:** Screenshots and examples in this chapter come from a recorded run. Incident counts, line counts, wording, severity labels, and grouping may differ. Grade the result by whether it identifies the relevant BookCatalog surfaces and provides evidence, not by whether its numbers match the course.

If the agent moved past assessment, enter **"Pause. Switch to guided mode and return to the assessment review point."**

## 2. Use three separate dimensions

Compatibility documentation describes the kind of break. It does not decide remediation urgency or business priority.

| Dimension | Values | Question |
|---|---|---|
| **Compatibility type** | Binary, source, behavioral | What kind of compatibility changed? |
| **Remediation severity** | Mandatory, potential, optional, informational | Must this be changed for the selected target and design? |
| **Course priority** | Based on likelihood, business impact, blast radius, and verification cost | When should BookCatalog address it? |

A behavioral change can compile successfully and still corrupt data or expose an endpoint. Conversely, many binary incompatibilities may be repetitive namespace changes with low individual review cost.

Use the [.NET compatibility categories](https://learn.microsoft.com/dotnet/core/compatibility/categories) as a reference, then apply this BookCatalog decision table:

| BookCatalog evidence | Compatibility type | Remediation severity | Priority reasoning |
|---|---|---|---|
| `System.Web.Mvc` controller base types and action results | Binary/source findings may be reported depending on API and analyzer version | Mandatory for an ASP.NET Core target | Broad compile impact, but many edits are mechanical |
| `Global.asax.cs`, route registration, and global error filter | Source and hosting-model migration | Mandatory | Small file count, high application-wide blast radius |
| `HttpContext.Request.UserAgent` | Source/API migration plus behavioral verification | Mandatory if the footer behavior is retained | Easy code change, but a runtime request-context behavior |
| EF6 initializer to EF Core initialization | Source and behavioral migration | Potential until the EF strategy is selected; mandatory if EF Core is selected | Schema and seed behavior have higher data impact |
| `Book.PublishedYear` range and required fields | Often no compatibility incident | Mandatory regression behavior | Compilation cannot prove validation remains enforced |
| Anti-forgery attributes on modifying actions | Often a mechanical source change | Mandatory security behavior | High impact even though the code is small |

Never rewrite an analyzer's compatibility category merely to lower priority. Add your separate severity and priority columns.

## 3. Trace the generated findings

Review the assessment in this order:

1. project type and target;
2. packages and framework dependencies;
3. API and technology clusters;
4. files with incidents;
5. estimates and assumptions.

Annotate at least these evidence paths:

| File | Evidence to verify in the generated report |
|---|---|
| `BookCatalog.Web.csproj` | Classic Web Application Project, .NET Framework 4.8, explicit assembly references, `packages.config` |
| `Global.asax.cs` | Application startup, EF initialization, routes, and filters |
| `BooksController.cs` | MVC 5 action types, synchronous EF access, CRUD allow-list, anti-forgery, User-Agent |
| `ApplicationDbContext.cs` | EF6 context, drop/recreate initializer, deterministic seed data |
| `Book.cs` | required fields, lengths, year range, active default, created date |
| `Web.config` | LocalDB connection, ASP.NET settings, binding redirects |
| Razor views | MVC 5 helpers, anti-forgery fields, editable fields, visible User-Agent |

The recorded run reported 89 API incidents concentrated in `System.Web` and roughly 633 lines of C# and Razor. Those are **recorded results**, not acceptance criteria. Also correct the common wording error: 89 describes incidents or API hits, not 89 lines of code.

## 4. Review package recommendations

Do not interpret removal of MVC 5 packages as ASP.NET Core silently supplying the same packages. The source and hosting model must migrate first.

| Legacy concept | Modern concept | Why the legacy package/reference can then be removed |
|---|---|---|
| `System.Web.Mvc` | `Microsoft.AspNetCore.Mvc` | Controllers, results, filters, and model binding move to ASP.NET Core APIs |
| `Global.asax` | `Program.cs` and middleware | Startup and request pipeline are rebuilt for ASP.NET Core hosting |
| MVC 5 routing | ASP.NET Core endpoint routing | Routes are registered in the endpoint pipeline |
| MVC 5 filters | ASP.NET Core filters and exception handling | Filter types and global registration change |
| `Web.config` application configuration | `appsettings.json`, environment variables, and providers | Application settings leave the System.Configuration model |
| `System.Web` request APIs | ASP.NET Core `HttpContext` APIs | Request context is exposed by ASP.NET Core |
| MVC 5 Razor/WebPages packages | ASP.NET Core Razor infrastructure | Views are updated to ASP.NET Core Razor conventions |

After those code and hosting changes, `Microsoft.NET.Sdk.Web` supplies the ASP.NET Core shared framework. It does **not** turn `System.Web.Mvc`, MVC 5 Razor, or WebPages into equivalent implicit packages.

For every recommendation, add one of:

- **accept now**, with the source changes that enable it;
- **defer**, with the compatibility and support consequence; or
- **clarify**, when the generated recommendation lacks enough evidence.

The intentionally old starter package versions are assessment inputs. Do not update them before the agent runs.

## 5. Build the behavior-risk list

The repository has no legacy unit-test project. Rather than adding a second project that changes the assessment shape, the course provides a reusable HTTP characterization harness.

Read [`BEHAVIOR-CONTRACT.md`](../shared-legacy-app/BEHAVIOR-CONTRACT.md), run the script against the legacy app, and capture its output:

```pwsh
cd shared-legacy-app
.\scripts\Test-BookCatalogBehavior.ps1 -BaseUrl https://localhost:44300
```

Add risks that compilation will not catch:

| Behavior | Evidence | Failure impact | Verification |
|---|---|---|---|
| Active-only, title-ordered index | LINQ query in `BooksController.Index` | Incorrect catalog contents | Characterization script |
| Unknown ID returns not found | `Details`, `Edit`, `Delete` GET actions | Incorrect HTTP semantics | Characterization script |
| Required fields and year range | Data annotations in `Book.cs` | Invalid data | Characterization script |
| Create assigns server-side date | `Create` POST | Audit data loss | Create/details check |
| Edit preserves `CreatedDate` | Explicit property allow-list | Overposting/data loss | Before/after details check |
| Delete targets one record | `DeleteConfirmed` | Data loss | Create/delete check |
| Seed is present and idempotent | initializer and `Global.asax.cs` | Missing/duplicate startup data | Restart plus script |
| Modifying actions reject missing token | attributes and Razor forms | CSRF regression | Token and rejection checks |
| User-Agent remains visible or is intentionally removed | index action and view | Feature regression | Custom User-Agent request |

## 6. Record uncertainty in effort

An issue count is not a duration estimate. Record assumptions behind any estimate:

- one project and one controller;
- no external authentication or public API;
- LocalDB is disposable course data;
- manual and scripted behavior checks are available;
- the learner can change hosting and EF together;
- Azure access and role assignments are handled later; and
- review time is included, not only agent execution time.

If any assumption is false for a real application, widen the estimate and reconsider strategy.

## Annotated assessment template

Add this table to your assessment artifact or notes:

| Finding | Source evidence | Compatibility type | Severity | Priority | Confidence / question | Regression check |
|---|---|---|---|---|---|---|
| | | | | | | |
| | | | | | | |
| | | | | | | |

Your completed assessment must include:

- at least one finding from each major BookCatalog file group;
- one result that needs clarification;
- one package recommendation you actively reviewed;
- one behavior risk not visible from compilation;
- assumptions behind effort; and
- a link or path to the saved legacy behavior result.

## Review gate

Ask the agent:

> Update the assessment with my annotations. Remain in Guided mode and pause after the assessment is updated; do not generate or execute the plan yet.

Review the diff, commit the annotated assessment and behavior evidence, and only then continue to Chapter 02.

## Transfer exercise

How would your priorities change if BookCatalog used Windows Authentication, exposed a versioned public API, and shared its EF model with 20 projects? Identify one behavioral change that could compile successfully yet become a release blocker.

## References

- [.NET compatibility categories](https://learn.microsoft.com/dotnet/core/compatibility/categories)
- [Library breaking-change guidance](https://learn.microsoft.com/dotnet/standard/library-guidance/breaking-changes)
- [ASP.NET Framework migration](https://learn.microsoft.com/aspnet/core/migration/fx-to-core/start?view=aspnetcore-10.0)
- [EF6 to EF Core porting](https://learn.microsoft.com/ef/efcore-and-ef6/porting/)

**[Continue to Chapter 02: Planning](../02-planning/README.md)**
