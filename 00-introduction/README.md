# Chapter 00: Verify and predict

Start with BookCatalog, the same application you will carry through every chapter. This chapter establishes a reproducible baseline and asks you to predict the assessment before GitHub Copilot generates one.

## Learning outcomes

By the end of this chapter, you will:

- verify the supported Visual Studio, Copilot, SDK, web tooling, and LocalDB setup;
- explain which work belongs to GitHub Copilot upgrade and which belongs to GitHub Copilot modernization;
- predict BookCatalog findings from its source;
- compare those predictions with generated findings; and
- correct or question at least one unsupported agent conclusion.

**Learner artifact:** a setup record and prediction sheet.

## 1. Verify the course setup

Use the [official installation page](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/install?pivots=visualstudio) for changing product requirements. For this repository, verify:

- Windows;
- Visual Studio 2026 18.0+ for the .NET 10 target (Visual Studio 2022 17.14.17+ can host GitHub Copilot upgrade but cannot build a .NET 10 target);
- **.NET desktop development** and **ASP.NET and web development** workloads;
- **GitHub Copilot** and **GitHub Copilot app modernization** optional components;
- Visual Studio signed in to a GitHub account with Copilot Free or an eligible paid plan;
- .NET Framework 4.8 development assets;
- the current released .NET 10 SDK;
- SQL Server Express LocalDB; and
- Git.

Open `shared-legacy-app\BookCatalog.sln`, restore packages, and build. Then run the app and confirm the seeded Books page appears.

Complete this setup record:

| Evidence | Your result |
|---|---|
| Windows version | |
| Visual Studio version | |
| `dotnet --version` | |
| Git branch | |
| Legacy restore/build | |
| LocalDB-backed page loads | |
| Project **Modernize** action visible | |
| `@Modernize` responds in Copilot Chat | |

If the project does not load or build, stop here. The [baseline README](../shared-legacy-app/README.md) describes the expected stack and recovery path.

## 2. Understand the handoff

The Visual Studio **Modernize** entry point combines two related experiences:

| Experience | BookCatalog work |
|---|---|
| **GitHub Copilot upgrade** | Assess the classic project; convert it to SDK style; migrate ASP.NET MVC 5 to ASP.NET Core; update packages; optionally migrate EF6 to EF Core |
| **GitHub Copilot modernization** | Replace local/cloud-hostile dependencies; introduce Azure identity and secrets; generate/review infrastructure; deploy and diagnose |

Chapter 01 through Chapter 03 use upgrade. Chapter 04 continues with modernization for Azure. This separation matters when you review generated scope: an Azure deployment plan should not quietly redo the runtime upgrade, and an upgrade plan should not imply that LocalDB is deployable to App Service.

## 3. Inspect before asking AI

Read these files without changing them:

- `src\BookCatalog.Web\BookCatalog.Web.csproj`
- `src\BookCatalog.Web\Global.asax.cs`
- `src\BookCatalog.Web\App_Start\RouteConfig.cs`
- `src\BookCatalog.Web\App_Start\FilterConfig.cs`
- `src\BookCatalog.Web\Controllers\BooksController.cs`
- `src\BookCatalog.Web\Models\ApplicationDbContext.cs`
- `src\BookCatalog.Web\Models\Book.cs`
- `src\BookCatalog.Web\Web.config`
- the files under `src\BookCatalog.Web\Views`

Record predictions before opening Modernize:

| Surface | Evidence you found | Likely upgrade work | Behavior to protect |
|---|---|---|---|
| Project format and packages | | | |
| `System.Web` / MVC | | | |
| Startup, routing, and filters | | | |
| EF6 and LocalDB | | | |
| Configuration | | | |
| Razor views and static assets | | | |
| Validation and anti-forgery | | | |
| User-Agent display | | | |

Useful observations include the classic non-SDK project, `packages.config`, `Global.asax`, MVC routing and filters, one CRUD controller, EF6 initialization and seed data, data annotations, anti-forgery attributes, seven Razor views, LocalDB in `Web.config`, and the `System.Web` User-Agent access.

## 4. Start the assessment in Guided mode

1. Right-click the `BookCatalog.Web` **project** and choose **Modernize**.
2. Choose the option to upgrade to a newer .NET version.
3. When asked for settings, enter:

   > Target .NET 10. Switch to Guided mode. Assess only, make no application changes, and pause when the assessment is ready for review.

4. Verify the displayed settings say **Guided** before approving the assessment.

> **Guided-mode guardrail:** This course uses Guided mode because every generated artifact is a review gate. Product UI and wording can change. If the current mode is not clear, tell the agent **"Pause"** or **"Switch to guided mode."** Do not use **"Continue"** or **"Go ahead"** as a generic next-step prompt; current guidance treats those phrases as a request for Automatic mode. The next expected review point is the generated assessment.

The agent may ask to inspect the repository or read scenario instructions. Review the requested command or file access, then approve only what is needed for assessment.

## 5. Compare evidence, not counts

Generated AI output is not deterministic. The recorded screenshot below shows one run, not a required count:

![Recorded assessment report for BookCatalog showing project, package, and API findings](../01-assessment/images/assessment-report.png)

For each prediction, find the corresponding generated result and complete:

| Prediction | Agent result | Supporting BookCatalog file | Agree, correct, or clarify? |
|---|---|---|---|
| | | | |
| | | | |
| | | | |

At least one row must challenge the output. Examples:

- a count differs because the product version groups incidents differently;
- a package recommendation is mechanically possible but changes too much at once;
- a reported compatibility category does not establish business severity;
- an effort estimate omits tests, deployment constraints, or review time; or
- a finding overlooks the active-only ordering, `CreatedDate` preservation, anti-forgery, seed data, or User-Agent behavior.

Do not change a valid compatibility classification merely because a feature is low priority. Compatibility type, remediation severity, and course priority are different dimensions and are developed in Chapter 01.

## Review gate

Before continuing:

- [ ] Setup evidence is complete.
- [ ] Predictions were written before assessment.
- [ ] Every major finding has a BookCatalog file reference.
- [ ] At least one agent result is corrected or explicitly questioned.
- [ ] The assessment is paused in Guided mode.
- [ ] Generated state under `.github/upgrades/` is committed on your branch.

## Transfer exercise

How would setup and assessment change if this solution had 20 dependent projects, Windows Authentication, and a public API that could not change? Add three risks to your prediction sheet; do not add another sample application.

## References

- [GitHub Copilot upgrade overview](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/overview)
- [Upgrade concepts](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/concepts)
- [How to upgrade with GitHub Copilot](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/how-to-upgrade-with-github-copilot)
- [ASP.NET Framework to ASP.NET Core migration](https://learn.microsoft.com/aspnet/core/migration/fx-to-core/start?view=aspnetcore-10.0)

**[Continue to Chapter 01: Assessment](../01-assessment/README.md)**
