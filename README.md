[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# .NET Modernization for Beginners

Modernize the committed BookCatalog application from ASP.NET MVC 5 on .NET Framework 4.8 to ASP.NET Core on .NET 10, then prepare and deploy it to Azure with GitHub Copilot.

This is an applied course, not a transcription of the product documentation. Microsoft Learn is the reference manual; these chapters teach you how to challenge generated findings, edit an upgrade plan, review code and infrastructure, verify behavior, and recover safely when AI output or Azure conditions differ.

**Course context:** Windows + Visual Studio | .NET Framework 4.8 to released .NET 10 LTS | content reviewed August 2026

## What you will produce

| Chapter | BookCatalog activity | Learner-owned artifact |
|---|---|---|
| [00 - Introduction](00-introduction/README.md) | Verify the toolchain, inspect the legacy app, and predict findings | Setup evidence and prediction sheet |
| [01 - Assessment](01-assessment/README.md) | Run GitHub Copilot upgrade and challenge its evidence | Annotated assessment and behavior-risk list |
| [02 - Planning](02-planning/README.md) | Choose a strategy before reviewing the generated plan | Strategy decision record and edited plan |
| [03 - Upgrade execution](03-upgrade-execution/README.md) | Execute in Guided mode and review every meaningful diff | Code-review checklist and behavior results |
| [04 - Azure deployment](04-cloud/README.md) | Use GitHub Copilot modernization for Azure readiness and deployment | Architecture review, permission map, what-if review, and cleanup evidence |

The application in [`shared-legacy-app`](shared-legacy-app/README.md) is the course baseline. Chapters modify it sequentially; there are no prebuilt midway checkpoints because generating and reviewing that state is part of the exercise.

## Course-specific prerequisites

The [official Visual Studio installation guide](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/install?pivots=visualstudio) is the source of truth. In **Visual Studio Installer**, verify this BookCatalog-specific checklist:

| Requirement | Course expectation |
|---|---|
| Operating system | Windows; this course uses the Visual Studio path and a .NET Framework application |
| Visual Studio | GitHub Copilot upgrade can run in Visual Studio 2026 or Visual Studio 2022 17.14.17+; use **Visual Studio 2026 18.0+** for this end-to-end .NET 10 course |
| Workloads | **.NET desktop development** and **ASP.NET and web development** |
| Optional components | **GitHub Copilot** and **GitHub Copilot app modernization** |
| GitHub access | Sign in to Visual Studio with a GitHub account that has Copilot Free or an eligible paid Copilot plan |
| Legacy build assets | .NET Framework 4.8 SDK/targeting pack and ASP.NET web project tooling |
| Target SDK | Current released .NET 10 SDK; `shared-legacy-app/global.json` selects .NET 10 and permits a newer .NET 10 feature band |
| Local database | SQL Server Express LocalDB, available through Visual Studio Installer |
| Source control | Git |
| Azure chapter only | Azure subscription, Azure CLI, Bicep CLI, and permission to create both resources and role assignments |

> **Why Windows?** The source is a classic ASP.NET Web Application Project targeting .NET Framework 4.8. Other GitHub Copilot surfaces are outside this course path and do not remove the Windows requirement for building this baseline.

## Verify setup before Chapter 00

1. Clone the repository and create a branch:

   ```pwsh
   git clone https://github.com/microsoft/dotnet-modernization-for-beginners.git
   cd dotnet-modernization-for-beginners
   git switch -c bookcatalog-modernization
   ```

2. Open `shared-legacy-app\BookCatalog.sln`.
3. Confirm `BookCatalog.Web` loads without an unavailable-project warning.
4. Restore NuGet packages and build the unchanged solution.
5. Run it once and confirm the seeded Books page appears.
6. Right-click the `BookCatalog.Web` project and confirm **Modernize** is available.
7. Open Copilot Chat, enter `@Modernize`, and confirm that the participant responds.

Do not start the assessment until all seven checks pass. Record the Visual Studio version, .NET SDK version, branch name, build result, and Modernize checks in your Chapter 00 notes.

## Know which product is acting

| Product | Responsibility in this course |
|---|---|
| **GitHub Copilot upgrade** | Assesses and upgrades .NET projects: SDK-style conversion, package changes, .NET Framework to modern .NET, ASP.NET migration, and EF6-to-EF Core work |
| **GitHub Copilot modernization** | Handles Azure-readiness and migration scenarios involving identity, databases, secrets, telemetry, infrastructure, and deployment |
| **Visual Studio Modernize** | The entry point that exposes the combined experience and delegates the runtime upgrade to GitHub Copilot upgrade |

The chapters use **Modernize** for the Visual Studio entry point, then name the underlying upgrade or Azure-modernization responsibility when the distinction matters.

## Working rules

- Stay in **Guided mode**. At every pause, review the artifact or diff before asking for the next task.
- Commit generated state under `.github/upgrades/` at chapter review gates. It is intentionally absent from the starter branch.
- Treat generated counts, filenames, task boundaries, text, and Bicep layout as variable. Compare semantic outcomes, not screenshots.
- Use [`shared-legacy-app/BEHAVIOR-CONTRACT.md`](shared-legacy-app/BEHAVIOR-CONTRACT.md) before and after the upgrade.
- Do not upgrade old packages merely to make the baseline look current. Their age is intentional assessment input.
- Never accept a generated change only because the agent marked its task complete.

## Reset or recovery

- **Resume:** reopen the solution, choose **Modernize** from the `BookCatalog.Web` project, and ask the agent to resume from the committed `.github/upgrades/` state.
- **Undo one task:** revert the commit created at that task's review gate.
- **Restart:** create a fresh branch from the repository's default branch.
- **Recover from an unexpected agent result:** stop, save the generated artifact, compare it with the chapter's semantic criteria, and amend the plan before execution.

See the [baseline recovery details](shared-legacy-app/README.md#reset-or-recover).

## Version and lifecycle context

.NET 10 is released and is the LTS target for this course. Current policy supports LTS releases for three years and STS releases for two years. .NET Framework 4.8 remains serviced according to the lifecycle of its parent Windows operating system; modernization value here is newer platform capability, maintainability, performance, ecosystem compatibility, cloud readiness, and engineering velocity, not a claim that .NET Framework patches have simply disappeared.

Use the current [.NET release and support policy](https://learn.microsoft.com/dotnet/core/releases-and-support) and [.NET Framework lifecycle FAQ](https://learn.microsoft.com/lifecycle/faq/dotnet-framework) when applying this course to another application.

## Output varies by product version

The screenshots show one recorded course run. Your incident counts, wording, task decomposition, file lengths, infrastructure layout, Azure availability, and failure path may differ. Success means that BookCatalog's required behavior, hosting, database, identity, configuration, monitoring, role assignments, and cleanup are reviewed and verified.

## Reference documentation

- [Install GitHub Copilot upgrade in Visual Studio](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/install?pivots=visualstudio)
- [GitHub Copilot upgrade overview](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/overview)
- [Work with the upgrade agent](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/working-with-agent)
- [GitHub Copilot modernization for Azure overview](https://learn.microsoft.com/dotnet/azure/migration/appmod/overview)
- [.NET 10 overview](https://learn.microsoft.com/dotnet/core/whats-new/dotnet-10/overview)

**[Start Chapter 00](00-introduction/README.md)**

## License

MIT. See [LICENSE](LICENSE).
