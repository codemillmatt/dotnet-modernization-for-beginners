---
title: "00 · Set up and first run"
nav_order: 2
permalink: /setup/
---

# 00 · Set up and first run

By the end of this chapter you'll have run GitHub Copilot modernization against a real
ASP.NET MVC 5 application and read the assessment it produced.

**Time: ~30 minutes** · **You need:** Visual Studio on Windows, a GitHub account with
Copilot access

## What you'll do

- Confirm your machine has what the agent needs
- Get the legacy app building with green tests
- Start the agent and ask it to upgrade to .NET 10
- Stop at the end of assessment and read the report

## Before you start

### Check your setup

| You need | Version | How to check |
|---|---|---|
| Windows | Any release your Visual Studio supports | `winver` |
| Visual Studio | 2026, or 2022 version 17.14.17 or later | **Help → About Microsoft Visual Studio** |
| Workload | .NET desktop development | Visual Studio Installer → **Modify** |
| Components | GitHub Copilot **and** GitHub Copilot app modernization | Right-click any project — **Modernize** should appear |
| Copilot subscription | Free works in VS 2026 18.1+; otherwise Pro, Pro+, Business, or Enterprise | The signed-in account in Visual Studio |
| Legacy build | .NET Framework 4.8 Developer Pack, IIS Express, SQL Server Express LocalDB | `msbuild -version`, `sqllocaldb info` |
| Modern target | .NET 10 SDK | `dotnet --list-sdks` |
| Git | Any current version | `git --version` |

Full details, including the Azure requirements you'll need later, are in
[what you need to run this](../docs/ENVIRONMENT.md).

Run the preflight script from the repository root:

```powershell
.\scripts\Test-Prerequisites.ps1
```

The agent needs a local Git repository. Without one it can't create branches or commits,
which are your undo button for everything that follows.
{: .warning }

### Get a green baseline

Copy the legacy app into a working folder and prove it builds and passes its tests:

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint legacy-baseline
Set-Location .\work
nuget restore .\BookCatalog.sln
msbuild .\BookCatalog.sln /p:Configuration=Release
dotnet test .\tests\BookCatalog.CharacterizationTests\BookCatalog.CharacterizationTests.csproj --configuration Release
```

You should see **9 passing tests**.

This matters more than it looks. Microsoft's guidance is blunt about it: verify your
solution builds and its tests pass before you start. If the solution is already broken,
the agent can't tell your pre-existing failures apart from problems it introduced — and
neither can you.

Those 9 tests are **characterization tests**. They record what the app does today so you
can prove it still does the same thing tomorrow. The agent runs whatever tests you already
have, but it will not write them for you. Bringing tests is your job. There's more on this
in [proving behavior didn't change](../docs/VALIDATION.md).

### Meet the app

`BookCatalog` is small but realistic:

- `BookCatalog.Core` — a .NET Framework 4.8 class library holding the model
- `BookCatalog.Web` — ASP.NET MVC 5, Entity Framework 6, `System.Web`, LocalDB
- `BookCatalog.CharacterizationTests` — the 9 tests

Three projects with real dependencies between them is the point. It gives the agent an
ordering problem to solve, which is exactly what you'll review in Chapter 02.

## Steps

### 1. Open the solution and start the agent

Open `work\BookCatalog.sln` in Visual Studio.

Right-click the solution in Solution Explorer and choose **Modernize**. You can also open
GitHub Copilot Chat and type `@Modernize`.

![Placeholder for a screenshot of the Visual Studio Solution Explorer context menu with Modernize highlighted](../assets/img/placeholder.png)

### 2. Tell it what you want

```text
Upgrade my solution to .NET 10
```

### 3. Answer the setup questions

Before analyzing anything, the agent collects a few decisions. This step is
**pre-initialization**:

- **Target framework** — .NET 10
- **Branch strategy** — let it create a branch, and let it commit after each task
- **Flow mode** — choose **Guided**

Pick **Guided**. It stops at each stage boundary and asks before continuing, which
Microsoft recommends for first-time users and for anyone who wants to learn the process.
That's you, right now.

The alternative, **Automatic**, runs straight through without pausing. You can switch
between them at any point by typing `pause` or `continue`.

### 4. Let assessment run, then stop

The agent analyzes your project dependency graph, NuGet package compatibility, breaking
API changes, and test coverage.

When it finishes it pauses and asks whether to continue — something like *"Here's what I
found. Shall I proceed with upgrade options?"*

**Say no.** Don't continue into planning yet. That's Chapter 02.

![Placeholder for a screenshot of Copilot Chat pausing at the end of assessment](../assets/img/placeholder.png)

### 5. Find and read the report

The agent wrote its state into your repository. Look for:

```text
.github/upgrades/{scenarioId}/assessment.md
```

`{scenarioId}` is a folder named after the scenario the agent selected. Open
`.github/upgrades/` and see what it actually created — you'll use that real path for the
rest of the course.
{: .note }

Open `assessment.md` and read it. Don't act on it yet. You're looking for shape: what
sections exist, what it found, what it thinks is hard.

If your machine is slow or your solution is large, this can take several minutes. Watch
progress in **View → Output → AppModernizationExtension**.

## What just happened

You ran the first of three stages.

Diagram: assessment reads your code and writes findings, but changes no source.

```mermaid
flowchart LR
    S["Your source code"] --> A["Assessment"]
    A --> R["assessment.md"]
    A --> O["upgrade-options.md"]
```

**Assessment reads. It does not write code.** That separation is the entire reason the
stages exist. You get a complete picture of what the upgrade involves *before* a single
line of your application changes — which makes right now the cheapest possible moment to
disagree with the agent.

Everything the agent knows lives under `.github/upgrades/{scenarioId}/`. Those files are
ordinary Markdown, they sit in your repository, and you can edit them. That's how you
steer this thing, and it's what the next four chapters are about.

Commit that folder along with your branch. It's the agent's memory and your audit trail.
{: .tip }

## Try changing it

Ask the agent about its own reasoning:

```text
What scenarios are available for my solution?
```

The agent matches your code against dozens of built-in scenarios and ranks them. Seeing
what it *didn't* pick tells you as much as seeing what it did.

## If something goes wrong

| Problem | What to do |
|---|---|
| **Modernize** isn't on the right-click menu | Visual Studio Installer → **Modify** → confirm both **GitHub Copilot** and **GitHub Copilot app modernization** components are checked |
| Tests fail before you start | Stop and fix the baseline. The agent can't distinguish your failures from its own |
| NuGet restore fails | If you use a private feed, authenticate before starting the agent |
| The agent can't create a branch | Confirm you're inside a Git repository with a clean working tree |

More failure modes are in [troubleshooting](../docs/TROUBLESHOOTING.md).

## Check yourself

1. Why does the agent need passing tests *before* it starts?
2. What did assessment change in your application source code?

---

Next → [Chapter 01: Assessment](../01-assessment/README.md)
