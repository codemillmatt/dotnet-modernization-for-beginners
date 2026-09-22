<a id="chapter-00-get-ready-to-modernize"></a>
# Chapter 00: Meet BookCatalog and the tools

BookCatalog is a small .NET Framework app for keeping track of books. A catalog editor can add a book, edit its details, and browse the catalog.

It works. The page even recommends Internet Explorer 6.

![The running BookCatalog app lists six active books, with links to view, edit, or add a book.](../examples/assessments/bookcatalog/images/legacy-preview.png)

You'll use the modernization agent through GitHub Copilot in Visual Studio to upgrade this app to .NET 10.
Then you'll use the Azure modernization workflow to plan its move to Azure.

We supply the application so you can focus on the tools. It has one web project, an MVC controller, Razor views, and an EF6 database context.

## What the agent does

![The tool workflow moves from assessment to an edited plan, an upgrade, and running the application.](../docs/illustrations/workflow-light.svg)

**GitHub Copilot upgrade** provides the framework-upgrade workflow.
You send requests in Copilot Chat. The modernization agent writes the assessment and plan, then changes the application after your approval.

You can edit the generated Markdown files or ask the agent to update them.
You can also keep an assessment unchanged when its findings are correct.

The destination is **ASP.NET Core MVC, EF Core, and .NET 10**. You'll review the changes and run your upgraded app in Visual Studio.

**GitHub Copilot modernization** also provides the later **Migrate to Azure** workflow. You'll finish with an Azure assessment and migration plan. Deployment is optional.

## What carries forward

You'll work on one learner copy of BookCatalog through the course. Each lesson uses the previous lesson's application or generated artifacts.

This is a demo, not a data-migration exercise.
EF Core will create the upgraded database schema and seed books. Existing records don't need to survive the upgrade.

The [learner record](../docs/learner-record.md) is optional if you want a place for notes.

## Before moving on

Next, check your tools and try BookCatalog before asking the modernization agent to upgrade it.

**[Next: get ready in Setup](../prerequisites/README.md)** · **[Already set up? Run BookCatalog](../prerequisites/README.md#run-bookcatalog)**

<details>
<summary>Earlier setup and exercise links</summary>

<a id="check-before-installing"></a>
<a id="run-the-original-app"></a>
<a id="save-a-baseline"></a>
Setup has moved to [Get ready](../prerequisites/README.md). It includes tool checks, your learner copy, and the app tour.

<a id="choose-the-records-that-must-survive"></a>
Record selection is now part of the [optional data-transfer lab](../docs/data-transfer.md).

<a id="check-behavior-with-a-separate-record"></a>
<a id="checkpoint-can-you-explain-the-starting-state"></a>
<a id="checkpoint-what-would-a-build-miss"></a>
Detailed server and stored-value checks are in [optional advanced checks](../docs/advanced-checks.md).

<a id="-your-first-assessment"></a>
<a id="optional-your-first-assessment"></a>
The [historical console example](../examples/assessments/README.md) remains an optional comparison. BookCatalog is the continuing course project.

</details>
