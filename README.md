# .NET Modernization for Beginners

Use GitHub Copilot in Visual Studio to upgrade a legacy .NET app, then plan its move to Azure.

Throughout this course we'll use a sample app named BookCatalog that lets a catalog editor add, inspect, edit, and remove books. Its main list hides inactive books and sorts active books by title.

You'll use the GitHub Copilot modernization for .NET tooling to upgrade the application from .NET Framework 4.8 to .NET 10. You'll then assess and plan its move to Azure.

You'll direct the modernization agent through **assess, decide, plan, change, and verify**. You'll finish with a working application on .NET 10 and generated artifacts that capture the plans and decisions behind it.

This course assumes C#, basic ASP.NET MVC, Visual Studio, NuGet, and basic Git knowledge. You don't need previous modernization experience.

[**Start: meet BookCatalog and the tools**](00-introduction/README.md) · [Go straight to Setup](prerequisites/README.md) · [Run the completed reference](examples/modernized/README.md)

<a id="-what-youll-learn"></a>
## What you'll learn

By the end of the course, you should be able to:

- Start the modernization workflow in Visual Studio and read its assessment.
- Review the assessment and add an application requirement if needed.
- Review upgrade choices and change a practical instruction in the plan.
- Run the upgrade and review the generated project, startup, and controller changes.
- Launch your upgraded app and try its book forms.
- Assess Azure readiness and edit a migration plan without creating resources.

**You don't need an Azure subscription to complete the course.**

<a id="-prerequisites"></a>
## Prerequisites

Use **Windows, Visual Studio 2026, and PowerShell**. The legacy app needs ASP.NET web build tools, .NET Framework 4.8 targeting tools, IIS Express, and SQL Server LocalDB.

You also need a stable .NET SDK 10 or later, the .NET 10 runtime, Git, and a GitHub account with Copilot access.

[Setup](prerequisites/README.md#check-before-installing) explains how to check existing tools before installing anything. Azure CLI, Node, and Python aren't prerequisites for the required lessons.

## Which Copilot tool are we using?

**GitHub Copilot upgrade** handles the framework upgrade. In Visual Studio, start through **Modernize** or `@Modernize`.

**GitHub Copilot modernization** handles Azure migration. Chapter 07 uses Visual Studio's **Modernize > Migrate to Azure** workflow.

The modernization agent generates the reports and changes through Copilot Chat.
You choose the options, adjust its instructions, and try the result.

<a id="-course-structure"></a>
## Course structure

![A travel-poster route through the seven course chapters, from the starting point to the Azure migration plan.](docs/illustrations/journey-light.svg)

| Chapter | What you do | Result |
| --- | --- | --- |
| [01: Start here](README.md) | Understand BookCatalog and the course | A clear starting point |
| [02: Meet the app and tools](00-introduction/README.md) | Meet BookCatalog and the tools | Know what you're building |
| [03: Get ready](prerequisites/README.md) | Check your tools and try the app | Working learner copy and Copilot access |
| [04: Assess the app](01-assessment/README.md) | Read the report and add a requirement if needed | An assessment you've reviewed |
| [05: Choose the plan](02-planning/README.md) | Review options and edit a plan instruction | A plan ready for execution |
| [06: Upgrade and check](03-upgrade-execution/README.md) | Run the upgrade and use the changed app | Your working .NET 10 application |
| [07: Plan for Azure](04-cloud/README.md) | Review the Azure report and edit a migration plan | A cloud plan, without deployed resources |

The seven chapters take you from the starting point through the Azure migration plan.

## Work on your own copy

[Setup](prerequisites/README.md#make-your-learner-copy) covers cloning and opening your learner workspace. BookCatalog is the continuing project.

Use the supplied demo data. EF Core rebuilds the upgraded database schema and seeds the catalog.
Existing books don't need to survive the upgrade. You don't need backups, snapshots, or a data-transfer step for this course.

Tool output varies by version and application. Compare the report's meaning and your app's behavior, not screenshot counts.

## Samples and help

- [Legacy sample quickstart](shared-legacy-app/README.md)
- [Completed reference and intentional differences](examples/modernized/README.md)
- [BookCatalog recording and examples](examples/assessments/bookcatalog/README.md)
- [Historical console assessment](examples/assessments/README.md)
- [Instructor companion](docs/instructor-guide.md)
- [GitHub Copilot upgrade documentation](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/overview)
- [GitHub Copilot modernization for Azure](https://learn.microsoft.com/dotnet/azure/migration/appmod/overview)
- [Report a course issue](https://github.com/microsoft/dotnet-modernization-for-beginners/issues)

## Contributing

Edit chapter READMEs, not generated website content. See [writing guidance](docs/writing.md), [maintainer validation](docs/validation.md), and [website preview instructions](webpage/README.md).

Historical notes under `docs/history/` are not learner instructions. A local preview does not publish the course.

## License

MIT. See [LICENSE](LICENSE). Third-party font and tool licenses remain with their respective assets.
