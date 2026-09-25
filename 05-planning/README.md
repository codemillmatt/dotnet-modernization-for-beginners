# Chapter 05: Choose the upgrade plan

The assessment lists the work. The plan puts that work in order.
You'll ask the modernization agent for a plan, review its choices, and check how it will run the finished app.

Keep `shared-legacy-app\BookCatalog.sln` open in Visual Studio.
Use the same modernization chat and assessment from Chapter 04.

An **in-place upgrade** replaces the implementation in the existing project.
A **side-by-side upgrade** keeps the old and new apps running during the migration.
We'll use in-place for this one-project demo.

## Ask for the plan

Some migrations use compatibility adapters: libraries that help old and new web code work together.
BookCatalog will use ASP.NET Core APIs directly instead.

Send this request before making any application changes:

```text
@Modernize create plan.md for .NET 10 migration.
Use this scenario's assessment and Guided mode.
Upgrade only BookCatalog.Web in place to ASP.NET Core MVC with EF Core.
Use ASP.NET Core APIs directly, without a second web app or compatibility adapters.
Keep the current book list and forms.
Create and seed BookCatalogModernizedLab in LocalDB.
Only that disposable database may be recreated. Don't transfer old records.
Saved edits must survive normal app restarts.
Stop for review without changing application code or creating Git commits.
```

`BookCatalogModernizedLab` is the upgraded app's demo database, not the original app's database.
Only this new demo database may be recreated. Keep the original database outside this work.
EF Core creates the schema and seed books. It doesn't copy the old records.

We're giving the agent the details it needs for this sample.
Keep it focused on the sample app, leave the course materials alone, and don't transfer the old data.

## Understand the choices

<a id="choose-the-ef-approach-deliberately"></a>
<a id="your-decision-what-evidence-justifies-ef-core-now"></a>

The agent can ask you to **confirm**, **change**, or enter a **free-form answer** for its proposed options.
It may present the options in chat or ask you to read a Markdown file, usually named `upgrade-options.md`.
Don't confirm all defaults without reading them.

In a previous test run, the agent proposed side-by-side projects, compatibility adapters, and keeping EF6.
That creates a more complex migration than this demo needs.
If given the option, use these choices for the course:

| Option | Choose | Meaning for BookCatalog |
| --- | --- | --- |
| Upgrade Strategy | **All-at-Once** | Upgrade the one web project as a single group |
| Project Approach | **In-place rewrite** | Replace the Framework implementation in the existing web project |
| Unsupported API Handling | **Fix Inline** | Replace incompatible APIs during the upgrade, rather than leaving unfinished placeholder code |
| System.Web Adapters | **Direct Migration to ASP.NET Core APIs** | Replace the old web APIs instead of adding a compatibility library |
| Entity Framework | **Migrate to EF Core** | Rebuild the demo data model, schema, and seed setup with EF Core |
| Nullable Reference Types | **Leave Disabled** | These compiler checks flag references that might be `null`. Keep that separate cleanup out of this exercise. |
| Assembly Binding Redirects | **Document and Review Before Removing** | Check the legacy redirects. Don't copy them into ASP.NET Core |

EF6 and EF Core are separate libraries, not interchangeable packages.
The agent must update the database code, not only the package reference.

If the proposed options differ, select **change** or use the free-form answer to specify the choices above.
Confirm the corrected options. This approval is for planning, not execution.

<a id="know-which-artifact-you-are-changing"></a>
## Artifacts available after planning

The tool calls its generated reports, plans, and task files **artifacts**.
When planning finishes, the **Upgrade Agent Dashboard** website shows the plan outline and tasks.
Ask the agent to open the scenario's `plan.md` to see the details.

| File | What it contains |
| --- | --- |
| `assessment.md` | The original compatibility findings and any requirements you added |
| `plan.md` | The selected approach, application changes, and completion checks |
| `scenario-instructions.md` | The choices and instructions the agent carries into execution |
| `tasks.md` | The task list and current progress |

You may also see `upgrade-options.md`.
If you don't, read the **Upgrade Options** section in `plan.md` or `scenario-instructions.md`.

![The Upgrade Agent Dashboard shows the generated BookCatalog migration plan and task list.](../examples/assessments/bookcatalog/images/ch2-1-dashboard-plan.png)

[Open the full-size dashboard screenshot](../examples/assessments/bookcatalog/images/ch2-1-dashboard-plan.png).

This screenshot shows the earlier side-by-side plan, not the in-place choices used here.
The [excerpts from a previous migration](../examples/assessments/bookcatalog/planning-excerpts.md) explain that difference.

Note: use the scenario directory reported by the agent.

## Check the generated plan

Open `plan.md` and `scenario-instructions.md`. Check that both describe:

- One web project upgraded in place to .NET 10.
- ASP.NET Core MVC and EF Core.
- The current book-list page and forms.
- EF Core creating the demo schema and seed books.
- No second web app, compatibility adapters, or data-transfer tasks.
- No changes to the repository's helper, reference, test projects, or course website.

If either file still requires preserving existing records or keeping EF6, send:

```text
@Modernize Correct plan.md, scenario-instructions.md, and tasks.md for this demo.
Keep one in-place ASP.NET Core MVC app with EF Core.
Remove tasks for compatibility adapters, a second web app, or preserving old records.
Use EF Core to create and seed BookCatalogModernizedLab.
Only that demo database may be recreated. Keep saved edits across normal app restarts.
Show the corrected files. Don't execute or create Git commits.
```

Read the changed files before continuing. A chat acknowledgement doesn't tell you whether the saved plan changed.

## Add a useful run step

<a id="define-runnable-groups"></a>
<a id="change-one-inadequate-plan-step"></a>

Validation means checking whether the result meets the plan's requirements.
Find the validation section or final task in `plan.md`.

A **launch profile** stores settings that Visual Studio uses to start the app, such as its local address.
Add the following instruction if it isn't already there:

```text
After the conversion builds, launch BookCatalog from Visual Studio
using the new project profile, not the old IIS Express configuration.
Open the book list, add an active sample book, and edit its title.
Restart the app and check that the saved title remains.
Mark checks you didn't run as not run.
```

Save the file. Ask the agent to use it:

```text
@Modernize Read the launch and app-use instruction in plan.md.
Include it in the final validation task and scenario-instructions.md.
Show the updated task. Don't execute or create Git commits yet.
```

![Request a plan, review its upgrade choices, then check the plan and its completion steps before execution.](../docs/illustrations/plan-light.svg)

## Approve the plan, not the execution

Open **View > Git Changes**. At this point, the agent should have changed scenario files, not converted the application.
Continue when the saved plan matches the choices above and includes the launch/add/edit/restart check.

<a id="export-the-selected-records-before-the-upgrade"></a>
<a id="optional-copy-your-own-records"></a>

**[Next: run the upgrade](../06-upgrade-execution/README.md)**

## Reference

- [Upgrade strategies and flow modes](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/concepts)
- [EF6 to EF Core](https://learn.microsoft.com/ef/efcore-and-ef6/porting/)
- [EF Core schema creation](https://learn.microsoft.com/ef/core/managing-schemas/ensure-created)
