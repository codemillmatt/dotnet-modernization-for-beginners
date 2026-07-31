---
title: Prompt and file cheat sheet
parent: Reference
nav_order: 1
permalink: /reference/cheat-sheet/
---

# Prompt and file cheat sheet

One page. Everything you need while the agent is running.

## Starting the agent

| Goal | How |
|---|---|
| .NET version upgrade | Right-click the solution → **Modernize**, or `@Modernize` in Copilot Chat |
| Azure migration | Right-click the solution → **Migrate to Azure** |

## Prompts worth memorizing

```text
Upgrade my solution to .NET 10
```

```text
What scenarios are available for my solution?
```

```text
Continue to planning.
```

```text
Use an all-at-once strategy. It's one project, so sequence the work inside it:
package format first, then configuration, then System.Web.
```

```text
Split the ASP.NET MVC migration task into separate tasks for routing, filters, static
files, and views.
```

```text
This solution has no automated tests. Add a validation step to every task that builds the
solution, and for any task that touches controllers or views, add an explicit manual check
of the affected page.
```

```text
Start execution.
```

```text
Check my git changes and add diffs as examples to my instruction file
```

```text
Migrate my SQL Server connection to use managed identity.
```

```text
Move my application secrets to Azure Key Vault using managed identity.
```

## Changing modes mid-run

| Say | Effect |
|---|---|
| `pause` | Guided — the agent stops at every boundary and asks |
| `continue` | Automatic — the agent runs through without asking |

## State files: .NET version upgrade

Everything lives under `.github/upgrades/scenarios/{scenarioId}/`.

| File | What it is | Editable? |
|---|---|---|
| `scenario.json` | Which scenario ran, when, and against what target | ❌ Run metadata |
| `assessment.md` | The analysis of your solution | ✅ Add context the agent can't see |
| `assessment.json` | The same findings, structured | ❌ Read for tooling |
| `assessment.csv` | One row per incident: severity, story points, file, line, snippet | ❌ Read — sort it to build a work queue |
| `upgrade-options.md` | Your confirmed decisions | ✅ Override in chat |
| `plan.md` | The ordered task list | ✅ Reorder, split, add, remove, annotate |
| `scenario-instructions.md` | The agent's persistent memory | ✅ The main steering lever |
| `tasks.md` | Live progress dashboard | ❌ **Read-only — the agent overwrites edits** |
| `tasks/{taskId}/task.md` | One task's scope | ✅ Refine scope, add examples |
| `tasks/{taskId}/progress-details.md` | What the agent did and what it hit | Read this when debugging |

## State files: Azure migration

Everything lives under `.appmod/.migration/`.

| File | What it is |
|---|---|
| `plan.md` | The migration plan |
| `progress.md` | What ran, what succeeded, what needs you |

## The four sections of `scenario-instructions.md`

| Section | What goes there |
|---|---|
| User Preferences (Technical) | Libraries, patterns, framework choices |
| User Preferences (Execution Style) | Commit granularity, when to pause, what not to touch |
| Key Decisions Log | Decisions and why, dated |
| Custom Instructions per Task | Guidance scoped to one task |

## Where custom skills live

Most specific wins.

| Priority | Location | Scope |
|---|---|---|
| Highest | `.copilot/skills/` in your user profile folder | You, everywhere |
| ↓ | `.github/upgrades/skills/` | This scenario |
| ↓ | `.github/skills/` | This repository |
| Lowest | Built into the product | Everyone |

## Upgrade strategies

| Strategy | Order | Choose when |
|---|---|---|
| Bottom-up | Leaf dependencies first | The default. Each step compiles against upgraded code |
| Top-down | Entry point first | You want the app runnable early and tolerate stubs |
| All-at-once | Everything, then fix fallout | Small or too tangled to slice |

## Recovery moves, weakest to strongest

1. Narrow the scope in `tasks/{taskId}/task.md`, then retry the task
2. Fix one instance by hand, then `Check my git changes and add diffs as examples to my instruction file`
3. `git revert <commit-sha>` — one commit per task means one task undone

## Commands you'll run

```powershell
.\scripts\Test-Prerequisites.ps1
.\scripts\Reset-Course.ps1 -Checkpoint 03-modernized

git log --oneline
git diff --stat
git revert <commit-sha>

dotnet build .\BookCatalog.slnx --configuration Release
dotnet run --project .\src\BookCatalog.Web

az bicep build --file .\infra\main.bicep
az webapp log tail --name <app-name> --resource-group <rg-name>
az group exists --name <rg-name>
```

## Where to look when it's quiet

**View → Output → AppModernizationExtension** in Visual Studio. The chat pane summarizes;
the output window tells you what's actually happening.
