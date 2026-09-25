# Chapter 04: Assess BookCatalog

<!-- repo-only:start -->
> [!TIP]
> **Prefer the web experience?** [Open this page on the course website](https://microsoft.github.io/dotnet-modernization-for-beginners/#/01-assessment) for the best reading experience and navigation.
<!-- repo-only:end -->

The assessment is the first part of the upgrade process.
It identifies what must change before an app can be upgraded to the .NET version you specify.
The modernization agent generates an assessment report through GitHub Copilot in Visual Studio.

We'll use `shared-legacy-app\BookCatalog.sln` inside your learner copy.
It's the same solution you ran in Setup. Open it in Visual Studio and stop debugging if it's still running.

## Why assess the app?

The assessment report gives you a starting point for the upgrade. It identifies incompatible APIs, project changes, and package issues.
You can share the report with your team or management when discussing the work.
The modernization agent also uses it to prepare the upgrade plan.

## Ask for an assessment

Open **GitHub Copilot Chat**. First, send just `@Modernize`.
This opens the modernization agent, which scans the solution and asks what you want to do.
You don't always have to start with only `@Modernize`, but it lets Copilot see what it's working with.

**Guided mode** pauses between stages so you can review the assessment and plan before approving more work.
A **scenario** tracks one upgrade, including its reports, decisions, and task progress.
The agent saves those files in a scenario folder.

Instead of selecting a suggestion, use the request below to name the solution and stop after assessment.
The solution path keeps the repository's other samples and tools outside this assessment.

```text
@Modernize Assess only shared-legacy-app\BookCatalog.sln for .NET 10 in Guided mode.
Show the assessment path and scenario folder.
Stop before planning or changing application code. Don't create Git commits.
```

The agent may ask permission to inspect Git information or run the assessment.
Approve those requests for this learner copy. Don't approve a commit or application upgrade during this step.

Visual Studio usually opens the report when the assessment finishes.
If it doesn't, open the generated report yourself.
The usual location is `.github\upgrades\<scenarioId>\assessment.md`.
The agent chooses `<scenarioId>`.
Use the directory it reports, not a directory you create yourself.
Ask for the full path if it's unclear which directory contains `.github`.

This is [an example assessment](../examples/assessments/bookcatalog/README.md) from a previous run.

Visual Studio may also open the **Upgrade Agent Dashboard**, a web page for tracking the modernization.
If it doesn't, tell Copilot `@Modernize open the web version of the dashboard`.
The dashboard looks like the example below.

![The recorded Upgrade Agent Dashboard shows BookCatalog's completed assessment and the next planning stage.](../examples/assessments/bookcatalog/images/ch1-2-dashboard-assessment.png)

[Open the full-size dashboard screenshot](../examples/assessments/bookcatalog/images/ch1-2-dashboard-assessment.png).

## Read the report in a useful order

<a id="separate-compatibility-from-priority"></a>
<a id="trace-a-finding-into-the-application"></a>
<a id="your-decision-can-this-finding-wait"></a>

The supplied BookCatalog assessment has these sections:

| Report section | What to check |
| --- | --- |
| **Executive Summary** | One web project, moving from `net48` (.NET Framework 4.8) to `net10.0` (.NET 10). These are target-framework names. |
| **Projects Compatibility** | The `BookCatalog.Web.csproj` row describes the older project-file format that needs conversion |
| **Top API Migration Challenges** | `System.Web` contains the old web APIs. Its MVC 5 APIs need ASP.NET Core replacements. |
| **Project Details** | File and API entries locate the affected code. Binding redirects choose which compiled library version .NET Framework loads. |

The sample assessment report lists **89 incompatible API findings** and **three binding redirect issues**.
_Those counts describe that run. Your results may differ._
The report calls a compiled library an **assembly**.
ASP.NET Core handles dependencies differently, so the old redirects aren't settings to copy into the upgraded app.

The report also lists zero packages in its aggregate table, but seven package issues in the project row.
Don't read that zero as proof that there are no package changes.
Open `shared-legacy-app\src\BookCatalog.Web\packages.config` to see the legacy package list.
Ask the agent to explain any mismatch before you approve its package choices.

<a id="what-the-numbers-do-not-prove"></a>
Issue counts aren't an estimate of upgrade time.
Read the affected code and proposed change, not only the severity icon.

<a id="add-a-preference-copilot-can-use"></a>
## Add a preference that the modernization agent will later use

<a id="tell-the-agent-what-must-survive"></a>
You don't need to edit the assessment report. But you can if you need to adjust its content.
Keep it unchanged if it describes the right app and target.
If you want to add a requirement, either edit the report or ask the agent to add it.

For example, open the generated `assessment.md` and add this at the bottom:

```text
## Application requirements

Keep the current book-list page and forms.
Upgrade the framework without redesigning the interface.
```

Save the file. Then send this in the same chat:

```text
@Modernize Read the Application requirements I added to assessment.md.
Use them when planning. Don't change application code or execute the upgrade yet.
```

To have the agent make the edit instead, send this request rather than editing the file yourself:

```text
@Modernize Add an Application requirements section to this scenario's assessment.md.
Add: Keep the current book-list page and forms. Don't redesign the interface.
Use it when planning. Don't change application code or execute the upgrade yet.
```

Check the saved `assessment.md` after either method.
If you made no changes, move directly to the next section.

![Read the assessment, check its findings, and add an application requirement only if needed.](../docs/illustrations/investigation-light.svg)

## Save the assessment for planning

Keep the generated report and scenario files in your learner copy of this repo.
They record the starting findings for the plan and for later discussions with your team or management.
If you changed the report, note the explanation of your change with it.

In Visual Studio, open **View > Git Changes**.
Expect to see assessment and scenario files. You shouldn't see any converted application files.
The next chapter starts from this assessment in the same GitHub Copilot modernization chat.

## If the assessment differs or fails

For a restore error, restore packages and rebuild `BookCatalog.sln`, then ask the agent to retry the assessment.
For the wrong application or target, correct those details in chat and regenerate the report before planning.

If chat loses the scenario, send:

```text
@Modernize Find the existing BookCatalog .NET 10 assessment in this learner copy.
Show its scenario folder and assessment.md path.
Don't create a second assessment or start the upgrade.
```

Use that scenario for the next chapter.

**[Next: Shape the upgrade plan](../05-planning/README.md)**

## Reference

- [Visual Studio upgrade walkthrough](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/how-to-upgrade-with-github-copilot?pivots=visualstudio)
- [Upgrade concepts and flow modes](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/concepts)
- [Previous BookCatalog sample run](../examples/assessments/bookcatalog/README.md)
