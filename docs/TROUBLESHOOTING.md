---
title: Troubleshooting
parent: Reference
nav_order: 2
permalink: /reference/troubleshooting/
---

# Troubleshooting

Real failure modes, in the order you're likely to hit them.

## Setup

### "Modernize" isn't in the right-click menu

Open the Visual Studio Installer, click **Modify**, and check the **Individual components**
tab for both **GitHub Copilot** and **GitHub Copilot app modernization**. Both are
required. Restart Visual Studio after installing.

### The agent says it needs a Git repository

It does. It creates branches and commits, and those are your only clean undo. Run
`git init`, commit a baseline, and start again.

### Copilot says you don't have access

Copilot Free works for modernization starting with Visual Studio 2026 version 18.1. On
earlier versions you need Pro, Pro+, Business, or Enterprise. The Copilot CLI surface
requires a paid plan regardless of version.

### NuGet restore fails

Almost always a private feed. Authenticate before you start the agent — a restore failure
during assessment shows up as an apparent compatibility problem, and you'll waste time
chasing the wrong thing.

## Assessment

### The report is enormous

Read the Top API Migration Challenges section and the project relationship graph first.
Skip the exhaustive package table on a first pass; you'll come back to it during planning.

### It flags a package you know works

The agent is reasoning about the target framework, not about your usage. Add a note to
`assessment.md` explaining what you know and why, then ask it to reread the file.

### It found nothing interesting

Confirm you pointed it at the solution rather than a single project, and that the solution
actually loads.

### Assessment takes forever

Large solutions take minutes, not seconds. Watch **View → Output →
AppModernizationExtension** — the chat pane goes quiet while work continues.

## Planning

### Your edits to `tasks.md` disappeared

Expected. `tasks.md` is a read-only dashboard that the agent's own tools rewrite. Put your
changes in `plan.md`, `tasks/{taskId}/task.md`, or `scenario-instructions.md`.

### The plan regenerated and lost your changes

Edits to `plan.md` are specific to that plan. Preferences that must survive regeneration
belong in `scenario-instructions.md`, which is loaded on every interaction.

### The plan has one giant task

Ask it to split. A task big enough to fail halfway is a task you can't attribute a failure
to:

```text
Split the ASP.NET MVC migration task into separate tasks for routing, filters, static
files, and views.
```

### You can't find `plan.md`

Look in `.github/upgrades/`. The scenario folder is named for the scenario the agent
selected, and the name is not the same in every run.

## Execution

### A task loops on the same error

Stop it. Open `tasks/{taskId}/progress-details.md` — it records what the agent tried and
what came back. Then narrow `task.md` and retry, or revert and re-scope.

### The agent edited files outside the task's scope

Say so immediately, and write the boundary into `task.md`. If it keeps happening, promote
the rule to `scenario-instructions.md`:

```markdown
- Do not modify anything under tests/ without telling me first.
```

### Tests that used to pass now fail

Don't let the agent "fix" the test. Read the failure. If behavior genuinely changed, revert
the task and re-scope it. A test edited to match new behavior has destroyed the only
evidence you had.

### Custom MSBuild targets confuse it

Expect this. Explain what the targets do in `scenario-instructions.md`. Custom build logic
is the single most common source of tasks that can't reach a green build.

### You've lost track of what changed

`git log --oneline`. One commit per task is why you configured it that way.

### The scenario folder got deleted

The agent's state is gone; your code and commits are not. Start a new scenario. If you
committed `.github/upgrades/` as you went — and you should — restore it from history.

## Azure migration

### "Migrate to Azure" isn't in the menu

Same component check as the upgrade agent. The app modernization component provides both.

### The assessment finds nothing

Confirm you're pointed at the upgraded solution rather than the .NET Framework version.

### You went looking for `scenario-instructions.md` and it isn't there

Different agent, different state. Azure migration keeps its state in `.appmod/.migration/`
with `plan.md` and `progress.md`.

### A predefined task says there's nothing to migrate

The catalog covers ten specific patterns. If your app has no message queue, the Service Bus
task has nothing to do. That's a correct answer, not a failure.

## Deployment

### Bicep won't compile

```powershell
az bicep build --file .\infra\main.bicep
```

Fix it locally. Failing before deployment costs nothing.

### Deployment fails on a name conflict

SQL server and Key Vault names are globally unique across Azure. Change the prefix in
`main.bicepparam`.

### The deployed app returns 500

```powershell
az webapp log tail --name <app-name> --resource-group <rg-name>
```

Nine times out of ten the database grant step hasn't run. Creating a managed identity does
not by itself give it a database user.

### Login failed for the managed identity

Re-run the grant script and confirm it targeted the right database. Then confirm the role
assignment in the Bicep actually deployed.

### You can't delete the resource group

Check for resource locks, then delete from the portal.

## Scale

| Situation | What helps |
|---|---|
| 50+ projects | Assess the whole solution, plan and execute one subsystem at a time |
| Shared libraries across solutions | Upgrade and publish the shared library first, bottom-up |
| No tests at all | Add characterization tests to what you're about to change, first. See [proving behavior didn't change](VALIDATION.md) |
| Mixed target frameworks | Expect multiple scenarios, not one |

## Still stuck

- Agent bugs: [dotnet/modernize-dotnet](https://github.com/dotnet/modernize-dotnet)
- Course problems: [open an issue](https://github.com/codemillmatt/dotnet-modernization-for-beginners/issues)
- Product documentation: [GitHub Copilot modernization](https://learn.microsoft.com/dotnet/core/porting/github-copilot-app-modernization/overview)
