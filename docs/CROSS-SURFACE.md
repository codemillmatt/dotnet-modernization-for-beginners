---
title: Other surfaces - VS Code and CLI
parent: Reference
nav_order: 9
permalink: /reference/cross-surface/
---

# Visual Studio, VS Code, and the Copilot CLI

This course walks through Visual Studio on Windows. The workflow is the same everywhere
else — only the way you start the agent changes.

A **VS Code version of this course is coming soon.**
{: .note }

## Starting the agent

| Surface | .NET version upgrade | Azure migration |
|---|---|---|
| Visual Studio | Right-click the solution → **Modernize**, or `@Modernize` in Copilot Chat | Right-click the solution → **Migrate to Azure** |
| VS Code | The GitHub Copilot app modernization extension, from Copilot Chat | The same extension |
| Copilot CLI | Install the `upgrade-agent` plugin, then invoke the `upgrade` agent it provides | Not the primary surface |

The Copilot CLI requires a paid Copilot plan. Copilot Free covers the Visual Studio path
starting with Visual Studio 2026 version 18.1.
{: .warning }

## Everything else is identical

| Task | Visual Studio | VS Code | Copilot CLI |
|---|---|---|---|
| Choose Guided or Automatic | Say it in chat | Say it in chat | Say it in chat |
| Switch mode mid-run | `pause` / `continue` | `pause` / `continue` | `pause` / `continue` |
| Read artifacts | Solution Explorer and editor | Explorer and editor | Editor or terminal |
| Review diffs | Git Changes | Source Control | `git diff` |
| Run tests | Test Explorer or terminal | Testing view or terminal | Terminal |
| Watch progress | **Output → AppModernizationExtension** | Output channel | Terminal |

The state files are the same on every surface: `.github/upgrades/scenarios/{scenarioId}/` for the
version upgrade, `.appmod/.migration/` for Azure migration. So are the Git commits, the
tests, and the checkpoints in this repository.

Follow the artifacts and the validation criteria rather than the screenshots. UI labels
and approval prompts differ between surfaces and between versions.

## Installation

- [Visual Studio](https://learn.microsoft.com/dotnet/core/porting/github-copilot-app-modernization/install?pivots=visualstudio)
- [VS Code](https://learn.microsoft.com/dotnet/core/porting/github-copilot-app-modernization/install?pivots=vscode)
- [Copilot CLI](https://learn.microsoft.com/dotnet/core/porting/github-copilot-app-modernization/install?pivots=copilot-cli)
